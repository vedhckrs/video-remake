// shared helpers for the "loop" group (S03-S05): maths, the feed picture every screen in these scenes shows, stamps
import React from 'react';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';

export {FONT, MONO};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (q: number) => { const c = clamp01(q); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const smooth = (q: number) => { const c = clamp01(q); return c * c * (3 - 2 * c); };
export const outCubic = (q: number) => 1 - Math.pow(1 - clamp01(q), 3);
export const hash = (n: number) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

export const COL = {cyan: '#62E0FF', blue: '#3B8CFF', green: '#3FE08A', amber: '#FFB347', red: '#FF4D5E', ink: '#05070B', text: '#EAF1FF', mute: '#8FA0C2'};
const FEED_COLS: [string, string][] = [['#FF9A3D', '#FF2E6E'], ['#3DD6FF', '#2E5BFF'], ['#8CFF6B', '#12B886'], ['#FFE04D', '#FF7A00'], ['#D08DFF', '#5A31F4'], ['#FF6A9A', '#8A2EFF']];

/** gradients used by FeedPic; one per svg (g = id prefix) */
export const FeedDefs: React.FC<{g: string}> = ({g}) => (
  <>
    {FEED_COLS.map((c, j) => (
      <linearGradient key={j} id={`${g}-f${j}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={c[1]} /></linearGradient>
    ))}
  </>
);

/** The scrolling feed picture (cards with a photo, avatar, text bars). `tall` = phone column, else landscape rows. */
export const FeedPic: React.FC<{id: string; g: string; x: number; y: number; w: number; h: number; scroll: number; tall?: boolean; r?: number; bg?: string}> = ({id, g, x, y, w, h, scroll, tall = false, r = 0, bg = '#070B16'}) => {
  const k = w / (tall ? 200 : 480), rowH = tall ? 236 : 130, vh = h / k;
  const i0 = Math.floor(scroll / rowH) - 1, i1 = Math.floor((scroll + vh) / rowH) + 1;
  const rows: React.ReactNode[] = [];
  for (let i = i0; i <= i1; i++) {
    const j = ((i % 6) + 6) % 6, y0 = i * rowH - scroll + (tall ? 8 : 10), c2 = FEED_COLS[(j + 2) % 6][0];
    rows.push(tall ? (
      <g key={i}>
        <rect x={8} y={y0} width={184} height={222} rx={12} fill="#141C33" stroke="#FFFFFF" strokeOpacity={0.07} />
        <rect x={14} y={y0 + 6} width={172} height={110} rx={8} fill={`url(#${g}-f${j})`} />
        <circle cx={150} cy={y0 + 36} r={16} fill="#FFFFFF" opacity={0.75} />
        <path d={`M14 ${y0 + 116} L70 ${y0 + 62} L112 ${y0 + 96} L140 ${y0 + 76} L186 ${y0 + 116} Z`} fill="#FFFFFF" opacity={0.28} />
        <circle cx={30} cy={y0 + 136} r={11} fill={c2} />
        <rect x={48} y={y0 + 128} width={80} height={8} rx={4} fill="#F4F7FF" />
        <rect x={48} y={y0 + 142} width={50} height={5} rx={2.5} fill="#7C8AAE" />
        {[168, 150, 96].map((bw, q) => <rect key={q} x={14} y={y0 + 162 + q * 14} width={bw} height={6} rx={3} fill="#C9D3EE" />)}
        <rect x={148} y={y0 + 126} width={38} height={16} rx={8} fill="#FF3B5C" />
      </g>
    ) : (
      <g key={i}>
        <rect x={12} y={y0} width={456} height={118} rx={12} fill="#141C33" stroke="#FFFFFF" strokeOpacity={0.07} />
        <rect x={22} y={y0 + 10} width={150} height={98} rx={8} fill={`url(#${g}-f${j})`} />
        <circle cx={140} cy={y0 + 36} r={14} fill="#FFFFFF" opacity={0.75} />
        <path d={`M22 ${y0 + 108} L66 ${y0 + 60} L104 ${y0 + 92} L128 ${y0 + 74} L172 ${y0 + 108} Z`} fill="#FFFFFF" opacity={0.28} />
        <circle cx={198} cy={y0 + 24} r={13} fill={c2} />
        <rect x={220} y={y0 + 15} width={96} height={8} rx={4} fill="#F4F7FF" />
        <rect x={220} y={y0 + 29} width={56} height={5} rx={2.5} fill="#7C8AAE" />
        {[250, 222, 150].map((bw, q) => <rect key={q} x={186} y={y0 + 52 + q * 16} width={bw} height={7} rx={3.5} fill="#C9D3EE" />)}
        <rect x={400} y={y0 + 12} width={56} height={22} rx={11} fill="#FF3B5C" />
      </g>
    ));
  }
  return (
    <g>
      <clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={r} /></clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y} width={w} height={h} fill={bg} />
        <g transform={`translate(${x} ${y}) scale(${k})`}>{rows}</g>
      </g>
    </g>
  );
};

/** rubber stamp that slams in (svg, world px) */
export const SvgStamp: React.FC<{t: number; at: number; x: number; y: number; text: string; color: string; size?: number; rot?: number}> = ({t, at, x, y, text, color, size = 30, rot = -8}) => {
  if (t < at) return null;
  const s = sp(t, at, 'bouncy');
  const w = text.length * size * 0.74 + size * 1.1, h = size * 1.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${2.2 - 1.2 * s})`} opacity={Math.min(1, s * 2)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.3} fill="#05070B" fillOpacity={0.78} stroke={color} strokeWidth={size * 0.13} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={size} letterSpacing={size * 0.08} fill={color}>{text}</text>
    </g>
  );
};

/** small dark label plate with text (svg) */
export const Plate: React.FC<{x: number; y: number; text: string; size?: number; color?: string; fill?: string; anchor?: 'start' | 'middle' | 'end'; opacity?: number; mono?: boolean; weight?: number; pad?: number; stroke?: string}> = ({x, y, text, size = 26, color = COL.text, fill = '#0A0F1C', anchor = 'middle', opacity = 1, mono = false, weight = 700, pad = 0.5, stroke}) => {
  const w = text.length * size * (mono ? 0.62 : 0.64) + size * (pad * 2), h = size * 1.55;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={h * 0.28} fill={fill} fillOpacity={0.9} stroke={stroke ?? color} strokeOpacity={stroke ? 0.9 : 0.28} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y + size * 0.35} textAnchor="middle" fontFamily={mono ? MONO : FONT} fontWeight={weight} fontSize={size} letterSpacing={size * 0.06} fill={color}>{text}</text>
    </g>
  );
};
