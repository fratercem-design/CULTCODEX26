import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { createGrimoireEntrySchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * POST /api/admin/grimoire
 * Create a new GrimoireEntry with initial revision
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
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

    // Validate input
    const validation = await validateRequestBody(request, createGrimoireEntrySchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, slug, content } = validation.data;

    // Check if slug already exists
    const existingEntry = await prisma.grimoireEntry.findUnique({
      where: { slug },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Conflict', message: 'A grimoire entry with this slug already exists' },
        { status: 409 }
      );
    }

    // Use transaction to create GrimoireEntry, initial revision, and audit log
    const result = await prisma.$transaction(async (tx) => {
      // Create GrimoireEntry without currentRevisionId first
      const grimoireEntry = await tx.grimoireEntry.create({
        data: {
          title,
          slug,
        },
      });

      // Create initial GrimoireRevision
      const initialRevision = await tx.grimoireRevision.create({
        data: {
          grimoireEntryId: grimoireEntry.id,
          content,
          revisionNumber: 1,
          authorId: authResult.userId,
        },
      });

      // Update GrimoireEntry with currentRevisionId
      const updatedEntry = await tx.grimoireEntry.update({
        where: { id: grimoireEntry.id },
        data: {
          currentRevisionId: initialRevision.id,
        },
        include: {
          revisions: true,
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'create',
          resourceType: 'GrimoireEntry',
          resourceId: updatedEntry.id,
          metadata: {
            title: updatedEntry.title,
            slug: updatedEntry.slug,
            revisionNumber: 1,
          },
        },
      });

      return {
        entry: updatedEntry,
        revision: initialRevision,
      };
    });

    // Format response
    return NextResponse.json(
      {
        id: result.entry.id,
        title: result.entry.title,
        slug: result.entry.slug,
        currentRevisionId: result.entry.currentRevisionId,
        currentRevision: {
          id: result.revision.id,
          content: result.revision.content,
          revisionNumber: result.revision.revisionNumber,
          authorId: result.revision.authorId,
          createdAt: result.revision.createdAt,
        },
        createdAt: result.entry.createdAt,
        updatedAt: result.entry.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating grimoire entry:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to create grimoire entry' },
      { status: 500 }
    );
  }
}
