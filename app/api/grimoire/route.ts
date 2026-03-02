import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireEntitlement } from '@/lib/auth/guards';
import { EntitlementType } from '@prisma/client';

/**
 * GET /api/grimoire
 * List GrimoireEntries with optional search filtering
 * Requires grimoire_access entitlement
 * Supports query parameter: search
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Verify user has grimoire_access entitlement
    const entitlementResult = await requireEntitlement(
      authResult.userId,
      EntitlementType.grimoire_access
    );
    
    if (entitlementResult instanceof NextResponse) {
      return entitlementResult;
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Build where clause for filtering
    const where: any = {};
    
    // Search filter (title or content in current revision)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        {
          revisions: {
            some: {
              content: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }
    
    // Fetch grimoire entries
    const grimoireEntries = await prisma.grimoireEntry.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 1, // Get only the current (latest) revision
        },
      },
    });
    
    // Transform response to include current revision content
    const entries = grimoireEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      currentRevision: entry.revisions[0] ? {
        revisionNumber: entry.revisions[0].revisionNumber,
        content: entry.revisions[0].content.substring(0, 200) + 
                 (entry.revisions[0].content.length > 200 ? '...' : ''),
        createdAt: entry.revisions[0].createdAt,
      } : null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
    
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching grimoire entries:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch grimoire entries' },
      { status: 500 }
    );
  }
}
