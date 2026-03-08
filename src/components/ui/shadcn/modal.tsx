"use client";

import { type HTMLAttributes, type ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { cn } from "@/utils/cn";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  closeIcon?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
} as const;

export function Modal({
  className,
  open,
  onClose,
  title,
  description,
  closeIcon,
  size = "md",
  children,
  ...props
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!closeIcon}
        className={cn(sizes[size], "motion-interruptible", className)}
        {...props}
      >
        {(title || description || closeIcon) && (
          <DialogHeader className="flex-row items-start justify-between gap-4 text-left">
            <div>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              )}
            </div>
            {closeIcon && (
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close modal"
                >
                  {closeIcon}
                </button>
              </DialogClose>
            )}
          </DialogHeader>
        )}
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
