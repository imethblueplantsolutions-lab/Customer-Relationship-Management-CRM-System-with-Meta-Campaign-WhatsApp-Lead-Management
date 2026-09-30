const { AsyncLocalStorage } = require('async_hooks');
const jwt = require('jsonwebtoken');

const tenantStorage = new AsyncLocalStorage();

const extractTenantMiddleware = (req, res, next) => {
  // Allow CORS preflight requests to pass without tenant check
  if (req.method === 'OPTIONS') {
    return next();
  }

  let tenantId = null;

  // Extract from JWT Authorization header first (Cryptographically signed source of truth)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_jwt_secret_key');
      req.user = decoded;
      if (decoded.tenantId) {
        tenantId = decoded.tenantId; // Authenticated JWT is immutable and authoritative
      }
    } catch (err) {
      console.warn('[Tenant Middleware] Invalid or expired JWT token:', err.message);
    }
  }

  // Fallback to x-tenant-id header only for unauthenticated/machine requests
  if (!tenantId) {
    tenantId = req.headers['x-tenant-id'] || req.user?.organizationId;
  }

  // Attempt to resolve tenant via Meta Webhook WABA ID
  if (!tenantId && req.body?.entry?.[0]?.id) {
    tenantId = req.body.entry[0].id; 
  }

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant context could not be resolved. Please login or supply x-tenant-id header.' });
  }

  tenantStorage.run({ tenantId }, () => next());
};

module.exports = { tenantStorage, extractTenantMiddleware };
