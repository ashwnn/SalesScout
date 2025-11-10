import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { body, validationResult } from 'express-validator';
import validator from 'validator';

// Get JWT secret from environment - must be set (checked in auth.ts)
const JWT_SECRET = process.env.JWT_SECRET!;

// Validation rules for registration
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .escape(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
];

// Validation rules for login
export const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];


// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg,
        errors: errors.array()
      });
      return;
    }

    // Check if registration is enabled
    const registrationEnabled = process.env.ALLOW_REGISTRATION === 'true';
    console.log('Registration enabled:', registrationEnabled);
    
    if (!registrationEnabled) {
      res.status(404).json({ 
        success: false, 
        message: 'Registration is currently disabled. Please contact the administrator.' 
      });
      return;
    }

    const { username, email, password } = req.body;

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
      message: 'Error registering user'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg
      });
      return;
    }

    const { username, password } = req.body;

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
        email: user.email,
        isDemo: user.isDemo || false
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching profile'
    });
  }
};

// Get app configuration (public endpoint)
export const getAppConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const demoMode = process.env.DEMO_MODE === 'true';
    const registrationEnabled = process.env.ALLOW_REGISTRATION === 'true';
    
    res.json({
      success: true,
      config: {
        demoMode,
        registrationEnabled
      }
    });
  } catch (error: any) {
    console.error('Get app config error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching app configuration'
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
        isDemo: user.isDemo || false,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching profile'
    });
  }
};