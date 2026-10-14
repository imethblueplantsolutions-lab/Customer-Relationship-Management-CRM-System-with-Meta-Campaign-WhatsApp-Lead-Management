# 🛡️ PostgreSQL Row-Level Security (RLS) Architecture (RLS-POLICIES.md)

![Security](https://img.shields.io/badge/Security-Row--Level_Security-success?style=for-the-badge&logo=shield)
![Platform](https://img.shields.io/badge/Platform-Railway_PostgreSQL-0B0D0E?style=for-the-badge&logo=railway)
![Enforcement](https://img.shields.io/badge/Mode-FORCE_ROW_LEVEL_SECURITY-red?style=for-the-badge)

---

## 1. Executive Summary & The Railway Dilemma

In a multi-tenant CRM, strict tenant data segregation is non-negotiable. While application-level ORM filters (`where: { tenantId }`) provide first-line filtering, relying solely on code introduces catastrophic risks of developer oversight or SQL injection.

To achieve defense-in-depth, this repository enforces **PostgreSQL Row-Level Security (RLS)** directly at the database engine level.

### ⚠️ The Critical Railway PostgreSQL Nuance
On Railway, the provisioned database credentials connect using the default **`postgres` superuser/table owner** account.
In standard PostgreSQL:
> *"Table owners and superusers automatically BYPASS Row-Level Security policies even when `ENABLE ROW LEVEL SECURITY` is active on a table."*

If only `ENABLE ROW LEVEL SECURITY` is executed, Railway connections will bypass all tenant isolation filters!
To solve this, our migration explicitly executes:
```sql
ALTER TABLE "TableName" FORCE ROW LEVEL SECURITY;
```
`FORCE ROW LEVEL SECURITY` mandates that **even table owners and superusers** are bound by RLS policies during query execution.

---

## 2. Session Context Injection (`app.current_tenant_id`)

PostgreSQL RLS policies evaluate the active tenant using a transaction-local session variable:
```sql
current_setting('app.current_tenant_id', true)
```

The second argument (`true`) instructs PostgreSQL to return `NULL` instead of throwing an exception if the parameter has not been initialized.

### How Prisma Injects Tenant Context
In the backend middleware (`crm_imeth/src/middlewares/auth.js` / Prisma extension), queries are wrapped in an interactive transaction:

```javascript
await prisma.$transaction(async (tx) => {
  // Set the tenant ID for the duration of this database session/transaction
  await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${req.user.tenantId}';`);

  // Any subsequent query within this transaction is strictly confined to req.user.tenantId
  const leads = await tx.lead.findMany();
  return leads;
});
```

---

## 3. Exhaustive Policy Catalog

### 3.1. Direct Tenant Tables

#### 1. `Lead` Table
```sql
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_lead ON "Lead"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);
```
- **Scope**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- **Behavior**: An agent or user can only read or mutate leads belonging to their active `app.current_tenant_id`.

#### 2. `User` Table
```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_user ON "User"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);
```
- **Scope**: User listings, team assignments, and profile queries.
- **Behavior**: Prevents user enumerations across organizations.

#### 3. `Deal` Table
```sql
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deal" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_deal ON "Deal"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);
```
- **Scope**: Sales opportunities and revenue forecasts.

#### 4. `Pipeline` Table
```sql
ALTER TABLE "Pipeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pipeline" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_pipeline ON "Pipeline"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);
```
- **Scope**: Kanban sales funnel configuration.

---

### 3.2. Child & Relation-Derived Tables (Indirect Tenant Isolation)

Entities without a direct `tenantId` column inherit isolation via sub-query `EXISTS` checks referencing their parent entities.

#### 5. `Activity` Table (Child of `Lead`)
```sql
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_activity ON "Activity"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Lead"
      WHERE "Lead".id = "Activity"."leadId"
        AND "Lead"."tenantId" = current_setting('app.current_tenant_id', true)::text
    )
  );
```

#### 6. `Followup` Table (Child of `Lead`)
```sql
ALTER TABLE "Followup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Followup" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_followup ON "Followup"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Lead"
      WHERE "Lead".id = "Followup"."leadId"
        AND "Lead"."tenantId" = current_setting('app.current_tenant_id', true)::text
    )
  );
```

#### 7. `Attachment` Table (Child of `Lead` or `User`)
```sql
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_attachment ON "Attachment"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Lead"
      WHERE "Lead".id = "Attachment"."leadId"
        AND "Lead"."tenantId" = current_setting('app.current_tenant_id', true)::text
    )
    OR
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = "Attachment"."createdById"
        AND "User"."tenantId" = current_setting('app.current_tenant_id', true)::text
    )
  );
```

---

## 4. Security Verification Queries

To test and verify RLS enforcement on Railway or locally:

### Test 1: Query Without Tenant Context (Should return 0 rows)
```sql
-- In a clean session without setting app.current_tenant_id
SELECT COUNT(*) FROM "Lead";
-- Result: 0 (Access denied by RLS policy)
```

### Test 2: Query With Tenant Context
```sql
BEGIN;
SET LOCAL app.current_tenant_id = '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e';
SELECT id, "phoneNumber", "name", "tenantId" FROM "Lead";
COMMIT;
-- Result: Returns only leads belonging strictly to this tenant.
```

### Test 3: Cross-Tenant Data Tampering Prevention
```sql
BEGIN;
SET LOCAL app.current_tenant_id = '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e';
-- Attempting to update a lead owned by a different tenant:
UPDATE "Lead" 
SET "name" = 'Hacked Lead' 
WHERE "id" = '34637030-3187-4e0a-97f1-de93a24391d0';
COMMIT;
-- Result: UPDATE 0 (Silent rejection; no rows matching tenant policy).
```
