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
app.use(
  cors({
    origin: env.frontendOrigin,
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
