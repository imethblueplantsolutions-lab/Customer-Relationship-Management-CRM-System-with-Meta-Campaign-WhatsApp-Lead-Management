const prisma = require('../config/db');

/**
 * Default limits for the FREE tier
 */
const DEFAULT_FREE_LIMITS = {
  plan: 'FREE',
  maxTeamLeads: 1,
  maxAgents: 1,
};

/**
 * Resolves the plan tier and quota ceilings for a given tenant.
 * Hierarchy of truth:
 * 1. Admin user configuration in the tenant (maxTeamLeads / maxAgents assigned to tenant Admin)
 * 2. Fallback to DEFAULT_FREE_LIMITS (1 Team Lead, 1 Agent)
 *
 * @param {string} tenantId 
 * @returns {Promise<{ plan: string, maxTeamLeads: number, maxAgents: number }>}
 */
async function getTenantPlanLimits(tenantId) {
  if (!tenantId) {
    return { ...DEFAULT_FREE_LIMITS };
  }

  // Look up the primary tenant Admin
  const adminUser = await prisma.user.findFirst({
    where: {
      tenantId,
      role: 'ADMIN',
    },
    select: {
      maxTeamLeads: true,
      maxAgents: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const maxTeamLeads = adminUser?.maxTeamLeads !== null && adminUser?.maxTeamLeads !== undefined
    ? adminUser.maxTeamLeads
    : DEFAULT_FREE_LIMITS.maxTeamLeads;

  const maxAgents = adminUser?.maxAgents !== null && adminUser?.maxAgents !== undefined
    ? adminUser.maxAgents
    : DEFAULT_FREE_LIMITS.maxAgents;

  return {
    plan: 'FREE',
    maxTeamLeads: Math.max(1, maxTeamLeads),
    maxAgents: Math.max(1, maxAgents),
  };
}

/**
 * Aggregates current active user counts across the entire tenant.
 *
 * @param {string} tenantId 
 * @param {string} [excludeUserId] Optional user ID to exclude (e.g. during updates)
 * @returns {Promise<{ activeTeamLeads: number, activeAgents: number, activeAdmins: number, totalActive: number }>}
 */
async function getTenantQuotaUsage(tenantId, excludeUserId = null) {
  const baseWhere = {
    tenantId,
    isActive: true,
    ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
  };

  const [activeTeamLeads, activeAgents, activeAdmins] = await Promise.all([
    prisma.user.count({
      where: {
        ...baseWhere,
        role: 'TEAM_LEAD',
      },
    }),
    prisma.user.count({
      where: {
        ...baseWhere,
        role: 'AGENT',
      },
    }),
    prisma.user.count({
      where: {
        ...baseWhere,
        role: 'ADMIN',
      },
    }),
  ]);

  return {
    activeTeamLeads,
    activeAgents,
    activeAdmins,
    totalActive: activeTeamLeads + activeAgents + activeAdmins,
  };
}

/**
 * Asserts whether a tenant has available quota to provision or activate a user of the specified role.
 * Enforces mutual exclusivity and strict tenant-wide caps before checking manager-level capacities.
 *
 * Throws a structured Error with statusCode 403 and code 'PLAN_LIMIT_REACHED' if limits are exceeded.
 *
 * @param {object} params
 * @param {string} params.tenantId
 * @param {string} params.role 'AGENT' | 'TEAM_LEAD'
 * @param {string|null} [params.managerId] Proposed reporting manager
 * @param {string|null} [params.excludeUserId] Used during updates/reactivations
 * @returns {Promise<{ allowed: boolean, limits: object, usage: object }>}
 */
async function assertCanProvisionRole({ tenantId, role, managerId = null, excludeUserId = null }) {
  if (!tenantId) {
    const error = new Error('Tenant context is required for quota validation');
    error.statusCode = 400;
    throw error;
  }

  // Super Admins don't consume tenant quotas
  if (role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  const [limits, usage] = await Promise.all([
    getTenantPlanLimits(tenantId),
    getTenantQuotaUsage(tenantId, excludeUserId),
  ]);

  // 1. Tenant-Wide Team Lead Ceiling Check
  if (role === 'TEAM_LEAD') {
    if (usage.activeTeamLeads >= limits.maxTeamLeads) {
      const error = new Error(
        `Upgrade to a pay-as-you-go account to use this feature. Your ${limits.plan} plan allows a maximum of ${limits.maxTeamLeads} Team Lead(s) across your organization (currently ${usage.activeTeamLeads} active).`
      );
      error.statusCode = 403;
      error.code = 'PLAN_LIMIT_REACHED';
      error.title = 'Unavailable with your plan';
      error.quota = {
        resource: 'TEAM_LEAD',
        current: usage.activeTeamLeads,
        max: limits.maxTeamLeads,
        plan: limits.plan,
      };
      throw error;
    }
  }

  // 2. Tenant-Wide Sales Agent Ceiling Check (Shared Tenant Budget & Mutual Exclusivity)
  if (role === 'AGENT') {
    if (usage.activeAgents >= limits.maxAgents) {
      const error = new Error(
        `Upgrade to a pay-as-you-go account to use this feature. Your ${limits.plan} plan allows a maximum of ${limits.maxAgents} Sales Agent(s) across your organization (currently ${usage.activeAgents} active).`
      );
      error.statusCode = 403;
      error.code = 'PLAN_LIMIT_REACHED';
      error.title = 'Unavailable with your plan';
      error.quota = {
        resource: 'AGENT',
        current: usage.activeAgents,
        max: limits.maxAgents,
        plan: limits.plan,
      };
      throw error;
    }

    // 3. Manager-level Capacity Check (if manager assigned)
    if (managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: managerId, tenantId },
        select: { id: true, name: true, email: true, role: true, maxAgents: true },
      });

      if (manager && manager.role === 'TEAM_LEAD') {
        const managerLimit = manager.maxAgents !== null && manager.maxAgents !== undefined
          ? manager.maxAgents
          : 1;

        const currentAssignedAgents = await prisma.user.count({
          where: {
            tenantId,
            reportsToId: manager.id,
            role: 'AGENT',
            isActive: true,
            ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
          },
        });

        if (currentAssignedAgents >= managerLimit) {
          const error = new Error(
            `Quota exceeded: ${manager.name || manager.email} can only manage up to ${managerLimit} Sales Agent(s) (currently ${currentAssignedAgents} assigned).`
          );
          error.statusCode = 403;
          error.code = 'MANAGER_QUOTA_EXCEEDED';
          error.title = 'Manager Capacity Limit Reached';
          error.quota = {
            resource: 'AGENT',
            current: currentAssignedAgents,
            max: managerLimit,
            managerId: manager.id,
          };
          throw error;
        }
      }
    }
  }

  return { allowed: true, limits, usage };
}

/**
 * Returns a comprehensive quota status payload for frontend consumption.
 *
 * @param {string} tenantId 
 * @returns {Promise<object>}
 */
async function getTenantQuotaStatus(tenantId) {
  const [limits, usage] = await Promise.all([
    getTenantPlanLimits(tenantId),
    getTenantQuotaUsage(tenantId),
  ]);

  return {
    plan: limits.plan,
    teamLeads: {
      current: usage.activeTeamLeads,
      max: limits.maxTeamLeads,
      canCreate: usage.activeTeamLeads < limits.maxTeamLeads,
    },
    agents: {
      current: usage.activeAgents,
      max: limits.maxAgents,
      canCreate: usage.activeAgents < limits.maxAgents,
    },
    totalUsers: usage.totalActive,
  };
}

module.exports = {
  DEFAULT_FREE_LIMITS,
  getTenantPlanLimits,
  getTenantQuotaUsage,
  assertCanProvisionRole,
  getTenantQuotaStatus,
};
