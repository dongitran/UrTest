import { MongoClient } from 'mongodb';

let client;
let db;

export async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    await client.db('admin').command({ ping: 1 });
    console.log('✅ Connected to MongoDB successfully!');

    db = client.db();
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

export async function closeDB() {
  if (client) {
    await client.close();
  }
}
