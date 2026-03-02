# Stripe Webhook Setup Guide

This guide explains how to set up and test the Stripe webhook endpoint for the Cult of Psyche Vault + Grimoire platform.

## Overview

The webhook endpoint (`/api/stripe/webhook`) processes payment events from Stripe to automatically grant and revoke user entitlements based on subscription status.

## Features Implemented

✅ **Signature Verification**: All webhook events are verified using Stripe's signature to ensure authenticity
✅ **Idempotency**: Each event is processed exactly once, even if Stripe sends duplicates
✅ **Transaction Safety**: Database operations use transactions to ensure consistency
✅ **Rate Limiting**: Protects against abuse (100 requests per minute)
✅ **Event Processing**:
  - `checkout.session.completed`: Grants entitlements after successful payment
  - `customer.subscription.deleted`: Revokes entitlements when subscription is canceled

## Environment Variables

Add the following to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Local Development Setup

### Option 1: Using Stripe CLI (Recommended)

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop install stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Start your Next.js server**
   ```bash
   npm run dev
   ```

4. **Forward webhooks to your local server**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   This will output a webhook signing secret like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

5. **Copy the webhook secret to your .env file**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Trigger test events**
   ```bash
   # Test successful checkout
   stripe trigger checkout.session.completed

   # Test subscription cancellation
   stripe trigger customer.subscription.deleted
   ```

### Option 2: Manual Testing

Run the test script to verify basic webhook functionality:

```bash
node test-stripe-webhook.mjs
```

This tests:
- Endpoint existence
- Signature verification
- Rate limiting
- Error handling

## Production Setup

1. **Create a webhook endpoint in Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Enter your production URL: `https://yourdomain.com/api/stripe/webhook`
   - Select events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.deleted`

2. **Copy the webhook signing secret**
   - After creating the endpoint, Stripe will show you the signing secret
   - Add it to your production environment variables

3. **Deploy your application**
   - Ensure `STRIPE_WEBHOOK_SECRET` is set in your production environment
   - Stripe will start sending real events to your endpoint

## How It Works

### Checkout Flow

1. User clicks "Subscribe" or "Buy Lifetime Access"
2. Frontend calls `/api/billing/checkout/monthly` or `/api/billing/checkout/lifetime`
3. User is redirected to Stripe Checkout
4. User completes payment
5. Stripe sends `checkout.session.completed` webhook
6. Webhook handler:
   - Verifies signature
   - Checks idempotency (prevents duplicate processing)
   - Extracts user ID from session metadata
   - Grants `vault_access` and `grimoire_access` entitlements
   - Marks event as processed

### Subscription Cancellation Flow

1. User cancels subscription in Stripe Customer Portal or admin cancels in Stripe Dashboard
2. Stripe sends `customer.subscription.deleted` webhook
3. Webhook handler:
   - Verifies signature
   - Checks idempotency
   - Extracts user ID from subscription metadata
   - Revokes `vault_access` and `grimoire_access` entitlements
   - Marks event as processed

## Database Schema

### StripeEvent Table

Tracks processed webhook events for idempotency:

```prisma
model StripeEvent {
  id        String   @id @default(cuid())
  eventId   String   @unique  // Stripe event ID
  eventType String            // Event type (e.g., "checkout.session.completed")
  processed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Entitlement Table

Stores user entitlements:

```prisma
model Entitlement {
  id              String          @id @default(cuid())
  userId          String
  entitlementType EntitlementType // vault_access, grimoire_access, admin
  grantedAt       DateTime        @default(now())
}
```

## Security Features

1. **Signature Verification**: Every webhook request is verified using Stripe's signature to prevent spoofing
2. **Rate Limiting**: 100 requests per minute to prevent abuse
3. **Idempotency**: Events are processed exactly once using database-backed tracking
4. **Transaction Safety**: All database operations use transactions to ensure consistency

## Monitoring

Check your application logs for webhook processing:

```bash
# Successful processing
Entitlements granted for user: user_xxxxx

# Duplicate event (already processed)
Event already processed: evt_xxxxx

# Errors
Webhook signature verification failed: ...
No userId in session metadata: ...
```

## Troubleshooting

### Webhook signature verification fails

- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set in `.env`
- Make sure you're using the webhook secret from the correct Stripe account (test vs. live)
- Verify the secret starts with `whsec_`

### Events not being processed

- Check that your server is publicly accessible (for production)
- Verify the webhook endpoint URL is correct in Stripe Dashboard
- Check application logs for errors
- Ensure database is accessible and migrations are up to date

### Entitlements not being granted

- Verify `userId` is included in checkout session metadata
- Check that price IDs match between checkout and webhook handler
- Ensure user exists in database
- Check database transaction logs for errors

### Rate limiting issues

- Default limit is 100 requests per minute
- Adjust `WEBHOOK_RATE_LIMIT` in `route.ts` if needed
- Consider using Redis-based rate limiting for production

## Testing Checklist

- [ ] Webhook endpoint responds to POST requests
- [ ] Invalid signatures are rejected (400)
- [ ] Missing signatures are rejected (400)
- [ ] Rate limiting works (429 after limit)
- [ ] Duplicate events return 200 without reprocessing
- [ ] `checkout.session.completed` grants entitlements
- [ ] `customer.subscription.deleted` revokes entitlements
- [ ] Database transactions work correctly
- [ ] Logs show appropriate messages

## Next Steps

After setting up webhooks:

1. Test the complete checkout flow end-to-end
2. Verify entitlements are granted correctly
3. Test subscription cancellation
4. Monitor webhook logs in production
5. Set up alerts for webhook failures

## Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
