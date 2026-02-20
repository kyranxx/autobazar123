# 🔒 Security Review — Autobazar123

**Last Updated:** 2026-02-20
**Repository:** kyranxx/autobazar123
**Reviewer:** GitHub Copilot
**Audit Round:** 2 (post-remediation re-check)

---

## 📊 Executive Summary

The original audit (2026-02-17) identified 9 security issues. A remediation pass was completed and all 9 items were marked as resolved in `tasks/todo.md`. This second audit **confirms that 7 of 9 original issues are fully fixed**. Two partial issues remain, plus **5 new findings** discovered during deeper analysis.

| Category | Fixed | Remaining | New |
|----------|-------|-----------|-----|
| 🔴 High | 3/3 | 0 | 0 |
| 🟠 Medium | 3/4 | 1 (partial) | 3 |
| 🟡 Low | 1/2 | 1 (partial) | 2 |
| **Total** | **7/9** | **2** | **5** |

---

## ✅ Confirmed Fixed (Original Issues)

### ~~1. Health Endpoint Leaks Infrastructure Details~~ → FIXED ✅

**File:** `src/app/api/health/route.ts`
**Status:** Non-admin callers now receive only `{ status, timestamp }`. Detailed checks (Stripe, email, DB latency, uptime) are gated behind `isAdminRequest()`.

### ~~2. Race Condition in Credit Balance Updates (TOCTOU)~~ → FIXED ✅

**File:** `src/app/api/stripe/webhook/route.ts`
**Status:** Credit top-ups now use an atomic RPC function `process_stripe_credit_topup` that runs within a single database transaction. Duplicate detection via `stripe_payment_id` unique constraint also prevents double-crediting.

### ~~3. Strict Rate Limiting Fails Open~~ → FIXED ✅

**File:** `src/lib/ratelimit.ts` → `checkStrictRateLimit()`
**Status:** When Redis is unavailable, `checkStrictRateLimit` now correctly returns `success: false` (fails closed). This protects checkout, maintenance unlock, and other sensitive endpoints.

### ~~4. Client-Side `userId` in Checkout Payload~~ → FIXED ✅

**File:** `src/app/kredity/CreditsPageClient.tsx`
**Status:** The checkout request body now only sends `{ packId }`. The user ID is derived server-side from the authenticated session.

### ~~5. Inconsistent JSON-LD Escaping~~ → FIXED ✅

**Files:** `src/components/JsonLd.tsx`, `src/app/auto/[id]/page.tsx`, `src/lib/seo/json-ld.ts`
**Status:** A shared `serializeJsonLd()` utility now handles `<` → `\u003c` escaping. All JSON-LD outputs (organization, website, breadcrumb, vehicle) use this utility consistently.

### ~~6. Maintenance Bypass Cookie is Static Boolean~~ → FIXED ✅

**File:** `src/app/api/maintenance/unlock/route.ts`, `src/lib/security/maintenance-bypass.ts`
**Status:** The bypass cookie now contains an HMAC-SHA256 signed token with an expiration timestamp. Verification uses constant-time comparison.

### ~~7. Cloudflare Worker Secret via Query Parameter~~ → FIXED ✅

**File:** `cloudflare-worker/src/index.ts`
**Status:** The cron secret is now extracted from the `Authorization: Bearer <token>` header. The comparison also uses a constant-time equality check (`constantTimeEqual`).

---

## 🟡 Partially Fixed (Original Issues)

### 8. XSS Sanitization — Regex Replaced, but Contact Form Bypasses It

**Original issue:** Regex-based HTML stripping in `SanitizedTextSchema`.
**Status:** The schema layer now uses `sanitize-html` via `sanitizePlainText()` — this is **FIXED** for ad creation flows (description, inquiries).

**Remaining gap:** The contact form (`src/app/kontakt/ContactFormClient.tsx`) inserts user data directly into `contact_messages` without running it through any Zod schema or sanitization:

```tsx
// src/app/kontakt/ContactFormClient.tsx — Line 84-90
const { error } = await supabase.from("contact_messages").insert({
  name: formData.name,       // ← unsanitized
  email: formData.email,     // ← unsanitized
  subject: formData.subject,
  message: formData.message, // ← unsanitized
  status: "new",
});
```

**Risk:** 🟡 Low-Medium — If an admin dashboard renders these messages with `dangerouslySetInnerHTML` or without escaping, stored XSS is possible.

**Fix:** Run `name` and `message` through `sanitizePlainText()` before inserting:

```typescript
import { sanitizePlainText } from "@/lib/security/sanitize-text";

const { error } = await supabase.from("contact_messages").insert({
  name: sanitizePlainText(formData.name),
  email: formData.email,
  subject: formData.subject,
  message: sanitizePlainText(formData.message),
  status: "new",
});
```

---

### 9. `site_admins` RLS — Verified, but Needs Explicit Documentation

**Original issue:** Verify that `site_admins` has restrictive RLS.
**Status:** An RLS policy was added in migration `20260129_fix_credits_and_security.sql`, and `tasks/todo.md` marks this ✅. However, the migration file should be verified against the actual remote database to confirm it's applied.

---

## 🆕 New Issues Found (Second Audit)

### NEW-1. 🟠 Regular Rate Limiting (`checkRateLimit`) Still Fails Open

**File:** `src/lib/ratelimit.ts` → `checkRateLimit()` (not `checkStrictRateLimit`)

**Problem:** While the strict rate limiter was correctly fixed to fail closed, the regular rate limiter used for proxy-level protected route throttling still allows all requests when Redis is unavailable:

```typescript
// src/lib/ratelimit.ts — Lines 62-78
if (!limiter) {
  return { success: true, limit: 100, remaining: 100, reset: 0 };
}
// ...
catch (error) {
  console.error("Rate limit check failed:", error);
  return { success: true, limit: 100, remaining: 100, reset: 0 };
}
```

**Risk:** 🟠 Medium — This is used in `src/proxy.ts` for all protected routes (admin, dealer, authenticated). If Redis goes down, rate limiting is completely disabled for these routes.

**Fix:** At minimum, log a critical warning. For authenticated routes, consider failing closed. Alternatively, add a fallback in-memory rate limiter:

```typescript
if (!limiter) {
  console.error("CRITICAL: Rate limiting unavailable — Redis not configured");
  // For non-strict: still allow but with warning
  return { success: true, limit: 100, remaining: 100, reset: 0 };
}
```

---

### NEW-2. 🟠 Image Upload Has No Server-Side File Validation

**Files:** `src/utils/upload.ts`, `src/app/api/images/upload-url/route.ts`

**Problem:** The image upload flow requests a direct upload URL from Cloudflare, then uploads the file directly. Neither the API route nor the client function validates:
- **File type** — no MIME type or magic byte verification
- **File size** — no maximum size enforcement
- **File count per user** — no limit on how many images a user can upload

The only validation is `accept="image/*"` on the HTML `<input>`, which is trivially bypassed.

```typescript
// src/utils/upload.ts — No validation before upload
export async function uploadImageToCloudflare(file: File): Promise<string> {
  const response = await fetch("/api/images/upload-url", { method: "POST" });
  // ... directly uploads whatever file is provided
}
```

```typescript
// src/app/api/images/upload-url/route.ts — Only checks auth, not file constraints
export async function POST(_request: NextRequest) {
  // ✅ Checks authentication
  // ❌ No file type validation
  // ❌ No file size limit
  // ❌ No per-user upload quota
}
```

**Risk:** 🟠 Medium — An attacker could upload malicious files (e.g., SVGs with embedded scripts, HTML files) or exhaust Cloudflare storage quotas with large files.

**Fix:**

```typescript
// Add to src/utils/upload.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadImageToCloudflare(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and AVIF are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }
  // ... existing upload logic
}
```

---

### NEW-3. 🟠 Proxy Leaks Internal Headers to Browser

**File:** `src/proxy.ts` — Lines 449-463

**Problem:** The middleware adds internal-use headers to all responses, which are visible to end users:

```typescript
// Visible to any browser user
supabaseResponse.headers.set("X-User-ID", userId);       // ← Leaks Supabase UUID
supabaseResponse.headers.set("X-Client-IP", ip);          // ← Echoes user's IP back
supabaseResponse.headers.set("X-Middleware-Applied", "true");
supabaseResponse.headers.set("X-RateLimit-Limit", "100"); // ← Reveals rate limit config
```

**Risk:** 🟠 Medium — `X-User-ID` exposes the internal Supabase user UUID, which could be used for targeted attacks. `X-Client-IP` confirms the user's IP (useful for fingerprinting). `X-RateLimit-Limit` reveals the rate limit ceiling.

**Fix:** Either:
- Remove these headers from external responses entirely, OR
- Only set them in development mode, OR
- Prefix with a nonce-based header that's stripped before reaching the client

```typescript
// Only set for internal use, strip before response
if (process.env.NODE_ENV === "development") {
  supabaseResponse.headers.set("X-User-ID", userId);
  supabaseResponse.headers.set("X-Client-IP", ip);
}
```

---

### NEW-4. 🟡 Algolia Sync Endpoint Uses Admin Key for Auth

**File:** `src/app/api/algolia/sync/route.ts` — Lines 52-56

**Problem:** The Algolia Admin API key (`ALGOLIA_ADMIN_KEY`) — which has full read/write/delete access to all Algolia indices — is used as the bearer token for endpoint authentication:

```typescript
const authHeader = request.headers.get("authorization");
const expectedKey = process.env.ALGOLIA_ADMIN_KEY;

if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Risk:** 🟡 Low-Medium — If this endpoint is ever compromised or logged, the attacker gets full Algolia admin access rather than just sync access.

**Fix:** Create a dedicated `ALGOLIA_SYNC_API_KEY` environment variable for endpoint auth, separate from the Algolia admin key.

---

### NEW-5. 🟡 Contact Form Direct DB Insert from Unauthenticated Client

**File:** `src/app/kontakt/ContactFormClient.tsx`

**Problem:** The contact form uses the Supabase client-side SDK to insert directly into `contact_messages` — this means the anon key is performing the insert. The rate limiting is client-side only (using `useRef`), which is trivially bypassed by calling the Supabase API directly.

```tsx
const supabase = createClient(); // ← uses anon key
const { error } = await supabase.from("contact_messages").insert({ ... });
```

Additionally, on error (line 92-95), the form shows "success" anyway:

```tsx
if (error) {
  // If table doesn't exist, just show success
  console.log("Contact form submission:", formData);
}
setStatus({ type: "success", ... }); // ← always shows success
```

**Risk:** 🟡 Low-Medium — Without server-side rate limiting, an attacker can flood the `contact_messages` table. The false-success pattern also masks real errors.

**Fix:**
1. Move contact form submission to a server action or API route with `checkStrictRateLimit`
2. Don't show success when the insert actually failed
3. Add CAPTCHA or honeypot field for spam prevention

---

## ✅ Things Done Well

| Area | Status |
|------|--------|
| Stripe webhook signature verification (`constructEvent`) | ✅ Properly verified |
| Security headers (CSP, HSTS, X-Frame-Options, etc.) | ✅ Comprehensive — dual layer (next.config.ts + proxy.ts) |
| Row-Level Security on database tables | ✅ Enabled on all key tables |
| Server-side RBAC in admin actions | ✅ `requireAdmin()` / `requireRole()` checks |
| Strict rate limiting on sensitive endpoints | ✅ Fails closed when Redis unavailable |
| Timing-safe comparison for maintenance password | ✅ Uses `timingSafeEqual` with length padding |
| Idempotency in payment processing | ✅ Duplicate detection via unique constraints + RPC |
| Atomic credit operations | ✅ `process_stripe_credit_topup` RPC function |
| Session timeout (30 min inactivity) | ✅ Implemented with event listeners |
| Secrets in environment variables | ✅ No hardcoded secrets found |
| `poweredByHeader: false` | ✅ Reduces fingerprinting |
| MFA support | ✅ TOTP enrollment for admins |
| Signed maintenance bypass token | ✅ HMAC-SHA256 with TTL |
| Proper HTML sanitization library | ✅ `sanitize-html` via `sanitizePlainText()` |
| Consistent JSON-LD escaping | ✅ `serializeJsonLd()` shared utility |
| Zod schema validation on all ad forms | ✅ Comprehensive input validation |
| Cloudflare worker auth via Authorization header | ✅ With constant-time comparison |
| Health endpoint restricted to admins | ✅ Public callers get only status/timestamp |
| Audit logging for admin actions | ✅ `admin_audit_logs` table |
| Webhook event logging | ✅ `stripe_webhook_logs` table |
| Structured application logging | ✅ `system_logs` with levels and categories |

---

## 📋 Updated Prioritized Action Plan

| # | Issue | Severity | Status | Effort |
|---|-------|----------|--------|--------|
| 1 | Image upload file validation | 🟠 Medium | NEW | 🟢 Easy |
| 2 | Proxy header information leakage | 🟠 Medium | NEW | 🟢 Easy |
| 3 | Regular rate limiting fails open | 🟠 Medium | NEW | 🟢 Easy |
| 4 | Contact form unsanitized insert | 🟡 Low-Med | Partial | 🟢 Easy |
| 5 | Contact form server-side rate limiting | 🟡 Low-Med | NEW | 🟡 Medium |
| 6 | Algolia sync auth key separation | 🟡 Low-Med | NEW | 🟢 Easy |
| 7 | CSP 'unsafe-inline' for scripts | 🟡 Low | Known limitation | 🔴 Hard |
| 8 | `SECURITY_REVIEW.md` contains stale findings | ℹ️ Info | This update fixes it | ✅ Done |
| 9 | `LINKS.md` stray bookmarks file | ℹ️ Info | Cleanup | 🟢 Easy |

---

## 📝 Notes

- **CSP 'unsafe-inline'**: Both `next.config.ts` and `proxy.ts` include 'unsafe-inline' in `script-src`. This weakens CSP but is currently required for Next.js inline scripts and third-party integrations (Stripe, Google, Clarity). Consider migrating to nonce-based CSP when Next.js support matures.
- **`LINKS.md`**: Contains personal bookmarks (Twitter links, GitHub repos, etc.) that don't belong in a production codebase. Consider removing or moving to a private document.
- **Password minimum length**: Both `src/app/api/account/password/route.ts` and the recovery route enforce a minimum of 6 characters. Consider increasing to 8+ characters with complexity requirements.
- **Duplicate migration files**: `20260206_enhance_stripe_payment_flow.sql` and `20260212210951_enhance_stripe_payment_flow_20260206.sql` appear to contain largely identical content. Verify that running both doesn't cause conflicts.