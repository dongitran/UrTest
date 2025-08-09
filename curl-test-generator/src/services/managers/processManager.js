import { ProcessRepository } from '../../repositories/processRepository.js';
import { TestCaseRepository } from '../../repositories/testCaseRepository.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError, DatabaseError } from '../../errors/index.js';

export class ProcessManager {
  constructor() {
    this.processRepo = new ProcessRepository();
    this.testCaseRepo = new TestCaseRepository();
  }

  async initializeProcess(curlText, processId, curlData) {
    try {
      const processDoc = {
        processId,
        originalCurl: curlData,
        originalCurlText: curlText,
        status: 'initialized',
        totalTestCases: 0,
        completedTestCases: 0,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.processRepo.insertOne(processDoc);
      logger.success('Process initialized in database', { processId });

      return {
        processId,
        status: 'initialized',
        message: 'Process started, test cases are being generated in background'
      };
    } catch (error) {
      logger.error('Failed to initialize process', { processId, error: error.message });
      throw new DatabaseError(`Failed to initialize process: ${error.message}`);
    }
  }

  async updateProcessStatus(processId, status, errorMessage = null) {
    try {
      await this.processRepo.updateStatus(processId, status, errorMessage);
      logger.debug('Process status updated', { processId, status });
    } catch (error) {
      logger.error('Failed to update process status', { processId, error: error.message });
    }
  }

  async updateProcessRetryCount(processId, retryCount) {
    try {
      await this.processRepo.updateRetryCount(processId, retryCount);
      logger.debug('Process retry count updated', { processId, retryCount });
    } catch (error) {
      logger.error('Failed to update retry count', { processId, error: error.message });
    }
  }

  async updateProcessTestCaseCount(processId, totalTestCases) {
    try {
      await this.processRepo.updateTestCaseCount(processId, totalTestCases);
      logger.debug('Process test case count updated', { processId, totalTestCases });
    } catch (error) {
      logger.error('Failed to update test case count', { processId, error: error.message });
    }
  }

  async updateCompletedTestCases(processId, completedTestCases) {
    try {
      await this.processRepo.updateCompletedTestCases(processId, completedTestCases);
      logger.debug('Completed test cases updated', { processId, completedTestCases });
    } catch (error) {
      logger.error('Failed to update completed test cases', { processId, error: error.message });
    }
  }

  async getProcessWithTestCases(processId) {
    try {
      const process = await this.processRepo.findByProcessId(processId);
      if (!process) {
        throw new NotFoundError('Process not found');
      }

      const testCases = await this.testCaseRepo.findByProcessId(processId);

      return {
        ...process,
        testCases
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to get process with test cases', { processId, error: error.message });
      throw new DatabaseError(`Failed to get process: ${error.message}`);
    }
  }
}
