import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { createLogger } from '@/utils/logger';

const logger = createLogger('DemoMode');

/**
 * Get client IP address from request
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }
  return req.headers['x-real-ip'] as string || 
         req.socket.remoteAddress || 
         'unknown';
};

/**
 * Get comprehensive request metadata for analytics
 */
const getRequestMetadata = (req: Request) => {
  return {
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    referer: req.headers['referer'] || req.headers['referrer'] || 'direct',
    method: req.method,
    path: req.path,
    endpoint: `${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
    // Extract browser and OS info if available
    acceptLanguage: req.headers['accept-language']?.split(',')[0] || 'unknown',
    origin: req.headers['origin'] || 'unknown',
  };
};

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
        const metadata = getRequestMetadata(req);
        
        // Log comprehensive information about the blocked demo action
        logger.warn('Demo user attempted restricted action', {
          userId: user._id,
          username: user.username,
          ...metadata,
          blocked: true,
        });
        
        // Track analytics event (can be sent to Umami or other analytics services)
        logger.info('Demo action blocked - Analytics', {
          event: 'demo-action-blocked',
          category: 'demo-restrictions',
          ...metadata,
          user: {
            id: user._id,
            username: user.username,
            isDemo: true,
          },
        });
        
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
