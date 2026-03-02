import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { updateContentItemSchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * PATCH /api/admin/vault/[id]
 * Update an existing ContentItem
 * Requires admin authentication
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

    // Check if ContentItem exists
    const existingItem = await prisma.contentItem.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Content item not found' },
        { status: 404 }
      );
    }

    // Validate input
    const validation = await validateRequestBody(request, updateContentItemSchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, slug, content, requiredEntitlement, tags } = validation.data;

    // Check if slug is already used by another item
    if (slug && slug !== existingItem.slug) {
      const slugConflict = await prisma.contentItem.findUnique({
        where: { slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'Conflict', message: 'A content item with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Use transaction to update ContentItem, tags, and audit log
    const result = await prisma.$transaction(async (tx) => {
      // Update ContentItem
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (content !== undefined) updateData.content = content;
      if (requiredEntitlement !== undefined) {
        updateData.requiredEntitlement = requiredEntitlement || null;
      }

      const contentItem = await tx.contentItem.update({
        where: { id },
        data: updateData,
      });

      // Update tags if provided
      let updatedTags = existingItem.tags;
      if (tags !== undefined) {
        // Delete existing tag associations
        await tx.contentItemTag.deleteMany({
          where: { contentItemId: id },
        });

        // Create or find new tags
        const tagRecords = await Promise.all(
          tags.map(async (tagName: string) => {
            const tag = await tx.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            });
            return tag;
          })
        );

        // Create new tag associations
        if (tagRecords.length > 0) {
          await tx.contentItemTag.createMany({
            data: tagRecords.map((tag) => ({
              contentItemId: id,
              tagId: tag.id,
            })),
          });
        }

        updatedTags = tagRecords.map((tag) => ({
          tag,
          contentItemId: id,
          tagId: tag.id,
        }));
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'update',
          resourceType: 'ContentItem',
          resourceId: contentItem.id,
          metadata: {
            updatedFields: Object.keys(updateData),
            title: contentItem.title,
            slug: contentItem.slug,
            requiredEntitlement: contentItem.requiredEntitlement,
            tags: tags !== undefined ? tags : existingItem.tags.map((ct) => ct.tag.name),
          },
        },
      });

      return { contentItem, tags: updatedTags };
    });

    // Format response
    return NextResponse.json({
      id: result.contentItem.id,
      title: result.contentItem.title,
      slug: result.contentItem.slug,
      content: result.contentItem.content,
      requiredEntitlement: result.contentItem.requiredEntitlement,
      authorId: result.contentItem.authorId,
      tags: result.tags.map((ct) => ({
        id: ct.tag.id,
        name: ct.tag.name,
      })),
      createdAt: result.contentItem.createdAt,
      updatedAt: result.contentItem.updatedAt,
    });
  } catch (error) {
    console.error('Error updating content item:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to update content item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/vault/[id]
 * Delete a ContentItem
 * Requires admin authentication
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

    // Check if ContentItem exists
    const existingItem = await prisma.contentItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Content item not found' },
        { status: 404 }
      );
    }

    // Use transaction to delete ContentItem and create audit log
    await prisma.$transaction(async (tx) => {
      // Delete ContentItem (cascade will handle tags and assets)
      await tx.contentItem.delete({
        where: { id },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          adminId: authResult.userId,
          actionType: 'delete',
          resourceType: 'ContentItem',
          resourceId: id,
          metadata: {
            title: existingItem.title,
            slug: existingItem.slug,
          },
        },
      });
    });

    return NextResponse.json(
      { message: 'Content item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting content item:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to delete content item' },
      { status: 500 }
    );
  }
}
