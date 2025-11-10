import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { createLogger } from '@/utils/logger';

const logger = createLogger('DemoMode');

export const preventDemoActions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return next();
    }

    const user = await User.findById(userId);
    
    if (user && user.isDemo) {
      // Check if the request is a breaking change (POST, PUT, DELETE, PATCH)
      const breakingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      if (breakingMethods.includes(req.method)) {
        logger.warn(`Demo user attempted ${req.method} request to ${req.path}`);
        res.status(403).json({
          success: false,
          message: 'Demo account cannot make changes. Please create your own account to use all features.',
          isDemo: true
        });
        return;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error in preventDemoActions middleware:', error);
    next();
  }
};
