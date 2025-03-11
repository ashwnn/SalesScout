import express from 'express';
import { login, getProfile } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes

// router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);

export default router;