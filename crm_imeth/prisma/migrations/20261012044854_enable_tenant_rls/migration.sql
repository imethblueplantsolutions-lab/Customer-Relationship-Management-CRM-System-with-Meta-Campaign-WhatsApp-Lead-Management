-- ==============================================================================
-- PHASE 2: RAILWAY POSTGRESQL ROW LEVEL SECURITY (RLS) MIGRATION
-- ==============================================================================
-- CRITICAL FOR RAILWAY:
-- Railway connects using the 'postgres' superuser/owner account.
-- In PostgreSQL, table owners bypass RLS unless 'FORCE ROW LEVEL SECURITY'
-- is explicitly applied to each table.
-- ==============================================================================

-- 1. LEAD TABLE
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_lead ON "Lead";
CREATE POLICY tenant_isolation_lead ON "Lead"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);

-- 2. USER TABLE
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_user ON "User";
CREATE POLICY tenant_isolation_user ON "User"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);

-- 3. DEAL TABLE
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deal" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_deal ON "Deal";
CREATE POLICY tenant_isolation_deal ON "Deal"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);

-- 4. PIPELINE TABLE
ALTER TABLE "Pipeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pipeline" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_pipeline ON "Pipeline";
CREATE POLICY tenant_isolation_pipeline ON "Pipeline"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::text);

-- 5. ACTIVITY TABLE (Child of Lead — scoped via Lead tenantId)
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_activity ON "Activity";
CREATE POLICY tenant_isolation_activity ON "Activity"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Lead"
      WHERE "Lead".id = "Activity"."leadId"
        AND "Lead"."tenantId" = current_setting('app.current_tenant_id', true)::text
    )
  );

-- 6. FOLLOWUP TABLE (Child of Lead — scoped via Lead tenantId)
ALTER TABLE "Followup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Followup" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_followup ON "Followup";
CREATE POLICY tenant_isolation_followup ON "Followup"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Lead"
      WHERE "Lead".id = "Followup"."leadId"
        AND "Lead"."tenantId" = current_setting('app.current_tenant_id', true)::text
    )
  );

-- 7. ATTACHMENT TABLE (Child of Lead/User — scoped via parent relation)
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_attachment ON "Attachment";
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