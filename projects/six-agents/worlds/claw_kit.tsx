// Shared parts for the two open-source scenes (S07 OpenClaw, S08 Hermes): maths helpers, the REAL GitHub header on a
// glass panel with a glowing marker + magnifier lens, an SVG drum counter (rolls under the world camera), logo chips.
import React from 'react';
import {sp} from '../../../src/kit/explainer/tokens';
import {FONT, MONO, SvgImg} from './shared';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const outC = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const inOut = (x: number) => { const q = clamp01(x); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; };
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(0.001, b - a));
export const rnd = (s: number) => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
/** one smooth hop (0 -> 1 -> 0) lasting `len` design frames from `at` */
export const hop = (t: number, at: number, len = 9) => (t < at || t > at + len ? 0 : Math.sin(((t - at) / len) * Math.PI));
/** decaying flash 1 -> 0 from `at` */
export const flash = (t: number, at: number, decay = 7) => (t < at ? 0 : Math.exp(-(t - at) / decay));

/** five-point star path centred on 0,0 */
export const starPath = (r: number, inner = 0.46) =>
  Array.from({length: 10}).map((_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r;
    return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  }).join(' ') + 'Z';

/** A Simple Icons logo inside a round glossy chip (cx, cy = centre; r = chip radius). */
export const LogoDot: React.FC<{icon: {path: string; hex: string}; cx: number; cy: number; r: number; bg?: string; fg?: string; ring?: string}> = ({icon, cx, cy, r, bg, fg = '#FFFFFF', ring = '#FFFFFF'}) => {
  const s = (r * 1.12) / 24;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r + 5} fill="#000" opacity={0.35} cy={6} />
      <circle r={r} fill={bg ?? '#' + icon.hex} />
      <ellipse cx={0} cy={-r * 0.42} rx={r * 0.74} ry={r * 0.44} fill="#FFFFFF" opacity={0.16} />
      <circle r={r} fill="none" stroke={ring} strokeOpacity={0.55} strokeWidth={Math.max(2, r * 0.045)} />
      <path d={icon.path} fill={fg} transform={`translate(${-12 * s} ${-12 * s}) scale(${s})`} />
    </g>
  );
};

// native pixel boxes inside the 2560x1120 GitHub header screenshots (same layout for both repos)
export const GH = {W: 2560, H: 1120, star: {x: 2286, y: 375, w: 212, h: 58}, mit: {x: 1944, y: 1058, w: 206, h: 48}, lens: {x: 2262, y: 352, w: 260, h: 104}};

/**
 * The real GitHub repo header on a dark glass browser panel. (x, y) = top-left of the panel, w = its width.
 *  tIn: panel drops in · tMark: glowing marker box draws around the Star box · tLens: magnifier lens pops (lens = its
 *  top-left + width in world px) · out: 0..1 the panel leaves upward · mit: time the "MIT license" row gets underlined.
 */
export const GitProof: React.FC<{
  id: string; src: string; url: string; x: number; y: number; w: number; t: number; tIn: number; tMark: number; tLens: number;
  lens: {x: number; y: number; w: number}; accent: string; rim: string; out?: number; mit?: number; pulse?: number;
}> = ({id, src, url, x, y, w, t, tIn, tMark, tLens, lens, accent, rim, out = 0, mit, pulse = 0}) => {
  const k = sp(t, tIn, 'settle');
  if (k <= 0.001 || out >= 0.999) return null;
  const BAR = w * 0.038, s = w / GH.W, h = GH.H * s;
  const o = inOut(out);
  const dy = -(1 - k) * 520 - o * 700;
  const op = clamp01(k * 1.6) * (1 - o);
  const sx = x + GH.star.x * s, sy = y + BAR + GH.star.y * s, sw = GH.star.w * s, sh = GH.star.h * s;
  const m = outC(seg(t, tMark, tMark + 9));
  const per = 2 * (sw + sh + 36);
  const lk = sp(t, tLens, 'bouncy');
  const f = lens.w / GH.lens.w, lh = GH.lens.h * f;
  const glow = 0.55 + 0.45 * Math.sin(t * 0.35) + pulse * 0.6;
  return (
    <g transform={`translate(0 ${dy}) rotate(${(1 - k) * -3} ${x + w / 2} ${y + h / 2})`} opacity={op}>
      <defs>
        <linearGradient id={`${id}-gp-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75} /><stop offset="0.45" stopColor={rim} stopOpacity={0.5} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.14} />
        </linearGradient>
        <linearGradient id={`${id}-gp-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.13} /><stop offset="0.42" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-gp-halo`}><stop offset="0" stopColor={accent} stopOpacity={0.5} /><stop offset="1" stopColor={accent} stopOpacity={0} /></radialGradient>
        <clipPath id={`${id}-gp-lens`}><rect x={lens.x} y={lens.y} width={lens.w} height={lh} rx={lh * 0.2} /></clipPath>
      </defs>
      {/* halo + drop shadow */}
      <ellipse cx={x + w / 2} cy={y + (h + BAR) / 2} rx={w * 0.66} ry={(h + BAR) * 0.8} fill={`url(#${id}-gp-halo)`} opacity={0.55} />
      <rect x={x + 14} y={y + 34} width={w} height={h + BAR} rx={30} fill="#000" opacity={0.5} />
      {/* glass body */}
      <rect x={x - 14} y={y - 14} width={w + 28} height={h + BAR + 28} rx={40} fill="#0A0D14" opacity={0.92} />
      <rect x={x - 14} y={y - 14} width={w + 28} height={h + BAR + 28} rx={40} fill="none" stroke={`url(#${id}-gp-rim)`} strokeWidth={4} />
      {/* browser bar */}
      {[0, 1, 2].map((i) => <circle key={i} cx={x + 34 + i * 38} cy={y + BAR / 2 - 2} r={11} fill={['#FF5F57', '#FEBC2E', '#28C840'][i]} />)}
      <rect x={x + 170} y={y + 6} width={w - 340} height={BAR - 16} rx={(BAR - 16) / 2} fill="#1B212C" />
      <text x={x + w / 2} y={y + BAR / 2 + 9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={BAR * 0.5} fill="#B9C3D3">{url}</text>
      {/* the screenshot, whole */}
      <SvgImg src={src} x={x} y={y + BAR} w={w} h={h} radius={22} />
      <rect x={x} y={y + BAR} width={w} height={h} rx={22} fill={`url(#${id}-gp-sheen)`} />
      {/* MIT licence underline (optional) */}
      {mit !== undefined && t > mit ? (() => {
        const q = outC(seg(t, mit, mit + 8));
        const mx = x + GH.mit.x * s, my = y + BAR + GH.mit.y * s, mw = GH.mit.w * s, mh = GH.mit.h * s;
        return (
          <g>
            <rect x={mx - 10} y={my - 6} width={(mw + 20) * q} height={mh + 12} rx={10} fill={accent} opacity={0.3} />
            <rect x={mx - 10} y={my + mh + 4} width={(mw + 20) * q} height={7} rx={3.5} fill="#FFFFFF" />
          </g>
        );
      })() : null}
      {/* glowing marker box around the Star count */}
      {m > 0.001 ? (
        <g>
          <rect x={sx - 18} y={sy - 18} width={sw + 36} height={sh + 36} rx={22} fill={accent} opacity={0.16 * m * glow} />
          <rect x={sx - 12} y={sy - 12} width={sw + 24} height={sh + 24} rx={18} fill="none" stroke={accent} strokeWidth={20} opacity={0.22 * glow} strokeDasharray={`${per * m} ${per}`} />
          <rect x={sx - 12} y={sy - 12} width={sw + 24} height={sh + 24} rx={18} fill="none" stroke="#FFD84D" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${per * m} ${per}`} />
        </g>
      ) : null}
      {/* magnifier lens: the same pixels, enlarged */}
      {lk > 0.001 ? (
        <g>
          <path d={`M${sx + sw / 2},${sy + sh + 14} L${lens.x + lens.w * 0.62},${lens.y - 8}`} stroke="#FFD84D" strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" opacity={clamp01(lk)} />
          <g transform={`translate(${lens.x + lens.w / 2} ${lens.y + lh / 2}) scale(${0.3 + 0.7 * lk}) translate(${-(lens.x + lens.w / 2)} ${-(lens.y + lh / 2)})`} opacity={clamp01(lk * 1.5)}>
            <rect x={lens.x - 26} y={lens.y - 26} width={lens.w + 52} height={lh + 52} rx={lh * 0.2 + 26} fill="#FFD84D" opacity={0.14 + 0.1 * glow} />
            <rect x={lens.x + 10} y={lens.y + 22} width={lens.w} height={lh} rx={lh * 0.2} fill="#000" opacity={0.55} />
            <rect x={lens.x} y={lens.y} width={lens.w} height={lh} rx={lh * 0.2} fill="#0D1117" />
            <g clipPath={`url(#${id}-gp-lens)`}>
              <SvgImg src={src} x={lens.x - GH.lens.x * f} y={lens.y - GH.lens.y * f} w={GH.W * f} h={GH.H * f} />
              <rect x={lens.x} y={lens.y} width={lens.w} height={lh * 0.45} fill="#FFFFFF" opacity={0.05} />
            </g>
            <rect x={lens.x} y={lens.y} width={lens.w} height={lh} rx={lh * 0.2} fill="none" stroke="#FFD84D" strokeWidth={9} />
            <rect x={lens.x - 9} y={lens.y - 9} width={lens.w + 18} height={lh + 18} rx={lh * 0.2 + 9} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} />
          </g>
        </g>
      ) : null}
    </g>
  );
};

/**
 * SVG drum counter (mechanical odometer look, like the kit's DrumCounter but drawn in the world so it rides the
 * camera). (x, y) = top-left of the housing, size = digit height in world px. Digits roll with carry; `comma` adds
 * thousands separators.
 */
export const Drum: React.FC<{id: string; x: number; y: number; size: number; t: number; at: number; dur: number; to: number; accent: string; done?: number}> = ({id, x, y, size, t, at, dur, to, accent, done = 0}) => {
  const q = seg(t, at, at + dur);
  const e = 1 - Math.pow(1 - q, 2.6);
  const v = to * e;
  const n = String(to).length;
  const cw = size * 0.7, ch = size * 1.24, gap = size * 0.07, comma = size * 0.26, pad = size * 0.18;
  const smooth = (a: number, b: number, z: number) => { const p = clamp01((z - a) / (b - a)); return p * p * (3 - 2 * p); };
  const pos = (i: number) => {
    const P = Math.pow(10, i);
    if (i === 0) return v;
    const base = Math.floor(v / P), frac = (v % P) / P;
    return base + smooth((P - 1) / P, 1, frac);
  };
  let cx = x + pad;
  const cols: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const p = ((pos(i) % 10) + 10) % 10, d = Math.floor(p), fr = p - d;
    const lead = v < Math.pow(10, i) && i > 0;
    const x0 = cx;
    cols.push(
      <g key={i} opacity={lead ? 0.3 : 1}>
        <defs><clipPath id={`${id}-dc${i}`}><rect x={x0} y={y + pad} width={cw} height={ch} rx={size * 0.07} /></clipPath></defs>
        <rect x={x0} y={y + pad} width={cw} height={ch} rx={size * 0.07} fill={`url(#${id}-dcol)`} />
        <g clipPath={`url(#${id}-dc${i})`}>
          {[0, 1].map((j) => (
            <text key={j} x={x0 + cw / 2} y={y + pad + ch / 2 + size * 0.36 + (j - fr) * size * 1.12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size}
              fill="#F6F7F9">{(d + j) % 10}</text>
          ))}
          <rect x={x0} y={y + pad} width={cw} height={ch} fill={`url(#${id}-dshade)`} />
        </g>
      </g>,
    );
    cx += cw + gap;
    if (i > 0 && i % 3 === 0) {
      cols.push(<text key={`c${i}`} x={cx + comma * 0.45} y={y + pad + ch - size * 0.02} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size * 0.9} fill="#F6F7F9">,</text>);
      cx += comma + gap;
    }
  }
  const W = cx - gap + pad - x, H = ch + pad * 2;
  const run = t >= at && q < 1;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-dcol`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#07080A" /><stop offset="0.18" stopColor="#262A31" /><stop offset="0.5" stopColor="#3C414A" /><stop offset="0.82" stopColor="#262A31" /><stop offset="1" stopColor="#07080A" /></linearGradient>
        <linearGradient id={`${id}-dshade`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0.8} /><stop offset="0.3" stopColor="#000" stopOpacity={0} /><stop offset="0.7" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.85} /></linearGradient>
        <linearGradient id={`${id}-dhouse`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6A707B" /><stop offset="0.35" stopColor="#2B2F36" /><stop offset="0.7" stopColor="#14161A" /><stop offset="1" stopColor="#434851" /></linearGradient>
      </defs>
      <rect x={x + 10} y={y + 26} width={W} height={H} rx={size * 0.18} fill="#000" opacity={0.55} />
      {done > 0.01 ? <rect x={x - 16} y={y - 16} width={W + 32} height={H + 32} rx={size * 0.18 + 16} fill={accent} opacity={0.28 * done} /> : null}
      <rect x={x} y={y} width={W} height={H} rx={size * 0.18} fill={`url(#${id}-dhouse)`} />
      <rect x={x + 2} y={y + 2} width={W - 4} height={H - 4} rx={size * 0.18} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={3} />
      {cols}
      <rect x={x + W / 2 - size * 0.16} y={y + pad * 0.3} width={size * 0.32} height={size * 0.06} rx={size * 0.03} fill={run ? accent : '#3A3E46'} />
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => <circle key={i} cx={x + (a ? W - pad * 0.45 : pad * 0.45)} cy={y + (b ? H - pad * 0.45 : pad * 0.45)} r={size * 0.04} fill="#AEB4BD" />)}
    </g>
  );
};
/** total width of a Drum housing for a number (so a label / layout can centre on it) */
export const drumWidth = (to: number, size: number) => {
  const n = String(to).length, commas = Math.floor((n - 1) / 3);
  return size * 0.18 * 2 + n * size * 0.7 + (n - 1) * size * 0.07 + commas * (size * 0.26 + size * 0.07);
};

/** Glass plate (dark, rimmed) used for chips / cards in both scenes. Needs gradients `${id}-glass` + `${id}-rim`. */
export const Plate: React.FC<{id: string; x: number; y: number; w: number; h: number; r?: number; glow?: number; accent?: string; fill?: string; children?: React.ReactNode}> = ({id, x, y, w, h, r = 36, glow = 0, accent = '#FFFFFF', fill, children}) => (
  <g>
    <rect x={x + 8} y={y + 20} width={w} height={h} rx={r} fill="#000" opacity={0.45} />
    {glow > 0.01 ? <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={r + 14} fill={accent} opacity={0.3 * glow} /> : null}
    <rect x={x} y={y} width={w} height={h} rx={r} fill={fill ?? `url(#${id}-glass)`} />
    <rect x={x + 4} y={y + 4} width={w - 8} height={h * 0.42} rx={r - 4} fill="#FFFFFF" opacity={0.055} />
    <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx={r} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={3 + 3 * glow} />
    {children}
  </g>
);
