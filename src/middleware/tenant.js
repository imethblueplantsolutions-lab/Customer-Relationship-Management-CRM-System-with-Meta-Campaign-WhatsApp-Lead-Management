const { AsyncLocalStorage } = require('async_hooks');

const tenantStorage = new AsyncLocalStorage();

const extractTenantMiddleware = (req, res, next) => {
  // Allow CORS preflight requests to pass without tenant check
  if (req.method === 'OPTIONS') {
    return next();
  }

  let tenantId = req.headers['x-tenant-id'] || req.user?.organizationId;

  // Attempt to resolve tenant via Meta Webhook WABA ID
  if (!tenantId && req.body?.entry?.[0]?.id) {
    tenantId = req.body.entry[0].id; 
  }

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant context could not be resolved. Please supply x-tenant-id header.' });
  }

  tenantStorage.run({ tenantId }, () => next());
};

module.exports = { tenantStorage, extractTenantMiddleware };
