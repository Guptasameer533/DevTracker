require('dotenv').config();

// Env validation runs at import — process exits if env is invalid
const env = require('./src/config/env');
const app = require('./src/app');
const logger = require('./src/utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    logger.error('Failed to connect to database', { error: err.message });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`DevTrack API running`, {
      port: env.PORT,
      env: env.NODE_ENV,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server closed');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes > 10s
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
