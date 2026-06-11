import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Whole Life Planner" },
      { name: "description", content: "Track money, health, habits, meds, workouts, and plans — all in one place, synced across devices." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const navigate = useNavigate();
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
    <div style={{ position: "fixed", inset: 0, background: "#16201C" }}>
      {src && (
        <iframe
          src={src}
          title="Whole Life Planner"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      )}
      <Button
        onClick={signOut}
        size="sm"
        variant="secondary"
        style={{ position: "fixed", top: 12, right: 12, zIndex: 50, opacity: 0.85 }}
      >
        Sign out
      </Button>
    </div>
  );
}
