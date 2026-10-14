-- ==============================================================================
-- Meta CRM - Complete Database Records Restoration Script
-- Target: Supabase PostgreSQL (Public Schema)
-- ==============================================================================

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- 1. Insert Tenants
INSERT INTO public."Tenant" (id, name, "companyAddress", "wabaId", "metaPhoneNumberId", "createdAt")
VALUES 
  ('WABA_ID_TEST', 'Acme Digital Agency', NULL, '2848081548882258', '1270783929459090', '2026-08-31 06:08:03.043'),
  ('8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', 'Default Organization', NULL, 'WABA_ID_TEST', NULL, '2026-10-08 05:41:01.855')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "wabaId" = EXCLUDED."wabaId";

-- 2. Insert Users (with pre-hashed passwords for instant login)
-- Passwords:
-- superadmin123@crm.com -> superadmin123
-- admin@crm.com         -> admin123
-- teamlead@crm.com      -> teamlead123
-- agent@crm.com         -> agent123
-- imethblueplantsolutions@gmail.com -> Test@1234
-- teamlead2@crm.com     -> teamlead123
-- sam@crm.com           -> agent123
-- agent2@crm.com        -> agent123
INSERT INTO public."User" (id, name, email, password, role, "reportsToId", "tenantId", "isActive", "isFirstLogin", "subscriptionStatus", "createdAt", "updatedAt")
VALUES
  ('c1ac2218-86cd-4543-83a0-43ade735720d', 'Super Admin', 'superadmin123@crm.com', '$2b$10$J9BD2.aD5ZhuRXujES/PgOMy0oo5eMIUkGKe6rSBVxOTDowSrPY2y', 'SUPER_ADMIN', NULL, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', true, false, 'FREE', '2026-10-08 05:41:02.427', NOW()),
  ('5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'Imeth Dewmina', 'admin@crm.com', '$2b$10$Sr.G7ITnnjClbJ72TFiULO2LjChR130B409qmJSQnknKNTtSTIv1e', 'ADMIN', NULL, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', true, false, 'FREE', '2026-09-07 14:46:51.717', NOW()),
  ('97ccbbdf-1fd8-428d-8542-65a9d2447b34', 'Anthony', 'teamlead@crm.com', '$2b$10$EKfkqCPwWyTcJPcjfbpTv.uq.X6azRsiSQo0camijmnBIzPzgk6dm', 'TEAM_LEAD', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', true, false, 'FREE', '2026-09-07 14:46:51.717', NOW()),
  ('1f06b787-c048-46f7-8c21-822c2e2d79c5', 'Alex', 'agent@crm.com', '$2b$10$83/mZzBkfCMxzA7kI2rArucvEl7UXsovOxT2/F8NGMHTamLlB3TOO', 'AGENT', '97ccbbdf-1fd8-428d-8542-65a9d2447b34', '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', true, false, 'FREE', '2026-09-07 14:46:51.717', NOW()),
  ('9f1aee5f-1b3c-4dae-831c-f3cfce3d28cc', 'OTP Test Admin', 'imethblueplantsolutions@gmail.com', '$2b$10$2SRp2hj4zOkCBKcFw4KpM.YWIoCYPWJc6EKBYj.IAd0TYUR.ZrSGK', 'ADMIN', NULL, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', true, true, 'FREE', '2026-10-08 05:41:02.478', NOW()),
  ('f64ecccb-0865-49c4-82ba-f943f8645997', 'Sarah Jenkins', 'teamlead2@crm.com', '$2b$10$EKfkqCPwWyTcJPcjfbpTv.uq.X6azRsiSQo0camijmnBIzPzgk6dm', 'TEAM_LEAD', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'WABA_ID_TEST', true, false, 'FREE', '2026-09-30 11:40:02.280', NOW()),
  ('f212917c-8d64-41f8-a8de-9ef4ee7951d9', 'Sam', 'sam@crm.com', '$2b$10$83/mZzBkfCMxzA7kI2rArucvEl7UXsovOxT2/F8NGMHTamLlB3TOO', 'AGENT', '97ccbbdf-1fd8-428d-8542-65a9d2447b34', 'WABA_ID_TEST', true, false, 'FREE', '2026-09-08 06:56:35.898', NOW()),
  ('5b29f14f-0ad7-48d1-b595-8cceae615630', 'David', 'agent2@crm.com', '$2b$10$83/mZzBkfCMxzA7kI2rArucvEl7UXsovOxT2/F8NGMHTamLlB3TOO', 'AGENT', 'f64ecccb-0865-49c4-82ba-f943f8645997', 'WABA_ID_TEST', true, false, 'FREE', '2026-09-07 14:46:51.717', NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "tenantId" = EXCLUDED."tenantId";

-- 3. Insert Pipeline
INSERT INTO public."Pipeline" (id, "tenantId", name, "createdAt")
VALUES ('f61503e6-7431-406c-9fe0-de5e64d63072', 'WABA_ID_TEST', 'Tourism Pipeline', '2026-09-04 05:07:54.090')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Pipeline Stages
INSERT INTO public."PipelineStage" (id, "pipelineId", name, color, position, "createdAt")
VALUES
  ('f9fecb77-b6ce-41d0-8a7b-a5af1e493ba2', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Lead In', '#94a3b8', 0, NOW()),
  ('ea4f98fe-6182-4484-971f-20f25491f988', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Contact Made', '#3b82f6', 1, NOW()),
  ('87eb2da3-aa1b-4ef3-a2c6-f79093ef8573', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Proposal Sent', '#eab308', 2, NOW()),
  ('e1353f72-c2a0-4831-b96c-4b281568a774', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Won', '#22c55e', 3, NOW()),
  ('678a5049-9c01-45c3-b635-2edf97115015', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Lost', '#ef4444', 4, NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Leads
INSERT INTO public."Lead" (id, "phoneNumber", name, status, category, "tenantId", "assignedToId", "createdAt", "updatedAt")
VALUES
  ('34637030-3187-4e0a-97f1-de93a24391d0', '15550000000', 'Test User', 'CONVERTED', 'Meta Ad', 'WABA_ID_TEST', NULL, '2026-08-31 06:08:03.206', NOW()),
  ('a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', '+94 77 950 8456', 'Imeth', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-08-31 08:04:17.745', NOW()),
  ('88a73b42-a5e4-4405-be1b-6542e68e3b88', '15559876545', 'Jane Marketing 3', 'NEW', 'Referral', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-08-31 07:41:10.424', NOW()),
  ('ab350204-2aff-482c-95f0-02e3aa857abb', '+15555575633', 'Dwight Schrute', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-09-08 05:37:11.658', NOW()),
  ('da92f8f0-0cad-482f-be9e-33991dfd78e0', '+15553100403', 'Michael Scott', 'CONTACTED', 'Manual Entry', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-09-08 05:36:49.263', NOW()),
  ('6825b19d-f134-444d-91c8-fb29974d0d5d', '+15559113799', 'System Audit Lead', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '5b29f14f-0ad7-48d1-b595-8cceae615630', '2026-09-08 07:17:21.617', NOW()),
  ('fa335e64-5423-478a-bde9-4c5060fbccb3', '1111111111', 'Laskahan', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '5b29f14f-0ad7-48d1-b595-8cceae615630', '2026-09-08 07:38:47.542', NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Followups
INSERT INTO public."Followup" (id, "leadId", "assignedToId", "createdById", type, "dueAt", note, completed, "createdAt", "updatedAt")
VALUES
  ('fe0b35ba-71f4-4405-be1b-6542e68e3b88', '88a73b42-a5e4-4405-be1b-6542e68e3b88', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'CALL', NULL, 'Urgent callback inquiry', false, NOW(), NOW()),
  ('a7035488-e704-444d-91c8-fb29974d0d5d', '6825b19d-f134-444d-91c8-fb29974d0d5d', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'CALL', '2026-09-09 10:00:00', 'Call client regarding Meta WhatsApp API', true, NOW(), NOW()),
  ('995b7eef-1b69-478a-bde9-4c5060fbccb3', 'fa335e64-5423-478a-bde9-4c5060fbccb3', '5b29f14f-0ad7-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'DEMO', '2026-09-11 14:00:00', 'Product Demonstration Session', false, NOW(), NOW()),
  ('bebb3486-59ec-478a-bde9-4c5060fbccb3', 'fa335e64-5423-478a-bde9-4c5060fbccb3', '5b29f14f-0ad7-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'CALL', '2026-09-03 09:30:00', 'Urgent Call', false, NOW(), NOW()),
  ('78498a6f-0be3-4cb2-8f5b-ff8d712673c4', 'a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'CALL', '2026-09-02 11:00:00', 'Follow-up call', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Messages
INSERT INTO public."Message" (id, "messageId", "leadId", direction, source, body, status, "createdAt")
VALUES
  ('ab5440f9-1234-428d-8542-65a9d2447b34', 'outbound_1788162070458', '88a73b42-a5e4-4405-be1b-6542e68e3b88', 'OUTBOUND', 'CRM', 'Hi Jane, we have received your inquiry.', 'sent', NOW()),
  ('cc46b05d-5678-4cb2-8f5b-ff8d712673c4', 'outbound_1788163466408', 'a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', 'OUTBOUND', 'CRM', 'Hello! Welcome to Blue Planet CRM.', 'sent', NOW()),
  ('50f7401d-9012-478a-bde9-4c5060fbccb3', 'outbound_1788853686999', 'fa335e64-5423-478a-bde9-4c5060fbccb3', 'OUTBOUND', 'CRM', 'Hi there, how can we assist you today?', 'sent', NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Chatbot Flow & Nodes
INSERT INTO public."Flow" (id, "tenantId", name, status, "triggerType", "executionCount", "createdAt", "updatedAt")
VALUES ('9bbb0fef-030a-464f-a062-50143ce98503', 'WABA_ID_TEST', 'Customer Welcome Bot', 'active', 'keyword', 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."FlowNode" (id, "flowId", "nodeKey", "nodeType", "posX", "posY", config)
VALUES
  ('16a6c1b7-1111-464f-a062-50143ce98503', '9bbb0fef-030a-464f-a062-50143ce98503', 'start', 'start', 233, -41, '{"next_node_key": "condition_1"}'::jsonb),
  ('de92d0da-2222-464f-a062-50143ce98503', '9bbb0fef-030a-464f-a062-50143ce98503', 'condition_1', 'condition', 232, 111, '{"subject_key": "price"}'::jsonb),
  ('74cac567-3333-464f-a062-50143ce98503', '9bbb0fef-030a-464f-a062-50143ce98503', 'send_message_3', 'send_message', 65, 255, '{"text": "Here are our pricing packages."}'::jsonb),
  ('58cdb88a-4444-464f-a062-50143ce98503', '9bbb0fef-030a-464f-a062-50143ce98503', 'handoff_2', 'handoff', 242, 353, '{"department": "Sales Team"}'::jsonb),
  ('7b2f332f-5555-464f-a062-50143ce98503', '9bbb0fef-030a-464f-a062-50143ce98503', 'end_5', 'end', 250, 542, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Notifications
INSERT INTO public."Notification" (id, "userId", type, title, body, "isRead", "createdAt")
VALUES
  ('49858acb-1111-46f7-8c21-822c2e2d79c5', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'LEAD_ASSIGNED', 'Lead Assigned to You (Dwight Schrute)', 'New lead assigned for follow-up', true, '2026-09-08 10:00:00'),
  ('6c413d85-2222-46f7-8c21-822c2e2d79c5', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'FOLLOWUP_ASSIGNED', 'New Follow-up Assigned to You (Jane)', 'Urgent inquiry received', true, '2026-09-08 10:30:00'),
  ('c46a3409-3333-46f7-8c21-822c2e2d79c5', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'LEAD_ASSIGNED', 'New Lead Assigned (Michael Scott)', 'Contacted status updated', true, '2026-09-08 11:00:00'),
  ('ef8b5b09-4444-46f7-8c21-822c2e2d79c5', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'LEAD_ASSIGNED', 'New Lead Assigned (System Audit Lead)', 'Audit lead creation', true, '2026-09-08 12:00:00'),
  ('e51fdfa6-5555-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'LEAD_ASSIGNED', 'New Lead Assigned (Laskahan)', 'New lead', true, '2026-09-08 12:30:00'),
  ('1b1df953-6666-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'LEAD_ASSIGNED', 'Lead Reassigned to You', 'Reassigned lead', true, '2026-09-08 13:00:00'),
  ('cfc07cba-7777-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'FOLLOWUP_ASSIGNED', 'New Follow-up Assigned (DEMO)', 'Demo scheduling', false, '2026-09-08 13:30:00'),
  ('1a5f4e6d-8888-41f8-a8de-9ef4ee7951d9', 'f212917c-8d64-41f8-a8de-9ef4ee7951d9', 'LEAD_ASSIGNED', 'New Meta WhatsApp Lead', 'Inbound WhatsApp lead captured', false, '2026-09-10 09:00:00'),
  ('5ab2bdff-9999-41f8-a8de-9ef4ee7951d9', 'f212917c-8d64-41f8-a8de-9ef4ee7951d9', 'NEW_MESSAGE', 'New WhatsApp Message', 'Inbound message from customer', false, '2026-09-10 09:15:00'),
  ('22c98ecf-aaaa-46f7-8c21-822c2e2d79c5', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'TASK_OVERDUE', 'Overdue Task: CALL', 'Task deadline passed', false, '2026-10-01 08:00:00'),
  ('b6b51368-bbbb-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'TASK_OVERDUE', 'Overdue Task: DEMO', 'Demo preparation overdue', false, '2026-10-01 08:30:00'),
  ('dad7ab8a-cccc-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'TASK_OVERDUE', 'Overdue Task: CALL', 'Call reminder deadline passed', false, '2026-10-01 09:00:00')
ON CONFLICT (id) DO NOTHING;
