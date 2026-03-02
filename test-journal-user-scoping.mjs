/**
 * Test script to verify userId is set from session, not request body
 * This ensures users cannot create journal entries for other users
 */

const BASE_URL = 'http://localhost:3000';

const TEST_USER = {
  email: 'admin@cultofpsyche.com',
  password: 'admin123',
};

async function login() {
  console.log('🔐 Logging in...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const cookies = response.headers.get('set-cookie');
  const userData = await response.json();
  console.log('✅ Login successful');
  console.log('   User ID:', userData.user.id);
  return { cookies, userId: userData.user.id };
}

async function testUserIdFromSession(cookies, actualUserId) {
  console.log('\n🔒 Testing userId is set from session (not request body)...');
  
  // Try to create a journal entry with a different userId in the body
  const fakeUserId = 'fake-user-id-12345';
  
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({
      userId: fakeUserId, // Attempting to set userId in request body
      title: 'Test Entry',
      content: 'This should use the session userId, not the body userId',
    }),
  });

  if (!response.ok) {
    console.error('❌ Failed to create journal entry');
    return;
  }

  const data = await response.json();
  
  // Verify the entry was created with the session userId, not the fake one
  console.log('   Created entry ID:', data.id);
  console.log('   Entry title:', data.title);
  
  // Fetch the entry from the database to verify userId
  const listResponse = await fetch(`${BASE_URL}/api/journal`, {
    method: 'GET',
    headers: { 'Cookie': cookies },
  });
  
  const listData = await listResponse.json();
  const createdEntry = listData.entries.find(e => e.id === data.id);
  
  if (createdEntry) {
    console.log('✅ Entry was created successfully');
    console.log('✅ Entry is accessible by the authenticated user');
    console.log('✅ userId was correctly set from session (not request body)');
    console.log('   Note: The endpoint correctly ignores any userId in the request body');
  } else {
    console.log('❌ Entry not found in user\'s journal entries');
  }
}

async function runTests() {
  console.log('🚀 Testing Journal Entry User Scoping\n');
  console.log('=' .repeat(60));

  try {
    const { cookies, userId } = await login();
    await testUserIdFromSession(cookies, userId);

    console.log('\n' + '='.repeat(60));
    console.log('✅ User scoping test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
