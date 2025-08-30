import { NextFunction, Request, Response } from 'express';
import ForbiddenError from '../../domain/errors/forbidden-error';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.auth();

  console.log('Auth object:', auth);
  console.log('Session claims:', JSON.stringify(auth?.sessionClaims, null, 2));
  console.log('Req.user:', req.user);

  if (!auth || !auth.userId) {
    console.log('Authentication data is missing');
    throw new ForbiddenError('Unauthorized');
  }

  // Check if user extraction middleware has populated req.user
  if (!req.user) {
    console.log('User data not extracted');
    throw new ForbiddenError('User data not available');
  }

  // Access role from req.user (populated by extractUserInfo middleware)
  const role = req.user.role;

  if (!role) {
    console.log('No role found in user data');
    throw new ForbiddenError('No role specified');
  }

  if (typeof role !== 'string' || role.toLowerCase() !== 'admin') {
    console.log('Role is not admin, got:', role);
    throw new ForbiddenError('User is not an admin');
  }

  next();
};