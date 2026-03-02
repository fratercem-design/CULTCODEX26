import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireEntitlement } from '@/lib/auth/guards';

/**
 * GET /api/vault/[slug]
 * Fetch ContentItem by slug with entitlement gating
 * Returns 403 with paywall message if user lacks required entitlement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Fetch content item by slug
    const contentItem = await prisma.contentItem.findUnique({
      where: { slug },
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
    });
    
    if (!contentItem) {
      return NextResponse.json(
        { error: 'Not found', message: 'Content item not found' },
        { status: 404 }
      );
    }
    
    // Check if content requires entitlement
    if (contentItem.requiredEntitlement) {
      // Verify user is authenticated
      const authResult = await requireAuth(request);
      if (authResult instanceof NextResponse) {
        // User not authenticated - return paywall message
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'This content requires a subscription to access.',
            paywall: true,
            requiredEntitlement: contentItem.requiredEntitlement,
            title: contentItem.title,
            excerpt: contentItem.content.substring(0, 200) + (contentItem.content.length > 200 ? '...' : ''),
          },
          { status: 403 }
        );
      }
      
      // Verify user has required entitlement
      const entitlementResult = await requireEntitlement(
        authResult.userId,
        contentItem.requiredEntitlement
      );
      
      if (entitlementResult instanceof NextResponse) {
        // User lacks required entitlement - return paywall message
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `This content requires ${contentItem.requiredEntitlement} to access. Please upgrade your subscription.`,
            paywall: true,
            requiredEntitlement: contentItem.requiredEntitlement,
            title: contentItem.title,
            excerpt: contentItem.content.substring(0, 200) + (contentItem.content.length > 200 ? '...' : ''),
          },
          { status: 403 }
        );
      }
    }
    
    // User is authorized or content is not gated - return full content
    return NextResponse.json({
      id: contentItem.id,
      title: contentItem.title,
      slug: contentItem.slug,
      content: contentItem.content,
      requiredEntitlement: contentItem.requiredEntitlement,
      tags: contentItem.tags.map((t) => t.tag.name),
      author: contentItem.author,
      createdAt: contentItem.createdAt,
      updatedAt: contentItem.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching content item:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch content item' },
      { status: 500 }
    );
  }
}
