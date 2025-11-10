import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

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
    console.error('Error in preventDemoActions middleware:', error);
    next();
  }
};
