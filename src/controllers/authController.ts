import { Response } from 'express';
import { authService } from '../services/index.js';
import {
  validate,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../utils/validation.js';
import { AuthRequest, ApiResponse } from '../types/index.js';
import { z } from 'zod';

// ============================================
// Auth Controller
// ============================================

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function register(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(registerSchema, req.body);
  const result = await authService.register({
    ...data,
    role: data.role ?? 'buyer',
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    messageAr: 'تم التسجيل بنجاح',
    data: result,
  });
}

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export async function login(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(loginSchema, req.body);
  const result = await authService.login(data);

  res.json({
    success: true,
    message: 'Login successful',
    messageAr: 'تم تسجيل الدخول بنجاح',
    data: result,
  });
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function refresh(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const { refreshToken } = validate(refreshTokenSchema, req.body);
  const tokens = await authService.refreshTokens(refreshToken);

  res.json({
    success: true,
    message: 'Tokens refreshed',
    messageAr: 'تم تحديث الرموز',
    data: tokens,
  });
}

/**
 * POST /api/auth/logout
 * Logout user (client should discard tokens)
 */
export async function logout(_req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  // In a production app, you might want to:
  // - Add the refresh token to a blacklist
  // - Store refresh tokens in DB and invalidate them
  // For now, just return success (client handles token removal)

  res.json({
    success: true,
    message: 'Logout successful',
    messageAr: 'تم تسجيل الخروج بنجاح',
  });
}

/**
 * GET /api/auth/me
 * Get current user's profile
 */
export async function getProfile(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const user = await authService.getProfile(req.user!.userId);

  res.json({
    success: true,
    message: 'Profile retrieved',
    messageAr: 'تم استرجاع الملف الشخصي',
    data: user,
  });
}

/**
 * PATCH /api/auth/me
 * Update current user's profile
 */
export async function updateProfile(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(updateProfileSchema, req.body);
  const user = await authService.updateProfile(req.user!.userId, data);

  res.json({
    success: true,
    message: 'Profile updated',
    messageAr: 'تم تحديث الملف الشخصي',
    data: user,
  });
}

/**
 * POST /api/auth/change-password
 * Change current user's password
 */
export async function changePassword(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(changePasswordSchema, req.body);
  await authService.changePassword(req.user!.userId, data);

  res.json({
    success: true,
    message: 'Password changed successfully',
    messageAr: 'تم تغيير كلمة المرور بنجاح',
  });
}

/**
 * DELETE /api/auth/me
 * Deactivate current user's account
 */
export async function deactivateAccount(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  await authService.deactivateUser(req.user!.userId);

  res.json({
    success: true,
    message: 'Account deactivated',
    messageAr: 'تم تعطيل الحساب',
  });
}

/**
 * GET /api/auth/verify-email
 * Verify email with token
 */
export async function verifyEmail(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Verification token is required',
      messageAr: 'رمز التحقق مطلوب',
    });
    return;
  }

  await authService.verifyEmail(token);

  res.json({
    success: true,
    message: 'Email verified successfully',
    messageAr: 'تم التحقق من البريد الإلكتروني بنجاح',
  });
}

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
export async function resendVerification(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const schema = z.object({ email: z.string().email() });
  const { email } = validate(schema, req.body);

  await authService.resendVerificationEmail(email);

  res.json({
    success: true,
    message: 'If an account exists, a verification email has been sent',
    messageAr: 'إذا كان الحساب موجوداً، تم إرسال رسالة التحقق',
  });
}

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
export async function forgotPassword(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const schema = z.object({ email: z.string().email() });
  const { email } = validate(schema, req.body);

  await authService.forgotPassword(email);

  res.json({
    success: true,
    message: 'If an account exists, a reset link has been sent',
    messageAr: 'إذا كان الحساب موجوداً، تم إرسال رابط إعادة التعيين',
  });
}

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export async function resetPassword(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const schema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
  });
  const { token, newPassword } = validate(schema, req.body);

  await authService.resetPassword(token, newPassword);

  res.json({
    success: true,
    message: 'Password reset successfully',
    messageAr: 'تم إعادة تعيين كلمة المرور بنجاح',
  });
}
