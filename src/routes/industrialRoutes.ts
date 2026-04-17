import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as industrialController from '../controllers/industrialController.js';

const router = Router();

// ============================================
// Industrial Routes
// ============================================

// Public routes (read-only)
router.get('/industrial', industrialController.listIndustrial);
router.get('/industrial/stats', industrialController.getIndustrialStats);
router.get('/industrial/:id', industrialController.getIndustrial);
router.get('/properties/:propertyId/industrial', industrialController.getIndustrialByProperty);

// Protected routes (require authentication)
router.post('/industrial', authenticate, industrialController.createIndustrial);
router.patch('/industrial/:id', authenticate, industrialController.updateIndustrial);
router.delete('/industrial/:id', authenticate, industrialController.deleteIndustrial);

export default router;
