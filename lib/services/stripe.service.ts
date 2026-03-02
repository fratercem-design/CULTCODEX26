import Stripe from 'stripe';
import { env } from '@/lib/env';

/**
 * Initialize Stripe client
 * Returns null if STRIPE_SECRET_KEY is not configured
 */
function initializeStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
}

// Lazy initialization - only create Stripe client when first accessed
let stripeInstance: Stripe | null | undefined = undefined;

export function getStripe(): Stripe | null {
  if (stripeInstance === undefined) {
    stripeInstance = initializeStripe();
  }
  return stripeInstance;
}

// Export for convenience
export const stripe = getStripe();
