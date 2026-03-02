import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';
import { prisma } from '@/lib/db/prisma';
import { EntitlementType } from '@prisma/client';

/**
 * Extended request type with user context
 */
export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

/**
 * Authentication guard that verifies JWT session
 * Extracts user ID from session and attaches to request context
 * Returns 401 Unauthorized if session is invalid
 * 
 * @param request - Next.js request object
 * @returns Object with session data if valid, or NextResponse with 401 if invalid
 */
export async function requireAuth(request: NextRequest): Promise<
  | { userId: string; email: string }
  | NextResponse
> {
  const session = await getSession();

  if (!session || !session.userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid authentication required' },
      { status: 401 }
    );
  }

  return {
    userId: session.userId,
    email: session.email,
  };
}

/**
 * Entitlement verification guard that checks user entitlements
 * Queries Entitlement table for user's entitlements
 * Returns 403 Forbidden if required entitlement is missing
 * 
 * @param userId - User ID to check entitlements for
 * @param requiredEntitlement - The entitlement type required
 * @returns true if user has entitlement, or NextResponse with 403 if missing
 */
export async function requireEntitlement(
  userId: string,
  requiredEntitlement: EntitlementType
): Promise<true | NextResponse> {
  const entitlement = await prisma.entitlement.findUnique({
    where: {
      userId_entitlementType: {
        userId,
        entitlementType: requiredEntitlement,
      },
    },
  });

  if (!entitlement) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Access denied. Required entitlement: ${requiredEntitlement}`,
      },
      { status: 403 }
    );
  }

  return true;
}

/**
 * Admin guard that verifies user has admin entitlement
 * Uses requireEntitlement with admin type
 * Returns 403 Forbidden if user lacks admin entitlement
 * 
 * @param userId - User ID to check admin status for
 * @returns true if user is admin, or NextResponse with 403 if not
 */
export async function requireAdmin(userId: string): Promise<true | NextResponse> {
  return requireEntitlement(userId, EntitlementType.admin);
}
