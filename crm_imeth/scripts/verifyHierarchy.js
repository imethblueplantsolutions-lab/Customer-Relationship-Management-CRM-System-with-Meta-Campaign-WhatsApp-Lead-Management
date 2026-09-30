const prisma = require('../src/config/db');

async function verifyHierarchy() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            reportsToId: true,
            isActive: true,
          },
        },
      },
    });

    if (tenants.length === 0) {
      console.log('No tenants found in the database.');
      return;
    }

    console.log('===============================================================');
    console.log('       MULTI-TENANT ORGANIZATIONAL HIERARCHY AUDIT              ');
    console.log('===============================================================');

    for (const tenant of tenants) {
      console.log(`\n🏢 TENANT: "${tenant.name}" (ID: ${tenant.id})`);
      console.log(`   Total Users: ${tenant.users.length}`);

      const users = tenant.users;
      const superAdmins = users.filter((u) => u.role === 'SUPER_ADMIN');
      const admins = users.filter((u) => u.role === 'ADMIN');
      const teamLeads = users.filter((u) => u.role === 'TEAM_LEAD');
      const agents = users.filter((u) => u.role === 'AGENT');
      const unassigned = users.filter(
        (u) => !u.reportsToId && u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN'
      );

      console.log(`   - Super Admins : ${superAdmins.length}`);
      console.log(`   - Admins       : ${admins.length}`);
      console.log(`   - Team Leads   : ${teamLeads.length}`);
      console.log(`   - Sales Agents : ${agents.length}`);
      if (unassigned.length > 0) {
        console.log(`   - Unassigned   : ${unassigned.length} (pending manager assignment)`);
      }

      console.log('\n   🌳 REPORTING TREE BREAKDOWN:');

      // 1. Super Admins
      for (const sa of superAdmins) {
        console.log(`   👑 [SUPER_ADMIN] ${sa.name || 'Unnamed'} (${sa.email}) [Active: ${sa.isActive}]`);
        const reportingAdmins = admins.filter((a) => a.reportsToId === sa.id);
        if (reportingAdmins.length === 0) {
          console.log(`       └── (No Admins reporting to this Super Admin)`);
        }
        for (const admin of reportingAdmins) {
          renderAdminSubtree(admin, teamLeads, agents, '       ');
        }
      }

      // 2. Tenant Root Admins (reportsToId is null or no Super Admin)
      const rootAdmins = admins.filter((a) => !a.reportsToId);
      for (const admin of rootAdmins) {
        console.log(`   🛡️ [ADMIN - TENANT HEAD] ${admin.name || 'Unnamed'} (${admin.email}) [Active: ${admin.isActive}]`);
        renderAdminSubtree(admin, teamLeads, agents, '   ');
      }

      function renderAdminSubtree(admin, allTLs, allAgents, indent) {
        const reportingTLs = allTLs.filter((tl) => tl.reportsToId === admin.id);
        if (reportingTLs.length === 0) {
          console.log(`${indent}└── (No Team Leads assigned to this Admin yet)`);
          return;
        }

        for (const tl of reportingTLs) {
          console.log(`${indent}└── 👔 [TEAM_LEAD] ${tl.name || 'Unnamed'} (${tl.email}) [Active: ${tl.isActive}]`);
          const reportingAgents = allAgents.filter((ag) => ag.reportsToId === tl.id);
          if (reportingAgents.length === 0) {
            console.log(`${indent}    └── (No Sales Agents assigned to this Team Lead yet)`);
          } else {
            for (const agent of reportingAgents) {
              console.log(`${indent}    └── 🎯 [AGENT] ${agent.name || 'Unnamed'} (${agent.email}) [Active: ${agent.isActive}]`);
            }
          }
        }
      }

      if (unassigned.length > 0) {
        console.log('\n   ⚠️ UNASSIGNED USERS (Awaiting Team Placement):');
        for (const u of unassigned) {
          console.log(`      • [${u.role}] ${u.name || 'Unnamed'} (${u.email})`);
        }
      }

      console.log('---------------------------------------------------------------');
    }
  } catch (error) {
    console.error('Error verifying hierarchy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyHierarchy();
