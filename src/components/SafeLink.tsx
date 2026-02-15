"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";

type SafeLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    fallbackDelayMs?: number;
  };

/**
 * `next/link` wrapper with a hard-navigation fallback.
 *
 * We've observed rare App Router stalls after heavy client interactions
 * (e.g. search refinements). When that happens, SPA navigation might never
 * commit even though the click is handled.
 *
 * This component keeps normal Link behavior but falls back to
 * `window.location.assign()` if the URL didn't change shortly after `router.push()`.
 */
export function SafeLink({
  onClick,
  fallbackDelayMs = 800,
  ...props
}: SafeLinkProps) {
  const router = useRouter();

  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);

        // Preserve native behaviors like open-in-new-tab, middle-click, etc.
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }

        const targetHref = e.currentTarget.href;
        if (!targetHref) return;

        const current = window.location.pathname + window.location.search + window.location.hash;
        const url = new URL(targetHref);
        const target = url.pathname + url.search + url.hash;

        if (target === current) return;

        e.preventDefault();
        router.push(target);

        window.setTimeout(() => {
          const next =
            window.location.pathname + window.location.search + window.location.hash;
          if (next === current) {
            window.location.assign(targetHref);
          }
        }, fallbackDelayMs);
      }}
    />
  );
}

