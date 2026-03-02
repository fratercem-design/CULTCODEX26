import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { updateGrimoireEntrySchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * PATCH /api/admin/grimoire/[id]
 * Update a GrimoireEntry by creating a new revision
 * Requires admin authentication
 * 
 * This endpoint does NOT modify the existing GrimoireEntry content directly.
 * Instead, it creates a new GrimoireRevision with an incremented revisionNumber
 * and updates the entry's currentRevisionId to point to the new revision.
 * This preserves the full revision history.
 */
export async function PATCH(
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

    // Validate input
    const validation = await validateRequestBody(request, updateGrimoireEntrySchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, content } = validation.data;

    // Check if entry exists and get current revision
    const existingEntry = await prisma.grimoireEntry.findUnique({
      where: { id },
      include: {
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Grimoire entry not found' },
        { status: 404 }
      );
    }

    // Get the latest revision number
    const latestRevision = existingEntry.revisions[0];
    if (!latestRevision) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Entry has no revisions' },
        { status: 500 }
      );
    }

    const newRevisionNumber = latestRevision.revisionNumber + 1;

    // Use transaction to create new revision, update entry, and create audit log
    const result = await prisma.$transaction(async (tx) => {
      // Create new GrimoireRevision with incremented revisionNumber
      const newRevision = await tx.grimoireRevision.create({
        data: {
          grimoireEntryId: id,
          content: content !== undefined ? content : latestRevision.content,
          revisionNumber: newRevisionNumber,
          authorId: authResult.userId,
        },
      });

      // Update GrimoireEntry with new currentRevisionId and optionally title
      const updateData: any = {
        currentRevisionId: newRevision.id,
      };

      if (title !== undefined) {
        updateData.title = title;
      }

      const updatedEntry = await tx.grimoireEntry.update({
        where: { id },
        data: updateData,
        include: {
          revisions: {
            where: { id: newRevision.id },
          },
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'update',
          resourceType: 'GrimoireEntry',
          resourceId: updatedEntry.id,
          metadata: {
            title: updatedEntry.title,
            slug: updatedEntry.slug,
            revisionNumber: newRevisionNumber,
            previousRevisionNumber: latestRevision.revisionNumber,
          },
        },
      });

      return {
        entry: updatedEntry,
        revision: newRevision,
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
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating grimoire entry:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update grimoire entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/grimoire/[id]
 * Delete a GrimoireEntry
 * Requires admin authentication
 * 
 * This endpoint performs a hard delete of the GrimoireEntry.
 * Related GrimoireRevisions and GrimoireEntryTags are automatically deleted
 * via cascade constraints defined in the database schema.
 */
export async function DELETE(
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

    // Check if entry exists
    const existingEntry = await prisma.grimoireEntry.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Grimoire entry not found' },
        { status: 404 }
      );
    }

    // Use transaction to delete entry and create audit log
    await prisma.$transaction(async (tx) => {
      // Create audit log entry before deletion
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'delete',
          resourceType: 'GrimoireEntry',
          resourceId: existingEntry.id,
          metadata: {
            title: existingEntry.title,
            slug: existingEntry.slug,
          },
        },
      });

      // Delete GrimoireEntry (cascade will handle revisions and tags)
      await tx.grimoireEntry.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Grimoire entry deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting grimoire entry:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete grimoire entry' },
      { status: 500 }
    );
  }
}
