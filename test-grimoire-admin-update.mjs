#!/usr/bin/env node

/**
 * Test script for PATCH /api/admin/grimoire/[id] endpoint
 * Tests updating a GrimoireEntry by creating new revisions
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

async function updateGrimoireEntry(sessionCookie, id, data) {
  const response = await fetch(`${BASE_URL}/api/admin/grimoire/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  return { status: response.status, data: responseData };
}

async function getRevisionHistory(sessionCookie, slug) {
  const response = await fetch(`${BASE_URL}/api/grimoire/${slug}/revisions`, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  const responseData = await response.json();
  return { status: response.status, data: responseData };
}

async function runTests() {
  console.log('🧪 Testing PATCH /api/admin/grimoire/[id] endpoint\n');

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    const sessionCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin login successful\n');

    // Create a test entry first
    console.log('2️⃣ Creating test grimoire entry...');
    const timestamp = Date.now();
    const testEntry = {
      title: 'Test Entry for Updates',
      slug: `test-entry-updates-${timestamp}`,
      content: '# Original Content\n\nThis is the original content.',
    };
    const createResult = await createGrimoireEntry(sessionCookie, testEntry);
    
    if (createResult.status !== 201) {
      throw new Error('Failed to create test entry');
    }
    
    const entryId = createResult.data.id;
    const entrySlug = createResult.data.slug;
    console.log('✅ Test entry created');
    console.log(`   - Entry ID: ${entryId}`);
    console.log(`   - Initial Revision Number: ${createResult.data.currentRevision.revisionNumber}`);
    console.log();

    // Test 1: Update content only
    console.log('3️⃣ Test: Update content only');
    const updateContent = {
      content: '# Updated Content\n\nThis is the updated content with new information.',
    };
    const result1 = await updateGrimoireEntry(sessionCookie, entryId, updateContent);
    console.log(`Status: ${result1.status}`);
    console.log('Response:', JSON.stringify(result1.data, null, 2));
    
    if (result1.status === 200) {
      console.log('✅ Successfully updated content');
      console.log(`   - New Revision Number: ${result1.data.currentRevision.revisionNumber}`);
      console.log(`   - Title unchanged: ${result1.data.title}`);
      
      if (result1.data.currentRevision.revisionNumber === 2) {
        console.log('✅ Revision number correctly incremented to 2');
      } else {
        console.log('❌ Revision number should be 2');
      }
    } else {
      console.log('❌ Failed to update content');
    }
    console.log();

    // Test 2: Update title only
    console.log('4️⃣ Test: Update title only');
    const updateTitle = {
      title: 'Updated Test Entry Title',
    };
    const result2 = await updateGrimoireEntry(sessionCookie, entryId, updateTitle);
    console.log(`Status: ${result2.status}`);
    console.log('Response:', JSON.stringify(result2.data, null, 2));
    
    if (result2.status === 200) {
      console.log('✅ Successfully updated title');
      console.log(`   - New Title: ${result2.data.title}`);
      console.log(`   - New Revision Number: ${result2.data.currentRevision.revisionNumber}`);
      
      if (result2.data.currentRevision.revisionNumber === 3) {
        console.log('✅ Revision number correctly incremented to 3');
      } else {
        console.log('❌ Revision number should be 3');
      }
    } else {
      console.log('❌ Failed to update title');
    }
    console.log();

    // Test 3: Update both title and content
    console.log('5️⃣ Test: Update both title and content');
    const updateBoth = {
      title: 'Final Updated Title',
      content: '# Final Content\n\nThis is the final version with both title and content updated.',
    };
    const result3 = await updateGrimoireEntry(sessionCookie, entryId, updateBoth);
    console.log(`Status: ${result3.status}`);
    console.log('Response:', JSON.stringify(result3.data, null, 2));
    
    if (result3.status === 200) {
      console.log('✅ Successfully updated both title and content');
      console.log(`   - New Title: ${result3.data.title}`);
      console.log(`   - New Revision Number: ${result3.data.currentRevision.revisionNumber}`);
      
      if (result3.data.currentRevision.revisionNumber === 4) {
        console.log('✅ Revision number correctly incremented to 4');
      } else {
        console.log('❌ Revision number should be 4');
      }
    } else {
      console.log('❌ Failed to update both fields');
    }
    console.log();

    // Test 4: Verify revision history
    console.log('6️⃣ Test: Verify revision history');
    const historyResult = await getRevisionHistory(sessionCookie, entrySlug);
    console.log(`Status: ${historyResult.status}`);
    
    if (historyResult.status === 200) {
      const revisions = historyResult.data.revisions;
      console.log(`✅ Retrieved revision history (${revisions.length} revisions)`);
      
      if (revisions.length === 4) {
        console.log('✅ Correct number of revisions (4)');
        console.log('   Revision numbers:', revisions.map(r => r.revisionNumber).join(', '));
      } else {
        console.log(`❌ Expected 4 revisions, got ${revisions.length}`);
      }
    } else {
      console.log('❌ Failed to retrieve revision history');
    }
    console.log();

    // Test 5: Update with empty body (should fail)
    console.log('7️⃣ Test: Update with empty body (should fail)');
    const emptyUpdate = {};
    const result4 = await updateGrimoireEntry(sessionCookie, entryId, emptyUpdate);
    console.log(`Status: ${result4.status}`);
    console.log('Response:', JSON.stringify(result4.data, null, 2));
    
    if (result4.status === 400) {
      console.log('✅ Correctly rejected empty update');
    } else {
      console.log('❌ Should have rejected empty update with 400');
    }
    console.log();

    // Test 6: Update with invalid title (should fail)
    console.log('8️⃣ Test: Update with invalid title (should fail)');
    const invalidTitle = {
      title: '',
    };
    const result5 = await updateGrimoireEntry(sessionCookie, entryId, invalidTitle);
    console.log(`Status: ${result5.status}`);
    console.log('Response:', JSON.stringify(result5.data, null, 2));
    
    if (result5.status === 400) {
      console.log('✅ Correctly rejected empty title');
    } else {
      console.log('❌ Should have rejected empty title with 400');
    }
    console.log();

    // Test 7: Update non-existent entry (should fail)
    console.log('9️⃣ Test: Update non-existent entry (should fail)');
    const fakeId = 'clxxxxxxxxxxxxxxxxxx';
    const result6 = await updateGrimoireEntry(sessionCookie, fakeId, { content: 'test' });
    console.log(`Status: ${result6.status}`);
    console.log('Response:', JSON.stringify(result6.data, null, 2));
    
    if (result6.status === 404) {
      console.log('✅ Correctly returned 404 for non-existent entry');
    } else {
      console.log('❌ Should have returned 404 for non-existent entry');
    }
    console.log();

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
