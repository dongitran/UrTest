const express = require('express');
const authMiddleware = require('../middleware/auth');
const testController = require('../controllers/testController');

const router = express.Router();

router.post('/run-test', authMiddleware, testController.runTest);

module.exports = router;
