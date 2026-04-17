import { Router } from 'express';
import { authController } from '../controllers/index.js';
import { authenticate } from '../middleware/index.js';
import { authLimiter, sensitiveOpLimiter } from '../middleware/rateLimit.js';

const router = Router();

// ============================================
// Public Routes (no authentication required)
// ============================================

// POST /api/auth/register - Register new user (rate limited)
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login - Login user (rate limited)
router.post('/login', authLimiter, authController.login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authController.refresh);

// POST /api/auth/logout - Logout user
router.post('/logout', authController.logout);

// ============================================
// Protected Routes (authentication required)
// ============================================

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, authController.getProfile);

// PATCH /api/auth/me - Update current user profile
router.patch('/me', authenticate, authController.updateProfile);

// POST /api/auth/change-password - Change password (rate limited)
router.post('/change-password', authenticate, sensitiveOpLimiter, authController.changePassword);

// DELETE /api/auth/me - Deactivate account (rate limited)
router.delete('/me', authenticate, sensitiveOpLimiter, authController.deactivateAccount);

export default router;
