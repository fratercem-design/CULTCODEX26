import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guards';

/**
 * GET /api/rituals/export
 * Export all RitualInstances for the authenticated user as an ICS (iCalendar) file
 * Requires authentication
 * Returns a downloadable ICS file compatible with standard calendar applications
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    
    // Fetch all ritual instances for the authenticated user
    const ritualInstances = await prisma.ritualInstance.findMany({
      where: {
        userId,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        scheduledAt: true,
        createdAt: true,
      },
    });
    
    // Generate ICS file content
    const icsContent = generateICS(ritualInstances);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `rituals-export-${timestamp}.ics`;
    
    // Return ICS file with appropriate headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting ritual instances:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to export ritual instances' },
      { status: 500 }
    );
  }
}

/**
 * Generate ICS (iCalendar) format content from ritual instances
 * @param rituals Array of ritual instances
 * @returns ICS formatted string
 */
function generateICS(rituals: Array<{
  id: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  createdAt: Date;
}>): string {
  const now = new Date();
  const timestamp = formatICSDateTime(now);
  
  // ICS file header
  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//Cult of Psyche//Ritual Calendar//EN\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';
  ics += 'X-WR-CALNAME:Ritual Calendar\r\n';
  ics += 'X-WR-TIMEZONE:UTC\r\n';
  
  // Add each ritual as a VEVENT
  for (const ritual of rituals) {
    ics += 'BEGIN:VEVENT\r\n';
    ics += `UID:ritual-${ritual.id}@cultofpsyche.com\r\n`;
    ics += `DTSTAMP:${timestamp}\r\n`;
    ics += `DTSTART:${formatICSDateTime(ritual.scheduledAt)}\r\n`;
    ics += `CREATED:${formatICSDateTime(ritual.createdAt)}\r\n`;
    ics += `SUMMARY:${escapeICSText(ritual.title)}\r\n`;
    
    if (ritual.description) {
      ics += `DESCRIPTION:${escapeICSText(ritual.description)}\r\n`;
    }
    
    ics += 'STATUS:CONFIRMED\r\n';
    ics += 'TRANSP:OPAQUE\r\n';
    ics += 'END:VEVENT\r\n';
  }
  
  // ICS file footer
  ics += 'END:VCALENDAR\r\n';
  
  return ics;
}

/**
 * Format a Date object to ICS datetime format (YYYYMMDDTHHMMSSZ)
 * @param date Date to format
 * @returns ICS formatted datetime string in UTC
 */
function formatICSDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters in ICS text fields
 * @param text Text to escape
 * @returns Escaped text safe for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/;/g, '\\;')    // Escape semicolons
    .replace(/,/g, '\\,')    // Escape commas
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '');     // Remove carriage returns
}
