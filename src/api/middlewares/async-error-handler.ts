import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../domain/errors/custom-errors';

// Wrapper for async route handlers to catch errors
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Alternative implementation using the custom error handler
export const asyncErrorHandler = asyncHandler;

// Middleware to handle unhandled promise rejections
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    console.error('====================================');
    
    // In production, you might want to gracefully shut down the server
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
};

// Middleware to handle uncaught exceptions
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('=========================');
    
    // In production, you might want to gracefully shut down the server
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
};

// Middleware to handle SIGTERM signal
export const handleGracefulShutdown = () => {
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });
};

// Middleware to handle SIGINT signal (Ctrl+C)
export const handleInterrupt = () => {
  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
};

// Initialize all error handlers
export const initializeErrorHandlers = () => {
  handleUnhandledRejection();
  handleUncaughtException();
  handleGracefulShutdown();
  handleInterrupt();
};
