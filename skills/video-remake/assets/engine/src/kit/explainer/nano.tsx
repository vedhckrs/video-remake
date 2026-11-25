// NanoZoom: one continuous powers-of-ten zoom through nested levels (Ved, 24 Nov 2026: "I want nanoscopic zoom
// continue inside the chip world ... camera smoothly"). Example: drive -> NAND package -> silicon die -> memory
// array -> 3D NAND string -> one cell -> electrons, with no cuts.
//
// Geometry: every level is drawn in its own CENTRED coordinates (0,0 = screen centre at native scale; the visible
// frame at native scale is x -540..540, y -960..960 on a 1080x1920 canvas). Level i+1 lives inside level i at
// `portal` (level-i px) and is `factor` times smaller there (default 10 = one decade). A single depth value D (log10)
// drives the camera: between depth_i and depth_i+1 the camera zooms level i by 10^(D - depth_i) while gliding
// towards its portal; level i+1 is drawn on top at exactly the matching scale/position and fades in over the last
// part of the segment, so the hand-off is seamless. Past the last level the camera keeps a slow push.
import React from 'react';
import {SafeFrame, type Beat} from './world';
import {unit} from './tokens';

export type NanoLevelProps = {t: number; beats: Beat[]; W: number; H: number; u: number; scale: number; active: boolean; step: number};
export type NanoLevel = {
  id: string;
  /** depth (log10) at which this level is shown 1:1 */
  depth: number;
  /** where the NEXT level lives inside this one (centred level px) */
  portal?: [number, number];
  /** background colour of this level's world (behind its drawing) */
  bg?: string;
  Draw: React.FC<NanoLevelProps>;
};
/** depth keyframes: the camera is at `depth` at design frame `t`; segments ease in/out, zoom speed is constant in log space */
export type NanoKey = {t: number; depth: number};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeIO = (q: number) => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);
/** Depth along the keys with a monotone cubic (Fritsch-Carlson): passes THROUGH intermediate keys without stopping,
 *  eases in at the first key and out at the last (zero slope there), never overshoots. */
export const depthAt = (t: number, keys: NanoKey[]) => {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0].depth;
  const last = keys[n - 1];
  if (t >= last.t) return last.depth + Math.min(0.12, (t - last.t) / 1500); // slow push after the dive
  if (n === 2) return keys[0].depth + (last.depth - keys[0].depth) * easeIO(clamp01((t - keys[0].t) / (last.t - keys[0].t)));
  const h = keys.slice(1).map((k, i) => k.t - keys[i].t);
  const d = keys.slice(1).map((k, i) => (k.depth - keys[i].depth) / Math.max(1e-6, h[i]));
  const m = keys.map((_, i) => (i === 0 || i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i])));
  let i = 0;
  while (i < n - 2 && t > keys[i + 1].t) i++;
  const q = (t - keys[i].t) / h[i];
  const q2 = q * q, q3 = q2 * q;
  return (2 * q3 - 3 * q2 + 1) * keys[i].depth + (q3 - 2 * q2 + q) * h[i] * m[i] + (-2 * q3 + 3 * q2) * keys[i + 1].depth + (q3 - q2) * h[i] * m[i + 1];
};

export const NanoZoom: React.FC<{
  levels: NanoLevel[]; keys: NanoKey[]; t: number; beats: Beat[]; W: number; H: number; step?: number;
  /** fraction of each segment over which the next level fades in (end of segment) */
  fade?: number;
  /** caption-band darkening colour */
  top?: string;
}> = ({levels, keys, t, beats, W, H, step = -1, fade = 0.35, top = '#03060C'}) => {
  const u = unit(W);
  const safe = React.useContext(SafeFrame);
  const D = depthAt(t, keys);
  // Shorts/Reels safe area: the dive's centre follows the world cameras' focus (default 0.53 -> centre 0.50)
  const C: [number, number] = [W / 2, H * (safe.focusY - 0.03)];
  // which segment
  let i = 0;
  while (i < levels.length - 1 && D >= levels[i + 1].depth) i++;
  const L = levels[i];
  const next = levels[i + 1];
  const span = next ? next.depth - L.depth : 1;
  const g = next ? clamp01((D - L.depth) / span) : 0;
  const S = Math.pow(10, D - L.depth);
  const portal = L.portal ?? [0, 0];
  // camera centre in level-i coords: the portal glides from its rest position to the screen centre
  const cx = next ? portal[0] - (portal[0] * (1 - g)) / S : 0;
  const cy = next ? portal[1] - (portal[1] * (1 - g)) / S : 0;
  const F = Math.pow(10, span);
  const childOpacity = next ? clamp01((g - (1 - fade)) / (fade * 0.85)) : 0;
  const parentOpacity = 1;
  const drawLevel = (lv: NanoLevel, scale: number, ox: number, oy: number, opacity: number, active: boolean, key: string) => {
    const Dr = lv.Draw;
    return (
      <div key={key} style={{position: 'absolute', inset: 0, opacity, background: active ? lv.bg : undefined}}>
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${ox}px,${oy}px) scale(${scale})`}}>
          <Dr t={t} beats={beats} W={W} H={H} u={u} scale={scale} active={active} step={step} />
        </div>
      </div>
    );
  };
  // parent: level i at scale S, centred on (cx, cy)
  const pOx = C[0] - cx * S, pOy = C[1] - cy * S;
  // child: level i+1 occupies level-i region around the portal at 1/F size
  const cS = S / F;
  const cOx = C[0] + (portal[0] - cx) * S, cOy = C[1] + (portal[1] - cy) * S;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: L.bg ?? '#03060C'}}>
      {/* safe-area zoom-out of the whole dive around its centre (the level's background colour fills the margin) */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${C[0]}px ${C[1]}px`, transform: safe.zoom !== 1 ? `scale(${safe.zoom})` : undefined}}>
        {childOpacity < 1 ? drawLevel(L, S, pOx, pOy, parentOpacity, true, `p${L.id}`) : null}
        {next && childOpacity > 0 ? (
          <div style={{position: 'absolute', inset: 0, opacity: childOpacity,
                       WebkitMaskImage: childOpacity < 1 ? `radial-gradient(circle at ${cOx}px ${cOy}px, black ${40 + 60 * childOpacity}%, transparent ${70 + 60 * childOpacity}%)` : undefined,
                       maskImage: childOpacity < 1 ? `radial-gradient(circle at ${cOx}px ${cOy}px, black ${40 + 60 * childOpacity}%, transparent ${70 + 60 * childOpacity}%)` : undefined}}>
            {drawLevel(next, cS, cOx, cOy, 1, childOpacity >= 1, `c${next.id}`)}
          </div>
        ) : null}
      </div>
      {/* caption readability + vignette */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
                   background: `linear-gradient(180deg, ${top}E6 0%, ${top}99 16%, ${top}00 30%, ${top}00 84%, ${top}99 100%)`}} />
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 75% 60% at 50% 52%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />
    </div>
  );
};
