// Fluid motion + real media for remakes: brand logos, real screenshots, camera drift, light sweeps,
// mask reveals, floating, particles. All pure functions of `t` (scene-local, base-fps units).
import React from 'react';
import {Img, staticFile} from 'remotion';
import type {SimpleIcon} from 'simple-icons';
import {EASE, clamp01, prog, rand, springAt} from './motion';

// ------------------------------------------------------------------ brand logos (Simple Icons, CC0 data)
/**
 * Real brand mark from Simple Icons: `import {siGithub} from 'simple-icons'` then <Logo icon={siGithub} />.
 * Colour: 'brand' (the official hex), or any CSS colour (white/black versions for dark/light acts).
 * Marks identify the product the video talks about: unaltered, never recoloured into a different brand colour scheme
 * that suggests endorsement.
 */
export const Logo: React.FC<{icon: SimpleIcon; size?: number; color?: 'brand' | string; style?: React.CSSProperties}> = ({
  icon, size = 40, color = 'brand', style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={icon.title} style={{display: 'block', ...style}}>
    <path d={icon.path} fill={color === 'brand' ? `#${icon.hex}` : color} />
  </svg>
);

/** Logo on a rounded tile (app-icon look), popping in with a spring. */
export const LogoTile: React.FC<{icon: SimpleIcon; t: number; at: number; fps: number; size?: number; bg?: string;
  color?: 'brand' | string; style?: React.CSSProperties}> = ({icon, t, at, fps, size = 88, bg = '#fff', color = 'brand', style}) => {
  const s = springAt(t, at, fps, {damping: 13, stiffness: 170, mass: 0.7});
  return (
    <div style={{width: size, height: size, borderRadius: size * 0.26, background: bg, display: 'flex', alignItems: 'center',
                 justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', opacity: clamp01(s * 1.4),
                 transform: `scale(${0.5 + 0.5 * s}) rotate(${(1 - s) * -8}deg)`, ...style}}>
      <Logo icon={icon} size={size * 0.56} color={color} />
    </div>
  );
};

// ------------------------------------------------------------------ real screenshots
/**
 * A captured screenshot (public/<project>/img/*.png from capture.py) in a browser frame, with an optional
 * Ken-Burns move and a zoom-to-region: `focus` = [{at, x, y, scale}] in fractions of the image.
 */
export const Shot: React.FC<{src: string; t: number; x: number; y: number; w: number; h: number; url?: string;
  /** image height / width - needed so the camera never shows past the image edge */
  aspect: number;
  dark?: boolean; at?: number; focus?: {at: number; x: number; y: number; scale: number}[]; radius?: number; chrome?: boolean;
  moveFrames?: number; style?: React.CSSProperties}> = ({src, t, x, y, w, h, url, aspect, dark = false, at = 0, focus = [],
  radius = 18, chrome = true, moveFrames = 22, style}) => {
  const barH = chrome ? 38 : 0;
  const vw = w, vh = h - barH;                       // viewport inside the frame
  // Virtual camera: each focus key = the image point (x,y in 0..1) to CENTRE and a zoom. Keys ease into
  // each other (inOut over `moveFrames`); the view is clamped so the image always covers the viewport.
  const keys = [{at: -1e9, x: 0.5, y: 0.5, scale: 1}, ...focus];
  let cx = 0.5, cy = 0.5, sc = 1;
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i].at) break;
    const p = EASE.inOut(clamp01((t - keys[i].at) / moveFrames));
    const a = i === 1 ? keys[0] : {x: cx, y: cy, scale: sc};
    cx = a.x + (keys[i].x - a.x) * p; cy = a.y + (keys[i].y - a.y) * p; sc = a.scale + (keys[i].scale - a.scale) * p;
  }
  const iw = vw * sc, ih = vw * aspect * sc;         // image drawn at viewport width x zoom
  const tx = Math.min(0, Math.max(vw - iw, vw / 2 - cx * iw));
  const ty = ih <= vh ? (vh - ih) / 2 : Math.min(0, Math.max(vh - ih, vh / 2 - cy * ih));
  const e = prog(t, at, 12);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, overflow: 'hidden',
                 background: dark ? '#0D1117' : '#fff', border: `1.5px solid ${dark ? '#30363D' : '#D9DBD0'}`,
                 boxShadow: '0 24px 60px rgba(0,0,0,0.35)', opacity: e, transform: `translateY(${(1 - e) * 26}px)`,
                 filter: `blur(${(1 - e) * 8}px)`, ...style}}>
      {chrome ? (
        <div style={{height: barH, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
                     background: dark ? '#161B22' : '#F3F3EF', borderBottom: `1px solid ${dark ? '#30363D' : '#E2E3DB'}`}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 11, height: 11, borderRadius: 11, background: c}} />)}
          {url ? <span style={{marginLeft: 10, flex: 1, height: 22, borderRadius: 6, background: dark ? '#0D1117' : '#fff',
                               color: dark ? '#8B949E' : '#6B6B66', fontSize: 13, display: 'flex', alignItems: 'center',
                               padding: '0 10px', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden'}}>{url}</span> : null}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: barH, bottom: 0, overflow: 'hidden'}}>
        <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: 0, width: iw, height: ih, maxWidth: 'none',
                                           transform: `translate(${tx}px, ${ty}px)`}} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ fluid motion
/**
 * Scene camera: a slow continuous push and drift so no frame is ever static (the reference's look).
 * Wrap a scene's content: <Camera t={t} dur={dur}>...</Camera>
 */
export const Camera: React.FC<React.PropsWithChildren<{t: number; dur: number; push?: number; drift?: [number, number];
  origin?: [number, number]}>> = ({t, dur, push = 0.045, drift = [0, -14], origin = [0.5, 0.45], children}) => {
  const p = EASE.inOut(clamp01((t + 8) / Math.max(1, dur + 16)));
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: `${origin[0] * 100}% ${origin[1] * 100}%`,
                 transform: `translate(${drift[0] * p}px, ${drift[1] * p}px) scale(${1 + push * p})`}}>
      {children}
    </div>
  );
};

/** Gentle floating (sine drift) for hero elements; phase keeps neighbours out of sync. */
export const Float: React.FC<React.PropsWithChildren<{t: number; amp?: number; period?: number; phase?: number;
  style?: React.CSSProperties}>> = ({t, amp = 6, period = 90, phase = 0, children, style}) => (
  <div style={{transform: `translateY(${Math.sin(((t + phase) / period) * Math.PI * 2) * amp}px) rotate(${Math.sin(((t + phase) / (period * 1.3)) * Math.PI * 2) * amp * 0.06}deg)`, ...style}}>
    {children}
  </div>
);

/** Diagonal light sweep across its parent (parent needs position:relative + overflow:hidden). */
export const Shine: React.FC<{t: number; at: number; dur?: number; strength?: number}> = ({t, at, dur = 22, strength = 0.35}) => {
  const p = clamp01((t - at) / dur);
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit'}}>
      <div style={{position: 'absolute', top: '-50%', bottom: '-50%', width: '35%', left: `${-40 + EASE.inOut(p) * 160}%`,
                   transform: 'rotate(18deg)', background: `linear-gradient(90deg, transparent, rgba(255,255,255,${strength}), transparent)`}} />
    </div>
  );
};

/** Text/element revealed by a moving mask edge (left->right or bottom->top). */
export const MaskReveal: React.FC<React.PropsWithChildren<{t: number; at: number; dur?: number; dir?: 'right' | 'up';
  style?: React.CSSProperties}>> = ({t, at, dur = 14, dir = 'right', children, style}) => {
  const p = EASE.out(clamp01((t - at) / dur));
  const clip = dir === 'right' ? `inset(0 ${(1 - p) * 100}% 0 0)` : `inset(${(1 - p) * 100}% 0 0 0)`;
  return <div style={{clipPath: clip, transform: dir === 'up' ? `translateY(${(1 - p) * 18}px)` : undefined, ...style}}>{children}</div>;
};

/** Marker underline sweeping under its parent's text. */
export const Underline: React.FC<{t: number; at: number; color: string; dur?: number; height?: number}> = ({t, at, color, dur = 10, height = 8}) => (
  <div style={{position: 'absolute', left: -4, right: -4, bottom: -2, height, borderRadius: height, background: color, opacity: 0.85,
               transformOrigin: 'left', transform: `scaleX(${EASE.out(clamp01((t - at) / dur))})`, zIndex: -1}} />
);

/** Deterministic drifting particles (sparkle dust) inside a box. */
export const Particles: React.FC<{t: number; n?: number; w: number; h: number; color: string; seed?: number; size?: number}> = ({
  t, n = 24, w, h, color, seed = 1, size = 4,
}) => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    {Array.from({length: n}).map((_, i) => {
      const r1 = rand(seed * 97 + i), r2 = rand(seed * 31 + i * 7), r3 = rand(seed * 13 + i * 3);
      const y = ((r2 * h - t * (0.4 + r3 * 0.8)) % h + h) % h;
      const x = r1 * w + Math.sin((t + i * 20) / 40) * 10;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin((t + i * 11) / (18 + r3 * 20)));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: size * (0.5 + r3), height: size * (0.5 + r3),
                                  borderRadius: 99, background: color, opacity: tw * 0.8, boxShadow: `0 0 ${size * 2}px ${color}`}} />;
    })}
  </div>
);

// ------------------------------------------------------------------ comparisons / interaction
/**
 * Perspective "hover tilt" driven by a pointer path (keys {at, x, y} with x,y in -1..1), spring-smoothed,
 * with a glare that follows the pointer. Give two elements the SAME path and they move identically.
 */
export const Tilt3D: React.FC<React.PropsWithChildren<{t: number; fps: number; path: {at: number; x: number; y: number}[];
  max?: number; glare?: boolean; radius?: number; style?: React.CSSProperties}>> = ({t, fps, path, max = 14, glare = true,
  radius = 18, children, style}) => {
  let px = 0, py = 0;
  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    const prev = i ? {x: px, y: py} : {x: 0, y: 0};
    const s = springAt(t, k.at, fps, {damping: 18, stiffness: 90, mass: 1});
    px = prev.x + (k.x - prev.x) * s; py = prev.y + (k.y - prev.y) * s;
  }
  return (
    <div style={{perspective: 900, ...style}}>
      <div style={{position: 'relative', transformStyle: 'preserve-3d', borderRadius: radius,
                   transform: `rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(0)`,
                   boxShadow: `${-px * 18}px ${18 - py * 10}px 40px rgba(0,0,0,0.28)`}}>
        {children}
        {glare ? <div style={{position: 'absolute', inset: 0, borderRadius: radius, pointerEvents: 'none',
                              background: `radial-gradient(circle at ${50 + px * 40}% ${50 + py * 40}%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)`}} /> : null}
      </div>
    </div>
  );
};

/**
 * Before/after wipe: `a` and `b` are the same-size images; the divider sits at `pos` (0..1) which eases
 * through keys [{at, pos}]. Labels in the corners, a round handle on the divider.
 */
export const CompareSlider: React.FC<{t: number; a: string; b: string; w: number; h: number; keys: {at: number; pos: number}[];
  labelA?: string; labelB?: string; accent?: string; style?: React.CSSProperties}> = ({t, a, b, w, h, keys, labelA = 'ORIGINAL',
  labelB = 'COPY', accent = '#4468BA', style}) => {
  let pos = keys.length ? keys[0].pos : 0.5;
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i].at) break;
    const p = EASE.inOut(clamp01((t - keys[i].at) / 20));
    pos = keys[i - 1].pos + (keys[i].pos - keys[i - 1].pos) * p;
  }
  const chip = (txt: string, side: 'l' | 'r'): React.CSSProperties => ({
    position: 'absolute', top: 14, [side === 'l' ? 'left' : 'right']: 14, padding: '6px 12px', borderRadius: 8,
    background: 'rgba(17,17,17,0.82)', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1,
  });
  return (
    <div style={{position: 'relative', width: w, height: h, borderRadius: 20, overflow: 'hidden', background: '#fff',
                 boxShadow: '0 24px 60px rgba(0,0,0,0.25)', ...style}}>
      <Img src={staticFile(b)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - pos) * 100}% 0 0)`}}>
        <Img src={staticFile(a)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: pos * w - 1.5, width: 3, background: accent}} />
      <div style={{position: 'absolute', top: h / 2 - 22, left: pos * w - 22, width: 44, height: 44, borderRadius: 44,
                   background: '#fff', border: `3px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                   color: accent, fontWeight: 800, fontSize: 18, fontFamily: 'Inter, sans-serif'}}>⇆</div>
      <div style={chip(labelA, 'l')}>{labelA}</div>
      <div style={chip(labelB, 'r')}>{labelB}</div>
    </div>
  );
};

/** Spring from one position/scale to another (layout morphs: a card moving to make room). */
export const springTo = (t: number, at: number, fps: number, from: number, to: number, cfg = {damping: 16, stiffness: 120, mass: 0.9}) =>
  from + (to - from) * springAt(t, at, fps, cfg);
