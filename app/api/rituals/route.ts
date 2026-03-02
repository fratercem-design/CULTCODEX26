import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guards';
import { createRitualInstanceSchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * GET /api/rituals
 * List RitualInstances for the authenticated user
 * Requires authentication
 * Returns only rituals owned by the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    
    // Fetch ritual instances filtered by userId
    const ritualInstances = await prisma.ritualInstance.findMany({
      where: {
        userId,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        scheduledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ rituals: ritualInstances });
  } catch (error) {
    console.error('Error fetching ritual instances:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch ritual instances' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rituals
 * Create a new RitualInstance for the authenticated user
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
    const validation = await validateRequestBody(request, createRitualInstanceSchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, description, scheduledAt } = validation.data;
    
    // Create ritual instance with userId from session
    const ritualInstance = await prisma.ritualInstance.create({
      data: {
        userId,
        title,
        description: description || null,
        scheduledAt,
      },
      select: {
        id: true,
        title: true,
        description: true,
        scheduledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(ritualInstance, { status: 201 });
  } catch (error) {
    console.error('Error creating ritual instance:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to create ritual instance' },
      { status: 500 }
    );
  }
}
