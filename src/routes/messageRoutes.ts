import { Router } from 'express';
import * as messageController from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All message routes require authentication
router.use(authenticate);

// ============================================
// Message Routes
// ============================================

// Send a message
router.post('/', messageController.sendMessage);

// Get all conversations
router.get('/conversations', messageController.getConversations);

// Get unread message count
router.get('/unread', messageController.getUnreadCount);

// Get messages in a conversation
router.get('/conversations/:userId', messageController.getConversation);

// Mark conversation as read
router.patch('/conversations/:userId/read', messageController.markAsRead);

// Delete a message
router.delete('/:messageId', messageController.deleteMessage);

export default router;
