import * as React from "react";

import { cn } from "@/utils/cn";

interface InputProps extends React.ComponentPropsWithRef<"input"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function normalizeFieldToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Input({
  className,
  type,
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  name,
  ref,
  ...props
}: InputProps) {
    const generatedId = React.useId();
    const normalizedLabel = label ? normalizeFieldToken(label) : undefined;
    const placeholderValue =
      typeof props.placeholder === "string" ? props.placeholder : undefined;
    const normalizedPlaceholder = placeholderValue
      ? normalizeFieldToken(placeholderValue)
      : undefined;

    const hasError = !!error;
    const needsId = Boolean(id || label || error || hint);
    const inputId = id
      ? id
      : needsId
        ? normalizedLabel
          ? `field-${normalizedLabel}`
          : normalizedPlaceholder
            ? `field-${normalizedPlaceholder}`
            : `field-${generatedId}`
        : undefined;

    // Avoid using `useId()` as a `name` fallback: in App Router + streaming SSR, the
    // generated ids can differ between server markup and client hydration, causing
    // a hydration mismatch. Prefer stable tokens derived from props instead.
    const inputName =
      name ??
      (id ? id : undefined) ??
      (normalizedLabel ? `field-${normalizedLabel}` : undefined) ??
      (normalizedPlaceholder ? `field-${normalizedPlaceholder}` : undefined);

    return (
      <div className="w-full">
        {label && inputId && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            id={inputId}
            name={inputName}
            data-slot="input"
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              hasError &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={
              inputId
                ? error
                  ? `${inputId}-error`
                  : hint
                    ? `${inputId}-hint`
                    : undefined
                : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </span>
          )}
        </div>
        {error && inputId && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && inputId && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-text-muted">
            {hint}
          </p>
        )}
      </div>
    );
}

export { Input };
