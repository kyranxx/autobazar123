"use client";

import {
  forwardRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { cn } from "@/utils/cn";

export interface DropdownProps {
  children: ReactNode;
}

export function Dropdown({ children }: DropdownProps) {
  return <DropdownMenu>{children}</DropdownMenu>;
}

export type DropdownTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const DropdownTrigger = forwardRef<
  HTMLButtonElement,
  DropdownTriggerProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuTrigger asChild>
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  </DropdownMenuTrigger>
));

DropdownTrigger.displayName = "DropdownTrigger";

export interface DropdownContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

export const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, align = "start", children, ...props }, ref) => (
    <DropdownMenuContent
      ref={ref}
      align={align}
      className={cn(
        "z-50 min-w-[160px] rounded-lg border border-border bg-background-secondary py-1 shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
    </DropdownMenuContent>
  ),
);

DropdownContent.displayName = "DropdownContent";

export interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, icon, children, ...props }, ref) => (
    <DropdownMenuItem asChild>
      <button
        ref={ref}
        className={cn(
          "w-full cursor-pointer px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover",
          className,
        )}
        {...props}
      >
        {icon && <span className="text-text-muted">{icon}</span>}
        {children}
      </button>
    </DropdownMenuItem>
  ),
);

DropdownItem.displayName = "DropdownItem";

export type DropdownSeparatorProps = HTMLAttributes<HTMLDivElement>;

export const DropdownSeparator = forwardRef<
  HTMLDivElement,
  DropdownSeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuSeparator
    ref={ref}
    className={cn("my-1 bg-border", className)}
    {...props}
  />
));

DropdownSeparator.displayName = "DropdownSeparator";
