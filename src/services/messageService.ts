import Message from '../models/Message.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// ============================================
// Types
// ============================================

interface SendMessageDTO {
  receiverId: string;
  content: string;
  propertyId?: string;
}

interface ConversationSummary {
  conversationId: string;
  participant: {
    _id: string;
    fullName: string;
    fullNameAr?: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    isRead: boolean;
    isMine: boolean;
  };
  unreadCount: number;
  property?: {
    _id: string;
    title: string;
    titleAr: string;
  };
}

interface PaginatedMessages {
  messages: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Helper Functions
// ============================================

function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

// ============================================
// Message Service
// ============================================

/**
 * Send a message to another user
 */
export async function sendMessage(senderId: string, data: SendMessageDTO): Promise<unknown> {
  const { receiverId, content, propertyId } = data;

  // Validate receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw AppError.notFound('Recipient not found');
  }

  // Can't message yourself
  if (senderId === receiverId) {
    throw AppError.badRequest('Cannot send message to yourself');
  }

  const conversationId = getConversationId(senderId, receiverId);

  const message = await Message.create({
    conversationId,
    sender: senderId,
    receiver: receiverId,
    content,
    property: propertyId || undefined,
  });

  // Populate sender and receiver info
  await message.populate([
    { path: 'sender', select: 'fullName fullNameAr avatar' },
    { path: 'receiver', select: 'fullName fullNameAr avatar' },
    { path: 'property', select: 'title titleAr images' },
  ]);

  return message;
}

/**
 * Get messages in a conversation
 */
export async function getConversation(
  userId: string,
  otherUserId: string,
  page = 1,
  limit = 50
): Promise<PaginatedMessages> {
  const conversationId = getConversationId(userId, otherUserId);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversationId })
      .populate('sender', 'fullName fullNameAr avatar')
      .populate('receiver', 'fullName fullNameAr avatar')
      .populate('property', 'title titleAr images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ conversationId }),
  ]);

  // Mark messages as read
  await Message.updateMany(
    {
      conversationId,
      receiver: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return {
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all conversations for a user
 */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  // Get all unique conversation IDs for this user
  const userMessages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  // Group by conversation and get summary
  const conversationMap = new Map<string, ConversationSummary>();

  for (const msg of userMessages) {
    const convId = msg.conversationId;

    if (!conversationMap.has(convId)) {
      // Determine the other participant
      const otherUserId =
        msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();

      // Get unread count
      const unreadCount = await Message.countDocuments({
        conversationId: convId,
        receiver: userId,
        isRead: false,
      });

      // Get participant info
      const participant = await User.findById(otherUserId)
        .select('fullName fullNameAr avatar')
        .lean();

      if (participant) {
        // Get property info if exists
        let property;
        if (msg.property) {
          const propDoc = await Message.findOne({
            conversationId: convId,
            property: { $exists: true },
          })
            .populate('property', 'title titleAr')
            .lean();
          property = propDoc?.property as
            | { _id: string; title: string; titleAr: string }
            | undefined;
        }

        conversationMap.set(convId, {
          conversationId: convId,
          participant: {
            _id: participant._id.toString(),
            fullName: participant.fullName,
            avatar: participant.avatar,
          },
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            isMine: msg.sender.toString() === userId,
          },
          unreadCount,
          property,
        });
      }
    }
  }

  return Array.from(conversationMap.values());
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return Message.countDocuments({
    receiver: userId,
    isRead: false,
  });
}

/**
 * Mark messages in a conversation as read
 */
export async function markAsRead(userId: string, conversationId: string): Promise<void> {
  await Message.updateMany(
    {
      conversationId,
      receiver: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
}

/**
 * Delete a message (soft delete - mark as deleted for sender)
 */
export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const message = await Message.findById(messageId);

  if (!message) {
    throw AppError.notFound('Message not found');
  }

  if (message.sender.toString() !== userId) {
    throw AppError.forbidden('You can only delete your own messages');
  }

  await message.deleteOne();
}
