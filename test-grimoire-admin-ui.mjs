/**
 * Test script for Admin Grimoire Management UI
 * 
 * This script tests the admin Grimoire management functionality:
 * 1. Create a new grimoire entry via admin API
 * 2. Update the entry (creates a new revision)
 * 3. Verify revision count
 * 4. Delete the entry
 * 
 * Requirements tested: 7.1, 7.2, 7.3, 7.6
 */

const BASE_URL = 'http://localhost:3000';

// Admin credentials (from seed data)
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

let sessionCookie = '';

async function login() {
  console.log('🔐 Logging in as admin...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} ${error}`);
  }

  // Extract session cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  console.log('✅ Logged in successfully\n');
}

async function createGrimoireEntry() {
  console.log('📝 Creating grimoire entry...');
  
  const response = await fetch(`${BASE_URL}/api/admin/grimoire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
    },
    body: JSON.stringify({
      title: 'Test Admin UI Entry',
      slug: 'test-admin-ui-entry',
      content: '# Test Entry\n\nThis is a test entry created via admin API.',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ Created entry:', data.id);
  console.log('   Title:', data.title);
  console.log('   Slug:', data.slug);
  console.log('   Revision:', data.currentRevision.revisionNumber);
  console.log('');
  
  return data.id;
}

async function updateGrimoireEntry(entryId) {
  console.log('✏️  Updating grimoire entry (creating revision 2)...');
  
  const response = await fetch(`${BASE_URL}/api/admin/grimoire/${entryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
    },
    body: JSON.stringify({
      title: 'Test Admin UI Entry (Updated)',
      content: '# Test Entry (Updated)\n\nThis entry has been updated.',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ Updated entry');
  console.log('   New title:', data.title);
  console.log('   Revision:', data.currentRevision.revisionNumber);
  console.log('');
}

async function verifyRevisionCount(slug) {
  console.log('🔍 Verifying revision count...');
  
  const response = await fetch(`${BASE_URL}/api/grimoire/${slug}/revisions`, {
    headers: {
      'Cookie': sessionCookie,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fetch revisions failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ Revision count:', data.revisions.length);
  console.log('   Revisions:', data.revisions.map(r => `#${r.revisionNumber}`).join(', '));
  console.log('');
  
  return data.revisions.length;
}

async function deleteGrimoireEntry(entryId) {
  console.log('🗑️  Deleting grimoire entry...');
  
  const response = await fetch(`${BASE_URL}/api/admin/grimoire/${entryId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': sessionCookie,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ Deleted entry:', data.message);
  console.log('');
}

async function runTests() {
  try {
    console.log('🧪 Testing Admin Grimoire Management UI\n');
    console.log('=' .repeat(50));
    console.log('');

    // Login
    await login();

    // Create entry
    const entryId = await createGrimoireEntry();

    // Update entry (creates revision 2)
    await updateGrimoireEntry(entryId);

    // Verify revision count
    const revisionCount = await verifyRevisionCount('test-admin-ui-entry');
    
    if (revisionCount !== 2) {
      throw new Error(`Expected 2 revisions, got ${revisionCount}`);
    }

    // Delete entry
    await deleteGrimoireEntry(entryId);

    console.log('=' .repeat(50));
    console.log('✅ All tests passed!');
    console.log('');
    console.log('Admin Grimoire Management UI features verified:');
    console.log('  ✓ Create new grimoire entry');
    console.log('  ✓ Update entry (creates new revision)');
    console.log('  ✓ Revision count tracking');
    console.log('  ✓ Delete entry');
    console.log('');
    console.log('Requirements validated: 7.1, 7.2, 7.3, 7.6');

  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
