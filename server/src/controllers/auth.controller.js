const crypto = require('crypto');
const env = require('../config/env');
const authService = require('../services/auth.service');
const githubService = require('../services/github.service');
const reposService = require('../services/repos.service');
const { success } = require('../utils/response');
const { invalidateCache } = require('../middleware/authenticate');
const logger = require('../utils/logger');

const COOKIE_NAME = 'session';
const OAUTH_STATE_COOKIE = 'oauth_state';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 10 * 60 * 1000, // 10 minutes
  path: '/',
};

/**
 * GET /api/v1/auth/github
 * Generates a CSRF state token, stores in a signed cookie, redirects to GitHub.
 */
async function initiateOAuth(req, res) {
  const state = authService.generateOAuthState();
  res.cookie(OAUTH_STATE_COOKIE, state, STATE_COOKIE_OPTIONS);

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/v1/auth/github/callback`,
    scope: 'read:user user:email repo',
    state,
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

/**
 * GET /api/v1/auth/github/callback
 * Verifies state, exchanges code for token, upserts user, creates session.
 */
async function handleOAuthCallback(req, res) {
  const { code, state } = req.query;
  const savedState = req.cookies?.[OAUTH_STATE_COOKIE];

  // CSRF check: state must match the cookie we set
  if (!state || !savedState || !crypto.timingSafeEqual(
    Buffer.from(state),
    Buffer.from(savedState)
  )) {
    logger.warn('OAuth state mismatch', { requestId: req.requestId });
    return res.redirect(`${env.FRONTEND_URL}?error=state_mismatch`);
  }

  res.clearCookie(OAUTH_STATE_COOKIE);

  if (!code) {
    return res.redirect(`${env.FRONTEND_URL}?error=no_code`);
  }

  try {
    const accessToken = await githubService.exchangeCodeForToken(code, req.requestId);
    const githubProfile = await githubService.getUser(accessToken, req.requestId);
    const { sessionToken } = await authService.upsertUserAndCreateSession(
      { ...githubProfile, accessToken },
      req.requestId
    );

    res.cookie(COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);
    return res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    logger.error('OAuth callback error', { error: err.message, requestId: req.requestId });
    return res.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the current user and their connected repo (if any).
 */
async function getMe(req, res) {
  const repo = await reposService.getConnectedRepo(req.user.id);

  return success(res, {
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl,
    connectedRepo: repo
      ? { id: repo.id, name: repo.name, fullName: repo.fullName, private: repo.private }
      : null,
  });
}

/**
 * POST /api/v1/auth/logout
 * Deletes the session, clears the cookie.
 */
async function logout(req, res) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    await authService.deleteSession(token, req.requestId);
    invalidateCache(token);
  }
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return success(res, { message: 'Logged out successfully' });
}

module.exports = { initiateOAuth, handleOAuthCallback, getMe, logout };
