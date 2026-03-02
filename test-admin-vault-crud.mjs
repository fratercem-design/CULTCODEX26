/**
 * Test script for Admin Vault CRUD operations
 * Tests Task 8: Implement Vault admin CRUD with audit logging
 * 
 * Prerequisites:
 * - Server running on http://localhost:3000
 * - Admin user exists with credentials from seed
 * - Database is initialized
 */

const BASE_URL = 'http://localhost:3000';

// Admin credentials from seed
const ADMIN_EMAIL = 'admin@cultofpsyche.com';
const ADMIN_PASSWORD = 'admin123';

let authCookie = '';
let createdItemId = '';

async function login() {
  console.log('\n🔐 Logging in as admin...');
  
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
    const error = await response.json();
    throw new Error(`Login failed: ${error.message}`);
  }

  // Extract session cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    authCookie = setCookie.split(';')[0];
  }

  const data = await response.json();
  console.log('✅ Login successful:', data.user.email);
  return data;
}

async function createContentItem() {
  console.log('\n📝 Creating new content item...');
  
  const payload = {
    title: 'Test Content Item',
    slug: 'test-content-item',
    content: '# Test Content\n\nThis is a test content item created via API.',
    requiredEntitlement: 'vault_access',
    tags: ['test', 'api', 'automation'],
  };

  const response = await fetch(`${BASE_URL}/api/admin/vault`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Create failed: ${error.message}`);
  }

  const data = await response.json();
  createdItemId = data.id;
  console.log('✅ Content item created:', {
    id: data.id,
    title: data.title,
    slug: data.slug,
    requiredEntitlement: data.requiredEntitlement,
    tags: data.tags.map(t => t.name),
  });
  return data;
}

async function updateContentItem() {
  console.log('\n✏️ Updating content item...');
  
  const payload = {
    title: 'Updated Test Content Item',
    content: '# Updated Content\n\nThis content has been updated via API.',
    tags: ['test', 'updated'],
  };

  const response = await fetch(`${BASE_URL}/api/admin/vault/${createdItemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Update failed: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Content item updated:', {
    id: data.id,
    title: data.title,
    slug: data.slug,
    tags: data.tags.map(t => t.name),
  });
  return data;
}

async function verifyAuditLogs() {
  console.log('\n📋 Verifying audit logs...');
  
  // Note: This requires the audit log API endpoint from Task 13
  // For now, we'll just note that audit logs should be created
  console.log('ℹ️ Audit logs should be created for:');
  console.log('  - create action on ContentItem');
  console.log('  - update action on ContentItem');
  console.log('  - delete action on ContentItem (after deletion)');
  console.log('  (Audit log viewing will be implemented in Task 13)');
}

async function deleteContentItem() {
  console.log('\n🗑️ Deleting content item...');
  
  const response = await fetch(`${BASE_URL}/api/admin/vault/${createdItemId}`, {
    method: 'DELETE',
    headers: {
      'Cookie': authCookie,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Delete failed: ${error.message}`);
  }

  const data = await response.json();
  console.log('✅ Content item deleted:', data.message);
  return data;
}

async function verifyDeletion() {
  console.log('\n🔍 Verifying deletion...');
  
  const response = await fetch(`${BASE_URL}/api/vault/test-content-item`, {
    headers: {
      'Cookie': authCookie,
    },
  });

  if (response.status === 404) {
    console.log('✅ Content item successfully deleted (404 returned)');
  } else {
    throw new Error('Content item still exists after deletion');
  }
}

async function testValidation() {
  console.log('\n🧪 Testing validation...');
  
  // Test invalid slug format
  console.log('  Testing invalid slug format...');
  const invalidSlugResponse = await fetch(`${BASE_URL}/api/admin/vault`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
    },
    body: JSON.stringify({
      title: 'Test',
      slug: 'Invalid Slug!',
      content: 'Test content',
    }),
  });

  if (invalidSlugResponse.status === 400) {
    console.log('  ✅ Invalid slug rejected');
  } else {
    throw new Error('Invalid slug was not rejected');
  }

  // Test missing required fields
  console.log('  Testing missing required fields...');
  const missingFieldsResponse = await fetch(`${BASE_URL}/api/admin/vault`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
    },
    body: JSON.stringify({
      title: 'Test',
    }),
  });

  if (missingFieldsResponse.status === 400) {
    console.log('  ✅ Missing fields rejected');
  } else {
    throw new Error('Missing fields were not rejected');
  }

  console.log('✅ Validation tests passed');
}

async function runTests() {
  try {
    console.log('🚀 Starting Admin Vault CRUD Tests');
    console.log('=====================================');

    await login();
    await createContentItem();
    await updateContentItem();
    await verifyAuditLogs();
    await deleteContentItem();
    await verifyDeletion();
    await testValidation();

    console.log('\n=====================================');
    console.log('✅ All tests passed successfully!');
    console.log('=====================================\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

runTests();
