import Stripe from "stripe";

const DEFAULT_STRIPE_API_VERSION = Stripe.API_VERSION;

export function getStripeApiVersion(): Stripe.LatestApiVersion {
  return (
    process.env.STRIPE_API_VERSION || DEFAULT_STRIPE_API_VERSION
  ) as Stripe.LatestApiVersion;
}

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: getStripeApiVersion(),
  });
}
