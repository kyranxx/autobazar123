import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

type ContainerSize = "md" | "lg" | "xl";

const containerSizeClass: Record<ContainerSize, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

type BaseProps = {
  children: ReactNode;
  className?: string;
};

export function MarketplacePageShell({ children, className }: BaseProps) {
  return (
    <main className={cn("market-page min-h-screen pb-16 pt-6 sm:pb-20", className)}>
      {children}
    </main>
  );
}

export function MarketplaceContainer({
  children,
  className,
  size = "xl",
}: BaseProps & { size?: ContainerSize }) {
  return (
    <div className={cn("container-main", containerSizeClass[size], className)}>
      {children}
    </div>
  );
}

export function MarketplaceHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  stats,
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <section className={cn("market-panel market-hero px-5 py-6 sm:p-8 lg:p-10", className)}>
      {breadcrumbs ? <div className="mb-5">{breadcrumbs}</div> : null}
      <div
        className={cn(
          "grid gap-7",
          centered ? "text-center" : "lg:grid-cols-[minmax(0,1fr)_auto]",
        )}
      >
        <div className={cn("max-w-3xl", centered && "mx-auto")}>
          {eyebrow ? <p className="market-kicker">{eyebrow}</p> : null}
          <h1 className="mt-3 text-3xl font-semibold text-primary sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-base leading-7 text-secondary sm:text-lg">
              {description}
            </p>
          ) : null}
          {children}
        </div>
        {actions ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 self-start",
              centered ? "justify-center" : "lg:justify-end",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
      {stats ? <div className="mt-8">{stats}</div> : null}
    </section>
  );
}

export function MarketplaceSection({
  title,
  description,
  action,
  children,
  className,
}: BaseProps & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn("market-section", className)}>
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            {title ? <h2 className="text-2xl font-semibold text-primary">{title}</h2> : null}
            {description ? (
              <p className="mt-2 text-sm leading-6 text-secondary sm:text-base">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function MarketplaceCard({ children, className }: BaseProps) {
  return <div className={cn("market-card p-5 sm:p-6", className)}>{children}</div>;
}

export function MarketplaceArticleCard({ children, className }: BaseProps) {
  return <article className={cn("market-card p-5 sm:p-6", className)}>{children}</article>;
}

export function MarketplaceBadge({ children, className }: BaseProps) {
  return <span className={cn("market-chip", className)}>{children}</span>;
}

export function MarketplaceStatCard({
  label,
  value,
  className,
  tone = "primary",
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  tone?: "primary" | "accent" | "success";
}) {
  return (
    <div className={cn("market-stat-card", className)}>
      <p
        className={cn(
          "text-2xl font-bold",
          tone === "accent" && "text-accent",
          tone === "primary" && "text-primary",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-secondary">{label}</p>
    </div>
  );
}

export function MarketplaceLinkButton({
  href,
  children,
  className,
  variant = "primary",
  showArrow = false,
}: BaseProps & {
  href: string;
  variant?: "primary" | "secondary";
  showArrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        variant === "primary" ? "market-action-primary" : "market-action-secondary",
        className,
      )}
    >
      <span>{children}</span>
      {showArrow ? <ArrowRightIcon className="size-4 shrink-0" /> : null}
    </Link>
  );
}

export function MarketplaceIconBadge({ children, className }: BaseProps) {
  return (
    <span className={cn("market-icon-badge", className)} aria-hidden="true">
      {children}
    </span>
  );
}
