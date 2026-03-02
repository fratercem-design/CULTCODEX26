import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/validation';

/**
 * POST /api/admin/vault/assets
 * Upload asset file for a ContentItem
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const contentItemId = formData.get('contentItemId') as string | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'File is required' },
        { status: 400 }
      );
    }

    if (!contentItemId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'contentItemId is required' },
        { status: 400 }
      );
    }

    // Verify ContentItem exists
    const contentItem = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: 'Not Found', message: 'ContentItem not found' },
        { status: 404 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Bad Request', message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: `File type ${file.type} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    
    // Create storage directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to local filesystem
    const filePath = join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create ContentAsset record
    const asset = await prisma.contentAsset.create({
      data: {
        contentItemId,
        filename: originalName,
        mimeType: file.type,
        storageKey: filename, // For local storage, this is the filename
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        adminId: authResult.userId,
        actionType: 'upload_asset',
        resourceType: 'ContentAsset',
        resourceId: asset.id,
        metadata: {
          contentItemId,
          filename: originalName,
          mimeType: file.type,
          size: file.size,
        },
      },
    });

    return NextResponse.json({
      id: asset.id,
      contentItemId: asset.contentItemId,
      filename: asset.filename,
      mimeType: asset.mimeType,
      createdAt: asset.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}
