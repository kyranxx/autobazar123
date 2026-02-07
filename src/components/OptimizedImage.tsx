'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  blurDataURL?: string;
  sizes?: string;
}

export function OptimizedImage({
  src,
  priority = false,
  blurDataURL,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Image
      src={src}
      loading={priority ? 'eager' : 'lazy'}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      blurDataURL={blurDataURL}
      onLoadingComplete={() => setIsLoading(false)}
      className={`transition-opacity duration-300 ${
        isLoading ? 'opacity-0' : 'opacity-100'
      } ${className}`}
      {...props}
    />
  );
}
