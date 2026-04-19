const { PrismaClient } = require('@prisma/client');
const { decrypt } = require('../utils/crypto');
const { AppError } = require('../utils/response');
const githubService = require('./github.service');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// In-memory cache for available repos list (per user, 5-minute TTL)
const reposCache = new Map();
const REPOS_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Lists GitHub repos available for the user to connect.
 * Results are cached per-user for 5 minutes.
 */
async function listAvailableRepos(user, requestId) {
  const cacheKey = `repos_${user.id}`;
  const cached = reposCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const accessToken = decrypt(user.accessToken);
  const repos = await githubService.listUserRepos(accessToken, requestId);

  reposCache.set(cacheKey, { data: repos, expiresAt: Date.now() + REPOS_CACHE_TTL_MS });
  return repos;
}

/**
 * Connects a GitHub repo to the user's account.
 * PRD FR-REPO-3: Only one repo per user in P0.
 * Backfills commits for the last 30 days.
 */
async function connectRepo(user, githubRepoId, requestId) {
  // Enforce single-repo limit per PRD FR-REPO-3
  const existing = await prisma.repository.findFirst({ where: { userId: user.id } });
  if (existing) {
    throw new AppError(
      'MVP supports one repo per user. Disconnect your current repo first.',
      409,
      'REPO_LIMIT_REACHED'
    );
  }

  // Prevent same repo being connected by multiple users (PRD E-10)
  const conflict = await prisma.repository.findUnique({ where: { githubRepoId } });
  if (conflict) {
    throw new AppError(
      'This repo is already connected by another user.',
      409,
      'REPO_ALREADY_CONNECTED'
    );
  }

  // Validate user still has access to this repo
  const accessToken = decrypt(user.accessToken);
  const availableRepos = await githubService.listUserRepos(accessToken, requestId);
  const repoMeta = availableRepos.find((r) => r.githubRepoId === githubRepoId);

  if (!repoMeta) {
    throw new AppError(
      'Repo not found or you no longer have access to it.',
      403,
      'REPO_ACCESS_DENIED'
    );
  }

  const repo = await prisma.repository.create({
    data: {
      userId: user.id,
      githubRepoId: repoMeta.githubRepoId,
      name: repoMeta.name,
      fullName: repoMeta.fullName,
      private: repoMeta.private,
    },
  });

  logger.info('Repo connected, starting backfill', {
    repoId: repo.id,
    fullName: repo.fullName,
    requestId,
  });

  // Backfill last 30 days of commits (inline for MVP)
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  try {
    const commits = await githubService.fetchCommits(
      accessToken,
      repo.fullName,
      since,
      until,
      requestId
    );

    if (commits.length > 0) {
      await prisma.commit.createMany({
        data: commits.map((c) => ({ ...c, repoId: repo.id })),
        skipDuplicates: true,
      });
      logger.info('Backfill complete', {
        repoId: repo.id,
        count: commits.length,
        requestId,
      });
    }
  } catch (err) {
    // Backfill failure is non-fatal — repo is still connected
    logger.error('Backfill failed', { error: err.message, repoId: repo.id, requestId });
  }

  return repo;
}

/**
 * Disconnects (deletes) the user's connected repo.
 * Cascades to commits via Prisma schema's onDelete: Cascade.
 */
async function disconnectRepo(userId, requestId) {
  const repo = await prisma.repository.findFirst({ where: { userId } });
  if (!repo) {
    throw new AppError('No repo connected.', 404, 'REPO_NOT_FOUND');
  }

  await prisma.repository.delete({ where: { id: repo.id } });
  reposCache.delete(`repos_${userId}`);
  logger.info('Repo disconnected', { repoId: repo.id, userId, requestId });
}

/**
 * Returns the user's currently connected repo (or null).
 */
async function getConnectedRepo(userId) {
  return prisma.repository.findFirst({ where: { userId } });
}

module.exports = { listAvailableRepos, connectRepo, disconnectRepo, getConnectedRepo };
