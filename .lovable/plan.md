## Goal
Prevent cross-device clobbers on the planner JSON doc by adding optimistic concurrency control. Last-write-wins becomes "last-write-wins only if you saw the latest version."

## Scope
All changes in `public/whole-life.html`, inside `useCloudSync`. No new tables, no schema migration, no realtime, no per-field merge.

## Where `version` lives
Store `version` as an integer field *inside* the JSON `value` of the existing `user_data` row (same row, key `"planner"`). Keeping it in JSON means zero schema change and the check is atomic with the write.

- New docs start at `version: 1`.
- Existing docs without `version` are treated as `version: 0` on first load and bumped to `1` on next save.

## Load behavior
1. Read the row as today.
2. Stash `loadedVersion = cloud.value.version ?? 0` on `ctx.current`.
3. Local/cloud reconciliation stays as-is for now; whichever value is chosen, record its `version` as `loadedVersion`. (If local-newer wins and gets pushed, that push goes through the new conditional-save path so it still respects the server version.)

## Save behavior (replaces current debounced upsert)
On each debounced save:
1. Compute `nextDoc = { ...d, version: loadedVersion + 1 }`.
2. Conditional write — switch from `upsert` to:
   ```
   client.from("user_data")
     .update({ value: nextDoc, updated_at })
     .eq("user_id", userId).eq("key", "planner")
     .eq("value->>version", String(loadedVersion))
     .select("value")
   ```
   The `value->>version` equality is the optimistic lock: the row only updates if the stored version still matches what we loaded.
3. If `data.length === 1` → success. Set `loadedVersion = nextDoc.version`. Write local cache with the new version included.
4. If `data.length === 0` → conflict (another device wrote). Run the rejection flow.
5. First-time insert (no row yet) keeps using `upsert` with `version: 1`; subsequent saves use the conditional update path.

## Rejection flow (conflict resolution)
1. Snapshot the user's current in-memory doc as `localDoc` (the in-flight edit).
2. Refetch the row: `select("value").eq(...).maybeSingle()` → `serverDoc`, `serverVersion = serverDoc.version ?? 0`.
3. Merge: start from `serverDoc`, then overlay `localDoc` on top at the **top-level key** granularity (shallow `{ ...serverDoc, ...localDoc, version: serverVersion }`). This preserves unrelated top-level sections the other device added (e.g. a med dose) while keeping the user's in-flight edit for sections they touched. This is the agreed "re-apply the user's current edit on top" — not per-field merge, just shallow overlay so the in-flight edit isn't lost.
4. Set `loadedVersion = serverVersion`, `setD(mergedDoc)` (with `skipNextSave` guard set so the merge itself doesn't trigger an immediate save), then schedule a fresh save which will write `version: serverVersion + 1` through the conditional path.
5. If the immediate re-save also conflicts (rare double-conflict), repeat once; after 2 failed attempts, log a warning and leave local state as-is so the next user edit retries.

## Local cache
`localStorage` payload becomes `{ value, updated_at, version }`. On boot, if local-wins, push uses the conditional path with `loadedVersion` derived from the cloud read so it still respects the server lock.

## Out of scope (explicit)
- No realtime subscriptions.
- No deep/per-field merge — shallow top-level overlay only, as the minimum needed to "re-apply the in-flight edit."
- No new tables or migrations.
- No UI for conflict notifications (silent recovery; `console.warn` on conflict for debugging).

## Technical notes
- Supabase JS supports `.eq("value->>version", "N")` for JSONB field equality in a conditional update. Comparing as text is fine since we control both sides.
- `.select()` on the update returns affected rows; length 0 = lock failed, length 1 = success. This is the standard OCC pattern and avoids a read-then-write race.
- Debounce stays at 800ms. The conflict flow runs inside the same debounced callback.
