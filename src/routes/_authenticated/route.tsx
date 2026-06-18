import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserAppAccess, redeemInviteToken } from "@/lib/api/admin.functions";

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
        await redeemInviteToken({ data: { token: pending } });
        sessionStorage.removeItem("pending_invite_token");
      }
    } catch {}

    // Server-side gate uses privileged access so invite redemptions count for
    // normal users even though invite token rows are hidden from the browser.
    const appAccess = await getCurrentUserAppAccess();

    if (appAccess.accessRevoked) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    // Entitlement gate: must be admin OR have redeemed an invite token
    if (!appAccess.isAdmin && !appAccess.hasInviteAccess) {
      await supabase.auth.signOut();
      throw redirect({ to: "/purchase" });
    }

    // 48-hour email verification grace period (skipped for Google/OAuth users — already verified)
    const emailConfirmed = !!data.user.email_confirmed_at;
    const provider = data.user.app_metadata?.provider;
    const isOAuth = provider && provider !== "email";
    if (!emailConfirmed && !isOAuth && appAccess.emailVerifiedDeadline) {
      const deadline = new Date(appAccess.emailVerifiedDeadline).getTime();
      if (Date.now() > deadline) {
        throw redirect({ to: "/verify-email" });
      }
    }

    return {
      user: data.user,
      isAdmin: appAccess.isAdmin,
      needsVerification: !emailConfirmed && !isOAuth,
      verificationDeadline: appAccess.emailVerifiedDeadline,
    };
  },
  component: () => <Outlet />,
});
