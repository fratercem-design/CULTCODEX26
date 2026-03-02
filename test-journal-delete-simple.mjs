/**
 * Simple test for Journal Entry DELETE endpoint
 * Uses existing admin user
 */

const BASE_URL = 'http://localhost:3000';

// Use existing admin user
const ADMIN = {
  email: 'admin@cultofpsyche.com',
  password: 'AdminPassword123!',
};

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
    const error = await response.text();
    throw new Error(`Create journal entry failed: ${response.status} - ${error}`);
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

async function getJournalEntry(cookies, entryId) {
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'GET',
    headers: {
      'Cookie': cookies,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Get journal entries failed: ${response.status}`);
  }
  
  const entries = await response.json();
  return entries.find(e => e.id === entryId);
}

async function runTests() {
  console.log('🧪 Testing Journal Entry DELETE endpoint\n');
  
  try {
    // Login as admin
    console.log('📝 Logging in as admin...');
    const adminCookies = await login(ADMIN.email, ADMIN.password);
    console.log('✅ Logged in\n');
    
    // Test 1: Create and delete a journal entry
    console.log('Test 1: Create and delete a journal entry');
    const entry = await createJournalEntry(
      adminCookies,
      'Test Entry to Delete',
      'This entry will be deleted in the test'
    );
    console.log(`  Created entry: ${entry.id}`);
    
    const deleteResponse = await deleteJournalEntry(adminCookies, entry.id);
    if (deleteResponse.status === 200) {
      const result = await deleteResponse.json();
      console.log(`  ✅ Delete succeeded: ${result.message}`);
    } else {
      const error = await deleteResponse.text();
      console.log(`  ❌ Delete failed with status ${deleteResponse.status}: ${error}`);
      throw new Error('Delete failed');
    }
    
    // Test 2: Verify entry is deleted (should return 404)
    console.log('\nTest 2: Verify entry is deleted');
    const deleteResponse2 = await deleteJournalEntry(adminCookies, entry.id);
    if (deleteResponse2.status === 404) {
      const result = await deleteResponse2.json();
      console.log(`  ✅ Correctly returned 404: ${result.message}`);
    } else {
      console.log(`  ❌ Expected 404, got: ${deleteResponse2.status}`);
    }
    
    // Test 3: Try to delete without authentication
    console.log('\nTest 3: Try to delete without authentication');
    const entry2 = await createJournalEntry(
      adminCookies,
      'Another Test Entry',
      'This will test unauthenticated access'
    );
    
    const deleteResponse3 = await deleteJournalEntry('', entry2.id);
    if (deleteResponse3.status === 401) {
      console.log(`  ✅ Correctly returned 401 (Unauthorized)`);
    } else {
      console.log(`  ❌ Expected 401, got: ${deleteResponse3.status}`);
    }
    
    // Cleanup
    await deleteJournalEntry(adminCookies, entry2.id);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
