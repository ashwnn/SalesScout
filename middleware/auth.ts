import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '@/utils/logger';

const logger = createLogger('Auth');

// JWT Secret must be set in environment - no fallback for security
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      // Add user to request object
      (req as any).user = { id: decoded.id };

      next();
    } catch (error) {
      logger.debug('Invalid token attempt');
      res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
      return;
    }
  } else {
    logger.debug('No token provided in request');
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
    return;
  }
};