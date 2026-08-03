const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { env } = require('./config/env');
const { isAllowedOrigin } = require('./lib/cors');
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

// Deployed behind a proxy (Render). Trust the first hop so client IPs used for rate limiting
// are accurate (and express-rate-limit doesn't key everyone to the proxy IP).
app.set('trust proxy', 1);
// Don't advertise the framework.
app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin, env.frontendOrigin)),
    credentials: true,
  })
);

// Webhooks are mounted BEFORE the JSON parser because signature verification needs the raw
// body bytes. The webhook router applies its own express.raw() parser.
app.use('/api/webhooks', webhookRoutes);

// Cap JSON body size to blunt payload-based abuse.
app.use(express.json({ limit: '100kb' }));
if (env.nodeEnv !== 'test') {
  // combined = Apache-style access log (good for Render/log drains); dev = concise local.
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Global rate limit for the API surface (auth + reminder routes add their own stricter caps).
// Note: /api/webhooks is mounted earlier, so provider webhooks (with retries) are not throttled.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please slow down' } },
});
app.use('/api', apiLimiter);

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
