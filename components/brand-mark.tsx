export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <div aria-label="ZenixMind official logo" className="shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <path
          d="M32 7c8 0 14 5 18 11 4 6 5 13 2 19-3 6-8 9-14 10l-5 1 8 7c3 3 3 6 0 8-3 2-7 1-10-1l-9-9c-5-5-7-11-5-17 2-6 7-10 13-11l5-1-8-7c-3-3-3-6 0-8 3-2 7-1 10 1l9 9c5 5 7 11 5 17-2 6-7 10-13 11l-5 1-8 8c-3 3-7 3-9 0-2-3-1-6 2-9l7-7-7-7c-5-5-7-11-5-17 2-6 8-10 14-10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M47 18c3 3 4 6 4 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="47.2" cy="18.4" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}
