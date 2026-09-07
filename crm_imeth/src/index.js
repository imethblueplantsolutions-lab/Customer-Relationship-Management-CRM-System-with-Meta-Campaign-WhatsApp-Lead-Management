require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redisClient = require('./config/redis');
const { extractTenantMiddleware } = require('./middleware/tenant');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO with Redis Adapter
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

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

// Initialize BullMQ background workers
require('./workers/webhookWorker');

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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start HTTP Server
server.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`🚀 Meta CRM Server & WebSockets running on port ${PORT}`);
  console.log(`⚡ BullMQ Webhook Queue & Worker Pool Active (Concurrency: 25)`);
  console.log(`📡 Socket.IO Real-Time Engine Active with Redis Adapter`);
  console.log(`🔑 Auth & JWT Service Mounted at /api/auth`);
  console.log(`⚙️ Settings Service Mounted at /api/settings`);
  console.log(`👥 Users & Agent Routing Mounted at /api/users`);
  console.log(`======================================================`);
});
