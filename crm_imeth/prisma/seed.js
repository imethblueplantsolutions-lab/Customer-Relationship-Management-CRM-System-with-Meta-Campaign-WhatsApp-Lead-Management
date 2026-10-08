/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('\n=================================================');
  console.log('🌱 Starting CRM Database Seeding...');
  console.log('=================================================\n');

  // 1. Create or ensure default Tenant (Organization)
  let tenant = await prisma.tenant.findUnique({
    where: { wabaId: 'WABA_ID_TEST' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Default Organization',
        wabaId: 'WABA_ID_TEST',
      },
    });
    console.log(`✅ Tenant created: "${tenant.name}" (ID: ${tenant.id})`);
  } else {
    console.log(`ℹ️ Tenant already exists: "${tenant.name}" (ID: ${tenant.id})`);
  }

  // 2. Hash default passwords
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teamLeadPassword = await bcrypt.hash('teamlead123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const otpTestPassword = await bcrypt.hash('Test@1234', 10);

  // 3. Upsert Super Admin
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin123@crm.com' },
    update: {
      password: superAdminPassword,
      tenantId: tenant.id,
      role: 'SUPER_ADMIN',
      isActive: true,
      isFirstLogin: false,
    },
    create: {
      email: 'superadmin123@crm.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
      isActive: true,
      isFirstLogin: false,
    },
  });
  console.log('✅ Super Admin  : superadmin123@crm.com  | Password: superadmin123');

  // 4. Upsert Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {
      password: adminPassword,
      tenantId: tenant.id,
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: false,
    },
    create: {
      email: 'admin@crm.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
      isActive: true,
      isFirstLogin: false,
    },
  });
  console.log('✅ Admin User   : admin@crm.com         | Password: admin123');

  // 5. Upsert Team Lead (reporting to Admin)
  const teamLeadUser = await prisma.user.upsert({
    where: { email: 'teamlead@crm.com' },
    update: {
      password: teamLeadPassword,
      tenantId: tenant.id,
      role: 'TEAM_LEAD',
      reportsToId: adminUser.id,
      isActive: true,
      isFirstLogin: false,
    },
    create: {
      email: 'teamlead@crm.com',
      name: 'Team Lead',
      password: teamLeadPassword,
      role: 'TEAM_LEAD',
      reportsToId: adminUser.id,
      tenantId: tenant.id,
      isActive: true,
      isFirstLogin: false,
    },
  });
  console.log('✅ Team Lead    : teamlead@crm.com      | Password: teamlead123');

  // 6. Upsert Sales Agent (reporting to Team Lead)
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@crm.com' },
    update: {
      password: agentPassword,
      tenantId: tenant.id,
      role: 'AGENT',
      reportsToId: teamLeadUser.id,
      isActive: true,
      isFirstLogin: false,
    },
    create: {
      email: 'agent@crm.com',
      name: 'Sales Agent',
      password: agentPassword,
      role: 'AGENT',
      reportsToId: teamLeadUser.id,
      tenantId: tenant.id,
      isActive: true,
      isFirstLogin: false,
    },
  });
  console.log('✅ Sales Agent  : agent@crm.com         | Password: agent123');

  // 7. Upsert OTP Test Admin (First-time login flow test)
  const otpTestUser = await prisma.user.upsert({
    where: { email: 'imethblueplantsolutions@gmail.com' },
    update: {
      password: otpTestPassword,
      tenantId: tenant.id,
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: true,
      name: 'OTP Test Admin',
    },
    create: {
      email: 'imethblueplantsolutions@gmail.com',
      name: 'OTP Test Admin',
      password: otpTestPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
      isActive: true,
      isFirstLogin: true,
    },
  });
  console.log('✅ OTP Test User: imethblueplantsolutions@gmail.com | Password: Test@1234 (triggers OTP)');

  console.log('\n=================================================');
  console.log('🎉 Seeding completed successfully!');
  console.log('You can now log in with any of the credentials above.');
  console.log('=================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
