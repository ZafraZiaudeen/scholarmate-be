import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: any;
  errors?: any;
}

const globalErrorHandlingMiddleware = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Enhanced logging with request context
  console.error('=== ERROR HANDLING MIDDLEWARE ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('User ID:', req.user?.id || 'Anonymous');
  console.error('Error Name:', error.name);
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack);
  console.error('===================================');

  // Default error response
  let statusCode = 500;
  let message = "Internal Server Error";
  let details: any = undefined;

  // Handle different types of errors
  if (error.name === "NotFoundError") {
    statusCode = 404;
    message = error.message;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = error.message;
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401;
    message = error.message;
  } else if (error.name === "ForbiddenError") {
    statusCode = 403;
    message = error.message;
  } else if (error.name === "CastError") {
    // MongoDB CastError (invalid ObjectId, etc.)
    statusCode = 400;
    message = "Invalid ID format";
  } else if (error.code === 11000) {
    // MongoDB Duplicate Key Error
    statusCode = 409;
    message = "Duplicate entry detected";
    const field = Object.keys(error.keyValue || {})[0];
    details = { field, value: error.keyValue?.[field] };
  } else if (error.name === "ValidationError" && error.errors) {
    // Mongoose Validation Error
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } else if (error.name === "MulterError") {
    // File upload errors
    statusCode = 400;
    if (error.message.includes('File too large')) {
      message = "File size too large";
    } else if (error.message.includes('Unexpected field')) {
      message = "Unexpected file field";
    } else {
      message = "File upload error";
    }
  } else if (error.name === "SyntaxError" && error.message.includes('JSON')) {
    statusCode = 400;
    message = "Invalid JSON format";
  } else if (error.name === "TypeError" && error.message.includes('Cannot read property')) {
    statusCode = 500;
    message = "Internal server error - property access issue";
  } else if (error.name === "ReferenceError") {
    statusCode = 500;
    message = "Internal server error - reference issue";
  } else if (error.name === "RangeError") {
    statusCode = 400;
    message = "Invalid range or value";
  } else if (error.name === "EvalError") {
    statusCode = 500;
    message = "Internal server error - evaluation issue";
  } else if (error.name === "URIError") {
    statusCode = 400;
    message = "Invalid URI format";
  } else if (error.name === "AggregateError") {
    statusCode = 500;
    message = "Multiple errors occurred";
    details = error.message;
  } else if (error.name === "TimeoutError") {
    statusCode = 408;
    message = "Request timeout";
  } else if (error.name === "NetworkError") {
    statusCode = 503;
    message = "Network error - service unavailable";
  } else if (error.name === "DatabaseError") {
    statusCode = 503;
    message = "Database connection error";
  } else if (error.name === "ExternalAPIError") {
    statusCode = 502;
    message = "External service error";
  } else if (error.statusCode) {
    // Custom error with status code
    statusCode = error.statusCode;
    message = error.message;
  }

  // Handle mongoose connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    statusCode = 503;
    message = "Database connection error";
  }

  // Handle axios errors (external API calls)
  if (error.name === 'AxiosError') {
    statusCode = 502;
    message = "External service error";
    details = {
      url: (error as any).config?.url,
      method: (error as any).config?.method,
      status: (error as any).response?.status,
      statusText: (error as any).response?.statusText
    };
  }

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

export default globalErrorHandlingMiddleware;