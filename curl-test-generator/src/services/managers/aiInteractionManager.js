import { v4 as uuidv4 } from 'uuid';
import { AiInteractionRepository } from '../../repositories/aiInteractionRepository.js';
import { logger } from '../../utils/logger.js';

export class AiInteractionManager {
  constructor() {
    this.aiRepo = new AiInteractionRepository();
  }

  async saveAiInteraction(
    processId,
    prompt,
    response,
    model = 'gemini-2.5-flash',
    retryAttempt = 0,
    isRetry = false
  ) {
    try {
      const interactionDoc = {
        interactionId: uuidv4(),
        processId,
        prompt,
        response,
        model,
        retryAttempt,
        isRetry,
        createdAt: new Date(),
        promptLength: prompt.length,
        responseLength: response.length
      };

      await this.aiRepo.saveInteraction(interactionDoc);
      logger.success('AI interaction saved to database', { 
        processId, 
        retryAttempt,
        promptLength: prompt.length,
        responseLength: response.length
      });
    } catch (error) {
      logger.error('Failed to save AI interaction', { 
        processId, 
        error: error.message 
      });
    }
  }

  async getAiInteractions(processId) {
    try {
      return await this.aiRepo.findByProcessId(processId);
    } catch (error) {
      logger.error('Failed to get AI interactions', { processId, error: error.message });
      throw new DatabaseError(`Failed to get AI interactions: ${error.message}`);
    }
  }
}
