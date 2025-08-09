import axios from 'axios';

export class TestCaseExecutor {
  async executeTestCase(testCase) {
    try {
      console.log('🧪 Executing test case:', testCase.testCaseName);

      const config = {
        method: testCase.method.toLowerCase(),
        url: testCase.url,
        headers: testCase.headers,
        timeout: 15000,
        validateStatus: () => true,
      };

      if (testCase.body && ['post', 'put', 'patch'].includes(config.method)) {
        config.data = testCase.body;
      }

      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();

      const result = {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime: endTime - startTime,
        success: response.status >= 200 && response.status < 400,
      };

      console.log(
        `✅ Test executed: ${testCase.testCaseName} - Status: ${result.statusCode} - Time: ${result.responseTime}ms`
      );

      return result;
    } catch (error) {
      console.error('❌ Error executing test case:', error.message);
      return {
        statusCode: null,
        statusText: 'ERROR',
        headers: {},
        data: null,
        responseTime: null,
        success: false,
        error: error.message,
      };
    }
  }
}
