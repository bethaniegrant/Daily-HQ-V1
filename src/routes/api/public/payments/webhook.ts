import * as React from 'react';
import { render } from '@react-email/components';
import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { InviteEmail } from '@/lib/email-templates/invite';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

const SITE_NAME = 'Daily HQ';
const ROOT_DOMAIN = 'daily-hq.com';
const SENDER_DOMAIN = 'notify.daily-hq.com';
const FROM_DOMAIN = 'notify.daily-hq.com';

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

// Delivers the invite link by email so a paid customer can always get back in,
// even if they close the checkout return page.
async function sendInviteEmail(email: string, token: string) {
  const sb = getSupabase();
  const confirmationUrl = `https://${ROOT_DOMAIN}/auth?token=${encodeURIComponent(token)}`;
  const element = React.createElement(InviteEmail, {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    confirmationUrl,
  });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const messageId = crypto.randomUUID();

  await sb.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'purchase_invite',
    recipient_email: email,
    status: 'pending',
  });

  const { error } = await sb.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: 'Your Daily HQ invite link',
      html,
      text,
      purpose: 'transactional',
      label: 'purchase_invite',
      queued_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.error('[webhook] Failed to enqueue invite email', error);
    await sb.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'purchase_invite',
      recipient_email: email,
      status: 'failed',
      error_message: 'Failed to enqueue invite email',
    });
  }
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
