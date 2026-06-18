import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyHqCheckout } from '@/components/StripeEmbeddedCheckout';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';

export const Route = createFileRoute('/purchase')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Get Daily HQ — $15 one-time' },
      {
        name: 'description',
        content: 'Lifetime access to Daily HQ — your private daily operating system. One-time $15.',
      },
    ],
  }),
  component: PurchasePage,
});

function PurchasePage() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Back to Daily HQ
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Get Daily HQ</h1>
          <p className="mt-3 text-muted-foreground">
            One-time $15 — lifetime access. After purchase you'll get a private link to create your account.
          </p>
          {signedIn && (
            <p className="mt-3 text-sm text-amber-700">
              You're already signed in. <Link to="/app" className="underline">Open Daily HQ →</Link>
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-2 shadow-sm">
          <DailyHqCheckout returnUrl={returnUrl} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an invite link? <Link to="/auth" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
