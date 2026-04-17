import mongoose from 'mongoose';
import { config } from './index.js';

// Connection state tracking
let isConnected = false;

let mongoServer: { getUri: () => string; stop: () => Promise<void> } | null = null;

/**
 * Connect to MongoDB database (with fallback to in-memory)
 */
export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('📦 Using existing database connection');
    return;
  }

  // Try Atlas first
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      ...config.mongodb.options,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`📦 MongoDB Atlas connected: ${conn.connection.host}`);
    return;
  } catch {
    console.log('⚠️  Atlas connection failed, starting in-memory MongoDB...');
  }

  // Fallback to in-memory MongoDB
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`📦 MongoDB In-Memory connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
    isConnected = false;
    console.log('📦 MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
}

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('📦 MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default { connectDatabase, disconnectDatabase };
