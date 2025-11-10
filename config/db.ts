import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import Deal from '@/models/Deal';
import User from '@/models/User';
import Query from '@/models/Query';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Database');

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/redflagdeals';

const initializeModels = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not established');
    }
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(collection => collection.name);
    
    logger.debug('Checking for required collections...');
    
    if (!collectionNames.includes('deals')) {
      logger.info('Creating deals collection...');
      await Deal.createCollection();
      logger.info('Deals collection created');
    }
    
    if (!collectionNames.includes('users')) {
      logger.info('Creating users collection...');
      await User.createCollection();
      logger.info('Users collection created');
    }
    
    if (!collectionNames.includes('queries')) {
      logger.info('Creating queries collection...');
      await Query.createCollection();
      logger.info('Queries collection created');
    }
    
    logger.info('All required collections are initialized');
  } catch (error) {
    logger.error('Error initializing models:', error);
  }
};

export const connectDB = async () => {
  try {
    // Connection options for better stability
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const uri = process.env.MONGO_URI || mongoURI;
    
    if (!uri) {
      throw new Error('MongoDB URI is not defined');
    }

    logger.info('Connecting to MongoDB...');
    await mongoose.connect(uri, options);
    
    logger.info('MongoDB connected successfully');
    logger.info(`Database: ${mongoose.connection.name}`);
    
    // Initialize collections and indexes
    await initializeModels();
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (err: any) {
    logger.error('MongoDB connection error:', err.message);
    throw err; // Let the caller handle the error
  }
};