import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Whole Life Planner" },
      { name: "description", content: "Track money, health, habits, meds, workouts, and plans — all in one place." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "#16201C" }}>
      <iframe
        src="/whole-life.html"
        title="Whole Life Planner"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
      />
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
