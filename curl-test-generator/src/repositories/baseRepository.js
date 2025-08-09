import { databaseManager } from '../config/database.js';
import { DatabaseError } from '../errors/index.js';
import { logger } from '../utils/logger.js';

export class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  getCollection() {
    try {
      const db = databaseManager.getDatabase();
      return db.collection(this.collectionName);
    } catch (error) {
      throw new DatabaseError(`Failed to get collection ${this.collectionName}: ${error.message}`);
    }
  }

  async findOne(filter, options = {}) {
    try {
      const collection = this.getCollection();
      return await collection.findOne(filter, options);
    } catch (error) {
      logger.error(`Failed to find document in ${this.collectionName}`, { filter, error: error.message });
      throw new DatabaseError(`Query failed: ${error.message}`);
    }
  }

  async find(filter = {}, options = {}) {
    try {
      const collection = this.getCollection();
      return await collection.find(filter, options).toArray();
    } catch (error) {
      logger.error(`Failed to find documents in ${this.collectionName}`, { filter, error: error.message });
      throw new DatabaseError(`Query failed: ${error.message}`);
    }
  }

  async insertOne(document) {
    try {
      const collection = this.getCollection();
      const result = await collection.insertOne(document);
      return result;
    } catch (error) {
      logger.error(`Failed to insert document in ${this.collectionName}`, { error: error.message });
      throw new DatabaseError(`Insert failed: ${error.message}`);
    }
  }

  async updateOne(filter, update, options = {}) {
    try {
      const collection = this.getCollection();
      return await collection.updateOne(filter, update, options);
    } catch (error) {
      logger.error(`Failed to update document in ${this.collectionName}`, { filter, error: error.message });
      throw new DatabaseError(`Update failed: ${error.message}`);
    }
  }

  async deleteOne(filter) {
    try {
      const collection = this.getCollection();
      return await collection.deleteOne(filter);
    } catch (error) {
      logger.error(`Failed to delete document in ${this.collectionName}`, { filter, error: error.message });
      throw new DatabaseError(`Delete failed: ${error.message}`);
    }
  }
}
