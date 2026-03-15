type ViewTransitionHandle = {
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>,
  ) => ViewTransitionHandle;
};

interface StartViewTransitionOptions {
  enabled?: boolean;
}

function canStartViewTransition(enabled: boolean): boolean {
  if (!enabled || typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  return typeof (document as ViewTransitionDocument).startViewTransition === "function";
}

export function startViewTransition(
  update: () => void,
  { enabled = true }: StartViewTransitionOptions = {},
) {
  if (!canStartViewTransition(enabled)) {
    update();
    return;
  }

  try {
    const transition = (document as ViewTransitionDocument).startViewTransition?.(
      update,
    );
    void transition?.finished.catch(() => {});
  } catch {
    update();
  }
}
