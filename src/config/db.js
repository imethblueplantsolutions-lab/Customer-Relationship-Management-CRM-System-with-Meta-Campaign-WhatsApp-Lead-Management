const { PrismaClient } = require('@prisma/client');
const { tenantStorage } = require('../middleware/tenant');

const basePrisma = new PrismaClient({
  log: ['warn', 'error'],
});

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const store = tenantStorage.getStore();
        const tenantId = store?.tenantId;

        if (tenantId) {
          if (args.where) {
            args.where.tenantId = tenantId;
          } else {
            args.where = { tenantId };
          }
          if (args.data && !Array.isArray(args.data)) {
            args.data.tenantId = tenantId;
          }
        }
        return query(args);
      },
    },
  },
});

module.exports = prisma;
