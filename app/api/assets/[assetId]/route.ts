import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireEntitlement } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/assets/[assetId]
 * Serve asset file with authentication and entitlement checks
 * Requires user to have the entitlement required by the associated ContentItem
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;

    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Fetch ContentAsset by assetId
    const asset = await prisma.contentAsset.findUnique({
      where: { id: assetId },
      include: {
        contentItem: {
          select: {
            id: true,
            title: true,
            requiredEntitlement: true,
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Asset not found' },
        { status: 404 }
      );
    }

    // Check if ContentItem requires entitlement
    if (asset.contentItem.requiredEntitlement) {
      const entitlementCheck = await requireEntitlement(
        authResult.userId,
        asset.contentItem.requiredEntitlement
      );

      if (entitlementCheck instanceof NextResponse) {
        return entitlementCheck;
      }
    }

    // Read file from local filesystem
    const uploadsDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadsDir, asset.storageKey);

    if (!existsSync(filePath)) {
      console.error(`Asset file not found: ${filePath}`);
      return NextResponse.json(
        { error: 'Not Found', message: 'Asset file not found on server' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    // Create response with appropriate headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Disposition': `inline; filename="${asset.filename}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'Content-Length': fileBuffer.length.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error serving asset:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to serve asset' },
      { status: 500 }
    );
  }
}
