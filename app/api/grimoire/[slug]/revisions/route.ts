import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireEntitlement } from '@/lib/auth/guards';
import { EntitlementType } from '@prisma/client';

/**
 * GET /api/grimoire/[slug]/revisions
 * Fetch all GrimoireRevision records for an entry
 * Requires grimoire_access entitlement
 * Returns list of revisions with metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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
    
    const { slug } = await params;
    
    // Fetch grimoire entry by slug
    const grimoireEntry = await prisma.grimoireEntry.findUnique({
      where: { slug },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!grimoireEntry) {
      return NextResponse.json(
        { error: 'Not found', message: 'Grimoire entry not found' },
        { status: 404 }
      );
    }
    
    // Transform revisions to include only metadata
    const revisions = grimoireEntry.revisions.map((revision) => ({
      id: revision.id,
      revisionNumber: revision.revisionNumber,
      author: revision.author,
      createdAt: revision.createdAt,
    }));
    
    return NextResponse.json({
      entryId: grimoireEntry.id,
      entryTitle: grimoireEntry.title,
      entrySlug: grimoireEntry.slug,
      revisions,
    });
  } catch (error) {
    console.error('Error fetching revision history:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch revision history' },
      { status: 500 }
    );
  }
}
