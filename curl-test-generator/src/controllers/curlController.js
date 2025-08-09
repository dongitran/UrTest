import { CurlService } from '../services/core/curlService.js';
import { validateCurlRequest } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../errors/index.js';

export class CurlController {
  constructor() {
    this.curlService = new CurlService();
  }

  async parseAndTest(req, res, next) {
    try {
      const validatedData = validateCurlRequest(req.body);
      const { text, processId } = validatedData;

      logger.processing('Processing curl request', { 
        processId,
        curlLength: text.length 
      });

      const result = await this.curlService.initializeProcess(text, processId);

      res.json({
        success: true,
        message: 'Process initialized successfully',
        data: result
      });

      this.curlService.processInBackground(processId, text);
    } catch (error) {
      next(error);
    }
  }

  async getProcess(req, res, next) {
    try {
      const { processId } = req.params;

      if (!processId) {
        throw new ValidationError('Process ID is required');
      }

      const result = await this.curlService.getProcessWithTestCases(processId);

      if (!result) {
        throw new NotFoundError('Process not found');
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getAiInteractions(req, res, next) {
    try {
      const { processId } = req.params;

      if (!processId) {
        throw new ValidationError('Process ID is required');
      }

      const result = await this.curlService.getAiInteractions(processId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
