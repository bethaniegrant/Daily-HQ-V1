## Two changes to the dashboard day overview

Both edits are in `public/whole-life.html`, in the `DashboardCalendar` + `TimeBlocking` + `TodayList` region.

### 1. One shared selected date on the dashboard

`DashboardCalendar` already owns `selectedDay` state (line ~1944). It passes it down to the calendar and to `SidePanel` → `TodayList`. `TimeBlocking` currently keeps its own `day` state (line ~1977) with its own ‹ / today / › switcher.

Changes:
- `TimeBlocking`: remove the internal `useState` for `day`, remove `shiftDay` / `jumpToday`, and delete the ‹ label › row entirely. Accept `selectedDay` (and `setSelectedDay`, only so it can silently reset "today" if ever needed — otherwise read-only). Everything keyed off `dk = dayKey(selectedDay)` instead. When `selectedDay` changes, the card just re-renders showing that day's blocks; close any open inline editor via a `useEffect` on the date key.
- `DashboardCalendar`: pass `selectedDay` (and `setSelectedDay`) into `TimeBlocking`.
- Add ‹ date › controls to the day-overview header, inside `SidePanel`'s header when `view === "day"`:
  - `‹` shifts `selectedDay` by −1 day.
  - `›` shifts `selectedDay` by +1 day.
  - The date label (the existing `title`) becomes a button; tapping it resets to today. The existing standalone "Today" pill can go away since the label doubles as it — keep a subtle "Tap for today" hint under it when not today, matching the pattern used in the old TimeBlocking card.
  - Arrows are visible on both desktop and mobile whenever the panel is expanded and `view === "day"`. In week view the arrows are hidden (week already has its own navigation model via day pick).
- Result: one date control (in the day-overview header) drives both the day overview and the time-blocking card. No week-view detour required.

### 2. To-dos on the overview come from the same store

`TodayList` already reads to-dos through `dayBundle(d, dt)` → `bundle.todos`, which pulls straight from the single "To Do" checklist block. Toggling already writes back to that block (`toggleTodo` → `setD` on `d.blocks`), so the to-do tab reflects the change instantly. Two gaps versus the request:

a. `dayBundle`'s `todos` filter currently maps un-dated items to "today only" and dated items to their exact date. Update the filter so a to-do item is included on a given day `dt` when **any** of these are true:
   - `it.date === dayKey(dt)` (explicit date match — unchanged), or
   - `it.recurring === true` or `it.daily === true` (recurring items appear every day), or
   - `it.time` is set and the item has no `date` restriction (timed but undated ⇒ appears every day at that time), or
   - `!it.date && !it.recurring && !it.time && isToday` (existing default: un-dated items still show on today).

   This is a pure read; the to-do tab's underlying items are untouched.

b. In `TodayList`, split `todoRows` into two groups by whether the source item has `it.time`:
   - Timed to-dos merge into the same time-ordered stream that already holds events and (optionally) time blocks context. Concretely: extend the existing `eventRows` render loop into a single "Timed" list that concatenates `events` + timed todos, sorted by `start`/`time`. Checkbox for todo rows uses the existing `toggleTodo(idx)`; event rows keep their current delete button. No new editor UI.
   - Untimed to-dos render below, in the existing `taskRows` section, unchanged.

Rules honored:
- No duplication: rows read directly from `d.blocks` via `dayBundle`; `toggleTodo` mutates the same block.
- Recurring/timed items appear on every applicable day without cloning.
- Toggling from the overview updates the source to-do, so the To Do tab reflects it immediately.

### Explicit non-goals (per the request)

- No new to-do editor on the overview (Quick Add modal at the bottom is untouched).
- No drag and drop.
- No changes to the To Do tab layout.
- No notifications.

### Assumption to confirm

The current to-do item shape has `{ t, done, date? }` — there is no `recurring`/`daily` or `time` field yet. This plan reads those fields **if present** (forward-compatible) but does not add an editor to set them. Items already saved with just `{t, done}` continue to behave exactly as today. If you want an actual "daily" or "time" toggle exposed on the To Do tab, that's a separate change and not in scope here.
