/**
 * Test script for GET /api/admin/users endpoint
 * Tests user list retrieval with entitlements
 */

const BASE_URL = 'http://localhost:3000';

// Test admin credentials (from seed data)
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

/**
 * Login and get session cookie
 */
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login failed: ${error.message}`);
  }

  // Extract session cookie
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No session cookie received');
  }

  return setCookie;
}

/**
 * Test GET /api/admin/users
 */
async function testGetUserList(sessionCookie) {
  console.log('\n=== Testing GET /api/admin/users ===');

  const response = await fetch(`${BASE_URL}/api/admin/users`, {
    method: 'GET',
    headers: {
      Cookie: sessionCookie,
    },
  });

  console.log('Status:', response.status);

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('✓ Successfully retrieved user list');
    console.log(`✓ Total users: ${data.total}`);
    
    // Verify structure
    if (data.users && Array.isArray(data.users)) {
      console.log('✓ Users array present');
      
      if (data.users.length > 0) {
        const firstUser = data.users[0];
        console.log('\nFirst user structure:');
        console.log('- Has id:', !!firstUser.id);
        console.log('- Has email:', !!firstUser.email);
        console.log('- Has createdAt:', !!firstUser.createdAt);
        console.log('- Has updatedAt:', !!firstUser.updatedAt);
        console.log('- Has entitlements:', !!firstUser.entitlements);
        console.log('- No passwordHash:', !firstUser.passwordHash);
        
        if (firstUser.entitlements && Array.isArray(firstUser.entitlements)) {
          console.log(`- Entitlements count: ${firstUser.entitlements.length}`);
          firstUser.entitlements.forEach((ent, idx) => {
            console.log(`  ${idx + 1}. ${ent.entitlementType} (granted: ${ent.grantedAt})`);
          });
        }
      }
    } else {
      console.log('✗ Users array missing or invalid');
    }
  } else {
    console.log('✗ Failed to retrieve user list');
  }

  return response.ok;
}

/**
 * Test without authentication
 */
async function testWithoutAuth() {
  console.log('\n=== Testing GET /api/admin/users without auth ===');

  const response = await fetch(`${BASE_URL}/api/admin/users`, {
    method: 'GET',
  });

  console.log('Status:', response.status);

  if (response.status === 401) {
    console.log('✓ Correctly rejected unauthenticated request');
    return true;
  } else {
    console.log('✗ Should have returned 401 for unauthenticated request');
    return false;
  }
}

/**
 * Test with non-admin user
 */
async function testWithNonAdmin() {
  console.log('\n=== Testing GET /api/admin/users with non-admin user ===');

  // First, create a non-admin user
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpass123';

  try {
    // Signup
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!signupResponse.ok) {
      console.log('✗ Failed to create test user');
      return false;
    }

    // Login as non-admin user
    const sessionCookie = await login(testEmail, testPassword);

    // Try to access admin endpoint
    const response = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        Cookie: sessionCookie,
      },
    });

    console.log('Status:', response.status);

    if (response.status === 403) {
      console.log('✓ Correctly rejected non-admin user');
      return true;
    } else {
      console.log('✗ Should have returned 403 for non-admin user');
      return false;
    }
  } catch (error) {
    console.error('Error in non-admin test:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('Starting admin users list endpoint tests...');
  console.log('Make sure the dev server is running on http://localhost:3000\n');

  try {
    // Test 1: Without authentication
    const test1 = await testWithoutAuth();

    // Test 2: With non-admin user
    const test2 = await testWithNonAdmin();

    // Test 3: Login as admin
    console.log('\n=== Logging in as admin ===');
    const adminCookie = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Admin login successful');

    // Test 4: Get user list as admin
    const test3 = await testGetUserList(adminCookie);

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Test 1 (No auth): ${test1 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Test 2 (Non-admin): ${test2 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Test 3 (Admin list): ${test3 ? '✓ PASS' : '✗ FAIL'}`);

    const allPassed = test1 && test2 && test3;
    console.log(`\nOverall: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    process.exit(1);
  }
}

runTests();
