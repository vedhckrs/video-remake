// Small shared helpers for the S05 (Grok Bot office) and S06 (Claude Duet desk) worlds. Pure functions of t.
import React from 'react';
import type {Beat} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {FONT} from './shared';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(0.001, b - a));
export const outC = (q: number) => 1 - Math.pow(1 - clamp01(q), 3);
export const ioC = (q: number) => { const x = clamp01(q); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const rnd = (s: number) => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
export const pulse = (t: number, at: number, decay = 6) => (t < at ? 0 : Math.exp(-(t - at) / decay));
export const pop = (t: number, at: number, name: 'pop' | 'settle' | 'bouncy' = 'pop') => sp(t, at, name);

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
/** design frame of the n-th beat whose word matches (n from 0), or the default d */
export const wt = (beats: Beat[], word: string, d: number, n = 0) => {
  const list = beats.filter((b) => clean(b.word || b.w || '') === clean(word));
  return list[n]?.t ?? d;
};

/** scale-in group about (x, y); k 0..1 */
export const Pop: React.FC<{k: number; x: number; y: number; from?: number; children: React.ReactNode; rot?: number; opacity?: number}> = ({k, x, y, from = 0.6, children, rot = 0, opacity = 1}) => {
  if (k <= 0.001) return null;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${from + (1 - from) * k}) translate(${-x} ${-y})`} opacity={clamp01(k * 1.6) * opacity}>{children}</g>;
};

/** simple generic person avatar (head + shoulders in a disc) - neutral shapes, not a real person */
export const Person: React.FC<{x: number; y: number; r: number; color: string; ring?: string}> = ({x, y, r, color, ring}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={color} />
    <circle r={r} fill="#000" opacity={0.12} />
    <circle cx={0} cy={-r * 0.22} r={r * 0.34} fill="#FFFFFF" opacity={0.92} />
    <path d={`M${-0.6 * r} ${0.8 * r} Q${-0.56 * r} ${0.26 * r} 0 ${0.26 * r} Q${0.56 * r} ${0.26 * r} ${0.6 * r} ${0.8 * r} A${r} ${r} 0 0 1 ${-0.6 * r} ${0.8 * r} Z`} fill="#FFFFFF" opacity={0.92} />
    {ring ? <circle r={r + 4} fill="none" stroke={ring} strokeWidth={4} /> : null}
  </g>
);

/** stroke icon drawn in a 24 box, centred on (x, y), s = size in world px */
export const Ico: React.FC<{d: string; x: number; y: number; s: number; color: string; sw?: number; fill?: string; opacity?: number}> = ({d, x, y, s, color, sw = 2, fill = 'none', opacity = 1}) => (
  <g transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 24})`} opacity={opacity}>
    <path d={d} fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** Simple Icons logo (24 box) centred on (x, y) */
export const Logo: React.FC<{path: string; x: number; y: number; s: number; color: string; opacity?: number}> = ({path, x, y, s, color, opacity = 1}) => (
  <g transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 24})`} opacity={opacity}><path d={path} fill={color} /></g>
);

export const IC = {
  send: 'M3 11.5 L21 3 L14 21 L10.8 13.6 Z M10.8 13.6 L21 3',
  pay: 'M3 6.5 h18 a1.5 1.5 0 0 1 1.5 1.5 v9 a1.5 1.5 0 0 1 -1.5 1.5 h-18 a1.5 1.5 0 0 1 -1.5 -1.5 v-9 a1.5 1.5 0 0 1 1.5 -1.5 Z M1.5 10.5 h21 M5.5 15 h4',
  sign: 'M4 17 L6 11.5 L15 2.5 L19 6.5 L10 15.5 Z M3 21.5 q2.5 -3 5 0 t5 0 t5 0',
  trash: 'M4 6.5 h16 M9 6.5 V3.5 h6 v3 M6.5 6.5 l1 14 h9 l1 -14 M10 10.5 v6.5 M14 10.5 v6.5',
  shield: 'M12 2.5 L20 5.5 V11.5 C20 16.5 16.5 20 12 21.8 C7.5 20 4 16.5 4 11.5 V5.5 Z M8.5 11.8 l2.6 2.6 l4.6 -5',
  check: 'M5 12.5 l4.5 4.5 L19 7.5',
  calendar: 'M4 5.5 h16 a1.5 1.5 0 0 1 1.5 1.5 v12 a1.5 1.5 0 0 1 -1.5 1.5 h-16 a1.5 1.5 0 0 1 -1.5 -1.5 v-12 a1.5 1.5 0 0 1 1.5 -1.5 Z M2.5 10 h19 M7.5 3 v4.5 M16.5 3 v4.5',
  doc: 'M6 2.5 h8 l5 5 V20 a1.5 1.5 0 0 1 -1.5 1.5 h-11.5 a1.5 1.5 0 0 1 -1.5 -1.5 V4 a1.5 1.5 0 0 1 1.5 -1.5 Z M14 2.5 v5 h5 M8 12.5 h8 M8 16.5 h6',
  people: 'M9 11 a3.5 3.5 0 1 0 0 -7 a3.5 3.5 0 0 0 0 7 Z M2.5 20 c0 -4 3 -6 6.5 -6 s6.5 2 6.5 6 M16.5 4.5 a3.2 3.2 0 0 1 0 6.3 M18 14.3 c2.2 .6 3.7 2.4 3.7 5.7',
  chat: 'M4 4.5 h16 a2 2 0 0 1 2 2 v8.5 a2 2 0 0 1 -2 2 h-9 l-5 4 v-4 h-2 a2 2 0 0 1 -2 -2 v-8.5 a2 2 0 0 1 2 -2 Z',
  video: 'M3.5 6.5 h11 a2 2 0 0 1 2 2 v7 a2 2 0 0 1 -2 2 h-11 a2 2 0 0 1 -2 -2 v-7 a2 2 0 0 1 2 -2 Z M16.5 10.5 l6 -3.5 v10 l-6 -3.5',
  mic: 'M12 2.5 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -6 0 v-6 a3 3 0 0 1 3 -3 Z M5.5 11 a6.5 6.5 0 0 0 13 0 M12 17.5 v4',
  lock: 'M6 10.5 h12 a1.5 1.5 0 0 1 1.5 1.5 v8 a1.5 1.5 0 0 1 -1.5 1.5 h-12 a1.5 1.5 0 0 1 -1.5 -1.5 v-8 a1.5 1.5 0 0 1 1.5 -1.5 Z M8 10.5 V7 a4 4 0 0 1 8 0 v3.5',
  eye: 'M1.5 12 C4.5 6.5 8 4.5 12 4.5 s7.5 2 10.5 7.5 c-3 5.5 -6.5 7.5 -10.5 7.5 s-7.5 -2 -10.5 -7.5 Z M12 15.5 a3.5 3.5 0 1 0 0 -7 a3.5 3.5 0 0 0 0 7 Z',
  bank: 'M2.5 9.5 L12 3 l9.5 6.5 Z M4.5 9.5 v8 M9.5 9.5 v8 M14.5 9.5 v8 M19.5 9.5 v8 M2.5 20.5 h19',
  phone: 'M5 15 c4 -4 10 -4 14 0 l2 -2.5 c-5.5 -5.5 -12.5 -5.5 -18 0 Z',
  sun: 'M12 16.5 a4.5 4.5 0 1 0 0 -9 a4.5 4.5 0 0 0 0 9 Z M12 2 v2.5 M12 19.5 V22 M2 12 h2.5 M19.5 12 H22 M4.9 4.9 l1.8 1.8 M17.3 17.3 l1.8 1.8 M4.9 19.1 l1.8 -1.8 M17.3 6.7 l1.8 -1.8',
  coin: 'M12 21.5 a9.5 9.5 0 1 0 0 -19 a9.5 9.5 0 0 0 0 19 Z M12 6.5 v11 M15 9 c-.6 -1 -1.7 -1.5 -3 -1.5 c-1.8 0 -3 .9 -3 2.2 c0 3 6 1.4 6 4.4 c0 1.400 -1.300 2.400 -3 2.400 c-1.500 0 -2.700 -.600 -3.300 -1.700',
  plus: 'M12 5 v14 M5 12 h14',
};

/** label with weight + size shortcuts */
export const Txt: React.FC<{x: number; y: number; s: number; w?: number; fill: string; children: React.ReactNode; anchor?: 'start' | 'middle' | 'end'; opacity?: number; ls?: number; font?: string}> = ({x, y, s, w = 600, fill, children, anchor = 'start', opacity = 1, ls = 0, font = FONT}) => (
  <text x={x} y={y} fontFamily={font} fontWeight={w} fontSize={s} fill={fill} textAnchor={anchor} opacity={opacity} letterSpacing={ls}>{children}</text>
);
