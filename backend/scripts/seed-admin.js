/**
 * Admin Seed Script
 * Usage: node scripts/seed-admin.js
 *
 * Creates the first admin user if none exists.
 * Set credentials via env vars or it will use defaults (change before running in production).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/charityguard';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@charityguard.io';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'SuperAdmin';

async function seedAdmin() {
  if (!ADMIN_PASSWORD) {
    console.error('ERROR: ADMIN_PASSWORD environment variable is required.');
    console.error('Usage: ADMIN_PASSWORD=yourpassword node scripts/seed-admin.js');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Require User model after connection
  const User = require('../models/User');

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.email}`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await User.create({
    email: ADMIN_EMAIL,
    password: hashedPassword,
    username: ADMIN_USERNAME,
    role: 'admin',
    accountStatus: 'active',
    isVerified: true,
    verificationLevel: 'kyc'
  });

  console.log(`Admin created successfully:`);
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Username: ${admin.username}`);
  console.log(`  Role:     ${admin.role}`);

  await mongoose.disconnect();
}

seedAdmin().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
