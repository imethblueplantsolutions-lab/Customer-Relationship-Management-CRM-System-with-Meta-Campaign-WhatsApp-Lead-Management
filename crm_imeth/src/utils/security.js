const prisma = require('../config/db');

/**
 * Asserts that a target userId belongs strictly to the given tenantId and is active.
 * Throws a 403 Forbidden error if the user is from another tenant, inactive, or non-existent.
 *
 * @param {string} userId - The target user ID to validate
 * @param {string} tenantId - The requesting tenant ID
 * @returns {Promise<boolean>}
 */
async function assertUserBelongsToTenant(userId, tenantId) {
  if (!userId) return true;

  if (!tenantId) {
    const error = new Error('Tenant context is required for user assignment verification');
    error.statusCode = 400;
    error.status = 400;
    throw error;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      tenantId: true,
    },
  });

  if (!user) {
    const error = new Error('Forbidden: Assigned user does not exist or is inactive within your organization');
    error.statusCode = 403;
    error.status = 403;
    throw error;
  }

  return true;
}

module.exports = {
  assertUserBelongsToTenant,
};
