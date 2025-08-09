import { v4 as uuidv4 } from 'uuid';
import { CurlParser } from '../parsers/curlParser.js';
import { JsonExtractor } from '../extractors/jsonExtractor.js';
import { TestCaseGenerator } from '../generators/testCaseGenerator.js';
import { TestCaseExecutor } from '../executors/testCaseExecutor.js';
import { ProcessManager } from '../managers/processManager.js';
import { AiInteractionManager } from '../managers/aiInteractionManager.js';
import { TestCaseRepository } from '../../repositories/testCaseRepository.js';
import { logger } from '../../utils/logger.js';
import { DatabaseError } from '../../errors/index.js';

export class CurlService {
  constructor() {
    this.curlParser = new CurlParser();
    this.jsonExtractor = new JsonExtractor();
    this.processManager = new ProcessManager();
    this.aiInteractionManager = new AiInteractionManager();
    this.testCaseRepo = new TestCaseRepository();
    
    this.testCaseGenerator = new TestCaseGenerator(
      this.jsonExtractor,
      this.processManager,
      this.aiInteractionManager
    );
    this.testCaseExecutor = new TestCaseExecutor();
  }

  async initializeProcess(curlText, processId) {
    try {
      const curlData = await this.curlParser.parseCurl(curlText);
      return await this.processManager.initializeProcess(curlText, processId, curlData);
    } catch (error) {
      logger.error('Failed to initialize process', { processId, error: error.message });
      throw new DatabaseError(`Failed to initialize process: ${error.message}`);
    }
  }

  async processInBackground(processId, curlText) {
    setImmediate(async () => {
      try {
        logger.processing('Background processing started', { processId });

        await this.processManager.updateProcessStatus(processId, 'parsing_curl');
        const curlData = await this.curlParser.parseCurl(curlText);

        await this.processManager.updateProcessStatus(processId, 'generating_test_cases');

        let testCases;
        try {
          testCases = await this.testCaseGenerator.generateMultipleTestCases(curlData, processId);
        } catch (testGenError) {
          logger.error('Test case generation failed', { 
            processId,
            error: testGenError.message 
          });
          await this.processManager.updateProcessStatus(
            processId,
            'error',
            `Test generation failed: ${testGenError.message}`
          );
          return;
        }

        await this.processManager.updateProcessStatus(processId, 'executing_test_cases');
        await this.processManager.updateProcessTestCaseCount(processId, testCases.length);

        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];

          logger.processing(`Processing test case ${i + 1}/${testCases.length}: ${testCase.testCaseName}`, {
            processId
          });

          const result = await this.testCaseExecutor.executeTestCase(testCase);

          const testCaseDoc = {
            testCaseId: uuidv4(),
            processId,
            testCaseName: testCase.testCaseName,
            description: testCase.description,
            url: testCase.url,
            method: testCase.method,
            headers: testCase.headers,
            body: testCase.body,
            expectedResponse: testCase.expectedResponse,
            testPurpose: testCase.testPurpose,
            result: result,
            order: i + 1,
            createdAt: new Date(),
            executedAt: new Date()
          };

          await this.testCaseRepo.createTestCase(testCaseDoc);
          await this.processManager.updateCompletedTestCases(processId, i + 1);

          logger.success(`Test case ${i + 1} completed and saved`, { processId });
        }

        await this.processManager.updateProcessStatus(processId, 'completed');
        logger.success('Background processing completed', { processId });
      } catch (error) {
        logger.error('Error in background processing', { processId, error: error.message });
        await this.processManager.updateProcessStatus(processId, 'error', error.message);
      }
    });
  }

  async getProcessWithTestCases(processId) {
    return await this.processManager.getProcessWithTestCases(processId);
  }

  async getAiInteractions(processId) {
    return await this.aiInteractionManager.getAiInteractions(processId);
  }
}
