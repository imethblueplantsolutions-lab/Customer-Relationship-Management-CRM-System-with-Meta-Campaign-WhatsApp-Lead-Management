# 🗄️ Database Architecture, Documentation & Backups

> **"5 Database Docs Before You Vibe Code"**
> Complete technical reference, data dictionary, versioned migrations, multi-tenant security policies, live dataset snapshot, and Railway PostgreSQL backup for the Meta WhatsApp CRM system.

---

## 📚 The 5 Core Database Documents

| # | Document | Direct Link | Purpose & Highlights |
| :-: | :--- | :--- | :--- |
| **1** | **Data Model** | [`DATA-MODEL.md`](./DATA-MODEL.md) | High-level domain architecture, 17-table Mermaid ERD, entity cardinality matrix, multi-tenant boundaries, and entity lifecycles. |
| **2** | **Schema Reference** | [`SCHEMA.md`](./SCHEMA.md) | Exhaustive data dictionary: field types, nullability, defaults, foreign keys, compound indexes, and unique constraints. |
| **3** | **Migrations Runbook**| [`MIGRATIONS.md`](./MIGRATIONS.md) | Chronological migration history (`0_init`, `20261012044854_enable_tenant_rls`), Railway deployment procedures, and rollback drills. |
| **4** | **Row-Level Security**| [`RLS-POLICIES.md`](./RLS-POLICIES.md) | Railway PostgreSQL RLS deep dive, `FORCE ROW LEVEL SECURITY` for superusers, session variable injection, and isolation verification queries. |
| **5** | **Seed Data & Dump** | [`SEED-DATA.md`](./SEED-DATA.md) | Seeding runbook, test credentials, and **complete active database snapshot exported into Markdown tables** ("data in MD"). |

---

## 💾 Database Backups

- **Full SQL Backup**: [`backups/agency_crm_full_backup.sql`](./backups/agency_crm_full_backup.sql)
  - Complete schema + data dump generated with `--inserts --clean --if-exists --no-owner --no-acl`.
  - Ready for 1-click import into Railway PostgreSQL or local PostgreSQL.
- **Restoration Runbook**: [`DATABASE-BACKUP.md`](./DATABASE-BACKUP.md)
  - Step-by-step restoration commands for Railway CLI, `psql`, Supabase, and automated off-site AES-256 encrypted backups.
