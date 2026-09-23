# Customer Relationship Management (CRM) System

A modern, production-grade CRM platform featuring Meta Campaign & WhatsApp lead management, real-time activity timelines, automated follow-ups, and multi-tenant sales pipeline tracking.

## 🚀 Key Features

- **Meta Ads Integration**: Direct webhook ingestion for Meta (Facebook & Instagram) ad leads with full campaign attribution.
- **WhatsApp Integration**: Real-time two-way messaging and automated reply logging.
- **Lead Management**: Complete lifecycle tracking with customizable pipeline stages (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`).
- **Timeline & Activity Log**: Granular event logging (calls, meetings, notes, system assignments) with real-time socket updates and inline editing.
- **Follow-ups & Reminders**: Scheduled tasks with 24-hour date/time pickers and custom task type categorization.

## 📁 Repository Structure

- `crm_imeth/`: Express.js backend API, Prisma ORM, Redis queues, and WebSocket server.
- `crm_imeth/crm-frontend-next/`: Next.js 16 (React 19) dashboard built with Tailwind CSS.
