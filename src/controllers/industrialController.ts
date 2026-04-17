import { Response } from 'express';
import * as industrialService from '../services/industrialService.js';
import { AuthRequest, ApiResponse } from '../types/index.js';
import {
  validate,
  createIndustrialSchema,
  updateIndustrialSchema,
  industrialQuerySchema,
} from '../utils/validation.js';

// ============================================
// Industrial Controller
// ============================================

/**
 * POST /api/industrial
 * Create industrial data for a property
 */
export async function createIndustrial(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(createIndustrialSchema, req.body);
  const industrial = await industrialService.createIndustrial(req.user!.userId, data);

  res.status(201).json({
    success: true,
    message: 'Industrial data created successfully',
    messageAr: 'تم إنشاء البيانات الصناعية بنجاح',
    data: industrial,
  });
}

/**
 * GET /api/industrial/:id
 * Get industrial data by ID
 */
export async function getIndustrial(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const industrial = await industrialService.getIndustrialById(req.params.id);

  res.json({
    success: true,
    message: 'Industrial data retrieved',
    messageAr: 'تم استرجاع البيانات الصناعية',
    data: industrial,
  });
}

/**
 * GET /api/properties/:propertyId/industrial
 * Get industrial data by property ID
 */
export async function getIndustrialByProperty(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const industrial = await industrialService.getIndustrialByProperty(req.params.propertyId);

  res.json({
    success: true,
    message: 'Industrial data retrieved',
    messageAr: 'تم استرجاع البيانات الصناعية',
    data: industrial,
  });
}

/**
 * GET /api/industrial
 * List all industrial data with filters
 */
export async function listIndustrial(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const query = validate(industrialQuerySchema, req.query);
  const result = await industrialService.listIndustrial(query);

  res.json({
    success: true,
    message: 'Industrial data retrieved',
    messageAr: 'تم استرجاع البيانات الصناعية',
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * PATCH /api/industrial/:id
 * Update industrial data
 */
export async function updateIndustrial(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(updateIndustrialSchema, req.body);
  const industrial = await industrialService.updateIndustrial(
    req.params.id,
    req.user!.userId,
    data
  );

  res.json({
    success: true,
    message: 'Industrial data updated successfully',
    messageAr: 'تم تحديث البيانات الصناعية بنجاح',
    data: industrial,
  });
}

/**
 * DELETE /api/industrial/:id
 * Delete industrial data
 */
export async function deleteIndustrial(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const isAdmin = req.user!.role === 'admin';

  await industrialService.deleteIndustrial(req.params.id, req.user!.userId, isAdmin);

  res.json({
    success: true,
    message: 'Industrial data deleted successfully',
    messageAr: 'تم حذف البيانات الصناعية بنجاح',
  });
}

/**
 * GET /api/industrial/stats
 * Get industrial statistics
 */
export async function getIndustrialStats(
  _req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const stats = await industrialService.getIndustrialStats();

  res.json({
    success: true,
    message: 'Industrial statistics retrieved',
    messageAr: 'تم استرجاع الإحصائيات الصناعية',
    data: stats,
  });
}
