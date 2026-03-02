/**
 * Test script for PATCH /api/journal/[id]
 * Tests journal entry update with ownership verification
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'TestPassword123!',
};

const OTHER_USER = {
  email: 'otheruser@example.com',
  password: 'OtherPassword123!',
};

async function signup(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response;
}

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  // Extract session cookie
  const setCookie = response.headers.get('set-cookie');
  return setCookie;
}

async function createJournalEntry(cookie, title, content) {
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({ title, content }),
  });
  
  if (!response.ok) {
    throw new Error(`Create journal entry failed: ${response.status}`);
  }
  
  return response.json();
}

async function updateJournalEntry(cookie, id, updates) {
  const response = await fetch(`${BASE_URL}/api/journal/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify(updates),
  });
  
  return response;
}

async function runTests() {
  console.log('🧪 Testing PATCH /api/journal/[id]\n');
  
  try {
    // Setup: Create test users
    console.log('📝 Setting up test users...');
    await signup(TEST_USER.email, TEST_USER.password);
    await signup(OTHER_USER.email, OTHER_USER.password);
    
    // Login as test user
    console.log('🔐 Logging in as test user...');
    const testUserCookie = await login(TEST_USER.email, TEST_USER.password);
    
    // Login as other user
    console.log('🔐 Logging in as other user...');
    const otherUserCookie = await login(OTHER_USER.email, OTHER_USER.password);
    
    // Create a journal entry as test user
    console.log('📝 Creating journal entry as test user...');
    const entry = await createJournalEntry(
      testUserCookie,
      'Original Title',
      'Original content'
    );
    console.log(`✅ Created entry with ID: ${entry.id}`);
    
    // Test 1: Update entry as owner (should succeed)
    console.log('\n🧪 Test 1: Update entry as owner');
    const updateResponse1 = await updateJournalEntry(
      testUserCookie,
      entry.id,
      { title: 'Updated Title', content: 'Updated content' }
    );
    
    if (updateResponse1.ok) {
      const updated = await updateResponse1.json();
      console.log('✅ PASS: Entry updated successfully');
      console.log(`   Title: "${updated.title}"`);
      console.log(`   Content: "${updated.content}"`);
      
      if (updated.title !== 'Updated Title' || updated.content !== 'Updated content') {
        console.log('❌ FAIL: Updated values do not match expected values');
      }
    } else {
      console.log(`❌ FAIL: Expected 200, got ${updateResponse1.status}`);
      const error = await updateResponse1.json();
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 2: Update only title
    console.log('\n🧪 Test 2: Update only title (partial update)');
    const updateResponse2 = await updateJournalEntry(
      testUserCookie,
      entry.id,
      { title: 'Title Only Update' }
    );
    
    if (updateResponse2.ok) {
      const updated = await updateResponse2.json();
      console.log('✅ PASS: Title updated successfully');
      console.log(`   Title: "${updated.title}"`);
      console.log(`   Content: "${updated.content}"`);
      
      if (updated.title !== 'Title Only Update') {
        console.log('❌ FAIL: Title not updated correctly');
      }
      if (updated.content !== 'Updated content') {
        console.log('❌ FAIL: Content should remain unchanged');
      }
    } else {
      console.log(`❌ FAIL: Expected 200, got ${updateResponse2.status}`);
    }
    
    // Test 3: Update only content
    console.log('\n🧪 Test 3: Update only content (partial update)');
    const updateResponse3 = await updateJournalEntry(
      testUserCookie,
      entry.id,
      { content: 'Content Only Update' }
    );
    
    if (updateResponse3.ok) {
      const updated = await updateResponse3.json();
      console.log('✅ PASS: Content updated successfully');
      console.log(`   Title: "${updated.title}"`);
      console.log(`   Content: "${updated.content}"`);
      
      if (updated.content !== 'Content Only Update') {
        console.log('❌ FAIL: Content not updated correctly');
      }
      if (updated.title !== 'Title Only Update') {
        console.log('❌ FAIL: Title should remain unchanged');
      }
    } else {
      console.log(`❌ FAIL: Expected 200, got ${updateResponse3.status}`);
    }
    
    // Test 4: Try to update entry as different user (should fail with 403)
    console.log('\n🧪 Test 4: Try to update entry as different user (should fail)');
    const updateResponse4 = await updateJournalEntry(
      otherUserCookie,
      entry.id,
      { title: 'Unauthorized Update' }
    );
    
    if (updateResponse4.status === 403) {
      console.log('✅ PASS: Correctly rejected with 403 Forbidden');
      const error = await updateResponse4.json();
      console.log(`   Message: ${error.message}`);
    } else {
      console.log(`❌ FAIL: Expected 403, got ${updateResponse4.status}`);
    }
    
    // Test 5: Try to update non-existent entry (should fail with 404)
    console.log('\n🧪 Test 5: Try to update non-existent entry (should fail)');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const updateResponse5 = await updateJournalEntry(
      testUserCookie,
      fakeId,
      { title: 'Update Non-existent' }
    );
    
    if (updateResponse5.status === 404) {
      console.log('✅ PASS: Correctly rejected with 404 Not Found');
      const error = await updateResponse5.json();
      console.log(`   Message: ${error.message}`);
    } else {
      console.log(`❌ FAIL: Expected 404, got ${updateResponse5.status}`);
    }
    
    // Test 6: Try to update without authentication (should fail with 401)
    console.log('\n🧪 Test 6: Try to update without authentication (should fail)');
    const updateResponse6 = await fetch(`${BASE_URL}/api/journal/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthenticated Update' }),
    });
    
    if (updateResponse6.status === 401) {
      console.log('✅ PASS: Correctly rejected with 401 Unauthorized');
    } else {
      console.log(`❌ FAIL: Expected 401, got ${updateResponse6.status}`);
    }
    
    // Test 7: Try to update with empty title (should fail with 400)
    console.log('\n🧪 Test 7: Try to update with empty title (should fail)');
    const updateResponse7 = await updateJournalEntry(
      testUserCookie,
      entry.id,
      { title: '' }
    );
    
    if (updateResponse7.status === 400) {
      console.log('✅ PASS: Correctly rejected with 400 Bad Request');
      const error = await updateResponse7.json();
      console.log(`   Message: ${error.message}`);
    } else {
      console.log(`❌ FAIL: Expected 400, got ${updateResponse7.status}`);
    }
    
    // Test 8: Try to update with empty content (should fail with 400)
    console.log('\n🧪 Test 8: Try to update with empty content (should fail)');
    const updateResponse8 = await updateJournalEntry(
      testUserCookie,
      entry.id,
      { content: '   ' }
    );
    
    if (updateResponse8.status === 400) {
      console.log('✅ PASS: Correctly rejected with 400 Bad Request');
      const error = await updateResponse8.json();
      console.log(`   Message: ${error.message}`);
    } else {
      console.log(`❌ FAIL: Expected 400, got ${updateResponse8.status}`);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
