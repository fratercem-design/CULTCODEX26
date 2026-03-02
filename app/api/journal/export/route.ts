import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guards';

/**
 * GET /api/journal/export
 * Export all JournalEntries for the authenticated user as a markdown file
 * Requires authentication
 * Returns a downloadable markdown file with all entries
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    
    // Fetch all journal entries for the authenticated user
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Generate markdown content
    let markdownContent = '# Journal Export\n\n';
    markdownContent += `Exported on: ${new Date().toLocaleString()}\n\n`;
    markdownContent += `Total entries: ${journalEntries.length}\n\n`;
    markdownContent += '---\n\n';
    
    // Add each journal entry to the markdown
    for (const entry of journalEntries) {
      markdownContent += `## ${entry.title}\n\n`;
      markdownContent += `**Created:** ${entry.createdAt.toLocaleString()}\n`;
      markdownContent += `**Last Updated:** ${entry.updatedAt.toLocaleString()}\n\n`;
      markdownContent += `${entry.content}\n\n`;
      markdownContent += '---\n\n';
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `journal-export-${timestamp}.md`;
    
    // Return markdown file with appropriate headers
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting journal entries:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to export journal entries' },
      { status: 500 }
    );
  }
}
