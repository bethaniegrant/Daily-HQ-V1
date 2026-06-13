import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

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
    if (!token || tokenStatus?.state !== "valid") {
      return toast.error("A valid invite link is required to create an account");
    }
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

    // Try to redeem now if a session exists (no email confirmation required)
    if (data.session) {
      try { await redeemFn({ data: { token } }); }
      catch (e: any) { toast.error(e.message); setLoading(false); return; }
      setLoading(false);
      toast.success("Welcome to Daily HQ!");
      navigate({ to: "/app" });
    } else {
      setLoading(false);
      // Stash token so we can redeem after email confirmation
      try { sessionStorage.setItem("pending_invite_token", token); } catch {}
      toast.success("Check your email to confirm your account");
    }
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
        <CardHeader>
          <CardTitle>Daily HQ</CardTitle>
          <CardDescription>
            {token
              ? tokenStatus?.state === "checking" ? "Checking your invite..."
                : tokenStatus?.state === "valid" ? "Invite confirmed — create your account below."
                : tokenStatus?.state === "invalid" ? tokenStatus.reason
                : ""
              : "Sign in to your account. New accounts require an invite link."}
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
                <div className="mt-4 text-sm text-muted-foreground text-center p-4 border rounded-md">
                  An invite link is required to create an account.<br />
                  Paste your invite URL into the address bar, or contact support.
                </div>
              ) : (
                <form onSubmit={signUp} className="space-y-3 mt-4">
                  <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!tokenStatus && tokenStatus.state === "valid" && !!tokenStatus.email} />
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
