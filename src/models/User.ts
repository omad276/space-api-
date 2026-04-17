import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument, PublicUser, UserRole } from '../types/index.js';
import { config } from '../config/index.js';

// ============================================
// User Schema Definition
// ============================================

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name is too long'],
    },
    phone: {
      type: String,
      trim: true,
    },
    countryCode: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['buyer', 'owner', 'agent', 'admin'] as UserRole[],
      default: 'buyer',
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// ============================================
// Indexes
// ============================================

// Note: email index is already created by unique: true in schema definition
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ============================================
// Pre-save Middleware
// ============================================

userSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ============================================
// Instance Methods
// ============================================

/**
 * Compare a candidate password with the stored hashed password
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

/**
 * Convert user document to public JSON (without sensitive fields)
 */
userSchema.methods.toPublicJSON = function (): PublicUser {
  return {
    id: this._id.toString(),
    email: this.email,
    fullName: this.fullName,
    phone: this.phone,
    countryCode: this.countryCode,
    role: this.role,
    avatar: this.avatar,
    isActive: this.isActive,
    isVerified: this.isVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// Static Methods
// ============================================

interface UserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
}

/**
 * Find user by email
 */
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by email including password field
 */
userSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// ============================================
// Export Model
// ============================================

export const User = mongoose.model<IUserDocument, UserModel>('User', userSchema);
export default User;
