const { ApiError } = require('../utils/errors');
const { env } = require('../config/env');

// 404 handler for unmatched routes.
function notFoundHandler(req, res, _next) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
}

// Centralized error handler. Never leaks stack traces to clients.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Prisma unique-constraint violation -> 409
  if (err && err.code === 'P2002') {
    return res.status(409).json({
      error: { message: 'A record with these details already exists', code: 'CONFLICT' },
    });
  }

  if (err instanceof ApiError) {
    const body = { error: { message: err.message } };
    if (err.code) body.error.code = err.code;
    if (err.fields) body.error.fields = err.fields;
    return res.status(err.statusCode).json(body);
  }

  if (env.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err);
  }

  return res.status(500).json({ error: { message: 'Internal server error' } });
}

module.exports = { notFoundHandler, errorHandler };
