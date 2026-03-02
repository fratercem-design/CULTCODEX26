import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/users/[id]
 * Fetch detailed information about a single user
 * Requires admin authentication
 */
export async function GET(
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

    const { id } = await params;

    // Fetch user with entitlements
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        entitlements: {
          select: {
            id: true,
            entitlementType: true,
            grantedAt: true,
          },
        },
      },
    });

    // Return 404 if user not found
    if (!user) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch usage statistics
    const [journalCount, ritualCount, vaultCreatedCount, grimoireRevisionCount] =
      await Promise.all([
        prisma.journalEntry.count({ where: { userId: id } }),
        prisma.ritualInstance.count({ where: { userId: id } }),
        prisma.contentItem.count({ where: { authorId: id } }),
        prisma.grimoireRevision.count({ where: { authorId: id } }),
      ]);

    // Create audit log entry for admin.user.view
    await prisma.auditLog.create({
      data: {
        adminId: authResult.userId,
        actionType: 'admin.user.view',
        resourceType: 'User',
        resourceId: id,
        metadata: {
          viewedAt: new Date().toISOString(),
        },
      },
    });

    // Format response - never return passwordHash
    const response = {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        entitlements: user.entitlements.map((e) => ({
          type: e.entitlementType,
          grantedAt: e.grantedAt,
        })),
      },
      stats: {
        journalCount,
        ritualCount,
        vaultCreatedCount,
        grimoireRevisionCount,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
