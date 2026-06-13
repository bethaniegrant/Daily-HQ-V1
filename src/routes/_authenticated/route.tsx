import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { redeemInviteToken } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
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

    // Expose admin flag
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    return { user: data.user, isAdmin: !!isAdmin };
  },
  component: () => <Outlet />,
});
