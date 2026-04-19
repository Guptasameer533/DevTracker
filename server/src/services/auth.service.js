const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const SESSION_TTL_DAYS = 7;

/**
 * Creates or updates a user row from their GitHub profile,
 * then creates a new session. Returns { user, sessionToken }.
 */
async function upsertUserAndCreateSession(githubProfile, requestId) {
  const encryptedToken = encrypt(githubProfile.accessToken);

  const user = await prisma.user.upsert({
    where: { githubId: githubProfile.githubId },
    update: {
      username: githubProfile.username,
      email: githubProfile.email,
      avatarUrl: githubProfile.avatarUrl,
      accessToken: encryptedToken,
    },
    create: {
      githubId: githubProfile.githubId,
      username: githubProfile.username,
      email: githubProfile.email,
      avatarUrl: githubProfile.avatarUrl,
      accessToken: encryptedToken,
    },
  });

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  await prisma.session.create({
    data: { token: sessionToken, userId: user.id, expiresAt },
  });

  logger.info('Session created', { userId: user.id, requestId });
  return { user, sessionToken };
}

/**
 * Deletes a session by token (logout).
 */
async function deleteSession(token, requestId) {
  try {
    await prisma.session.delete({ where: { token } });
    logger.info('Session deleted', { requestId });
  } catch {
    // Session already gone — safe to ignore
  }
}

/**
 * Generates a CSRF state token and stores it as a short-lived cookie value.
 * Returns a random hex string to be used as the state parameter.
 */
function generateOAuthState() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { upsertUserAndCreateSession, deleteSession, generateOAuthState };
