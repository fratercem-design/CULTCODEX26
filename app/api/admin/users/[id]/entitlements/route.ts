import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { EntitlementType } from '@prisma/client';
import { grantEntitlementSchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * POST /api/admin/users/[id]/entitlements
 * Grant an entitlement to a user
 * Requires admin authentication
 * Idempotent: if entitlement already exists, returns 200 with unchanged state
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Verify admin entitlement
    const adminCheck = await requireAdmin(authResult.userId);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id: targetUserId } = await params;

    // Validate input
    const validation = await validateRequestBody(request, grantEntitlementSchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { entitlementType } = validation.data;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if entitlement already exists (idempotency)
    const existingEntitlement = await prisma.entitlement.findUnique({
      where: {
        userId_entitlementType: {
          userId: targetUserId,
          entitlementType: entitlementType as EntitlementType,
        },
      },
    });

    // If entitlement already exists, return 200 with unchanged state
    if (existingEntitlement) {
      // Fetch all current entitlements
      const entitlements = await prisma.entitlement.findMany({
        where: { userId: targetUserId },
        select: {
          id: true,
          entitlementType: true,
          grantedAt: true,
        },
      });

      return NextResponse.json(
        {
          message: 'Entitlement already exists',
          entitlements: entitlements.map((e) => ({
            type: e.entitlementType,
            grantedAt: e.grantedAt,
          })),
        },
        { status: 200 }
      );
    }

    // Create entitlement and audit log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create entitlement
      const newEntitlement = await tx.entitlement.create({
        data: {
          userId: targetUserId,
          entitlementType: entitlementType as EntitlementType,
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'entitlement.grant',
          resourceType: 'Entitlement',
          resourceId: newEntitlement.id,
          metadata: {
            targetUserId,
            entitlementType: entitlementType,
            grantedAt: new Date().toISOString(),
          },
        },
      });

      // Fetch all current entitlements
      const entitlements = await tx.entitlement.findMany({
        where: { userId: targetUserId },
        select: {
          id: true,
          entitlementType: true,
          grantedAt: true,
        },
      });

      return entitlements;
    });

    return NextResponse.json(
      {
        message: 'Entitlement granted successfully',
        entitlements: result.map((e) => ({
          type: e.entitlementType,
          grantedAt: e.grantedAt,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error granting entitlement:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to grant entitlement',
      },
      { status: 500 }
    );
  }
}
