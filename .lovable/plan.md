# New User Onboarding Flow

Goal: when someone opens the app for the first time, walk them through a short, friendly setup so the dashboard and Spaces feel personalized — never overwhelming.

## The flow (4 quick steps + skip)

A full-screen welcome overlay inside the planner (`public/whole-life.html`), shown only when `d.onboarded !== true`.

```text
Step 1 — Welcome / Username
  "What should we call you?"   [ text input ]
  → saves to d.username

Step 2 — Pick your color theme
  5 named palettes, big swatches, one click to select:
    • Sage     (current default — earthy green/cream)
    • Plum     (warm berry + cream)
    • Ocean    (slate blue + sand)
    • Sunset   (terracotta + warm neutrals)
    • Mono     (charcoal + ivory, minimal)
  → saves to d.theme

Step 3 — Pick your spaces
  Four cards, multi-select, at least one required:
    • Money    — Budget, Savings, Debt
    • Health   — Meds, Workouts, Meals, Mood
    • Plan     — Habits, To-Do, Goals, Calendar
    • Trackers — Custom trackers (books, sleep, journal…)
  Each card lists what's included so they know what they're choosing.
  → saves to d.enabledCategories

Step 4 — You're set
  Short recap + two buttons:
    [ Enter Daily HQ ]      → marks d.onboarded = true
    [ Skip — set me up with everything ]   (visible from step 1 onward)
       → enables all categories, applies Sage theme, seeds full example data,
         marks d.onboarded = true
```

Back/Next on every step. Progress dots at the top. ESC and outside-clicks disabled so the user can't half-finish.

## What changes on the dashboard

After onboarding the dashboard shows only:
1. Header with greeting using `d.username` ("Good morning, Bethanie")
2. **Today's intention** (the existing intention input, promoted to the top)
3. **Calendar with Daily / Weekly glance** (existing `DashboardCalendar`)
4. **Today's notes** widget (the one we just added)
5. **Jump back in** tiles — filtered to only the categories the user enabled
6. **Monthly goals** snapshot
7. **Explore** — hidden until the user adds more spaces

The current "Jump back in" tiles render conditionally based on `d.enabledCategories`. So if they only picked Plan + Trackers, Money/Health tiles don't appear until they enable those later.

## What changes in Spaces / menu

- The Spaces hub and the side menu drawer only show category sections (Money / Health / Plan) for categories the user enabled.
- Disabled categories appear at the bottom of Spaces as a single **"+ Add more spaces"** card that re-opens a mini version of Step 3 so they can flip categories on later.
- Toggling a category on seeds its example blocks (same data the current `seed()` produces, but scoped to that category).

## Seed data, restructured

Refactor `seed()` in `public/whole-life.html` so example data is grouped by category and only the chosen categories get populated:

- `seedMoney()`   → pay, budget, savingsGoals
- `seedHealth()`  → meds, workouts, meals, mood block
- `seedPlan()`    → habitDefs, goals, yearlyGoals, To Do block, intention
- `seedTrackers()` → one example tracker block (rated list: "Books I'm reading")

`seed()` becomes: start from empty shell + apply seeds for enabled categories. "Skip" applies all four.

## Color theming

Each theme is a small token map (`INK`, `PAPER`, `CARD`, `SAGE`/accent, `AMBER`/highlight, `MIST`, `LINE`, `MUTED`, `TEXT`, `PLUM`, `BLUE`). Today these are top-level consts in `public/whole-life.html`. We move them into a `THEMES` object and a `getTheme(name)` helper, then thread the active theme through the React tree via a `ThemeContext` so components read colors from context instead of module-level consts. Default = Sage = current values, so existing screens render identically.

Theme is changeable later from a new **Settings → Appearance** menu item.

## Data model additions

Stored inside the existing `d` blob (same persistence path as everything else):

```text
d.onboarded         : boolean
d.username          : string
d.theme             : "sage" | "plum" | "ocean" | "sunset" | "mono"
d.enabledCategories : { money: bool, health: bool, plan: bool, trackers: bool }
```

Existing users (already have data, no `onboarded` flag) are auto-marked `onboarded: true` with all categories enabled and the Sage theme — they never see the flow.

## Files touched

- `public/whole-life.html`
  - New: `Onboarding` component + `THEMES` map + `ThemeContext` + `seedMoney/Health/Plan/Trackers` helpers
  - Edit: `seed()`, top-level color consts → context reads, dashboard sections (greeting, intention placement, tile filter, hide Explore when empty), Spaces hub (filter + "Add more spaces" card), menu drawer (filter), data loader (set onboarded=true for existing users)

No backend/schema changes — everything lives in the existing user data blob.

## Out of scope (ask before adding)

- Saving theme/username to a server-side profile table
- Per-space onboarding (e.g. "tell us your monthly income now")
- A guided tour with tooltips on the actual dashboard
