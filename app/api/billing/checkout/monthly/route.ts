import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guards';
import { stripe } from '@/lib/services/stripe.service';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // Validate Stripe is configured
    if (!stripe) {
      console.error('Stripe is not configured - STRIPE_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 503 }
      );
    }

    // Validate required environment variables
    if (!env.STRIPE_MONTHLY_PRICE_ID) {
      console.error('STRIPE_MONTHLY_PRICE_ID is not configured');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    // Get the origin for success/cancel URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return NextResponse.json(
      { 
        url: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Monthly checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
