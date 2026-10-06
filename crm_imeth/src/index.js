const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const redisClient = require('./config/redis');
const { isRedisAvailable } = require('./config/redis');
const { extractTenantMiddleware } = require('./middleware/tenant');
const sanitizeMiddleware = require('./middleware/sanitize');

// Allowed origins: Vercel production + local dev
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://customer-relationship-management-cr-eight.vercel.app',
  'https://customer-relationship-management-crm-system-with-ojf1z9i48.vercel.app', // legacy preview URL
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

function corsOriginHandler(origin, callback) {
  // Allow requests with no origin (mobile apps, Postman, server-to-server)
  if (!origin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  callback(new Error(`CORS: Origin '${origin}' is not allowed`));
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Public uploads directory is protected against IDOR via /api/attachments route

// Initialize Socket.IO (Redis adapter attached only when Redis is available)
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'Cache-Control', 'Pragma', 'Expires', 'x-requested-with'],
    credentials: true,
  }
});

// Attempt to attach Redis adapter for Socket.IO (non-blocking)
let redisAdapterAttached = false;
function setupRedisAdapter() {
  if (redisAdapterAttached) return;
  try {
    if (redisClient && isRedisAvailable()) {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      pubClient.on('error', (err) => console.warn('⚠️  Redis pubClient error:', err.message));
      subClient.on('error', (err) => console.warn('⚠️  Redis subClient error:', err.message));
      io.adapter(createAdapter(pubClient, subClient));
      redisAdapterAttached = true;
      console.log('✅ Socket.IO Redis adapter attached');
    }
  } catch (err) {
    console.warn('⚠️  Failed to setup Redis adapter:', err.message, '— using in-memory adapter');
  }
}

if (redisClient) {
  redisClient.on('ready', setupRedisAdapter);
  redisClient.on('connect', setupRedisAdapter);
}
setTimeout(setupRedisAdapter, 3000);

// Socket.IO Authentication & Tenant Room Allocation
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_jwt_secret_key');
    socket.user = decoded;
    socket.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    console.warn('[Socket Auth Error]:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const tenantRoom = `tenant:${socket.tenantId}`;
  const userRoom = `user:${socket.user?.userId || socket.user?.id}`;

  socket.join(tenantRoom);
  socket.join(userRoom);
  console.log(`🔌 [Socket.IO] Client connected: ${socket.id} (Tenant: ${socket.tenantId}, User Room: ${userRoom})`);

  socket.on('disconnect', () => {
    socket.leave(tenantRoom);
    socket.leave(userRoom);
    console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Export io
module.exports = { app, server, io };

// Initialize BullMQ background workers only if Redis is available
if (redisClient) {
  try {
    require('./workers/webhookWorker');
    require('./workers/broadcastWorker');
  } catch (err) {
    console.warn('⚠️  BullMQ worker failed to initialize:', err.message, '— background processing disabled');
  }
}

// Security Headers (Helmet — full suite)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled: API server, no HTML rendering; CSP managed by Vercel on frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Vercel frontend to load API resources
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Force HTTPS for 1 year
  frameguard: { action: 'deny' },  // Clickjacking protection
  noSniff: true,                   // MIME type sniffing prevention
  xssFilter: true,                 // Legacy XSS filter header
}));

// CORS — strict whitelist (replaces wildcard '*')
app.use(cors({
  origin: corsOriginHandler,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'Cache-Control', 'Pragma', 'Expires', 'x-requested-with'],
  credentials: true,
}));

// Global Rate Limiter: 1000 requests per 15 minutes on all /api/* routes (DDoS mitigation & burst-safe)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  skip: (req) => req.path === '/health', // Never rate-limit health checks
});

// Strict Auth Rate Limiter: 10 requests per 15 minutes on /api/auth/* (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please wait 15 minutes.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// Gzip/Brotli response compression (~80% bandwidth reduction on JSON payloads)
const compression = require('compression');
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Public Routes (Bypassing tenant middleware)
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/auth', require('./routes/auth'));

// Protected Routes (Behind Tenant Context Injection)
app.use(extractTenantMiddleware);
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/pipelines', require('./routes/pipelines'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/flows', require('./routes/flows'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/tenant', require('./routes/tenant'));
app.use('/api/users', require('./routes/users'));
app.use('/api/hierarchy', require('./routes/hierarchy'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin-jobs', require('./routes/adminJobs'));
app.use('/api/broadcast', require('./routes/broadcast'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start HTTP Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`======================================================`);
  console.log(`🚀 Meta CRM Server & WebSockets running on port ${PORT}`);
  console.log(`⚡ BullMQ Webhook Queue & Worker Pool Active (Concurrency: 25)`);
  console.log(`📡 Socket.IO Real-Time Engine Active with Redis Adapter`);
  console.log(`🔑 Auth & JWT Service Mounted at /api/auth`);
  console.log(`⚙️ Settings Service Mounted at /api/settings`);
  console.log(`👥 Users & Agent Routing Mounted at /api/users`);
  console.log(`======================================================`);

  // Start Overdue Task Monitor & Sales Agent Notifier
  try {
    const { startOverdueChecker } = require('./services/overdueChecker');
    startOverdueChecker(io, 60000);
  } catch (err) {
    console.warn('⚠️  Failed to start Overdue Checker service:', err.message);
  }
});

