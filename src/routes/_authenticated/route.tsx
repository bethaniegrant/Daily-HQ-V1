import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { redeemInviteToken } from "@/lib/api/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    let { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      let subscription: any = null;
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
      .select("access_revoked, email_verified_deadline")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.access_revoked) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isAdmin = !!roles?.some((r) => r.role === "admin");

    // Entitlement gate: must be admin OR have redeemed an invite token
    if (!isAdmin) {
      const { count: redeemedCount } = await supabase
        .from("invite_tokens")
        .select("*", { count: "exact", head: true })
        .eq("redeemed_by", data.user.id);
      if (!redeemedCount || redeemedCount === 0) {
        // No purchase on file — sign them out and send to /purchase
        await supabase.auth.signOut();
        throw redirect({ to: "/purchase" });
      }
    }

    // 48-hour email verification grace period (skipped for Google/OAuth users — already verified)
    const emailConfirmed = !!data.user.email_confirmed_at;
    const provider = data.user.app_metadata?.provider;
    const isOAuth = provider && provider !== "email";
    if (!emailConfirmed && !isOAuth && profile?.email_verified_deadline) {
      const deadline = new Date(profile.email_verified_deadline).getTime();
      if (Date.now() > deadline) {
        throw redirect({ to: "/verify-email" });
      }
    }

    return {
      user: data.user,
      isAdmin,
      needsVerification: !emailConfirmed && !isOAuth,
      verificationDeadline: profile?.email_verified_deadline ?? null,
    };
  },
  component: () => <Outlet />,
});
