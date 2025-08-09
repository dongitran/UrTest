import axios from 'axios';
import { TestExecutionError } from '../../errors/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

export class TestCaseExecutor {
  constructor() {
    this.timeout = config.get('processing.requestTimeout');
  }

  async executeTestCase(testCase) {
    try {
      logger.processing(`Executing test case: ${testCase.testCaseName}`);

      const axiosConfig = {
        method: testCase.method.toLowerCase(),
        url: testCase.url,
        headers: testCase.headers,
        timeout: this.timeout,
        validateStatus: () => true
      };

      if (testCase.body && ['post', 'put', 'patch'].includes(axiosConfig.method)) {
        axiosConfig.data = testCase.body;
      }

      const startTime = Date.now();
      const response = await axios(axiosConfig);
      const endTime = Date.now();

      const result = {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime: endTime - startTime,
        success: response.status >= 200 && response.status < 400
      };

      logger.success(`Test executed: ${testCase.testCaseName}`, {
        statusCode: result.statusCode,
        responseTime: result.responseTime
      });

      return result;
    } catch (error) {
      logger.error('Test case execution failed', { 
        testCase: testCase.testCaseName,
        error: error.message 
      });

      return {
        statusCode: null,
        statusText: 'ERROR',
        headers: {},
        data: null,
        responseTime: null,
        success: false,
        error: error.message
      };
    }
  }
}
