import { Response } from 'express';
import * as favoriteService from '../services/favoriteService.js';
import { AuthRequest, ApiResponse } from '../types/index.js';
import {
  validate,
  addFavoriteSchema,
  updateFavoriteNotesSchema,
  moveToCollectionSchema,
  createCollectionSchema,
  updateCollectionSchema,
} from '../utils/validation.js';

// ============================================
// Favorites Controller
// ============================================

/**
 * GET /api/favorites
 * Get all favorites and collections for the current user
 */
export async function getFavorites(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const result = await favoriteService.getUserFavorites(req.user!.id);

  res.json({
    success: true,
    message: 'Favorites retrieved',
    messageAr: 'تم استرجاع المفضلة',
    data: result,
  });
}

/**
 * POST /api/favorites
 * Add a property to favorites
 */
export async function addFavorite(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(addFavoriteSchema, req.body);

  const favorites = await favoriteService.addToFavorites(
    req.user!.id,
    data.propertyId,
    data.collectionId,
    data.notes
  );

  res.status(201).json({
    success: true,
    message: 'Property added to favorites',
    messageAr: 'تمت إضافة العقار إلى المفضلة',
    data: favorites,
  });
}

/**
 * DELETE /api/favorites/:propertyId
 * Remove a property from favorites
 */
export async function removeFavorite(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  await favoriteService.removeFromFavorites(req.user!.id, req.params.propertyId);

  res.json({
    success: true,
    message: 'Property removed from favorites',
    messageAr: 'تمت إزالة العقار من المفضلة',
  });
}

/**
 * PATCH /api/favorites/:propertyId/notes
 * Update notes for a favorite
 */
export async function updateNotes(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(updateFavoriteNotesSchema, req.body);

  const favorite = await favoriteService.updateFavoriteNotes(
    req.user!.id,
    req.params.propertyId,
    data.notes
  );

  res.json({
    success: true,
    message: 'Notes updated',
    messageAr: 'تم تحديث الملاحظات',
    data: favorite,
  });
}

/**
 * PATCH /api/favorites/:propertyId/collection
 * Move a favorite to a different collection
 */
export async function moveToCollection(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(moveToCollectionSchema, req.body);

  const favorite = await favoriteService.moveToCollection(
    req.user!.id,
    req.params.propertyId,
    data.collectionId
  );

  res.json({
    success: true,
    message: 'Favorite moved to collection',
    messageAr: 'تم نقل العقار إلى المجموعة',
    data: favorite,
  });
}

/**
 * GET /api/favorites/check/:propertyId
 * Check if a property is favorited
 */
export async function checkFavorite(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const isFavorited = await favoriteService.isFavorited(req.user!.id, req.params.propertyId);

  res.json({
    success: true,
    message: 'Favorite status checked',
    data: { isFavorited },
  });
}

// ============================================
// Collections Controller
// ============================================

/**
 * POST /api/favorites/collections
 * Create a new collection
 */
export async function createCollection(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(createCollectionSchema, req.body);
  const collection = await favoriteService.createCollection(req.user!.id, data);

  res.status(201).json({
    success: true,
    message: 'Collection created',
    messageAr: 'تم إنشاء المجموعة',
    data: collection,
  });
}

/**
 * PATCH /api/favorites/collections/:collectionId
 * Update a collection
 */
export async function updateCollection(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const data = validate(updateCollectionSchema, req.body);
  const collection = await favoriteService.updateCollection(
    req.user!.id,
    req.params.collectionId,
    data
  );

  res.json({
    success: true,
    message: 'Collection updated',
    messageAr: 'تم تحديث المجموعة',
    data: collection,
  });
}

/**
 * DELETE /api/favorites/collections/:collectionId
 * Delete a collection
 */
export async function deleteCollection(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  await favoriteService.deleteCollection(req.user!.id, req.params.collectionId);

  res.json({
    success: true,
    message: 'Collection deleted',
    messageAr: 'تم حذف المجموعة',
  });
}

/**
 * GET /api/favorites/shared/:shareLink
 * Get a shared collection (public)
 */
export async function getSharedCollection(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const result = await favoriteService.getSharedCollection(req.params.shareLink);

  res.json({
    success: true,
    message: 'Shared collection retrieved',
    data: result,
  });
}
