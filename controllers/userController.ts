import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Get JWT secret from environment or use a default (for dev only)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide username, email, and password' 
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
      return;
    }

    // Validate username length
    if (username.length < 3) {
      res.status(400).json({ 
        success: false, 
        message: 'Username must be at least 3 characters long' 
      });
      return;
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      const field = user.email === email ? 'email' : 'username';
      res.status(400).json({ 
        success: false, 
        message: `User with this ${field} already exists` 
      });
      return;
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({ 
        success: false, 
        message: 'Please provide username and password' 
      });
      return;
    }

    // Check for user
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
      return;
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById((req as any).user.id).select('-password');
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching profile',
      error: error.message
    });
  }
};