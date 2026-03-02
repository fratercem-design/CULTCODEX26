import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin as checkAdmin, requireEntitlement as checkEntitlement } from './guards';
import { EntitlementType } from '@prisma/client';

/**
 * Wrapper for API routes that require authentication
 * Usage: export const GET = withAuth(async (request, { userId, email }) => { ... })
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { userId: string; email: string }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 response
    }
    
    return handler(request, authResult);
  };
}

/**
 * Wrapper for API routes that require admin entitlement
 * Usage: export const GET = withAdmin(async (request, { userId, email }) => { ... })
 */
export function withAdmin(
  handler: (
    request: NextRequest,
    context: { userId: string; email: string }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 response
    }
    
    const adminCheck = await checkAdmin(authResult.userId);
    
    if (adminCheck instanceof NextResponse) {
      return adminCheck; // Return 403 response
    }
    
    return handler(request, authResult);
  };
}

/**
 * Wrapper for API routes that require a specific entitlement
 * Usage: export const GET = withEntitlement(EntitlementType.vault_access, async (request, { userId, email }) => { ... })
 */
export function withEntitlement(
  entitlement: EntitlementType,
  handler: (
    request: NextRequest,
    context: { userId: string; email: string }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 response
    }
    
    const entitlementCheck = await checkEntitlement(authResult.userId, entitlement);
    
    if (entitlementCheck instanceof NextResponse) {
      return entitlementCheck; // Return 403 response
    }
    
    return handler(request, authResult);
  };
}
