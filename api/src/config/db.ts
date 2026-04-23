import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB(): Promise<void> {
  try {
    let uri = env.MONGODB_URI;
    let source = 'configured MongoDB';

    if (!uri) {
      if (!env.USE_IN_MEMORY_DB) {
        throw new Error('MONGODB_URI is required. Set it in api/.env or enable USE_IN_MEMORY_DB=true for disposable local development.');
      }

      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      source = 'in-memory MongoDB';
    }

    await mongoose.connect(uri);
    logger.info(`Connected to ${source}`);
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error');
    process.exit(1);
  }
}
