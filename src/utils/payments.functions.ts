import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from '@/lib/stripe.server';

type CheckoutSessionResult = { clientSecret: string } | { error: string };

export const createDailyHqCheckout = createServerFn({ method: 'POST' })
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) =>
    z.object({
      returnUrl: z.string().url(),
      environment: z.enum(['sandbox', 'live']),
    }).parse(data),
  )
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: ['dailyhq_access_onetime'] });
      if (!prices.data.length) throw new Error('Price not found');
      const stripePrice = prices.data[0];

      const productId =
        typeof stripePrice.product === 'string' ? stripePrice.product : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        payment_intent_data: { description: product.name },
      });

      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
