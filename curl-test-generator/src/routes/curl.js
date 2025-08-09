import express from 'express';
import { CurlController } from '../controllers/curlController.js';

const router = express.Router();
const curlController = new CurlController();

router.post('/parse-and-test', curlController.parseAndTest.bind(curlController));
router.get('/process/:processId', curlController.getProcess.bind(curlController));

export default router;
