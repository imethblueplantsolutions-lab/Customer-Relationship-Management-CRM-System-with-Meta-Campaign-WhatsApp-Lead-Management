# 📑 Exhaustive Database Schema Reference (SCHEMA.md)

![PostgreSQL](https://img.shields.io/badge/Engine-PostgreSQL_15--18-blue?style=for-the-badge&logo=postgresql)
![Schema](https://img.shields.io/badge/Schema-public-informational?style=for-the-badge)
![Tables](https://img.shields.io/badge/Tables-17_Core-success?style=for-the-badge)
![Encoding](https://img.shields.io/badge/Encoding-UTF--8-lightgrey?style=for-the-badge)

---

## 1. Schema Overview

This document provides the definitive data dictionary and field-by-field schema specification for the PostgreSQL database powering the Meta WhatsApp CRM system.

All primary keys utilize standard **UUID strings** (`TEXT` in PostgreSQL, generated via `uuid_generate_v4()` or application-level UUIDv4). Timestamps are recorded in **UTC** with millisecond precision (`TIMESTAMP(3)`).

---

## 2. Comprehensive Table Catalog

### 2.1. `Tenant`
Houses organizational isolation boundaries and WhatsApp Business Account credentials.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Unique tenant identifier |
| `name` | `TEXT` | `String` | No | - | - | Business / organization name |
| `companyAddress` | `TEXT` | `String?` | Yes | `null` | - | Physical postal address (CAN-SPAM) |
| `wabaId` | `TEXT` | `String?` | Yes | `null` | `UNIQUE` | WhatsApp Business Account ID |
| `metaAccessToken`| `TEXT` | `String?` | Yes | `null` | - | System user access token for Graph API |
| `metaPhoneNumberId`| `TEXT`| `String?` | Yes | `null` | - | WhatsApp Cloud API Phone Number ID |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Registration timestamp |

---

### 2.2. `User`
Manages system users, authentication, hierarchical reporting, security lockouts, and CAN-SPAM/DMCA compliance.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | User UUID |
| `name` | `TEXT` | `String?` | Yes | `null` | - | Full name |
| `phone` | `TEXT` | `String?` | Yes | `null` | - | Direct phone number |
| `bio` | `TEXT` | `String?` | Yes | `null` | - | Professional bio |
| `avatar` | `TEXT` | `String?` | Yes | `null` | - | Base64 avatar data URI or URL |
| `email` | `TEXT` | `String` | No | - | `UNIQUE` | Login email address |
| `password` | `TEXT` | `String` | No | - | - | Bcrypt hashed password |
| `role` | `TEXT` | `String` | No | `'AGENT'` | - | Role (`SUPER_ADMIN`, `ADMIN`, `TEAM_LEAD`, `AGENT`) |
| `reportsToId` | `TEXT` | `String?` | Yes | `null` | `FK -> User(id)` | Manager user ID in hierarchy |
| `isActive` | `BOOLEAN` | `Boolean` | No | `true` | - | Account active toggle |
| `isFirstLogin` | `BOOLEAN` | `Boolean` | No | `true` | - | Forces OTP onboarding on first sign-in |
| `otpHash` | `TEXT` | `String?` | Yes | `null` | - | SHA-256 hash of active 6-digit OTP |
| `otpExpiresAt` | `TIMESTAMP(3)` | `DateTime?` | Yes | `null` | - | Expiration timestamp of OTP |
| `otpAttempts` | `INTEGER` | `Int` | No | `0` | - | Consecutive failed OTP attempts |
| `pendingEmail` | `TEXT` | `String?` | Yes | `null` | - | Unconfirmed new email for email change |
| `tokenVersion` | `INTEGER` | `Int` | No | `0` | - | Invalidation token version for JWT sessions |
| `failedLoginAttempts`| `INTEGER`| `Int` | No | `0` | - | Failed password attempts |
| `lockoutUntil` | `TIMESTAMP(3)` | `DateTime?` | Yes | `null` | - | Temporary security lockout expiration |
| `maxTeamLeads` | `INTEGER` | `Int?` | Yes | `1` | - | License quota for team leads |
| `maxAgents` | `INTEGER` | `Int?` | Yes | `1` | - | License quota for agents |
| `isSubscribed` | `BOOLEAN` | `Boolean` | No | `true` | - | CAN-SPAM marketing email consent |
| `unsubscribedAt`| `TIMESTAMP(3)`| `DateTime?` | Yes | `null` | - | Date user opted out of email |
| `dmcaStrikes` | `INTEGER` | `Int` | No | `0` | - | DMCA copyright infringement strike tally |
| `subscriptionStatus`| `TEXT` | `String` | No | `'FREE'` | - | California ARL renewal status (`FREE`, `ACTIVE`, `CANCELLED`) |
| `subscriptionRenewalDate`| `TIMESTAMP(3)`| `DateTime?` | Yes | `null` | - | Subscription renewal date |
| `subscriptionPrice`| `DOUBLE PRECISION`| `Float?` | Yes | `null` | - | Price tier for auto-renewal notice |
| `tenantId` | `TEXT` | `String` | No | - | `FK -> Tenant(id)`, `INDEX` | Owning tenant ID |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Creation date |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | - | Auto-updated timestamp |

---

### 2.3. `Lead`
Stores prospects gathered from WhatsApp Cloud API webhooks, Meta ad clicks, and manual or CSV phonebook imports.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Lead UUID |
| `phoneNumber` | `TEXT` | `String` | No | - | `UNIQUE(tenantId, phoneNumber)` | WhatsApp / mobile number |
| `name` | `TEXT` | `String?` | Yes | `null` | - | Contact person full name |
| `displayName` | `TEXT` | `String?` | Yes | `null` | - | Meta WhatsApp profile display name |
| `companyName` | `TEXT` | `String?` | Yes | `null` | - | Organization / client business name |
| `designation` | `TEXT` | `String?` | Yes | `null` | - | Job title / designation |
| `whatsappNumber`| `TEXT` | `String?` | Yes | `null` | - | Formatted WhatsApp international number |
| `email` | `TEXT` | `String?` | Yes | `null` | - | Email address |
| `notes` | `TEXT` | `String?` | Yes | `null` | - | Free-text notes |
| `status` | `TEXT` | `String` | No | `'NEW'` | `INDEX(tenantId, status)` | Status (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`) |
| `category` | `TEXT` | `String?` | Yes | `null` | - | Lead source (`Meta Ad`, `Manual Entry`, `Referral`, etc.) |
| `isSubscribed` | `BOOLEAN` | `Boolean` | No | `true` | - | Marketing message opt-in status |
| `unsubscribedAt`| `TIMESTAMP(3)`| `DateTime?` | Yes | `null` | - | Timestamp of opt-out / STOP command |
| `tenantId` | `TEXT` | `String` | No | - | `FK -> Tenant(id)` | Owning tenant ID |
| `assignedToId` | `TEXT` | `String?` | Yes | `null` | `FK -> User(id)`, `INDEX(tenantId, assignedToId)` | Assigned sales agent |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Ingestion timestamp |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | `INDEX(tenantId, updatedAt)` | Last activity timestamp |

---

### 2.4. `CampaignAttribution`
Attribution metadata captured from Click-to-WhatsApp (CTWA) Meta advertisement interactions.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Attribution UUID |
| `leadId` | `TEXT` | `String` | No | - | `FK -> Lead(id)`, `UNIQUE` | Foreign key to attributed lead |
| `sourceUrl` | `TEXT` | `String?` | Yes | `null` | - | Referral landing page / ad click URL |
| `adId` | `TEXT` | `String?` | Yes | `null` | - | Meta Ad ID |
| `sourceType` | `TEXT` | `String?` | Yes | `null` | - | Source type (`ad`, `organic_whatsapp`, etc.) |
| `headline` | `TEXT` | `String?` | Yes | `null` | - | Meta Ad headline text |
| `body` | `TEXT` | `String?` | Yes | `null` | - | Meta Ad body copy |
| `ctwaClid` | `TEXT` | `String?` | Yes | `null` | - | Click-to-WhatsApp click identifier |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Attribution timestamp |

---

### 2.5. `Message`
Real-time transcript of WhatsApp messages sent and received via the Meta WhatsApp Cloud API.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Message UUID |
| `messageId` | `TEXT` | `String` | No | - | `UNIQUE` | Meta Cloud API message ID (`wamid.HB...`) |
| `leadId` | `TEXT` | `String` | No | - | `FK -> Lead(id)`, `INDEX(leadId, createdAt)` | Linked lead |
| `direction` | `TEXT` | `String` | No | `'INBOUND'` | - | `INBOUND` (from client) or `OUTBOUND` (from agent/bot) |
| `source` | `TEXT` | `String` | No | `'CRM'` | - | Origin (`CRM`, `WHATSAPP_CLOUD_API`, `BOT`) |
| `body` | `TEXT` | `String` | No | - | - | Text content of message |
| `status` | `TEXT` | `String?` | Yes | `'sent'` | - | Delivery status (`sent`, `delivered`, `read`, `failed`) |
| `timestamp` | `TEXT` | `String?` | Yes | `null` | - | Epoch string from Meta webhook |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | DB record timestamp |

---

### 2.6. `Followup`
Task and appointment scheduling for leads (calls, meetings, demos).

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Task UUID |
| `leadId` | `TEXT` | `String` | No | - | `FK -> Lead(id)`, `INDEX` | Subject lead |
| `createdById` | `TEXT` | `String?` | Yes | `null` | `FK -> User(id)` | Task creator user |
| `assignedToId` | `TEXT` | `String?` | Yes | `null` | `FK -> User(id)`, `INDEX(assignedToId, completed)` | Assigned assignee |
| `type` | `TEXT` | `String` | No | `'CALL'` | - | Task type (`CALL`, `DEMO`, `MEETING`, `MESSAGE`) |
| `dueAt` | `TIMESTAMP(3)` | `DateTime?` | Yes | `null` | `INDEX(dueAt)` | Target execution deadline |
| `note` | `TEXT` | `String?` | Yes | `null` | - | Instructions / agenda |
| `completed` | `BOOLEAN` | `Boolean` | No | `false` | `INDEX(completed, dueAt)` | Completion flag |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Creation date |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | - | Last update timestamp |

---

### 2.7. `Activity`
Immutable audit log of chronological events occurring on a lead.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Activity UUID |
| `leadId` | `TEXT` | `String` | No | - | `FK -> Lead(id)`, `INDEX(leadId, occurredAt)` | Related lead |
| `createdById` | `TEXT` | `String?` | Yes | `null` | `FK -> User(id)` | Author of the activity |
| `type` | `TEXT` | `String` | No | `'NOTE'` | - | Event type (`PHONE_CALL`, `TASK_SCHEDULED`, etc.) |
| `title` | `TEXT` | `String?` | Yes | `null` | - | Event headline |
| `description` | `TEXT` | `String?` | Yes | `null` | - | Detailed description / notes |
| `occurredAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | `INDEX(occurredAt)` | Real-world occurrence time |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | System creation time |

---

### 2.8. `Pipeline` & `PipelineStage`
Sales pipeline configuration and Kanban board columns.

#### `Pipeline`
| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Pipeline UUID |
| `tenantId` | `TEXT` | `String` | No | - | `FK -> Tenant(id)`, `INDEX` | Owning tenant |
| `name` | `TEXT` | `String` | No | - | - | Funnel name (e.g. "Direct Sales") |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Creation date |

#### `PipelineStage`
| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Stage UUID |
| `pipelineId` | `TEXT` | `String` | No | - | `FK -> Pipeline(id)`, `INDEX` | Parent pipeline |
| `name` | `TEXT` | `String` | No | - | - | Stage name ("Won", "Lost", etc.) |
| `color` | `TEXT` | `String` | No | `'#3b82f6'` | - | Hex color code for UI cards |
| `position` | `INTEGER` | `Int` | No | - | - | Zero-indexed sort column order |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Creation date |

---

### 2.9. `Deal`
Sales opportunities tracked against pipeline stages.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Deal UUID |
| `pipelineId` | `TEXT` | `String` | No | - | `FK -> Pipeline(id)`, `INDEX` | Parent pipeline |
| `stageId` | `TEXT` | `String` | No | - | `FK -> PipelineStage(id)`, `INDEX` | Current pipeline stage |
| `tenantId` | `TEXT` | `String` | No | - | `FK -> Tenant(id)`, `INDEX` | Owning tenant |
| `leadId` | `TEXT` | `String?` | Yes | `null` | `FK -> Lead(id)` | Converted contact |
| `assignedToId` | `TEXT` | `String?` | Yes | `null` | `FK -> User(id)` | Deal representative |
| `title` | `TEXT` | `String` | No | - | - | Deal title |
| `value` | `DOUBLE PRECISION`| `Float` | No | `0` | - | Monetized deal amount |
| `currency` | `TEXT` | `String` | No | `'USD'` | - | ISO-4217 Currency symbol |
| `notes` | `TEXT` | `String?` | Yes | `null` | - | Strategy / contract notes |
| `expectedCloseDate`| `TIMESTAMP(3)`| `DateTime?` | Yes | `null` | - | Forecasted closing date |
| `status` | `TEXT` | `String` | No | `'open'` | - | State (`open`, `won`, `lost`) |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Creation timestamp |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | - | Last modification timestamp |

---

### 2.10. `Flow` & `FlowNode`
Interactive visual chatbot automation graphs.

#### `Flow`
| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Flow UUID |
| `tenantId` | `TEXT` | `String` | No | - | `FK -> Tenant(id)`, `INDEX` | Owning tenant |
| `name` | `TEXT` | `String` | No | - | - | Flow display title |
| `description` | `TEXT` | `String?` | Yes | `null` | - | Purpose of chatbot flow |
| `status` | `TEXT` | `String` | No | `'draft'` | - | Status (`draft`, `active`, `paused`) |
| `triggerType` | `TEXT` | `String` | No | `'keyword'` | - | Event trigger (`keyword`, `webhook`) |
| `triggerConfig` | `JSONB` | `Json` | No | `'{}'` | - | Trigger matching criteria |
| `entryNodeId` | `TEXT` | `String?` | Yes | `null` | - | Root node key to execute first |
| `executionCount`| `INTEGER` | `Int` | No | `0` | - | Total runtime executions |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Creation timestamp |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | - | Last modification timestamp |

#### `FlowNode`
| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Node UUID |
| `flowId` | `TEXT` | `String` | No | - | `FK -> Flow(id)`, `INDEX` | Parent chatbot flow |
| `nodeKey` | `TEXT` | `String` | No | - | `UNIQUE(flowId, nodeKey)` | Unique graph node key (e.g., `start`) |
| `nodeType` | `TEXT` | `String` | No | - | - | Node type (`start`, `condition`, `send_message`, `handoff`, `end`) |
| `config` | `JSONB` | `Json` | No | `'{}'` | - | Node payload (message text, branch rules) |
| `posX` | `DOUBLE PRECISION`| `Float` | No | `0` | - | Canvas X-coordinate |
| `posY` | `DOUBLE PRECISION`| `Float` | No | `0` | - | Canvas Y-coordinate |

---

### 2.11. `Notification`
In-app alerts for tasks, reassignments, mentions, and overdue followups.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Notification UUID |
| `userId` | `TEXT` | `String` | No | - | `FK -> User(id)`, `INDEX(userId, isRead)` | Recipient user |
| `type` | `TEXT` | `String` | No | `'FOLLOWUP_ASSIGNED'` | - | Alert type (`LEAD_ASSIGNED`, `TASK_OVERDUE`, `NEW_MESSAGE`) |
| `title` | `TEXT` | `String` | No | - | - | Notification title |
| `body` | `TEXT` | `String` | No | `''` | - | Extended notification copy |
| `message` | `TEXT` | `String?` | Yes | `null` | - | Legacy message string |
| `linkUrl` | `TEXT` | `String?` | Yes | `null` | - | Actionable routing URI in frontend |
| `isRead` | `BOOLEAN` | `Boolean` | No | `false` | - | Read status flag |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Notification timestamp |

---

### 2.12. `Attachment`
Binary file payloads and linked documents.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Attachment UUID |
| `fileName` | `TEXT` | `String` | No | - | - | File basename |
| `fileUrl` | `TEXT` | `String?` | Yes | `null` | - | External CDN / S3 file URL |
| `fileType` | `TEXT` | `String?` | Yes | `null` | - | File extension/type descriptor |
| `mimeType` | `TEXT` | `String?` | Yes | `null` | - | Standard MIME type (e.g. `application/pdf`) |
| `fileSize` | `INTEGER` | `Int` | No | - | - | File size in bytes |
| `fileData` | `BYTEA` | `Bytes?` | Yes | `null` | - | Inline binary blob stored in database |
| `createdById` | `TEXT` | `String` | No | - | `FK -> User(id)`, `INDEX` | Uploader user |
| `leadId` | `TEXT` | `String?` | Yes | `null` | `FK -> Lead(id)`, `INDEX` | Associated lead |
| `followupId` | `TEXT` | `String?` | Yes | `null` | `FK -> Followup(id)`, `INDEX` | Associated task |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Upload timestamp |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | - | Last modification timestamp |

---

### 2.13. `Tag` & `_LeadTags`
Organization-scoped labels for lead segmentation.

#### `Tag`
| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Tag UUID |
| `name` | `TEXT` | `String` | No | - | `UNIQUE(tenantId, name)` | Tag name (e.g., "High Value") |
| `color` | `TEXT` | `String` | No | `'#E2E8F0'` | - | Badge color code |
| `tenantId` | `TEXT` | `String` | No | - | `FK -> Tenant(id)`, `INDEX` | Owning tenant |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Creation date |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | - | Update date |

#### `_LeadTags` (Prisma Implicit Many-to-Many Join Table)
| Column | PostgreSQL Type | Nullable | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- |
| `A` | `TEXT` | No | `FK -> Lead(id) ON DELETE CASCADE` | Lead reference |
| `B` | `TEXT` | No | `FK -> Tag(id) ON DELETE CASCADE`, `INDEX` | Tag reference |
| - | - | - | `PRIMARY KEY (A, B)` | Compound unique join |

---

### 2.14. `AuditLog`
Security and regulatory audit trail.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Log UUID |
| `tenantId` | `TEXT` | `String` | No | - | `FK -> Tenant(id)`, `INDEX(tenantId, createdAt)` | Tenant boundary |
| `performedById`| `TEXT` | `String` | No | - | `FK -> User(id)`, `INDEX` | Actor who performed action |
| `targetUserId` | `TEXT` | `String?` | Yes | `null` | `FK -> User(id)`, `INDEX` | Target of action (if user-related) |
| `action` | `TEXT` | `String` | No | - | `INDEX` | Action enum (e.g. `USER_ROLE_CHANGE`) |
| `details` | `JSONB` | `Json?` | Yes | `null` | - | Context payload (diffs, IP address) |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | - | Timestamp of audit entry |

---

### 2.15. `FailedJob`
Dead-letter queue tracking for BullMQ / Redis background workers.

| Column | PostgreSQL Type | Prisma Type | Nullable | Default | Constraints / Index | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `TEXT` | `String` | No | `uuid()` | `PRIMARY KEY` | Job record UUID |
| `jobId` | `TEXT` | `String` | No | - | - | BullMQ internal job ID |
| `queueName` | `TEXT` | `String` | No | - | `INDEX` | Queue identifier (e.g., `whatsapp-webhook`) |
| `jobName` | `TEXT` | `String` | No | - | - | Handler function name |
| `payload` | `JSONB` | `Json` | No | - | - | Job parameters and data |
| `error` | `TEXT` | `String` | No | - | - | Full stack trace / failure message |
| `status` | `TEXT` | `String` | No | `'FAILED'` | `INDEX` | Execution state |
| `createdAt` | `TIMESTAMP(3)` | `DateTime` | No | `CURRENT_TIMESTAMP` | `INDEX` | Job enqueue/failure time |
| `updatedAt` | `TIMESTAMP(3)` | `DateTime` | No | - | - | Last modification time |
