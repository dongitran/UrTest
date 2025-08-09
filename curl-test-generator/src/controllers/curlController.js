import { CurlService } from '../services/curlService.js';
import { validateCurlRequest } from '../utils/validation.js';

export class CurlController {
  constructor() {
    this.curlService = new CurlService();
  }

  async parseAndTest(req, res, next) {
    try {
      const { error, value } = validateCurlRequest(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      const { text, processId } = value;
      
      console.log(`🔄 Processing curl for processId: ${processId}`);
      
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
      
      const result = await this.curlService.getProcessWithTestCases(processId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Process not found'
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
