import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireEntitlement } from '@/lib/auth/guards';
import { EntitlementType } from '@prisma/client';

/**
 * GET /api/grimoire/[slug]/revisions/[revisionNumber]
 * Fetch specific GrimoireRevision by revision number
 * Requires grimoire_access entitlement
 * Returns revision content and metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; revisionNumber: string }> }
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
    
    const { slug, revisionNumber } = await params;
    const revisionNum = parseInt(revisionNumber, 10);
    
    if (isNaN(revisionNum)) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Invalid revision number' },
        { status: 400 }
      );
    }
    
    // Fetch grimoire entry by slug
    const grimoireEntry = await prisma.grimoireEntry.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });
    
    if (!grimoireEntry) {
      return NextResponse.json(
        { error: 'Not found', message: 'Grimoire entry not found' },
        { status: 404 }
      );
    }
    
    // Fetch specific revision
    const revision = await prisma.grimoireRevision.findUnique({
      where: {
        grimoireEntryId_revisionNumber: {
          grimoireEntryId: grimoireEntry.id,
          revisionNumber: revisionNum,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    
    if (!revision) {
      return NextResponse.json(
        { error: 'Not found', message: 'Revision not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      entryId: grimoireEntry.id,
      entryTitle: grimoireEntry.title,
      entrySlug: grimoireEntry.slug,
      revision: {
        id: revision.id,
        revisionNumber: revision.revisionNumber,
        content: revision.content,
        author: revision.author,
        createdAt: revision.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching specific revision:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch revision' },
      { status: 500 }
    );
  }
}
