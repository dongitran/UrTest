const express = require('express');
const authMiddleware = require('../middleware/auth');
const testController = require('../controllers/testController');
const repoController = require('../controllers/repoController');

const router = express.Router();

router.post('/run-test', authMiddleware, testController.runTest);
router.post('/refresh-repo', authMiddleware, repoController.refreshRepository);

module.exports = router;