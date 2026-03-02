/**
 * Detailed test for Journal Export endpoint
 * Shows the full exported markdown content
 */

const BASE_URL = 'http://localhost:3000';

const TEST_USER = {
  email: 'admin@cultofpsyche.com',
  password: 'admin123',
};

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return response.headers.get('set-cookie');
}

async function exportJournal(cookies) {
  const response = await fetch(`${BASE_URL}/api/journal/export`, {
    method: 'GET',
    headers: { 'Cookie': cookies },
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  return await response.text();
}

async function run() {
  console.log('📥 Exporting journal...\n');
  
  const cookies = await login();
  const markdown = await exportJournal(cookies);
  
  console.log('=' .repeat(80));
  console.log('EXPORTED MARKDOWN CONTENT:');
  console.log('=' .repeat(80));
  console.log(markdown);
  console.log('=' .repeat(80));
  console.log(`\nTotal length: ${markdown.length} characters`);
}

run().catch(console.error);
