import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyAdminLogin() {
  try {
    console.log('🔍 Checking admin user in database...\n');
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cultofpsyche.com' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        entitlements: {
          select: {
            entitlementType: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ Admin user NOT FOUND in database');
      console.log('\nYou need to run the seed script first.');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', user.email);
    console.log('   ID:', user.id);
    console.log('   Created:', user.createdAt);
    console.log('   Entitlements:', user.entitlements.map(e => e.entitlementType).join(', '));
    console.log('   Password hash:', user.passwordHash.substring(0, 20) + '...');
    
    // Test password verification
    console.log('\n🔐 Testing password verification...');
    
    const testPasswords = ['admin123', 'Admin123', 'ADMIN123'];
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, user.passwordHash);
      console.log(`   "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
    }
    
    console.log('\n💡 If none of these passwords work, you need to reset the password using change-password-direct.mjs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verifyAdminLogin();
