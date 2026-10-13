# Hugging Face Spaces Backend Deployment Blueprint
## High-Performance 2 vCPU / 16GB RAM Server Deployment for Meta CRM

---

## 1. Executive Summary & Infrastructure Overview

### 1.1 The Hugging Face Spaces Opportunity
While Hugging Face Spaces was originally designed for Machine Learning demos, its **Docker SDK** allows hosting any containerized backend. 

| Feature | Standard Free Tier (Render / Railway / Fly) | Hugging Face Spaces (Docker SDK) |
| :--- | :--- | :--- |
| **vCPU** | 0.1 - 0.5 shared vCPU | **2 Dedicated vCPUs** |
| **RAM** | 512 MB | **16 GB RAM** |
| **Sleep Inactivity** | 15 minutes (aggressive sleep) | **48 Hours** (keeps awake with 1 daily ping) |
| **WebSockets** | Often throttled or disconnections | **Native Full-Duplex WebSockets** |
| **Monthly Cost** | Free tier with heavy limits | **$0.00 / month forever** |

### 1.2 The Two Golden Rules
To deploy to Hugging Face Spaces successfully, your Docker container must obey two non-negotiable networking rules:
1. **Port 7860**: Hugging Face’s internal reverse proxy only forwards public external traffic (`https://<space-name>.hf.space`) to container port **`7860`**.
2. **Host 0.0.0.0**: You cannot bind to `localhost` or `127.0.0.1`. You must bind to `0.0.0.0` to receive incoming traffic from the internal Docker bridge network.

---

## 2. Monorepo Challenge & Solution

Your repository (`CRM_repo`) is structured as a **monorepo**:
```
CRM_repo/
├── crm_imeth/                   <-- Backend Node.js, Express, Prisma, BullMQ
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── ...
├── crm_imeth/crm-frontend-next/ <-- Next.js 16 Frontend
├── CRM_LANDING_PAGE/
└── docs/
```

> [!WARNING]
> Hugging Face Spaces expects the `Dockerfile` and `README.md` to be at the **root** of the Git repository pushed to it.
> If you push the entire `CRM_repo` root directly, Hugging Face will not locate the backend's `package.json` and build will fail.

### Solution: Git Subtree Push
We use `git subtree push --prefix crm_imeth huggingface main`. This automatically extracts the `crm_imeth` directory and pushes it as the root of the Hugging Face Space repository without altering your primary GitHub monorepo structure.

---

## 3. Step-by-Step Implementation Steps

### Phase 1: Backend Code Preparation

#### 1. Update Default Port in `crm_imeth/src/index.js`
Update line 61 of [`crm_imeth/src/index.js`](file:///d:/Imeth-blueplanet/meta_CRM/CRM_repo/crm_imeth/src/index.js#L61) to default to `7860`:

```javascript
// Hugging Face strictly requires port 7860 and host 0.0.0.0
const PORT = process.env.PORT || 7860;
```

#### 2. Verify Server Binding & Health Endpoints
Confirm that the server listens on `0.0.0.0`:
```javascript
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Meta CRM Server & WebSockets running on port ${PORT}`);
});
```

Ensure both `/health` and `/api/health` return status 200 for keep-alive pings:
```javascript
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

---

### Phase 2: Docker Containerization (`crm_imeth/Dockerfile`)

> [!IMPORTANT]
> **Prisma & Linux Distro Compatibility:**
> Prisma requires OpenSSL to initialize its query engine. While Alpine Linux is very small, missing `openssl` or musl library issues can cause runtime crashes (`libquery_engine-linux-musl`).
> Using `node:20-slim` (Debian-based) ensures seamless OpenSSL and Prisma compatibility while keeping the image size around ~160MB.

Create `crm_imeth/Dockerfile`:

```dockerfile
# Stage 1: Base Image (Node 20 Debian Slim for Prisma OpenSSL stability)
FROM node:20-slim

# Install OpenSSL and required build dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Set container working directory
WORKDIR /app

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including production and dev for Prisma CLI)
RUN npm ci

# Generate Prisma Client binary engine
RUN npx prisma generate

# Copy source code and configuration files
COPY . .

# Set default Node environment to production
ENV NODE_ENV=production
ENV PORT=7860

# Hugging Face Spaces reverse proxy requires port 7860
EXPOSE 7860

# Launch server with IPv4 resolution flag for Supabase/Upstash reliability
CMD ["npm", "start"]
```

Create `crm_imeth/.dockerignore`:
```
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
crm-frontend
crm-frontend-next
CRM_LANDING_PAGE
docs
uploads/*
!uploads/.gitkeep
```

---

### Phase 3: Hugging Face Metadata Header (`crm_imeth/README.md`)

Hugging Face Spaces reads YAML frontmatter at the very top of `README.md` to configure the runtime environment.

Create/Update `crm_imeth/README.md`:

```markdown
---
title: Meta CRM Backend
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Meta CRM Node.js Backend API
Enterprise Customer Relationship Management backend running on Node.js, Express, Socket.IO, BullMQ, and Prisma.

- **Port:** 7860
- **Compute:** 2 vCPU, 16GB RAM
- **Engine:** Docker SDK
```

---

### Phase 4: Hugging Face Space Creation & Secrets Configuration

1. Log in or create a free account at [huggingface.co](https://huggingface.co).
2. Click your profile avatar (top right) $\rightarrow$ **New Space**.
3. Fill in the Space settings:
   - **Space Name:** `meta-crm-backend` (or your preferred name)
   - **License:** MIT or Private
   - **Space SDK:** Select **Docker**
   - **Docker Template:** Select **Blank**
   - **Space Hardware:** Select **CPU Basic (Free - 2 vCPU, 16GB RAM)**
4. Click **Create Space**.
5. Navigate to **Settings** $\rightarrow$ **Variables and secrets**.
6. Add the following **Secrets** (Never commit these to git!):

| Secret Key | Source / Value Description |
| :--- | :--- |
| `DATABASE_URL` | Supabase Transaction Pooler URL (`postgresql://...:6543/postgres?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct Connection URL (`postgresql://...:5432/postgres`) |
| `REDIS_URL` | Upstash Redis connection string (`rediss://...`) |
| `JWT_SECRET` | Strong random encryption secret |
| `FRONTEND_URL` | `https://customer-relationship-management-cr-eight.vercel.app` |
| `META_ACCESS_TOKEN` | WhatsApp Business System User Access Token |
| `META_PHONE_NUMBER_ID` | Meta WhatsApp Cloud API Phone Number ID |
| `META_WABA_ID` | WhatsApp Business Account ID |
| `META_VERIFY_TOKEN` | Webhook verification string |
| `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` | SMTP Email credentials |

---

### Phase 5: Deployment via Git Subtree

In PowerShell from your root repository directory (`d:\Imeth-blueplanet\meta_CRM\CRM_repo`):

```powershell
# 1. Add Hugging Face remote (replace YOUR_USERNAME with your HF handle)
git remote add huggingface https://huggingface.co/spaces/YOUR_USERNAME/meta-crm-backend

# 2. Stage and commit changes in local repo
git add crm_imeth/
git commit -m "feat(deploy): configure Dockerfile, README, and port 7860 for Hugging Face Spaces"

# 3. Push only the crm_imeth folder as the root of the Hugging Face Space
git subtree push --prefix crm_imeth huggingface main
```

> [!TIP]
> **Subtree Update Shortcut:**
> If you make future updates to the backend, run:
> ```powershell
> git subtree push --prefix crm_imeth huggingface main
> ```
> To avoid typing this repeatedly, we can create a `deploy-hf.ps1` helper script.

---

### Phase 6: Automated 24/7 Keep-Alive (Defeating 48h Sleep)

Hugging Face free CPU spaces sleep after **48 hours of zero incoming HTTP traffic**.

To keep BullMQ queues processing background leads and Socket.IO real-time alerts running **24/7/365 for $0**:

1. Go to [cron-job.org](https://cron-job.org) and register a free account.
2. Click **Create Cronjob**.
3. **Title:** `Meta CRM Backend Keep-Alive`
4. **URL:** `https://YOUR_USERNAME-meta-crm-backend.hf.space/health`
5. **Schedule:** Every 12 hours (or daily).
6. **Request Method:** `GET`
7. Save.

Each ping resets the 48-hour inactivity counter, giving you permanent 24/7 uptime.

---

### Phase 7: Frontend & Webhook Synchronization

1. **Update Vercel Environment Variables:**
   - Go to your Vercel project dashboard.
   - Set `NEXT_PUBLIC_BACKEND_URL` = `https://YOUR_USERNAME-meta-crm-backend.hf.space`
   - Set `NEXT_PUBLIC_WS_URL` = `https://YOUR_USERNAME-meta-crm-backend.hf.space`
   - Trigger a redeployment on Vercel.

2. **Update Meta WhatsApp Webhook Callback:**
   - In developers.facebook.com:
   - Set Callback URL = `https://YOUR_USERNAME-meta-crm-backend.hf.space/api/webhook`
   - Verify token with `META_VERIFY_TOKEN`.

---

## 4. Verification & Testing Matrix

| Test Step | Verification Command / URL | Expected Result |
| :--- | :--- | :--- |
| **Health Check** | `GET https://<space>.hf.space/health` | `HTTP 200 {"status": "healthy"}` |
| **Auth Service** | `POST https://<space>.hf.space/api/auth/login` | `HTTP 200` with JWT token |
| **Prisma Engine** | `GET https://<space>.hf.space/api/leads` | Database records queried via Supabase |
| **BullMQ Worker** | Inspect Hugging Face Space **Logs** tab | `⚡ BullMQ Webhook Queue Active` |
| **Socket.IO Engine** | Browser DevTools Network tab $\rightarrow$ WS | Connection status 101 Switching Protocols |
