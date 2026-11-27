import React from 'react';
import {COLORS, FONTS} from '../config/theme';

/** Premium dark-glass surface (no backdrop-filter: cheap & deterministic). */
export const glass = (o: {radius?: number; tint?: number; edge?: number} = {}): React.CSSProperties => {
  const {radius = 18, tint = 0.72, edge = 0.1} = o;
  return {
    borderRadius: radius,
    background: `linear-gradient(160deg, rgba(38,38,42,${tint}) 0%, rgba(18,18,20,${tint + 0.1}) 55%, rgba(12,12,14,${tint + 0.15}) 100%)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,${edge + 0.05}), inset 0 0 0 1px rgba(255,255,255,${edge}), 0 30px 80px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.35)`,
    overflow: 'hidden',
    position: 'relative',
    fontFamily: FONTS.sans,
    color: COLORS.white,
  };
};

export const Card: React.FC<{w: number | string; h: number | string; style?: React.CSSProperties; children?: React.ReactNode; radius?: number; tint?: number}> = ({
  w,
  h,
  style,
  children,
  radius,
  tint,
}) => <div style={{...glass({radius, tint}), width: w, height: h, ...style}}>{children}</div>;

export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties; caps?: boolean}> = ({
  children,
  size = 14,
  color = COLORS.gray,
  weight = 500,
  style,
  caps,
}) => (
  <div
    style={{
      fontFamily: FONTS.sans,
      fontSize: size,
      color,
      fontWeight: weight,
      letterSpacing: caps ? '0.12em' : '-0.005em',
      textTransform: caps ? 'uppercase' : undefined,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Dot: React.FC<{color: string; size?: number; glow?: boolean}> = ({color, size = 8, glow}) => (
  <div style={{width: size, height: size, borderRadius: size, background: color, boxShadow: glow ? `0 0 ${size * 1.5}px ${color}` : undefined, flexShrink: 0}} />
);

export const Avatar: React.FC<{initials: string; size?: number; hue?: number}> = ({initials, size = 28, hue = 0}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      flexShrink: 0,
      background: `linear-gradient(140deg, hsl(${225 + hue}, 18%, 34%), hsl(${225 + hue}, 14%, 20%))`,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONTS.sans,
      fontSize: size * 0.38,
      fontWeight: 600,
      color: '#e4e4e7',
    }}
  >
    {initials}
  </div>
);

export const Pill: React.FC<{children: React.ReactNode; color?: string; bg?: string; size?: number}> = ({children, color = COLORS.gray, bg = 'rgba(255,255,255,0.06)', size = 12}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: `${size * 0.35}px ${size * 0.8}px`,
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: FONTS.sans,
      fontSize: size,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}
  >
    {children}
  </div>
);

/** Minimal line icons drawn in SVG (consistent 1.6px stroke). */
export const Icon: React.FC<{name: IconName; size?: number; color?: string}> = ({name, size = 18, color = 'currentColor'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

const ICONS = {
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.8M18 14.4c1.6.7 2.6 2.4 3 4.6" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M16 14.5h2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15l3.5-4 3 2.5L20 7" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  tasks: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12l2.5 2.5L16 9" />
    </>
  ),
  report: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 16v-3M12 16V9M16 16v-5" />
    </>
  ),
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </>
  ),
  chat: <path d="M5 18.5V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9L5 18.5z" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.5l2.2 11h10.5l2-8H6.3" />
      <circle cx="9" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  quote: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  repeat: (
    <>
      <path d="M17 3l3 3-3 3" />
      <path d="M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3" />
      <path d="M20 13v2a3 3 0 0 1-3 3H4" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.4 3.6 5.2 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.2-3.6-8.5s1.1-6.1 3.6-8.5z" />
    </>
  ),
} as const;
export type IconName = keyof typeof ICONS;
