const axios = require('axios');
const logger = require('../utils/logger');
const { AppError } = require('../utils/response');

const GITHUB_API = 'https://api.github.com';

/**
 * Creates an Axios instance pre-configured with the user's access token.
 * All GitHub API calls go through this — single place to handle errors.
 */
function createGitHubClient(accessToken, requestId) {
  const client = axios.create({
    baseURL: GITHUB_API,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    timeout: 10000,
  });

  client.interceptors.response.use(
    (response) => {
      logger.debug('GitHub API call', {
        url: response.config.url,
        status: response.status,
        requestId,
      });
      return response;
    },
    (err) => {
      const status = err.response?.status;
      const url = err.config?.url;
      logger.warn('GitHub API error', { url, status, requestId });

      if (status === 401) {
        throw new AppError(
          'GitHub access was revoked or expired. Please sign in again.',
          401,
          'GITHUB_UNAUTHORIZED'
        );
      }
      if (status === 403) {
        const remaining = err.response?.headers?.['x-ratelimit-remaining'];
        const resetAt = err.response?.headers?.['x-ratelimit-reset'];
        if (remaining === '0') {
          const retryAfter = resetAt
            ? Math.ceil((Number(resetAt) * 1000 - Date.now()) / 60000)
            : 60;
          throw new AppError(
            `GitHub rate limit reached. Try again in ${retryAfter} minutes.`,
            503,
            'GITHUB_RATE_LIMITED'
          );
        }
        throw new AppError('No access to this GitHub resource.', 403, 'GITHUB_FORBIDDEN');
      }
      if (status === 404) {
        throw new AppError('GitHub resource not found.', 404, 'GITHUB_NOT_FOUND');
      }
      throw new AppError('GitHub API request failed.', 502, 'GITHUB_ERROR');
    }
  );

  return client;
}

/**
 * Fetches the authenticated user's profile from GitHub.
 */
async function getUser(accessToken, requestId) {
  const client = createGitHubClient(accessToken, requestId);
  const [userRes, emailRes] = await Promise.all([
    client.get('/user'),
    client.get('/user/emails').catch(() => ({ data: [] })),
  ]);

  const primaryEmail = emailRes.data.find?.((e) => e.primary && e.verified)?.email;

  return {
    githubId: String(userRes.data.id),
    username: userRes.data.login,
    email: primaryEmail || userRes.data.email,
    avatarUrl: userRes.data.avatar_url,
  };
}

/**
 * Lists repositories accessible to the user, sorted by updated_at desc.
 * Returns up to 100 repos.
 */
async function listUserRepos(accessToken, requestId) {
  const client = createGitHubClient(accessToken, requestId);
  const res = await client.get('/user/repos', {
    params: {
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      type: 'all',
    },
  });

  return res.data.map((r) => ({
    githubRepoId: String(r.id),
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    updatedAt: r.updated_at,
    description: r.description,
  }));
}

/**
 * Fetches commits for a repo within a date range.
 * Paginates through GitHub's API, capped at 30 days by default.
 */
async function fetchCommits(accessToken, fullName, since, until, requestId) {
  const client = createGitHubClient(accessToken, requestId);
  const [owner, repo] = fullName.split('/');
  const allCommits = [];
  let page = 1;

  for (;;) {
    const res = await client.get(`/repos/${owner}/${repo}/commits`, {
      params: {
        since: since.toISOString(),
        until: until.toISOString(),
        per_page: 100,
        page,
      },
    });

    if (!res.data.length) break;

    for (const c of res.data) {
      allCommits.push({
        sha: c.sha,
        message: (c.commit.message || '').slice(0, 1000),
        authorLogin: c.author?.login || c.commit.author?.name || 'unknown',
        timestamp: new Date(c.commit.author?.date || c.commit.committer?.date),
        url: c.html_url,
      });
    }

    if (res.data.length < 100) break;
    page++;

    // Respect rate limits
    const remaining = Number(res.headers['x-ratelimit-remaining'] || 100);
    if (remaining < 10) {
      logger.warn('GitHub rate limit low, stopping pagination', { remaining, requestId });
      break;
    }
  }

  return allCommits;
}

/**
 * Exchanges an OAuth code for an access token.
 */
async function exchangeCodeForToken(code, requestId) {
  const env = require('../config/env');
  const res = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' }, timeout: 10000 }
  );

  if (!res.data.access_token) {
    logger.warn('GitHub token exchange failed', {
      error: res.data.error,
      requestId,
    });
    throw new AppError('GitHub OAuth failed. Please try again.', 400, 'OAUTH_FAILED');
  }

  return res.data.access_token;
}

module.exports = {
  getUser,
  listUserRepos,
  fetchCommits,
  exchangeCodeForToken,
};
