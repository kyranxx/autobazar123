/**
 * Hook for lazy loading images using Intersection Observer
 * Automatically defers image loading until element is visible
 */

import { useEffect, useRef, useState } from "react";

interface UseImageLazyLoadOptions {
  threshold?: number | number[];
  rootMargin?: string;
}

export function useImageLazyLoad(
  src: string,
  options: UseImageLazyLoadOptions = {},
) {
  const ref = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const { threshold = 0.01, rootMargin = "50px" } = options;

  useEffect(() => {
    const element = ref.current;
    // Skip if already loaded or no ref
    if (imageSrc || !element) {
      return;
    }

    // Check if Intersection Observer is supported
    if (!("IntersectionObserver" in window)) {
      // Fallback: load immediately if not supported
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Fallback for unsupported browsers
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [src, imageSrc, threshold, rootMargin]);

  return {
    ref,
    src: imageSrc,
    isLoading,
    setIsLoading,
  };
}
