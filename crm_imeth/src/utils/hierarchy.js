const prisma = require('../config/db');

/**
 * Recursively resolves all subordinate user IDs reporting downstream to a manager.
 * Returns an array containing the manager's userId plus all downstream subordinate user IDs.
 *
 * @param {string} managerId - The user ID of the manager
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<string[]>} Array of user IDs in this manager's squad/branch
 */
async function getDownstreamUserIds(managerId, tenantId) {
  if (!managerId || !tenantId) return [];

  // Fetch all users in the tenant to build the hierarchy tree graph
  const allUsers = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, reportsToId: true }
  });

  const subordinateMap = new Map();
  for (const u of allUsers) {
    if (u.reportsToId) {
      if (!subordinateMap.has(u.reportsToId)) {
        subordinateMap.set(u.reportsToId, []);
      }
      subordinateMap.get(u.reportsToId).push(u.id);
    }
  }

  // Breadth-First-Search traversal
  const result = new Set([managerId]);
  const queue = [managerId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const directSubs = subordinateMap.get(currentId) || [];
    for (const subId of directSubs) {
      if (!result.has(subId)) {
        result.add(subId);
        queue.push(subId);
      }
    }
  }

  return Array.from(result);
}

/**
 * Returns the scoped user IDs for a user based on their role in the hierarchy.
 * - SUPER_ADMIN & ADMIN: null (unrestricted tenant-wide access)
 * - TEAM_LEAD: array of [userId, ...allDownstreamSubordinates]
 * - AGENT: array of [userId]
 *
 * @param {object} user - req.user object containing { userId, role, tenantId }
 * @returns {Promise<string[]|null>}
 */
async function getHierarchyScopedUserIds(user) {
  if (!user) return [];
  const role = user.role || 'AGENT';
  const userId = user.userId || user.id;
  const tenantId = user.tenantId;

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return null; // Unrestricted access across the tenant
  }

  if (role === 'TEAM_LEAD') {
    return await getDownstreamUserIds(userId, tenantId);
  }

  // AGENT or fallback
  return userId ? [userId] : [];
}

/**
 * Generates the Prisma where filter for leads based on hierarchical RBAC.
 *
 * @param {object} user - req.user object
 * @returns {Promise<object>} Prisma where condition fragment
 */
async function getLeadScopeCondition(user) {
  const role = user?.role || 'AGENT';
  const userId = user?.userId || user?.id;
  const tenantId = user?.tenantId;

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return {};
  }

  if (role === 'TEAM_LEAD') {
    const squadIds = await getDownstreamUserIds(userId, tenantId);
    return {
      OR: [
        { assignedToId: { in: squadIds } },
        { assignedToId: null } // Team Leads can view unassigned leads to triage & assign to squad
      ]
    };
  }

  // AGENT: Only explicitly assigned leads
  return {
    assignedToId: userId
  };
}

module.exports = {
  getDownstreamUserIds,
  getHierarchyScopedUserIds,
  getLeadScopeCondition
};
