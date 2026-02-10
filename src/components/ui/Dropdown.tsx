"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  forwardRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type MutableRefObject,
  type HTMLAttributes,
} from "react";
import { cn } from "@/utils/cn";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context)
    throw new Error("Dropdown components must be used within Dropdown");
  return context;
}

export interface DropdownProps {
  children: ReactNode;
}

export function Dropdown({ children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

export type DropdownTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const DropdownTrigger = forwardRef<
  HTMLButtonElement,
  DropdownTriggerProps
>(({ className, children, onClick, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdown();
  const localRef = useRef<HTMLButtonElement | null>(null);

  // Sync local ref to context ref after render

  useLayoutEffect(() => {
    if (triggerRef && "current" in triggerRef) {
      // eslint-disable-next-line react-hooks/immutability
      (triggerRef as MutableRefObject<HTMLButtonElement | null>).current =
        localRef.current;
    }
  });

  return (
    <button
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
        className,
      )}
      onClick={(e) => {
        setOpen(!open);
        onClick?.(e);
      }}
      aria-expanded={open}
      aria-haspopup="menu"
      {...props}
    >
      {children}
    </button>
  );
});

DropdownTrigger.displayName = "DropdownTrigger";

export interface DropdownContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

export const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDropdown();
    const contentRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback(
      (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      },
      [setOpen, triggerRef],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      },
      [setOpen],
    );

    useEffect(() => {
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [open, handleClickOutside, handleKeyDown]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          (
            contentRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          "absolute z-50 mt-2 min-w-[160px] py-1",
          "bg-background-secondary border border-border rounded-lg shadow-lg",
          "animate-dropdown-in",
          align === "end" ? "right-0" : "left-0",
          className,
        )}
        role="menu"
        {...props}
      >
        {children}
      </div>
    );
  },
);

DropdownContent.displayName = "DropdownContent";

export interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, icon, children, onClick, ...props }, ref) => {
    const { setOpen } = useDropdown();

    return (
      <button
        ref={ref}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary text-left",
          "hover:bg-surface-hover transition-colors",
          "focus-visible:outline-none focus-visible:bg-surface-hover",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        role="menuitem"
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        {...props}
      >
        {icon && <span className="text-text-muted">{icon}</span>}
        {children}
      </button>
    );
  },
);

DropdownItem.displayName = "DropdownItem";

export type DropdownSeparatorProps = HTMLAttributes<HTMLDivElement>;

export const DropdownSeparator = forwardRef<
  HTMLDivElement,
  DropdownSeparatorProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("my-1 h-px bg-border", className)}
    role="separator"
    {...props}
  />
));

DropdownSeparator.displayName = "DropdownSeparator";
