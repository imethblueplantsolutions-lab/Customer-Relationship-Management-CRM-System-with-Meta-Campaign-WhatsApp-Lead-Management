-- ==============================================================================
-- Sync Tenant IDs so admin@crm.com can see all Leads and Pipelines
-- ==============================================================================

-- 1. Move all users to the primary tenant ('WABA_ID_TEST') where all leads live
UPDATE public."User" 
SET "tenantId" = 'WABA_ID_TEST';

-- 2. Confirm all leads, pipelines, and chatbot flows belong to 'WABA_ID_TEST'
UPDATE public."Lead" 
SET "tenantId" = 'WABA_ID_TEST';

UPDATE public."Pipeline" 
SET "tenantId" = 'WABA_ID_TEST';

UPDATE public."Flow" 
SET "tenantId" = 'WABA_ID_TEST';
