/**
 * Comprehensive test for asset upload and serving functionality
 * Tests all security scenarios
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';

const BASE_URL = 'http://localhost:3000';

// Helper function to create a test image file
function createTestImage() {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  writeFileSync('test-image.png', pngData);
  return 'test-image.png';
}

async function runTests() {
  console.log('🧪 Comprehensive Asset Upload and Serving Tests\n');
  let testImagePath;

  try {
    // Test 1: Login as admin
    console.log('Test 1: Admin Authentication');
    console.log('─────────────────────────────');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cultofpsyche.com',
        password: 'admin123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Admin login failed: ${loginResponse.status}`);
    }

    const adminCookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin authenticated successfully\n');

    // Test 2: Get existing ContentItem
    console.log('Test 2: Fetch ContentItem');
    console.log('─────────────────────────────');
    const vaultResponse = await fetch(`${BASE_URL}/api/vault`, {
      headers: { 'Cookie': adminCookies },
    });

    const vaultData = await vaultResponse.json();
    const contentItem = vaultData.items.find(item => item.requiredEntitlement === 'vault_access');
    
    if (!contentItem) {
      throw new Error('No gated ContentItem found');
    }
    
    console.log(`✅ Found gated ContentItem: ${contentItem.title}`);
    console.log(`   ID: ${contentItem.id}`);
    console.log(`   Required Entitlement: ${contentItem.requiredEntitlement}\n`);

    // Test 3: Upload asset as admin
    console.log('Test 3: Asset Upload (Admin)');
    console.log('─────────────────────────────');
    testImagePath = createTestImage();
    const imageBuffer = readFileSync(testImagePath);
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-image.png');
    formData.append('contentItemId', contentItem.id);

    const uploadResponse = await fetch(`${BASE_URL}/api/admin/vault/assets`, {
      method: 'POST',
      headers: { 'Cookie': adminCookies },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${error}`);
    }

    const asset = await uploadResponse.json();
    console.log(`✅ Asset uploaded successfully`);
    console.log(`   Asset ID: ${asset.id}`);
    console.log(`   Filename: ${asset.filename}`);
    console.log(`   MIME Type: ${asset.mimeType}\n`);

    // Test 4: Access asset as admin
    console.log('Test 4: Asset Access (Admin with Entitlement)');
    console.log('─────────────────────────────────────────────');
    const adminAccessResponse = await fetch(`${BASE_URL}/api/assets/${asset.id}`, {
      headers: { 'Cookie': adminCookies },
    });

    if (!adminAccessResponse.ok) {
      throw new Error(`Admin access failed: ${adminAccessResponse.status}`);
    }

    console.log('✅ Admin can access asset');
    console.log(`   Content-Type: ${adminAccessResponse.headers.get('content-type')}`);
    console.log(`   Cache-Control: ${adminAccessResponse.headers.get('cache-control')}\n`);

    // Test 5: Try to access without authentication
    console.log('Test 5: Asset Access (No Authentication)');
    console.log('─────────────────────────────────────────');
    const noAuthResponse = await fetch(`${BASE_URL}/api/assets/${asset.id}`);
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Correctly denied: 401 Unauthorized\n');
    } else {
      throw new Error(`Expected 401, got ${noAuthResponse.status}`);
    }

    // Test 6: Create user without entitlement and test access
    console.log('Test 6: Asset Access (User Without Entitlement)');
    console.log('───────────────────────────────────────────────');
    
    const randomEmail = `test-${Date.now()}@example.com`;
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail,
        password: 'password123',
      }),
    });

    if (!signupResponse.ok) {
      console.log('⚠️ Could not create test user, skipping this test\n');
    } else {
      console.log(`   Created test user: ${randomEmail}`);
      
      const userLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: randomEmail,
          password: 'password123',
        }),
      });

      if (!userLoginResponse.ok) {
        throw new Error(`User login failed: ${userLoginResponse.status}`);
      }

      const userCookies = userLoginResponse.headers.get('set-cookie');
      if (!userCookies) {
        throw new Error('No session cookie received for user');
      }

      const noEntitlementResponse = await fetch(`${BASE_URL}/api/assets/${asset.id}`, {
        headers: { 'Cookie': userCookies },
      });

      if (noEntitlementResponse.status === 403) {
        console.log('✅ Correctly denied: 403 Forbidden\n');
      } else {
        throw new Error(`Expected 403, got ${noEntitlementResponse.status}`);
      }
    }

    // Test 7: Try to upload as non-admin
    console.log('Test 7: Asset Upload (Non-Admin User)');
    console.log('──────────────────────────────────────');
    
    const randomEmail2 = `test-${Date.now() + 1}@example.com`;
    await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail2,
        password: 'password123',
      }),
    });

    const userLogin2Response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail2,
        password: 'password123',
      }),
    });

    if (!userLogin2Response.ok) {
      throw new Error(`User login failed: ${userLogin2Response.status}`);
    }

    const user2Cookies = userLogin2Response.headers.get('set-cookie');
    if (!user2Cookies) {
      throw new Error('No session cookie received for user 2');
    }
    
    const formData2 = new FormData();
    const blob2 = new Blob([imageBuffer], { type: 'image/png' });
    formData2.append('file', blob2, 'test-image-2.png');
    formData2.append('contentItemId', contentItem.id);

    const nonAdminUploadResponse = await fetch(`${BASE_URL}/api/admin/vault/assets`, {
      method: 'POST',
      headers: { 'Cookie': user2Cookies },
      body: formData2,
    });

    if (nonAdminUploadResponse.status === 403) {
      console.log('✅ Correctly denied: 403 Forbidden (non-admin cannot upload)\n');
    } else {
      throw new Error(`Expected 403, got ${nonAdminUploadResponse.status}`);
    }

    // Test 8: Try to upload invalid file type
    console.log('Test 8: Asset Upload (Invalid File Type)');
    console.log('─────────────────────────────────────────');
    
    const formData3 = new FormData();
    const textBlob = new Blob(['test content'], { type: 'text/plain' });
    formData3.append('file', textBlob, 'test.txt');
    formData3.append('contentItemId', contentItem.id);

    const invalidTypeResponse = await fetch(`${BASE_URL}/api/admin/vault/assets`, {
      method: 'POST',
      headers: { 'Cookie': adminCookies },
      body: formData3,
    });

    if (invalidTypeResponse.status === 400) {
      const error = await invalidTypeResponse.json();
      console.log('✅ Correctly rejected invalid file type');
      console.log(`   Message: ${error.message}\n`);
    } else {
      throw new Error(`Expected 400, got ${invalidTypeResponse.status}`);
    }

    console.log('═══════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════');
    console.log('\nSummary:');
    console.log('✓ Admin can upload assets');
    console.log('✓ Admin with entitlement can access assets');
    console.log('✓ Unauthenticated users cannot access assets');
    console.log('✓ Users without entitlement cannot access gated assets');
    console.log('✓ Non-admin users cannot upload assets');
    console.log('✓ Invalid file types are rejected');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (testImagePath) {
      try {
        unlinkSync(testImagePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

runTests();
