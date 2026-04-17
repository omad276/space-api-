import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for fetching conversation messages
messageSchema.index({ conversationId: 1, createdAt: 1 });

// Index for user's messages
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

// Index for unread messages
messageSchema.index({ receiver: 1, isRead: 1 });

// Static method to generate conversation ID from two user IDs
messageSchema.statics.getConversationId = function (userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
};

export default mongoose.model('Message', messageSchema);
