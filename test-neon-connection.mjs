import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://neondb_owner:npg_imtB3gecq2wS@ep-nameless-smoke-ahyluten-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('Testing Neon connection...');
console.log('Connection string length:', connectionString.length);
console.log('Connection string prefix:', connectionString.substring(0, 30));

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log('✅ Connected successfully!');
  
  const result = await client.query('SELECT NOW()');
  console.log('✅ Query successful:', result.rows[0]);
  
  await client.end();
  console.log('✅ Connection closed');
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
