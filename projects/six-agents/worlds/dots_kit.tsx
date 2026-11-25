// Small SVG helpers shared by the Dots (S03) and Muse (S04) worlds. Pure functions of t, world px.
import React from 'react';
import {SvgImg, bob, FONT} from './shared';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const easeIO = (q: number) => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
export const easeOut = (q: number) => 1 - Math.pow(1 - q, 3);
/** linear 0..1 from `at` over `dur` design frames */
export const ramp = (t: number, at: number, dur: number) => clamp01((t - at) / Math.max(0.001, dur));
/** decaying 1 -> 0 flash after `at` */
export const flash = (t: number, at: number, decay = 8) => (t < at ? 0 : Math.exp(-(t - at) / decay));
export const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Simple Icons glyph (24x24 box) drawn at (x, y) top-left with the given size. */
export const Si: React.FC<{icon: {path: string; hex: string}; x: number; y: number; size: number; color?: string; opacity?: number}> = ({icon, x, y, size, color, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${size / 24})`} opacity={opacity}><path d={icon.path} fill={color ?? '#' + icon.hex} /></g>
);

/** Soft layered shadow under a rounded rect (no blur filter). */
export const Shadow: React.FC<{x: number; y: number; w: number; h: number; r: number; o?: number; d?: number}> = ({x, y, w, h, r, o = 0.2, d = 26}) => (
  <g>
    {[1, 0.66, 0.33].map((k, i) => (
      <rect key={i} x={x - d * (1 - k) * 0.7} y={y + d * (1.25 - k * 0.6)} width={w + d * (1 - k) * 1.4} height={h + d * (1 - k) * 0.6} rx={r + d * (1 - k)} fill="#12041A" opacity={o * (0.28 + 0.2 * k)} />
    ))}
  </g>
);

/** Glossy panel: shadow + body + rim + top sheen. */
export const Panel: React.FC<{x: number; y: number; w: number; h: number; r?: number; fill: string; stroke?: string; sw?: number; shadow?: number; sheen?: number}> = ({
  x, y, w, h, r = 28, fill, stroke = 'rgba(255,255,255,0.4)', sw = 2.5, shadow = 0.22, sheen = 0.08,
}) => (
  <g>
    {shadow > 0 ? <Shadow x={x} y={y} w={w} h={h} r={r} o={shadow} /> : null}
    <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
    {sheen > 0 ? <rect x={x + 3} y={y + 3} width={w - 6} height={Math.min(h * 0.46, h - 6)} rx={Math.max(2, r - 3)} fill="#FFFFFF" opacity={sheen} /> : null}
    <rect x={x + sw / 2} y={y + sw / 2} width={w - sw} height={h - sw} rx={r} fill="none" stroke={stroke} strokeWidth={sw} />
  </g>
);

/** Pill with centred text. */
export const Pill: React.FC<{cx: number; cy: number; w: number; h: number; text: string; fs: number; fill: string; color?: string; stroke?: string; weight?: number; shadow?: number}> = ({
  cx, cy, w, h, text, fs, fill, color = '#FFFFFF', stroke, weight = 700, shadow = 0.2,
}) => (
  <g>
    <Panel x={cx - w / 2} y={cy - h / 2} w={w} h={h} r={h / 2} fill={fill} stroke={stroke} shadow={shadow} />
    <text x={cx} y={cy + fs * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={weight} fontSize={fs} fill={color}>{text}</text>
  </g>
);

/** A real mascot card-art tile (official square art, unaltered): white rim, shadow, gentle life. */
export const ArtTile: React.FC<{
  src: string; cx: number; cy: number; size: number; t: number; seed?: number; rot?: number; k?: number; rim?: number; life?: number; opacity?: number; rimColor?: string;
}> = ({src, cx, cy, size, t, seed = 0, rot = 0, k = 1, rim = 1, life = 1, opacity = 1, rimColor = '#FFFFFF'}) => {
  if (k <= 0.002 || opacity <= 0.002) return null;
  const b = bob(t, seed, life);
  const s = size, r = s * 0.12, pad = s * 0.028 * rim;
  return (
    <g transform={`translate(${cx} ${cy + b.dy * life}) rotate(${rot + b.rot * life}) scale(${k * b.sx} ${k * b.sy})`} opacity={opacity}>
      {rim > 0.02 ? <Shadow x={-s / 2 - pad} y={-s / 2 - pad} w={s + pad * 2} h={s + pad * 2} r={r + pad} o={0.26 * rim} d={s * 0.07} /> : null}
      {rim > 0.02 ? <rect x={-s / 2 - pad} y={-s / 2 - pad} width={s + pad * 2} height={s + pad * 2} rx={r + pad} fill={rimColor} opacity={rim} /> : null}
      <SvgImg src={src} x={-s / 2} y={-s / 2} w={s} h={s} fit="cover" radius={r} />
      <rect x={-s / 2} y={-s / 2} width={s} height={s * 0.4} rx={r} fill="#FFFFFF" opacity={0.07} />
    </g>
  );
};

/** Phone, front view (titanium frame, island, glass sheen). Children are drawn in screen-local px (0,0 = screen top-left). */
export const Phone: React.FC<{id: string; x: number; y: number; w: number; h: number; bg?: string; children?: React.ReactNode}> = ({id, x, y, w, h, bg = '#FFFFFF', children}) => {
  const bz = 16, r = w * 0.13;
  return (
    <g>
      <Shadow x={x} y={y} w={w} h={h} r={r} o={0.34} d={44} />
      <defs>
        <linearGradient id={`${id}-ti`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D9DCE3" /><stop offset="0.3" stopColor="#6B6F78" /><stop offset="0.6" stopColor="#2B2D33" /><stop offset="1" stopColor="#A4A8B1" />
        </linearGradient>
        <clipPath id={`${id}-scr`}><rect x={0} y={0} width={w - bz * 2} height={h - bz * 2} rx={r - bz} /></clipPath>
      </defs>
      <rect x={x - 5} y={y + h * 0.2} width={8} height={h * 0.07} rx={4} fill="#55585F" />
      <rect x={x + w - 3} y={y + h * 0.26} width={8} height={h * 0.11} rx={4} fill="#55585F" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-ti)`} />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx={r - 7} fill="#050506" />
      <g transform={`translate(${x + bz} ${y + bz})`}>
        <g clipPath={`url(#${id}-scr)`}>
          <rect width={w - bz * 2} height={h - bz * 2} fill={bg} />
          {children}
        </g>
        <rect x={(w - bz * 2) / 2 - w * 0.15} y={16} width={w * 0.3} height={w * 0.075} rx={w * 0.04} fill="#050506" />
        <path d={`M0 ${r} A${r - bz} ${r - bz} 0 0 1 ${r - bz} 0 H${(w - bz * 2) * 0.62} L${(w - bz * 2) * 0.2} ${(h - bz * 2) * 0.42} H0 Z`} fill="#FFFFFF" opacity={0.05} />
      </g>
    </g>
  );
};

/** Tick mark centred on (0,0), size = circle radius. */
export const Tick: React.FC<{cx: number; cy: number; r: number; k?: number; fill?: string}> = ({cx, cy, r, k = 1, fill = '#22C55E'}) => (
  k <= 0.002 ? null : (
    <g transform={`translate(${cx} ${cy}) scale(${k})`}>
      <circle r={r} fill={fill} />
      <path d={`M${-r * 0.45} ${r * 0.02} L${-r * 0.12} ${r * 0.36} L${r * 0.48} ${-r * 0.32}`} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.22} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
);
