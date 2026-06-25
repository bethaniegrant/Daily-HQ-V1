
## Goal
Upgrade the dashboard side panel (right of the calendar) into a tabbed "At a glance" view with **Day** and **Week** modes. Users can quick-add items (To Do or Event) directly from either view, and To Dos added here appear on the To Do page too (and vice versa).

## Side panel layout
Replace the current Today panel with a tabbed card:

```text
┌─ At a glance ────────────────┐
│ [ Day ] [ Week ]    + Add ▾  │
├──────────────────────────────┤
│ (Day or Week content)        │
└──────────────────────────────┘
```

### Day view (selected calendar date)
Single unified list, same data sources as today's panel:
- Mood tracker link (top, only when date = today)
- Events for that day
- To Do items dated to that day (checkable)
- Habits + Medications (checkable, only for today)
- Bills due that day (from recurring budget)

### Week view
Current week (Mon–Sun). Responsive:
- **Mobile**: 7 stacked rows, each day collapsible, showing counts + list
- **Desktop**: 7 columns, compact agenda style
Each day shows its events, to-dos, and bills. Tapping a day selects it in the calendar and switches to Day view. Each day has its own inline "+ Add" that targets that date.

## Quick add
"+ Add" button opens a small inline form with:
- Type toggle: **To Do** | **Event**
- Title input
- Date (defaults to selected day in Day view, or the day's row in Week view)
- Time (events only)
- Save

Behavior:
- **To Do** → writes to the same `todos` state used by the To Do page, with `date` field. Appears immediately on Day/Week glance AND on the To Do page.
- **Event** → writes to the existing `events` state used by the calendar.

## To Do ↔ glance sync
- To Do items already carry a date (or default to today). The Day glance filters to-dos by selected date; the Week glance groups by date.
- Items added from glance are normal to-dos — editable/deletable from the To Do page too.
- Checking off in glance updates the To Do page and vice versa (single source of truth in state + persisted blob).
- Existing daily rollover for unchecked to-dos remains unchanged.

## Files
- `public/whole-life.html` only. Edit `SidePanel` / `TodayList` area to introduce `GlancePanel` with `DayGlance`, `WeekGlance`, and `QuickAddForm` subcomponents. Reuse existing `todos`, `events`, `habits`, `meds`, `billsByDay` state and persistence — no schema/backend changes.

## Out of scope
- No changes to backend, auth, or other pages
- No drag-and-drop reordering
- No recurring events (bills already recur)
