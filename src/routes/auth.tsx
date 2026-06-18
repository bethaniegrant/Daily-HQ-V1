import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { validateInviteToken, redeemInviteToken } from "@/lib/api/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import logoAsset from "@/assets/bethanie-rose-logo.png.asset.json";
const logoUrl = logoAsset.url;
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Daily HQ" },
      { name: "description", content: "Sign in to Daily HQ." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/auth" });
  const validateFn = useServerFn(validateInviteToken);
  const redeemFn = useServerFn(redeemInviteToken);

  const [tab, setTab] = useState(token ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<
    { state: "checking" } | { state: "valid"; email: string | null } | { state: "invalid"; reason: string } | null
  >(null);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      // If the visitor arrived via an invite link, sign out the current session
      // so they can create the new invited account instead of being sent to /app.
      if (token) {
        await supabase.auth.signOut();
        return;
      }
      navigate({ to: "/app" });
    });
  }, [navigate, token]);

  useEffect(() => {
    if (!token) { setTokenStatus(null); return; }
    setTokenStatus({ state: "checking" });
    validateFn({ data: { token } }).then((res) => {
      if (res.valid) {
        setTokenStatus({ state: "valid", email: res.email });
        if (res.email) setEmail(res.email);
        setTab("signup");
      } else {
        setTokenStatus({ state: "invalid", reason: res.reason });
      }
    });
  }, [token, validateFn]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    navigate({ to: "/app" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // If no session was returned, try signing in immediately (works when email
    // confirmation is off). If that succeeds we can redeem & continue.
    let session = data.session;
    if (!session) {
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      session = signInData.session ?? null;
    }

    if (session) {
      if (token && tokenStatus?.state === "valid") {
        try { await redeemFn({ data: { token } }); }
        catch (e: any) { toast.error(e.message); setLoading(false); return; }
      }
      setLoading(false);
      toast.success("Welcome to Daily HQ!");
      navigate({ to: "/app" });
      return;
    }

    // Still no session → email confirmation is required.
    setLoading(false);
    if (token && tokenStatus?.state === "valid") {
      try { sessionStorage.setItem("pending_invite_token", token); } catch {}
    }
    setPendingConfirm(email);
  }

  async function forgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent");
  }

  const canSignUp = tokenStatus?.state === "valid";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Link to="/" aria-label="Back to homepage" className="inline-block transition-opacity hover:opacity-80">
            <img src={logoUrl} alt="Bethanie Rose" className="h-20 w-auto mb-2" />
          </Link>
          <CardTitle>Daily HQ</CardTitle>
          <CardDescription>
            {token
              ? tokenStatus?.state === "checking" ? "Checking your invite..."
                : tokenStatus?.state === "valid" ? "Invite confirmed — create your account below."
                : tokenStatus?.state === "invalid" ? tokenStatus.reason
                : ""
              : "Sign in or create your Daily HQ account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="w-full mb-3"
            onClick={async () => {
              setLoading(true);
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: `${window.location.origin}/app`,
                extraParams: { prompt: "select_account" },
              });
              if (result.error) {
                setLoading(false);
                toast.error(result.error.message || "Google sign-in failed");
                return;
              }
              if (result.redirected) return;
              navigate({ to: "/app" });
            }}
          >
            Continue with Google
          </Button>
          <div className="relative my-3 text-center text-xs text-muted-foreground">
            <span className="bg-card px-2 relative z-10">or use email</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="forgot">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3 mt-4">
                <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" disabled={loading} className="w-full">Sign in</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {!canSignUp ? (
                <div className="mt-4 space-y-3 p-4 border rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    Daily HQ is invite-only. Purchase access to create your account.
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => navigate({ to: "/purchase" })}
                  >
                    Get Access Now
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Already purchased? Check your email for an invite link.
                  </p>
                </div>
              ) : (
                <form onSubmit={signUp} className="space-y-3 mt-4">
                  <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  <Button type="submit" disabled={loading} className="w-full">Create account</Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="forgot">
              <form onSubmit={forgot} className="space-y-3 mt-4">
                <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <Button type="submit" disabled={loading} className="w-full">Send reset link</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
