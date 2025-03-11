import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
      res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};