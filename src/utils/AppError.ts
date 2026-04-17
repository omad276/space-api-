/**
 * Custom application error class for consistent error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    this.errors = errors;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common error types
  static badRequest(message: string, errors?: Record<string, string[]>): AppError {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Resource not found'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static tooManyRequests(message: string = 'Too many requests'): AppError {
    return new AppError(message, 429);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500);
  }
}

export default AppError;
