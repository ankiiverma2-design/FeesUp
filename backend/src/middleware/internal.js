const { env } = require('../config/env');
const { ApiError } = require('../utils/errors');

/**
 * Guards internal job endpoints. An external scheduler (cron) must send the shared secret
 * in the `x-internal-secret` header. Keeps scheduled jobs reliable on sleeping free tiers
 * without exposing them publicly.
 */
const requireInternalSecret = (req, _res, next) => {
  const provided = req.headers['x-internal-secret'];
  if (!provided || provided !== env.internalJobSecret) {
    return next(ApiError.forbidden('Invalid internal secret'));
  }
  return next();
};

module.exports = { requireInternalSecret };
