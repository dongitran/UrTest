import { v4 as uuidv4 } from 'uuid';

export class AiInteractionManager {
  constructor(getDatabase) {
    this.getDatabase = getDatabase;
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
      const db = this.getDatabase();
      const aiCollection = db.collection('ai_interactions');

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
        responseLength: response.length,
      };

      await aiCollection.insertOne(interactionDoc);
      console.log(
        `✅ AI interaction saved to database (retry: ${retryAttempt})`
      );
    } catch (error) {
      console.error('❌ Error saving AI interaction:', error);
    }
  }

  async getAiInteractions(processId) {
    try {
      const db = this.getDatabase();
      const aiCollection = db.collection('ai_interactions');

      const interactions = await aiCollection
        .find({ processId })
        .sort({ createdAt: 1 })
        .toArray();

      return interactions;
    } catch (error) {
      console.error('❌ Error getting AI interactions:', error);
      throw new Error(`Failed to get AI interactions: ${error.message}`);
    }
  }
}
