## Problem

After signing in, `/app` loads but the iframe (`public/whole-life.html`) renders a blank beige screen. The console shows:

> `Uncaught SyntaxError: Failed to execute 'appendChild' on 'Node': Cannot use import statement outside a module` — thrown from `@babel/standalone`.

## Root cause

`public/whole-life.html` runs entirely in-browser via `@babel/standalone` to transpile a `<script type="text/babel" data-presets="react">` block (about 2,100 lines of JSX). The current `@babel/standalone` defaults the React preset's runtime to `"automatic"`, which emits an ESM `import { jsx as _jsx } from "react/jsx-runtime"` at the top of the transformed output. Babel then appends the transformed code as a classic `<script>` (not `type="module"`), so the browser refuses it with "Cannot use import statement outside a module". The whole planner never mounts.

This happens only after Google sign-in is successful — the auth flow is fine. The whole-life.html planner itself is broken.

## Fix

Force the React preset to use the legacy `"classic"` runtime so Babel emits `React.createElement(...)` (no ESM imports). The `text/babel` auto-runner doesn't accept preset options, so transpile manually:

In `public/whole-life.html`:

1. Change the planner `<script type="text/babel" data-presets="react">` tag to `<script type="text/plain" id="planner-src">` so Babel's auto-runner ignores it.
2. After the existing CDN script tags, add a small bootstrap `<script>` that runs once on `DOMContentLoaded`:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const src = document.getElementById('planner-src').textContent;
    const { code } = Babel.transform(src, {
      presets: [['react', { runtime: 'classic' }]],
    });
    const s = document.createElement('script');
    s.textContent = code;
    document.body.appendChild(s);
  });
</script>
```

Nothing else in the file changes.

## Verification

1. Reload `/app` on the published site after sign-in.
2. Confirm the Daily HQ planner UI renders (no blank beige screen).
3. Confirm no `SyntaxError` in the browser console.

## Out of scope

- The auth flow (sign-in is already working — logs confirm Bethanie's Google login succeeded).
- Migrating `whole-life.html` to a real build (longer-term improvement; not needed to unblock).
