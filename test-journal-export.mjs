/**
 * Test script for Journal Export endpoint
 * Tests GET /api/journal/export
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
    throw new Error(`Failed to create journal entry: ${JSON.stringify(data)}`);
  }

  return data;
}

async function exportJournal(cookies) {
  console.log('\n📥 Exporting journal entries...');
  const response = await fetch(`${BASE_URL}/api/journal/export`, {
    method: 'GET',
    headers: {
      'Cookie': cookies,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    console.error('❌ Failed to export journal:', data);
    return null;
  }

  // Check headers
  const contentType = response.headers.get('content-type');
  const contentDisposition = response.headers.get('content-disposition');

  console.log('✅ Export successful');
  console.log('   Content-Type:', contentType);
  console.log('   Content-Disposition:', contentDisposition);

  // Get the markdown content
  const markdownContent = await response.text();
  console.log('\n📄 Exported content preview:');
  console.log('   Length:', markdownContent.length, 'characters');
  console.log('   First 200 characters:');
  console.log('   ' + markdownContent.substring(0, 200).replace(/\n/g, '\n   '));

  return { contentType, contentDisposition, markdownContent };
}

async function testAuthentication() {
  console.log('\n🔒 Testing authentication requirement...');
  const response = await fetch(`${BASE_URL}/api/journal/export`, {
    method: 'GET',
  });

  if (response.status === 401) {
    console.log('✅ Authentication requirement works');
  } else {
    console.log('❌ Authentication requirement failed');
  }
}

async function validateMarkdownContent(markdownContent, expectedEntries) {
  console.log('\n🧪 Validating markdown content...');

  // Check for header
  if (markdownContent.includes('# Journal Export')) {
    console.log('✅ Contains export header');
  } else {
    console.log('❌ Missing export header');
  }

  // Check for timestamp
  if (markdownContent.includes('Exported on:')) {
    console.log('✅ Contains export timestamp');
  } else {
    console.log('❌ Missing export timestamp');
  }

  // Check for entry count
  if (markdownContent.includes(`Total entries: ${expectedEntries.length}`)) {
    console.log(`✅ Contains correct entry count (${expectedEntries.length})`);
  } else {
    console.log('❌ Entry count mismatch');
  }

  // Check for each entry
  let foundCount = 0;
  for (const entry of expectedEntries) {
    if (markdownContent.includes(entry.title)) {
      foundCount++;
    }
  }

  if (foundCount === expectedEntries.length) {
    console.log(`✅ All ${expectedEntries.length} entries found in export`);
  } else {
    console.log(`❌ Only ${foundCount}/${expectedEntries.length} entries found`);
  }

  // Check for markdown formatting
  if (markdownContent.includes('**Created:**') && markdownContent.includes('**Last Updated:**')) {
    console.log('✅ Contains proper date formatting');
  } else {
    console.log('❌ Missing date formatting');
  }
}

async function runTests() {
  console.log('🚀 Starting Journal Export Tests\n');
  console.log('=' .repeat(60));

  try {
    // Test authentication requirement
    await testAuthentication();

    // Login
    const cookies = await login();

    // Create some test journal entries
    console.log('\n📝 Creating test journal entries...');
    const entry1 = await createJournalEntry(
      cookies,
      'Test Entry 1',
      'This is the first test entry for export.'
    );
    console.log('   ✅ Created entry 1');

    const entry2 = await createJournalEntry(
      cookies,
      'Test Entry 2',
      '# Markdown Test\n\nThis entry has **bold** and *italic* text.'
    );
    console.log('   ✅ Created entry 2');

    const entry3 = await createJournalEntry(
      cookies,
      'Test Entry 3',
      'Final test entry with some content.'
    );
    console.log('   ✅ Created entry 3');

    const expectedEntries = [entry1, entry2, entry3];

    // Export journal
    const exportResult = await exportJournal(cookies);

    if (exportResult) {
      // Validate the export
      await validateMarkdownContent(exportResult.markdownContent, expectedEntries);

      // Check headers
      console.log('\n🔍 Validating response headers...');
      if (exportResult.contentType && exportResult.contentType.includes('text/markdown')) {
        console.log('✅ Correct Content-Type header');
      } else {
        console.log('❌ Incorrect Content-Type header');
      }

      if (exportResult.contentDisposition && exportResult.contentDisposition.includes('attachment')) {
        console.log('✅ Correct Content-Disposition header (attachment)');
      } else {
        console.log('❌ Incorrect Content-Disposition header');
      }

      if (exportResult.contentDisposition && exportResult.contentDisposition.includes('.md')) {
        console.log('✅ Filename has .md extension');
      } else {
        console.log('❌ Filename missing .md extension');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
