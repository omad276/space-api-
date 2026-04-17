import { Response } from 'express';
import { measurementService } from '../services/index.js';
import { AuthRequest, ApiResponse } from '../types/index.js';
import {
  validate,
  createMeasurementSchema,
  updateMeasurementSchema,
  createCostEstimateSchema,
  updateCostEstimateSchema,
  calculateFromMeasurementsSchema,
  paginationQuerySchema,
} from '../utils/validation.js';

// ============================================
// Measurement Controller
// ============================================

/**
 * POST /api/maps/:mapId/measurements
 * Create a new measurement on a map
 */
export async function createMeasurement(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { mapId } = req.params;
  const data = validate(createMeasurementSchema, req.body);

  const measurement = await measurementService.createMeasurement({
    mapId,
    userId: req.user!.userId,
    ...data,
  });

  res.status(201).json({
    success: true,
    message: 'Measurement created successfully',
    messageAr: 'تم إنشاء القياس بنجاح',
    data: measurement,
  });
}

/**
 * GET /api/maps/:mapId/measurements
 * Get all measurements for a map with pagination
 */
export async function getMapMeasurements(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { mapId } = req.params;
  const query = validate(paginationQuerySchema, req.query);
  const result = await measurementService.getMapMeasurements(mapId, req.user?.userId, query);

  res.json({
    success: true,
    message: 'Measurements retrieved',
    messageAr: 'تم استرجاع القياسات',
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/projects/:projectId/measurements
 * Get all measurements for a project with pagination
 */
export async function getProjectMeasurements(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { projectId } = req.params;
  const query = validate(paginationQuerySchema, req.query);
  const result = await measurementService.getProjectMeasurements(
    projectId,
    req.user?.userId,
    query
  );

  res.json({
    success: true,
    message: 'Measurements retrieved',
    messageAr: 'تم استرجاع القياسات',
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/projects/:projectId/measurements/totals
 * Get measurement totals by type for a project
 */
export async function getMeasurementTotals(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { projectId } = req.params;
  const totals = await measurementService.getMeasurementTotals(projectId, req.user?.userId);

  res.json({
    success: true,
    message: 'Measurement totals retrieved',
    messageAr: 'تم استرجاع إجماليات القياسات',
    data: totals,
  });
}

/**
 * GET /api/measurements/:id
 * Get a single measurement
 */
export async function getMeasurement(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const measurement = await measurementService.getMeasurementById(req.params.id, req.user?.userId);

  res.json({
    success: true,
    message: 'Measurement retrieved',
    messageAr: 'تم استرجاع القياس',
    data: measurement,
  });
}

/**
 * PATCH /api/measurements/:id
 * Update measurement metadata
 */
export async function updateMeasurement(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(updateMeasurementSchema, req.body);

  const measurement = await measurementService.updateMeasurement(
    req.params.id,
    req.user!.userId,
    data
  );

  res.json({
    success: true,
    message: 'Measurement updated successfully',
    messageAr: 'تم تحديث القياس بنجاح',
    data: measurement,
  });
}

/**
 * DELETE /api/measurements/:id
 * Delete a measurement
 */
export async function deleteMeasurement(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const isAdmin = req.user!.role === 'admin';
  await measurementService.deleteMeasurement(req.params.id, req.user!.userId, isAdmin);

  res.json({
    success: true,
    message: 'Measurement deleted successfully',
    messageAr: 'تم حذف القياس بنجاح',
  });
}

// ============================================
// Cost Estimate Controller
// ============================================

/**
 * POST /api/projects/:projectId/estimates
 * Create a new cost estimate
 */
export async function createCostEstimate(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { projectId } = req.params;
  const data = validate(createCostEstimateSchema, req.body);

  const estimate = await measurementService.createCostEstimate({
    projectId,
    userId: req.user!.userId,
    ...data,
  });

  res.status(201).json({
    success: true,
    message: 'Cost estimate created successfully',
    messageAr: 'تم إنشاء تقدير التكلفة بنجاح',
    data: estimate,
  });
}

/**
 * GET /api/projects/:projectId/estimates
 * Get all cost estimates for a project with pagination
 */
export async function getProjectEstimates(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { projectId } = req.params;
  const query = validate(paginationQuerySchema, req.query);
  const result = await measurementService.getProjectEstimates(projectId, req.user?.userId, query);

  res.json({
    success: true,
    message: 'Cost estimates retrieved',
    messageAr: 'تم استرجاع تقديرات التكلفة',
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/projects/:projectId/estimates/summary
 * Get cost summary for a project
 */
export async function getProjectCostSummary(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const { projectId } = req.params;
  const summary = await measurementService.getProjectCostSummary(projectId);

  res.json({
    success: true,
    message: 'Cost summary retrieved',
    messageAr: 'تم استرجاع ملخص التكلفة',
    data: summary,
  });
}

/**
 * GET /api/estimates/:id
 * Get a single cost estimate
 */
export async function getCostEstimate(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const estimate = await measurementService.getCostEstimateById(req.params.id, req.user?.userId);

  res.json({
    success: true,
    message: 'Cost estimate retrieved',
    messageAr: 'تم استرجاع تقدير التكلفة',
    data: estimate,
  });
}

/**
 * PATCH /api/estimates/:id
 * Update cost estimate
 */
export async function updateCostEstimate(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(updateCostEstimateSchema, req.body);

  const estimate = await measurementService.updateCostEstimate(
    req.params.id,
    req.user!.userId,
    data
  );

  res.json({
    success: true,
    message: 'Cost estimate updated successfully',
    messageAr: 'تم تحديث تقدير التكلفة بنجاح',
    data: estimate,
  });
}

/**
 * DELETE /api/estimates/:id
 * Delete a cost estimate
 */
export async function deleteCostEstimate(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const isAdmin = req.user!.role === 'admin';
  await measurementService.deleteCostEstimate(req.params.id, req.user!.userId, isAdmin);

  res.json({
    success: true,
    message: 'Cost estimate deleted successfully',
    messageAr: 'تم حذف تقدير التكلفة بنجاح',
  });
}

/**
 * POST /api/projects/:projectId/calculate
 * Calculate costs from measurements
 */
export async function calculateFromMeasurements(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(calculateFromMeasurementsSchema, req.body);

  const items = await measurementService.calculateCostFromMeasurements(
    data.measurementIds,
    data.unitCosts,
    req.user?.userId
  );

  res.json({
    success: true,
    message: 'Costs calculated',
    messageAr: 'تم حساب التكاليف',
    data: { items, total: items.reduce((sum, item) => sum + item.totalCost, 0) },
  });
}
