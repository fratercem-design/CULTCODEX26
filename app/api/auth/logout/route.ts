import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth/session';

export async function POST() {
  try {
    // Clear session cookie
    await deleteSession();

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
