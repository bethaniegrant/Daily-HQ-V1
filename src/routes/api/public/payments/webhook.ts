import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function handleCheckoutCompleted(session: any) {
  const sb = getSupabase();
  const sessionId: string = session.id;
  const email: string | null =
    session.customer_details?.email ?? session.customer_email ?? null;
  const amount: number | null = session.amount_total ?? null;
  const currency: string | null = session.currency ?? null;

  if (!email) {
    console.error('[webhook] No email on checkout session', sessionId);
    return;
  }

  // Idempotency: skip if we've already issued an invite for this session
  const { data: existingPurchase } = await sb
    .from('purchases')
    .select('id, invite_token_id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existingPurchase?.invite_token_id) {
    console.log('[webhook] Already processed session', sessionId);
    return;
  }

  // Create invite token (90-day expiry, email-bound)
  const token = randomToken();
  const { data: tokenRow, error: tokenErr } = await sb
    .from('invite_tokens')
    .insert({
      token,
      email,
      source: 'stripe',
      stripe_session_id: sessionId,
      expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
      note: 'Issued by Stripe purchase webhook',
    })
    .select()
    .single();
  if (tokenErr) {
    console.error('[webhook] Failed to create invite token', tokenErr);
    throw new Error(tokenErr.message);
  }

  // Record purchase
  const { error: purErr } = await sb.from('purchases').upsert(
    {
      stripe_session_id: sessionId,
      stripe_customer_id: session.customer ?? null,
      email,
      amount_cents: amount,
      currency,
      status: 'paid',
      invite_token_id: tokenRow.id,
    },
    { onConflict: 'stripe_session_id' },
  );
  if (purErr) console.error('[webhook] Failed to record purchase', purErr);

  console.log('[webhook] Invite issued for', email, 'token', token);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await handleCheckoutCompleted(event.data.object);
      break;
    default:
      console.log('[webhook] Unhandled event:', event.type);
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          console.error('[webhook] Invalid env param:', rawEnv);
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error('[webhook] Error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
