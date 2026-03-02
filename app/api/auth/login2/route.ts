import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Login2 route works!',
      receivedEmail: body.email,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500 }
    );
  }
}
