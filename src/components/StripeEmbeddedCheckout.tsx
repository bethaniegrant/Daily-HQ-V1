import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import { createDailyHqCheckout } from '@/utils/payments.functions';

export function DailyHqCheckout({ returnUrl }: { returnUrl: string }) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createDailyHqCheckout({
      data: { returnUrl, environment: getStripeEnvironment() },
    });
    if ('error' in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error('Checkout could not be initialized');
    return result.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
