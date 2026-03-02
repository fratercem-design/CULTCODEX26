import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guards';
import { updateRitualInstanceSchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

/**
 * PATCH /api/rituals/[id]
 * Update a RitualInstance
 * Requires authentication
 * Verifies ritual belongs to authenticated user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    const { id } = await params;
    
    // Check if RitualInstance exists
    const existingRitual = await prisma.ritualInstance.findUnique({
      where: { id },
    });
    
    if (!existingRitual) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Ritual instance not found' },
        { status: 404 }
      );
    }
    
    // Verify ritual belongs to authenticated user
    if (existingRitual.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this ritual instance' },
        { status: 403 }
      );
    }
    
    // Validate input
    const validation = await validateRequestBody(request, updateRitualInstanceSchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { title, description, scheduledAt } = validation.data;
    
    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt;
    
    // Update ritual instance
    const ritualInstance = await prisma.ritualInstance.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        scheduledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(ritualInstance);
  } catch (error) {
    console.error('Error updating ritual instance:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to update ritual instance' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rituals/[id]
 * Delete a RitualInstance
 * Requires authentication
 * Verifies ritual belongs to authenticated user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { userId } = authResult;
    const { id } = await params;
    
    // Check if RitualInstance exists
    const existingRitual = await prisma.ritualInstance.findUnique({
      where: { id },
    });
    
    if (!existingRitual) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Ritual instance not found' },
        { status: 404 }
      );
    }
    
    // Verify ritual belongs to authenticated user
    if (existingRitual.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete this ritual instance' },
        { status: 403 }
      );
    }
    
    // Delete ritual instance
    await prisma.ritualInstance.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { success: true, message: 'Ritual instance deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting ritual instance:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to delete ritual instance' },
      { status: 500 }
    );
  }
}
