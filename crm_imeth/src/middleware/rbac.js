/**
 * RBAC Middleware — Role-Based Access Control
 *
 * Usage:
 *   const { requireRoles } = require('../middleware/rbac');
 *
 *   router.get('/admin-only', requireRoles('ADMIN'), handler);
 *   router.get('/admin-or-lead', requireRoles(['ADMIN', 'TEAM_LEAD']), handler);
 *   router.get('/manage', requireRoles('ADMIN', 'TEAM_LEAD'), handler);
 */

/**
 * Factory function that returns an Express middleware enforcing role access.
 * SUPER_ADMIN is always granted access unconditionally.
 *
 * @param {...(string|string[])} allowedRoles - Role string(s) or an array of role strings
 * @returns {Function} Express middleware function
 */
function requireRoles(...allowedRoles) {
  // Support both requireRoles('ADMIN', 'TEAM_LEAD') and requireRoles(['ADMIN', 'TEAM_LEAD'])
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    // 1. Must be authenticated — req.user and req.user.role must be populated
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication is required to access this resource.',
      });
    }

    const userRole = req.user.role;

    // 2. SUPER_ADMIN bypasses all role restrictions unconditionally (platform-wide access)
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    // 3. Check if user's role is in the allowed list
    if (!roles.includes(userRole)) {
      console.warn(
        `[RBAC] Access denied — User ${req.user.userId || req.user.id || 'unknown'} (role: ${userRole}) attempted to access a route restricted to: [${roles.join(', ')}]`
      );
      return res.status(403).json({
        success: false,
        error: `Forbidden: Insufficient privileges. Required role(s): ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = { requireRoles };
