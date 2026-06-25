import Stripe from "stripe";

const DEFAULT_STRIPE_API_VERSION = Stripe.API_VERSION;

type StripeApiVersion = NonNullable<
  ConstructorParameters<typeof Stripe>[1]
>["apiVersion"];

function getStripeApiVersion(): StripeApiVersion {
  return (
    process.env.STRIPE_API_VERSION || DEFAULT_STRIPE_API_VERSION
  ) as StripeApiVersion;
}

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: getStripeApiVersion(),
  });
}
