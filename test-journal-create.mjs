/**
 * Test script for Journal Entry creation endpoint
 * Tests POST /api/journal
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials (using the seeded admin user)
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
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  console.log('✅ Login successful');
  return cookies;
}

async function createJournalEntry(cookies, title, content) {
  console.log(`\n📝 Creating journal entry: "${title}"...`);
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({ title, content }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed to create journal entry:', data);
    return null;
  }

  console.log('✅ Journal entry created successfully');
  console.log('   ID:', data.id);
  console.log('   Title:', data.title);
  console.log('   Content preview:', data.content.substring(0, 50) + '...');
  console.log('   Created at:', data.createdAt);
  return data;
}

async function listJournalEntries(cookies) {
  console.log('\n📋 Fetching journal entries...');
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'GET',
    headers: {
      'Cookie': cookies,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Failed to fetch journal entries:', data);
    return null;
  }

  console.log(`✅ Found ${data.entries.length} journal entries`);
  data.entries.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.title} (${entry.id})`);
  });
  return data.entries;
}

async function testValidation(cookies) {
  console.log('\n🧪 Testing validation...');

  // Test missing title
  console.log('   Testing missing title...');
  let response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({ content: 'Test content' }),
  });
  if (response.status === 400) {
    console.log('   ✅ Missing title validation works');
  } else {
    console.log('   ❌ Missing title validation failed');
  }

  // Test missing content
  console.log('   Testing missing content...');
  response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({ title: 'Test title' }),
  });
  if (response.status === 400) {
    console.log('   ✅ Missing content validation works');
  } else {
    console.log('   ❌ Missing content validation failed');
  }

  // Test empty strings
  console.log('   Testing empty strings...');
  response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({ title: '   ', content: '   ' }),
  });
  if (response.status === 400) {
    console.log('   ✅ Empty string validation works');
  } else {
    console.log('   ❌ Empty string validation failed');
  }
}

async function testAuthentication() {
  console.log('\n🔒 Testing authentication requirement...');
  const response = await fetch(`${BASE_URL}/api/journal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Test', content: 'Test' }),
  });

  if (response.status === 401) {
    console.log('✅ Authentication requirement works');
  } else {
    console.log('❌ Authentication requirement failed');
  }
}

async function runTests() {
  console.log('🚀 Starting Journal Entry Creation Tests\n');
  console.log('=' .repeat(60));

  try {
    // Test authentication requirement
    await testAuthentication();

    // Login
    const cookies = await login();

    // Test validation
    await testValidation(cookies);

    // Create test journal entries
    await createJournalEntry(
      cookies,
      'My First Journal Entry',
      'This is a test journal entry. I am writing about my thoughts and experiences.'
    );

    await createJournalEntry(
      cookies,
      'Reflections on the Day',
      '# Daily Reflection\n\nToday was productive. I accomplished:\n- Task 1\n- Task 2\n- Task 3'
    );

    await createJournalEntry(
      cookies,
      'Dreams and Aspirations',
      'I dream of building something meaningful. This journal helps me track my progress.'
    );

    // List all entries
    await listJournalEntries(cookies);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
