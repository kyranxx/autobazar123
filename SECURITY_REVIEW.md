# 🔒 Security Review — Autobazar123

**Date:** 2026-02-17
**Repository:** kyranxx/autobazar123
**Reviewer:** GitHub Copilot

---

## 🔴 High Severity Issues

### 1. Health Endpoint Leaks Infrastructure Configuration Status (Information Disclosure)

**File:** `src/app/api/health/route.ts`

**Problem:** The `/api/health` endpoint is unauthenticated and exposes whether Stripe, email, and database are configured, plus server uptime. This gives attackers a fingerprint of your infrastructure and tells them when the server last restarted.

```typescript
stripe: {
  status: process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured",
},
email: {
  status: process.env.EMAIL_PROVIDER ? "ok" : "unconfigured",
},
uptime: process.uptime(),
```

**Fix:** Restrict the detailed health check to admin users, or return only a generic `"ok"` / `"error"` to unauthenticated callers.

---

### 2. Race Condition in Credit Balance Updates (TOCTOU)

**File:** `src/app/api/stripe/webhook/route.ts`

**Problem:** The credit balance is read, computed in JavaScript, then written back. If two webhook events fire near-simultaneously for the same user, one update will overwrite the other (lost update). This is a classic Time-of-Check-to-Time-of-Use (TOCTOU) vulnerability.

```typescript
const currentBalance = profile?.credit_balance || 0;
const newBalance = currentBalance + creditsToAdd;

const { error: updateError } = await supabaseAdmin
  .from("profiles")
  .update({ credit_balance: newBalance })
  .eq("id", userId);
```

**Fix:** Use an atomic SQL update: `UPDATE profiles SET credit_balance = credit_balance + $credits WHERE id = $userId`, or wrap the read+write in a database transaction/stored procedure with row-level locking.

---

### 3. Rate Limiting Fails Open When Redis is Unavailable

**File:** `src/lib/ratelimit.ts`

**Problem:** Both `checkRateLimit` and `checkStrictRateLimit` silently allow all requests if Redis is down or misconfigured. An attacker who can cause Redis to be unavailable (or if it's simply not configured) can bypass all rate limits, enabling brute-force attacks on login, checkout, and maintenance unlock endpoints.

```typescript
if (!limiter) {
  return { success: true, limit: 100, remaining: 100, reset: 0 };
}
// ...
catch (error) {
  // On error, allow the request (fail open)
  return { success: true, limit: 100, remaining: 100, reset: 0 };
}
```

**Fix:** For sensitive operations (`checkStrictRateLimit`), consider failing closed — deny the request if the rate limiter is unavailable. At minimum, add monitoring/alerting when rate limiting is disabled.

---

## 🟠 Medium Severity Issues

### 4. Client-Side `userId` Sent in Checkout Request Body

**File:** `src/app/kredity/CreditsPageClient.tsx`

**Problem:** The client sends `userId` in the request body. Although the checkout route appears to use the server-side session to determine the actual user, including `userId` from the client is a code smell. If any path trusts this client-provided value, an attacker could purchase credits for another user.

```tsx
body: JSON.stringify({
  packId: pack.id,
  userId: user.id, // ← sent from client
}),
```

**Fix:** Remove `userId` from the client payload entirely — always derive it from the authenticated session server-side.

---

### 5. Inconsistent `dangerouslySetInnerHTML` Escaping

**Files:** `src/app/auto/[id]/page.tsx`, `src/components/JsonLd.tsx`

**Problem:** The car detail page escapes `</` in JSON-LD via `.replace(/</g, "\\u003c")`, but `JsonLd.tsx` does not perform this escaping. If database-sourced values contain malicious content, the unescaped path could allow script injection.

```tsx
// ✅ page.tsx — escapes
dangerouslySetInnerHTML={{
  __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
}}

// ❌ JsonLd.tsx — does NOT escape
dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
```

**Fix:** Apply the `</` escaping consistently in all `dangerouslySetInnerHTML` JSON-LD blocks, or use a shared utility function.

---

### 6. Maintenance Bypass Cookie is a Static Boolean

**File:** `src/app/api/maintenance/unlock/route.ts`

**Problem:** The maintenance bypass cookie value is just `"true"`. Anyone who knows the cookie name can set it manually in their browser to bypass maintenance mode without knowing the password.

```typescript
response.cookies.set({
  name: "maintenance_bypass",
  value: "true", // ← static, forgeable value
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
});
```

**Fix:** Use a signed/encrypted token (e.g., an HMAC of a timestamp + a server secret) as the cookie value, and verify the signature server-side.

---

### 7. Cloudflare Worker Passes Secret via Query Parameter

**File:** `cloudflare-worker/src/index.ts`

**Problem:** The cron secret is passed as a URL query parameter. Query parameters are often logged in server access logs, CDN logs, and browser history, potentially exposing the secret.

```typescript
const secret = url.searchParams.get('secret');
if (secret !== env.CRON_SECRET) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Fix:** Accept the secret via an `Authorization` header (e.g., `Bearer <secret>`) instead of a query parameter.

---

## 🟡 Low Severity / Best Practice Issues

### 8. XSS Sanitization is Regex-Based (Incomplete)

**File:** `src/schemas/index.ts`

**Problem:** The regex `/<[^>]*>/g` strips basic HTML tags, but can be bypassed with malformed HTML (e.g., `<img src=x onerror=alert(1)` without closing `>`).

```typescript
export const SanitizedTextSchema = z
  .string()
  .transform((val) => val.replace(/<[^>]*>/g, "").trim());
```

**Fix:** Use a proper HTML sanitizer library like `DOMPurify` (via `isomorphic-dompurify`) or `sanitize-html`.

---

### 9. Client-Side Admin Check — Verify RLS

**File:** `src/context/AuthContext.tsx`

**Problem:** The client-side admin check queries `site_admins` directly from the browser Supabase client. If RLS on `site_admins` is not restrictive, any user could read this table.

```tsx
const { data, error } = await supabase
  .from("site_admins")
  .select("user_id")
  .eq("user_id", userId)
  .single();
setIsAdmin(!error && !!data);
```

**Fix:** Verify that `site_admins` has a `SELECT` RLS policy restricted to the user's own row (`auth.uid() = user_id`), not a public read policy.

---

## ✅ Things Done Well

| Area | Status |
|------|--------|
| Stripe webhook signature verification | ✅ Properly verified with `constructEvent` |
| Security headers (CSP, HSTS, X-Frame-Options, etc.) | ✅ Comprehensive |
| Row-Level Security on database tables | ✅ Enabled on all key tables |
| Server-side RBAC in admin actions | ✅ `requireAdmin()` checks |
| Rate limiting on sensitive endpoints | ✅ Applied to checkout, maintenance, etc. |
| Timing-safe comparison for maintenance password | ✅ Uses `timingSafeEqual` |
| Idempotency in payment processing | ✅ Duplicate detection via unique constraints |
| Session timeout (30 min inactivity) | ✅ Implemented |
| Secrets in env vars (not hardcoded) | ✅ No hardcoded secrets found |
| `poweredByHeader: false` | ✅ Reduces fingerprinting |
| MFA support | ✅ TOTP enrollment for admins |

---

## 📋 Prioritized Action Plan

| Priority | Issue | Severity |
|----------|-------|----------|
| 1 | Fix credit balance race condition — use atomic SQL updates | 🔴 High |
| 2 | Make strict rate limiting fail closed | 🔴 High |
| 3 | Restrict health endpoint — don't expose infra details publicly | 🔴 High |
| 4 | Sign the maintenance bypass cookie | 🟠 Medium |
| 5 | Remove client-side `userId` from checkout request body | 🟠 Medium |
| 6 | Use consistent JSON-LD escaping in all `dangerouslySetInnerHTML` | 🟠 Medium |
| 7 | Move cron secret from query param to Authorization header | 🟠 Medium |
| 8 | Replace regex HTML sanitization with proper sanitizer library | 🟡 Low |
| 9 | Verify `site_admins` RLS policy restricts reads | 🟡 Low |