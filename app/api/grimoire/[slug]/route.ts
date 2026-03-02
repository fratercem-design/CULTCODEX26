import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireEntitlement } from '@/lib/auth/guards';
import { EntitlementType } from '@prisma/client';

/**
 * GET /api/grimoire/[slug]
 * Fetch GrimoireEntry by slug with current revision content
 * Requires grimoire_access entitlement
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
          take: 1, // Get only the current (latest) revision
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
    
    if (!grimoireEntry.revisions[0]) {
      return NextResponse.json(
        { error: 'Not found', message: 'No revision found for this entry' },
        { status: 404 }
      );
    }
    
    const currentRevision = grimoireEntry.revisions[0];
    
    return NextResponse.json({
      id: grimoireEntry.id,
      title: grimoireEntry.title,
      slug: grimoireEntry.slug,
      currentRevision: {
        id: currentRevision.id,
        revisionNumber: currentRevision.revisionNumber,
        content: currentRevision.content,
        author: currentRevision.author,
        createdAt: currentRevision.createdAt,
      },
      createdAt: grimoireEntry.createdAt,
      updatedAt: grimoireEntry.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching grimoire entry:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch grimoire entry' },
      { status: 500 }
    );
  }
}
