import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Whole Life Planner" },
      { name: "description", content: "Track money, health, habits, meds, workouts, and plans — all in one place." },
      { property: "og:title", content: "Whole Life Planner" },
      { property: "og:description", content: "Track money, health, habits, meds, workouts, and plans — all in one place." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/whole-life.html"
      title="Whole Life Planner"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
        background: "#16201C",
      }}
    />
  );
}
