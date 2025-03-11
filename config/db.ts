import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import Deal from '@/models/Deal';
import User from '@/models/User';
import Query from '@/models/Query';

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
    
    console.log('Checking for required collections...');
    
    if (!collectionNames.includes('deals')) {
      console.log('Creating deals collection...');
      await Deal.createCollection();
      console.log('Deals collection created');
    }
    
    if (!collectionNames.includes('users')) {
      console.log('Creating users collection...');
      await User.createCollection();
      console.log('Users collection created');
    }
    
    if (!collectionNames.includes('queries')) {
      console.log('Creating queries collection...');
      await Query.createCollection();
      console.log('Queries collection created');
    }
    
    console.log('All required collections are initialized');
  } catch (error) {
    console.error('Error initializing models:', error);
  }
};

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB connected');
  } catch (err: any) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};