import { NextFunction, Request, Response } from 'express';
import ForbiddenError from '../../domain/errors/forbidden-error';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.auth();

  console.log('Auth object:', auth);

  if (!auth) {
    console.log('Authentication data is missing');
    throw new ForbiddenError('Forbidden');
  }

  // Access role from sessionClaims.metadata
  const role = auth.sessionClaims?.metadata?.role;

  console.log('Role from sessionClaims.metadata:', role);

  if (!role) {
    console.log('No role found in sessionClaims.metadata');
    throw new ForbiddenError('Forbidden');
  }

  if (typeof role !== 'string' || role.toLowerCase() !== 'admin') {
    console.log('Role is not admin, got:', role);
    throw new ForbiddenError('Forbidden');
  }

  next();
};
