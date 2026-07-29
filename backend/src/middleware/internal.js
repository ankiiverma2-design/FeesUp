const crypto = require('crypto');
const { env } = require('../config/env');
const { ApiError } = require('../utils/errors');

/** Constant-time string comparison to avoid timing attacks on the secret. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Guards internal job endpoints. An external scheduler (cron) must send the shared secret
 * in the `x-internal-secret` header. Keeps scheduled jobs reliable on sleeping free tiers
 * without exposing them publicly.
 */
const requireInternalSecret = (req, _res, next) => {
  const provided = req.headers['x-internal-secret'];
  if (!provided || !safeEqual(String(provided), env.internalJobSecret)) {
    return next(ApiError.forbidden('Invalid internal secret'));
  }
  return next();
};

module.exports = { requireInternalSecret };
