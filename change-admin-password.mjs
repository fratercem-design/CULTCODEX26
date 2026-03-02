#!/usr/bin/env node

/**
 * Script to change admin user password
 * Usage: node change-admin-password.mjs <new-password>
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Prisma client with pg adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function changeAdminPassword() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('❌ Error: Please provide a new password');
    console.log('Usage: node change-admin-password.mjs <new-password>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  try {
    console.log('Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    console.log('Updating admin user password...');
    const result = await prisma.user.update({
      where: { email: 'admin@cultofpsyche.com' },
      data: { passwordHash },
      select: { email: true, updatedAt: true },
    });

    console.log('✅ Password changed successfully!');
    console.log('Email:', result.email);
    console.log('Updated at:', result.updatedAt);
    console.log('\nYou can now login with the new password.');
  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

changeAdminPassword();
