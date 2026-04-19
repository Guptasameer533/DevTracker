const { PrismaClient } = require('@prisma/client');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// In-memory LRU cache for session → user mapping.
// Avoids a DB round-trip on every authenticated request.
const sessionCache = new Map();
const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX = 1000;

function getCached(token) {
  const entry = sessionCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    sessionCache.delete(token);
    return null;
  }
  return entry.user;
}

function setCache(token, user) {
  if (sessionCache.size >= CACHE_MAX) {
    // Evict oldest entry
    const firstKey = sessionCache.keys().next().value;
    sessionCache.delete(firstKey);
  }
  sessionCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateCache(token) {
  sessionCache.delete(token);
}

async function authenticate(req, res, next) {
  const token = req.cookies?.session;

  if (!token) {
    return error(res, 'Authentication required', 401, 'UNAUTHENTICATED');
  }

  // Check in-memory cache first
  const cached = getCached(token);
  if (cached) {
    req.user = cached;
    return next();
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return error(res, 'Session not found', 401, 'INVALID_SESSION');
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return error(res, 'Session expired', 401, 'SESSION_EXPIRED');
    }

    setCache(token, session.user);
    req.user = session.user;
    return next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message, requestId: req.requestId });
    return error(res, 'Authentication failed', 500, 'AUTH_ERROR');
  }
}

module.exports = { authenticate, invalidateCache };
