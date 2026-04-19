const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/health
 * Liveness probe. Returns 200 only if DB is reachable.
 * Used by Render's health check and CI post-deploy smoke test.
 */
router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      status: 'error',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
