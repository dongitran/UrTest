import { BaseRepository } from './baseRepository.js';
import { COLLECTIONS } from '../constants/index.js';

export class AiInteractionRepository extends BaseRepository {
  constructor() {
    super(COLLECTIONS.AI_INTERACTIONS);
  }

  async findByProcessId(processId) {
    return await this.find({ processId }, { sort: { createdAt: 1 } });
  }

  async saveInteraction(interactionDoc) {
    return await this.insertOne(interactionDoc);
  }
}
