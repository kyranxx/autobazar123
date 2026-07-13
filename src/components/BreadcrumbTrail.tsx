"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRightIcon } from "@/components/ui/Icons";
import type { BreadcrumbTrailItem } from "@/lib/seo/breadcrumbs";
import { cn } from "@/utils/cn";

export function BreadcrumbTrail({
  items,
  className,
}: {
  items: BreadcrumbTrailItem[];
  className?: string;
}) {
  const t = useTranslations("breadcrumbs");

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={t("ariaLabel")}
      className={cn("mb-6 text-sm", className)}
    >
      <ol className="flex min-w-0 items-center gap-2.5 overflow-x-auto pb-1 text-text-tertiary no-scrollbar">
        <li className="shrink-0 text-text-muted">{t("youAreHere")}</li>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li
              key={`${item.href ?? "current"}-${item.label}`}
              className="flex min-w-0 shrink-0 items-center gap-2.5"
            >
              {index > 0 ? (
                <span aria-hidden="true">
                  <ChevronRightIcon className="size-3 shrink-0 text-text-muted" />
                </span>
              ) : null}
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="whitespace-nowrap transition-colors hover:text-text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="max-w-[70vw] truncate font-medium text-text-primary sm:max-w-none"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
