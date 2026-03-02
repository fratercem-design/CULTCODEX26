import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, getClientIdentifier, AUTH_RATE_LIMIT } from '@/lib/auth/rate-limit';
import { loginSchema, validateRequestBody, formatValidationErrors } from '@/lib/validation';

export async function POST(request: NextRequest) {
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
    
    // Set httpOnly cookie
    await setSessionCookie(token);

    // Return user data (excluding password hash)
    const { passwordHash, ...userData } = user;

    return NextResponse.json(
      { message: 'Login successful', user: userData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
