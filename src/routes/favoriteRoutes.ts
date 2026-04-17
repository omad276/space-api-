import { Router } from 'express';
import * as favoriteController from '../controllers/favoriteController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ============================================
// Public Routes
// ============================================

// GET /api/favorites/shared/:shareLink - Get a shared collection
router.get('/shared/:shareLink', optionalAuth, favoriteController.getSharedCollection);

// ============================================
// Protected Routes (require authentication)
// ============================================

// GET /api/favorites - Get all favorites and collections
router.get('/', authenticate, favoriteController.getFavorites);

// POST /api/favorites - Add a property to favorites
router.post('/', authenticate, favoriteController.addFavorite);

// GET /api/favorites/check/:propertyId - Check if a property is favorited
router.get('/check/:propertyId', authenticate, favoriteController.checkFavorite);

// DELETE /api/favorites/:propertyId - Remove a property from favorites
router.delete('/:propertyId', authenticate, favoriteController.removeFavorite);

// PATCH /api/favorites/:propertyId/notes - Update notes for a favorite
router.patch('/:propertyId/notes', authenticate, favoriteController.updateNotes);

// PATCH /api/favorites/:propertyId/collection - Move to a collection
router.patch('/:propertyId/collection', authenticate, favoriteController.moveToCollection);

// ============================================
// Collection Routes
// ============================================

// POST /api/favorites/collections - Create a new collection
router.post('/collections', authenticate, favoriteController.createCollection);

// PATCH /api/favorites/collections/:collectionId - Update a collection
router.patch('/collections/:collectionId', authenticate, favoriteController.updateCollection);

// DELETE /api/favorites/collections/:collectionId - Delete a collection
router.delete('/collections/:collectionId', authenticate, favoriteController.deleteCollection);

export default router;
