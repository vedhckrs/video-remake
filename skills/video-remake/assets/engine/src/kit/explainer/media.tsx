// Real media for explainer videos (26 Nov 2026, landscape long-form): a real photograph with a slow Ken-Burns push
// (`Photo`) and the small "Source: ..." line that credits it (`SourceCredit`). Both are pure functions of the design
// time t. For captured web pages keep using `Shot` (kit/fx.tsx: browser frame + focus keys); `Photo` is for photographs.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {FONT} from './stage';
import {unit} from './tokens';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (q: number) => q * q * (3 - 2 * q);
const easeSine = (q: number) => 0.5 - 0.5 * Math.cos(Math.PI * q);
const easeOut = (q: number) => 1 - Math.pow(1 - q, 3);

// ---- SourceCredit --------------------------------------------------------------------------------------------------

/**
 * "Source: <text>" pinned to the frame (screen space - draw it OUTSIDE any camera / World layer), fading in from
 * design frame `from` and out before `to`.
 * Landscape default: right-aligned, right edge at 96 % of the width, centred on 96.5 % of the height - under the
 * lower-third captions (which end at ~93 %). Portrait default: left-aligned at 6 % / 83.5 % (above the Shorts UI).
 * A scene can also get it without code: `"credit": "Apple Newsroom"` on the scene in script.json (Remake.tsx draws it
 * for the whole scene).
 */
export const SourceCredit: React.FC<{
  text: string; t: number; W: number; H: number;
  /** design frames: visible from `from` (default 0) until `to` (default: no end) */
  from?: number; to?: number;
  /** fade length in design frames (default 8) */
  fade?: number;
  /** anchor as fractions of the frame: x = right edge (align right) or left edge (align left), y = text centre */
  x?: number; y?: number; align?: 'right' | 'left';
  /** px on a 1080-high (landscape) / 1080-wide (portrait) frame; default 21 */
  size?: number;
  color?: string;
  /** prefix; `null` shows `text` alone. Skipped when `text` already starts with Source / Credit / Photo / Image. */
  label?: string | null;
}> = ({text, t, W, H, from = 0, to = Infinity, fade = 8, x, y, align, size = 21, color = 'rgba(255,255,255,0.8)', label = 'Source'}) => {
  const o = smooth(clamp01((t - from) / Math.max(0.001, fade))) * smooth(clamp01((to - t) / Math.max(0.001, fade)));
  if (o <= 0 || !text) return null;
  const land = W > H;
  const u = unit(W, H);
  const al = align ?? (land ? 'right' : 'left');
  const ax = x ?? (land ? 0.96 : 0.06), ay = y ?? (land ? 0.965 : 0.835);
  const fs = size * u;
  const line = label && !/^(source|credit|photo|image)\b/i.test(text) ? `${label}: ${text}` : text;
  return (
    <div style={{position: 'absolute', top: H * ay - fs * 0.7, height: fs * 1.4, lineHeight: `${fs * 1.4}px`,
                 ...(al === 'right' ? {right: W * (1 - ax), textAlign: 'right' as const} : {left: W * ax, textAlign: 'left' as const}),
                 fontFamily: FONT, fontSize: fs, fontWeight: 500, letterSpacing: '0.01em', color, opacity: o, whiteSpace: 'nowrap',
                 textShadow: `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.7), 0 0 ${10 * u}px rgba(0,0,0,0.45)`, pointerEvents: 'none', zIndex: 1001}}>
      {line}
    </div>
  );
};

// ---- Photo ---------------------------------------------------------------------------------------------------------

/** Ken-Burns key: zoom (>= 1) and the image point (fractions 0..1) the zoom grows from */
export type KenBurns = {scale?: number; x?: number; y?: number};

/**
 * A real photograph (file under public/, e.g. `<id>/img/keynote.jpg`) with a slow eased Ken-Burns push.
 *   mode 'full'   - full-bleed: covers the frame (or the box given by x/y/w/h)
 *   mode 'framed' - a rounded, bordered, shadowed print that rises in at `enterAt`; default box = 50 % of the width,
 *                   16:9 (`aspect` = box height / width), centred on 43 % of the height (clear of the lower third)
 * The image always covers its box (object-fit cover, zoom >= 1 about a point inside it), so no edge ever shows.
 * The move runs from `from` to `to` between design frames `at` and `at + dur` with a sine ease (no start/stop jerk);
 * zoom is interpolated in log space. Pass the scene's `dur` so the push lasts the whole scene.
 * HTML element: inside a World, draw it in a div-based `Draw` (x/y/w/h in world px) or in the `Overlay`.
 * `children` are drawn on top of the photo, inside its box (labels, callouts).
 */
export const Photo: React.FC<{
  src: string; t: number; W: number; H: number;
  mode?: 'full' | 'framed';
  x?: number; y?: number; w?: number; h?: number; aspect?: number;
  from?: KenBurns; to?: KenBurns; at?: number; dur?: number;
  /** framed: entrance start (design frame) and length */
  enterAt?: number; enter?: number;
  radius?: number; border?: string | false; shadow?: boolean;
  /** 0..1 black veil over the photo (for text on top) */
  dim?: number;
  /** object-position of the image inside its box (CSS), default 'center' */
  position?: string;
  style?: React.CSSProperties; children?: React.ReactNode;
}> = ({src, t, W, H, mode = 'full', x, y, w, h, aspect = 9 / 16, from, to, at = 0, dur = 240, enterAt = 0, enter = 12,
       radius, border, shadow = true, dim = 0, position = 'center', style, children}) => {
  const u = unit(W, H);
  const framed = mode === 'framed';
  const bw = w ?? (framed ? W * 0.5 : W);
  const bh = h ?? (framed ? bw * aspect : H);
  const bx = x ?? (framed ? (W - bw) / 2 : 0);
  const by = y ?? (framed ? H * 0.43 - bh / 2 : 0);
  const a = {scale: 1, x: 0.5, y: 0.5, ...(from ?? {})};
  const b = {scale: 1.08, x: a.x, y: a.y, ...(to ?? {})};
  const p = easeSine(clamp01((t - at) / Math.max(0.001, dur)));
  const s = Math.max(1, Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * p));
  const fx = a.x + (b.x - a.x) * p, fy = a.y + (b.y - a.y) * p;
  const e = framed ? easeOut(clamp01((t - enterAt) / Math.max(0.001, enter))) : 1;
  const r = radius ?? (framed ? 18 * u : 0);
  const bd = border === false ? undefined : border ?? (framed ? `${1.5 * u}px solid rgba(255,255,255,0.16)` : undefined);
  return (
    <div style={{position: 'absolute', left: bx, top: by, width: bw, height: bh, borderRadius: r, overflow: 'hidden', background: '#05070B',
                 border: bd, boxSizing: 'border-box',
                 boxShadow: framed && shadow ? `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.55), 0 ${6 * u}px ${18 * u}px rgba(0,0,0,0.35)` : undefined,
                 opacity: e, transform: framed && e < 1 ? `translateY(${(1 - e) * 26 * u}px) scale(${0.97 + 0.03 * e})` : undefined, ...style}}>
      <Img src={staticFile(src)}
           style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', maxWidth: 'none', objectFit: 'cover', objectPosition: position,
                   transformOrigin: `${(fx * 100).toFixed(4)}% ${(fy * 100).toFixed(4)}%`, transform: `scale(${s.toFixed(6)})`, willChange: 'transform'}} />
      {dim > 0 ? <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})`}} /> : null}
      {children}
    </div>
  );
};
