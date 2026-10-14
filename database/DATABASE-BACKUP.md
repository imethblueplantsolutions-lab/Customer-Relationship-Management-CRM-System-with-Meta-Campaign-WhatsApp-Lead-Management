# 💾 Railway PostgreSQL Backup & Disaster Recovery Guide (DATABASE-BACKUP.md)

![Backup Status](https://img.shields.io/badge/Backup-Complete_DDL_%2B_Data-success?style=for-the-badge&logo=postgresql)
![Format](https://img.shields.io/badge/Format-Portable_SQL_Inserts-blue?style=for-the-badge)
![Target](https://img.shields.io/badge/Compatibility-Railway_/_PostgreSQL_15--18-0B0D0E?style=for-the-badge&logo=railway)

---

## 1. Overview

This document details the database backup files generated for this repository, restoration instructions for **Railway PostgreSQL**, and automated off-site disaster recovery protocols.

### Active Backup File
- **File Path**: [`database/backups/agency_crm_full_backup.sql`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/database/backups/agency_crm_full_backup.sql)
- **Engine**: PostgreSQL 18.6
- **Contents**: Full DDL schema creation + all Table Constraints + Row-Level Security Policies + Data `INSERT` statements for all tables.
- **Flags**: `--inserts --clean --if-exists --no-owner --no-acl` (Ensures zero permission friction when importing into Railway or Supabase).

---

## 2. Restoring to Railway PostgreSQL

### Option A: Using the `psql` CLI (Recommended)
Retrieve your Railway database connection string from the Railway Dashboard (under **PostgreSQL Service** ➔ **Variables** ➔ `DATABASE_URL`):

```bash
# Example Railway Connection URL:
# postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway

# Restore the full backup file directly into Railway:
psql "postgresql://postgres:[PASSWORD]@[HOST].railway.app:[PORT]/railway" -f database/backups/agency_crm_full_backup.sql
```

### Option B: Using the Railway CLI
If you have the Railway CLI authenticated on your workstation:

```bash
# 1. Link to your project
railway link

# 2. Open an interactive database session or pipe the SQL backup
railway connect < database/backups/agency_crm_full_backup.sql
```

### Option C: Restoring to Local PostgreSQL
To restore on a local development instance:

```bash
# Set password and execute psql
set PGPASSWORD=admin
psql -h localhost -p 5432 -U postgres -d agency_crm -f database/backups/agency_crm_full_backup.sql
```

---

## 3. Post-Restore Verification Checklist

After importing the backup, run the following verification query to ensure all rows, sequences, and RLS policies are intact:

```sql
-- 1. Verify record counts
SELECT 
  (SELECT count(*) FROM "Tenant") AS tenants,
  (SELECT count(*) FROM "User") AS users,
  (SELECT count(*) FROM "Lead") AS leads,
  (SELECT count(*) FROM "Pipeline") AS pipelines,
  (SELECT count(*) FROM "PipelineStage") AS stages,
  (SELECT count(*) FROM "Activity") AS activities,
  (SELECT count(*) FROM "Followup") AS followups,
  (SELECT count(*) FROM "Message") AS messages,
  (SELECT count(*) FROM "Flow") AS flows,
  (SELECT count(*) FROM "FlowNode") AS flow_nodes,
  (SELECT count(*) FROM "Notification") AS notifications;

-- Expected output:
-- tenants: 2, users: 8, leads: 7, pipelines: 1, stages: 5, activities: 11, followups: 5, messages: 3, flows: 1, flow_nodes: 5, notifications: 12.

-- 2. Verify RLS is active and forced on sensitive tables
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname IN ('Lead', 'User', 'Deal', 'Pipeline', 'Activity', 'Followup', 'Attachment');
```

---

## 4. Automated Encrypted Backup Runbook

In addition to static SQL backups, this repository contains an enterprise automated disaster recovery backup script at:
[`crm_imeth/scripts/dr/backup.sh`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/scripts/dr/backup.sh)

### Capabilities:
1. Streams `pg_dump` directly from Railway.
2. Compresses the data stream on-the-fly with `gzip -9`.
3. Encrypts the payload using OpenSSL **AES-256-CBC** with PBKDF2 key derivation.
4. Generates a timestamped encrypted artifact: `backups/crm_backup_YYYYMMDD_HHMMSS.sql.gz.enc`.

### Execution:
```bash
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST].railway.app:[PORT]/railway"
export BACKUP_ENCRYPTION_KEY="your-strong-secret-passphrase"

bash crm_imeth/scripts/dr/backup.sh
```
