import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
}

/**
 * Get the JWT secret key as a Uint8Array
 */
function getSecretKey(): Uint8Array {
  const secret = env.JWT_SECRET || 'default-secret-key-change-in-production';
  return new TextEncoder().encode(secret);
}

/**
 * Create a new JWT session for a user
 * @param userId - User ID to include in the session
 * @param email - User email to include in the session
 * @returns JWT token string
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + SESSION_DURATION))
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode a JWT session token
 * @param token - JWT token to verify
 * @returns Session payload if valid, null if invalid
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Set the session cookie with httpOnly and secure flags
 * @param token - JWT token to store in cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

/**
 * Get the session from the cookie
 * @returns Session payload if valid, null if invalid or not present
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Delete the session cookie
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
