import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';

let io: Server | null = null;

// Store connected users
const connectedUsers = new Map<string, string[]>(); // userId -> socketIds[]

/**
 * Initialize Socket.IO server
 */
export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://new-project-theta-ashy.vercel.app',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Invalid token'));
      }
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId} (socket: ${socket.id})`);

    // Add socket to user's connections
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, []);
    }
    connectedUsers.get(userId)!.push(socket.id);

    // Join user's personal room
    socket.join(`user_${userId}`);

    // Join role-based room (for admin broadcasts)
    socket.join(`role_${socket.data.role}`);

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (socket: ${socket.id})`);

      // Remove socket from user's connections
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        const index = userSockets.indexOf(socket.id);
        if (index > -1) {
          userSockets.splice(index, 1);
        }
        if (userSockets.length === 0) {
          connectedUsers.delete(userId);
        }
      }
    });
  });

  return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Check if a user is online
 */
export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.length > 0;
}

/**
 * Get count of online users
 */
export function getOnlineUsersCount(): number {
  return connectedUsers.size;
}

// ============================================
// Notification Functions
// ============================================

export type NotificationType =
  | 'new_message'
  | 'property_approved'
  | 'property_rejected'
  | 'new_favorite'
  | 'price_update'
  | 'new_inquiry'
  | 'system';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Send notification to a specific user
 */
export function notifyUser(userId: string, notification: NotificationPayload): void {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.to(`user_${userId}`).emit('notification', notification);
}

/**
 * Send notification to multiple users
 */
export function notifyUsers(userIds: string[], notification: NotificationPayload): void {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  userIds.forEach((userId) => {
    io!.to(`user_${userId}`).emit('notification', notification);
  });
}

/**
 * Send notification to all users with a specific role
 */
export function notifyRole(role: string, notification: NotificationPayload): void {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.to(`role_${role}`).emit('notification', notification);
}

/**
 * Send notification to all connected users
 */
export function notifyAll(notification: NotificationPayload): void {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  io.emit('notification', notification);
}

/**
 * Send real-time update for property changes
 */
export function broadcastPropertyUpdate(
  propertyId: string,
  action: 'created' | 'updated' | 'deleted',
  data?: Record<string, unknown>
): void {
  if (!io) return;

  io.emit('property_update', {
    propertyId,
    action,
    data,
    timestamp: new Date(),
  });
}

/**
 * Send message notification
 */
export function notifyNewMessage(
  recipientId: string,
  senderId: string,
  senderName: string,
  preview: string
): void {
  notifyUser(recipientId, {
    type: 'new_message',
    title: 'New Message',
    titleAr: 'رسالة جديدة',
    message: `${senderName}: ${preview}`,
    messageAr: `${senderName}: ${preview}`,
    data: { senderId },
    timestamp: new Date(),
  });
}
