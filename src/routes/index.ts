import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import propertyRoutes from './propertyRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import userRoutes from './userRoutes.js';
import mapRoutes from './mapRoutes.js';
import measurementRoutes from './measurementRoutes.js';
import industrialRoutes from './industrialRoutes.js';
import messageRoutes from './messageRoutes.js';
import adminRoutes from './adminRoutes.js';
import setupRoutes from './setupRoutes.js';

const router = Router();

// ============================================
// Health Check
// ============================================

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Space Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// Mount Routes
// ============================================

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/properties', propertyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes); // Messaging routes
router.use('/admin', adminRoutes); // Admin routes
router.use(mapRoutes); // Map routes (handles /projects/:id/maps and /maps/:id)
router.use(measurementRoutes); // Measurement & cost routes
router.use(industrialRoutes); // Industrial property routes
router.use('/setup', setupRoutes); // One-time setup routes (DELETE AFTER USE)

export default router;
