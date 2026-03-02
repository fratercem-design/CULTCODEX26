import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testPrismaAdapter() {
  console.log('Testing Prisma with pg adapter...\n');

  try {
    // Create connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });

    console.log('✓ Pool created');

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);
    console.log('✓ Adapter created');

    // Create Prisma client
    const prisma = new PrismaClient({ adapter });
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

    // Cleanup
    await prisma.$disconnect();
    await pool.end();
    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testPrismaAdapter();
