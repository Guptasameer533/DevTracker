const { z } = require('zod');
const statsService = require('../services/stats.service');
const { success, error } = require('../utils/response');

const statsQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

/**
 * GET /api/v1/stats/commits?from=ISO&to=ISO
 * Returns daily commit buckets + summary stats + contributors for the connected repo.
 */
async function getCommitStats(req, res, next) {
  const parsed = statsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return error(res, 'Invalid date parameters', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
  }

  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const { repo, buckets, recentCommits, contributors } = await statsService.getCommitStats(
      req.user.id,
      from,
      to,
      req.requestId
    );

    if (!repo) {
      return success(res, { repo: null, buckets: [], summary: null, recentCommits: [], contributors: [] });
    }

    const summary = statsService.computeSummary(buckets);
    return success(res, { repo: { fullName: repo.fullName }, buckets, summary, recentCommits, contributors });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/stats/demo?from=ISO&to=ISO
 * Returns stats for demo mode — no auth required.
 */
async function getDemoStats(req, res, next) {
  const parsed = statsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return error(res, 'Invalid date parameters', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
  }

  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const { repo, buckets, recentCommits, contributors } = await statsService.getDemoStats(from, to);
    const summary = statsService.computeSummary(buckets);
    return success(res, { repo, buckets, summary, recentCommits, contributors });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCommitStats, getDemoStats };
