const prisma = require('../config/db');
const { getDownstreamUserIds } = require('./hierarchy');

const ROLE_RANKS = {
  AGENT: 1,
  TEAM_LEAD: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

const REQUIRED_MANAGER_ROLES = {
  AGENT: ['TEAM_LEAD', 'ADMIN'],
  TEAM_LEAD: ['ADMIN'],
  ADMIN: ['SUPER_ADMIN'],
};

/**
 * Validates a hierarchy reporting assignment against strict tier-based rules,
 * multi-tenant boundaries, and circular dependency prevention.
 *
 * Rules enforced:
 * 1. Same-Tenant Check: Manager must strictly belong to the same tenant (403 Forbidden).
 * 2. Strict Single-Tier Reporting:
 *    - Sales Agent (1) must report strictly to Team Lead (2).
 *    - Team Lead (2) must report strictly to Admin (3).
 *    - Admin (3) must report strictly to Super Admin (4).
 *    - Super Admin (4) is root and cannot report to anyone.
 * 3. Unassigned State: Non-Super Admin users may have reportsToId = null while awaiting placement.
 * 4. Cycle Prevention: Proposed manager cannot be the user themselves or any downstream subordinate.
 *
 * @param {object} params
 * @param {string|null} [params.userId] - The subordinate user ID (null for newly created users)
 * @param {string} [params.userRole] - The subordinate's role (AGENT, TEAM_LEAD, ADMIN, SUPER_ADMIN)
 * @param {string|null} params.reportsToId - The proposed manager's user ID
 * @param {string} params.tenantId - The tenant ID context
 * @returns {Promise<{ valid: boolean, manager: object|null }>}
 */
async function validateHierarchyAssignment({ userId, userRole, reportsToId, tenantId }) {
  if (!tenantId) {
    const error = new Error('Tenant context is required for hierarchy validation');
    error.statusCode = 400;
    throw error;
  }

  // Resolve subordinate role
  let role = userRole;
  if (!role && userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { role: true, name: true, email: true },
    });
    if (!user) {
      const error = new Error('Subordinate user not found in this organization');
      error.statusCode = 404;
      throw error;
    }
    role = user.role;
  }

  const cleanReportsToId = reportsToId && typeof reportsToId === 'string' && reportsToId.trim()
    ? reportsToId.trim()
    : null;

  // Rule 0: Super Admin cannot report to anyone
  if (role === 'SUPER_ADMIN') {
    if (cleanReportsToId) {
      const error = new Error('Invalid reporting tier: Super Admins are organizational roots and cannot report to another manager');
      error.statusCode = 400;
      throw error;
    }
    return { valid: true, manager: null };
  }

  // Rule 1: If reportsToId is null, user is unassigned awaiting team placement
  if (!cleanReportsToId) {
    return { valid: true, manager: null };
  }

  // Rule 2: Self-reporting check
  if (userId && cleanReportsToId === userId) {
    const error = new Error('A user cannot report to themselves');
    error.statusCode = 400;
    throw error;
  }

  // Rule 3: Proposed manager existence & multi-tenant check
  const proposedManager = await prisma.user.findUnique({
    where: { id: cleanReportsToId },
    select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true },
  });

  if (!proposedManager) {
    const error = new Error('Proposed reporting manager does not exist');
    error.statusCode = 400;
    throw error;
  }

  // Multi-tenant boundary check (Confused Deputy guard)
  // Super Admin exception ONLY applies when the subordinate being evaluated is an ADMIN
  const isSuperAdminManagerForAdmin = role === 'ADMIN' && proposedManager.role === 'SUPER_ADMIN';
  if (proposedManager.tenantId !== tenantId && !isSuperAdminManagerForAdmin) {
    const error = new Error('Forbidden: Cross-tenant hierarchy assignment is prohibited');
    error.statusCode = 403;
    throw error;
  }

  // Inactive manager guard
  if (!proposedManager.isActive) {
    const error = new Error(`Cannot assign to an inactive manager (${proposedManager.name || proposedManager.email})`);
    error.statusCode = 400;
    throw error;
  }

  // Rule 4: Tier-Based Upward Reporting Check
  const allowedManagerRoles = Array.isArray(REQUIRED_MANAGER_ROLES[role])
    ? REQUIRED_MANAGER_ROLES[role]
    : REQUIRED_MANAGER_ROLES[role]
      ? [REQUIRED_MANAGER_ROLES[role]]
      : [];

  if (allowedManagerRoles.length > 0 && !allowedManagerRoles.includes(proposedManager.role)) {
    const roleLabels = {
      AGENT: 'Sales Agents',
      TEAM_LEAD: 'Team Leads',
      ADMIN: 'Admins',
      SUPER_ADMIN: 'Super Admins',
    };
    const expectedLabels = {
      AGENT: 'a Team Lead or Administrator',
      TEAM_LEAD: 'an Administrator',
      ADMIN: 'a Super Administrator',
    };

    const error = new Error(
      `Invalid reporting tier: ${roleLabels[role] || role} must report strictly to ${expectedLabels[role] || allowedManagerRoles.join(' or ')} (selected manager is a ${proposedManager.role})`
    );
    error.statusCode = 400;
    throw error;
  }

  // Rule 5: Circular hierarchy detection
  if (userId) {
    const subordinateIds = await getDownstreamUserIds(userId, tenantId);
    if (subordinateIds.includes(cleanReportsToId)) {
      const error = new Error(
        `Circular hierarchy detected: ${proposedManager.name || proposedManager.email} is already a downstream subordinate of this user`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return { valid: true, manager: proposedManager };
}

/**
 * Validates a batch of users being assigned to a proposed manager in bulk.
 *
 * @param {object} params
 * @param {string[]} params.userIds - Array of subordinate user IDs
 * @param {string|null} params.reportsToId - Proposed manager's user ID
 * @param {string} params.tenantId - The tenant ID context
 * @returns {Promise<{ valid: boolean, manager: object|null }>}
 */
async function validateBulkHierarchyAssignment({ userIds, reportsToId, tenantId }) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    const error = new Error('userIds array is required and cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  const cleanReportsToId = reportsToId && typeof reportsToId === 'string' && reportsToId.trim()
    ? reportsToId.trim()
    : null;

  // Validate all target users exist in the same tenant
  const targetUsers = await prisma.user.findMany({
    where: { id: { in: userIds }, tenantId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (targetUsers.length !== userIds.length) {
    const error = new Error('One or more users not found in this organization');
    error.statusCode = 400;
    throw error;
  }

  // Prevent reassigning Super Admin in batch
  const superAdminInBatch = targetUsers.find((u) => u.role === 'SUPER_ADMIN');
  if (superAdminInBatch) {
    const error = new Error('Cannot reassign the Super Admin root user in a bulk operation');
    error.statusCode = 400;
    throw error;
  }

  // If reportsToId is null, setting users to unassigned is valid
  if (!cleanReportsToId) {
    return { valid: true, manager: null };
  }

  // Validate proposed manager
  const proposedManager = await prisma.user.findUnique({
    where: { id: cleanReportsToId },
    select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true },
  });

  if (!proposedManager) {
    const error = new Error('Proposed reporting manager does not exist');
    error.statusCode = 400;
    throw error;
  }

  const allTargetUsersAreAdmin = targetUsers.every((u) => u.role === 'ADMIN');
  const isBulkSuperAdminManagerForAdmin = allTargetUsersAreAdmin && proposedManager.role === 'SUPER_ADMIN';
  if (proposedManager.tenantId !== tenantId && !isBulkSuperAdminManagerForAdmin) {
    const error = new Error('Forbidden: Cross-tenant hierarchy assignment is prohibited');
    error.statusCode = 403;
    throw error;
  }

  if (!proposedManager.isActive) {
    const error = new Error(`Cannot assign to an inactive manager (${proposedManager.name || proposedManager.email})`);
    error.statusCode = 400;
    throw error;
  }

  // Strict Tier & Tenant check for each user in the batch
  for (const user of targetUsers) {
    const isSuperAdminManagerForAdmin = user.role === 'ADMIN' && proposedManager.role === 'SUPER_ADMIN';
    if (proposedManager.tenantId !== tenantId && !isSuperAdminManagerForAdmin) {
      const error = new Error('Forbidden: Cross-tenant hierarchy assignment is prohibited');
      error.statusCode = 403;
      throw error;
    }

    const allowedManagerRoles = Array.isArray(REQUIRED_MANAGER_ROLES[user.role])
      ? REQUIRED_MANAGER_ROLES[user.role]
      : REQUIRED_MANAGER_ROLES[user.role]
        ? [REQUIRED_MANAGER_ROLES[user.role]]
        : [];

    if (allowedManagerRoles.length > 0 && !allowedManagerRoles.includes(proposedManager.role)) {
      const error = new Error(
        `Invalid reporting tier: User ${user.name || user.email} (${user.role}) cannot report to a ${proposedManager.role}. Expected ${allowedManagerRoles.join(' or ')}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Circular hierarchy check
    if (cleanReportsToId === user.id) {
      const error = new Error(`Circular hierarchy: ${user.name || user.email} cannot report to themselves`);
      error.statusCode = 400;
      throw error;
    }

    const subordinateIds = await getDownstreamUserIds(user.id, tenantId);
    if (subordinateIds.includes(cleanReportsToId)) {
      const error = new Error(
        `Circular hierarchy detected: ${proposedManager.name || proposedManager.email} is already a downstream subordinate of ${user.name || user.email}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return { valid: true, manager: proposedManager };
}

module.exports = {
  ROLE_RANKS,
  REQUIRED_MANAGER_ROLES,
  validateHierarchyAssignment,
  validateBulkHierarchyAssignment,
};
