#!/usr/bin/env node

/**
 * Script to verify admin password in database
 * Usage: node verify-admin-password.mjs <password-to-test>
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

async function verifyAdminPassword() {
  const passwordToTest = process.argv[2];

  if (!passwordToTest) {
    console.error('❌ Error: Please provide a password to test');
    console.log('Usage: node verify-admin-password.mjs <password-to-test>');
    process.exit(1);
  }

  try {
    console.log('Fetching admin user from database...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cultofpsyche.com' },
      select: { 
        email: true, 
        passwordHash: true,
        updatedAt: true 
      },
    });

    if (!user) {
      console.error('❌ Admin user not found in database');
      process.exit(1);
    }

    console.log('✅ Admin user found');
    console.log('Email:', user.email);
    console.log('Last updated:', user.updatedAt);
    console.log('Password hash (first 20 chars):', user.passwordHash.substring(0, 20) + '...');
    console.log('\nTesting password...');

    const isValid = await bcrypt.compare(passwordToTest, user.passwordHash);

    if (isValid) {
      console.log('✅ Password is CORRECT!');
    } else {
      console.log('❌ Password is INCORRECT');
      console.log('\nTrying to verify the hash format...');
      
      // Check if it's a valid bcrypt hash
      const isBcryptHash = user.passwordHash.startsWith('$2a$') || 
                          user.passwordHash.startsWith('$2b$') || 
                          user.passwordHash.startsWith('$2y$');
      
      if (isBcryptHash) {
        console.log('✅ Hash format is valid bcrypt');
      } else {
        console.log('❌ Hash format is NOT valid bcrypt');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verifyAdminPassword();
