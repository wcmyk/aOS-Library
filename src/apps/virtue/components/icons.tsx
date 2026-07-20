/* Lightweight SF-Symbol-style glyphs used across the App Store sidebar & hero. */

type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function DiscoverIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3.2l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.2l-5.1 2.7.97-5.68L3.75 9.2l5.7-.83L12 3.2z" />
    </svg>
  );
}

export function ArcadeIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="9" width="18" height="10" rx="4" />
      <path d="M8 14h.01M11 14h.01M9.5 12.5v3M16 13h.01M18 15h.01" />
    </svg>
  );
}

export function CreateIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M14.5 5.5l4 4M4 20l1-4L15.5 5.5a2.1 2.1 0 013 3L8 19l-4 1z" />
    </svg>
  );
}

export function WorkIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M21 4L3 11l6.5 2.5L12 20l3-7 6-9z" />
      <path d="M21 4l-11.5 9.5" />
    </svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3c2.5 2 4 5 4 8 0 1.6-.6 3-1.6 4H9.6C8.6 14 8 12.6 8 11c0-3 1.5-6 4-8z" />
      <path d="M9.6 15l-2 3.5M14.4 15l2 3.5M12 11h.01" />
    </svg>
  );
}

export function DevelopIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M14 6.5l4.5 4.5a2 2 0 010 3l-1 1M14 6.5L10.5 3 3 10.5 6.5 14M14 6.5L6.5 14M6.5 14L4 21l7-2.5" />
    </svg>
  );
}

export function CategoriesIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function UpdatesIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3.5v10M8 10l4 4 4-4M5 19.5h14" />
    </svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.8-3.8" />
    </svg>
  );
}

export function PauseIcon(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <rect x="7" y="5" width="3.5" height="14" rx="1.4" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1.4" />
    </svg>
  );
}

export function PlayGlyph(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M8 5.5l11 6.5-11 6.5z" />
    </svg>
  );
}

export function MutedIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" fill="currentColor" stroke="none" />
      <path d="M16 9l4 6M20 9l-4 6" />
    </svg>
  );
}

export function SoundIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" fill="currentColor" stroke="none" />
      <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
    </svg>
  );
}
