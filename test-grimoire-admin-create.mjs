#!/usr/bin/env node

/**
 * Test script for POST /api/admin/grimoire endpoint
 * Tests creating a new GrimoireEntry with initial revision
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

async function createGrimoireEntry(sessionCookie, data) {
  const response = await fetch(`${BASE_URL}/api/admin/grimoire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  return { status: response.status, data: responseData };
}

async function runTests() {
  console.log('🧪 Testing POST /api/admin/grimoire endpoint\n');

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    const sessionCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin login successful\n');

    // Test 1: Create valid grimoire entry
    console.log('2️⃣ Test: Create valid grimoire entry');
    const validEntry = {
      title: 'The Art of Divination',
      slug: 'art-of-divination',
      content: '# The Art of Divination\n\nDivination is the practice of seeking knowledge of the future or the unknown by supernatural means.',
    };
    const result1 = await createGrimoireEntry(sessionCookie, validEntry);
    console.log(`Status: ${result1.status}`);
    console.log('Response:', JSON.stringify(result1.data, null, 2));
    
    if (result1.status === 201) {
      console.log('✅ Successfully created grimoire entry');
      console.log(`   - Entry ID: ${result1.data.id}`);
      console.log(`   - Title: ${result1.data.title}`);
      console.log(`   - Slug: ${result1.data.slug}`);
      console.log(`   - Current Revision ID: ${result1.data.currentRevisionId}`);
      console.log(`   - Revision Number: ${result1.data.currentRevision.revisionNumber}`);
      console.log(`   - Author ID: ${result1.data.currentRevision.authorId}`);
    } else {
      console.log('❌ Failed to create grimoire entry');
    }
    console.log();

    // Test 2: Try to create entry with duplicate slug
    console.log('3️⃣ Test: Create entry with duplicate slug (should fail)');
    const duplicateEntry = {
      title: 'Another Divination Guide',
      slug: 'art-of-divination', // Same slug as above
      content: 'Different content',
    };
    const result2 = await createGrimoireEntry(sessionCookie, duplicateEntry);
    console.log(`Status: ${result2.status}`);
    console.log('Response:', JSON.stringify(result2.data, null, 2));
    
    if (result2.status === 409) {
      console.log('✅ Correctly rejected duplicate slug');
    } else {
      console.log('❌ Should have rejected duplicate slug with 409');
    }
    console.log();

    // Test 3: Create entry with missing title
    console.log('4️⃣ Test: Create entry with missing title (should fail)');
    const missingTitle = {
      slug: 'test-slug',
      content: 'Some content',
    };
    const result3 = await createGrimoireEntry(sessionCookie, missingTitle);
    console.log(`Status: ${result3.status}`);
    console.log('Response:', JSON.stringify(result3.data, null, 2));
    
    if (result3.status === 400) {
      console.log('✅ Correctly rejected missing title');
    } else {
      console.log('❌ Should have rejected missing title with 400');
    }
    console.log();

    // Test 4: Create entry with invalid slug format
    console.log('5️⃣ Test: Create entry with invalid slug format (should fail)');
    const invalidSlug = {
      title: 'Test Entry',
      slug: 'Invalid Slug With Spaces',
      content: 'Some content',
    };
    const result4 = await createGrimoireEntry(sessionCookie, invalidSlug);
    console.log(`Status: ${result4.status}`);
    console.log('Response:', JSON.stringify(result4.data, null, 2));
    
    if (result4.status === 400) {
      console.log('✅ Correctly rejected invalid slug format');
    } else {
      console.log('❌ Should have rejected invalid slug with 400');
    }
    console.log();

    // Test 5: Create entry with missing content
    console.log('6️⃣ Test: Create entry with missing content (should fail)');
    const missingContent = {
      title: 'Test Entry',
      slug: 'test-entry',
    };
    const result5 = await createGrimoireEntry(sessionCookie, missingContent);
    console.log(`Status: ${result5.status}`);
    console.log('Response:', JSON.stringify(result5.data, null, 2));
    
    if (result5.status === 400) {
      console.log('✅ Correctly rejected missing content');
    } else {
      console.log('❌ Should have rejected missing content with 400');
    }
    console.log();

    // Test 6: Create another valid entry
    console.log('7️⃣ Test: Create another valid grimoire entry');
    const validEntry2 = {
      title: 'Ritual Preparation',
      slug: 'ritual-preparation',
      content: '# Ritual Preparation\n\nProper preparation is essential for effective ritual work.',
    };
    const result6 = await createGrimoireEntry(sessionCookie, validEntry2);
    console.log(`Status: ${result6.status}`);
    console.log('Response:', JSON.stringify(result6.data, null, 2));
    
    if (result6.status === 201) {
      console.log('✅ Successfully created second grimoire entry');
    } else {
      console.log('❌ Failed to create second grimoire entry');
    }
    console.log();

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTests();
