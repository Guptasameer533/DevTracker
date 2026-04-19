const { z } = require('zod');
const reposService = require('../services/repos.service');
const { success, error } = require('../utils/response');

const connectRepoSchema = z.object({
  githubRepoId: z.string().min(1),
});

/**
 * GET /api/v1/repos/available
 * Lists the user's GitHub repos available for connection.
 */
async function listAvailable(req, res, next) {
  try {
    const repos = await reposService.listAvailableRepos(req.user, req.requestId);
    return success(res, repos);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/repos
 * Connects one repo to the user's account.
 * Body: { githubRepoId: string }
 */
async function connectRepo(req, res, next) {
  const parsed = connectRepoSchema.safeParse(req.body);
  if (!parsed.success) {
    return error(res, 'Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
  }

  try {
    const repo = await reposService.connectRepo(req.user, parsed.data.githubRepoId, req.requestId);
    return success(res, {
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      private: repo.private,
    }, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/repos
 * Disconnects the user's currently connected repo.
 */
async function disconnectRepo(req, res, next) {
  try {
    await reposService.disconnectRepo(req.user.id, req.requestId);
    return success(res, { message: 'Repo disconnected' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAvailable, connectRepo, disconnectRepo };
