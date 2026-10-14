# 🌱 Database Seed Data & Live Export (SEED-DATA.md)

![Seeding](https://img.shields.io/badge/Seed-Production_Ready-success?style=for-the-badge&logo=node.js)
![Dataset](https://img.shields.io/badge/Live_Data-Exported_to_Markdown-blue?style=for-the-badge)
![Database](https://img.shields.io/badge/Target-Railway_PostgreSQL-0B0D0E?style=for-the-badge&logo=railway)

---

## 1. Overview & Execution Guide

This document fulfills two critical requirements:
1. **Developer & Staging Seeding Runbook**: Instructions and default credential fixtures for bootstrapping a fresh database.
2. **Complete Data Snapshot in Markdown**: The full, exact record dump of the active database formatted into readable Markdown tables.

### How to Seed a Fresh Database
To seed the database using Prisma Client:

```bash
# Navigate to the backend directory
cd crm_imeth

# Run standard Prisma seed
node prisma/seed.js

# Or initialize the complete organizational hierarchy test set
node scripts/setupHierarchyData.js
```

---

## 2. Default Seed Accounts & Role Credentials

The seed scripts provision standard multi-tier organizational roles. In development and staging environments, these accounts allow immediate verification of permissions:

| Role | Name | Email Address | Default Password | Hierarchy Placement |
| :--- | :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Super Admin | `superadmin123@crm.com` | `superadmin123` | Root Platform Operator |
| **`ADMIN`** | Imeth Dewmina | `admin@crm.com` | `admin123` | Organization Owner |
| **`TEAM_LEAD`** | Anthony | `teamlead@crm.com` | `teamlead123` | Reports to Admin (`admin@crm.com`) |
| **`AGENT`** | Alex | `agent@crm.com` | `agent123` | Reports to Team Lead (`teamlead@crm.com`) |
| **`ADMIN (OTP Test)`**| OTP Test Admin | `imethblueplantsolutions@gmail.com`| `Test@1234` | Triggers first-login email OTP flow |
| **`TEAM_LEAD 2`** | Sarah Jenkins | `teamlead2@crm.com` | `teamlead123` | Second Department Lead |
| **`AGENT 2`** | David | `agent2@crm.com` | `agent123` | Reports to Team Lead 2 |
| **`AGENT 3`** | Sam | `sam@crm.com` | `agent123` | Reports to Team Lead 1 |

---

## 3. Live Database Data Snapshot (Markdown Dump)

The tables below represent the exact snapshot of data exported from the active PostgreSQL database. Sensitive hashes and authentication tokens have been sanitized while preserving structural integrity.

### 3.1. Table: `Tenant` (2 Records)

| id | name | companyAddress | wabaId | metaPhoneNumberId | createdAt |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `WABA_ID_TEST` | Acme Digital Agency | `null` | `2848081548882258` | `1270783929459090` | `2026-08-31T06:08:03.043Z` |
| `8a21d63f-e8a7-41a0-b9c2-a44a1cdc978e` | Default Organization | `null` | `WABA_ID_TEST` | `null` | `2026-10-08T05:41:01.855Z` |

---

### 3.2. Table: `User` (8 Records)

| id | name | email | role | reportsToId | tenantId | isActive | isFirstLogin | subscription | createdAt |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `c1ac2218-86cd-4543-83a0-43ade735720d` | Super Admin | `superadmin123@crm.com` | `SUPER_ADMIN` | `null` | `8a21d63f-e8a7...` | `true` | `false` | `FREE` | `2026-10-08T05:41:02.427Z` |
| `5dcd1f31-27c6-4dc2-9f6f-db002fd35d2b` | Imeth Dewmina | `admin@crm.com` | `ADMIN` | `null` | `8a21d63f-e8a7...` | `true` | `false` | `FREE` | `2026-09-07T14:46:51.717Z` |
| `97ccbbdf-1fd8-428d-8542-65a9d2447b34` | Anthony | `teamlead@crm.com` | `TEAM_LEAD` | `5dcd1f31-27c6...` | `8a21d63f-e8a7...` | `true` | `false` | `FREE` | `2026-09-07T14:46:51.717Z` |
| `1f06b787-c048-46f7-8c21-822c2e2d79c5` | Alex | `agent@crm.com` | `AGENT` | `97ccbbdf-1fd8...` | `8a21d63f-e8a7...` | `true` | `false` | `FREE` | `2026-09-07T14:46:51.717Z` |
| `9f1aee5f-1b3c-4dae-831c-f3cfce3d28cc` | OTP Test Admin | `imethblueplantsolutions@gmail.com` | `ADMIN` | `null` | `8a21d63f-e8a7...` | `true` | `true` | `FREE` | `2026-10-08T05:41:02.478Z` |
| `f64ecccb-0865-49c4-82ba-f943f8645997` | Sarah Jenkins | `teamlead2@crm.com` | `TEAM_LEAD` | `5dcd1f31-27c6...` | `WABA_ID_TEST` | `true` | `false` | `FREE` | `2026-09-30T11:40:02.280Z` |
| `f212917c-8d64-41f8-a8de-9ef4ee7951d9` | Sam | `sam@crm.com` | `AGENT` | `97ccbbdf-1fd8...` | `WABA_ID_TEST` | `true` | `true` | `FREE` | `2026-09-08T06:56:35.898Z` |
| `5b29f14f-0ad7-48d1-b595-8cceae615630` | David | `agent2@crm.com` | `AGENT` | `f64ecccb-0865...` | `WABA_ID_TEST` | `true` | `true` | `FREE` | `2026-09-07T14:46:51.717Z` |

---

### 3.3. Table: `Lead` (7 Records)

| id | phoneNumber | name | status | category | tenantId | assignedToId | createdAt |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `34637030-3187-4e0a-97f1-de93a24391d0` | `15550000000` | Test User | `CONVERTED` | Meta Ad | `WABA_ID_TEST` | `null` | `2026-08-31T06:08:03.206Z` |
| `a1295cdf-3b98-4cb2-8f5b-ff8d712673c4` | `+94 77 950 8456` | Imeth | `NEW` | Manual Entry | `WABA_ID_TEST` | `1f06b787-c048...` (Alex) | `2026-08-31T08:04:17.745Z` |
| `88a73b42-a5e4-4405-be1b-6542e68e3b88` | `15559876545` | Jane Marketing 3 | `NEW` | Referral | `WABA_ID_TEST` | `1f06b787-c048...` (Alex) | `2026-08-31T07:41:10.424Z` |
| `ab350204-2aff-482c-95f0-02e3aa857abb` | `+15555575633` | Dwight Schrute | `NEW` | Manual Entry | `WABA_ID_TEST` | `1f06b787-c048...` (Alex) | `2026-09-08T05:37:11.658Z` |
| `da92f8f0-0cad-482f-be9e-33991dfd78e0` | `+15553100403` | Michael Scott | `CONTACTED` | Manual Entry | `WABA_ID_TEST` | `1f06b787-c048...` (Alex) | `2026-09-08T05:36:49.263Z` |
| `6825b19d-f134-444d-91c8-fb29974d0d5d` | `+15559113799` | System Audit Lead | `NEW` | Manual Entry | `WABA_ID_TEST` | `5b29f14f-0ad7...` (David)| `2026-09-08T07:17:21.617Z` |
| `fa335e64-5423-478a-bde9-4c5060fbccb3` | `1111111111` | Laskahan | `NEW` | Manual Entry | `WABA_ID_TEST` | `5b29f14f-0ad7...` (David)| `2026-09-08T07:38:47.542Z` |

---

### 3.4. Table: `Pipeline` & `PipelineStage`

#### `Pipeline` (1 Record)
| id | tenantId | name | createdAt |
| :--- | :--- | :--- | :--- |
| `f61503e6-7431-406c-9fe0-de5e64d63072` | `WABA_ID_TEST` | Tourism Pipeline | `2026-09-04T05:07:54.090Z` |

#### `PipelineStage` (5 Records)
| id | pipelineId | name | color | position |
| :--- | :--- | :--- | :---: | :---: |
| `f9fecb77-b6ce-41d0-8a7b-a5af1e493ba2` | `f61503e6-7431...` | Lead In | `#94a3b8` | 0 |
| `ea4f98fe-6182-4484-971f-20f25491f988` | `f61503e6-7431...` | Contact Made | `#3b82f6` | 1 |
| `87eb2da3-aa1b-4ef3-a2c6-f79093ef8573` | `f61503e6-7431...` | Proposal Sent | `#eab308` | 2 |
| `e1353f72-c2a0-4831-b96c-4b281568a774` | `f61503e6-7431...` | Won | `#22c55e` | 3 |
| `678a5049-9c01-45c3-b635-2edf97115015` | `f61503e6-7431...` | Lost | `#ef4444` | 4 |

---

### 3.5. Table: `Followup` (5 Records)

| id | leadId | assignedToId | type | dueAt | note | completed |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `fe0b35ba-71f4...` | `88a73b42...` | `1f06b787...` | `CALL` | `null` | Urgent callback inquiry | `false` |
| `a7035488-e704...` | `6825b19d...` | `5dcd1f31...` | `CALL` | `2026-09-09` | Call client regarding Meta WhatsApp API | `true` |
| `995b7eef-1b69...` | `fa335e64...` | `5b29f14f...` | `DEMO` | `2026-09-11` | Product Demonstration Session | `false` |
| `bebb3486-59ec...` | `fa335e64...` | `5b29f14f...` | `CALL` | `2026-09-03` | Urgent Call | `false` |
| `78498a6f-0be3...` | `a1295cdf...` | `1f06b787...` | `CALL` | `2026-09-02` | Follow-up call | `false` |

---

### 3.6. Table: `Message` (3 Records)

| id | messageId | leadId | direction | source | body | status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `ab5440f9...` | `outbound_1788162070458` | `88a73b42...` | `OUTBOUND` | `CRM` | Hi Jane, we have received your inquiry. | `sent` |
| `cc46b05d...` | `outbound_1788163466408` | `a1295cdf...` | `OUTBOUND` | `CRM` | Hello! Welcome to Blue Planet CRM. | `sent` |
| `50f7401d...` | `outbound_1788853686999` | `fa335e64...` | `OUTBOUND` | `CRM` | Hi there, how can we assist you today? | `sent` |

---

### 3.7. Table: `Flow` & `FlowNode` (Chatbot Graph)

#### `Flow` (1 Record)
| id | tenantId | name | status | triggerType | executionCount |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `9bbb0fef-030a-464f-a062-50143ce98503` | `WABA_ID_TEST` | Customer Welcome Bot | `active` | `keyword` | 0 |

#### `FlowNode` (5 Records)
| id | flowId | nodeKey | nodeType | posX | posY | config |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `16a6c1b7...` | `9bbb0fef...` | `start` | `start` | 233 | -41 | `{"next_node_key": "condition_1"}` |
| `de92d0da...` | `9bbb0fef...` | `condition_1` | `condition` | 232 | 111 | `{"subject_key": "price"}` |
| `74cac567...` | `9bbb0fef...` | `send_message_3` | `send_message` | 65 | 255 | `{"text": "Here are our pricing packages."}` |
| `58cdb88a...` | `9bbb0fef...` | `handoff_2` | `handoff` | 242 | 353 | `{"department": "Sales Team"}` |
| `7b2f332f...` | `9bbb0fef...` | `end_5` | `end` | 250 | 542 | `{}` |

---

### 3.8. Table: `Notification` (12 Records)

| id | userId | type | title | isRead | createdAt |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `49858acb...` | `1f06b787...` (Alex) | `LEAD_ASSIGNED` | Lead Assigned to You (Dwight Schrute) | `true` | `2026-09-08` |
| `6c413d85...` | `1f06b787...` (Alex) | `FOLLOWUP_ASSIGNED` | New Follow-up Assigned to You (Jane) | `true` | `2026-09-08` |
| `c46a3409...` | `1f06b787...` (Alex) | `LEAD_ASSIGNED` | New Lead Assigned (Michael Scott) | `true` | `2026-09-08` |
| `ef8b5b09...` | `1f06b787...` (Alex) | `LEAD_ASSIGNED` | New Lead Assigned (System Audit Lead)| `true` | `2026-09-08` |
| `e51fdfa6...` | `5b29f14f...` (David)| `LEAD_ASSIGNED` | New Lead Assigned (Laskahan) | `true` | `2026-09-08` |
| `1b1df953...` | `5b29f14f...` (David)| `LEAD_ASSIGNED` | Lead Reassigned to You | `true` | `2026-09-08` |
| `cfc07cba...` | `5b29f14f...` (David)| `FOLLOWUP_ASSIGNED` | New Follow-up Assigned (DEMO) | `false`| `2026-09-08` |
| `1a5f4e6d...` | `f212917c...` (Sam) | `LEAD_ASSIGNED` | New Meta WhatsApp Lead | `false`| `2026-09-10` |
| `5ab2bdff...` | `f212917c...` (Sam) | `NEW_MESSAGE` | New WhatsApp Message | `false`| `2026-09-10` |
| `22c98ecf...` | `1f06b787...` (Alex) | `TASK_OVERDUE` | Overdue Task: CALL | `false`| `2026-10-01` |
| `b6b51368...` | `5b29f14f...` (David)| `TASK_OVERDUE` | Overdue Task: DEMO | `false`| `2026-10-01` |
| `dad7ab8a...` | `5b29f14f...` (David)| `TASK_OVERDUE` | Overdue Task: CALL | `false`| `2026-10-01` |

---

### 3.9. Empty Tables (Ready for Tenant Data)
- **`Deal`**: 0 rows
- **`Attachment`**: 0 rows
- **`Tag`**: 0 rows
- **`AuditLog`**: 0 rows
- **`CampaignAttribution`**: 0 rows
