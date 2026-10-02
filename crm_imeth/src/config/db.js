const { PrismaClient } = require('@prisma/client');
const { tenantStorage } = require('../middleware/tenant');

const basePrisma = new PrismaClient({
  log: ['warn', 'error'],
});

const TENANT_SCOPED_MODELS = ['lead', 'user', 'auditlog'];

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const store = tenantStorage.getStore();
        const tenantId = store?.tenantId;
        const isSuperAdmin = store?.isSuperAdmin || store?.userRole === 'SUPER_ADMIN';

        const isTenantModel = TENANT_SCOPED_MODELS.includes(model.toLowerCase());

        // Super Admins operate globally across all platform organizations
        if (isSuperAdmin) {
          return query(args);
        }

        if (isTenantModel) {
          if (!tenantId) {
            // Fail-safe: if tenant context is missing for a non-superadmin query, force impossible match to prevent data leak
            if (['findMany', 'findFirst', 'count', 'updateMany', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, tenantId: '__NO_TENANT_CONTEXT__' };
            }
          } else {
            // If operation is a query/update/delete with 'where'
            if (['findMany', 'findFirst', 'findUnique', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, tenantId };
            }
            // If operation is creating data
            if (['create', 'createMany', 'upsert'].includes(operation)) {
              if (args.data && !Array.isArray(args.data)) {
                args.data.tenantId = tenantId;
              }
              if (args.create) {
                args.create.tenantId = tenantId;
              }
            }
          }
        }
        return query(args);
      },
    },
  },
});

module.exports = prisma;
