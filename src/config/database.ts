import mongoose from 'mongoose';
import { config } from './index.js';

// Connection state tracking
let isConnected = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mongoServer: any = null;

/**
 * Connect to MongoDB database (with fallback to in-memory)
 */
export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('📦 Using existing database connection');
    return;
  }

  // Log the URI being used (mask password)
  const maskedUri = config.mongodb.uri.replace(/:([^@]+)@/, ':****@');
  console.log(`📦 Connecting to MongoDB: ${maskedUri}`);

  // Connect to MongoDB Atlas
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      ...config.mongodb.options,
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error);

    // In production, don't fall back - just fail
    if (config.isProduction) {
      console.error('❌ Cannot start without database in production');
      throw error;
    }

    // In development, try in-memory fallback
    console.log('⚠️  Trying in-memory MongoDB for development...');
  }

  // Fallback to in-memory MongoDB (development only)
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
