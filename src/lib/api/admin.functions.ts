import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- ADMIN: stats ----------
export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: userCount }, { count: tokenCount }, { count: paidCount }, { data: recentSignups }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("invite_tokens")
          .select("*", { count: "exact", head: true })
          .is("redeemed_at", null),
        supabaseAdmin
          .from("purchases")
          .select("*", { count: "exact", head: true })
          .eq("status", "paid"),
        supabaseAdmin
          .from("profiles")
          .select("created_at")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);

    return {
      totalUsers: userCount ?? 0,
      openInvites: tokenCount ?? 0,
      paidPurchases: paidCount ?? 0,
      signupsLast7Days: recentSignups?.length ?? 0,
    };
  });

// ---------- ADMIN: list users ----------
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: authList }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const emailById = new Map<string, { email: string; last_sign_in_at: string | null }>();
    for (const u of authList?.users ?? []) {
      emailById.set(u.id, { email: u.email ?? "", last_sign_in_at: u.last_sign_in_at ?? null });
    }
    const rolesById = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = rolesById.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesById.set(r.user_id, arr);
    }

    return (profiles ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      created_at: p.created_at,
      access_revoked: p.access_revoked,
      email: emailById.get(p.id)?.email ?? "",
      last_sign_in_at: emailById.get(p.id)?.last_sign_in_at ?? null,
      roles: rolesById.get(p.id) ?? [],
    }));
  });

// ---------- ADMIN: revoke / restore access ----------
export const adminSetAccessRevoked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid(), revoked: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ access_revoked: data.revoked })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- ADMIN: list invite tokens ----------
export const adminListInviteTokens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("invite_tokens")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- ADMIN: create invite token ----------
export const adminCreateInviteToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      email: z.string().email().optional().or(z.literal("")),
      note: z.string().max(280).optional(),
      expiresInDays: z.number().int().min(1).max(365).default(30),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = randomToken();
    const expires_at = new Date(Date.now() + data.expiresInDays * 86400000).toISOString();
    const { data: row, error } = await supabaseAdmin
      .from("invite_tokens")
      .insert({
        token,
        email: data.email || null,
        note: data.note || null,
        expires_at,
        created_by: context.userId,
        source: "admin",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- ADMIN: revoke invite token ----------
export const adminRevokeInviteToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ tokenId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("invite_tokens")
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq("id", data.tokenId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- ADMIN: list purchases ----------
export const adminListPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- PUBLIC: validate token (used on signup page) ----------
export const validateInviteToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(10) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("invite_tokens")
      .select("id, email, expires_at, redeemed_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { valid: false, reason: "Invalid invite link" as const };
    if (row.redeemed_at) return { valid: false, reason: "This invite link has already been used" as const };
    if (new Date(row.expires_at).getTime() < Date.now())
      return { valid: false, reason: "This invite link has expired" as const };
    return { valid: true as const, email: row.email };
  });

// ---------- PUBLIC: auto-confirm an invited user's email ----------
// Gated by a valid, unredeemed invite token. Looks up the user by email and
// flips email_confirmed via the Auth Admin API so invited signups can skip
// the confirmation step. Paid signups (no invite token) are unaffected.
export const confirmInvitedEmail = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(10), email: z.string().email() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("invite_tokens")
      .select("id, email, expires_at, redeemed_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Invalid invite link");
    if (row.redeemed_at) throw new Error("This invite link has already been used");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("This invite link has expired");
    if (row.email && row.email.toLowerCase() !== data.email.toLowerCase()) {
      throw new Error("This invite is for a different email address");
    }

    let userId: string | null = null;
    for (let page = 1; page <= 10 && !userId; page++) {
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (listErr) throw new Error(listErr.message);
      const match = list.users.find((u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase());
      if (match) userId = match.id;
      if (list.users.length < 200) break;
    }
    if (!userId) throw new Error("Account not found");

    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (updErr) throw new Error(updErr.message);
    return { ok: true };
  });


// ---------- PUBLIC: redeem token after signup ----------
export const redeemInviteToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ token: z.string().min(10) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("invite_tokens")
      .select("id, expires_at, redeemed_at")
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Invalid invite link");
    if (row.redeemed_at) throw new Error("This invite link has already been used");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("This invite link has expired");

    const { error: updErr } = await supabaseAdmin
      .from("invite_tokens")
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: context.userId })
      .eq("id", row.id)
      .is("redeemed_at", null); // race-safe
    if (updErr) throw new Error(updErr.message);
    return { ok: true };
  });
