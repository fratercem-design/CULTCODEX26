# Stripe Checkout Setup Guide

This document explains how to configure Stripe for the Cult of Psyche Vault + Grimoire platform.

## Overview

The platform uses Stripe Checkout to handle:
- **Monthly subscriptions** - Recurring payments for ongoing access
- **Lifetime purchases** - One-time payments for permanent access

## Implementation Status

✅ **Completed:**
- Stripe SDK integration (`lib/services/stripe.service.ts`)
- Monthly subscription checkout endpoint (`/api/billing/checkout/monthly`)
- Lifetime purchase checkout endpoint (`/api/billing/checkout/lifetime`)
- Authentication guards to protect checkout endpoints
- Graceful handling when Stripe is not configured

## Configuration Steps

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Navigate to the Dashboard

### 2. Create Products and Prices

#### Monthly Subscription Product
1. Go to **Products** in the Stripe Dashboard
2. Click **Add Product**
3. Set:
   - Name: "Monthly Membership"
   - Description: "Monthly access to Vault and Grimoire"
   - Pricing: Recurring, Monthly
   - Price: (your chosen amount, e.g., $9.99)
4. Save and copy the **Price ID** (starts with `price_`)

#### Lifetime Purchase Product
1. Go to **Products** in the Stripe Dashboard
2. Click **Add Product**
3. Set:
   - Name: "Lifetime Access"
   - Description: "Permanent access to Vault and Grimoire"
   - Pricing: One-time
   - Price: (your chosen amount, e.g., $99.99)
4. Save and copy the **Price ID** (starts with `price_`)

### 3. Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy your **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for production)
3. Keep this key secure - never commit it to version control

### 4. Configure Environment Variables

Add the following to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
STRIPE_MONTHLY_PRICE_ID="price_your_monthly_price_id"
STRIPE_LIFETIME_PRICE_ID="price_your_lifetime_price_id"
```

### 5. Test the Integration

Run the test script to verify the endpoints work:

```bash
node test-stripe-checkout.mjs
```

Expected output:
- ✅ Authentication working
- ✅ Monthly checkout session created with Stripe URL
- ✅ Lifetime checkout session created with Stripe URL
- ✅ Authorization guard working

## API Endpoints

### POST /api/billing/checkout/monthly

Creates a Stripe Checkout session for monthly subscription.

**Authentication:** Required (JWT session)

**Request:**
```json
POST /api/billing/checkout/monthly
Headers:
  Cookie: session=<jwt-token>
  Origin: https://yourdomain.com
```

**Response (Success):**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Response (Not Configured):**
```json
{
  "error": "Payment system is not configured"
}
```
Status: 503

### POST /api/billing/checkout/lifetime

Creates a Stripe Checkout session for lifetime purchase.

**Authentication:** Required (JWT session)

**Request:**
```json
POST /api/billing/checkout/lifetime
Headers:
  Cookie: session=<jwt-token>
  Origin: https://yourdomain.com
```

**Response (Success):**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

## User Flow

1. User clicks "Subscribe Monthly" or "Buy Lifetime Access" button
2. Frontend calls the appropriate checkout endpoint
3. Backend creates Stripe Checkout session with:
   - User ID in metadata
   - Success/cancel URLs
   - Appropriate price ID
4. User is redirected to Stripe's hosted checkout page
5. User completes payment on Stripe
6. Stripe redirects user back to success URL
7. Webhook processes payment and grants entitlements (Task 5)

## Security Features

- ✅ Authentication required for all checkout endpoints
- ✅ User ID stored in session metadata for webhook processing
- ✅ Graceful error handling when Stripe is not configured
- ✅ Environment variables for sensitive configuration
- ✅ HTTPS enforced in production

## Next Steps

After configuring Stripe checkout:
1. Implement webhook processing (Task 5) to handle payment events
2. Grant entitlements when payments succeed
3. Revoke entitlements when subscriptions are canceled
4. Create success/cancel pages for user redirects
5. Add frontend UI for checkout buttons

## Testing

### Test Mode
- Use test API keys (start with `sk_test_`)
- Use test card numbers from [Stripe Testing](https://stripe.com/docs/testing)
- Example: `4242 4242 4242 4242` (Visa)

### Production Mode
- Switch to live API keys (start with `sk_live_`)
- Use real payment methods
- Monitor transactions in Stripe Dashboard

## Troubleshooting

**Error: "Payment system is not configured"**
- Ensure `STRIPE_SECRET_KEY` is set in `.env`
- Restart the development server after adding environment variables

**Error: "Payment configuration error"**
- Ensure `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_LIFETIME_PRICE_ID` are set
- Verify the price IDs exist in your Stripe Dashboard

**Checkout session creation fails**
- Check Stripe Dashboard for error details
- Verify API key has correct permissions
- Ensure price IDs are valid and active

## Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
