import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guards';
import { createJournalEntrySchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * GET /api/journal
 * List JournalEntries for the authenticated user
 * Requires authentication
 * Returns only entries owned by the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    
    // Fetch journal entries filtered by userId
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ entries: journalEntries });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/journal
 * Create a new JournalEntry for the authenticated user
 * Requires authentication
 * The userId is automatically set from the session
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    
    // Validate input
    const validation = await validateRequestBody(request, createJournalEntrySchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, content } = validation.data;
    
    // Create journal entry with userId from session
    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId,
        title,
        content,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(journalEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}
