// Custom Error Classes for better error handling

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  public readonly details?: any;

  constructor(message: string = "Validation failed", details?: any) {
    super(message, 400);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, 400);
    this.name = "BadRequestError";
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
    this.name = "InternalServerError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service unavailable") {
    super(message, 503);
    this.name = "ServiceUnavailableError";
  }
}

export class ExternalAPIError extends AppError {
  public readonly service?: string;
  public readonly originalError?: any;

  constructor(message: string = "External API error", service?: string, originalError?: any) {
    super(message, 502);
    this.name = "ExternalAPIError";
    this.service = service;
    this.originalError = originalError;
  }
}

export class DatabaseError extends AppError {
  public readonly operation?: string;

  constructor(message: string = "Database error", operation?: string) {
    super(message, 503);
    this.name = "DatabaseError";
    this.operation = operation;
  }
}

export class FileUploadError extends AppError {
  public readonly field?: string;
  public readonly fileSize?: number;

  constructor(message: string = "File upload error", field?: string, fileSize?: number) {
    super(message, 400);
    this.name = "FileUploadError";
    this.field = field;
    this.fileSize = fileSize;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = "Rate limit exceeded", retryAfter?: number) {
    super(message, 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends AppError {
  public readonly timeout?: number;

  constructor(message: string = "Request timeout", timeout?: number) {
    super(message, 408);
    this.name = "TimeoutError";
    this.timeout = timeout;
  }
}

// Utility function to create errors from different sources
export const createError = {
  fromMongoose: (error: any): AppError => {
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return new ValidationError('Validation failed', details);
    }
    
    if (error.name === 'CastError') {
      return new BadRequestError('Invalid ID format');
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      return new ConflictError(`Duplicate ${field}: ${error.keyValue?.[field]}`);
    }
    
    return new DatabaseError('Database operation failed');
  },

  fromAxios: (error: any): ExternalAPIError => {
    const message = error.response?.data?.message || error.message || 'External API error';
    const service = error.config?.url || 'Unknown service';
    return new ExternalAPIError(message, service, error);
  },

  fromJWT: (error: any): UnauthorizedError => {
    if (error.name === 'TokenExpiredError') {
      return new UnauthorizedError('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return new UnauthorizedError('Invalid token');
    }
    return new UnauthorizedError('Authentication failed');
  },

  fromMulter: (error: any): FileUploadError => {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new FileUploadError('File size too large', error.field, error.limit);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return new FileUploadError('Unexpected file field', error.field);
    }
    return new FileUploadError('File upload failed');
  }
};

// Async error wrapper utility
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response formatter
export const formatErrorResponse = (error: AppError, req?: any) => {
  const response: any = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    statusCode: error.statusCode
  };

  if (req) {
    response.path = req.originalUrl;
    response.method = req.method;
  }

  if (error.details) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
};
