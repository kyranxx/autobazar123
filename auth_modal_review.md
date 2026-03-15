# AuthModal — Review & Improvement Suggestions

Overall the modal is well-structured: clean state machine via `useReducer`, good separation of controller / view components, proper CSRF on API calls, keyboard handling, and body-scroll lock. It already looks quite polished in the screenshots. Below are the things I'd improve, sorted roughly by impact.

---

## 🟥 Functional / Security Issues

### 1. `createClient()` is called on every render
[AuthModal.tsx:L202](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#L202)

```tsx
const supabase = createClient(); // inside the hook body
```

This creates a new Supabase client instance on **every re-render**. If `createClient` is cheap/memoized internally this is fine, but if not, it's wasted work and could leak listeners. Wrap it in a `useMemo` or, even better, pull it from a shared singleton/context.

### 2. Email is not trimmed before submission
Users often copy-paste emails with trailing spaces. None of the three submit handlers ([handleLogin](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#270-313), [handleRegister](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#314-382), [handleResetPassword](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#427-468)) trim the email. A stray space causes silent auth failures that are very confusing.

```diff
- email: state.email,
+ email: state.email.trim(),
```

### 3. No rate-limiting / abuse guard on login & reset
Registration has a cooldown on resend, but **login** and **password-reset** have none. A user (or bot) can rapid-fire those endpoints. Consider a simple client-side debounce + server-side protection.

### 4. [handleGoogleLogin](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#469-496) doesn't set loading state
All email-based flows set `loading` → `true`, but the Google button doesn't. If the OAuth URL takes a moment, the user has no feedback and can click again.

---

## 🟧 UX / Design Issues

### 5. Login inputs are `h-14` but register inputs are `h-11` — feels inconsistent
Login and reset use tall `h-14` fields; registration uses compact `h-11`. Since login has only two fields while register has four + checkboxes, the compactness makes sense for fitting everything, but switching between views feels inconsistent. Consider **`h-12`** for both login and register as a middle ground.

### 6. The branded side panel text is hardcoded in Slovak
[AuthModal.tsx:L601-L627](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#L601-L627)

All the text inside [BrandedPanel](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#578-632) and [MobileBrandStrip](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#635-675) (e.g. *"Nájdite vaše vysnívané auto"*, *"Overení predajcovia"*) is hardcoded rather than going through `useTranslations`. Since the app already supports EN/HU locales, this panel would appear in Slovak regardless of user language.

### 7. Password confirmation field doesn't toggle visibility
The main password field has a show/hide eye icon, but the confirm-password field does not. The user can't visually verify what they typed in the confirm field, which increases registration friction.

### 8. No transition / animation between views
Switching from login → register → reset instantly replaces content. A subtle crossfade or slide would feel more polished and help users orient themselves.

### 9. Checkbox styling relies on browser default + `accent-accent`
The terms and dealer-intent checkboxes use the browser's native checkbox renderer. A custom styled checkbox (or the `accent-color` CSS approach paired with better visual feedback) would be more consistent with the premium design language.

---

## 🟨 Code Quality / Maintainability

### 10. 1300+ line single-file component
The file is at 1323 lines and mixes:
- State management (reducer, derived state, effects)
- API handlers
- 6 different sub-components
- Inline SVG icons

This is manageable today but getting heavy. Extracting to a folder would improve discoverability:

```
AuthModal/
  index.tsx          — main export + layout
  useAuthModal.ts    — hook (reducer + handlers)
  LoginForm.tsx
  RegisterForm.tsx
  ResetForm.tsx
  VerifyView.tsx
  BrandedPanel.tsx
  shared.tsx         — InputIcon, Spinner, GoogleIcon, pushClass
```

### 11. `t` function is threaded through every component prop
Every child takes a `t` prop. Since `useTranslations` is available as a hook, each sub-component could call it directly, removing the prop-drilling.

### 12. Password strength logic is duplicated
[getPasswordStrength](file:///c:/Users/User/Desktop/Projects/autobazar123/src/components/AuthModal.tsx#130-146) re-implements the same checks (`MIN_PASSWORD_LENGTH`, letters, digits) that the individual booleans `hasMinLength` / `hasLetterAndNumber` also compute. A single source-of-truth object would be cleaner:

```ts
function analyzePassword(pw: string) {
  const hasMinLength = pw.length >= MIN_PASSWORD_LENGTH;
  const hasLetterAndNumber = /[A-Za-z]/.test(pw) && /\d/.test(pw);
  const strength = !pw ? null
    : pw.length >= 10 && hasLetterAndNumber ? "strong"
    : hasMinLength && hasLetterAndNumber ? "medium"
    : "weak";
  return { hasMinLength, hasLetterAndNumber, strength };
}
```

### 13. Inline styles mixed with Tailwind classes
Some elements use `style={{ paddingLeft: "3rem" }}` while the rest is Tailwind. These could be `pl-12` class equivalents for consistency.

### 14. `pushClass` string is concatenated into className
The `pushClass` constant is manually interpolated into `className` strings. A utility approach (like `cn()` / `clsx()`) avoids subtle whitespace issues and is easier to read.

---

## 🟩 Minor / Polish

| # | Observation | Suggestion |
|---|---|---|
| 15 | `ArrowLeft` icon in register's "back to login" and reset's "back to login" are identical but defined separately | No code change needed, just confirming this is fine as-is |
| 16 | The footer is **hidden** on the reset view (no footer content rendered) | Consider showing "← Back to login" in the footer for consistency, or adding a "Don't have an account? Register" link |
| 17 | `data-testid` attributes are only on a few elements | If you plan E2E tests, add them to the submit buttons and form containers too |
| 18 | No `aria-describedby` on password fields pointing to the strength hints | Screen readers won't announce the checklist items as field descriptions |
| 19 | `loginEmailRef` type uses `useRef<HTMLInputElement>` which is the correct pattern, but `null` init argument is missing — actually it's there ✓ | No change needed |

---

## Summary — Priority Picks

If I were to pick the **top 5 changes** to make right now:

1. **Trim emails** before submission (bug-class fix, 1 min)
2. **Set loading state on Google login** (UX fix, 1 min)
3. **Add eye toggle to confirm-password** (reduces registration drop-off)
4. **Extract i18n for the branded panel** (avoids SK-only text for multi-locale users)
5. **Add a subtle view transition animation** (big polish payoff for small effort)

Want me to implement any or all of these?
