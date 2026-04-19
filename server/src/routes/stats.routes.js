const { Router } = require('express');
const statsController = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.get('/commits', authenticate, statsController.getCommitStats);
router.get('/demo', statsController.getDemoStats);

module.exports = router;
