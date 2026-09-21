# CRM Backend API (`crm_imeth`)

Express.js REST API with Prisma ORM, PostgreSQL, Redis BullMQ background workers, and Socket.IO for real-time CRM events.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache & Queues**: Redis with BullMQ
- **Real-Time**: Socket.IO
- **Storage**: Local disk storage (`uploads/`) via Multer

## 📋 Environment Configuration

Create a `.env` file in `crm_imeth/` with the following keys:

```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db?schema=public"
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
JWT_SECRET="your-jwt-secret"
FRONTEND_URL="http://localhost:3000"
```

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```
