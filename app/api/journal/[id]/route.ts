import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guards';
import { updateJournalEntrySchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * PATCH /api/journal/[id]
 * Update a JournalEntry
 * Requires authentication
 * Verifies entry belongs to authenticated user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    const { id } = await params;
    
    // Check if JournalEntry exists
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id },
    });
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Journal entry not found' },
        { status: 404 }
      );
    }
    
    // Verify entry belongs to authenticated user
    if (existingEntry.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this journal entry' },
        { status: 403 }
      );
    }
    
    // Validate input
    const validation = await validateRequestBody(request, updateJournalEntrySchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, content } = validation.data;
    
    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    
    // Update journal entry
    const journalEntry = await prisma.journalEntry.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(journalEntry);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to update journal entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/journal/[id]
 * Delete a JournalEntry
 * Requires authentication
 * Verifies entry belongs to authenticated user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    const { id } = await params;
    
    // Check if JournalEntry exists
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id },
    });
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Journal entry not found' },
        { status: 404 }
      );
    }
    
    // Verify entry belongs to authenticated user
    if (existingEntry.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this journal entry' },
        { status: 403 }
      );
    }
    
    // Delete journal entry
    await prisma.journalEntry.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { success: true, message: 'Journal entry deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
}
