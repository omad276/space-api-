/**
 * Create Admin User Script
 * Run: node scripts/createAdmin.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/space-platform';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@space.com';
    const adminPassword = 'Admin@2024';

    // Check if admin already exists
    const existingAdmin = await mongoose.connection.db.collection('users').findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = {
      email: adminEmail,
      password: hashedPassword,
      fullName: 'Super Admin',
      phone: '+249911716850',
      countryCode: '+249',
      role: 'admin',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await mongoose.connection.db.collection('users').updateOne(
      { email: adminEmail },
      { $set: adminUser },
      { upsert: true }
    );

    console.log('');
    console.log('='.repeat(50));
    console.log('Admin user created/updated successfully!');
    console.log('='.repeat(50));
    console.log('');
    console.log('Email:    admin@space.com');
    console.log('Password: Admin@2024');
    console.log('');
    console.log('Contact Info:');
    console.log('WhatsApp: +249911716850');
    console.log('Email:    esmailabdelrazig@gmail.com');
    console.log('='.repeat(50));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
