import { Router } from 'express';
import { projectController } from '../controllers/index.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/index.js';

const router = Router();

// ============================================
// Protected Routes (must come before :id routes)
// ============================================

// GET /api/projects/my - Get current user's projects
router.get('/my', authenticate, projectController.getMyProjects);

// GET /api/projects/my/stats - Get current user's project stats
router.get('/my/stats', authenticate, projectController.getMyStats);

// POST /api/projects - Create a new project
router.post('/', authenticate, projectController.createProject);

// ============================================
// Public Routes (optional auth for visibility check)
// ============================================

// GET /api/projects - List public projects (with filters)
router.get('/', optionalAuth, projectController.getProjects);

// GET /api/projects/:id - Get project details
router.get('/:id', optionalAuth, projectController.getProject);

// ============================================
// Owner Routes (authentication required)
// ============================================

// PATCH /api/projects/:id - Update a project (owner only)
router.patch('/:id', authenticate, projectController.updateProject);

// DELETE /api/projects/:id - Delete a project (owner or admin)
router.delete('/:id', authenticate, projectController.deleteProject);

// ============================================
// Admin Routes
// ============================================

// POST /api/projects/:id/recalculate - Recalculate score (admin only)
router.post('/:id/recalculate', authenticate, requireAdmin, projectController.recalculateScore);

export default router;
