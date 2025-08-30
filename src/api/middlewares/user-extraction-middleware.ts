import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/backend';

// Create Clerk client
const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

export const extractUserInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.auth?.();

    if (auth && auth.userId) {
      console.log('Full auth object:', JSON.stringify(auth, null, 2));
      console.log('Session claims:', JSON.stringify(auth.sessionClaims, null, 2));
      
      try {
        const user = await clerkClient.users.getUser(auth.userId);
        console.log('Fetched user from Clerk API:', JSON.stringify(user, null, 2));
        
        req.user = {
          id: auth.userId,
          email: user.emailAddresses[0]?.emailAddress ?? undefined,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          role: user.publicMetadata?.role as string,
        };
        console.log('Extracted user:', req.user);
      } catch (error) {
        console.error('Error fetching user from Clerk API:', error);
        req.user = {
          id: auth.userId,
          email: auth.sessionClaims?.email,
          firstName: auth.sessionClaims?.first_name,
          lastName: auth.sessionClaims?.last_name,
          role: auth.sessionClaims?.public_metadata?.role,
        };
      }
    }

    next();
  } catch (error) {
    console.error('Error extracting user info:', error);
    next();
  }
};

// Extend the Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        role?: string;
      };
    }
  }
}