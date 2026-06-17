import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/verify-email')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Verify your email — Daily HQ' }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate({ to: '/auth' });
        return;
      }
      if (data.user.email_confirmed_at) {
        navigate({ to: '/app' });
        return;
      }
      setEmail(data.user.email ?? null);
    });
  }, [navigate]);

  async function resend() {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success('Verification email sent. Check your inbox.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: '/auth' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-amber-700" />
          </div>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            {email ? <>We sent a verification link to <strong>{email}</strong>.</> : 'Check your inbox for a verification link.'}
            <br />
            Your 48-hour grace period has ended — please verify to continue using Daily HQ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={resend} disabled={sending || !email} className="w-full">
            {sending ? 'Sending…' : 'Resend verification email'}
          </Button>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sign out
          </Button>
          <p className="text-xs text-center text-muted-foreground pt-2">
            Already verified? <Link to="/app" className="underline">Reload Daily HQ</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
