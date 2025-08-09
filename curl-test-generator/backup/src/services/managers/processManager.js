import { v4 as uuidv4 } from 'uuid';

export class ProcessManager {
  constructor(getDatabase) {
    this.getDatabase = getDatabase;
  }

  async initializeProcess(curlText, processId, curlData) {
    try {
      const db = this.getDatabase();
      const processCollection = db.collection('curl_processes');

      const processDoc = {
        processId,
        originalCurl: curlData,
        originalCurlText: curlText,
        status: 'initialized',
        totalTestCases: 0,
        completedTestCases: 0,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await processCollection.insertOne(processDoc);
      console.log('✅ Process initialized in database');

      return {
        processId,
        status: 'initialized',
        message:
          'Process started, test cases are being generated in background',
      };
    } catch (error) {
      console.error('❌ Error initializing process:', error);
      throw new Error(`Failed to initialize process: ${error.message}`);
    }
  }

  async updateProcessStatus(processId, status, errorMessage = null) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      const updateData = {
        status,
        updatedAt: new Date(),
      };

      if (errorMessage) {
        updateData.error = errorMessage;
      }

      await collection.updateOne({ processId }, { $set: updateData });
    } catch (error) {
      console.error('❌ Error updating process status:', error);
    }
  }

  async updateProcessRetryCount(processId, retryCount) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      await collection.updateOne(
        { processId },
        {
          $set: {
            retryCount,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error('❌ Error updating retry count:', error);
    }
  }

  async updateProcessTestCaseCount(processId, totalTestCases) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      await collection.updateOne(
        { processId },
        {
          $set: {
            totalTestCases,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error('❌ Error updating test case count:', error);
    }
  }

  async updateCompletedTestCases(processId, completedTestCases) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      await collection.updateOne(
        { processId },
        {
          $set: {
            completedTestCases,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error('❌ Error updating completed test cases:', error);
    }
  }

  async getProcessWithTestCases(processId) {
    try {
      const db = this.getDatabase();
      const processCollection = db.collection('curl_processes');
      const testCaseCollection = db.collection('test_cases');

      const process = await processCollection.findOne({ processId });
      if (!process) {
        return null;
      }

      const testCases = await testCaseCollection
        .find({ processId })
        .sort({ order: 1 })
        .toArray();

      return {
        ...process,
        testCases: testCases,
      };
    } catch (error) {
      console.error('❌ Error getting process with test cases:', error);
      throw new Error(`Failed to get process: ${error.message}`);
    }
  }
}
