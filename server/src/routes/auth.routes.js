const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.get('/github', authLimiter, authController.initiateOAuth);
router.get('/github/callback', authLimiter, authController.handleOAuthCallback);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
