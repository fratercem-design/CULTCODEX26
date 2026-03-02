import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  return NextResponse.json({
    hasDatabaseUrl: !!dbUrl,
    length: dbUrl?.length || 0,
    startsWithPostgresql: dbUrl?.startsWith('postgresql://'),
    containsNeon: dbUrl?.includes('neon'),
    containsPooler: dbUrl?.includes('pooler'),
    containsSslmode: dbUrl?.includes('sslmode'),
    // Show first 30 chars for debugging (safe, doesn't expose credentials)
    prefix: dbUrl?.substring(0, 30),
    // Show last 20 chars
    suffix: dbUrl?.substring(dbUrl.length - 20),
  });
}
