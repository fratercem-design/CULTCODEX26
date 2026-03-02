import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/vault
 * List ContentItems with optional filtering and pagination
 * Supports query parameters: search, tags, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const search = searchParams.get('search') || '';
    const tagsParam = searchParams.get('tags') || '';
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = (validPage - 1) * validLimit;
    
    // Build where clause for filtering
    const where: any = {};
    
    // Search filter (title or content)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Tags filter
    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: tags,
            },
          },
        },
      };
    }
    
    // Fetch content items with pagination
    const [contentItems, totalCount] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          author: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.contentItem.count({ where }),
    ]);
    
    // Transform response to include tag names and excerpt
    const items = contentItems.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.content.substring(0, 200) + (item.content.length > 200 ? '...' : ''),
      requiredEntitlement: item.requiredEntitlement,
      tags: item.tags.map((t) => t.tag.name),
      author: item.author,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
    
    return NextResponse.json({
      items,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validLimit),
      },
    });
  } catch (error) {
    console.error('Error fetching vault content:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch vault content' },
      { status: 500 }
    );
  }
}
