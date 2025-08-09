import express from 'express';
import { CurlController } from '../controllers/curlController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const curlController = new CurlController();

router.post('/parse-and-test', asyncHandler(curlController.parseAndTest.bind(curlController)));
router.get('/process/:processId', asyncHandler(curlController.getProcess.bind(curlController)));
router.get('/ai-interactions/:processId', asyncHandler(curlController.getAiInteractions.bind(curlController)));

export default router;
