import { Response } from 'express';
import * as userService from '../services/userService.js';
import { validate, userQuerySchema, updateUserSchema } from '../utils/validation.js';
import { AuthRequest, ApiResponse } from '../types/index.js';

// ============================================
// User Controller (Admin Only)
// ============================================

/**
 * GET /api/users
 * List users with pagination and filters
 */
export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const query = validate(userQuerySchema, req.query);
  const result = await userService.listUsers({
    ...query,
    isActive: query.isActive as boolean | undefined,
    isVerified: query.isVerified as boolean | undefined,
  });

  res.json({
    success: true,
    message: 'Users retrieved',
    messageAr: 'تم استرجاع المستخدمين',
    data: result.users,
    pagination: result.pagination,
  });
}

/**
 * GET /api/users/stats
 * Get user statistics
 */
export async function getStats(_req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const stats = await userService.getUserStats();

  res.json({
    success: true,
    message: 'User statistics retrieved',
    messageAr: 'تم استرجاع إحصائيات المستخدمين',
    data: stats,
  });
}

/**
 * GET /api/users/:id
 * Get a user by ID
 */
export async function getUser(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const user = await userService.getUserById(req.params.id);

  res.json({
    success: true,
    message: 'User retrieved',
    messageAr: 'تم استرجاع المستخدم',
    data: user,
  });
}

/**
 * PATCH /api/users/:id
 * Update a user
 */
export async function updateUser(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(updateUserSchema, req.body);
  const user = await userService.updateUser(req.params.id, data);

  res.json({
    success: true,
    message: 'User updated successfully',
    messageAr: 'تم تحديث المستخدم بنجاح',
    data: user,
  });
}

/**
 * DELETE /api/users/:id
 * Deactivate a user (soft delete)
 */
export async function deleteUser(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  await userService.deactivateUser(req.params.id);

  res.json({
    success: true,
    message: 'User deactivated successfully',
    messageAr: 'تم تعطيل المستخدم بنجاح',
  });
}
