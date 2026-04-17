import { Response, NextFunction } from 'express';
import { AuthRequest, Permission, ROLE_PERMISSIONS } from '../types/index.js';
import { AppError } from '../utils/AppError.js';

// ============================================
// Permission-Based Middleware
// ============================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(permission: Permission) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role];
    if (!userPermissions || !userPermissions.includes(permission)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(...permissions: Permission[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role];
    if (!userPermissions) {
      throw AppError.forbidden('Invalid role');
    }

    const hasAny = permissions.some((p) => userPermissions.includes(p));
    if (!hasAny) {
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(...permissions: Permission[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role];
    if (!userPermissions) {
      throw AppError.forbidden('Invalid role');
    }

    const hasAll = permissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
}

/**
 * Check resource ownership or admin permission
 * @param getResourceOwnerId - Function to extract owner ID from request (can be async)
 * @param bypassPermission - Permission that allows bypassing ownership check (default: property:update:any)
 */
export function requireOwnership(
  getResourceOwnerId: (req: AuthRequest) => string | Promise<string>,
  bypassPermission: Permission = 'property:update:any'
) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required');
      }

      const userPermissions = ROLE_PERMISSIONS[req.user.role];

      // Check if user has bypass permission (e.g., admin)
      if (userPermissions && userPermissions.includes(bypassPermission)) {
        return next();
      }

      // Check ownership
      const ownerId = await getResourceOwnerId(req);
      if (req.user.userId !== ownerId) {
        throw AppError.forbidden('Access denied - not resource owner');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Helper to check if a user has a specific permission (non-middleware)
 */
export function userHasPermission(role: string, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  return userPermissions ? userPermissions.includes(permission) : false;
}

/**
 * Helper to check if a user has admin access (non-middleware)
 */
export function isAdmin(role: string): boolean {
  return userHasPermission(role, 'admin:access');
}
