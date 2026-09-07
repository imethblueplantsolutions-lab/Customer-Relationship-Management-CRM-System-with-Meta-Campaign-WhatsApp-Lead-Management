const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token from the Authorization header and
 * attaches the decoded payload (including tenantId) to req.user.
 */
const authenticate = (req, res, next) => {
  // Allow CORS preflight
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    console.warn('[Auth Middleware] Invalid or expired JWT:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

/**
 * Role authorization middleware.
 * Usage: authorize(['ADMIN', 'TEAM_LEAD'])
 */
const authorize = (roles = []) => (req, res, next) => {
  if (!req.user || (roles.length && !roles.includes(req.user.role))) {
    return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges' });
  }
  next();
};

module.exports = { authenticate, authorize };

