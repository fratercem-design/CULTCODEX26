#!/usr/bin/env node

/**
 * Seed Production Database
 * 
 * This script calls the /api/admin/seed endpoint on the deployed Vercel app
 * to initialize the database with admin user and sample data.
 */

const VERCEL_URL = 'https://cultcodex-2666.vercel.app';
const SEED_SECRETS = [
  'change-this-secret-key', // Default if SEED_SECRET env var not set
  'cultcodex-seed-secret-2024',
];

async function seedProduction() {
  console.log('🌱 Seeding production database...');
  console.log(`📍 URL: ${VERCEL_URL}/api/admin/seed\n`);

  let lastError = null;

  for (const secret of SEED_SECRETS) {
    try {
      console.log(`Trying seed secret...`);
      const response = await fetch(`${VERCEL_URL}/api/admin/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret }),
      });

      const data = await response.json();

      if (!response.ok) {
        lastError = data;
        continue; // Try next secret
      }

      // Success!
      console.log('✅ Database seeded successfully!\n');
      console.log('📋 Admin Credentials:');
      console.log(`   Email: ${data.admin.email}`);
      console.log(`   Password: ${data.admin.password}`);
      console.log(`   Entitlements: ${data.admin.entitlements.join(', ')}\n`);
      console.log('🔗 Login at:', `${VERCEL_URL}/login`);
      console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
      return;

    } catch (error) {
      lastError = error;
      continue;
    }
  }

  // If we get here, all secrets failed
  console.error('❌ Seed failed with all secrets:', lastError);
  console.log('\n💡 Check your Vercel environment variables:');
  console.log('   Go to: https://vercel.com/your-project/settings/environment-variables');
  console.log('   Verify SEED_SECRET is set correctly');
  process.exit(1);
}

seedProduction();
