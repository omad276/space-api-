import { Response } from 'express';
import * as propertyService from '../services/propertyService.js';
import {
  validate,
  createPropertySchema,
  updatePropertySchema,
  propertyQuerySchema,
} from '../utils/validation.js';
import { AuthRequest, ApiResponse } from '../types/index.js';

// ============================================
// Property Controller
// ============================================

/**
 * POST /api/properties
 * Create a new property
 */
export async function createProperty(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(createPropertySchema, req.body);
  const property = await propertyService.createProperty(data, req.user!.id);

  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    messageAr: 'تم إنشاء العقار بنجاح',
    data: property,
  });
}

/**
 * GET /api/properties
 * Search and filter properties with pagination
 */
export async function getProperties(req: AuthRequest, res: Response): Promise<void> {
  const query = validate(propertyQuerySchema, req.query);
  const result = await propertyService.searchProperties(query);

  res.json({
    success: true,
    message: 'Properties retrieved',
    messageAr: 'تم استرجاع العقارات',
    data: result.properties,
    pagination: result.pagination,
  });
}

/**
 * GET /api/properties/featured
 * Get featured properties
 */
export async function getFeaturedProperties(
  _req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const properties = await propertyService.getFeaturedProperties(6);

  res.json({
    success: true,
    message: 'Featured properties retrieved',
    messageAr: 'تم استرجاع العقارات المميزة',
    data: properties,
  });
}

/**
 * GET /api/properties/stats
 * Get property statistics
 */
export async function getStats(_req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const stats = await propertyService.getPropertyStats();

  res.json({
    success: true,
    message: 'Statistics retrieved',
    messageAr: 'تم استرجاع الإحصائيات',
    data: stats,
  });
}

/**
 * GET /api/properties/my
 * Get current user's properties
 */
export async function getMyProperties(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const properties = await propertyService.getPropertiesByOwner(req.user!.id);

  res.json({
    success: true,
    message: 'Your properties retrieved',
    messageAr: 'تم استرجاع عقاراتك',
    data: properties,
  });
}

/**
 * GET /api/properties/:id
 * Get a property by ID
 */
export async function getProperty(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const property = await propertyService.getPropertyById(req.params.id);

  res.json({
    success: true,
    message: 'Property retrieved',
    messageAr: 'تم استرجاع العقار',
    data: property,
  });
}

/**
 * PATCH /api/properties/:id
 * Update a property
 */
export async function updateProperty(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(updatePropertySchema, req.body);
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  const property = await propertyService.updateProperty(req.params.id, data, userId);

  res.json({
    success: true,
    message: 'Property updated successfully',
    messageAr: 'تم تحديث العقار بنجاح',
    data: property,
  });
}

/**
 * DELETE /api/properties/:id
 * Delete a property
 */
export async function deleteProperty(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
  await propertyService.deleteProperty(req.params.id, userId);

  res.json({
    success: true,
    message: 'Property deleted successfully',
    messageAr: 'تم حذف العقار بنجاح',
  });
}

/**
 * POST /api/properties/:id/images
 * Upload images to a property
 */
export async function uploadImages(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No images uploaded',
      messageAr: 'لم يتم رفع أي صور',
    });
    return;
  }

  // Convert file paths to URLs
  const imagePaths = files.map((file) => `/uploads/properties/${file.filename}`);
  const isAdmin = req.user!.role === 'admin';

  const property = await propertyService.addImages(
    req.params.id,
    req.user!.id,
    imagePaths,
    isAdmin
  );

  res.status(201).json({
    success: true,
    message: `${files.length} image(s) uploaded successfully`,
    messageAr: `تم رفع ${files.length} صورة بنجاح`,
    data: property,
  });
}

/**
 * DELETE /api/properties/:id/images/:imageIndex
 * Remove an image from a property
 */
export async function deleteImage(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const imageIndex = parseInt(req.params.imageIndex, 10);

  if (isNaN(imageIndex)) {
    res.status(400).json({
      success: false,
      message: 'Invalid image index',
      messageAr: 'رقم الصورة غير صالح',
    });
    return;
  }

  const isAdmin = req.user!.role === 'admin';

  const property = await propertyService.removeImage(
    req.params.id,
    req.user!.id,
    imageIndex,
    isAdmin
  );

  res.json({
    success: true,
    message: 'Image removed successfully',
    messageAr: 'تم حذف الصورة بنجاح',
    data: property,
  });
}
