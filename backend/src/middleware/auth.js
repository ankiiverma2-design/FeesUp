const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { ApiError } = require('../utils/errors');

/**
 * Verifies the Bearer JWT and attaches { id, email } to req.tutor.
 * The tutor id is taken ONLY from the verified token, never from the request body,
 * which is the foundation of multi-tenant isolation.
 */
const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    // Pin the algorithm to prevent algorithm-confusion attacks.
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    req.tutor = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};

module.exports = { requireAuth };
