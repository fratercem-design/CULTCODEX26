#!/usr/bin/env node

/**
 * Test script for admin user detail endpoint
 * Tests GET /api/admin/users/[id]
 */

const BASE_URL = 'http://localhost:3000';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function loginAsAdmin() {
  log('\n📝 Logging in as admin...', 'cyan');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@cultofpsyche.com',
      password: 'admin123',
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  log('✅ Admin login successful', 'green');
  return cookies;
}

async function createTestUser(adminCookie) {
  log('\n📝 Creating test user...', 'cyan');
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `testuser-${Date.now()}@example.com`,
      password: 'testpass123',
    }),
  });

  if (!response.ok) {
    throw new Error(`User creation failed: ${response.status}`);
  }

  const data = await response.json();
  log(`✅ Test user created: ${data.user.id}`, 'green');
  return data.user.id;
}

async function getUserList(adminCookie) {
  log('\n📝 Fetching user list to get a user ID...', 'cyan');
  const response = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: adminCookie },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user list: ${response.status}`);
  }

  const data = await response.json();
  log(`✅ Found ${data.users.length} users`, 'green');
  return data.users[0].id; // Return first user ID
}

async function testGetUserDetail(adminCookie, userId) {
  log('\n📝 Testing GET /api/admin/users/[id]...', 'cyan');
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
    headers: { Cookie: adminCookie },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user detail: ${response.status}`);
  }

  const data = await response.json();
  log('✅ User detail fetched successfully', 'green');
  log(`   User ID: ${data.user.id}`, 'blue');
  log(`   Email: ${data.user.email}`, 'blue');
  log(`   Entitlements: ${data.user.entitlements.length}`, 'blue');
  log(`   Stats:`, 'blue');
  log(`     - Journal entries: ${data.stats.journalCount}`, 'blue');
  log(`     - Rituals: ${data.stats.ritualCount}`, 'blue');
  log(`     - Vault items created: ${data.stats.vaultCreatedCount}`, 'blue');
  log(`     - Grimoire revisions: ${data.stats.grimoireRevisionCount}`, 'blue');

  // Verify response structure
  if (!data.user || !data.stats) {
    throw new Error('Invalid response structure');
  }

  // Verify passwordHash is not included
  if ('passwordHash' in data.user) {
    throw new Error('❌ SECURITY ISSUE: passwordHash should not be returned!');
  }

  log('✅ Response structure is correct', 'green');
  log('✅ passwordHash is not exposed', 'green');

  return data;
}

async function testGetNonExistentUser(adminCookie) {
  log('\n📝 Testing GET /api/admin/users/[id] with non-existent user...', 'cyan');
  const fakeUserId = 'nonexistent-user-id';
  const response = await fetch(`${BASE_URL}/api/admin/users/${fakeUserId}`, {
    headers: { Cookie: adminCookie },
  });

  if (response.status !== 404) {
    throw new Error(`Expected 404, got ${response.status}`);
  }

  log('✅ Correctly returns 404 for non-existent user', 'green');
}

async function testUnauthorizedAccess(userId) {
  log('\n📝 Testing unauthorized access (no auth)...', 'cyan');
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`);

  if (response.status !== 401) {
    throw new Error(`Expected 401, got ${response.status}`);
  }

  log('✅ Correctly returns 401 for unauthenticated request', 'green');
}

async function testNonAdminAccess(userId) {
  log('\n📝 Testing non-admin access...', 'cyan');
  
  // Create and login as regular user
  const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `regularuser-${Date.now()}@example.com`,
      password: 'testpass123',
    }),
  });

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: (await signupResponse.json()).user.email,
      password: 'testpass123',
    }),
  });

  const userCookie = loginResponse.headers.get('set-cookie');

  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
    headers: { Cookie: userCookie },
  });

  if (response.status !== 403) {
    throw new Error(`Expected 403, got ${response.status}`);
  }

  log('✅ Correctly returns 403 for non-admin user', 'green');
}

async function main() {
  try {
    log('='.repeat(60), 'cyan');
    log('Admin User Detail API Test Suite', 'cyan');
    log('='.repeat(60), 'cyan');

    // Login as admin
    const adminCookie = await loginAsAdmin();

    // Get a user ID from the list
    const userId = await getUserList(adminCookie);

    // Test successful user detail fetch
    await testGetUserDetail(adminCookie, userId);

    // Test 404 for non-existent user
    await testGetNonExistentUser(adminCookie);

    // Test unauthorized access
    await testUnauthorizedAccess(userId);

    // Test non-admin access
    await testNonAdminAccess(userId);

    log('\n' + '='.repeat(60), 'green');
    log('✅ All tests passed!', 'green');
    log('='.repeat(60), 'green');
  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log(`❌ Test failed: ${error.message}`, 'red');
    log('='.repeat(60), 'red');
    process.exit(1);
  }
}

main();
