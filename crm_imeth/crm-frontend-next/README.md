# CRM Frontend Dashboard (`crm-frontend-next`)

Next.js 16 (React 19) web dashboard for the Meta CRM platform.

## 🛠️ Tech Stack

- **Framework**: Next.js 16.3 (App Router)
- **UI & Components**: React 19, Tailwind CSS v4, Lucide React
- **State & Real-Time**: Socket.IO Client, Sonner toasts
- **Flow & Charts**: React Flow (`@xyflow/react`), Recharts

## 📋 Environment Configuration

Create a `.env.local` file in `crm_imeth/crm-frontend-next/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server on port 3001
npm run dev

# Build for production
npm run build
```
