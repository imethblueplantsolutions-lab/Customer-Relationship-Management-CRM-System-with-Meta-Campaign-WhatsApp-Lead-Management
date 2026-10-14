# 🔄 Database Migrations & Version Control (MIGRATIONS.md)

![Prisma Migrate](https://img.shields.io/badge/Prisma-Migrate-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/Target-Railway_PostgreSQL-0B0D0E?style=for-the-badge&logo=railway)
![Status](https://img.shields.io/badge/Migrations-2_Applied-success?style=for-the-badge)

---

## 1. Overview & Architecture

Database schema alterations in this repository are managed using **Prisma Migrate**.

Prisma Migrate guarantees deterministic, declarative schema transitions by generating immutable SQL migration scripts saved to `crm_imeth/prisma/migrations/`. These migrations execute sequentially against the target PostgreSQL database on **Railway** (or local development instances) and are verified via cryptographic SHA-256 checksums stored in the `_prisma_migrations` metadata table.

---

## 2. Chronological Migration History

### 2.1. Migration `0_init` (Initial Baseline)
- **Folder**: `crm_imeth/prisma/migrations/0_init/migration.sql`
- **Applied**: Initial repository setup
- **Scope**:
  - Creates the core `public` schema.
  - Provisions all 17 base tables (`Tenant`, `User`, `Lead`, `CampaignAttribution`, `Message`, `Followup`, `Attachment`, `Pipeline`, `PipelineStage`, `Deal`, `Flow`, `FlowNode`, `Notification`, `Activity`, `FailedJob`, `Tag`, `AuditLog`) and the `_LeadTags` join table.
  - Configures all primary keys (`PRIMARY KEY`), foreign key constraints with cascade behaviors (`ON DELETE CASCADE` / `ON DELETE SET NULL`), and unique constraints (`UNIQUE(tenantId, phoneNumber)`, `UNIQUE(tenantId, name)`).
  - Establishes single-column and composite B-tree indexes for high-throughput query filtering.

### 2.2. Migration `20261012044854_enable_tenant_rls` (Phase 2: Railway RLS Hardening)
- **Folder**: `crm_imeth/prisma/migrations/20261012044854_enable_tenant_rls/migration.sql`
- **Applied**: 2026-10-12
- **Scope**:
  - **Critical Railway Superuser Fix**: In PostgreSQL, table owners and superusers bypass standard `ENABLE ROW LEVEL SECURITY`. Since Railway's primary database credentials connect as the `postgres` owner account, `ALTER TABLE ... FORCE ROW LEVEL SECURITY` was applied to prevent tenant data leakage.
  - Applied RLS and FORCE RLS across:
    - `"Lead"`
    - `"User"`
    - `"Deal"`
    - `"Pipeline"`
    - `"Activity"` (sub-query isolation via parent `Lead`)
    - `"Followup"` (sub-query isolation via parent `Lead`)
    - `"Attachment"` (sub-query isolation via parent `Lead` OR `User`)
  - Created granular security policies enforcing:
    ```sql
    USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);
    ```

---

## 3. Migration Metadata Table (`_prisma_migrations`)

Prisma tracks the execution state of migrations using the internal `_prisma_migrations` table:

```sql
SELECT id, checksum, migration_name, started_at, finished_at, applied_steps_count 
FROM _prisma_migrations 
ORDER BY started_at ASC;
```

### Live Status in Production:
| id | migration_name | applied_steps_count | status |
| :--- | :--- | :---: | :--- |
| `0753a35b-1ec4-4cb6-9917-7dbdd36e4b85` | `0_init` | 1 | `APPLIED` |
| `7ca0b8a4-0e31-41be-a1c6-a67b5eb1ba2c` | `20261012044854_enable_tenant_rls` | 1 | `APPLIED` |

---

## 4. Railway PostgreSQL Deployment Runbook

### 4.1. Direct vs. Pooled Connection Strings
When running migrations on Railway, you **must** connect to the direct PostgreSQL port (`5432`), not the transaction pooler (e.g., PgBouncer on port `6543`), because DDL transactions require session-level lock acquisition:

- ✅ **Migration Connection (`DATABASE_URL` / `DIRECT_URL`)**:
  `postgresql://postgres:[PASSWORD]@[HOST].railway.app:5432/railway?sslmode=require`
- ⚠️ **Runtime Pooled Connection**:
  `postgresql://postgres:[PASSWORD]@[HOST].railway.app:6543/railway?sslmode=require&pgbouncer=true`

### 4.2. Applying Migrations in Production (CI/CD / Railway Deploy)
Never use `prisma migrate dev` in staging or production. Always execute:

```bash
# 1. Navigate to the backend directory
cd crm_imeth

# 2. Deploy pending migrations
npx prisma migrate deploy

# 3. Verify status
npx prisma migrate status
```

On Railway, configure the **Deploy Command** or **Release Command** in `railway.json`:
```json
{
  "deploy": {
    "startCommand": "npm start",
    "releaseCommand": "npx prisma migrate deploy"
  }
}
```

---

## 5. Rollback & Disaster Recovery Procedures

### 5.1. Handling Migration Drift
If a migration fails mid-way on Railway:
```bash
# Mark the migration as resolved (rolled back)
npx prisma migrate resolve --rolled-back 20261012044854_enable_tenant_rls

# Or mark it as applied if changes were manually applied
npx prisma migrate resolve --applied 20261012044854_enable_tenant_rls
```

### 5.2. Automated Off-Site Disaster Recovery Script
The repository contains an automated disaster recovery script at `crm_imeth/scripts/dr/backup.sh`.
It streams an encrypted, gzipped snapshot directly off Railway:

```bash
# Run automated encrypted backup
bash crm_imeth/scripts/dr/backup.sh
```

To run a recovery verification drill:
```bash
# Execute drill on a test database
bash crm_imeth/scripts/dr/restore_drill.sh
```
