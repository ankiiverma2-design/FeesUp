const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { env } = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/students.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const feeRecordRoutes = require('./routes/feeRecords.routes');
const internalRoutes = require('./routes/internal.routes');
const webhookRoutes = require('./routes/webhooks.routes');
const tutorRoutes = require('./routes/tutor.routes');
const subscriptionRoutes = require('./routes/subscription.routes');

const app = express();

app.use(helmet());

/**
 * Allow an origin if it matches a configured entry in FRONTEND_ORIGIN. Supports:
 *   - exact match:      https://app.example.com
 *   - wildcard suffix:  *.lovableproject.com  (matches any Lovable preview subdomain)
 *   - "*"               allow all (dev only)
 * Requests without an Origin header (server-to-server, curl) are always allowed.
 */
function isAllowedOrigin(origin) {
  if (!origin) return true;
  return env.frontendOrigin.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) return origin.endsWith(allowed.slice(1));
    return origin === allowed;
  });
}

app.use(
  cors({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
  })
);

// Webhooks are mounted BEFORE the JSON parser because signature verification needs the raw
// body bytes. The webhook router applies its own express.raw() parser.
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'feesup-api' }));

// Serve the OpenAPI spec so tools (e.g. Lovable) can import the API contract directly.
app.get('/openapi.yaml', (_req, res) => {
  const specPath = path.join(__dirname, '..', 'openapi.yaml');
  if (!fs.existsSync(specPath)) return res.status(404).json({ error: { message: 'Spec not found' } });
  res.type('text/yaml').send(fs.readFileSync(specPath, 'utf8'));
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fee-records', feeRecordRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Internal (scheduler) routes
app.use('/internal', internalRoutes);

// 404 + error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
