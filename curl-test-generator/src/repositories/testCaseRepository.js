import { BaseRepository } from './baseRepository.js';
import { COLLECTIONS } from '../constants/index.js';

export class TestCaseRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.TEST_CASES);
  }

  async findByProcessId(processId) {
    return await this.find({ processId }, { sort: { order: 1 } });
  }

  async createTestCase(testCaseDoc) {
    return await this.insertOne(testCaseDoc);
  }
}
