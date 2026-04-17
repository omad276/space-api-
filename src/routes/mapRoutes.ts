import { Router } from 'express';
import { mapController } from '../controllers/index.js';
import { authenticate, optionalAuth } from '../middleware/index.js';
import { uploadMap } from '../middleware/upload.js';

const router = Router();

// ============================================
// Project-scoped Map Routes
// ============================================

// POST /api/projects/:projectId/maps - Upload a map
router.post(
  '/projects/:projectId/maps',
  authenticate,
  uploadMap.single('file'),
  mapController.uploadMap
);

// GET /api/projects/:projectId/maps - Get all maps for a project
router.get('/projects/:projectId/maps', optionalAuth, mapController.getProjectMaps);

// GET /api/projects/:projectId/maps/stats - Get map statistics
router.get('/projects/:projectId/maps/stats', optionalAuth, mapController.getMapStats);

// ============================================
// Individual Map Routes
// ============================================

// GET /api/maps/:id - Get a single map
router.get('/maps/:id', optionalAuth, mapController.getMap);

// GET /api/maps/:id/download - Download a map file
router.get('/maps/:id/download', optionalAuth, mapController.downloadMap);

// PATCH /api/maps/:id - Update map metadata
router.patch('/maps/:id', authenticate, mapController.updateMap);

// PATCH /api/maps/:id/calibrate - Calibrate map scale
router.patch('/maps/:id/calibrate', authenticate, mapController.calibrateMap);

// DELETE /api/maps/:id - Delete a map
router.delete('/maps/:id', authenticate, mapController.deleteMap);

export default router;
