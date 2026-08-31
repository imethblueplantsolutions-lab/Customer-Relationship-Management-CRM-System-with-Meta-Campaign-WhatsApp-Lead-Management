require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const webhookRoutes = require('./routes/webhook');
const leadsRoutes = require('./routes/leads');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Meta CRM WhatsApp Lead Manager'
  });
});

// API Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Meta CRM Server is running on port ${PORT}`);
  console.log(`📡 Webhook Endpoint: http://localhost:${PORT}/api/webhook`);
  console.log(`🩺 Health Check:     http://localhost:${PORT}/health`);
  console.log(`📊 Dashboard API:    http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`=========================================`);
});
