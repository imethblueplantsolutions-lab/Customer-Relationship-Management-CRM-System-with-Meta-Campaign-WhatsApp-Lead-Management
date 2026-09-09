const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token from the Authorization header and
 * attaches the decoded payload (including tenantId) to req.user.
 */
const prisma = require('../config/db');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token from the Authorization header and
 * attaches the decoded payload (including tenantId) to req.user.
 * Also checks tokenVersion for immediate session revocation upon password changes.
 */
const authenticate = async (req, res, next) => {
  // Allow CORS preflight
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_jwt_secret_key');

    // Optional tokenVersion check if user ID is in payload
    if (decoded.userId && decoded.tokenVersion !== undefined) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { tokenVersion: true, isActive: true }
      });
      if (!dbUser || !dbUser.isActive || dbUser.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({ success: false, error: 'Session revoked or user inactive' });
      }
    }

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

