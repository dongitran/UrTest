import { BaseRepository } from './baseRepository.js';
import { COLLECTIONS } from '../constants/index.js';

export class ProcessRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.CURL_PROCESSES);
  }

  async findByProcessId(processId) {
    return await this.findOne({ processId });
  }

  async updateStatus(processId, status, errorMessage = null) {
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (errorMessage) {
      updateData.error = errorMessage;
    }

    return await this.updateOne({ processId }, { $set: updateData });
  }

  async updateRetryCount(processId, retryCount) {
    return await this.updateOne(
      { processId },
      {
        $set: {
          retryCount,
          updatedAt: new Date()
        }
      }
    );
  }

  async updateTestCaseCount(processId, totalTestCases) {
    return await this.updateOne(
      { processId },
      {
        $set: {
          totalTestCases,
          updatedAt: new Date()
        }
      }
    );
  }

  async updateCompletedTestCases(processId, completedTestCases) {
    return await this.updateOne(
      { processId },
      {
        $set: {
          completedTestCases,
          updatedAt: new Date()
        }
      }
    );
  }
}
