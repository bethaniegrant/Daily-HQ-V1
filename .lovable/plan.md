## Changes to `public/whole-life.html`

### 1. Remove "About this app"
Delete the `ToolRow` for "About this app" in `MoreHub` (line 267).

### 2. Replace bottom tab bar with hamburger menu
- Remove the fixed bottom tab bar `<div>` (lines 129–140) and the `paddingBottom: 78` on the wrapper (line 126).
- Add a fixed hamburger button in the top-left corner (over the dark header area, white icon, ~44px tap target, `position: fixed`, `top: 14`, `left: 14`, `zIndex: 50`).
- Add a slide-in drawer (`position: fixed`, left side, ~280px wide, full height, `PAPER` background, slides in from `translateX(-100%)`), plus a dimmed backdrop that closes the menu on tap. Animate with the existing `.fade` style language.
- New state `const [menuOpen, setMenuOpen] = useState(false);` in the root component.

### 3. Full navigation in the menu
The drawer lists every destination currently reachable from the home dashboard and the hubs, grouped:

- **Home** → `go("home")`
- **Money**
  - Paycheck Budget → `go("money","budget")`
  - Debt Payoff → `go("money","budget")`
  - Sinking Funds → `go("money","budget")`
- **Health**
  - Medications → `go("health","meds")`
  - Workouts → `go("health","workouts")`
  - Meal Plan → `go("health","meals")`
  - Mood → opens the mood block (same logic as `HealthHub`)
- **Plan**
  - Habits → `go("plan","habits")`
  - Monthly Goals → `go("plan","goals")`
  - Your spaces (list `d.blocks` dynamically) → `go("plan","block:"+id)`
- **More**
  - Add a space → `go("plan")`

Each item uses the existing icon + color tokens (`WalletIcon/AMBER`, `PillIcon/PLUM`, etc.) for visual consistency with the hubs. Selecting any item closes the drawer.

### Out of scope
No changes to hub pages themselves, data model, styling tokens, or the React/Babel-CDN setup. The `MoreHub` page stays (still reachable via the menu's "More" group header if useful) but loses "About this app".
