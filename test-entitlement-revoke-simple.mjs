/**
 * Simple manual test for entitlement revoke endpoint
 * Run this after logging in as admin and having a test user ID
 * 
 * Usage:
 * 1. Get admin session cookie from browser dev tools
 * 2. Get a test user ID from /api/admin/users
 * 3. Update the constants below
 * 4. Run: node test-entitlement-revoke-simple.mjs
 */

const BASE_URL = 'http://localhost:3000';

// UPDATE THESE VALUES:
const ADMIN_SESSION_COOKIE = 'session=YOUR_SESSION_COOKIE_HERE';
const TEST_USER_ID = 'YOUR_TEST_USER_ID_HERE';

async function testRevokeEndpoint() {
  console.log('Testing Entitlement Revoke Endpoint\n');
  
  // Step 1: Grant vault_access
  console.log('Step 1: Granting vault_access...');
  let response = await fetch(`${BASE_URL}/api/admin/users/${TEST_USER_ID}/entitlements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': ADMIN_SESSION_COOKIE,
    },
    body: JSON.stringify({
      type: 'vault_access',
      reason: 'Testing revoke endpoint',
    }),
  });
  
  let data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log();
  
  // Step 2: Revoke vault_access
  console.log('Step 2: Revoking vault_access...');
  response = await fetch(`${BASE_URL}/api/admin/users/${TEST_USER_ID}/entitlements/vault_access`, {
    method: 'DELETE',
    headers: {
      'Cookie': ADMIN_SESSION_COOKIE,
    },
  });
  
  data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log();
  
  // Step 3: Try to revoke again (should get 404)
  console.log('Step 3: Trying to revoke again (should get 404)...');
  response = await fetch(`${BASE_URL}/api/admin/users/${TEST_USER_ID}/entitlements/vault_access`, {
    method: 'DELETE',
    headers: {
      'Cookie': ADMIN_SESSION_COOKIE,
    },
  });
  
  data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log();
  
  // Step 4: Test invalid entitlement type
  console.log('Step 4: Testing invalid entitlement type (should get 400)...');
  response = await fetch(`${BASE_URL}/api/admin/users/${TEST_USER_ID}/entitlements/invalid_type`, {
    method: 'DELETE',
    headers: {
      'Cookie': ADMIN_SESSION_COOKIE,
    },
  });
  
  data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log();
  
  console.log('✓ Test complete!');
}

if (ADMIN_SESSION_COOKIE === 'session=YOUR_SESSION_COOKIE_HERE' || TEST_USER_ID === 'YOUR_TEST_USER_ID_HERE') {
  console.error('ERROR: Please update ADMIN_SESSION_COOKIE and TEST_USER_ID in the script first!');
  console.error('\nTo get these values:');
  console.error('1. Login as admin in your browser');
  console.error('2. Open browser dev tools > Application > Cookies');
  console.error('3. Copy the "session" cookie value');
  console.error('4. Visit /api/admin/users to get a test user ID');
  process.exit(1);
}

testRevokeEndpoint().catch(console.error);
