"use client";

import Link, { type LinkProps } from "next/link";
import type React from "react";

type SafeLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

/**
 * Thin wrapper around `next/link`.
 * (This component used to include a hard-navigation fallback for rare App Router stalls.)
 */
export function SafeLink(props: SafeLinkProps) {
  return <Link {...props} />;
}
