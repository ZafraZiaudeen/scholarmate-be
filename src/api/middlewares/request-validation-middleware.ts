import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../domain/errors/custom-errors';

// Middleware to validate request body
export const validateRequestBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError('Invalid request body', result.error.errors);
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to validate request parameters
export const validateRequestParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        throw new ValidationError('Invalid request parameters', result.error.errors);
      }
      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to validate request query
export const validateRequestQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        throw new ValidationError('Invalid query parameters', result.error.errors);
      }
      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to validate ObjectId format
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName];
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ValidationError(`Invalid ${paramName} format`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to validate required fields
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const missingFields = fields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to sanitize input
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize string fields in body
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    
    // Sanitize string fields in query
    if (req.query && typeof req.query === 'object') {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
