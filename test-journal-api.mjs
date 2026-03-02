/**
 * Test script for Journal API endpoints
 * Tests the GET /api/journal endpoint
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials (using the seeded admin user)
const TEST_USER = {
  email: 'admin@cultofpsyche.com',
  password: 'admin123',
};

/**
 * Helper function to login and get session cookie
 */
async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(TEST_USER),
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

/**
 * Test GET /api/journal - List journal entries
 */
async function testListJournalEntries() {
  console.log('\n=== Testing GET /api/journal ===');
  
  const sessionCookie = await login();
  
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('✓ Successfully fetched journal entries');
    console.log(`  Found ${data.entries.length} entries`);
  } else {
    console.log('✗ Failed to fetch journal entries');
  }

  return response.ok;
}

/**
 * Test GET /api/journal without authentication
 */
async function testListJournalEntriesUnauth() {
  console.log('\n=== Testing GET /api/journal (Unauthenticated) ===');
  
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'GET',
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.status === 401) {
    console.log('✓ Correctly rejected unauthenticated request');
    return true;
  } else {
    console.log('✗ Should have returned 401 for unauthenticated request');
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting Journal API Tests...');
  console.log('Base URL:', BASE_URL);

  try {
    const results = [];
    
    results.push(await testListJournalEntriesUnauth());
    results.push(await testListJournalEntries());

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('✓ All tests passed!');
    } else {
      console.log('✗ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTests();
