/**
 * The mark: three bars of decreasing width, converging toward a point —
 * an abstraction of what this product actually does (narrow a lot of
 * context down to what matters), not a generic lettermark. Scales cleanly
 * from favicon size to a homepage hero.
 */
export function Logo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Context Toolkit"
    >
      <rect width="32" height="32" rx="8" fill="rgb(var(--color-accent))" />
      <rect x="7" y="9" width="18" height="3.2" rx="1.6" fill="white" fillOpacity="0.95" />
      <rect x="10" y="14.4" width="12" height="3.2" rx="1.6" fill="white" fillOpacity="0.78" />
      <rect x="13" y="19.8" width="6" height="3.2" rx="1.6" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

/** Standalone mark with no background square — for contexts already on a colored surface. */
export function LogoMark({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Context Toolkit"
    >
      <rect x="3" y="9" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.95" />
      <rect x="7.5" y="15" width="17" height="4" rx="2" fill="currentColor" fillOpacity="0.75" />
      <rect x="12" y="21" width="8" height="4" rx="2" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}
