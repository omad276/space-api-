import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from '../routes/notificationRoutes.js';

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
  await Property.deleteMany({ owner: id });

  res.json({
    success: true,
    message: 'User and their spaces deleted',
  });
}

// ============================================
// Property Management
// ============================================

/**
 * Get all properties (admin view)
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
    Property.find(filter)
      .populate('owner', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Property.countDocuments(filter),
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
 * Approve a property listing
 */
export async function approveSpace(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { approved } = req.body;

  const space = await Property.findByIdAndUpdate(
    id,
    { isApproved: approved !== false },
    { new: true }
  );

  if (!space) {
    throw AppError.notFound('Property not found');
  }

  // Send notification to space owner
  const isApproved = approved !== false;
  await createNotification({
    userId: space.owner.toString(),
    type: isApproved ? 'approval' : 'rejection',
    title: isApproved ? 'Property Approved' : 'Property Rejected',
    titleAr: isApproved ? 'تمت الموافقة على المساحة' : 'تم رفض المساحة',
    message: isApproved
      ? `Your space "${space.title}" has been approved and is now live`
      : `Your space "${space.title}" was not approved`,
    messageAr: isApproved
      ? `تمت الموافقة على مساحتك "${space.titleAr || space.title}" وهي الآن متاحة للعرض`
      : `لم تتم الموافقة على مساحتك "${space.titleAr || space.title}"`,
    data: { spaceId: space._id.toString() },
  });

  res.json({
    success: true,
    message: `Property ${isApproved ? 'approved' : 'rejected'}`,
    data: space,
  });
}

/**
 * Feature/unfeature a property
 */
export async function featureSpace(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { featured } = req.body;

  const space = await Property.findByIdAndUpdate(
    id,
    { isFeatured: featured === true },
    { new: true }
  );

  if (!space) {
    throw AppError.notFound('Property not found');
  }

  res.json({
    success: true,
    message: `Property ${featured ? 'featured' : 'unfeatured'}`,
    data: space,
  });
}

/**
 * Delete a property
 */
export async function deleteSpace(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const space = await Property.findByIdAndDelete(id);

  if (!space) {
    throw AppError.notFound('Property not found');
  }

  res.json({
    success: true,
    message: 'Property deleted',
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
    propertiesByType,
    recentUsers,
    recentSpaces,
  ] = await Promise.all([
    User.countDocuments({}),
    Property.countDocuments({}),
    Property.countDocuments({ isActive: true, isApproved: true }),
    Property.countDocuments({ isApproved: false }),
    Property.countDocuments({ isFeatured: true }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Property.aggregate([{ $group: { _id: '$propertyType', count: { $sum: 1 } } }]),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    Property.countDocuments({
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
      spacesByType: propertiesByType.reduce(
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
    Property.find({})
      .select('title titleAr propertyType listingType isApproved createdAt')
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
