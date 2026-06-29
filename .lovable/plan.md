# New User Flow — 6-Step Onboarding + Not Today

All work happens in `public/whole-life.html`. No backend or route changes.

## 1. Rewrite the `Onboarding` component (6 steps)

Replace the current 4-step flow with the six screens you described. Keep the existing progress dots, footer Back/Next, and "Skip — set me up with everything" shortcut.

**Step 1 — Welcome / Why**
- Headline: "Welcome to Daily HQ."
- Body: your "You're in the right place… calm hub designed for reality, not just productivity." copy.
- Single CTA: "Let's begin →".

**Step 2 — What matters (focus areas)**
- Multi-select chips, at least one required.
- Six options mapped to existing space data so no data model changes:
  - Self-Care → seeds Health
  - Budget / Finances → seeds Money
  - Work Tasks → seeds Plan (To Do)
  - Habit Tracking → seeds Plan (Habits)
  - Important Dates → seeds Plan (calendar/events)
  - Trackers → seeds Trackers
- Internally collapses to the existing `enabledCategories { money, health, plan, trackers }` so `applyCategorySeeds` keeps working untouched. Picking Work Tasks, Habit Tracking, or Important Dates all enable `plan`; we remember the granular picks in a new `d.focusAreas` array so the dashboard can show only the chosen Plan widgets.
- Helper line: "Select what matters right now. You can change these anytime in settings."

**Step 3 — Dashboard layout**
- Two radio cards: "Day at a glance" / "Week at a glance".
- Saves to `d.dashboardDefault` ("day" | "week"); the side-panel tab opens to that view on load.

**Step 4 — The "Not Today" permission**
- Pure informational screen with the exact copy you supplied.
- CTA: "Got it →". Sets `d.notTodayIntroSeen = true`.

**Step 5 — First task (quick win)**
- One text input + "Add Task" button.
- If filled, pushes one row into `d.todos` for today's date, marked source `"onboarding"`. Skippable.

**Step 6 — Final polish (account & preferences)**
- Three fields:
  - Name for dashboard (pre-filled from step 1 if we keep the name there, or asked here — see note below).
  - Color theme: keeps the 5 existing themes plus a new **"Custom"** tile with two color inputs (Accent + Surface). When chosen, `d.theme = "custom"` and `d.customTheme = { AMBER, MIST }`; `applyTheme` extends to read from `d.customTheme` when name is `"custom"`.
  - Timezone: native `<select>` populated from `Intl.supportedValuesOf('timeZone')` with browser default pre-selected; saved to `d.timezone`.
- CTA: "Save & Launch".

**Naming**: move the name input from old step 1 into step 6 ("your name for the dashboard"), so step 1 stays pure welcome copy.

## 2. Custom color theme support

- Extend `THEMES` registry with a `custom` entry that returns values from `d.customTheme` (fallback to sage).
- `applyTheme(name, customOverride)` accepts the override so the live preview in the picker works without saving.
- Add the same Custom tile in `AppearanceModal` so users can change it later.

## 3. "Not Today" on To-Do rows

- Add a small "Not today" link/button on each todo row in:
  - the dashboard Today list,
  - the side-panel Day view,
  - the To Do page rows.
- Behavior: sets the todo's `date` to tomorrow (local), leaves `done = false`, does not touch the existing rollover-on-load logic. Adds a tiny toast/inline note "Moved to tomorrow".
- Distinct from delete (which removes) and complete (which checks off).

## 4. Dashboard respects new prefs

- Side panel opens on `d.dashboardDefault` instead of always Day.
- Today list only renders Plan widgets that match `d.focusAreas` (e.g. hides Habits section if only "Work Tasks" was picked under Plan).
- All gating falls back to "show everything" when `focusAreas` is empty (existing users).

## 5. Migration safety

- Existing-user migration block (lines ~407–420) stays. New fields default: `focusAreas = []`, `dashboardDefault = "day"`, `notTodayIntroSeen = true`, `customTheme = null`, `timezone = browser default`.
- `Reset account` button continues to work — clears all the new fields too since they live on the same doc.

## Technical notes

- Single file edit: `public/whole-life.html`.
- New constants near `SPACE_PRESETS`: `FOCUS_AREAS` (6 items with `id`, `label`, `blurb`, `mapsTo: "money"|"health"|"plan"|"trackers"`, `planTag?`).
- Doc shape additions:
  ```js
  focusAreas: [],            // e.g. ["selfcare","budget","habits"]
  dashboardDefault: "day",   // "day" | "week"
  notTodayIntroSeen: false,
  customTheme: null,         // { AMBER, MIST } when theme === "custom"
  timezone: "",              // IANA string
  ```
- `totalSteps = 6`; update `stepTitles` and per-step `canNext` rules (step 2 requires ≥1 focus area; step 6 requires non-empty name).
- "Not today" handler:
  ```js
  const bumpToTomorrow = (todoId) => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    const iso = t.toISOString().slice(0,10);
    setD(p => ({ ...p, todos: p.todos.map(x => x.id === todoId ? { ...x, date: iso } : x) }));
  };
  ```

## Out of scope (call out, don't build)

- Drag-and-drop dashboard reorder in step 3 — using radio cards instead since the dashboard currently has a fixed layout. Flag as a follow-up if you want true rearrangement.
- Server-side timezone usage — only stored for now; existing date logic continues to use the browser.
