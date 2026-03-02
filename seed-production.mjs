// Temporary script to seed production database
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_OsarJeUL9pD5@ep-soft-field-akoff4nc-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

import { execSync } from 'child_process';

try {
  console.log('Running seed with production DATABASE_URL...');
  execSync('npx prisma db seed', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('Seed completed successfully!');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}
