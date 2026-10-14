# 🗄️ Database Architecture & Data Model (DATA-MODEL.md)

![Database](https://img.shields.io/badge/Database-PostgreSQL_18-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![ORM](https://img.shields.io/badge/ORM-Prisma_Client-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Deployment](https://img.shields.io/badge/Hosting-Railway_PostgreSQL-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Multi-Tenant](https://img.shields.io/badge/Architecture-Multi--Tenant_RLS-success?style=for-the-badge)

---

## 1. Executive Overview

This repository powers an enterprise-grade **Customer Relationship Management (CRM) System with Meta Campaign & WhatsApp Cloud API Lead Management**.

The database architecture is designed with **strict multi-tenant isolation**, **hierarchical team governance**, **visual chatbot workflow automation**, **omnichannel messaging (WhatsApp Cloud API)**, and **comprehensive compliance auditing** (COPPA, GDPR, CAN-SPAM, DMCA, and California ARL).

### Core Architectural Pillars
1. **Multi-Tenant Partitioning**: Every organizational entity is scoped by `tenantId`. Data access across tenants is enforced at both the ORM layer and the database kernel via PostgreSQL Row-Level Security (RLS).
2. **Organizational Hierarchy**: Self-referencing `User` model (`reportsToId`) supporting multi-tier sales structures: `SUPER_ADMIN` ➔ `ADMIN` ➔ `TEAM_LEAD` ➔ `AGENT`.
3. **Meta WhatsApp Integration**: Native capture of leads originating from Click-to-WhatsApp (CTWA) ads, inbound webhooks, and phonebook imports with campaign attribution (`CampaignAttribution`).
4. **Interactive Chatbot Flows**: Canvas-driven visual automation engine with `Flow` and `FlowNode` graphs.
5. **Sales Funnel & Engagements**: Kanban deal pipelines (`Pipeline`, `PipelineStage`, `Deal`), chronological activity audits (`Activity`), task reminders (`Followup`), and file attachments (`Attachment`).

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    Tenant ||--o{ User : "houses"
    Tenant ||--o{ Lead : "owns"
    Tenant ||--o{ Pipeline : "configures"
    Tenant ||--o{ Deal : "contains"
    Tenant ||--o{ Flow : "deploys"
    Tenant ||--o{ Tag : "maintains"
    Tenant ||--o{ AuditLog : "records"

    User ||--o{ User : "manages (reportsTo)"
    User ||--o{ Lead : "assigned to"
    User ||--o{ Deal : "owns"
    User ||--o{ Followup : "created / assigned"
    User ||--o{ Activity : "performed"
    User ||--o{ Notification : "receives"
    User ||--o{ Attachment : "uploads"
    User ||--o{ AuditLog : "performs / targeted"

    Lead ||--o| CampaignAttribution : "attributed by"
    Lead ||--o{ Message : "exchanges"
    Lead ||--o{ Followup : "scheduled for"
    Lead ||--o{ Activity : "logged on"
    Lead ||--o{ Deal : "converts into"
    Lead ||--o{ Attachment : "attached to"
    Lead }o--o{ Tag : "categorized by (_LeadTags)"

    Pipeline ||--|{ PipelineStage : "consists of"
    Pipeline ||--o{ Deal : "tracks"
    PipelineStage ||--o{ Deal : "current stage"

    Flow ||--|{ FlowNode : "executes"
    Followup ||--o{ Attachment : "attaches"

    Tenant {
        string id PK
        string name
        string companyAddress
        string wabaId UK
        string metaAccessToken
        string metaPhoneNumberId
        datetime createdAt
    }

    User {
        string id PK
        string email UK
        string name
        string role
        string reportsToId FK
        string tenantId FK
        boolean isActive
        boolean isFirstLogin
        int tokenVersion
        string subscriptionStatus
        datetime createdAt
    }

    Lead {
        string id PK
        string phoneNumber
        string name
        string status
        string category
        string tenantId FK
        string assignedToId FK
        boolean isSubscribed
        datetime createdAt
        datetime updatedAt
    }

    CampaignAttribution {
        string id PK
        string leadId FK "UK"
        string sourceUrl
        string adId
        string sourceType
        string headline
        string ctwaClid
        datetime createdAt
    }

    Message {
        string id PK
        string messageId UK
        string leadId FK
        string direction
        string source
        string body
        string status
        datetime createdAt
    }

    Followup {
        string id PK
        string leadId FK
        string createdById FK
        string assignedToId FK
        string type
        datetime dueAt
        string note
        boolean completed
        datetime createdAt
    }

    Activity {
        string id PK
        string leadId FK
        string createdById FK
        string type
        string title
        string description
        datetime occurredAt
    }

    Deal {
        string id PK
        string pipelineId FK
        string stageId FK
        string tenantId FK
        string leadId FK
        string assignedToId FK
        string title
        float value
        string currency
        string status
        datetime expectedCloseDate
    }

    Pipeline {
        string id PK
        string tenantId FK
        string name
        datetime createdAt
    }

    PipelineStage {
        string id PK
        string pipelineId FK
        string name
        string color
        int position
    }

    Flow {
        string id PK
        string tenantId FK
        string name
        string status
        string triggerType
        json triggerConfig
        int executionCount
    }

    FlowNode {
        string id PK
        string flowId FK
        string nodeKey
        string nodeType
        json config
        float posX
        float posY
    }

    Notification {
        string id PK
        string userId FK
        string type
        string title
        string body
        boolean isRead
        datetime createdAt
    }

    Attachment {
        string id PK
        string fileName
        string fileUrl
        string mimeType
        int fileSize
        bytes fileData
        string createdById FK
        string leadId FK
        string followupId FK
    }

    Tag {
        string id PK
        string tenantId FK
        string name
        string color
    }

    AuditLog {
        string id PK
        string tenantId FK
        string performedById FK
        string targetUserId FK
        string action
        json details
        datetime createdAt
    }

    FailedJob {
        string id PK
        string jobId
        string queueName
        string jobName
        json payload
        string error
        string status
        datetime createdAt
    }
}
```

---

## 3. Entity Domain Breakdown

### 3.1. Identity & Multi-Tenancy Boundary
- **`Tenant`**: Root organizational entity. Holds Meta Business API credentials (`wabaId`, `metaAccessToken`, `metaPhoneNumberId`) and company legal attributes.
- **`User`**: System actors. Roles include:
  - `SUPER_ADMIN`: Global platform operator.
  - `ADMIN`: Tenant administrator, manager of billing, team sizes, and settings.
  - `TEAM_LEAD`: Department/team leader with oversight over assigned agents and their leads.
  - `AGENT`: Front-line sales representative handling assigned leads and tasks.
  - **Self-referencing tree**: `reportsToId` points to manager's `User.id`, enabling hierarchical data filtering.

### 3.2. Lead Ingestion & Meta WhatsApp Communication
- **`Lead`**: Core customer prospect. Identified by `phoneNumber` and scoped per tenant `(tenantId, phoneNumber)`.
- **`CampaignAttribution`**: Captures Click-to-WhatsApp (CTWA) metadata (`adId`, `headline`, `ctwaClid`, `sourceUrl`).
- **`Message`**: Real-time WhatsApp messages (`INBOUND` from customer, `OUTBOUND` from agent or chatbot).
- **`Tag` & `_LeadTags`**: Many-to-many relationship enabling custom segmentation (e.g., "Hot Lead", "VIP", "Needs Quote").

### 3.3. Sales Pipeline & Conversions
- **`Pipeline`**: Customizable sales process (e.g. "Tourism Inquiries", "Enterprise B2B").
- **`PipelineStage`**: Individual ordered milestones in the funnel (e.g., "Lead In" ➔ "Contact Made" ➔ "Proposal Sent" ➔ "Won" / "Lost").
- **`Deal`**: Monetized opportunities tied to a lead, sales stage, and assigned agent.

### 3.4. Chatbot Workflow Canvas Engine
- **`Flow`**: Automated response workflow triggered by keywords or incoming webhook events.
- **`FlowNode`**: Graph nodes (`start`, `condition`, `send_message`, `handoff`, `end`) configured with coordinates (`posX`, `posY`) and execution parameters.

### 3.5. Engagements, Reminders & Security Audits
- **`Followup`**: Scheduled tasks (`CALL`, `DEMO`, `MEETING`, `MESSAGE`) with due dates, assignees, and completion toggles.
- **`Activity`**: Immutable timeline of interactions (`PHONE_CALL`, `TASK_SCHEDULED`, `TASK_COMPLETED`, `SYSTEM_ASSIGNMENT`).
- **`Attachment`**: Uploaded assets stored directly in PostgreSQL (`bytea`) or linked via cloud storage (`fileUrl`).
- **`Notification`**: Real-time push alerts for lead reassignments, mentions, and overdue followups.
- **`AuditLog`**: Tamper-evident compliance tracking for role modifications, user deletions, and export operations.
- **`FailedJob`**: Dead-letter queue for BullMQ / Redis background worker recovery.

---

## 4. Cardinality & Relationship Matrix

| Primary Entity | Related Entity | Cardinality | Foreign Key Column | Constraint Behavior (`onDelete`) | Architectural Purpose |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `Tenant` | `User` | 1 : N | `User.tenantId` | `CASCADE` | Users belong strictly to one tenant |
| `Tenant` | `Lead` | 1 : N | `Lead.tenantId` | `CASCADE` | Multi-tenant lead ownership |
| `Tenant` | `Pipeline` | 1 : N | `Pipeline.tenantId` | `CASCADE` | Isolated pipeline definitions |
| `Tenant` | `Deal` | 1 : N | `Deal.tenantId` | `CASCADE` | Tenant revenue data isolation |
| `Tenant` | `Flow` | 1 : N | `Flow.tenantId` | `CASCADE` | Isolated automated chatbot flows |
| `Tenant` | `Tag` | 1 : N | `Tag.tenantId` | `CASCADE` | Custom tags scoped per organization |
| `Tenant` | `AuditLog` | 1 : N | `AuditLog.tenantId` | `CASCADE` | Compliance audit trail boundary |
| `User` | `User` | 1 : N | `User.reportsToId` | `SET NULL` | Self-referencing management hierarchy |
| `User` | `Lead` | 1 : N | `Lead.assignedToId` | `SET NULL` | Lead ownership assignment |
| `User` | `Deal` | 1 : N | `Deal.assignedToId` | `SET NULL` | Deal representative assignment |
| `User` | `Followup` | 1 : N | `Followup.assignedToId` | `SET NULL` | Task responsibility assignment |
| `User` | `Notification`| 1 : N | `Notification.userId` | `CASCADE` | User-targeted notifications |
| `Lead` | `CampaignAttribution` | 1 : 1 | `CampaignAttribution.leadId` | `CASCADE` | Meta ad origin metadata |
| `Lead` | `Message` | 1 : N | `Message.leadId` | `CASCADE` | Full WhatsApp message stream |
| `Lead` | `Followup` | 1 : N | `Followup.leadId` | `CASCADE` | Tasks tied directly to lead |
| `Lead` | `Activity` | 1 : N | `Activity.leadId` | `CASCADE` | Chronological activity log |
| `Lead` | `Deal` | 1 : N | `Deal.leadId` | `SET NULL` | Converted lead opportunities |
| `Pipeline` | `PipelineStage` | 1 : N | `PipelineStage.pipelineId` | `CASCADE` | Ordered stages within pipeline |
| `Pipeline` | `Deal` | 1 : N | `Deal.pipelineId` | `CASCADE` | Funnel deal distribution |
| `PipelineStage` | `Deal` | 1 : N | `Deal.stageId` | `RESTRICT` | Deal location in stage |
| `Flow` | `FlowNode` | 1 : N | `FlowNode.flowId` | `CASCADE` | Graph nodes in chatbot canvas |

---

## 5. Entity Lifecycle State Machines

### 5.1. Lead Progression
```
[ NEW ] ──────> [ CONTACTED ] ──────> [ QUALIFIED ] ──────> [ WON / CONVERTED ]
   │                 │                      │
   └─────────────────┴──────────────────────┴─────────────> [ LOST / UNRESPONSIVE ]
```

### 5.2. User Authentication & Security Lifecycle
```
[ INVITED / CREATED ]
         │
         ▼
[ FIRST_LOGIN ] ──(Force OTP Validation)──> [ ACTIVE ]
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                           [ FAILED ATTEMPTS >= 5 ]     [ INACTIVE / SUSPENDED ]
                                    │
                                    ▼
                         [ LOCKED_OUT (15 min) ]
```
