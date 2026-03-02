import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/audit
 * Retrieve audit log entries with pagination and filtering
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    // Optional filters
    const actionType = searchParams.get('actionType');
    const resourceType = searchParams.get('resourceType');
    const adminId = searchParams.get('adminId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const where: any = {};

    if (actionType) {
      where.actionType = actionType;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Query audit logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format response with admin email
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminEmail: log.admin.email,
      actionType: log.actionType,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
