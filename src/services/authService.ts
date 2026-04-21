import crypto from 'crypto';
import { User } from '../models/User.js';
import VerificationToken from '../models/VerificationToken.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '../utils/validation.js';
import { PublicUser, AuthTokens } from '../types/index.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';

// ============================================
// Response Types
// ============================================

interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}

// ============================================
// Auth Service
// ============================================

/**
 * Register a new user
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
  // Check if email already exists
  const existingUser = await User.findByEmail(data.email);
  if (existingUser) {
    throw AppError.conflict('Email already registered');
  }

  // Create new user
  const user = await User.create({
    email: data.email,
    password: data.password,
    fullName: data.fullName,
    phone: data.phone || '',
    countryCode: data.countryCode || '',
    role: data.role || 'buyer',
    isVerified: false, // User needs to verify email
  });

  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  await VerificationToken.create({
    userId: user._id,
    token: verificationToken,
    type: 'email',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(user.email, verificationToken, user.fullName);

  // Generate tokens
  const tokens = generateTokens(user._id.toString(), user.email, user.role);

  return {
    user: user.toPublicJSON(),
    tokens,
  };
}

/**
 * Login a user
 */
export async function login(data: LoginInput): Promise<AuthResponse> {
  // Find user with password
  const user = await User.findByEmailWithPassword(data.email);
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw AppError.unauthorized('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(data.password);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user._id.toString(), user.email, user.role);

  return {
    user: user.toPublicJSON(),
    tokens,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  // Find user
  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('User not found or inactive');
  }

  // Generate new tokens
  return generateTokens(user._id.toString(), user.email, user.role);
}

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return user.toPublicJSON();
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<PublicUser> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return user.toPublicJSON();
}

/**
 * Change user password
 */
export async function changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
  // Find user with password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw AppError.notFound('User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(data.currentPassword);
  if (!isPasswordValid) {
    throw AppError.badRequest('Current password is incorrect');
  }

  // Update password (will be hashed by pre-save hook)
  user.password = data.newPassword;
  await user.save();
}

/**
 * Get user by ID (for admin purposes)
 */
export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return user.toPublicJSON();
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string): Promise<void> {
  const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

  if (!user) {
    throw AppError.notFound('User not found');
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<boolean> {
  const verificationToken = await VerificationToken.findOne({ token, type: 'email' });

  if (!verificationToken) {
    throw AppError.badRequest('Invalid verification token');
  }

  if (verificationToken.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: verificationToken._id });
    throw AppError.badRequest('Verification token has expired');
  }

  // Update user as verified
  await User.findByIdAndUpdate(verificationToken.userId, { isVerified: true });

  // Delete the used token
  await VerificationToken.deleteOne({ _id: verificationToken._id });

  return true;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<boolean> {
  const user = await User.findByEmail(email);

  if (!user) {
    // Don't reveal if user exists
    return true;
  }

  if (user.isVerified) {
    throw AppError.badRequest('Email is already verified');
  }

  // Delete any existing tokens
  await VerificationToken.deleteMany({ userId: user._id, type: 'email' });

  // Create new token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  await VerificationToken.create({
    userId: user._id,
    token: verificationToken,
    type: 'email',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Send email
  await sendVerificationEmail(user.email, verificationToken, user.fullName);

  return true;
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<boolean> {
  const user = await User.findByEmail(email);

  if (!user) {
    // Don't reveal if user exists
    return true;
  }

  // Delete any existing password reset tokens
  await VerificationToken.deleteMany({ userId: user._id, type: 'password' });

  // Create new token
  const resetToken = crypto.randomBytes(32).toString('hex');
  await VerificationToken.create({
    userId: user._id,
    token: resetToken,
    type: 'password',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  // Send email
  await sendPasswordResetEmail(user.email, resetToken, user.fullName);

  return true;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const resetToken = await VerificationToken.findOne({ token, type: 'password' });

  if (!resetToken) {
    throw AppError.badRequest('Invalid reset token');
  }

  if (resetToken.expiresAt < new Date()) {
    await VerificationToken.deleteOne({ _id: resetToken._id });
    throw AppError.badRequest('Reset token has expired');
  }

  // Find user and update password
  const user = await User.findById(resetToken.userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  user.password = newPassword; // Will be hashed by pre-save hook
  await user.save();

  // Delete the used token
  await VerificationToken.deleteOne({ _id: resetToken._id });

  return true;
}
