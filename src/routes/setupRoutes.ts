import { Router, Request, Response } from 'express';
import User from '../models/User.js';

const router = Router();

// One-time admin setup endpoint
// DELETE THIS FILE AFTER CREATING ADMIN
router.post('/create-admin', async (_req: Request, res: Response): Promise<void> => {
  try {
    const adminEmail = 'admin@bspace.sd';
    const adminPassword = 'BSpace2026Admin';

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      // Update existing admin password
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.isActive = true;
      admin.isVerified = true;
      await admin.save();

      res.json({
        success: true,
        message: 'Admin password updated',
        credentials: {
          email: adminEmail,
          password: adminPassword,
        },
      });
      return;
    }

    // Create admin user - password will be hashed by User model pre-save hook
    admin = new User({
      email: adminEmail,
      password: adminPassword,
      fullName: 'مدير النظام',
      phone: '+249123456789',
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
        email: adminEmail,
        password: adminPassword,
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
