import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { checkRateLimit, getClientIdentifier, AUTH_RATE_LIMIT } from '@/lib/auth/rate-limit';
import { loginSchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

// Force Node.js runtime - Prisma requires Node.js
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('[LOGIN] Request received');
  
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(identifier, AUTH_RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Validate input
    const validation = await validateRequestBody(request, loginSchema);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationErrors(validation.error),
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    console.log('[LOGIN] Validated input for email:', email);

    // Find user by email with entitlements
    console.log('[LOGIN] Querying database for user');
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        entitlements: {
          select: {
            entitlementType: true,
          },
        },
      },
    });

    console.log('[LOGIN] Database query completed, user found:', !!user);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT session
    const token = await createSession(user.id, user.email);
    
    // Format entitlements as array of strings
    const formattedUser = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      entitlements: user.entitlements.map(e => e.entitlementType),
    };

    // Create response with cookie
    const response = NextResponse.json(
      { message: 'Login successful', user: formattedUser },
      { status: 200 }
    );

    // Set httpOnly cookie directly on response
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
