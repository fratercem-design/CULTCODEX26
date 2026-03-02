import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { EntitlementType } from '@prisma/client';

/**
 * Zod schema for entitlement type validation
 */
const entitlementTypeSchema = z.enum(['vault_access', 'grimoire_access', 'admin']);

/**
 * DELETE /api/admin/users/[id]/entitlements/[entitlementType]
 * Revoke an entitlement from a user
 * Requires admin authentication
 * Returns 404 if user or entitlement not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entitlementType: string }> }
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

    const { id: targetUserId, entitlementType } = await params;

    // Validate entitlement type
    const validation = entitlementTypeSchema.safeParse(entitlementType);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid entitlement type. Must be one of: vault_access, grimoire_access, admin',
        },
        { status: 400 }
      );
    }

    const validatedType = validation.data;

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

    // Check if entitlement exists
    const existingEntitlement = await prisma.entitlement.findUnique({
      where: {
        userId_entitlementType: {
          userId: targetUserId,
          entitlementType: validatedType as EntitlementType,
        },
      },
    });

    if (!existingEntitlement) {
      return NextResponse.json(
        { error: 'Not found', message: 'Entitlement not found' },
        { status: 404 }
      );
    }

    // Delete entitlement and create audit log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete entitlement
      await tx.entitlement.delete({
        where: {
          userId_entitlementType: {
            userId: targetUserId,
            entitlementType: validatedType as EntitlementType,
          },
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'entitlement.revoke',
          resourceType: 'Entitlement',
          resourceId: existingEntitlement.id,
          metadata: {
            targetUserId,
            entitlementType: validatedType,
            revokedAt: new Date().toISOString(),
          },
        },
      });

      // Fetch remaining entitlements
      const remainingEntitlements = await tx.entitlement.findMany({
        where: { userId: targetUserId },
        select: {
          id: true,
          entitlementType: true,
          grantedAt: true,
        },
      });

      return remainingEntitlements;
    });

    return NextResponse.json(
      {
        message: 'Entitlement revoked successfully',
        entitlements: result.map((e) => ({
          type: e.entitlementType,
          grantedAt: e.grantedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error revoking entitlement:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to revoke entitlement',
      },
      { status: 500 }
    );
  }
}
