import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { hasPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// User Management Routes (Admin Only)
// ============================================

// All routes require authentication and user:manage permission
router.use(authenticate, hasPermission('user:manage'));

// GET /api/users - List users (paginated, filterable)
router.get('/', userController.listUsers);

// GET /api/users/stats - User statistics
router.get('/stats', userController.getStats);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUser);

// PATCH /api/users/:id - Update user
router.patch('/:id', userController.updateUser);

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', userController.deleteUser);

export default router;
