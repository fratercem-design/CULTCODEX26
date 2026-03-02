import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  });
}
