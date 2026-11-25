// World engine (Ved, 24 Nov 2026: no presenter; "each word spoken a visual change - camera zoom, animation and new
// world design"). A scene is a WORLD: a large designed canvas with named anchors. The camera DIRECTOR turns the
// scene's word beats (plan_timeline -> spec.beats) into continuous camera moves: a word that names an anchor flies
// there; other words get a micro-push / punch-in / drift sized by the beat strength, so the picture changes on every
// spoken word. Worlds draw in world px; the engine adds atmosphere (gradient, fog, parallax particles, foreground
// bokeh), a light pulse on each beat, impact shake on strong beats and a caption-readability gradient.
import React from 'react';
import {Easing} from 'remotion';
import {sp, unit} from './tokens';

export type Beat = {t: number; w: string; word: string; kind: 'number' | 'action' | 'state' | 'object' | 'drift'; s: number; camera?: string; action?: string; target?: string};
export type Anchor = {x: number; y: number; zoom?: number};
export type Cam = {x: number; y: number; s: number; blur: number; shakeX: number; shakeY: number; focus: string; tilt: number};

export type WorldDrawProps = {
  t: number; dur: number; beats: Beat[]; cam: Cam; W: number; H: number; u: number;
  /** index of the last beat that has fired (-1 before the first) - use it to build the world word by word */
  step: number;
};

export type WorldDef = {
  id: string;
  /** named spots in world px; `zoom` = scale that frames the spot nicely (1 = world px shown 1:1 on a 1080 frame) */
  anchors: Record<string, Anchor>;
  /** word -> anchor (lowercase, punctuation stripped). Anchor names match themselves and their plural. */
  aliases?: Record<string, string>;
  /** where the camera starts */
  home: string;
  palette?: {bg0?: string; bg1?: string; fog?: string; particles?: string; glow?: string};
  /** draw the world in world px (origin top-left). Rendered under the camera transform. */
  Draw: React.FC<WorldDrawProps>;
  /** optional screen-space overlay (labels, counters) - receives the same props plus `toScreen` */
  Overlay?: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}>;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

/** Which anchor a beat points at (explicit `target`, alias, or the anchor's own name / plural). */
export const anchorFor = (b: Beat, def: WorldDef): string | null => {
  if (b.target && def.anchors[b.target]) return b.target;
  const w = clean(b.word || b.w || '');
  if (!w) return null;
  if (def.aliases?.[w]) return def.aliases[w];
  if (def.anchors[w]) return w;
  if (w.endsWith('s') && def.anchors[w.slice(0, -1)]) return w.slice(0, -1);
  return null;
};

// Ved, 24 Nov 2026 (after v2): "camera jump too much ... I don't want the camera to jump every frame, only where
// required ... camera smoothly, not frame jiggle and hand-like". So the director is CINEMATIC:
//  - the camera moves only to things the voice NAMES (anchors), at most one move per phrase (anchor words closer
//    than CLUSTER frames form one move, to the phrase's final subject);
//  - every move is a long ease-in-out (30-54 design frames), scale interpolated in log space (constant-speed zooms);
//  - between moves a slow continuous dolly (+3 % over ~5 s) so the frame is alive but never twitchy;
//  - no shake, no random jitter, no spring overshoot; motion blur only on big zooms.
// The change on every word comes from the WORLD's own animation (onWord / pulseOn / countOn ...), not the camera.
type Seg = {t0: number; dur: number; x0: number; y0: number; s0: number; x1: number; y1: number; s1: number; focus: string; big: boolean};

const CLUSTER = 36;     // anchor words closer than this (design frames, 1.2 s) are one camera move
const DOLLY = 0.03;     // slow push during holds (fraction of scale)
const DOLLY_T = 150;    // ... reached over ~5 s
const easeIO = (q: number) => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2);

/** The director: smooth camera segments from the anchor words. Deterministic. */
export const direct = (beats: Beat[], def: WorldDef): Seg[] => {
  const h = def.anchors[def.home];
  const segs: Seg[] = [];
  const base = h.zoom ?? 1;
  // open already moving: slow push-in from 90 % starting on frame 0
  segs.push({t0: 0, dur: 60, x0: h.x, y0: h.y + 30, s0: base * 0.9, x1: h.x, y1: h.y, s1: base, focus: def.home, big: false});
  // requests: anchor words (or explicit camera targets); 'hold' suppresses a move
  const req: {t: number; a: string; force: boolean}[] = [];
  let focus = def.home;
  for (const b of beats) {
    if (b.kind === 'drift' || b.camera === 'hold') continue;
    const forced = b.camera && def.anchors[b.camera] ? b.camera : null;
    const a = forced ?? anchorFor(b, def);
    if (!a) continue;
    req.push({t: b.t, a, force: !!forced});
  }
  // cluster
  const clusters: {t: number; end: number; a: string}[] = [];
  for (const r of req) {
    const last = clusters[clusters.length - 1];
    if (last && !r.force && r.t - last.t < CLUSTER && r.t - last.t < 60) {
      last.a = r.a;              // the camera settles on the final subject named in the phrase
      last.end = r.t;
    } else clusters.push({t: r.t, end: r.t, a: r.a});
  }
  // the opening push must finish before the first move (no velocity hitch)
  const firstMove = clusters.find((c) => c.a !== def.home);
  if (firstMove) segs[0].dur = Math.max(20, Math.min(60, firstMove.t - 8));
  clusters.forEach((c, i) => {
    if (c.a === focus) return;
    const A = def.anchors[c.a];
    const prev = segs[segs.length - 1];
    const start = Math.max(prev.t0 + prev.dur + 2, c.t - 4);   // never start while the previous move is still moving
    const next = clusters[i + 1];
    const s1 = A.zoom ?? prev.s1;
    const ratio = Math.max(s1, prev.s1) / Math.max(0.01, Math.min(s1, prev.s1));
    const dist = Math.hypot(A.x - prev.x1, A.y - prev.y1);
    let dur = Math.min(54, Math.max(30, 26 + dist / 40 + Math.log2(ratio) * 8));
    if (next) dur = Math.max(18, Math.min(dur, next.t - 4 - start - 6));
    segs.push({t0: start, dur, x0: 0, y0: 0, s0: 0, x1: A.x, y1: A.y, s1, focus: c.a, big: ratio > 2.2 || dist > 900});
    focus = c.a;
  });
  return segs;
};

const evalSeg = (g: Seg, t: number) => {
  if (t < g.t0 + g.dur) {
    const q = easeIO(clamp01((t - g.t0) / g.dur));
    const s = Math.exp(lerp(Math.log(g.s0), Math.log(g.s1), q));   // log-space zoom: constant perceived speed
    return {x: lerp(g.x0, g.x1, q), y: lerp(g.y0, g.y1, q), s, q, moving: true};
  }
  const hold = t - g.t0 - g.dur;
  const d = 1 + DOLLY * (1 - Math.exp(-hold / DOLLY_T));
  return {x: g.x1, y: g.y1 - 6 * (1 - Math.exp(-hold / DOLLY_T)), s: g.s1 * d, q: 1, moving: false};
};

/** Camera state at time t: segments chained so every move starts exactly where the camera is (no jumps). */
export const camState = (t: number, segs: Seg[], u: number): Cam => {
  void u;
  let cur = evalSeg(segs[0], t);
  let focus = segs[0].focus, blur = 0;
  for (let i = 1; i < segs.length; i++) {
    const g = segs[i];
    if (t < g.t0) break;
    const from = evalSeg({...segs[i - 1]}, g.t0);   // the camera's exact state when this move starts
    g.x0 = from.x; g.y0 = from.y; g.s0 = from.s;
    cur = evalSeg(g, t);
    focus = g.focus;
    if (g.big && cur.moving) blur = Math.sin(cur.q * Math.PI) * 5;
  }
  return {x: cur.x, y: cur.y, s: cur.s, blur, shakeX: 0, shakeY: 0, focus, tilt: 1};
};

/** Index of the last fired beat (words only unless `withDrift`). */
export const beatStep = (t: number, beats: Beat[], withDrift = false) => {
  let n = -1;
  beats.forEach((b, i) => {
    if ((withDrift || b.kind !== 'drift') && t >= b.t) n = i;
  });
  return n;
};

// ---- atmosphere ------------------------------------------------------------------------------------------------

const Atmosphere: React.FC<{W: number; H: number; cam: Cam; t: number; pal: Required<NonNullable<WorldDef['palette']>>; u: number; pulse: number}> = ({W, H, cam, t, pal, u, pulse}) => {
  const far = Array.from({length: 46}).map((_, i) => {
    const depth = 0.15 + rnd(i * 2.1) * 0.35;
    const px = ((rnd(i) * 1.6 - 0.3) * W - (cam.x - 540) * depth * cam.s * 0.4 + t * (rnd(i * 9) - 0.5) * 0.6) % (W * 1.3);
    const py = ((rnd(i * 4.4) * 1.4 - 0.2) * H - (cam.y - 960) * depth * cam.s * 0.4 - t * depth * 0.8) % (H * 1.2);
    return <circle key={i} cx={(px + W * 1.3) % (W * 1.3) - W * 0.15} cy={(py + H * 1.2) % (H * 1.2) - H * 0.1} r={(1 + rnd(i * 7) * 2.4) * u}
                   fill={pal.particles} opacity={0.18 + 0.4 * rnd(i * 3)} />;
  });
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="atm-bg" cx="50%" cy="46%" r="80%"><stop offset="0" stopColor={pal.bg1} /><stop offset="1" stopColor={pal.bg0} /></radialGradient>
        <radialGradient id="atm-pulse" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={pal.glow} stopOpacity={0.07 * pulse} /><stop offset="1" stopColor={pal.glow} stopOpacity={0} /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#atm-bg)" />
      <defs>
        <linearGradient id="atm-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={pal.glow} stopOpacity={0.16} /><stop offset="1" stopColor={pal.glow} stopOpacity={0} /></linearGradient>
      </defs>
      {/* volumetric light shafts: slow, wide, behind everything */}
      <g style={{mixBlendMode: 'screen'}} opacity={0.75}>
        {[-1, 0, 1, 2].map((k) => {
          const a = (k * 13 - 8 + Math.sin(t / 140 + k) * 3) * (Math.PI / 180);
          const ox = W * (0.35 + k * 0.12), len = H * 1.25, wdt = W * (0.12 + 0.05 * (k % 2));
          const x2 = ox + Math.sin(a) * len, y2 = Math.cos(a) * len;
          return <polygon key={k} points={`${ox - 6},-20 ${ox + 6},-20 ${x2 + wdt},${y2} ${x2 - wdt},${y2}`} fill="url(#atm-ray)" />;
        })}
      </g>
      {far}
      <rect width={W} height={H} fill="url(#atm-pulse)" />
    </svg>
  );
};

const Foreground: React.FC<{W: number; H: number; cam: Cam; t: number; pal: Required<NonNullable<WorldDef['palette']>>; u: number}> = ({W, H, cam, t, pal, u}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <defs><filter id="fg-bokeh"><feGaussianBlur stdDeviation={14 * u} /></filter></defs>
    <g filter="url(#fg-bokeh)">
      {Array.from({length: 7}).map((_, i) => {
        const par = 1.6 + rnd(i * 5) * 0.8;
        const x = ((rnd(i * 3.1) * W * 1.6 - (cam.x - 540) * par * cam.s * 0.5 + t * (i % 2 ? 0.9 : -0.7)) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3;
        const y = ((rnd(i * 6.7) * H * 1.3 - (cam.y - 960) * par * cam.s * 0.5) % (H * 1.3) + H * 1.3) % (H * 1.3) - H * 0.15;
        return <circle key={i} cx={x} cy={y} r={(40 + rnd(i * 2) * 70) * u} fill={pal.glow} opacity={0.05 + rnd(i) * 0.06} />;
      })}
    </g>
  </svg>
);

// ---- Shorts/Reels safe area (project.safe, provided by Remake.tsx) -------------------------------------------------
/** Where the camera lands its anchor (fraction of the height) and an extra zoom-out of the whole world layer.
 *  The defaults keep the original framing (anchor at 53 %, zoom 1). */
export const SafeFrame = React.createContext<{focusY: number; zoom: number}>({focusY: 0.53, zoom: 1});

// ---- the World component ------------------------------------------------------------------------------------------

export const World: React.FC<{def: WorldDef; t: number; dur: number; beats: Beat[]; W: number; H: number}> = ({def, t, dur, beats, W, H}) => {
  const u = unit(W);
  const safe = React.useContext(SafeFrame);
  const keys = React.useMemo(() => {
    const segs = direct(beats, def);
    for (let i = 1; i < segs.length; i++) {   // resolve every move's start state once, in order
      const f = evalSeg(segs[i - 1], segs[i].t0);
      segs[i].x0 = f.x; segs[i].y0 = f.y; segs[i].s0 = f.s;
    }
    return segs;
  }, [beats, def]);
  const cam = camState(t, keys, u);
  const pal = {bg0: '#05070B', bg1: '#141A26', fog: '#0B1220', particles: '#9CC3FF', glow: '#3B8CFF', ...(def.palette ?? {})};
  // light pulse on every word beat
  let pulse = 0;
  for (const b of beats) {
    if (b.kind === 'drift' || t < b.t) continue;
    pulse = Math.max(pulse, Math.exp(-(t - b.t) / 10) * (0.4 + 0.2 * b.s));
  }
  const step = beatStep(t, beats);
  // light worlds (bright bg0) get a soft vignette instead of the dark one
  const lum = (h: string) => {
    const m = h.replace('#', '');
    const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m.slice(0, 6), 16);
    return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
  };
  const light = lum(pal.bg0) > 150;
  const props: WorldDrawProps = {t, dur, beats, cam, W, H, u, step};
  const vs = cam.s * safe.zoom;   // visible scale = the director's zoom x the safe-area zoom-out
  const tx = W / 2 - cam.x * vs + cam.shakeX, ty = H * safe.focusY - cam.y * vs + cam.shakeY;
  const toScreen = (x: number, y: number): [number, number] => [tx + x * vs, ty + y * vs];
  const D = def.Draw, O = def.Overlay;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <Atmosphere W={W} H={H} cam={cam} t={t} pal={pal} u={u} pulse={pulse} />
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${tx}px,${ty}px) scale(${vs})`,
                   // the blur sits inside the scaled layer, so divide by the zoom (else deep zooms go fully soft)
                   filter: `contrast(1.06) saturate(1.12)${cam.blur > 0.4 ? ` blur(${(cam.blur * u) / Math.max(1, vs)}px)` : ''}`}}>
        <D {...props} />
      </div>
      <Foreground W={W} H={H} cam={cam} t={t} pal={pal} u={u} />
      {O ? <O {...props} toScreen={toScreen} /> : null}
      {/* caption readability + vignette */}
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
                   background: `linear-gradient(180deg, ${pal.bg0}E6 0%, ${pal.bg0}99 16%, ${pal.bg0}00 30%, ${pal.bg0}00 82%, ${pal.bg0}AA 100%)`}} />
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
                   background: `radial-gradient(ellipse 75% 60% at 50% 55%, transparent 55%, ${light ? 'rgba(40,50,70,0.10)' : 'rgba(0,0,0,0.55)'} 100%)`}} />
    </div>
  );
};

// ---- beat helpers for world authors --------------------------------------------------------------------------------

/** 0..1 spring from the beat whose word matches (first match), or 0 before it. */
export const onWord = (t: number, beats: Beat[], word: string, name: 'pop' | 'settle' | 'bouncy' = 'pop', delay = 0) => {
  const b = beats.find((x) => clean(x.word || x.w) === clean(word));
  return b ? sp(t, b.t + delay, name) : 0;
};
/** frame (design) of a word's beat, or `d` */
export const wordAt = (beats: Beat[], word: string, d = 0) => beats.find((x) => clean(x.word || x.w) === clean(word))?.t ?? d;
/** decaying 1 -> 0 pulse after each beat matching `pred` (glows, flashes) */
export const pulseOn = (t: number, beats: Beat[], pred: (b: Beat) => boolean = (b) => b.kind !== 'drift', decay = 7) => {
  let v = 0;
  for (const b of beats) if (pred(b) && t >= b.t) v = Math.max(v, Math.exp(-(t - b.t) / decay));
  return v;
};
/** how many beats matching `pred` have fired (progressive builds: element i appears at beat i) */
export const countOn = (t: number, beats: Beat[], pred: (b: Beat) => boolean = (b) => b.kind !== 'drift') =>
  beats.filter((b) => pred(b) && t >= b.t).length;
/** spring 0..1 for the n-th beat matching pred (n from 0) */
export const nthBeat = (t: number, beats: Beat[], n: number, pred: (b: Beat) => boolean = (b) => b.kind !== 'drift', name: 'pop' | 'settle' | 'bouncy' = 'pop') => {
  const list = beats.filter(pred);
  return list[n] ? sp(t, list[n].t, name) : 0;
};

/** Particle burst at a world point when `at` fires (sparks fly out and fade). */
export const Burst: React.FC<{t: number; at: number; x: number; y: number; color?: string; n?: number; r?: number}> = ({t, at, x, y, color = '#9CC3FF', n = 16, r = 120}) => {
  if (t < at || t > at + 24) return null;
  const q = clamp01((t - at) / 22);
  const e = 1 - Math.pow(1 - q, 3);
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(i) * 0.4, d = r * (0.5 + rnd(i * 3) * 0.6) * e;
        return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={(3 + rnd(i * 7) * 4) * (1 - q)} fill={color} opacity={1 - q} />;
      })}
      <circle cx={x} cy={y} r={r * 0.6 * e} fill="none" stroke={color} strokeWidth={4 * (1 - q)} opacity={0.8 * (1 - q)} />
    </g>
  );
};

/** Expanding ring at a world point after a beat. */
export const Ripple: React.FC<{t: number; at: number; x: number; y: number; color?: string; r?: number}> = ({t, at, x, y, color = '#3B8CFF', r = 160}) => {
  if (t < at || t > at + 20) return null;
  const q = clamp01((t - at) / 20);
  return <ellipse cx={x} cy={y} rx={r * q} ry={r * q * 0.55} fill="none" stroke={color} strokeWidth={5 * (1 - q)} opacity={1 - q} />;
};

/** Speed lines across the frame (screen space) while the camera whips. */
export const SpeedLines: React.FC<{W: number; H: number; cam: Cam; color?: string}> = ({W, H, cam, color = '#FFFFFF'}) => {
  if (cam.blur < 3) return null;
  const o = clamp01((cam.blur - 3) / 8) * 0.5;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: 18}).map((_, i) => (
        <line key={i} x1={rnd(i) * W} y1={rnd(i * 3) * H} x2={rnd(i) * W + 220} y2={rnd(i * 3) * H + 40} stroke={color} strokeWidth={2} opacity={o * rnd(i * 5)} />
      ))}
    </svg>
  );
};
