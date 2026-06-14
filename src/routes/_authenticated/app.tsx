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
  const iframeRef = useState<{ el: HTMLIFrameElement | null }>({ el: null })[0];

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

  function goHome() {
    iframeRef.el?.contentWindow?.postMessage({ type: "go", tab: "home" }, "*");
  }

  const btn = { opacity: 0.94, boxShadow: "0 8px 24px -10px rgba(22,32,28,.35)" } as const;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#ece6dc" }}>
      {src && (
        <iframe
          ref={(el) => { iframeRef.el = el; }}
          src={src}
          title="Daily HQ"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      )}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50, display: "flex", gap: 8 }}>
        <Button onClick={goHome} size="sm" variant="secondary" style={btn}>Home</Button>
        {isAdmin && (
          <Link to="/admin">
            <Button size="sm" variant="secondary" style={btn}>Admin</Button>
          </Link>
        )}
        <Button onClick={signOut} size="sm" variant="secondary" style={btn}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
