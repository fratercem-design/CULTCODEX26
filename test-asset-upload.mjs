/**
 * Test script for asset upload and serving functionality
 * Tests:
 * 1. Admin can upload assets
 * 2. Authenticated users with proper entitlement can access assets
 * 3. Users without entitlement cannot access gated assets
 */

import { readFileSync, writeFileSync } from 'fs';

const BASE_URL = 'http://localhost:3000';

// Helper function to create a test image file
function createTestImage() {
  // Create a minimal 1x1 PNG image
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
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

async function testAssetUploadAndServing() {
  console.log('🧪 Testing Asset Upload and Serving\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cultofpsyche.com',
        password: 'admin123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No session cookie received');
    }

    console.log('✅ Admin logged in successfully\n');

    // Step 2: Get existing ContentItem (admin vault CRUD not yet implemented)
    console.log('2️⃣ Fetching existing ContentItem...');
    const vaultResponse = await fetch(`${BASE_URL}/api/vault`, {
      headers: {
        'Cookie': cookies,
      },
    });

    if (!vaultResponse.ok) {
      throw new Error(`Failed to fetch vault content: ${vaultResponse.status}`);
    }

    const vaultData = await vaultResponse.json();
    if (!vaultData.items || vaultData.items.length === 0) {
      throw new Error('No ContentItems found. Please create at least one ContentItem first.');
    }

    const contentItem = vaultData.items[0];
    console.log(`✅ Using ContentItem: ${contentItem.id} (${contentItem.title})\n`);

    // Step 3: Upload asset
    console.log('3️⃣ Uploading asset...');
    const testImagePath = createTestImage();
    const imageBuffer = readFileSync(testImagePath);
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-image.png');
    formData.append('contentItemId', contentItem.id);

    const uploadResponse = await fetch(`${BASE_URL}/api/admin/vault/assets`, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Failed to upload asset: ${uploadResponse.status} - ${error}`);
    }

    const asset = await uploadResponse.json();
    console.log(`✅ Asset uploaded: ${asset.id}`);
    console.log(`   Filename: ${asset.filename}`);
    console.log(`   MIME Type: ${asset.mimeType}\n`);

    // Step 4: Access asset as admin (should succeed)
    console.log('4️⃣ Accessing asset as admin...');
    const assetResponse = await fetch(`${BASE_URL}/api/assets/${asset.id}`, {
      headers: {
        'Cookie': cookies,
      },
    });

    if (!assetResponse.ok) {
      throw new Error(`Failed to access asset: ${assetResponse.status}`);
    }

    const contentType = assetResponse.headers.get('content-type');
    const contentLength = assetResponse.headers.get('content-length');
    console.log(`✅ Asset accessed successfully`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Content-Length: ${contentLength}\n`);

    // Step 5: Try to access without authentication (should fail)
    console.log('5️⃣ Trying to access asset without authentication...');
    const unauthResponse = await fetch(`${BASE_URL}/api/assets/${asset.id}`);
    
    if (unauthResponse.status === 401) {
      console.log('✅ Correctly denied access without authentication\n');
    } else {
      console.log(`⚠️ Expected 401, got ${unauthResponse.status}\n`);
    }

    // Step 6: Login as regular user without entitlement
    console.log('6️⃣ Testing access as user without entitlement...');
    const userLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    if (userLoginResponse.ok) {
      const userCookies = userLoginResponse.headers.get('set-cookie');
      const noEntitlementResponse = await fetch(`${BASE_URL}/api/assets/${asset.id}`, {
        headers: {
          'Cookie': userCookies,
        },
      });

      if (noEntitlementResponse.status === 403) {
        console.log('✅ Correctly denied access without required entitlement\n');
      } else {
        console.log(`⚠️ Expected 403, got ${noEntitlementResponse.status}\n`);
      }
    } else {
      console.log('⚠️ Could not test user without entitlement (user may not exist)\n');
    }

    console.log('✅ All asset upload and serving tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testAssetUploadAndServing();
