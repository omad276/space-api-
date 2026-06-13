import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import Notification from '../models/Notification.js';
import { notifyUser, NotificationPayload } from '../socket.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// ============================================
// Notification Routes
// ============================================

/**
 * Get user notifications
 * GET /api/notifications
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, read: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const count = await Notification.countDocuments({ userId, read: false });

  res.json({
    success: true,
    data: { count },
  });
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  await Notification.updateOne({ _id: req.params.id, userId }, { read: true });

  res.json({
    success: true,
    message: 'Notification marked as read',
    messageAr: 'تم تحديد الإشعار كمقروء',
  });
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  await Notification.updateMany({ userId, read: false }, { read: true });

  res.json({
    success: true,
    message: 'All notifications marked as read',
    messageAr: 'تم تحديد جميع الإشعارات كمقروءة',
  });
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  await Notification.deleteOne({ _id: req.params.id, userId });

  res.json({
    success: true,
    message: 'Notification deleted',
    messageAr: 'تم حذف الإشعار',
  });
});

/**
 * Delete all notifications
 * DELETE /api/notifications
 */
router.delete('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  await Notification.deleteMany({ userId });

  res.json({
    success: true,
    message: 'All notifications deleted',
    messageAr: 'تم حذف جميع الإشعارات',
  });
});

// ============================================
// Helper function to create notification
// ============================================

export interface CreateNotificationDTO {
  userId: string;
  type: 'message' | 'approval' | 'rejection' | 'new_space' | 'inquiry' | 'favorite' | 'system';
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  data?: Record<string, unknown>;
}

export async function createNotification(dto: CreateNotificationDTO) {
  const notification = await Notification.create({
    userId: dto.userId,
    type: dto.type,
    title: dto.title,
    titleAr: dto.titleAr,
    message: dto.message,
    messageAr: dto.messageAr,
    data: dto.data,
  });

  // Send real-time notification via WebSocket
  const payload: NotificationPayload = {
    type:
      dto.type === 'message'
        ? 'new_message'
        : dto.type === 'approval'
          ? 'property_approved'
          : dto.type === 'rejection'
            ? 'property_rejected'
            : dto.type === 'favorite'
              ? 'new_favorite'
              : dto.type === 'inquiry'
                ? 'new_inquiry'
                : 'system',
    title: dto.title,
    titleAr: dto.titleAr,
    message: dto.message,
    messageAr: dto.messageAr,
    data: {
      ...dto.data,
      notificationId: notification._id.toString(),
    },
    timestamp: new Date(),
  };

  notifyUser(dto.userId, payload);

  return notification;
}

export default router;
