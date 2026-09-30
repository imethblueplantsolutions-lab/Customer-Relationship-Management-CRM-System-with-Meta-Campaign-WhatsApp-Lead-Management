const bcrypt = require('bcrypt');
const prisma = require('../src/config/db');
const { validateHierarchyAssignment } = require('../src/utils/hierarchyValidation');

async function setupHierarchyData() {
  try {
    const tenantId = 'WABA_ID_TEST';

    // 1. Fetch current users
    const admin = await prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN' },
    });

    if (!admin) {
      console.error('No Admin found in tenant', tenantId);
      return;
    }

    let tl1 = await prisma.user.findUnique({
      where: { email: 'teamlead@crm.com' },
    });

    let agent1 = await prisma.user.findUnique({
      where: { email: 'sam@crm.com' },
    });

    let agent2 = await prisma.user.findUnique({
      where: { email: 'agent@crm.com' },
    });

    let agent3 = await prisma.user.findUnique({
      where: { email: 'agent2@crm.com' },
    });

    console.log(`Setting up hierarchy for Tenant: ${tenantId}...`);

    // Assign TL1 -> Admin
    if (tl1) {
      await validateHierarchyAssignment({
        subordinateId: tl1.id,
        newReportsToId: admin.id,
        newRole: 'TEAM_LEAD',
        tenantId,
      });

      await prisma.user.update({
        where: { id: tl1.id },
        data: { reportsToId: admin.id, name: tl1.name || 'Anthony' },
      });
      console.log(`✓ Team Lead 1 (${tl1.email}) assigned to Admin (${admin.email})`);
    }

    // Ensure 2nd Team Lead exists so we have MULTIPLE Team Leads
    let tl2 = await prisma.user.findUnique({
      where: { email: 'teamlead2@crm.com' },
    });

    if (!tl2) {
      const hashedPassword = await bcrypt.hash('TeamLead123!', 10);
      tl2 = await prisma.user.create({
        data: {
          name: 'Sarah Jenkins',
          email: 'teamlead2@crm.com',
          password: hashedPassword,
          role: 'TEAM_LEAD',
          reportsToId: admin.id,
          tenantId,
          isActive: true,
          isFirstLogin: false,
        },
      });
      console.log(`✓ Created Team Lead 2 (teamlead2@crm.com) reporting to Admin (${admin.email})`);
    } else {
      await validateHierarchyAssignment({
        subordinateId: tl2.id,
        newReportsToId: admin.id,
        newRole: 'TEAM_LEAD',
        tenantId,
      });
      await prisma.user.update({
        where: { id: tl2.id },
        data: { reportsToId: admin.id },
      });
      console.log(`✓ Team Lead 2 (${tl2.email}) assigned to Admin (${admin.email})`);
    }

    // Assign Agent 1 -> TL 1
    if (agent1 && tl1) {
      await validateHierarchyAssignment({
        subordinateId: agent1.id,
        newReportsToId: tl1.id,
        newRole: 'AGENT',
        tenantId,
      });
      await prisma.user.update({
        where: { id: agent1.id },
        data: { reportsToId: tl1.id, name: agent1.name || 'Sam' },
      });
      console.log(`✓ Agent 1 (${agent1.email}) assigned to TL 1 (${tl1.email})`);
    }

    // Assign Agent 2 -> TL 1
    if (agent2 && tl1) {
      await validateHierarchyAssignment({
        subordinateId: agent2.id,
        newReportsToId: tl1.id,
        newRole: 'AGENT',
        tenantId,
      });
      await prisma.user.update({
        where: { id: agent2.id },
        data: { reportsToId: tl1.id, name: agent2.name || 'Alex' },
      });
      console.log(`✓ Agent 2 (${agent2.email}) assigned to TL 1 (${tl1.email})`);
    }

    // Assign Agent 3 -> TL 2
    if (agent3 && tl2) {
      await validateHierarchyAssignment({
        subordinateId: agent3.id,
        newReportsToId: tl2.id,
        newRole: 'AGENT',
        tenantId,
      });
      await prisma.user.update({
        where: { id: agent3.id },
        data: { reportsToId: tl2.id, name: agent3.name || 'David' },
      });
      console.log(`✓ Agent 3 (${agent3.email}) assigned to TL 2 (${tl2.email})`);
    }

    console.log('\n✅ Hierarchy setup completed successfully!');
  } catch (error) {
    console.error('Error setting up hierarchy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupHierarchyData();
