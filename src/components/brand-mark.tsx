import React from 'react';
import logoSrc from '../assets/logo.png';

export function BrandMark({
  size = 44,
  className = '',
  alt = 'ZenixMind official logo'
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <div
      aria-label={alt}
      className={`relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={logoSrc}
        alt={alt}
        className="h-full w-full object-contain pointer-events-none"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
