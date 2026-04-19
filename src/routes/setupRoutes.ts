import { Router, Request, Response } from 'express';
import User from '../models/User.js';

const router = Router();

// One-time admin setup endpoint
// DELETE THIS FILE AFTER CREATING ADMIN
router.post('/create-admin', async (_req: Request, res: Response): Promise<void> => {
  try {
    const adminEmail = 'admin@space.com';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      res.json({
        success: false,
        message: 'Admin user already exists',
      });
      return;
    }

    // Create admin user - password will be hashed by User model pre-save hook
    const admin = new User({
      email: adminEmail,
      password: 'Admin@2024',
      fullName: 'Super Admin',
      phone: '+249911716850',
      countryCode: '+249',
      role: 'admin',
      isActive: true,
      isVerified: true,
    });

    await admin.save();

    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@space.com',
        password: 'Admin@2024',
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: String(error),
    });
  }
});

export default router;
