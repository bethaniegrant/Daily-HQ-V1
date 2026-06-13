import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { redeemInviteToken } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    let { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      let subscription: { unsubscribe: () => void } | null = null;
      await new Promise((resolve) => {
        const timeout = window.setTimeout(resolve, 1200);
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            window.clearTimeout(timeout);
            resolve(undefined);
          }
        });
        subscription = sub.subscription;
      });
      subscription?.unsubscribe();
      sessionData = (await supabase.auth.getSession()).data;
    }

    if (!sessionData.session) throw redirect({ to: "/auth" });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Redeem any pending invite token from the signup flow
    try {
      const pending = sessionStorage.getItem("pending_invite_token");
      if (pending) {
        sessionStorage.removeItem("pending_invite_token");
        await redeemInviteToken({ data: { token: pending } }).catch(() => {});
      }
    } catch {}

    // Block revoked users
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_revoked")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.access_revoked) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    // Expose admin flag from the user's own role rows
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    return { user: data.user, isAdmin: !!roles?.some((r) => r.role === "admin") };
  },
  component: () => <Outlet />,
});
