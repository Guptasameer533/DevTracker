const { Router } = require('express');
const reposController = require('../controllers/repos.controller');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.get('/available', authenticate, reposController.listAvailable);
router.post('/', authenticate, reposController.connectRepo);
router.delete('/', authenticate, reposController.disconnectRepo);

module.exports = router;
