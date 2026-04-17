import { Router } from 'express';
import { measurementController } from '../controllers/index.js';
import { authenticate, optionalAuth } from '../middleware/index.js';

const router = Router();

// ============================================
// Measurement Routes (Map-scoped)
// ============================================

// POST /api/maps/:mapId/measurements - Create measurement on a map
router.post('/maps/:mapId/measurements', authenticate, measurementController.createMeasurement);

// GET /api/maps/:mapId/measurements - Get all measurements for a map
router.get('/maps/:mapId/measurements', optionalAuth, measurementController.getMapMeasurements);

// ============================================
// Measurement Routes (Project-scoped)
// ============================================

// GET /api/projects/:projectId/measurements - Get all measurements for a project
router.get(
  '/projects/:projectId/measurements',
  optionalAuth,
  measurementController.getProjectMeasurements
);

// GET /api/projects/:projectId/measurements/totals - Get measurement totals
router.get(
  '/projects/:projectId/measurements/totals',
  optionalAuth,
  measurementController.getMeasurementTotals
);

// ============================================
// Individual Measurement Routes
// ============================================

// GET /api/measurements/:id - Get single measurement
router.get('/measurements/:id', optionalAuth, measurementController.getMeasurement);

// PATCH /api/measurements/:id - Update measurement
router.patch('/measurements/:id', authenticate, measurementController.updateMeasurement);

// DELETE /api/measurements/:id - Delete measurement
router.delete('/measurements/:id', authenticate, measurementController.deleteMeasurement);

// ============================================
// Cost Estimate Routes (Project-scoped)
// ============================================

// POST /api/projects/:projectId/estimates - Create cost estimate
router.post(
  '/projects/:projectId/estimates',
  authenticate,
  measurementController.createCostEstimate
);

// GET /api/projects/:projectId/estimates - Get all estimates for a project
router.get(
  '/projects/:projectId/estimates',
  optionalAuth,
  measurementController.getProjectEstimates
);

// GET /api/projects/:projectId/estimates/summary - Get cost summary
router.get(
  '/projects/:projectId/estimates/summary',
  optionalAuth,
  measurementController.getProjectCostSummary
);

// POST /api/projects/:projectId/calculate - Calculate costs from measurements
router.post(
  '/projects/:projectId/calculate',
  authenticate,
  measurementController.calculateFromMeasurements
);

// ============================================
// Individual Cost Estimate Routes
// ============================================

// GET /api/estimates/:id - Get single estimate
router.get('/estimates/:id', optionalAuth, measurementController.getCostEstimate);

// PATCH /api/estimates/:id - Update estimate
router.patch('/estimates/:id', authenticate, measurementController.updateCostEstimate);

// DELETE /api/estimates/:id - Delete estimate
router.delete('/estimates/:id', authenticate, measurementController.deleteCostEstimate);

export default router;
