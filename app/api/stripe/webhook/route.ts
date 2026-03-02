import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/services/stripe.service';
import { env } from '@/lib/env';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, getClientIdentifier } from '@/lib/auth/rate-limit';
import Stripe from 'stripe';

// Rate limit config for webhooks - more permissive than auth endpoints
const WEBHOOK_RATE_LIMIT = {
  maxRequests: 100, // 100 requests
  windowMs: 60 * 1000, // per minute
};

/**
 * Stripe webhook endpoint
 * Processes payment events from Stripe with signature verification and idempotency
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(identifier, WEBHOOK_RATE_LIMIT);

    if (!rateLimitResult.success) {
      console.warn('Webhook rate limit exceeded:', identifier);
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Validate Stripe is configured
    if (!stripe) {
      console.error('Stripe is not configured - STRIPE_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 503 }
      );
    }

    // Validate webhook secret is configured
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check idempotency - has this event been processed already?
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent?.processed) {
      console.log('Event already processed:', event.id);
      return NextResponse.json({ received: true, processed: true }, { status: 200 });
    }

    // Create or update StripeEvent record with processed=false
    if (!existingEvent) {
      await prisma.stripeEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
          processed: false,
        },
      });
    }

    // Process the event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Grants entitlements to user after successful payment
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  // Extract user ID from session metadata
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata:', session.id);
    return;
  }

  // Determine entitlement type from price ID
  const lineItems = session.line_items?.data || [];
  if (lineItems.length === 0) {
    // Need to retrieve line items if not included
    if (!stripe) return;
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });
    lineItems.push(...(fullSession.line_items?.data || []));
  }

  const priceId = lineItems[0]?.price?.id;
  if (!priceId) {
    console.error('No price ID found in session:', session.id);
    return;
  }

  // Map price ID to entitlement type
  let entitlementType: 'vault_access' | 'grimoire_access';
  if (priceId === env.STRIPE_MONTHLY_PRICE_ID || priceId === env.STRIPE_LIFETIME_PRICE_ID) {
    // For MVP, grant both vault and grimoire access
    // In production, you might have separate price IDs for each
    entitlementType = 'vault_access';
  } else {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Use database transaction to grant entitlement and mark event processed
  await prisma.$transaction(async (tx) => {
    // Grant vault_access entitlement
    await tx.entitlement.upsert({
      where: {
        userId_entitlementType: {
          userId,
          entitlementType: 'vault_access',
        },
      },
      create: {
        userId,
        entitlementType: 'vault_access',
      },
      update: {}, // Already exists, no update needed
    });

    // Grant grimoire_access entitlement
    await tx.entitlement.upsert({
      where: {
        userId_entitlementType: {
          userId,
          entitlementType: 'grimoire_access',
        },
      },
      create: {
        userId,
        entitlementType: 'grimoire_access',
      },
      update: {}, // Already exists, no update needed
    });

    // Mark event as processed
    await tx.stripeEvent.update({
      where: { eventId: event.id },
      data: { processed: true },
    });
  });

  console.log('Entitlements granted for user:', userId);
}

/**
 * Handle customer.subscription.deleted event
 * Revokes entitlements when subscription is canceled
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Extract user ID from subscription metadata
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata:', subscription.id);
    return;
  }

  // Use database transaction to revoke entitlements and mark event processed
  await prisma.$transaction(async (tx) => {
    // Delete vault_access entitlement
    await tx.entitlement.deleteMany({
      where: {
        userId,
        entitlementType: 'vault_access',
      },
    });

    // Delete grimoire_access entitlement
    await tx.entitlement.deleteMany({
      where: {
        userId,
        entitlementType: 'grimoire_access',
      },
    });

    // Mark event as processed
    await tx.stripeEvent.update({
      where: { eventId: event.id },
      data: { processed: true },
    });
  });

  console.log('Entitlements revoked for user:', userId);
}
