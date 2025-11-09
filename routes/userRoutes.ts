import express from 'express';
import { register, login, getProfile, registerValidation, loginValidation } from '../controllers/userController';
import { protect } from '../middleware/auth';
import { authRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes with strict rate limiting for authentication
router.post('/register', authRateLimiter, registerValidation, register);
router.post('/login', authRateLimiter, loginValidation, login);

// Protected routes with general API rate limiting
router.get('/profile', protect, apiRateLimiter, getProfile);

export default router;