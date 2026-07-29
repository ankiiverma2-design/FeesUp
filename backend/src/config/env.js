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

// In production, refuse to boot with weak or default secrets — prevents accidentally shipping
// a guessable JWT signing key or internal-job secret.
function assertStrongSecretsInProduction(e) {
  if (e.nodeEnv !== 'production') return;
  const isWeak = (v) => !v || v.length < 16 || /change[-_ ]?me/i.test(v);
  const problems = [];
  if (isWeak(e.jwtSecret)) problems.push('JWT_SECRET');
  if (isWeak(e.internalJobSecret)) problems.push('INTERNAL_JOB_SECRET');
  if (problems.length) {
    throw new Error(
      `Insecure ${problems.join(' and ')} in production: use a strong random value (>= 16 chars).`
    );
  }
}
assertStrongSecretsInProduction(env);

module.exports = { env };
