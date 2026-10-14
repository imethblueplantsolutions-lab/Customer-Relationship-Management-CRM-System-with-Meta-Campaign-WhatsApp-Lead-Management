# Customer Relationship Management (CRM) System

A modern, production-grade CRM platform featuring Meta Campaign & WhatsApp lead management, real-time activity timelines, automated follow-ups, and multi-tenant sales pipeline tracking.

## 🚀 Key Features

- **Meta Ads Integration**: Direct webhook ingestion for Meta (Facebook & Instagram) ad leads with full campaign attribution.
- **WhatsApp Integration**: Real-time two-way messaging and automated reply logging.
- **Lead Management**: Complete lifecycle tracking with customizable pipeline stages (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`).
- **Timeline & Activity Log**: Granular event logging (calls, meetings, notes, system assignments) with real-time socket updates and inline editing.
- **Follow-ups & Reminders**: Scheduled tasks with 24-hour date/time pickers and custom task type categorization.

## 📁 Repository Structure

- `database/`: Database architecture, 5 core docs, RLS policies, and SQL backups.
- `crm_imeth/`: Express.js backend API, Prisma ORM, Redis queues, and WebSocket server.
- `crm_imeth/crm-frontend-next/`: Next.js 16 (React 19) dashboard built with Tailwind CSS.

---

## 🗄️ 5 Database Docs Before You Vibe Code

Comprehensive database documentation, schema reference, versioned migrations, and full dataset dump:

1. **[DATA-MODEL.md](database/DATA-MODEL.md)** - High-level domain architecture, 17-table Mermaid ERD, entity cardinality matrix, multi-tenant boundaries, and lifecycles.
2. **[SCHEMA.md](database/SCHEMA.md)** - Exhaustive data dictionary: field types, nullability, defaults, foreign keys, compound indexes, and unique constraints.
3. **[MIGRATIONS.md](database/MIGRATIONS.md)** - Chronological migration history (`0_init`, `20261012044854_enable_tenant_rls`), Railway deployment procedures, and rollback drills.
4. **[RLS-POLICIES.md](database/RLS-POLICIES.md)** - Railway PostgreSQL RLS deep dive, `FORCE ROW LEVEL SECURITY` for superusers, session variable injection, and isolation verification queries.
5. **[SEED-DATA.md](database/SEED-DATA.md)** - Seeding runbook, test credentials, and **complete active database snapshot exported into Markdown tables** ("data in MD").

### 💾 Railway PostgreSQL Backup & Restore
- **SQL Backup Dump**: [`database/backups/agency_crm_full_backup.sql`](database/backups/agency_crm_full_backup.sql)
- **Restoration Runbook**: [`database/DATABASE-BACKUP.md`](database/DATABASE-BACKUP.md)

---

## ☁️ Cloud Deployment & Free Tier Architecture ($0/mo)

- **[RENDER_SUPABASE_UPSTASH_MIGRATION_PLAN.md](docs/RENDER_SUPABASE_UPSTASH_MIGRATION_PLAN.md)**: End-to-end guide for deploying backend to Render (Web Service), Supabase (PostgreSQL), Upstash (Redis), and Resend (HTTPS Email) with 24/7 keep-alive automation.

