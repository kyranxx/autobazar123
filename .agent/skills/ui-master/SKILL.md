---
name: ui-master
description: Unified UI/UX principles combining AGENTS.txt and ibelick/ui-skills.
---

# UI Master Principles

This skill combines the project-specific `AGENTS.txt` rules and the `ibelick/ui-skills` (Baseline-UI, Accessibility, Motion Performance) into a single directive for building high-quality, accessible, and high-performance interfaces.

## 1. Interaction & Accessibility (Critical)
- **Keyboard**: MUST have full keyboard support. Visible focus rings (`:focus-visible`). Management of focus (trap, move, return).
- **Targets**: Hit target ≥24px (mobile ≥44px).
- **Forms**: Hydration-safe inputs. NEVER block paste. Loading buttons show spinner + label. Enter submits. Errors inline next to fields.
- **Accessible Names**: Every control MUST have an accessible name. Icon-only buttons MUST have `aria-label`. Decorative icons `aria-hidden`.
- **Semantics**: Prefer native elements (`button`, `a`, `label`). Use `ul`/`ol` for lists. No skipped heading levels.

## 2. Animation & Motion
- **Compositor Only**: Animate ONLY `transform` and `opacity`. NEVER animate layout props (`width`, `height`, `top`, `left`, `margin`, `padding`).
- **Timing**: Interaction feedback <200ms.
- **Accessibility**: Honor `prefers-reduced-motion`. Pause looping animations off-screen.
- **Gradients/Blur**: KEEP blur small (<=8px). NEVER animate large blur or backdrop-filter surfaces.

## 3. Layout & Typography
- **Structure**: Use `size-*` for square elements. Use `h-dvh` instead of `h-screen`.
- **Typography**: MUST use `text-balance` for headings. MUST use `tabular-nums` for data.
- **Aesthetics (Brutalist Premium)**: High contrast, pure black/white, vibrant lime (#c4ff00). Sharp corners (`rounded-sm`). Bold borders (2px+). Heavy "hard" shadows.
- **SAFE AREAS**: MUST respect `env(safe-area-inset-*)`.

## 4. Performance
- **Hydration**: Guard date/time against mismatch. Truncate/line-clamp dense UI.
- **Images**: Preload above-fold; lazy-load rest. Prevent CLS with explicit dimensions.
- **Reads/Writes**: Batch DOM reads before writes. NEVER interleave reads and writes in one frame.

## 5. Implementation Rules
- **CN Utility**: MUST use `cn` utility (`clsx` + `tailwind-merge`).
- **Primitives**: MUST use existing project primitives first.
- **Empty States**: Give clear next action.
- **Confirmations**: MUST confirm destructive actions or provide Undo.
