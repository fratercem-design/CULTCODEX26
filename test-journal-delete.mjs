/**
 * Test script for Journal Entry DELETE endpoint
 * Tests:
 * 1. Create a journal entry
 * 2. Delete the journal entry (should succeed)
 * 3. Try to delete again (should return 404)
 * 4. Try to delete another user's entry (should return 403)
 */

const BASE_URL = 'http://localhost:3000';

// Test users
const USER1 = {
  email: 'journaluser1@test.com',
  password: 'TestPassword123!',
};

const USER2 = {
  email: 'journaluser2@test.com',
  password: 'TestPassword123!',
};

async function signup(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok && response.status !== 409) {
    throw new Error(`Signup failed: ${response.status}`);
  }
  
  return response.ok;
}

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function createJournalEntry(cookies, title, content) {
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({ title, content }),
  });
  
  if (!response.ok) {
    throw new Error(`Create journal entry failed: ${response.status}`);
  }
  
  return response.json();
}

async function deleteJournalEntry(cookies, entryId) {
  const response = await fetch(`${BASE_URL}/api/journal/${entryId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': cookies,
    },
  });
  
  return response;
}

async function runTests() {
  console.log('🧪 Testing Journal Entry DELETE endpoint\n');
  
  try {
    // Setup: Create test users
    console.log('📝 Setting up test users...');
    await signup(USER1.email, USER1.password);
    await signup(USER2.email, USER2.password);
    
    const user1Cookies = await login(USER1.email, USER1.password);
    const user2Cookies = await login(USER2.email, USER2.password);
    console.log('✅ Test users ready\n');
    
    // Test 1: Create and delete a journal entry
    console.log('Test 1: Create and delete a journal entry');
    const entry1 = await createJournalEntry(
      user1Cookies,
      'Test Entry to Delete',
      'This entry will be deleted'
    );
    console.log(`  Created entry: ${entry1.id}`);
    
    const deleteResponse1 = await deleteJournalEntry(user1Cookies, entry1.id);
    if (deleteResponse1.status === 200) {
      const result = await deleteResponse1.json();
      console.log(`  ✅ Delete succeeded: ${result.message}`);
    } else {
      console.log(`  ❌ Delete failed with status: ${deleteResponse1.status}`);
    }
    
    // Test 2: Try to delete the same entry again (should return 404)
    console.log('\nTest 2: Try to delete already deleted entry');
    const deleteResponse2 = await deleteJournalEntry(user1Cookies, entry1.id);
    if (deleteResponse2.status === 404) {
      const result = await deleteResponse2.json();
      console.log(`  ✅ Correctly returned 404: ${result.message}`);
    } else {
      console.log(`  ❌ Expected 404, got: ${deleteResponse2.status}`);
    }
    
    // Test 3: Try to delete another user's entry (should return 403)
    console.log('\nTest 3: Try to delete another user\'s entry');
    const entry2 = await createJournalEntry(
      user2Cookies,
      'User 2 Entry',
      'This belongs to user 2'
    );
    console.log(`  Created entry for user 2: ${entry2.id}`);
    
    const deleteResponse3 = await deleteJournalEntry(user1Cookies, entry2.id);
    if (deleteResponse3.status === 403) {
      const result = await deleteResponse3.json();
      console.log(`  ✅ Correctly returned 403: ${result.message}`);
    } else {
      console.log(`  ❌ Expected 403, got: ${deleteResponse3.status}`);
    }
    
    // Cleanup: Delete user 2's entry
    await deleteJournalEntry(user2Cookies, entry2.id);
    
    // Test 4: Try to delete without authentication
    console.log('\nTest 4: Try to delete without authentication');
    const deleteResponse4 = await deleteJournalEntry('', entry1.id);
    if (deleteResponse4.status === 401) {
      console.log(`  ✅ Correctly returned 401 (Unauthorized)`);
    } else {
      console.log(`  ❌ Expected 401, got: ${deleteResponse4.status}`);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
