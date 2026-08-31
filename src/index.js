require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { extractTenantMiddleware } = require('./middleware/tenant');

// Initialize BullMQ background workers
require('./workers/webhookWorker');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & CORS
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Webhook bypasses tenant middleware to ensure immediate 200 OK
app.use('/api/webhook', require('./routes/webhook'));

// Rest of the API sits behind Tenant Context Injection
app.use(extractTenantMiddleware);
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/leads', require('./routes/leads'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`🚀 Meta CRM Server running on port ${PORT}`);
  console.log(`⚡ BullMQ Webhook Queue & Worker Pool Active (Concurrency: 25)`);
  console.log(`🔒 Multi-Tenant Context Injection Middleware Active`);
  console.log(`💾 Redis Cache Layer & Distributed Locking Active`);
  console.log(`======================================================`);
});
