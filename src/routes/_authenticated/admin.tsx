import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminGetStats,
  adminListUsers,
  adminListInviteTokens,
  adminListPurchases,
  adminCreateInviteToken,
  adminRevokeInviteToken,
  adminSetAccessRevoked,
} from "@/lib/api/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Daily HQ" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">Daily HQ control center</p>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            Back to app
          </Button>
        </div>

        <StatsRow />

        <Tabs defaultValue="invites">
          <TabsList>
            <TabsTrigger value="invites">Invites</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>
          <TabsContent value="invites"><InvitesTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="purchases"><PurchasesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatsRow() {
  const fn = useServerFn(adminGetStats);
  const { data } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fn() });
  const stats = [
    { label: "Total users", value: data?.totalUsers ?? "—" },
    { label: "Open invites", value: data?.openInvites ?? "—" },
    { label: "Paid purchases", value: data?.paidPurchases ?? "—" },
    { label: "Signups (7d)", value: data?.signupsLast7Days ?? "—" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InvitesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListInviteTokens);
  const createFn = useServerFn(adminCreateInviteToken);
  const revokeFn = useServerFn(adminRevokeInviteToken);
  const { data: tokens } = useQuery({ queryKey: ["admin", "tokens"], queryFn: () => listFn() });

  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [days, setDays] = useState(30);

  const create = useMutation({
    mutationFn: (vars: { email: string; note: string; expiresInDays: number }) =>
      createFn({ data: vars }),
    onSuccess: (row: any) => {
      const url = `${window.location.origin}/auth?token=${row.token}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Invite link created and copied to clipboard");
      setEmail(""); setNote("");
      qc.invalidateQueries({ queryKey: ["admin", "tokens"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (tokenId: string) => revokeFn({ data: { tokenId } }),
    onSuccess: () => {
      toast.success("Invite revoked");
      qc.invalidateQueries({ queryKey: ["admin", "tokens"] });
    },
  });

  function copy(token: string) {
    const url = `${window.location.origin}/auth?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader><CardTitle>Generate invite link</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div><Label>Email (optional)</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="someone@example.com" /></div>
            <div><Label>Note (optional)</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. comped, paid via Venmo" /></div>
            <div><Label>Expires in (days)</Label><Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(parseInt(e.target.value) || 30)} /></div>
          </div>
          <Button onClick={() => create.mutate({ email, note, expiresInDays: days })} disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create invite link"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent invites</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(tokens ?? []).map((t: any) => {
              const expired = new Date(t.expires_at).getTime() < Date.now();
              const status = t.redeemed_at ? "used" : expired ? "expired" : "active";
              return (
                <div key={t.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs truncate">{t.token}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t.email ? `for ${t.email} · ` : ""}
                      {t.note ? `${t.note} · ` : ""}
                      created {new Date(t.created_at).toLocaleDateString()} ·
                      expires {new Date(t.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
                    {status === "active" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => copy(t.token)}>Copy link</Button>
                        <Button size="sm" variant="ghost" onClick={() => revoke.mutate(t.id)}>Revoke</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {!tokens?.length && <p className="text-sm text-muted-foreground">No invites yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListUsers);
  const setRevoked = useServerFn(adminSetAccessRevoked);
  const { data: users } = useQuery({ queryKey: ["admin", "users"], queryFn: () => listFn() });

  const toggle = useMutation({
    mutationFn: (vars: { userId: string; revoked: boolean }) => setRevoked({ data: vars }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>All users</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(users ?? []).map((u: any) => (
            <div key={u.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{u.display_name || u.email || u.id}</div>
                <div className="text-xs text-muted-foreground">
                  {u.email} · joined {new Date(u.created_at).toLocaleDateString()}
                  {u.last_sign_in_at && ` · last seen ${new Date(u.last_sign_in_at).toLocaleDateString()}`}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                {u.roles?.includes("admin") && <Badge>admin</Badge>}
                {u.access_revoked && <Badge variant="destructive">revoked</Badge>}
                <Button
                  size="sm"
                  variant={u.access_revoked ? "outline" : "ghost"}
                  onClick={() => toggle.mutate({ userId: u.id, revoked: !u.access_revoked })}
                  disabled={u.roles?.includes("admin")}
                >
                  {u.access_revoked ? "Restore" : "Revoke"}
                </Button>
              </div>
            </div>
          ))}
          {!users?.length && <p className="text-sm text-muted-foreground">No users yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PurchasesTab() {
  const fn = useServerFn(adminListPurchases);
  const { data: purchases } = useQuery({ queryKey: ["admin", "purchases"], queryFn: () => fn() });
  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>Purchases</CardTitle></CardHeader>
      <CardContent>
        {!purchases?.length ? (
          <p className="text-sm text-muted-foreground">No purchases yet. Connect Stripe to start tracking payments here.</p>
        ) : (
          <div className="space-y-2">
            {purchases.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                <div>
                  <div className="font-medium">{p.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                    {p.amount_cents && ` · ${(p.amount_cents / 100).toFixed(2)} ${p.currency?.toUpperCase() ?? ""}`}
                  </div>
                </div>
                <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
