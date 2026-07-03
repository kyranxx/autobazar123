"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import {
  trackAnalyticsEvent,
} from "@/lib/analytics/client";
import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
} from "@/lib/analytics/events";

type LinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href">;

type TrackedLinkProps<Name extends AnalyticsEventName> = LinkProps & {
  children: ReactNode;
  href: string;
  analyticsEventName: Name;
  analyticsPayload: AnalyticsEventPayload<Name>;
};

export function TrackedLink<Name extends AnalyticsEventName>({
  children,
  analyticsEventName,
  analyticsPayload,
  onClick,
  href,
  prefetch = false,
  ...rest
}: TrackedLinkProps<Name>) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      {...rest}
      onClick={(event) => {
        trackAnalyticsEvent(analyticsEventName, analyticsPayload);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
