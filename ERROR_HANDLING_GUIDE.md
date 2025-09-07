# Error Handling Implementation Guide

## Overview

This document outlines the comprehensive error handling implementation for the Scholarmate backend application. The error handling system is designed to provide consistent, informative, and secure error responses across all API endpoints.

## Architecture

### 1. Global Error Handling Middleware

**File**: `src/api/middlewares/global-error-handling-middleware.ts`

The global error handling middleware is the central component that catches and processes all errors in the application. It provides:

- **Comprehensive Error Classification**: Handles various error types including validation, authentication, database, and external API errors
- **Enhanced Logging**: Logs detailed error information with request context
- **Consistent Response Format**: Returns standardized error responses
- **Security**: Prevents sensitive information leakage in production

### 2. Custom Error Classes

**File**: `src/domain/errors/custom-errors.ts`

Custom error classes extend the base `AppError` class and provide:

- **Type Safety**: Strongly typed error objects
- **Status Codes**: Automatic HTTP status code assignment
- **Operational vs Programming Errors**: Distinction between expected and unexpected errors
- **Error Utilities**: Helper functions for creating errors from different sources

#### Available Error Classes:

- `NotFoundError` (404)
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `ConflictError` (409)
- `BadRequestError` (400)
- `InternalServerError` (500)
- `ServiceUnavailableError` (503)
- `ExternalAPIError` (502)
- `DatabaseError` (503)
- `FileUploadError` (400)
- `RateLimitError` (429)
- `TimeoutError` (408)

### 3. Async Error Handler

**File**: `src/api/middlewares/async-error-handler.ts`

Provides utilities for handling async operations:

- `catchAsync`: Wrapper for async route handlers
- `asyncHandler`: Alternative async wrapper
- Process-level error handlers for unhandled rejections and exceptions

### 4. Request Validation Middleware

**File**: `src/api/middlewares/request-validation-middleware.ts`

Validation middleware for request data:

- `validateRequestBody`: Validates request body against schema
- `validateRequestParams`: Validates URL parameters
- `validateRequestQuery`: Validates query parameters
- `validateObjectId`: Validates MongoDB ObjectId format
- `validateRequiredFields`: Ensures required fields are present
- `sanitizeInput`: Sanitizes input data

## Implementation Patterns

### 1. Route Handler Pattern

```typescript
// Before (inconsistent error handling)
router.get('/books', getAllBooks);

// After (consistent error handling)
router.get('/books', (req, res, next) => {
  getAllBooks(req, res, next).catch(next);
});
```

### 2. Application Layer Pattern

```typescript
export const getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await Book.find();
    res.status(200).json({
      success: true,
      data: books,
      count: books.length
    });
  } catch (error: any) {
    console.error('Error fetching books:', error);
    next(error);
  }
};
```

### 3. Error Creation Pattern

```typescript
// Using custom error classes
if (!book) {
  throw new NotFoundError("Book not found");
}

// Using error utilities
catch (error: any) {
  const appError = createError.fromMongoose(error);
  next(appError);
}
```

## Error Response Format

All errors follow a consistent response format:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/books/123",
  "method": "GET",
  "details": {
    "field": "value",
    "message": "Specific validation error"
  },
  "requestId": "req-123" // if available
}
```

## Error Types Handled

### 1. Validation Errors
- **Mongoose Validation**: Field validation failures
- **Request Validation**: Invalid request data
- **ObjectId Validation**: Invalid MongoDB ObjectId format

### 2. Authentication & Authorization
- **JWT Errors**: Invalid or expired tokens
- **Unauthorized Access**: Missing or invalid credentials
- **Forbidden Access**: Insufficient permissions

### 3. Database Errors
- **Connection Issues**: MongoDB connection problems
- **Duplicate Keys**: Unique constraint violations
- **Cast Errors**: Invalid data type conversions

### 4. External API Errors
- **Axios Errors**: HTTP request failures
- **Service Unavailable**: External service downtime
- **Rate Limiting**: API rate limit exceeded

### 5. File Upload Errors
- **File Size**: Files exceeding size limits
- **File Type**: Unsupported file formats
- **Upload Failures**: General upload errors

### 6. System Errors
- **Memory Issues**: Out of memory errors
- **Timeout Errors**: Request timeouts
- **Network Errors**: Network connectivity issues

## Logging

The error handling system provides comprehensive logging:

```
=== ERROR HANDLING MIDDLEWARE ===
Timestamp: 2024-01-01T00:00:00.000Z
Method: GET
URL: /api/books/123
User ID: user_123
Error Name: NotFoundError
Error Message: Book not found
Error Stack: [stack trace]
===================================
```

## Security Considerations

1. **Information Disclosure**: Sensitive information is not exposed in production
2. **Stack Traces**: Only shown in development environment
3. **Error Sanitization**: User input is sanitized before processing
4. **Rate Limiting**: Protection against abuse

## Best Practices

### 1. Always Use Try-Catch
```typescript
try {
  // Your code here
} catch (error: any) {
  console.error('Context:', error);
  next(error);
}
```

### 2. Use Specific Error Types
```typescript
// Good
throw new NotFoundError("User not found");

// Avoid
throw new Error("User not found");
```

### 3. Validate Input Early
```typescript
if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
  throw new ValidationError("Invalid user ID format");
}
```

### 4. Log Errors with Context
```typescript
console.error('Error fetching user:', { userId, error: error.message });
```

### 5. Use Async Error Handlers
```typescript
router.get('/users/:id', catchAsync(getUserById));
```

## Testing Error Handling

### 1. Unit Tests
Test individual error scenarios:
```typescript
it('should throw NotFoundError when user not found', async () => {
  await expect(getUserById(req, res, next)).rejects.toThrow(NotFoundError);
});
```

### 2. Integration Tests
Test error handling in API endpoints:
```typescript
it('should return 404 for invalid user ID', async () => {
  const response = await request(app).get('/api/users/invalid-id');
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
});
```

## Monitoring and Alerting

1. **Error Tracking**: All errors are logged with context
2. **Metrics**: Error rates and types can be monitored
3. **Alerts**: Critical errors can trigger alerts
4. **Health Checks**: System health can be monitored

## Future Enhancements

1. **Error Analytics**: Detailed error analytics dashboard
2. **Automatic Recovery**: Automatic retry mechanisms
3. **Error Categorization**: Advanced error categorization
4. **Performance Monitoring**: Error impact on performance
5. **User Feedback**: Error reporting from users

## Conclusion

The comprehensive error handling system provides:

- **Consistency**: Uniform error responses across all endpoints
- **Reliability**: Robust error handling prevents application crashes
- **Debugging**: Detailed logging aids in troubleshooting
- **Security**: Protection against information disclosure
- **Maintainability**: Clean, organized error handling code

This implementation ensures that the Scholarmate application handles errors gracefully and provides a better user experience while maintaining system stability.
