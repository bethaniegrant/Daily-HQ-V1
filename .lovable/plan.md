## Goal

1. Nobody can create a Daily HQ account unless they've paid $10 (via a Stripe Payment Link).
2. After signup, users have **48 hours** to verify their email. Until then, they get full access. After 48h, they're locked out of `/app` with a "Verify your email" screen until they click the link.

---

## Part 1 — Payment-gated signup

### Flow
```text
Buyer clicks Stripe Payment Link → pays $10
   ↓
Stripe webhook hits /api/public/stripe/webhook
   ↓
Webhook verifies signature → creates invite_tokens row + purchases row
   ↓
Email goes to buyer with link: https://cozy-web-edit.lovable.app/auth?token=<token>
   ↓
Buyer clicks link → signup form pre-filled → account created → token redeemed
```

### What I'll build

1. **Enable Lovable's built-in Stripe** (test mode immediately, live after verification).
2. **Create a $10 one-time product** in Stripe and generate a **Payment Link** that:
   - Collects buyer email.
   - Sends a `checkout.session.completed` webhook to `/api/public/stripe/webhook`.
3. **New server route** `src/routes/api/public/stripe/webhook.ts`:
   - Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`.
   - On `checkout.session.completed`, inserts `purchases` row + `invite_tokens` row (90-day expiry, email pre-bound).
   - Emails the buyer the invite link via Lovable Emails.
4. **Lock down the auth page** (`src/routes/auth.tsx`):
   - Sign-up tab is **disabled unless `?token=...` is present and valid** (logic already exists — I'll just remove the email-only fallback so there's no way around it).
   - Add a clear "Don't have an account? Purchase access →" link pointing to the Stripe Payment Link.
5. **Disable open signups in Supabase Auth** as belt-and-suspenders. Google OAuth stays on, but new Google accounts will also require a valid invite token (handled in `_authenticated/route.tsx` — if no `user_roles` row, sign them out with a "Purchase required" message).
6. **Email**: set up Lovable Emails infra + a transactional template for the purchase receipt + invite link. (Needs a verified sender domain — I'll prompt you to add one via the email setup dialog.)

### Secrets needed
- `STRIPE_WEBHOOK_SECRET` (you paste from Stripe dashboard after I give you the webhook URL).
- Stripe API key is handled by the built-in integration.

---

## Part 2 — 48-hour email verification grace period

### Approach
Supabase's email confirmation is binary (confirmed/not). To get "access for 48h, then block," we keep email confirmation **required** at the provider level but allow the session to exist before confirmation, and enforce the 48h cutoff ourselves in the route gate.

### What I'll build

1. **Migration**: add `email_verified_deadline timestamptz` to `profiles`. Default = `created_at + 48 hours`. Update `handle_new_user` trigger to set it on signup.
2. **Auth config**: leave email confirmation **on** (Supabase will still send the confirmation email). Do NOT enable auto-confirm.
3. **Modify signup flow** (`src/routes/auth.tsx`):
   - After `signUp`, if no session is returned (because confirmation is required), immediately call `signInWithPassword` to create a session anyway. The user is now signed in despite being unconfirmed.
4. **Modify `_authenticated/route.tsx`** gate:
   - After session check, read `auth.user.email_confirmed_at` and `profile.email_verified_deadline`.
   - If `email_confirmed_at` is null AND `now > deadline` → redirect to `/verify-email`.
   - Otherwise let them through. If unconfirmed but within grace period, set a context flag `needsVerification: true`.
5. **New route** `src/routes/verify-email.tsx` (public): shows "Check your inbox," with a "Resend verification email" button (`supabase.auth.resend`).
6. **Banner in `_authenticated/app.tsx`**: when `needsVerification`, show a dismissible banner with countdown ("X hours left to verify your email — Resend").
7. **Verification redirect target**: the existing `emailRedirectTo: ${origin}/app` keeps working — once they click the link, `email_confirmed_at` is set and the gate stops blocking.

---

## Technical notes

- `invite_tokens.email` is already pre-bindable; the webhook will set it so the wrong person can't redeem someone else's link.
- Google sign-in users skip the email-verification logic entirely (Google emails are pre-verified). The purchase gate still applies via the `_authenticated` route check.
- Webhook route lives under `/api/public/` so it bypasses Lovable auth; signature verification is the security boundary.
- All Stripe SDK calls happen server-side in the webhook handler — no Stripe code in the browser.

---

## Order of operations after you approve

1. Enable built-in Stripe → you fill out the merchant form.
2. Set up email domain (you point DNS) → I scaffold transactional email templates.
3. Run DB migration (add `email_verified_deadline`, update trigger).
4. Write the webhook route + invite email.
5. Lock down `auth.tsx` and add purchase CTA.
6. Update `_authenticated` gate + add `/verify-email` page + banner.
7. You create the $10 Payment Link in Stripe and paste the webhook URL + secret.
8. Test end-to-end in Stripe test mode before going live.

## Open question

Do you already have a **sender email domain** (e.g. `dailyhq.com` or `bethanierose.com`) you want invite emails to come from? If not, we either need to set one up (DNS records on a domain you own) or fall back to a generic Lovable sender — let me know which.
