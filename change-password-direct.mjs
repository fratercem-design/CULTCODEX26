#!/usr/bin/env node

/**
 * Direct SQL script to change admin password
 * Usage: node change-password-direct.mjs <new-password>
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

async function changePassword() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error('❌ Error: Please provide a new password');
    console.log('Usage: node change-password-direct.mjs <new-password>');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Connected to database');
    console.log('Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    console.log('Updating admin password...');
    const result = await client.query(
      'UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING email, "updatedAt"',
      [passwordHash, 'admin@cultofpsyche.com']
    );

    if (result.rowCount === 0) {
      console.error('❌ Admin user not found in database');
      process.exit(1);
    }

    console.log('✅ Password changed successfully!');
    console.log('Email:', result.rows[0].email);
    console.log('Updated at:', result.rows[0].updatedAt);
    console.log('\nYou can now login with the new password at:');
    console.log('https://cultcodex-2666.vercel.app/login');
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

changePassword();
