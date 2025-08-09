import { MongoClient } from 'mongodb';
import { config } from './index.js';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../errors/index.js';

class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.db;
      }

      logger.processing('Connecting to MongoDB...');
      
      this.client = new MongoClient(config.get('database.uri'), config.get('database.options'));
      await this.client.connect();
      
      await this.client.db('admin').command({ ping: 1 });
      
      this.db = this.client.db();
      this.isConnected = true;
      
      await this.createIndexes();
      
      logger.success('Connected to MongoDB successfully');
      return this.db;
    } catch (error) {
      logger.error('MongoDB connection failed', { error: error.message });
      throw new DatabaseError(`Failed to connect to database: ${error.message}`);
    }
  }

  async createIndexes() {
    try {
      const db = this.getDatabase();
      
      await db.collection('curl_processes').createIndex({ processId: 1 }, { unique: true });
      await db.collection('curl_processes').createIndex({ createdAt: 1 });
      await db.collection('curl_processes').createIndex({ status: 1 });
      
      await db.collection('test_cases').createIndex({ processId: 1 });
      await db.collection('test_cases').createIndex({ testCaseId: 1 }, { unique: true });
      await db.collection('test_cases').createIndex({ order: 1 });
      
      await db.collection('ai_interactions').createIndex({ processId: 1 });
      await db.collection('ai_interactions').createIndex({ createdAt: 1 });
      
      logger.success('Database indexes created successfully');
    } catch (error) {
      logger.warn('Failed to create some indexes', { error: error.message });
    }
  }

  getDatabase() {
    if (!this.db || !this.isConnected) {
      throw new DatabaseError('Database not initialized. Call connect() first.');
    }
    return this.db;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected' };
      }
      
      await this.client.db('admin').command({ ping: 1 });
      return { status: 'connected', database: this.db.databaseName };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

export const databaseManager = new DatabaseManager();
