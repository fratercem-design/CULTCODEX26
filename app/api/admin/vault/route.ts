import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { createContentItemSchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * POST /api/admin/vault
 * Create a new ContentItem
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
    const validation = await validateRequestBody(request, createContentItemSchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, slug, content, requiredEntitlement, tags } = validation.data;

    // Check if slug already exists
    const existingItem = await prisma.contentItem.findUnique({
      where: { slug },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Conflict', message: 'A content item with this slug already exists' },
        { status: 409 }
      );
    }

    // Use transaction to create ContentItem, tags, and audit log
    const result = await prisma.$transaction(async (tx) => {
      // Create or find tags
      const tagRecords = await Promise.all(
        tags.map(async (tagName: string) => {
          // Find existing tag or create new one
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          return tag;
        })
      );

      // Create ContentItem
      const contentItem = await tx.contentItem.create({
        data: {
          title,
          slug,
          content,
          requiredEntitlement: requiredEntitlement || null,
          authorId: authResult.userId,
          tags: {
            create: tagRecords.map((tag) => ({
              tagId: tag.id,
            })),
          },
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'create',
          resourceType: 'ContentItem',
          resourceId: contentItem.id,
          metadata: {
            title: contentItem.title,
            slug: contentItem.slug,
            requiredEntitlement: contentItem.requiredEntitlement,
            tags: tagRecords.map((tag) => tag.name),
          },
        },
      });

      return contentItem;
    });

    // Format response
    return NextResponse.json(
      {
        id: result.id,
        title: result.title,
        slug: result.slug,
        content: result.content,
        requiredEntitlement: result.requiredEntitlement,
        authorId: result.authorId,
        tags: result.tags.map((ct) => ({
          id: ct.tag.id,
          name: ct.tag.name,
        })),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating content item:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to create content item' },
      { status: 500 }
    );
  }
}
