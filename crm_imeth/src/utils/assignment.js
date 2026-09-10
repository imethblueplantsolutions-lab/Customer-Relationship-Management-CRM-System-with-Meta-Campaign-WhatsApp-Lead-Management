const prisma = require('../config/db');

/**
 * Automatically assigns a lead to the next available active sales agent in a round-robin sequence.
 * 
 * @param {string} tenantId - The tenant ID to scope the agent assignment.
 * @returns {Promise<string|null>} The assigned User ID, or null if no active agents are available.
 */
async function getRoundRobinAgent(tenantId) {
  if (!tenantId) {
    return null;
  }

  try {
    // 1. Fetch all active sales agents for this tenant, ordered consistently by createdAt ascending
    const activeAgents = await prisma.user.findMany({
      where: {
        tenantId,
        role: 'AGENT',
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    // If no active agents exist, return null
    if (!activeAgents || activeAgents.length === 0) {
      return null;
    }

    // Fast-path: single active agent
    if (activeAgents.length === 1) {
      return activeAgents[0].id;
    }

    // 2. Query the most recently created Lead that has an assignedToId for this tenant
    const lastAssignedLead = await prisma.lead.findFirst({
      where: {
        tenantId,
        assignedToId: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        assignedToId: true,
      },
    });

    // If no leads have been assigned yet, start at the beginning of the sequence
    if (!lastAssignedLead || !lastAssignedLead.assignedToId) {
      return activeAgents[0].id;
    }

    // 3. Find the index of the last assigned agent in the active agents list
    const currentIndex = activeAgents.findIndex(
      (agent) => agent.id === lastAssignedLead.assignedToId
    );

    // If previous agent was deactivated, deleted, or role changed, restart at first agent
    if (currentIndex === -1) {
      return activeAgents[0].id;
    }

    // 4. Return the next agent's ID in the sequence using modulo arithmetic
    const nextIndex = (currentIndex + 1) % activeAgents.length;
    return activeAgents[nextIndex].id;
  } catch (error) {
    console.error(`[RoundRobin] Error determining round-robin agent for tenant ${tenantId}:`, error);
    return null;
  }
}

module.exports = {
  getRoundRobinAgent,
};
