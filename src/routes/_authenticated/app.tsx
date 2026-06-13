import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Daily HQ" },
      { name: "description", content: "Your private command center." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const navigate = useNavigate();
  const { isAdmin } = Route.useRouteContext();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const s = data.session;
      if (!s) {
        setSrc("/whole-life.html");
        return;
      }
      const hash = `#at=${encodeURIComponent(s.access_token)}&rt=${encodeURIComponent(s.refresh_token)}`;
      setSrc(`/whole-life.html${hash}`);
    });
    return () => { cancelled = true; };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#ece6dc" }}>
      {src && (
        <iframe
          src={src}
          title="Daily HQ"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      )}
      <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 50, display: "flex", gap: 8 }}>
        <Link to="/">
          <Button size="sm" variant="secondary" style={{ opacity: 0.92, boxShadow: "0 8px 24px -10px rgba(22,32,28,.35)" }}>Home</Button>
        </Link>
        {isAdmin && (
          <Link to="/admin">
            <Button size="sm" variant="secondary" style={{ opacity: 0.92, boxShadow: "0 8px 24px -10px rgba(22,32,28,.35)" }}>Admin</Button>
          </Link>
        )}
        <Button onClick={signOut} size="sm" variant="secondary" style={{ opacity: 0.92, boxShadow: "0 8px 24px -10px rgba(22,32,28,.35)" }}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
