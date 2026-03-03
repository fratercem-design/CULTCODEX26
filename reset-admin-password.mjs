#!/usr/bin/env node

/**
 * Reset admin password to: CultAdmin2026!
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config();

async function resetPassword() {
  const newPassword = 'CultAdmin2026!';

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Resetting admin password...\n');
    const client = await pool.connect();
    
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    console.log('Updating database...');
    const result = await client.query(
      'UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING email, "updatedAt"',
      [passwordHash, 'admin@cultofpsyche.com']
    );

    if (result.rowCount === 0) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ Password reset successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('  Email:    admin@cultofpsyche.com');
    console.log('  Password: CultAdmin2026!');
    console.log('═══════════════════════════════════════\n');
    console.log('Login at: https://cultwiki26-hwhop1h94-psychep-2.vercel.app/login');
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetPassword();
