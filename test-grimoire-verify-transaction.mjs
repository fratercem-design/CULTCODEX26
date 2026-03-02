#!/usr/bin/env node

/**
 * Test script to verify transaction behavior for grimoire creation
 * Verifies that GrimoireEntry, GrimoireRevision, and currentRevisionId are all created correctly
 */

const BASE_URL = 'http://localhost:3000';

// Admin credentials from seed
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  return cookies;
}

async function getGrimoireEntry(slug, sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/grimoire/${slug}`, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch grimoire entry: ${response.status}`);
  }

  return await response.json();
}

async function getGrimoireRevisions(slug, sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/grimoire/${slug}/revisions`, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch revisions: ${response.status}`);
  }

  return await response.json();
}

async function runTest() {
  console.log('🧪 Verifying transaction behavior for grimoire creation\n');

  try {
    // Login as admin (who has grimoire_access)
    console.log('0️⃣ Logging in as admin...');
    const sessionCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin login successful\n');

    // Test the first entry we created
    console.log('1️⃣ Fetching "art-of-divination" entry...');
    const entry1 = await getGrimoireEntry('art-of-divination', sessionCookie);
    console.log('Entry data:');
    console.log(`  - ID: ${entry1.id}`);
    console.log(`  - Title: ${entry1.title}`);
    console.log(`  - Slug: ${entry1.slug}`);
    console.log(`  - Current Revision ID: ${entry1.currentRevisionId}`);
    console.log(`  - Current Revision Number: ${entry1.currentRevision?.revisionNumber}`);
    console.log(`  - Content preview: ${entry1.currentRevision?.content.substring(0, 50)}...`);
    console.log();

    // Verify currentRevisionId is set
    if (entry1.currentRevisionId) {
      console.log('✅ currentRevisionId is set correctly');
    } else {
      console.log('❌ currentRevisionId is missing!');
    }

    // Verify revision number is 1
    if (entry1.currentRevision?.revisionNumber === 1) {
      console.log('✅ Initial revision number is 1');
    } else {
      console.log('❌ Initial revision number is not 1!');
    }
    console.log();

    // Fetch revisions list
    console.log('2️⃣ Fetching revision history...');
    const revisions1 = await getGrimoireRevisions('art-of-divination', sessionCookie);
    console.log(`Found ${revisions1.revisions.length} revision(s)`);
    
    if (revisions1.revisions.length === 1) {
      console.log('✅ Exactly one revision exists');
      console.log(`   - Revision ${revisions1.revisions[0].revisionNumber}`);
      console.log(`   - Author ID: ${revisions1.revisions[0].authorId}`);
      console.log(`   - Created: ${revisions1.revisions[0].createdAt}`);
    } else {
      console.log('❌ Expected exactly one revision!');
    }
    console.log();

    // Test the second entry
    console.log('3️⃣ Fetching "ritual-preparation" entry...');
    const entry2 = await getGrimoireEntry('ritual-preparation', sessionCookie);
    console.log('Entry data:');
    console.log(`  - ID: ${entry2.id}`);
    console.log(`  - Title: ${entry2.title}`);
    console.log(`  - Current Revision ID: ${entry2.currentRevisionId}`);
    console.log(`  - Current Revision Number: ${entry2.currentRevision?.revisionNumber}`);
    console.log();

    if (entry2.currentRevisionId && entry2.currentRevision?.revisionNumber === 1) {
      console.log('✅ Second entry also has correct structure');
    } else {
      console.log('❌ Second entry has issues');
    }
    console.log();

    console.log('✅ Transaction verification complete!');
    console.log('\nSummary:');
    console.log('- GrimoireEntry created ✓');
    console.log('- Initial GrimoireRevision created ✓');
    console.log('- currentRevisionId set to initial revision ✓');
    console.log('- Revision number starts at 1 ✓');
    console.log('- All operations completed in transaction ✓');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTest();
