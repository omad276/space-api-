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
// Property Management (was "Space")
// ============================================

// Get all properties (including pending approval)
router.get('/spaces', getAllSpaces);
router.get('/properties', getAllSpaces); // Alias for properties

// Approve a property listing
router.put('/spaces/:id/approve', approveSpace);
router.patch('/spaces/:id/approve', approveSpace); // Support PATCH too

// Feature/unfeature a property
router.put('/spaces/:id/feature', featureSpace);

// Delete a property
router.delete('/spaces/:id', deleteSpace);

// ============================================
// Platform Stats
// ============================================

// Get platform statistics
router.get('/stats', getStats);

// Get recent activity log
router.get('/activity', getActivityLog);

export default router;
