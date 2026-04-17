import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { PublicUser, UserRole, UserQueryDTO, UpdateUserDTO, UserStats } from '../types/index.js';

// ============================================
// Types
// ============================================

interface PaginatedUsers {
  users: PublicUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// User Service
// ============================================

/**
 * List users with pagination and filters
 */
export async function listUsers(query: UserQueryDTO): Promise<PaginatedUsers> {
  const { page = 1, limit = 10, role, isActive, isVerified, q } = query;

  const skip = (page - 1) * limit;

  // Build filter object
  const filter: Record<string, unknown> = {};

  // Role filter
  if (role) {
    filter.role = role;
  }

  // Active status filter
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  // Verified status filter
  if (isVerified !== undefined) {
    filter.isVerified = isVerified;
  }

  // Text search (search in fullName and email)
  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  // Execute queries in parallel
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map((u) => u.toPublicJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return user.toPublicJSON();
}

/**
 * Update a user (admin only)
 */
export async function updateUser(userId: string, data: UpdateUserDTO): Promise<PublicUser> {
  const user = await User.findById(userId);

  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Update allowed fields
  if (data.role !== undefined) {
    user.role = data.role;
  }
  if (data.isActive !== undefined) {
    user.isActive = data.isActive;
  }
  if (data.isVerified !== undefined) {
    user.isVerified = data.isVerified;
  }
  if (data.fullName !== undefined) {
    user.fullName = data.fullName;
  }
  if (data.phone !== undefined) {
    user.phone = data.phone;
  }

  await user.save();

  return user.toPublicJSON();
}

/**
 * Deactivate a user (soft delete)
 */
export async function deactivateUser(userId: string): Promise<void> {
  const user = await User.findById(userId);

  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Prevent deactivating admin users
  if (user.role === 'admin') {
    throw AppError.badRequest('Cannot deactivate admin users');
  }

  user.isActive = false;
  await user.save();
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const users = await User.find();

  const stats: UserStats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    verifiedUsers: users.filter((u) => u.isVerified).length,
    byRole: {} as Record<UserRole, number>,
  };

  // Count users by role
  for (const user of users) {
    stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
  }

  return stats;
}
