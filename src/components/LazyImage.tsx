'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface LazyImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  threshold?: number;
  rootMargin?: string;
}

/**
 * LazyImage component that defers loading until visible
 * Uses Intersection Observer for better performance
 */
export function LazyImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  onLoad,
  threshold = 0.01,
  rootMargin = '50px',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

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
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [src, threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div ref={ref} className={fill ? 'absolute inset-0' : ''}>
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
    </div>
  );
}
