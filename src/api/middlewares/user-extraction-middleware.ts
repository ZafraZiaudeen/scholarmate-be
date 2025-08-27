import { Request, Response, NextFunction } from 'express';

export const extractUserInfo = (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.auth?.();
    
    if (auth && auth.userId) {
      // Add user information to the request object
      req.user = {
        id: auth.userId,
        // Add other user properties if available from Clerk
        email: auth.sessionClaims?.email,
        firstName: auth.sessionClaims?.firstName,
        lastName: auth.sessionClaims?.lastName
      };
    }
    
    next();
  } catch (error) {
    console.error('Error extracting user info:', error);
    next();
  }
};

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}
