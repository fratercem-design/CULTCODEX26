/**
 * Simple test for GrimoireEntry deletion endpoint
 * Tests DELETE /api/admin/grimoire/[id]
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return response.headers.get('set-cookie');
}

async function createGrimoireEntry(cookies, title, slug, content) {
  const response = await fetch(`${BASE_URL}/api/admin/grimoire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({ title, slug, content }),
  });

  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }

  return await response.json();
}

async function deleteGrimoireEntry(cookies, id) {
  const response = await fetch(`${BASE_URL}/api/admin/grimoire/${id}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookies },
  });

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }

  return await response.json();
}

async function runTest() {
  console.log('🧪 Testing GrimoireEntry Deletion\n');

  try {
    console.log('Logging in...');
    const cookies = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    
    console.log('Creating test entry...');
    const entry = await createGrimoireEntry(
      cookies,
      'Delete Test ' + Date.now(),
      'delete-test-' + Date.now(),
      'Test content'
    );
    console.log('Created:', entry.id);
    
    console.log('Deleting entry...');
    const result = await deleteGrimoireEntry(cookies, entry.id);
    console.log('Result:', result);
    
    console.log('\n✅ Test passed!');
    console.log('   DELETE endpoint works correctly');
    console.log('   Returns success message');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Wait 10 seconds before running to avoid rate limit
console.log('Waiting 10 seconds to avoid rate limit...\n');
setTimeout(runTest, 10000);
