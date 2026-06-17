import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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

// Public endpoint: the checkout return page polls this with the Stripe session_id
// to retrieve the freshly-issued invite token. Returns { token } when ready.
export const Route = createFileRoute('/api/public/invite-lookup')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('session_id');
        if (!sessionId || sessionId.length < 10 || sessionId.length > 200) {
          return Response.json({ token: null }, { status: 400 });
        }
        const sb = getSupabase();
        const { data: purchase } = await sb
          .from('purchases')
          .select('invite_token_id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();
        if (!purchase?.invite_token_id) return Response.json({ token: null });

        const { data: token } = await sb
          .from('invite_tokens')
          .select('token, redeemed_at')
          .eq('id', purchase.invite_token_id)
          .maybeSingle();
        if (!token || token.redeemed_at) return Response.json({ token: null });
        return Response.json({ token: token.token });
      },
    },
  },
});
