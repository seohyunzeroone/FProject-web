/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the API server.
 * Sanitizes error messages to prevent information leakage.
 * 
 * Requirements: 9.6
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Error handler middleware
 * 
 * Catches all errors and returns appropriate HTTP responses.
 * Sanitizes error messages to avoid exposing sensitive information.
 * 
 * @param error - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errorType = 'ServerError';

  // Handle specific error types
  if (error.name === 'ValidationError' || error.name === 'InquiryValidationError' || error.name === 'ReportValidationError') {
    statusCode = 400;
    message = error.message;
    errorType = 'ValidationError';
  } else if (error.name === 'UserNotFoundError') {
    statusCode = 404;
    message = 'User not found';
    errorType = 'NotFoundError';
  } else if (error.name === 'SelfReportError') {
    statusCode = 400;
    message = error.message;
    errorType = 'ValidationError';
  } else if (error.name === 'DuplicateReportError') {
    statusCode = 409;
    message = error.message;
    errorType = 'ConflictError';
  } else if (error.name === 'InvalidReportReasonError') {
    statusCode = 400;
    message = error.message;
    errorType = 'ValidationError';
  } else if (error.name === 'NicknameAlreadyExistsError') {
    statusCode = 409;
    message = error.message;
    errorType = 'ConflictError';
  } else if (error.name === 'UnauthorizedError' || error.message?.includes('token')) {
    statusCode = 401;
    message = 'Unauthorized';
    errorType = 'AuthenticationError';
  } else if (error.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
    errorType = 'ConflictError';
  } else if (error.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference';
    errorType = 'ValidationError';
  } else if (error.statusCode) {
    // Use error's status code if available
    statusCode = error.statusCode;
    message = error.message || message;
  }

  // Sanitize error message in production (Requirement 9.6)
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
  }

  res.status(statusCode).json({
    error: errorType,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

/**
 * Async handler wrapper
 * 
 * Wraps async route handlers to catch errors and pass them to error handler.
 * 
 * @param fn - Async route handler function
 * @returns Wrapped function
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
