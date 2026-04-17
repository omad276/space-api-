import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllSpaces,
  approveSpace,
  deleteSpace,
  featureSpace,
  getStats,
  getActivityLog,
} from '../controllers/adminController.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// ============================================
// User Management
// ============================================

// Get all users
router.get('/users', getAllUsers);

// Update user role
router.put('/users/:id/role', updateUserRole);

// Delete user
router.delete('/users/:id', deleteUser);

// ============================================
// Space Management
// ============================================

// Get all spaces (including pending approval)
router.get('/spaces', getAllSpaces);

// Approve a space listing
router.put('/spaces/:id/approve', approveSpace);

// Feature/unfeature a space
router.put('/spaces/:id/feature', featureSpace);

// Delete a space
router.delete('/spaces/:id', deleteSpace);

// ============================================
// Platform Stats
// ============================================

// Get platform statistics
router.get('/stats', getStats);

// Get recent activity log
router.get('/activity', getActivityLog);

export default router;
