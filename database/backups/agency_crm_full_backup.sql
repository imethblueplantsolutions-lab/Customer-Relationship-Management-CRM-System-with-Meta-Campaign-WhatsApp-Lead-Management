--
-- PostgreSQL database dump
--

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."_LeadTags" DROP CONSTRAINT IF EXISTS "_LeadTags_B_fkey";
ALTER TABLE IF EXISTS ONLY public."_LeadTags" DROP CONSTRAINT IF EXISTS "_LeadTags_A_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_reportsToId_fkey";
ALTER TABLE IF EXISTS ONLY public."Tag" DROP CONSTRAINT IF EXISTS "Tag_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Pipeline" DROP CONSTRAINT IF EXISTS "Pipeline_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."PipelineStage" DROP CONSTRAINT IF EXISTS "PipelineStage_pipelineId_fkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Message" DROP CONSTRAINT IF EXISTS "Message_leadId_fkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_assignedToId_fkey";
ALTER TABLE IF EXISTS ONLY public."Followup" DROP CONSTRAINT IF EXISTS "Followup_leadId_fkey";
ALTER TABLE IF EXISTS ONLY public."Followup" DROP CONSTRAINT IF EXISTS "Followup_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public."Followup" DROP CONSTRAINT IF EXISTS "Followup_assignedToId_fkey";
ALTER TABLE IF EXISTS ONLY public."Flow" DROP CONSTRAINT IF EXISTS "Flow_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."FlowNode" DROP CONSTRAINT IF EXISTS "FlowNode_flowId_fkey";
ALTER TABLE IF EXISTS ONLY public."Deal" DROP CONSTRAINT IF EXISTS "Deal_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Deal" DROP CONSTRAINT IF EXISTS "Deal_stageId_fkey";
ALTER TABLE IF EXISTS ONLY public."Deal" DROP CONSTRAINT IF EXISTS "Deal_pipelineId_fkey";
ALTER TABLE IF EXISTS ONLY public."Deal" DROP CONSTRAINT IF EXISTS "Deal_leadId_fkey";
ALTER TABLE IF EXISTS ONLY public."Deal" DROP CONSTRAINT IF EXISTS "Deal_assignedToId_fkey";
ALTER TABLE IF EXISTS ONLY public."CampaignAttribution" DROP CONSTRAINT IF EXISTS "CampaignAttribution_leadId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_targetUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_performedById_fkey";
ALTER TABLE IF EXISTS ONLY public."Attachment" DROP CONSTRAINT IF EXISTS "Attachment_leadId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attachment" DROP CONSTRAINT IF EXISTS "Attachment_followupId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attachment" DROP CONSTRAINT IF EXISTS "Attachment_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public."Activity" DROP CONSTRAINT IF EXISTS "Activity_leadId_fkey";
ALTER TABLE IF EXISTS ONLY public."Activity" DROP CONSTRAINT IF EXISTS "Activity_createdById_fkey";
DROP INDEX IF EXISTS public."_LeadTags_B_index";
DROP INDEX IF EXISTS public."User_tenantId_idx";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Tenant_wabaId_key";
DROP INDEX IF EXISTS public."Tag_tenantId_name_key";
DROP INDEX IF EXISTS public."Tag_tenantId_idx";
DROP INDEX IF EXISTS public."Pipeline_tenantId_idx";
DROP INDEX IF EXISTS public."PipelineStage_pipelineId_idx";
DROP INDEX IF EXISTS public."Notification_userId_isRead_idx";
DROP INDEX IF EXISTS public."Message_messageId_key";
DROP INDEX IF EXISTS public."Message_leadId_idx";
DROP INDEX IF EXISTS public."Message_leadId_createdAt_idx";
DROP INDEX IF EXISTS public."Lead_tenantId_updatedAt_idx";
DROP INDEX IF EXISTS public."Lead_tenantId_status_idx";
DROP INDEX IF EXISTS public."Lead_tenantId_phoneNumber_key";
DROP INDEX IF EXISTS public."Lead_tenantId_assignedToId_idx";
DROP INDEX IF EXISTS public."Followup_leadId_idx";
DROP INDEX IF EXISTS public."Followup_dueAt_idx";
DROP INDEX IF EXISTS public."Followup_completed_dueAt_idx";
DROP INDEX IF EXISTS public."Followup_assignedToId_completed_idx";
DROP INDEX IF EXISTS public."Flow_tenantId_idx";
DROP INDEX IF EXISTS public."FlowNode_flowId_nodeKey_key";
DROP INDEX IF EXISTS public."FlowNode_flowId_idx";
DROP INDEX IF EXISTS public."FailedJob_status_idx";
DROP INDEX IF EXISTS public."FailedJob_queueName_idx";
DROP INDEX IF EXISTS public."FailedJob_createdAt_idx";
DROP INDEX IF EXISTS public."Deal_tenantId_idx";
DROP INDEX IF EXISTS public."Deal_stageId_idx";
DROP INDEX IF EXISTS public."Deal_pipelineId_idx";
DROP INDEX IF EXISTS public."CampaignAttribution_leadId_key";
DROP INDEX IF EXISTS public."AuditLog_tenantId_idx";
DROP INDEX IF EXISTS public."AuditLog_tenantId_createdAt_idx";
DROP INDEX IF EXISTS public."AuditLog_targetUserId_idx";
DROP INDEX IF EXISTS public."AuditLog_performedById_idx";
DROP INDEX IF EXISTS public."AuditLog_action_idx";
DROP INDEX IF EXISTS public."Attachment_leadId_idx";
DROP INDEX IF EXISTS public."Attachment_followupId_idx";
DROP INDEX IF EXISTS public."Attachment_createdById_idx";
DROP INDEX IF EXISTS public."Activity_occurredAt_idx";
DROP INDEX IF EXISTS public."Activity_leadId_occurredAt_idx";
DROP INDEX IF EXISTS public."Activity_leadId_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."_LeadTags" DROP CONSTRAINT IF EXISTS "_LeadTags_AB_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Tenant" DROP CONSTRAINT IF EXISTS "Tenant_pkey";
ALTER TABLE IF EXISTS ONLY public."Tag" DROP CONSTRAINT IF EXISTS "Tag_pkey";
ALTER TABLE IF EXISTS ONLY public."Pipeline" DROP CONSTRAINT IF EXISTS "Pipeline_pkey";
ALTER TABLE IF EXISTS ONLY public."PipelineStage" DROP CONSTRAINT IF EXISTS "PipelineStage_pkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_pkey";
ALTER TABLE IF EXISTS ONLY public."Message" DROP CONSTRAINT IF EXISTS "Message_pkey";
ALTER TABLE IF EXISTS ONLY public."Lead" DROP CONSTRAINT IF EXISTS "Lead_pkey";
ALTER TABLE IF EXISTS ONLY public."Followup" DROP CONSTRAINT IF EXISTS "Followup_pkey";
ALTER TABLE IF EXISTS ONLY public."Flow" DROP CONSTRAINT IF EXISTS "Flow_pkey";
ALTER TABLE IF EXISTS ONLY public."FlowNode" DROP CONSTRAINT IF EXISTS "FlowNode_pkey";
ALTER TABLE IF EXISTS ONLY public."FailedJob" DROP CONSTRAINT IF EXISTS "FailedJob_pkey";
ALTER TABLE IF EXISTS ONLY public."Deal" DROP CONSTRAINT IF EXISTS "Deal_pkey";
ALTER TABLE IF EXISTS ONLY public."CampaignAttribution" DROP CONSTRAINT IF EXISTS "CampaignAttribution_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Attachment" DROP CONSTRAINT IF EXISTS "Attachment_pkey";
ALTER TABLE IF EXISTS ONLY public."Activity" DROP CONSTRAINT IF EXISTS "Activity_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."_LeadTags";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Tenant";
DROP TABLE IF EXISTS public."Tag";
DROP TABLE IF EXISTS public."PipelineStage";
DROP TABLE IF EXISTS public."Pipeline";
DROP TABLE IF EXISTS public."Notification";
DROP TABLE IF EXISTS public."Message";
DROP TABLE IF EXISTS public."Lead";
DROP TABLE IF EXISTS public."Followup";
DROP TABLE IF EXISTS public."FlowNode";
DROP TABLE IF EXISTS public."Flow";
DROP TABLE IF EXISTS public."FailedJob";
DROP TABLE IF EXISTS public."Deal";
DROP TABLE IF EXISTS public."CampaignAttribution";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."Attachment";
DROP TABLE IF EXISTS public."Activity";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Activity" (
    id text NOT NULL,
    "leadId" text NOT NULL,
    "createdById" text,
    type text DEFAULT 'NOTE'::text NOT NULL,
    title text,
    description text,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public."Activity" FORCE ROW LEVEL SECURITY;


--
-- Name: Attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attachment" (
    id text NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text,
    "fileType" text,
    "fileSize" integer NOT NULL,
    "createdById" text NOT NULL,
    "leadId" text,
    "followupId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "fileData" bytea,
    "mimeType" text
);

ALTER TABLE ONLY public."Attachment" FORCE ROW LEVEL SECURITY;


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "performedById" text NOT NULL,
    "targetUserId" text,
    action text NOT NULL,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CampaignAttribution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CampaignAttribution" (
    id text NOT NULL,
    "leadId" text NOT NULL,
    "sourceUrl" text,
    "adId" text,
    "sourceType" text,
    headline text,
    body text,
    "ctwaClid" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Deal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Deal" (
    id text NOT NULL,
    "pipelineId" text NOT NULL,
    "stageId" text NOT NULL,
    "tenantId" text NOT NULL,
    "leadId" text,
    "assignedToId" text,
    title text NOT NULL,
    value double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    notes text,
    "expectedCloseDate" timestamp(3) without time zone,
    status text DEFAULT 'open'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."Deal" FORCE ROW LEVEL SECURITY;


--
-- Name: FailedJob; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FailedJob" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "queueName" text NOT NULL,
    "jobName" text NOT NULL,
    payload jsonb NOT NULL,
    error text NOT NULL,
    status text DEFAULT 'FAILED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Flow; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Flow" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    "triggerType" text DEFAULT 'keyword'::text NOT NULL,
    "triggerConfig" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "entryNodeId" text,
    "executionCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FlowNode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FlowNode" (
    id text NOT NULL,
    "flowId" text NOT NULL,
    "nodeKey" text NOT NULL,
    "nodeType" text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    "posX" double precision DEFAULT 0 NOT NULL,
    "posY" double precision DEFAULT 0 NOT NULL
);


--
-- Name: Followup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Followup" (
    id text NOT NULL,
    "leadId" text NOT NULL,
    type text DEFAULT 'CALL'::text NOT NULL,
    "dueAt" timestamp(3) without time zone,
    note text,
    completed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assignedToId" text,
    "createdById" text
);

ALTER TABLE ONLY public."Followup" FORCE ROW LEVEL SECURITY;


--
-- Name: Lead; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "phoneNumber" text NOT NULL,
    name text,
    status text DEFAULT 'NEW'::text NOT NULL,
    category text,
    "tenantId" text NOT NULL,
    "assignedToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "displayName" text,
    email text,
    notes text,
    "whatsappNumber" text,
    "companyName" text,
    designation text,
    "isSubscribed" boolean DEFAULT true NOT NULL,
    "unsubscribedAt" timestamp(3) without time zone
);

ALTER TABLE ONLY public."Lead" FORCE ROW LEVEL SECURITY;


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "leadId" text NOT NULL,
    direction text DEFAULT 'INBOUND'::text NOT NULL,
    body text NOT NULL,
    "timestamp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source text DEFAULT 'CRM'::text NOT NULL,
    status text DEFAULT 'sent'::text
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text DEFAULT 'FOLLOWUP_ASSIGNED'::text NOT NULL,
    title text NOT NULL,
    body text DEFAULT ''::text NOT NULL,
    "linkUrl" text,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message text
);


--
-- Name: Pipeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Pipeline" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public."Pipeline" FORCE ROW LEVEL SECURITY;


--
-- Name: PipelineStage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PipelineStage" (
    id text NOT NULL,
    "pipelineId" text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    "position" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tag" (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#E2E8F0'::text NOT NULL,
    "tenantId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    "wabaId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "metaAccessToken" text,
    "metaPhoneNumberId" text,
    "companyAddress" text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'AGENT'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "tenantId" text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text,
    "isFirstLogin" boolean DEFAULT true NOT NULL,
    "otpAttempts" integer DEFAULT 0 NOT NULL,
    "otpExpiresAt" timestamp(3) without time zone,
    "otpHash" text,
    "pendingEmail" text,
    "tokenVersion" integer DEFAULT 0 NOT NULL,
    avatar text,
    bio text,
    phone text,
    "reportsToId" text,
    "maxAgents" integer DEFAULT 1,
    "maxTeamLeads" integer DEFAULT 1,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockoutUntil" timestamp(3) without time zone,
    "dmcaStrikes" integer DEFAULT 0 NOT NULL,
    "isSubscribed" boolean DEFAULT true NOT NULL,
    "subscriptionPrice" double precision,
    "subscriptionRenewalDate" timestamp(3) without time zone,
    "subscriptionStatus" text DEFAULT 'FREE'::text NOT NULL,
    "unsubscribedAt" timestamp(3) without time zone
);

ALTER TABLE ONLY public."User" FORCE ROW LEVEL SECURITY;


--
-- Name: _LeadTags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_LeadTags" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Activity; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Activity" VALUES ('516eda65-c547-4c54-a98b-2d007c29a49d', '34637030-3187-4e0a-97f1-de93a24391d0', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'PHONE_CALL', 'Initial Discovery Call', 'Discussed requirement for Meta WhatsApp CRM integration', '2026-09-07 23:51:00', '2026-09-08 05:21:50.831');
INSERT INTO public."Activity" VALUES ('c260516b-d1ea-425e-8de8-5fe8d9908dd8', 'a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'PHONE_CALL', 'fdfd', 'dffdfdf', '2026-09-22 23:59:00', '2026-09-08 05:29:10.13');
INSERT INTO public."Activity" VALUES ('797bfaa2-f20f-46ba-b3e5-b4b833ed556a', '6825b19d-f134-444d-91c8-fb29974d0d5d', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'SYSTEM_ASSIGNMENT', 'Lead Assigned', 'Lead assigned to agent', '2026-09-08 07:17:21.673', '2026-09-08 07:17:21.675');
INSERT INTO public."Activity" VALUES ('ec79d53e-cf08-40a3-9bca-40789e848f76', '6825b19d-f134-444d-91c8-fb29974d0d5d', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'SYSTEM_ASSIGNMENT', 'Lead Reassigned', 'Lead reassigned to agent2', '2026-09-08 07:17:21.741', '2026-09-08 07:17:21.743');
INSERT INTO public."Activity" VALUES ('db4364db-ea33-450d-ae78-618dcc5bbe2e', '6825b19d-f134-444d-91c8-fb29974d0d5d', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'PHONE_CALL', 'Introductory Call with Lead', 'Discussed CRM requirements.', '2026-09-08 07:17:21.747', '2026-09-08 07:17:21.756');
INSERT INTO public."Activity" VALUES ('b6303048-4c8b-4729-a4ee-512ada5dfaed', 'fa335e64-5423-478a-bde9-4c5060fbccb3', '97ccbbdf-1fd8-428d-8542-65a9d2447b34', 'SYSTEM_ASSIGNMENT', 'Lead Assigned', 'Lead assigned to agent2', '2026-09-08 07:38:47.62', '2026-09-08 07:38:47.632');
INSERT INTO public."Activity" VALUES ('d8531d9d-772f-4ef3-a8b4-e57c4c64357e', '6825b19d-f134-444d-91c8-fb29974d0d5d', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'TASK_SCHEDULED', 'Follow-up Scheduled: CALL', 'Scheduled CALL task: "Call client regarding custom Meta WhatsApp API package" (Due: 9/9/2026, 1:31:28 PM) [Assigned: Imeth Dewmina Rathnayaka]', '2026-09-08 08:01:29.111', '2026-09-08 08:01:29.112');
INSERT INTO public."Activity" VALUES ('b3d0f433-b382-4cc4-8859-253c29c70976', '6825b19d-f134-444d-91c8-fb29974d0d5d', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'TASK_COMPLETED', 'Follow-up Completed: CALL', 'Marked CALL as done: "Call client regarding custom Meta WhatsApp API package"', '2026-09-08 08:01:29.177', '2026-09-08 08:01:29.178');
INSERT INTO public."Activity" VALUES ('a482ab55-c34d-41f9-b41b-48a9438874a1', 'fa335e64-5423-478a-bde9-4c5060fbccb3', '97ccbbdf-1fd8-428d-8542-65a9d2447b34', 'TASK_SCHEDULED', 'Follow-up Scheduled: DEMO', 'Scheduled DEMO task: "fdfdfdf" (Due: 9/11/2026, 5:18:00 PM) [Assigned: agent2]', '2026-09-08 11:47:31.755', '2026-09-08 11:47:31.757');
INSERT INTO public."Activity" VALUES ('03e7d72a-dc2b-4159-b4f8-7790c60a8f39', 'fa335e64-5423-478a-bde9-4c5060fbccb3', '97ccbbdf-1fd8-428d-8542-65a9d2447b34', 'TASK_COMPLETED', 'Follow-up Completed: CALL', 'Marked CALL as done: "call urgent"', '2026-09-08 11:52:52.697', '2026-09-08 11:52:52.699');
INSERT INTO public."Activity" VALUES ('331f3c5b-3bc4-4c42-87ef-def1c40f510c', 'a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'TASK_COMPLETED', 'Follow-up Completed: CALL', 'Marked CALL as done: "dfdfd"', '2026-09-09 12:01:45.402', '2026-09-09 12:01:45.412');


--
-- Data for Name: Attachment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: CampaignAttribution; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Deal; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: FailedJob; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Flow; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Flow" VALUES ('9bbb0fef-030a-464f-a062-50143ce98503', 'WABA_ID_TEST', 'sss', 'ssss', 'active', 'keyword', '{}', NULL, 0, '2026-09-04 06:26:36.052', '2026-09-04 06:26:49.228');


--
-- Data for Name: FlowNode; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."FlowNode" VALUES ('16a6c1b7-09b0-45ce-a03d-8ead75b95360', '9bbb0fef-030a-464f-a062-50143ce98503', 'start', 'start', '{"next_node_key": ""}', 233, -41);
INSERT INTO public."FlowNode" VALUES ('de92d0da-95ee-44a1-85af-a8268f28de06', '9bbb0fef-030a-464f-a062-50143ce98503', 'condition_1', 'condition', '{"subject_key": "price"}', 232.5, 111.3125);
INSERT INTO public."FlowNode" VALUES ('58cdb88a-5c45-4aaf-9a0b-2736914ee6c5', '9bbb0fef-030a-464f-a062-50143ce98503', 'handoff_2', 'handoff', '{"department": "Sales Team"}', 242.8299782372493, 353.7645095973833);
INSERT INTO public."FlowNode" VALUES ('74cac567-656f-42a8-961d-ac88fe69e946', '9bbb0fef-030a-464f-a062-50143ce98503', 'send_message_3', 'send_message', '{"text": "price"}', 65.06778266157582, 255.2252700716161);
INSERT INTO public."FlowNode" VALUES ('7b2f332f-332a-4d09-8c3c-7016720902ae', '9bbb0fef-030a-464f-a062-50143ce98503', 'end_5', 'end', '{}', 250, 542);


--
-- Data for Name: Followup; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Followup" VALUES ('fe0b35ba-71f4-44aa-9b48-6c06d440101e', '88a73b42-a5e4-4405-be1b-6542e68e3b88', 'CALL', NULL, 'sdsdsd', false, '2026-09-08 05:31:24.959', '2026-09-08 05:31:31.719', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '97ccbbdf-1fd8-428d-8542-65a9d2447b34');
INSERT INTO public."Followup" VALUES ('a7035488-e704-4987-a9e4-d4a28724062c', '6825b19d-f134-444d-91c8-fb29974d0d5d', 'CALL', '2026-09-09 08:01:28.849', 'Call client regarding custom Meta WhatsApp API package', true, '2026-09-08 08:01:28.887', '2026-09-08 08:01:29.172', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b');
INSERT INTO public."Followup" VALUES ('995b7eef-1b69-4000-80d3-ac36fa49dc2f', 'fa335e64-5423-478a-bde9-4c5060fbccb3', 'DEMO', '2026-09-11 11:48:00', 'fdfdfdf', false, '2026-09-08 11:47:31.664', '2026-09-08 11:47:31.664', '5b29f14f-0ad7-48d1-b595-8cceae615630', '97ccbbdf-1fd8-428d-8542-65a9d2447b34');
INSERT INTO public."Followup" VALUES ('bebb3486-59ec-4fcd-8318-595c951c9933', 'fa335e64-5423-478a-bde9-4c5060fbccb3', 'CALL', '2026-09-03 07:47:00', 'call urgent', false, '2026-09-08 07:48:27.884', '2026-09-08 11:52:54.946', '5b29f14f-0ad7-48d1-b595-8cceae615630', '5b29f14f-0ad7-48d1-b595-8cceae615630');
INSERT INTO public."Followup" VALUES ('78498a6f-0be3-44be-b327-8fa242103b5b', 'a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', 'CALL', '2026-09-02 04:45:00', 'dfdfd', false, '2026-09-07 04:45:33.291', '2026-09-09 12:01:54.679', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '97ccbbdf-1fd8-428d-8542-65a9d2447b34');


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Lead" VALUES ('34637030-3187-4e0a-97f1-de93a24391d0', '15550000000', 'Test User', 'CONVERTED', 'Meta Ad', 'WABA_ID_TEST', NULL, '2026-08-31 06:08:03.206', '2026-09-08 05:21:50.931', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL);
INSERT INTO public."Lead" VALUES ('a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', '+94 77 950 8456', 'imeth', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-08-31 08:04:17.745', '2026-09-08 05:29:10.252', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL);
INSERT INTO public."Lead" VALUES ('88a73b42-a5e4-4405-be1b-6542e68e3b88', '15559876545', 'Jane Marketing 3', 'NEW', 'Referral', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-08-31 07:41:10.424', '2026-09-08 05:35:58.105', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL);
INSERT INTO public."Lead" VALUES ('ab350204-2aff-482c-95f0-02e3aa857abb', '+15555575633', 'Dwight Schrute', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-09-08 05:37:11.658', '2026-09-08 05:37:11.671', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL);
INSERT INTO public."Lead" VALUES ('da92f8f0-0cad-482f-be9e-33991dfd78e0', '+15553100403', 'Michael Scott', 'CONTACTED', 'Manual Entry', 'WABA_ID_TEST', '1f06b787-c048-46f7-8c21-822c2e2d79c5', '2026-09-08 05:36:49.263', '2026-09-08 06:34:23.128', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL);
INSERT INTO public."Lead" VALUES ('6825b19d-f134-444d-91c8-fb29974d0d5d', '+15559113799', 'System Audit Test Lead', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '5b29f14f-0ad7-48d1-b595-8cceae615630', '2026-09-08 07:17:21.617', '2026-09-08 08:01:28.94', NULL, NULL, NULL, NULL, NULL, NULL, true, NULL);
INSERT INTO public."Lead" VALUES ('fa335e64-5423-478a-bde9-4c5060fbccb3', '1111111111', 'laskahan', 'NEW', 'Manual Entry', 'WABA_ID_TEST', '5b29f14f-0ad7-48d1-b595-8cceae615630', '2026-09-08 07:38:47.542', '2026-09-08 11:47:31.678', 'Bp_lakshan', 'laksaha123@gmail.com', NULL, '1111111111', NULL, NULL, true, NULL);


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Message" VALUES ('ab5440f9-3d18-4d8e-847f-a4ec1391eb44', 'outbound_1788162070458', '88a73b42-a5e4-4405-be1b-6542e68e3b88', 'OUTBOUND', 'Hi Jane, we have received your inquiry.', '1788162070', '2026-08-31 07:41:10.46', 'CRM', 'sent');
INSERT INTO public."Message" VALUES ('cc46b05d-d145-4e92-b01c-84d9655261cf', 'outbound_1788163466408', 'a1295cdf-3b98-4cb2-8f5b-ff8d712673c4', 'OUTBOUND', 'hii', '1788163466', '2026-08-31 08:04:26.409', 'CRM', 'sent');
INSERT INTO public."Message" VALUES ('50f7401d-d2cc-41c9-8cf9-a709ae153401', 'outbound_1788853686999', 'fa335e64-5423-478a-bde9-4c5060fbccb3', 'OUTBOUND', 'hi', '1788853686', '2026-09-08 07:48:07', 'CRM', 'sent');


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Notification" VALUES ('49858acb-526a-44a4-a006-427b3e651aca', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'LEAD_ASSIGNED', 'Lead Assigned to You', 'Team Lead/Admin assigned you lead: Dwight Schrute', '/leads/ab350204-2aff-482c-95f0-02e3aa857abb', true, '2026-09-08 05:37:11.678', NULL);
INSERT INTO public."Notification" VALUES ('6c413d85-f043-49b6-9794-57baa2742d07', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'FOLLOWUP_ASSIGNED', 'New Follow-up Assigned to You', 'A CALL task was assigned to you for lead: Jane Marketing 3', '/leads/88a73b42-a5e4-4405-be1b-6542e68e3b88', true, '2026-09-08 05:31:24.981', NULL);
INSERT INTO public."Notification" VALUES ('c46a3409-ef7d-435e-8036-60aa6c53c8a8', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'LEAD_ASSIGNED', 'New Lead Assigned to You', 'Team Lead/Admin assigned you a new lead: Michael Scott', '/leads/da92f8f0-0cad-482f-be9e-33991dfd78e0', true, '2026-09-08 05:36:49.276', NULL);
INSERT INTO public."Notification" VALUES ('ef8b5b09-be35-4f23-bf3d-01b94c128731', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'LEAD_ASSIGNED', 'New Lead Assigned to You', 'Team Lead/Admin assigned you a new lead: System Audit Test Lead', '/leads/6825b19d-f134-444d-91c8-fb29974d0d5d', true, '2026-09-08 07:17:21.681', NULL);
INSERT INTO public."Notification" VALUES ('e51fdfa6-2a05-4161-8598-62739e3a0b06', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'LEAD_ASSIGNED', 'New Lead Assigned to You', 'Team Lead/Admin assigned you a new lead: laskahan', '/leads/fa335e64-5423-478a-bde9-4c5060fbccb3', true, '2026-09-08 07:38:47.65', NULL);
INSERT INTO public."Notification" VALUES ('1b1df953-2e08-407c-9a36-7e382164b921', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'LEAD_ASSIGNED', 'Lead Assigned to You', 'Team Lead/Admin assigned you lead: System Audit Test Lead', '/leads/6825b19d-f134-444d-91c8-fb29974d0d5d', true, '2026-09-08 07:17:21.745', NULL);
INSERT INTO public."Notification" VALUES ('cfc07cba-90a3-47c7-9b8f-ea723a1e655d', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'FOLLOWUP_ASSIGNED', 'New Follow-up Assigned to You', 'A DEMO task was assigned to you for lead: laskahan', '/leads/fa335e64-5423-478a-bde9-4c5060fbccb3', false, '2026-09-08 11:47:31.763', NULL);
INSERT INTO public."Notification" VALUES ('1a5f4e6d-fc86-4509-8937-3c43a2264093', 'f212917c-8d64-41f8-a8de-9ef4ee7951d9', 'LEAD_ASSIGNED', 'New Lead Assigned to You', 'A new Meta WhatsApp lead (Imeth (Live Test)) was automatically assigned to you.', '/leads/d7158a8a-eff4-49a5-8c53-c55ccdc64690', false, '2026-09-10 11:33:13.802', NULL);
INSERT INTO public."Notification" VALUES ('5ab2bdff-4316-47b7-b0e1-83d3ee35b73d', 'f212917c-8d64-41f8-a8de-9ef4ee7951d9', 'NEW_MESSAGE', 'New WhatsApp Message', 'New reply from Imeth (Live Test)', '/leads/d7158a8a-eff4-49a5-8c53-c55ccdc64690', false, '2026-09-10 11:33:13.81', 'New reply from Imeth (Live Test)');
INSERT INTO public."Notification" VALUES ('22c98ecf-6d1a-4838-a134-b16a7478d09c', '1f06b787-c048-46f7-8c21-822c2e2d79c5', 'TASK_OVERDUE', 'Overdue Task: CALL', 'Task for "imeth" is overdue (was due at 10:15 AM). Please follow up now.', '/leads/a1295cdf-3b98-4cb2-8f5b-ff8d712673c4?followupId=78498a6f-0be3-44be-b327-8fa242103b5b', false, '2026-10-01 12:10:33.074', 'Task for "imeth" is overdue (was due at 10:15 AM). Please follow up now.');
INSERT INTO public."Notification" VALUES ('b6b51368-f73c-4b36-bf09-1b409599e670', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'TASK_OVERDUE', 'Overdue Task: DEMO', 'Task for "laskahan" is overdue (was due at 05:18 PM). Please follow up now.', '/leads/fa335e64-5423-478a-bde9-4c5060fbccb3?followupId=995b7eef-1b69-4000-80d3-ac36fa49dc2f', false, '2026-10-01 12:10:33.132', 'Task for "laskahan" is overdue (was due at 05:18 PM). Please follow up now.');
INSERT INTO public."Notification" VALUES ('dad7ab8a-57e3-4001-9dbe-c7fc563b3ccc', '5b29f14f-0ad7-48d1-b595-8cceae615630', 'TASK_OVERDUE', 'Overdue Task: CALL', 'Task for "laskahan" is overdue (was due at 01:17 PM). Please follow up now.', '/leads/fa335e64-5423-478a-bde9-4c5060fbccb3?followupId=bebb3486-59ec-4fcd-8318-595c951c9933', false, '2026-10-01 12:10:33.138', 'Task for "laskahan" is overdue (was due at 01:17 PM). Please follow up now.');


--
-- Data for Name: Pipeline; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Pipeline" VALUES ('f61503e6-7431-406c-9fe0-de5e64d63072', 'WABA_ID_TEST', 'toursimPipeline', '2026-09-04 05:07:54.09');


--
-- Data for Name: PipelineStage; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."PipelineStage" VALUES ('f9fecb77-b6ce-41d0-8a7b-a5af1e493ba2', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Lead In', '#94a3b8', 0, '2026-09-04 05:07:54.09');
INSERT INTO public."PipelineStage" VALUES ('ea4f98fe-6182-4484-971f-20f25491f988', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Contact Made', '#3b82f6', 1, '2026-09-04 05:07:54.09');
INSERT INTO public."PipelineStage" VALUES ('87eb2da3-aa1b-4ef3-a2c6-f79093ef8573', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Proposal Sent', '#eab308', 2, '2026-09-04 05:07:54.09');
INSERT INTO public."PipelineStage" VALUES ('e1353f72-c2a0-4831-b96c-4b281568a774', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Won', '#22c55e', 3, '2026-09-04 05:07:54.09');
INSERT INTO public."PipelineStage" VALUES ('678a5049-9c01-45c3-b635-2edf97115015', 'f61503e6-7431-406c-9fe0-de5e64d63072', 'Lost', '#ef4444', 4, '2026-09-04 05:07:54.09');


--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Tenant" VALUES ('WABA_ID_TEST', 'Acme Digital Agency', '2848081548882258', '2026-08-31 06:08:03.043', 'EAAYeFsKKv0EBSeCjctgspDn9kmg0EG1N4bdtwerJLkZApUX0q007jXOntLXsahYZCzeoNlPVEV7y3XcFjt90wRtYBcisyZA8Juyx7Lms0lZBaQV2bz9XdADQG44IxtUX80kD4uSbHOsfcVbQHye8ZA1HOUUVvqrUTC7zHNEOCtqJkv9l5ZAddlszYV6VcCDfX0wclNwXYhhuZBJkMZCacJphItwpR8nIPFDvFztcTpzZBtnKsWL9tAXfDtq6fzY1N7hBuiysLUxZAZCnXmUuKTpb1mn5QZDZD', '1270783929459090', NULL);
INSERT INTO public."Tenant" VALUES ('8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', 'Default Organization', 'WABA_ID_TEST', '2026-10-08 05:41:01.855', NULL, NULL, NULL);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."User" VALUES ('c1ac2218-86cd-4543-83a0-43ade735720d', 'superadmin123@crm.com', 'SUPER_ADMIN', true, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', '$2b$10$Sidu889wuBDXGDkvsCyP9er/.1..4QKcobl18Vi0on6sBTxiNlQ/K', '2026-10-08 05:41:02.427', '2026-10-08 05:41:18.81', 'Super Admin', false, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);
INSERT INTO public."User" VALUES ('5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 'admin@crm.com', 'ADMIN', true, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', '$2b$10$s9ASVfkaFXkj2.P55ZIA/.kv1XDXleR/g97MsCTi3jSLR0J5BXnKW', '2026-09-07 14:46:51.717', '2026-10-08 05:41:18.816', 'Imeth Dewmina Rathnayaka', false, 0, '2026-09-09 05:35:04.277', '9e21577799b1e876e8232613c6466d8881ed704bf1c67d9cd085ae7c2638a9ef', NULL, 0, NULL, NULL, NULL, NULL, 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);
INSERT INTO public."User" VALUES ('97ccbbdf-1fd8-428d-8542-65a9d2447b34', 'teamlead@crm.com', 'TEAM_LEAD', true, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', '$2b$10$nZ89V113N.AN.fejYNOtXOKIYmToZXbir2qV9Sv.jKAwQ8k/lAdDS', '2026-09-07 14:46:51.717', '2026-10-08 05:41:18.819', 'Anthony', false, 0, '2026-09-09 05:35:26.566', 'd0eba85e04f66d4924a6be1fafee51fa3aa13026a9eb6afc9177c499a9a174ab', NULL, 0, NULL, NULL, NULL, '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);
INSERT INTO public."User" VALUES ('1f06b787-c048-46f7-8c21-822c2e2d79c5', 'agent@crm.com', 'AGENT', true, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', '$2b$10$24bWHwPXwcntCiec/u7amurHi9ApG2qYk10QEY6rj0cuCDQw9OXYW', '2026-09-07 14:46:51.717', '2026-10-08 05:41:18.823', 'Alex', false, 0, '2026-09-09 05:35:17.731', 'a0b601ac2cae6a553bce468bbbb023621cfbeda084b41147be9a90b528605b02', NULL, 0, NULL, NULL, NULL, '97ccbbdf-1fd8-428d-8542-65a9d2447b34', 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);
INSERT INTO public."User" VALUES ('9f1aee5f-1b3c-4dae-831c-f3cfce3d28cc', 'imethblueplantsolutions@gmail.com', 'ADMIN', true, '8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e', '$2b$10$0vymwYKhJwW69aXqRJ1lj.LYLkSRdEB1K3axY3OGIdwtiLVYNYqV.', '2026-10-08 05:41:02.478', '2026-10-08 05:41:18.826', 'OTP Test Admin', true, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);
INSERT INTO public."User" VALUES ('f64ecccb-0865-49c4-82ba-f943f8645997', 'teamlead2@crm.com', 'TEAM_LEAD', true, 'WABA_ID_TEST', '$2b$10$FRw7eTumDHYuJkLnxC23FeAdg7JcGNIogUE3t3YoG8LOwjMcnx0Ri', '2026-09-30 11:40:02.28', '2026-09-30 11:40:02.28', 'Sarah Jenkins', false, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL, '5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b', 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);
INSERT INTO public."User" VALUES ('f212917c-8d64-41f8-a8de-9ef4ee7951d9', 'sam@crm.com', 'AGENT', true, 'WABA_ID_TEST', '$2b$10$94EI/LuXFzp9PQY4WNHhBOYY.66Thrwc7b0cOjbPELbQLucs0LZ.C', '2026-09-08 06:56:35.898', '2026-09-30 11:40:02.304', 'Sam', true, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL, '97ccbbdf-1fd8-428d-8542-65a9d2447b34', 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);
INSERT INTO public."User" VALUES ('5b29f14f-0ad7-48d1-b595-8cceae615630', 'agent2@crm.com', 'AGENT', true, 'WABA_ID_TEST', '$2b$10$VoECRVne8f7bSWiSROA7fes.IXbLsnUYdXuSY/M2tZpOrGOn/0Rwe', '2026-09-07 14:46:51.717', '2026-09-30 11:40:02.31', 'David', true, 0, '2026-09-09 11:06:28.725', '484906b7ced5ff4e4bab787fefffc7c7bb8c559d64f022297a89902b4ae75c19', NULL, 0, NULL, NULL, NULL, 'f64ecccb-0865-49c4-82ba-f943f8645997', 1, 1, 0, NULL, 0, true, NULL, NULL, 'FREE', NULL);


--
-- Data for Name: _LeadTags; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('ca47915c-8e5c-4362-8082-28f71e16c78f', 'dde74dc6ba35c5504b95189dfb94b1174d037956359907e2348445db4f3edf1f', '2026-10-12 10:18:36.837442+05:30', '0_init', '', NULL, '2026-10-12 10:18:36.837442+05:30', 0);
INSERT INTO public._prisma_migrations VALUES ('df1a9ba9-11af-4334-837b-2b8afe8953c7', '12793da25cb14bb3b905aa640a7458bd209497473a5f738646b3d1c2b53873fd', '2026-10-12 10:19:37.408655+05:30', '20261012044854_enable_tenant_rls', NULL, NULL, '2026-10-12 10:19:37.396713+05:30', 1);


--
-- Name: Activity Activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_pkey" PRIMARY KEY (id);


--
-- Name: Attachment Attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CampaignAttribution CampaignAttribution_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignAttribution"
    ADD CONSTRAINT "CampaignAttribution_pkey" PRIMARY KEY (id);


--
-- Name: Deal Deal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_pkey" PRIMARY KEY (id);


--
-- Name: FailedJob FailedJob_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FailedJob"
    ADD CONSTRAINT "FailedJob_pkey" PRIMARY KEY (id);


--
-- Name: FlowNode FlowNode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowNode"
    ADD CONSTRAINT "FlowNode_pkey" PRIMARY KEY (id);


--
-- Name: Flow Flow_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Flow"
    ADD CONSTRAINT "Flow_pkey" PRIMARY KEY (id);


--
-- Name: Followup Followup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Followup"
    ADD CONSTRAINT "Followup_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PipelineStage PipelineStage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PipelineStage"
    ADD CONSTRAINT "PipelineStage_pkey" PRIMARY KEY (id);


--
-- Name: Pipeline Pipeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pipeline"
    ADD CONSTRAINT "Pipeline_pkey" PRIMARY KEY (id);


--
-- Name: Tag Tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _LeadTags _LeadTags_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_LeadTags"
    ADD CONSTRAINT "_LeadTags_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Activity_leadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Activity_leadId_idx" ON public."Activity" USING btree ("leadId");


--
-- Name: Activity_leadId_occurredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Activity_leadId_occurredAt_idx" ON public."Activity" USING btree ("leadId", "occurredAt");


--
-- Name: Activity_occurredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Activity_occurredAt_idx" ON public."Activity" USING btree ("occurredAt");


--
-- Name: Attachment_createdById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attachment_createdById_idx" ON public."Attachment" USING btree ("createdById");


--
-- Name: Attachment_followupId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attachment_followupId_idx" ON public."Attachment" USING btree ("followupId");


--
-- Name: Attachment_leadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attachment_leadId_idx" ON public."Attachment" USING btree ("leadId");


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_performedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_performedById_idx" ON public."AuditLog" USING btree ("performedById");


--
-- Name: AuditLog_targetUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_targetUserId_idx" ON public."AuditLog" USING btree ("targetUserId");


--
-- Name: AuditLog_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON public."AuditLog" USING btree ("tenantId", "createdAt");


--
-- Name: AuditLog_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_tenantId_idx" ON public."AuditLog" USING btree ("tenantId");


--
-- Name: CampaignAttribution_leadId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CampaignAttribution_leadId_key" ON public."CampaignAttribution" USING btree ("leadId");


--
-- Name: Deal_pipelineId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Deal_pipelineId_idx" ON public."Deal" USING btree ("pipelineId");


--
-- Name: Deal_stageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Deal_stageId_idx" ON public."Deal" USING btree ("stageId");


--
-- Name: Deal_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Deal_tenantId_idx" ON public."Deal" USING btree ("tenantId");


--
-- Name: FailedJob_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FailedJob_createdAt_idx" ON public."FailedJob" USING btree ("createdAt");


--
-- Name: FailedJob_queueName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FailedJob_queueName_idx" ON public."FailedJob" USING btree ("queueName");


--
-- Name: FailedJob_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FailedJob_status_idx" ON public."FailedJob" USING btree (status);


--
-- Name: FlowNode_flowId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FlowNode_flowId_idx" ON public."FlowNode" USING btree ("flowId");


--
-- Name: FlowNode_flowId_nodeKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FlowNode_flowId_nodeKey_key" ON public."FlowNode" USING btree ("flowId", "nodeKey");


--
-- Name: Flow_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Flow_tenantId_idx" ON public."Flow" USING btree ("tenantId");


--
-- Name: Followup_assignedToId_completed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Followup_assignedToId_completed_idx" ON public."Followup" USING btree ("assignedToId", completed);


--
-- Name: Followup_completed_dueAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Followup_completed_dueAt_idx" ON public."Followup" USING btree (completed, "dueAt");


--
-- Name: Followup_dueAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Followup_dueAt_idx" ON public."Followup" USING btree ("dueAt");


--
-- Name: Followup_leadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Followup_leadId_idx" ON public."Followup" USING btree ("leadId");


--
-- Name: Lead_tenantId_assignedToId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lead_tenantId_assignedToId_idx" ON public."Lead" USING btree ("tenantId", "assignedToId");


--
-- Name: Lead_tenantId_phoneNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Lead_tenantId_phoneNumber_key" ON public."Lead" USING btree ("tenantId", "phoneNumber");


--
-- Name: Lead_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lead_tenantId_status_idx" ON public."Lead" USING btree ("tenantId", status);


--
-- Name: Lead_tenantId_updatedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lead_tenantId_updatedAt_idx" ON public."Lead" USING btree ("tenantId", "updatedAt");


--
-- Name: Message_leadId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_leadId_createdAt_idx" ON public."Message" USING btree ("leadId", "createdAt");


--
-- Name: Message_leadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_leadId_idx" ON public."Message" USING btree ("leadId");


--
-- Name: Message_messageId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Message_messageId_key" ON public."Message" USING btree ("messageId");


--
-- Name: Notification_userId_isRead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_isRead_idx" ON public."Notification" USING btree ("userId", "isRead");


--
-- Name: PipelineStage_pipelineId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PipelineStage_pipelineId_idx" ON public."PipelineStage" USING btree ("pipelineId");


--
-- Name: Pipeline_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pipeline_tenantId_idx" ON public."Pipeline" USING btree ("tenantId");


--
-- Name: Tag_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tag_tenantId_idx" ON public."Tag" USING btree ("tenantId");


--
-- Name: Tag_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tag_tenantId_name_key" ON public."Tag" USING btree ("tenantId", name);


--
-- Name: Tenant_wabaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tenant_wabaId_key" ON public."Tenant" USING btree ("wabaId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_tenantId_idx" ON public."User" USING btree ("tenantId");


--
-- Name: _LeadTags_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_LeadTags_B_index" ON public."_LeadTags" USING btree ("B");


--
-- Name: Activity Activity_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Activity Activity_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attachment Attachment_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attachment Attachment_followupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES public."Followup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attachment Attachment_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachment"
    ADD CONSTRAINT "Attachment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CampaignAttribution CampaignAttribution_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignAttribution"
    ADD CONSTRAINT "CampaignAttribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Deal Deal_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Deal Deal_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Deal Deal_pipelineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES public."Pipeline"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Deal Deal_stageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES public."PipelineStage"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Deal Deal_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowNode FlowNode_flowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowNode"
    ADD CONSTRAINT "FlowNode_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES public."Flow"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Flow Flow_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Flow"
    ADD CONSTRAINT "Flow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Followup Followup_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Followup"
    ADD CONSTRAINT "Followup_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Followup Followup_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Followup"
    ADD CONSTRAINT "Followup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Followup Followup_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Followup"
    ADD CONSTRAINT "Followup_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lead Lead_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PipelineStage PipelineStage_pipelineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PipelineStage"
    ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES public."Pipeline"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Pipeline Pipeline_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pipeline"
    ADD CONSTRAINT "Pipeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tag Tag_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_reportsToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _LeadTags _LeadTags_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_LeadTags"
    ADD CONSTRAINT "_LeadTags_A_fkey" FOREIGN KEY ("A") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _LeadTags _LeadTags_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_LeadTags"
    ADD CONSTRAINT "_LeadTags_B_fkey" FOREIGN KEY ("B") REFERENCES public."Tag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Activity" ENABLE ROW LEVEL SECURITY;

--
-- Name: Attachment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Attachment" ENABLE ROW LEVEL SECURITY;

--
-- Name: Deal; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Deal" ENABLE ROW LEVEL SECURITY;

--
-- Name: Followup; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Followup" ENABLE ROW LEVEL SECURITY;

--
-- Name: Lead; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;

--
-- Name: Pipeline; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Pipeline" ENABLE ROW LEVEL SECURITY;

--
-- Name: User; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

--
-- Name: Activity tenant_isolation_activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_activity ON public."Activity" USING ((EXISTS ( SELECT 1
   FROM public."Lead"
  WHERE (("Lead".id = "Activity"."leadId") AND ("Lead"."tenantId" = current_setting('app.current_tenant_id'::text, true))))));


--
-- Name: Attachment tenant_isolation_attachment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_attachment ON public."Attachment" USING (((EXISTS ( SELECT 1
   FROM public."Lead"
  WHERE (("Lead".id = "Attachment"."leadId") AND ("Lead"."tenantId" = current_setting('app.current_tenant_id'::text, true))))) OR (EXISTS ( SELECT 1
   FROM public."User"
  WHERE (("User".id = "Attachment"."createdById") AND ("User"."tenantId" = current_setting('app.current_tenant_id'::text, true)))))));


--
-- Name: Deal tenant_isolation_deal; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_deal ON public."Deal" USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: Followup tenant_isolation_followup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_followup ON public."Followup" USING ((EXISTS ( SELECT 1
   FROM public."Lead"
  WHERE (("Lead".id = "Followup"."leadId") AND ("Lead"."tenantId" = current_setting('app.current_tenant_id'::text, true))))));


--
-- Name: Lead tenant_isolation_lead; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_lead ON public."Lead" USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: Pipeline tenant_isolation_pipeline; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_pipeline ON public."Pipeline" USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: User tenant_isolation_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_user ON public."User" USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- PostgreSQL database dump complete
--

