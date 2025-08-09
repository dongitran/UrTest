import { getDB } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { CurlParser } from '../parsers/curlParser.js';
import { JsonExtractor } from '../extractors/jsonExtractor.js';
import { TestCaseGenerator } from '../generators/testCaseGenerator.js';
import { TestCaseExecutor } from '../executors/testCaseExecutor.js';
import { ProcessManager } from '../managers/processManager.js';
import { AiInteractionManager } from '../managers/aiInteractionManager.js';

export class CurlService {
  constructor() {
    this.db = null;

    this.curlParser = new CurlParser();
    this.jsonExtractor = new JsonExtractor();
    this.processManager = new ProcessManager(() => this.getDatabase());
    this.aiInteractionManager = new AiInteractionManager(() => this.getDatabase());
    this.testCaseGenerator = new TestCaseGenerator(
      () => this.getDatabase(),
      this.jsonExtractor,
      this.processManager,
      this.aiInteractionManager
    );
    this.testCaseExecutor = new TestCaseExecutor();
  }

  getDatabase() {
    if (!this.db) {
      this.db = getDB();
    }
    return this.db;
  }

  async initializeProcess(curlText, processId) {
    try {
      const curlData = await this.curlParser.parseCurl(curlText);
      return await this.processManager.initializeProcess(curlText, processId, curlData);
    } catch (error) {
      console.error('❌ Error initializing process:', error);
      throw new Error(`Failed to initialize process: ${error.message}`);
    }
  }

  async processInBackground(processId, curlText) {
    setImmediate(async () => {
      try {
        console.log(
          `🔄 Background processing started for processId: ${processId}`
        );

        await this.processManager.updateProcessStatus(processId, 'parsing_curl');
        const curlData = await this.curlParser.parseCurl(curlText);

        await this.processManager.updateProcessStatus(processId, 'generating_test_cases');

        let testCases;
        try {
          testCases = await this.testCaseGenerator.generateMultipleTestCases(curlData, processId);
        } catch (testGenError) {
          console.error(
            '❌ Test case generation failed:',
            testGenError.message
          );
          await this.processManager.updateProcessStatus(
            processId,
            'error',
            `Test generation failed: ${testGenError.message}`
          );
          return;
        }

        await this.processManager.updateProcessStatus(processId, 'executing_test_cases');
        await this.processManager.updateProcessTestCaseCount(processId, testCases.length);

        const db = this.getDatabase();
        const testCaseCollection = db.collection('test_cases');

        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];

          console.log(
            `🧪 Processing test case ${i + 1}/${testCases.length}: ${
              testCase.testCaseName
            }`
          );

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
            executedAt: new Date(),
          };

          await testCaseCollection.insertOne(testCaseDoc);
          await this.processManager.updateCompletedTestCases(processId, i + 1);

          console.log(`✅ Test case ${i + 1} completed and saved`);
        }

        await this.processManager.updateProcessStatus(processId, 'completed');
        console.log(
          `🎉 Background processing completed for processId: ${processId}`
        );
      } catch (error) {
        console.error('❌ Error in background processing:', error);
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
