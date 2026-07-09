const { app } = require('./app');
const { env } = require('./config/env');
const { prisma } = require('./lib/prisma');

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`FeesUp API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown
async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
