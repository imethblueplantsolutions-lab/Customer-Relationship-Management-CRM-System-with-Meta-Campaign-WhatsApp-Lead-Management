require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const redisClient = require('./config/redis');
const { isRedisAvailable } = require('./config/redis');
const { extractTenantMiddleware } = require('./middleware/tenant');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Serve static uploads directory for local file attachments
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize Socket.IO (Redis adapter attached only when Redis is available)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attempt to attach Redis adapter for Socket.IO (non-blocking)
function setupRedisAdapter() {
  try {
    if (redisClient && isRedisAvailable()) {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      pubClient.on('error', (err) => console.warn('⚠️  Redis pubClient error:', err.message));
      subClient.on('error', (err) => console.warn('⚠️  Redis subClient error:', err.message));
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO Redis adapter attached');
    } else {
      console.warn('⚠️  Redis not available — Socket.IO using in-memory adapter (single-instance only)');
    }
  } catch (err) {
    console.warn('⚠️  Failed to setup Redis adapter:', err.message, '— using in-memory adapter');
  }
}

// Try to setup Redis adapter after a short delay to allow connection
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

// Security & CORS
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));

// Gzip/Brotli response compression (~80% bandwidth reduction on JSON payloads)
const compression = require('compression');
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Public Routes (Bypassing tenant middleware)
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/auth', require('./routes/auth'));

// Protected Routes (Behind Tenant Context Injection)
app.use(extractTenantMiddleware);
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/pipelines', require('./routes/pipelines'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/flows', require('./routes/flows'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
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

