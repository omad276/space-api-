import { Response } from 'express';
import path from 'path';
import { mapService } from '../services/index.js';
import { AuthRequest, ApiResponse } from '../types/index.js';
import { AppError } from '../utils/AppError.js';
import { validate, paginationQuerySchema } from '../utils/validation.js';

// ============================================
// Map Controller
// ============================================

/**
 * POST /api/projects/:projectId/maps
 * Upload a new map to a project
 */
export async function uploadMap(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  if (!req.file) {
    throw AppError.badRequest('No file uploaded');
  }

  const { projectId } = req.params;
  const { name, description } = req.body;

  if (!name) {
    throw AppError.badRequest('Map name is required');
  }

  const map = await mapService.uploadMap({
    projectId,
    userId: req.user!.userId,
    name,
    description,
    file: req.file,
  });

  res.status(201).json({
    success: true,
    message: 'Map uploaded successfully',
    messageAr: 'تم رفع الخريطة بنجاح',
    data: map,
  });
}

/**
 * GET /api/projects/:projectId/maps
 * Get all maps for a project with pagination
 */
export async function getProjectMaps(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const { projectId } = req.params;
  const query = validate(paginationQuerySchema, req.query);
  const result = await mapService.getProjectMaps(projectId, req.user?.userId, query);

  res.json({
    success: true,
    message: 'Maps retrieved',
    messageAr: 'تم استرجاع الخرائط',
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/maps/:id
 * Get a single map by ID
 */
export async function getMap(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const map = await mapService.getMapById(req.params.id, req.user?.userId);

  res.json({
    success: true,
    message: 'Map retrieved',
    messageAr: 'تم استرجاع الخريطة',
    data: map,
  });
}

/**
 * GET /api/maps/:id/download
 * Download a map file
 */
export async function downloadMap(req: AuthRequest, res: Response): Promise<void> {
  const fileInfo = await mapService.getMapFilePath(req.params.id, req.user?.userId);

  res.setHeader('Content-Type', fileInfo.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(fileInfo.filename)}"`
  );

  res.sendFile(path.resolve(fileInfo.path));
}

/**
 * PATCH /api/maps/:id
 * Update map metadata
 */
export async function updateMap(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const { name, description } = req.body;

  const map = await mapService.updateMap(req.params.id, req.user!.userId, {
    name,
    description,
  });

  res.json({
    success: true,
    message: 'Map updated successfully',
    messageAr: 'تم تحديث الخريطة بنجاح',
    data: map,
  });
}

/**
 * DELETE /api/maps/:id
 * Delete a map
 */
export async function deleteMap(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const isAdmin = req.user!.role === 'admin';
  await mapService.deleteMap(req.params.id, req.user!.userId, isAdmin);

  res.json({
    success: true,
    message: 'Map deleted successfully',
    messageAr: 'تم حذف الخريطة بنجاح',
  });
}

/**
 * GET /api/projects/:projectId/maps/stats
 * Get map statistics for a project
 */
export async function getMapStats(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const { projectId } = req.params;
  const stats = await mapService.getMapStats(projectId, req.user?.userId);

  res.json({
    success: true,
    message: 'Map statistics retrieved',
    messageAr: 'تم استرجاع إحصائيات الخرائط',
    data: stats,
  });
}

/**
 * PATCH /api/maps/:id/calibrate
 * Calibrate map scale for real-world measurements
 * Use force=true to delete existing measurements and recalibrate
 */
export async function calibrateMap(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const { pixelDistance, realDistance, unit, force } = req.body;

  if (typeof pixelDistance !== 'number' || pixelDistance <= 0) {
    throw AppError.badRequest('pixelDistance must be a positive number');
  }
  if (typeof realDistance !== 'number' || realDistance <= 0) {
    throw AppError.badRequest('realDistance must be a positive number');
  }
  if (!['m', 'cm', 'mm', 'ft', 'in'].includes(unit)) {
    throw AppError.badRequest('unit must be one of: m, cm, mm, ft, in');
  }

  const result = await mapService.calibrateMap(req.params.id, req.user!.userId, {
    pixelDistance,
    realDistance,
    unit,
    force: force === true,
  });

  const message =
    'deletedMeasurements' in result && result.deletedMeasurements
      ? `Map recalibrated successfully. ${result.deletedMeasurements} measurement(s) deleted.`
      : 'Map calibrated successfully';

  const messageAr =
    'deletedMeasurements' in result && result.deletedMeasurements
      ? `تمت إعادة معايرة الخريطة بنجاح. تم حذف ${result.deletedMeasurements} قياس(ات).`
      : 'تمت معايرة الخريطة بنجاح';

  res.json({
    success: true,
    message,
    messageAr,
    data: result,
  });
}
