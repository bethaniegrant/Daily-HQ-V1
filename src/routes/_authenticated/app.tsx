import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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

  // Send isAdmin to iframe once loaded, and listen for shell actions
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      const m = e?.data;
      if (!m || typeof m !== "object") return;
      if (m.type === "shell:signOut") {
        await supabase.auth.signOut();
        toast.success("Signed out");
        navigate({ to: "/auth" });
      } else if (m.type === "shell:navigate" && typeof m.to === "string") {
        navigate({ to: m.to });
      } else if (m.type === "shell:ready") {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "shell:context", isAdmin },
          "*",
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isAdmin, navigate]);

  function onIframeLoad() {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "shell:context", isAdmin },
      "*",
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#ece6dc" }}>
      {src && (
        <iframe
          ref={iframeRef}
          src={src}
          title="Daily HQ"
          onLoad={onIframeLoad}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      )}
    </div>
  );
}
