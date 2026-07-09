require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendOrigin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  messagingProvider: process.env.MESSAGING_PROVIDER || 'mock',
  internalJobSecret: process.env.INTERNAL_JOB_SECRET || 'change-me-internal-secret',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  payperwa: {
    apiKey: process.env.PAYPERWA_API_KEY || '',
    baseUrl: process.env.PAYPERWA_BASE_URL || '',
  },
};

module.exports = { env };
