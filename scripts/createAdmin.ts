/**
 * Admin User Creation Script
 * 
 * Use this script to create admin users directly in the database
 * when registration is disabled.
 * 
 * Usage:
 *   ts-node scripts/createAdmin.ts <username> <email> <password>
 * 
 * Example:
 *   ts-node scripts/createAdmin.ts admin admin@example.com MySecurePassword123
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async (username: string, email: string, password: string) => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/redflagdeals';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Validate input
    if (!username || !email || !password) {
      console.error('Error: Username, email, and password are required');
      console.log('Usage: ts-node scripts/createAdmin.ts <username> <email> <password>');
      process.exit(1);
    }

    if (username.length < 3) {
      console.error('Error: Username must be at least 3 characters long');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters long');
      process.exit(1);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Error: Invalid email format');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      console.error(`Error: User with this ${field} already exists`);
      process.exit(1);
    }

    // Create new user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log('-----------------------------------');
    console.log('\nYou can now log in with these credentials.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Error: Missing required arguments');
  console.log('\nUsage: ts-node scripts/createAdmin.ts <username> <email> <password>');
  console.log('\nExample:');
  console.log('  ts-node scripts/createAdmin.ts admin admin@example.com MySecurePassword123');
  process.exit(1);
}

const [username, email, password] = args;

createAdmin(username, email, password);
