const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../utils/response');
const { decrypt } = require('../utils/crypto');
const githubService = require('./github.service');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// In-process Postgres-backed cache: keyed by repoId + date range, 5-minute TTL.
// Stored in a plain Map (survives restarts only in same process, acceptable for P0).
const statsCache = new Map();
const STATS_CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(repoId, from, to) {
  return `${repoId}_${from}_${to}`;
}

/**
 * Returns daily commit buckets for the connected repo within [from, to].
 * Response shape: [{ date: "2024-01-15", count: 3 }, ...]
 * Days with zero commits are included for a complete timeline.
 */
async function getCommitStats(userId, from, to, requestId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessToken: true },
  });

  const repo = await prisma.repository.findFirst({
    where: { userId },
    select: { id: true, fullName: true, archived: true },
  });

  if (!repo) {
    return { repo: null, buckets: [] };
  }

  if (repo.archived) {
    throw new AppError(
      'This repo is no longer accessible.',
      410,
      'REPO_ARCHIVED'
    );
  }

  const key = cacheKey(repo.id, from.toISOString(), to.toISOString());
  const cached = statsCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return { repo, buckets: cached.buckets, recentCommits: cached.recentCommits || [], contributors: cached.contributors || [] };
  }

  // Check if the DB covers the full requested range by finding the oldest commit stored for this repo.
  const oldest = await prisma.commit.findFirst({
    where: { repoId: repo.id },
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true },
  });

  const needsSync = !oldest || oldest.timestamp > from;

  if (needsSync && user?.accessToken) {
    try {
      const accessToken = decrypt(user.accessToken);
      // Fetch only the missing window — from `from` up to the oldest stored commit (or `to` if no commits yet)
      const syncUntil = oldest ? new Date(oldest.timestamp.getTime() - 1) : to;
      const newCommits = await githubService.fetchCommits(
        accessToken,
        repo.fullName,
        from,
        syncUntil,
        requestId
      );
      if (newCommits.length > 0) {
        await prisma.commit.createMany({
          data: newCommits.map((c) => ({ ...c, repoId: repo.id })),
          skipDuplicates: true,
        });
        logger.info('On-demand backfill complete', {
          repoId: repo.id,
          count: newCommits.length,
          requestId,
        });
      }
    } catch (err) {
      // Non-fatal: serve whatever is in DB
      logger.warn('On-demand backfill failed', { error: err.message, repoId: repo.id, requestId });
    }
  }

  const commits = await prisma.commit.findMany({
    where: {
      repoId: repo.id,
      timestamp: { gte: from, lte: to },
    },
    select: { timestamp: true, sha: true, message: true, authorLogin: true, url: true },
    orderBy: { timestamp: 'desc' },
  });

  // Build daily buckets — include all days in range even if 0 commits
  const bucketsMap = {};
  const cursor = new Date(from);
  while (cursor <= to) {
    bucketsMap[cursor.toISOString().slice(0, 10)] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const c of commits) {
    const day = c.timestamp.toISOString().slice(0, 10);
    if (day in bucketsMap) bucketsMap[day]++;
  }

  const buckets = Object.entries(bucketsMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recent commits (latest 20 across all authors)
  const recentCommits = commits.slice(0, 20).map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.message.split('\n')[0].slice(0, 80),
    authorLogin: c.authorLogin,
    timestamp: c.timestamp,
    url: c.url,
  }));

  // Contributors — grouped by authorLogin, sorted by commit count desc
  const authorMap = {};
  for (const c of commits) {
    if (!authorMap[c.authorLogin]) {
      authorMap[c.authorLogin] = { authorLogin: c.authorLogin, commitCount: 0, commits: [] };
    }
    authorMap[c.authorLogin].commitCount++;
    if (authorMap[c.authorLogin].commits.length < 10) {
      authorMap[c.authorLogin].commits.push({
        sha: c.sha.slice(0, 7),
        message: c.message.split('\n')[0].slice(0, 80),
        timestamp: c.timestamp,
        url: c.url,
      });
    }
  }
  const contributors = Object.values(authorMap).sort((a, b) => b.commitCount - a.commitCount);

  const result = { repo, buckets, recentCommits, contributors };
  statsCache.set(key, { buckets, recentCommits, contributors, expiresAt: Date.now() + STATS_CACHE_TTL_MS });

  return result;
}

/**
 * Summary stats derived from commit buckets:
 * total commits, last commit time, busiest day.
 */
function computeSummary(buckets) {
  if (!buckets.length) {
    return { totalCommits: 0, lastCommitDate: null, busiestDay: null };
  }

  let totalCommits = 0;
  let busiestDay = null;
  let busiestCount = 0;
  let lastCommitDate = null;

  for (const { date, count } of buckets) {
    totalCommits += count;
    if (count > busiestCount) {
      busiestCount = count;
      busiestDay = { date, count };
    }
    if (count > 0 && (!lastCommitDate || date > lastCommitDate)) {
      lastCommitDate = date;
    }
  }

  return { totalCommits, lastCommitDate, busiestDay };
}

/**
 * Returns stats for demo mode: reads from the seeded demo repo.
 */
async function getDemoStats(from, to) {
  const DEMO_REPO_ID = 'demo_repo_id';

  const commits = await prisma.commit.findMany({
    where: {
      repoId: DEMO_REPO_ID,
      timestamp: { gte: from, lte: to },
    },
    select: { timestamp: true, sha: true, message: true, authorLogin: true, url: true },
    orderBy: { timestamp: 'desc' },
  });

  const bucketsMap = {};
  const cursor = new Date(from);
  while (cursor <= to) {
    bucketsMap[cursor.toISOString().slice(0, 10)] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const c of commits) {
    const day = c.timestamp.toISOString().slice(0, 10);
    if (day in bucketsMap) bucketsMap[day]++;
  }

  const buckets = Object.entries(bucketsMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const recentCommits = commits.slice(0, 20).map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.message.split('\n')[0].slice(0, 80),
    authorLogin: c.authorLogin,
    timestamp: c.timestamp,
    url: c.url,
  }));

  const authorMap = {};
  for (const c of commits) {
    if (!authorMap[c.authorLogin]) {
      authorMap[c.authorLogin] = { authorLogin: c.authorLogin, commitCount: 0, commits: [] };
    }
    authorMap[c.authorLogin].commitCount++;
    if (authorMap[c.authorLogin].commits.length < 10) {
      authorMap[c.authorLogin].commits.push({
        sha: c.sha.slice(0, 7),
        message: c.message.split('\n')[0].slice(0, 80),
        timestamp: c.timestamp,
        url: c.url,
      });
    }
  }
  const contributors = Object.values(authorMap).sort((a, b) => b.commitCount - a.commitCount);

  return {
    repo: { fullName: 'facebook/react' },
    buckets,
    recentCommits,
    contributors,
  };
}

module.exports = { getCommitStats, computeSummary, getDemoStats };
