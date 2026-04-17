import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = Router();

// One-time admin setup endpoint
// DELETE THIS FILE AFTER CREATING ADMIN
router.post('/create-admin', async (_req, res) => {
  try {
    const adminEmail = 'admin@space.com';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.json({
        success: false,
        message: 'Admin user already exists',
      });
    }

    // Create admin user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@2024', salt);

    const admin = new User({
      email: adminEmail,
      password: hashedPassword,
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
