import { Response } from 'express';
import * as messageService from '../services/messageService.js';
import { validate, sendMessageSchema } from '../utils/validation.js';
import { AuthRequest } from '../types/index.js';

// ============================================
// Message Controller
// ============================================

/**
 * Send a message
 * POST /api/messages
 */
export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const senderId = req.user!.id;
  const data = validate(sendMessageSchema, req.body);

  const message = await messageService.sendMessage(senderId, {
    receiverId: data.receiverId,
    content: data.content,
    propertyId: data.propertyId,
  });

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    messageAr: 'تم إرسال الرسالة بنجاح',
    data: message,
  });
}

/**
 * Get all conversations
 * GET /api/messages/conversations
 */
export async function getConversations(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const conversations = await messageService.getConversations(userId);

  res.json({
    success: true,
    data: conversations,
  });
}

/**
 * Get messages in a conversation
 * GET /api/messages/conversations/:userId
 */
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const otherUserId = req.params.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await messageService.getConversation(userId, otherUserId, page, limit);

  res.json({
    success: true,
    data: result.messages,
    pagination: result.pagination,
  });
}

/**
 * Get unread message count
 * GET /api/messages/unread
 */
export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const count = await messageService.getUnreadCount(userId);

  res.json({
    success: true,
    data: { unreadCount: count },
  });
}

/**
 * Mark conversation as read
 * PATCH /api/messages/conversations/:userId/read
 */
export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const otherUserId = req.params.userId;

  // Generate conversation ID
  const conversationId = [userId, otherUserId].sort().join('_');
  await messageService.markAsRead(userId, conversationId);

  res.json({
    success: true,
    message: 'Messages marked as read',
    messageAr: 'تم تعليم الرسائل كمقروءة',
  });
}

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
export async function deleteMessage(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { messageId } = req.params;

  await messageService.deleteMessage(messageId, userId);

  res.json({
    success: true,
    message: 'Message deleted',
    messageAr: 'تم حذف الرسالة',
  });
}
