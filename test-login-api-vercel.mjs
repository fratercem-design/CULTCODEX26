#!/usr/bin/env node

/**
 * Test script to verify login API works on Vercel
 * Tests the backend directly without the frontend
 */

const VERCEL_URL = 'https://cultcodex-2666.vercel.app';

async function testLoginAPI() {
  console.log('Testing Login API on Vercel...\n');

  try {
    console.log('Sending POST request to /api/auth/login');
    console.log('Email: admin@cultofpsyche.com');
    console.log('Password: admin123\n');

    const response = await fetch(`${VERCEL_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@cultofpsyche.com',
        password: 'admin123',
      }),
    });

    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const data = await response.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ LOGIN API WORKS!');
      console.log('User:', data.user.email);
      console.log('Entitlements:', data.user.entitlements);
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ REQUEST FAILED');
    console.error('Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testLoginAPI();
