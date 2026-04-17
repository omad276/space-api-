import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { ApiErrorResponse } from '../types/index.js';
import { config } from '../config/index.js';

// ============================================
// Error Handler Middleware
// ============================================

/**
 * Global error handling middleware
 * Converts all errors to consistent API response format
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log error in development
  if (config.isDevelopment) {
    console.error('❌ Error:', err);
  }

  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: Record<string, string[]> | undefined;

  // Handle known error types
  if (err instanceof AppError) {
    // Custom application error
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    // Zod validation error
    statusCode = 400;
    message = 'Validation failed';
    errors = {};
    for (const issue of err.errors) {
      const field = issue.path.join('.') || 'value';
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(issue.message);
    }
  } else if (err instanceof mongoose.Error.ValidationError) {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    errors = {};
    for (const [field, error] of Object.entries(err.errors)) {
      errors[field] = [error.message];
    }
  } else if (err instanceof mongoose.Error.CastError) {
    // Mongoose cast error (invalid ObjectId, etc.)
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (
    err.name === 'MongoServerError' &&
    (err as unknown as { code: number }).code === 11000
  ) {
    // MongoDB duplicate key error
    statusCode = 409;
    const field =
      Object.keys((err as unknown as { keyValue: Record<string, unknown> }).keyValue || {})[0] ||
      'field';
    message = `${field} already exists`;
    errors = { [field]: [`${field} already exists`] };
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired error
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // JSON parse error
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Build response
  const response: ApiErrorResponse = {
    success: false,
    message,
    errors,
  };

  // Include stack trace in development
  if (config.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// ============================================
// 404 Handler
// ============================================

/**
 * Handle 404 Not Found errors for undefined routes
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.path} not found`));
}
