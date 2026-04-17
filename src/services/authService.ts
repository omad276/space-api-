import { User } from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from '../utils/validation.js';
import { PublicUser, AuthTokens } from '../types/index.js';

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
  });

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
