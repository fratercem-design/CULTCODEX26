import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/api-guards';

/**
 * Test endpoint to verify admin guard is working
 * This endpoint is protected and requires admin entitlement
 */
export const GET = withAdmin(async (request: NextRequest, { userId, email }) => {
  return NextResponse.json({
    message: 'Admin access granted',
    user: {
      userId,
      email,
    },
  });
});
