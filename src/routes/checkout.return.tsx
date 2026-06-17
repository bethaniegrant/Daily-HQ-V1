import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/checkout/return')({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: 'Payment complete — Daily HQ' }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const navigate = useNavigate();
  const { session_id } = Route.useSearch();
  const [state, setState] = useState<
    | { kind: 'waiting' }
    | { kind: 'ready'; token: string }
    | { kind: 'error'; message: string }
  >({ kind: 'waiting' });

  useEffect(() => {
    if (!session_id) {
      setState({ kind: 'error', message: 'Missing payment reference. Contact support if you were charged.' });
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/public/invite-lookup?session_id=${encodeURIComponent(session_id)}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.token) {
          setState({ kind: 'ready', token: json.token });
          return;
        }
        if (attempts > 30) {
          setState({
            kind: 'error',
            message: "We received your payment but haven't issued your invite yet. Please contact support.",
          });
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        if (cancelled) return;
        if (attempts > 30) {
          setState({ kind: 'error', message: 'Network error while issuing your invite. Please contact support.' });
          return;
        }
        setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [session_id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {state.kind === 'waiting' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground">
              Hang tight — we're setting up your invite. This usually takes a few seconds.
            </p>
          </>
        )}
        {state.kind === 'ready' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
            <h1 className="text-2xl font-semibold">You're in. Welcome to Daily HQ.</h1>
            <p className="text-sm text-muted-foreground">
              Create your account to access your HQ. We've also emailed your invite link as a backup.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate({ to: '/auth', search: { token: state.token } })}
            >
              Create your account →
            </Button>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-amber-600" />
            <h1 className="text-2xl font-semibold">Something went sideways</h1>
            <p className="text-sm text-muted-foreground">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
