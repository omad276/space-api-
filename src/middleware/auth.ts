import { Response, NextFunction } from 'express';
import { verifyAccessToken, extractBearerToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { AuthRequest, UserRole } from '../types/index.js';

// ============================================
// Authentication Middleware
// ============================================

/**
 * Require valid JWT authentication
 * Attaches user payload to request object
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  // Extract token from Authorization header
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    throw AppError.unauthorized('Authentication required');
  }

  // Verify token
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw AppError.unauthorized('Invalid or expired token');
  }

  // Attach user to request
  req.user = payload;
  next();
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that behave differently for authenticated users
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

// ============================================
// Authorization Middleware
// ============================================

/**
 * Require user to have one of the specified roles
 * Must be used after authenticate middleware
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = authorize('admin');

/**
 * Require owner or admin role
 */
export const requireOwner = authorize('owner', 'admin');

/**
 * Require agent or admin role
 */
export const requireAgent = authorize('agent', 'admin');

/**
 * Require property creator (owner, agent, or admin)
 */
export const requirePropertyCreator = authorize('owner', 'agent', 'admin');

/**
 * Require the authenticated user to be the resource owner or an admin
 */
export function requireOwnerOrAdmin(getUserId: (req: AuthRequest) => string) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const resourceUserId = getUserId(req);
    const isOwner = req.user.userId === resourceUserId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('Access denied');
    }

    next();
  };
}
