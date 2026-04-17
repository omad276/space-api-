import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';

// ============================================
// Rate Limiting Middleware
// ============================================

/**
 * General API rate limiter
 * Applied to all /api routes
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Disable X-Forwarded-For validation for Render
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests('Too many requests, please try again later'));
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests('Too many authentication attempts, please try again later'));
  },
});

/**
 * Rate limiter for sensitive operations
 * Password changes, account deletion, etc.
 */
export const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests('Too many sensitive operations, please try again later'));
  },
});

/**
 * Rate limiter for file uploads
 * Prevents abuse of storage resources
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests('Too many file uploads, please try again later'));
  },
});
