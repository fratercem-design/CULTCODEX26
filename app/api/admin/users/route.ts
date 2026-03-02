import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/users
 * List all users with their entitlements
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
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

    // Query all users with their entitlements
    const users = await prisma.user.findMany({
      include: {
        entitlements: {
          select: {
            id: true,
            entitlementType: true,
            grantedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response - exclude password hashes
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      entitlements: user.entitlements,
    }));

    return NextResponse.json(
      {
        users: formattedUsers,
        total: formattedUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
