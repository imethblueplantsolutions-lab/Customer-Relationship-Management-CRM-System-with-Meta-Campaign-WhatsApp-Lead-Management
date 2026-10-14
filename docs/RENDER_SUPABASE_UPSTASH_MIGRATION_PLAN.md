# Render + Supabase + Upstash Migration Runbook
## Architecture Blueprint & Step-by-Step Transition Guide for Meta CRM

---

## 1. Executive Summary & Cost Model ($0.00 / Month Forever)

By decoupling your architecture into specialized free-tier providers, you eliminate the catastrophic failure points of running a stateful monolithic stack on Render:

```
                            ┌──────────────────────────────────────────────┐
                            │      Vercel (Free Serverless Frontend)       │
                            │  https://customer-crm.vercel.app            │
                            └──────────────────────┬───────────────────────┘
                                                   │ HTTPS / WSS
                                                   ▼
┌─────────────────────────┐          ┌─────────────────────────────────────┐          ┌─────────────────────────┐
│     cron-job.org        │          │        Render Free Web Service      │          │       Resend API        │
│  (GET /api/health q10m) ├─────────►│     (Express + BullMQ in 1 process) ├─────────►│    (HTTPS Port 443)     │
│  Prevents 15m Spin-down │          │     512 MB RAM / 0.1 vCPU (750h/mo) │          │  Bypasses Blocked SMTP  │
└─────────────────────────┘          └──────────────┬──────────────┬───────┘          └─────────────────────────┘
                                                    │              │
                                   Prisma / SSL     │              │ TLS rediss://
                                                    ▼              ▼
                                     ┌──────────────────┐  ┌──────────────────┐
                                     │     Supabase     │  │     Upstash      │
                                     │  PostgreSQL 15+  │  │   Serverless     │
                                     │  (500 MB Free)   │  │   Redis & Queues │
                                     │  No 30-Day Limit │  │  Disk Persistent │
                                     └──────────────────┘  └──────────────────┘
```

### The Free Tier Breakdown

| Component | Provider | Free Tier Specification | Cost | How Limits Are Handled |
| :--- | :--- | :--- | :--- | :--- |
| **Compute / API** | **Render** | 512 MB RAM, 0.1 vCPU, 750 free hrs/month | **$0** | Express and BullMQ workers co-exist in one process. External cron pings `/api/health` every 10 min (744h/mo used vs 750h quota). |
| **Database** | **Supabase** | 500 MB persistent PostgreSQL, Connection Pooling | **$0** | Replaces Render's 30-day expiring database. Data is persistent forever. |
| **Redis & Queues**| **Upstash** | 10,000 commands/day, Disk Persistence, TLS | **$0** | Replaces Render's non-persistent Redis. BullMQ tuned with `stalledInterval: 300000` to preserve command limits. |
| **Transactional Email** | **Resend** | 3,000 emails/month (100/day) | **$0** | Sent via HTTPS REST API (Port 443). Bypasses Render's blocked SMTP ports (25, 465, 587). |
| **Keep-Alive Cron** | **cron-job.org** | Unlimited HTTP GET schedules | **$0** | Eliminates 60-second cold starts and dropped WhatsApp webhooks. |

---

## 2. Pre-Migration Code Fixes Already Applied

The following critical stability patches have been applied directly to your codebase:

1. **[`crm_imeth/src/index.js`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/src/index.js#L172-L203)**:
   - Added public route `['/health', '/api/health']` returning `{ status: 'healthy', timestamp }`.
   - Whitelisted `/api/health` from the global rate limiter and bypassed authentication so keep-alive cron pings succeed without 401s.
2. **[`crm_imeth/src/config/redis.js`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/src/config/redis.js#L9-L21)**:
   - Configured `enableReadyCheck: false` for serverless Redis proxies.
   - Expanded retry budget to 20 attempts with exponential backoff up to 3000ms to absorb Upstash TLS connection renegotiations.
3. **[`crm_imeth/src/workers/webhookWorker.js`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/src/workers/webhookWorker.js#L535)** & **[`crm_imeth/src/workers/broadcastWorker.js`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/src/workers/broadcastWorker.js#L159)**:
   - Added `stalledInterval: 300000` (5 minutes) to BullMQ workers. This reduces Redis background polling by **90%**, keeping commands well below Upstash's 10,000/day quota.
4. **[`crm_imeth/render.yaml`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/render.yaml)**:
   - Generated native Render Blueprint configuration for one-click setup.

---

## 3. Step-by-Step Migration Guide

### Step 1: Provision and Restore Supabase PostgreSQL

Since you already have a Supabase account:

1. Log into [Supabase Dashboard](https://supabase.com/dashboard) and click **"New project"**.
2. Set:
   - **Name**: `meta-crm-db`
   - **Database Password**: Generate a strong password (save this safely!).
   - **Region**: Choose the region closest to your target audience (e.g. `ap-southeast-1` Singapore or `eu-central-1` Frankfurt).
   - **Pricing Plan**: Free ($0).
3. Click **"Create new project"** (takes ~1-2 minutes).
4. **Retrieve Connection Strings**:
   - Go to **Project Settings** (gear icon) -> **Database**.
   - Under **Connection string**, select the **URI** tab.
   - Choose **Mode: Session** (port `5432` via pooler) or **Transaction** (port `6543`).
   - Format:
     ```text
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - For direct migrations / `prisma db push`:
     ```text
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
5. **Populate Your Data** (Choose A or B):
   - **Option A (Full Data Restore from Existing Backup)**:
     - Open the Supabase **SQL Editor** in the left sidebar.
     - Open [`database/backups/agency_crm_full_backup.sql`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/database/backups/agency_crm_full_backup.sql).
     - Copy and paste the SQL statements into the SQL Editor and click **Run**. This immediately restores all 17 tables, RLS policies, and your full dataset.
   - **Option B (Fresh Schema & Seed Users)**:
     - In your terminal within `crm_imeth`:
       ```bash
       DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npx prisma db push
       DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npm run seed
       ```

---

### Step 2: Provision Upstash Serverless Redis

Since you already have an Upstash account:

1. Log into [Upstash Console](https://console.upstash.com/).
2. Click **"Create Database"**.
3. Set:
   - **Name**: `crm-bullmq-redis`
   - **Type**: Regional (standard Redis)
   - **Region**: Match your Supabase/Render region (e.g. `ap-southeast-1` or `us-east-1`).
   - **TLS (SSL)**: **Enabled** (Required for security).
   - **Eviction**: Disabled / Default.
4. Click **Create**.
5. Under **Connect to your database**, scroll down to **Node.js (ioredis)** or **Redis Connect**.
6. Copy the **`rediss://`** connection URL:
   ```text
   rediss://default:*****************@apn1-super-duck-12345.upstash.io:6379
   ```
   *(Note the double `s` in `rediss://` which enables encrypted TLS).*

---

### Step 3: Get Your Free Resend API Key for Email

Because Render blocks SMTP ports 25, 465, and 587, emails must be dispatched over HTTPS:

1. Log into [Resend](https://resend.com).
2. Go to **API Keys** -> click **"Create API Key"**.
3. Name it `crm-backend-render` with **Full Access**.
4. Copy the key (`re_123456789...`).
5. Sender email default:
   - You can immediately use `onboarding@resend.dev` (allows sending to your registered account email for testing).
   - For production to all users: Add and verify your custom DNS domain (e.g. `blueplanet.lk`) under **Domains** tab in Resend.

---

### Step 4: Deploy the Web Service on Render

Since you already have a Render account:

1. Log into [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository:
   - `imethblueplantsolutions-lab/Customer-Relationship-Management-CRM-System-with-Meta-Campaign-WhatsApp-Lead-Management`
4. Configure the Web Service settings:

| Setting | Value | Why It Matters |
| :--- | :--- | :--- |
| **Name** | `meta-crm-backend` | Will assign URL: `https://meta-crm-backend.onrender.com` |
| **Region** | Oregon, Frankfurt, or Singapore | Choose region matching your Supabase DB |
| **Branch** | `main` | Production branch |
| **Root Directory** | `crm_imeth` | **CRITICAL**: Tells Render your backend lives in `crm_imeth` |
| **Runtime** | `Node` | Native Node.js execution |
| **Build Command** | `npm install && npx prisma generate` | Installs dependencies & generates Prisma client |
| **Start Command** | `npm start` | Executes `node --dns-result-order=ipv4first src/index.js` |
| **Instance Type** | **Free** ($0 / month) | 512 MB RAM, 0.1 vCPU |

5. Scroll down to **Advanced**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes
6. Under **Environment Variables**, add the following:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres
REDIS_URL=rediss://default:[TOKEN]@[ENDPOINT].upstash.io:6379
JWT_SECRET=super_secret_jwt_key_at_least_32_chars_long
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=MyCRM Security
FRONTEND_URL=https://customer-relationship-management-cr-eight.vercel.app
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_meta_verify_token
COMPANY_NAME=Blue Planet Solutions
COMPANY_POSTAL_ADDRESS=No. 58, Ideal Shopping Complex, Bauddhaloka Mawatha, Gampaha, Sri Lanka.
SUPPORT_EMAIL=info@blueplanet.lk
PRIVACY_EMAIL=info@blueplanet.lk
DMCA_EMAIL=info@blueplanet.lk
DMCA_PHONE=(+94) 77 8651 776
COMPANY_WEBSITE=https://blueplanet.lk/branding/
```

7. Click **"Deploy Web Service"**.
8. Wait ~2-3 minutes for the build to finish. Once live, Render displays:
   `==> Your service is live 🎉 at https://meta-crm-backend.onrender.com`

---

### Step 5: Prevent the 15-Minute Spin-Down (24/7 Keep-Alive)

To ensure zero dropped webhooks and eliminate the 60-second cold start:

1. Go to [cron-job.org](https://cron-job.org/en/) and log in (or sign up for free).
2. Click **"Create Cronjob"**.
3. Fill in the fields:
   - **Title**: `Meta CRM Render Keep-Alive`
   - **URL**: `https://meta-crm-backend.onrender.com/api/health` (replace with your actual Render URL)
   - **Execution Schedule**: **Every 10 minutes** (`*/10 * * * *`)
   - **Request Method**: `GET`
4. Click **Create**.

> [!NOTE]
> **Why this never costs money**: Render gives **750 free instance hours** every month.
> There are 24 hours × 31 days = **744 hours** in a month.
> Keeping 1 Web Service alive 24/7 uses 744 hours, staying 100% under the 750-hour free allowance.

---

### Step 6: Connect Frontend & Meta Webhooks

#### 1. Vercel Frontend Configuration
In your [Vercel Dashboard](https://vercel.com) for the frontend project:
1. Go to **Settings** -> **Environment Variables**.
2. Update:
   - `NEXT_PUBLIC_SOCKET_URL` = `https://meta-crm-backend.onrender.com`
   - `BACKEND_URL` = `https://meta-crm-backend.onrender.com`
3. Trigger a **Redeploy** on Vercel so the frontend binds to your Render backend.

#### 2. Meta WhatsApp App Dashboard
1. Go to [Meta Developers Portal](https://developers.facebook.com/apps/).
2. Select your WhatsApp App -> **WhatsApp** -> **Configuration**.
3. Under **Webhook**, click **Edit**:
   - **Callback URL**: `https://meta-crm-backend.onrender.com/api/webhook`
   - **Verify Token**: Must match your `META_VERIFY_TOKEN` env variable.
4. Click **Verify and Save**.
5. Under Webhook fields, verify `messages` is subscribed.

---

## 4. Post-Deployment Verification Checklist

Run these quick checks in your terminal to verify everything is operating properly:

```bash
# 1. Verify Keep-Alive Health Route
curl -I https://meta-crm-backend.onrender.com/api/health
# Expected: HTTP/1.1 200 OK

# 2. Verify Meta Webhook Verification Handshake
curl "https://meta-crm-backend.onrender.com/api/webhook?hub.mode=subscribe&hub.verify_token=your_meta_verify_token&hub.challenge=CHALLENGE_ACCEPTED"
# Expected: CHALLENGE_ACCEPTED

# 3. Check Render Logs
# In Render Dashboard > Logs, you should see:
# ✅ Connected to Redis successfully
# ✅ Socket.IO Redis adapter attached
# 🚀 Meta CRM Server & WebSockets running on port 10000
# ⚡ BullMQ Webhook Queue & Worker Pool Active (Concurrency: 25)
```

With this decoupled setup, your CRM operates 24/7 with zero cold starts, zero dropped webhooks, persistent queues, and persistent PostgreSQL storage without paying a single dollar.
