import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import User from '../models/User.js';
import Space from '../models/Space.js';
import { AppError } from '../utils/AppError.js';

// ============================================
// User Management
// ============================================

/**
 * Get all users
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({}).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

/**
 * Update user role
 */
export async function updateUserRole(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['buyer', 'owner', 'agent', 'admin'];
  if (!validRoles.includes(role)) {
    throw AppError.badRequest('Invalid role');
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw AppError.notFound('User not found');
  }

  res.json({
    success: true,
    message: 'User role updated',
    data: user,
  });
}

/**
 * Delete user
 */
export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user?.userId === id) {
    throw AppError.badRequest('Cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Also delete user's spaces
  await Space.deleteMany({ owner: id });

  res.json({
    success: true,
    message: 'User and their spaces deleted',
  });
}

// ============================================
// Space Management
// ============================================

/**
 * Get all spaces (admin view)
 */
export async function getAllSpaces(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;
  const approved = req.query.approved as string;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (approved === 'true') filter.isApproved = true;
  if (approved === 'false') filter.isApproved = false;

  const [spaces, total] = await Promise.all([
    Space.find(filter)
      .populate('owner', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Space.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: spaces,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

/**
 * Approve a space listing
 */
export async function approveSpace(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { approved } = req.body;

  const space = await Space.findByIdAndUpdate(
    id,
    { isApproved: approved !== false },
    { new: true }
  );

  if (!space) {
    throw AppError.notFound('Space not found');
  }

  res.json({
    success: true,
    message: `Space ${approved !== false ? 'approved' : 'rejected'}`,
    data: space,
  });
}

/**
 * Feature/unfeature a space
 */
export async function featureSpace(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { featured } = req.body;

  const space = await Space.findByIdAndUpdate(id, { isFeatured: featured === true }, { new: true });

  if (!space) {
    throw AppError.notFound('Space not found');
  }

  res.json({
    success: true,
    message: `Space ${featured ? 'featured' : 'unfeatured'}`,
    data: space,
  });
}

/**
 * Delete a space
 */
export async function deleteSpace(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const space = await Space.findByIdAndDelete(id);

  if (!space) {
    throw AppError.notFound('Space not found');
  }

  res.json({
    success: true,
    message: 'Space deleted',
  });
}

// ============================================
// Platform Stats
// ============================================

/**
 * Get platform statistics
 */
export async function getStats(_req: AuthRequest, res: Response) {
  const [
    totalUsers,
    totalSpaces,
    activeSpaces,
    pendingApproval,
    featuredSpaces,
    usersByRole,
    spacesByType,
    recentUsers,
    recentSpaces,
  ] = await Promise.all([
    User.countDocuments({}),
    Space.countDocuments({}),
    Space.countDocuments({ isActive: true, isApproved: true }),
    Space.countDocuments({ isApproved: false }),
    Space.countDocuments({ isFeatured: true }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Space.aggregate([{ $group: { _id: '$spaceType', count: { $sum: 1 } } }]),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    Space.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalSpaces,
      activeSpaces,
      pendingApproval,
      featuredSpaces,
      usersByRole: usersByRole.reduce(
        (acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        },
        {} as Record<string, number>
      ),
      spacesByType: spacesByType.reduce(
        (acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentActivity: {
        newUsersLast7Days: recentUsers,
        newSpacesLast7Days: recentSpaces,
      },
    },
  });
}

/**
 * Get activity log
 */
export async function getActivityLog(_req: AuthRequest, res: Response) {
  const [recentUsers, recentSpaces] = await Promise.all([
    User.find({}).select('fullName email role createdAt').sort({ createdAt: -1 }).limit(10),
    Space.find({})
      .select('title spaceType status isApproved createdAt')
      .populate('owner', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  res.json({
    success: true,
    data: {
      recentUsers,
      recentSpaces,
    },
  });
}
