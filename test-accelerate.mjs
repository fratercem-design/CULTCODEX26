import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function testAccelerate() {
  console.log('Testing Prisma Accelerate connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...\n');

  try {
    const prisma = new PrismaClient({
      accelerateUrl: process.env.DATABASE_URL,
      log: ['query', 'error', 'warn'],
    });
    console.log('✓ Prisma client created');

    // Test query
    const userCount = await prisma.user.count();
    console.log(`✓ Query successful: ${userCount} users in database`);

    // Test finding admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@cultofpsyche.com' },
      select: {
        id: true,
        email: true,
        entitlements: {
          select: {
            entitlementType: true,
          },
        },
      },
    });

    if (admin) {
      console.log('✓ Admin user found:', admin.email);
      console.log('  Entitlements:', admin.entitlements.map(e => e.entitlementType).join(', '));
    } else {
      console.log('✗ Admin user not found');
    }

    await prisma.$disconnect();
    console.log('\n✓ Accelerate connection test passed!');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testAccelerate();
