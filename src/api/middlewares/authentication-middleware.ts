import { Request, Response, NextFunction } from 'express';
import UnauthorizedError from '../../domain/errors/unauthorized-error';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.auth();

  if (!auth || !auth.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  next();
};
