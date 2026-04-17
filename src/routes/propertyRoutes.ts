import { Router } from 'express';
import * as propertyController from '../controllers/propertyController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadPropertyImages } from '../middleware/upload.js';

const router = Router();

// ============================================
// Public Routes
// ============================================

// GET /api/properties - Search/list properties (public)
router.get('/', optionalAuth, propertyController.getProperties);

// GET /api/properties/featured - Get featured properties (public)
router.get('/featured', optionalAuth, propertyController.getFeaturedProperties);

// GET /api/properties/stats - Get statistics (public)
router.get('/stats', optionalAuth, propertyController.getStats);

// GET /api/properties/:id - Get property details (public)
router.get('/:id', optionalAuth, propertyController.getProperty);

// ============================================
// Protected Routes (require authentication)
// ============================================

// GET /api/properties/my - Get current user's properties
router.get('/my', authenticate, propertyController.getMyProperties);

// POST /api/properties - Create a new property
router.post('/', authenticate, propertyController.createProperty);

// PATCH /api/properties/:id - Update a property
router.patch('/:id', authenticate, propertyController.updateProperty);

// DELETE /api/properties/:id - Delete a property
router.delete('/:id', authenticate, propertyController.deleteProperty);

// POST /api/properties/:id/images - Upload images to a property
router.post(
  '/:id/images',
  authenticate,
  uploadPropertyImages.array('images', 20),
  propertyController.uploadImages
);

// DELETE /api/properties/:id/images/:imageIndex - Remove an image from a property
router.delete('/:id/images/:imageIndex', authenticate, propertyController.deleteImage);

export default router;
