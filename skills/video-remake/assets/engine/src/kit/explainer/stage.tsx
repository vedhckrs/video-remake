// Stage layer for the explainer style: backdrop, stage camera, callouts, numbers, meters, cards, flows, grids.
// Every value is a pure function of the design time t (frames @30, fractional at 60 fps output).
// Pixel sizes are written for a 1080-wide frame and multiplied by u = W / 1080.
import React, {useId} from 'react';
import {Easing} from 'remotion';
import {loadFont as loadPoppins} from '@remotion/google-fonts/Poppins';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {BANDS, C, DUR, type Mode, alpha, pal, sp, unit} from './tokens';

export const FONT = loadPoppins('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['400', '600'], subsets: ['latin']}).fontFamily;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (t: number, at: number, dur: number, ease = OUT) => ease(clamp01((t - at) / Math.max(0.001, dur)));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---- backdrop ----------------------------------------------------------------------------------------------

/** Ground: flat colour + faint 60 px grid (parallax-able) + soft vignette + 2-3 % grain. */
export const GridBackdrop: React.FC<{mode: Mode; W: number; H: number; offset?: [number, number]; grid?: boolean}> = ({
  mode, W, H, offset = [0, 0], grid = true,
}) => {
  const u = unit(W);
  const P = pal(mode);
  const id = useId().replace(/:/g, '');
  const cell = 60 * u;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <pattern id={`g${id}`} width={cell} height={cell} patternUnits="userSpaceOnUse"
                 patternTransform={`translate(${offset[0] % cell},${offset[1] % cell})`}>
          <path d={`M${cell},0 L0,0 L0,${cell}`} fill="none" stroke={P.grid} strokeWidth={1.2 * u} />
        </pattern>
        <radialGradient id={`v${id}`} cx="50%" cy="45%" r="75%">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={mode === 'dark' ? 0.55 : 0.12} />
        </radialGradient>
        <filter id={`n${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.6 0" />
        </filter>
      </defs>
      <rect width={W} height={H} fill={P.bg} />
      {grid ? <rect width={W} height={H} fill={`url(#g${id})`} /> : null}
      <rect width={W} height={H} fill={`url(#v${id})`} />
      <rect width={W} height={H} filter={`url(#n${id})`} opacity={mode === 'dark' ? 0.035 : 0.025} />
    </svg>
  );
};

// ---- stage camera ------------------------------------------------------------------------------------------

export type CamKey = {t: number; x?: number; y?: number; s?: number; dur?: number; kind?: 'spring' | 'push' | 'zoomThrough' | 'whip'};

/**
 * 2D camera on the stage group only (captions + presenter never move with it).
 * Keys: x, y = stage point (px, frame coords) brought to the stage centre; s = scale.
 * spring = reframe (camera spring, 0 % overshoot); push = slow ease-in-out macro push (28 f);
 * zoomThrough / whip = fast move with motion blur at peak speed. Adds a 2-5 % drift on holds.
 */
export const camAt = (t: number, keys: CamKey[], W: number, H: number, drift = 0.025) => {
  const cx = W / 2, cy = H * ((BANDS.stageTop + BANDS.stageBottom) / 2);
  let x = cx, y = cy, s = 1, blur = 0, lastT = 0;
  for (const k of keys) {
    if (t < k.t) break;
    const nx = k.x ?? x, ny = k.y ?? y, ns = k.s ?? s;
    let p: number;
    const kind = k.kind ?? 'spring';
    if (kind === 'spring') p = sp(t, k.t, 'camera');
    else if (kind === 'push') p = prog(t, k.t, k.dur ?? DUR.macroPush, INOUT);
    else p = prog(t, k.t, k.dur ?? DUR.zoomThrough, Easing.bezier(0.7, 0, 0.3, 1));
    if (kind === 'zoomThrough' || kind === 'whip') {
      const d = k.dur ?? DUR.zoomThrough;
      const q = clamp01((t - k.t) / d);
      blur = Math.max(blur, Math.sin(q * Math.PI) * (kind === 'whip' ? 18 : 12));
    }
    x = lerp(x, nx, p); y = lerp(y, ny, p); s = lerp(s, ns, p);
    lastT = k.t;
  }
  const hold = Math.max(0, t - lastT);
  const d = 1 + drift * (1 - Math.exp(-hold / 150));
  return {x, y, s: s * d, blur, cx, cy};
};

/** Where a stage point (frame px, as drawn inside StageCamera) lands on screen at time t. Use it to keep
 *  callouts, labels and readouts screen-locked (outside the camera) while their anchors follow the camera. */
export const camPoint = (t: number, keys: CamKey[], W: number, H: number, p: [number, number], drift?: number): [number, number] => {
  const c = camAt(t, keys, W, H, drift);
  return [c.cx + (p[0] - c.x) * c.s, c.cy + (p[1] - c.y) * c.s];
};

export const StageCamera: React.FC<{t: number; keys: CamKey[]; W: number; H: number; drift?: number; children: React.ReactNode}> = ({
  t, keys, W, H, drift, children,
}) => {
  const c = camAt(t, keys, W, H, drift);
  const tx = c.cx - c.x * c.s, ty = c.cy - c.y * c.s;
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px,${ty}px) scale(${c.s})`,
                 filter: c.blur > 0.3 ? `blur(${c.blur * unit(W)}px)` : undefined}}>
      {children}
    </div>
  );
};

/** Zoom-through helper: progress, blur and whether to show the next (inner) artwork (swap at the blur peak). */
export const zoomThrough = (t: number, at: number, dur: number = DUR.zoomThrough * 2) => {
  const q = clamp01((t - at) / dur);
  return {q, blur: Math.sin(q * Math.PI) * 14, swapped: q >= 0.5, scaleOut: 1 + 7 * Easing.in(Easing.cubic)(Math.min(1, q * 2)),
    scaleIn: 0.35 + 0.65 * OUT(Math.max(0, q * 2 - 1))};
};

// ---- text helpers --------------------------------------------------------------------------------------------

export const Label: React.FC<{text: string; sub?: string; gloss?: string; u: number; color?: string; align?: 'left' | 'right' | 'center'; opacity?: number; mode?: Mode}> = ({
  text, sub, gloss, u, color, align = 'left', opacity = 1, mode = 'dark',
}) => {
  const P = pal(mode);
  return (
    <div style={{fontFamily: FONT, textAlign: align, opacity, lineHeight: 1.15, whiteSpace: 'nowrap'}}>
      <div style={{fontSize: 32 * u, fontWeight: 700, letterSpacing: `${0.12}em`, textTransform: 'uppercase', color: color ?? P.fg}}>{text}</div>
      {sub ? <div style={{fontSize: 26 * u, fontFamily: MONO, color: P.mute, marginTop: 4 * u}}>{sub}</div> : null}
      {gloss ? <div style={{fontSize: 26 * u, color: P.mute, marginTop: 2 * u}}>{gloss}</div> : null}
    </div>
  );
};

/**
 * Leader-line callout: anchor dot pops, line draws (8 f), then the label fades in (4.5 f).
 * `from` = anchor on the object, `to` = label point (frame px). Label sits beyond `to` on the side it points to.
 */
export const Callout: React.FC<{
  t: number; at: number; from: [number, number]; to: [number, number]; text: string; sub?: string; gloss?: string;
  W: number; color?: string; out?: number; mode?: Mode; elbow?: boolean; plate?: boolean;
}> = ({t, at, from, to, text, sub, gloss, W, color = '#FFFFFF', out, mode = 'dark', elbow = true, plate = true}) => {
  const u = unit(W);
  if (t < at) return null;
  const fade = out !== undefined ? 1 - prog(t, out, 6) : 1;
  const dot = sp(t, at, 'pop');
  const draw = prog(t, at + 1, DUR.leader);
  const lab = prog(t, at + 1 + DUR.leader * 0.7, DUR.labelFade);
  // estimated label width (uppercase, tracked 0.12em, 32 px @1080) -> flip / clamp so it stays inside the frame
  const estW = Math.max(text.length * 0.82, (sub ?? gloss ?? '').length * 0.55) * 32 * u + 14 * u;
  let right = to[0] >= from[0];
  if (right && to[0] + estW > W - 36 * u) right = false;
  if (!right && to[0] - estW < 36 * u) right = true;
  const labelLeft = right ? Math.min(to[0] + 14 * u, W - 36 * u - estW) : Math.max(36 * u, to[0] - 14 * u - estW);
  // the leader always arrives at the label edge nearest the anchor, so it never crosses the text
  const labelRight = labelLeft + estW, labelTop = to[1] - 28 * u, labelBottom = to[1] + (sub || gloss ? 58 : 24) * u;
  let end: [number, number];
  let straight = !elbow;
  if (from[0] < labelLeft - 6 * u) end = [labelLeft - 12 * u, to[1]];
  else if (from[0] > labelRight + 6 * u) end = [labelRight + 12 * u, to[1]];
  else {
    end = [Math.min(Math.max(from[0], labelLeft + 20 * u), labelRight - 20 * u), from[1] < to[1] ? labelTop - 8 * u : labelBottom + 8 * u];
    straight = true;
  }
  // anchor -> knee (30 % across, at label height) -> label edge: the classic 2-segment leader
  const poly: [number, number][] = straight ? [from, end] : [from, [lerp(from[0], end[0], 0.3), end[1]], end];
  const len = poly.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - poly[i][0], p[1] - poly[i][1]), 0);
  const lc = mode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(14,15,17,0.6)';
  return (
    <div style={{position: 'absolute', inset: 0, opacity: fade, pointerEvents: 'none'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <polyline points={poly.map((p) => p.join(',')).join(' ')} fill="none" stroke={lc} strokeWidth={2.2 * u}
                  strokeDasharray={len} strokeDashoffset={len * (1 - draw)} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={from[0]} cy={from[1]} r={7 * u * dot} fill={color} />
        <circle cx={from[0]} cy={from[1]} r={14 * u * dot} fill="none" stroke={color} strokeOpacity={0.35 * (1 - prog(t, at, 18))} strokeWidth={2 * u} />
      </svg>
      {plate ? (
        <div style={{position: 'absolute', left: labelLeft - 16 * u, top: labelTop - 6 * u, width: estW + 32 * u, height: labelBottom - labelTop + 12 * u,
                     borderRadius: 14 * u, background: mode === 'dark' ? 'rgba(12,13,16,0.72)' : 'rgba(255,255,255,0.8)', backdropFilter: `blur(${8 * u}px)`,
                     boxShadow: `inset 0 0 0 ${1.2 * u}px ${mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'}`, opacity: lab}} />
      ) : null}
      <div style={{position: 'absolute', top: to[1] - 20 * u, left: labelLeft, width: estW,
                   opacity: lab, transform: `translateX(${(1 - lab) * (right ? -10 : 10) * u}px)`, filter: `blur(${(1 - lab) * 6}px)`}}>
        <Label text={text} sub={sub} gloss={gloss} u={u} color={color} align={right ? 'left' : 'right'} mode={mode} />
      </div>
    </div>
  );
};

// ---- numbers -------------------------------------------------------------------------------------------------

/** Mechanical rolling digits (tabular). Lands exactly on `to` at at + dur (ease-out). */
export const Odometer: React.FC<{
  t: number; at: number; dur?: number; from?: number; to: number; decimals?: number; size: number; color?: string;
  weight?: number; prefix?: string; suffix?: string; minDigits?: number;
}> = ({t, at, dur = DUR.countUp, from = 0, to, decimals = 0, size, color = '#fff', weight = 800, prefix = '', suffix = '', minDigits = 1}) => {
  const p = prog(t, at, dur, Easing.bezier(0.22, 1, 0.36, 1));
  const v = lerp(from, to, p) * Math.pow(10, decimals);
  const total = Math.max(minDigits + decimals, String(Math.round(Math.abs(to) * Math.pow(10, decimals))).length);
  const cols: React.ReactNode[] = [];
  for (let i = total - 1; i >= 0; i--) {
    const place = Math.pow(10, i);
    const raw = v / place;
    const settled = p >= 1;
    const pos = settled ? Math.floor(Math.round(v) / place) % 10 : (i === 0 ? raw % 10 : (Math.floor(raw) % 10) + Math.max(0, (raw % 1) - 0.85) / 0.15);
    const lead = i > decimals && Math.abs(v) < place && i !== 0;
    cols.push(
      <span key={i} style={{display: 'inline-block', height: size * 1.05, overflow: 'hidden', width: lead ? 0 : '0.62em', textAlign: 'center',
                            transition: 'none'}}>
        <span style={{display: 'block', transform: `translateY(${-pos * size * 1.05}px)`}}>
          {Array.from({length: 11}).map((_, d) => <span key={d} style={{display: 'block', height: size * 1.05, lineHeight: `${size * 1.05}px`}}>{d % 10}</span>)}
        </span>
      </span>,
    );
    if (i === decimals && decimals > 0) cols.push(<span key="dot">.</span>);
    if (i > decimals && !lead && (i - decimals) % 3 === 0) cols.push(<span key={`c${i}`}>,</span>);
  }
  return (
    <span style={{fontFamily: FONT, fontWeight: weight, fontSize: size, color, fontVariantNumeric: 'tabular-nums', display: 'inline-flex',
                  alignItems: 'flex-start', lineHeight: 1.05, letterSpacing: '-0.02em'}}>
      {prefix}{cols}{suffix}
    </span>
  );
};

/** Hero number with unit and source footnote (big_number template core). */
export const BigNumber: React.FC<{
  t: number; at: number; to: number; unitText?: string; from?: number; decimals?: number; W: number; color?: string; x: number; y: number;
  sizeFrac?: number; label?: string; mode?: Mode;
}> = ({t, at, to, unitText, from = 0, decimals = 0, W, color, x, y, sizeFrac = 0.1, label, mode = 'dark'}) => {
  const u = unit(W);
  if (t < at) return null;
  const e = sp(t, at, 'pop');
  const P = pal(mode);
  const size = W * sizeFrac * (16 / 9);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * e})`, opacity: Math.min(1, e * 1.6),
                 textAlign: 'center', fontFamily: FONT}}>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 14 * u}}>
        <Odometer t={t} at={at} to={to} from={from} decimals={decimals} size={size} color={color ?? P.fg} />
        {unitText ? <span style={{fontSize: size * 0.34, fontWeight: 700, color: P.mute}}>{unitText}</span> : null}
      </div>
      {label ? <div style={{fontSize: 30 * u, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.mute, fontWeight: 600}}>{label}</div> : null}
    </div>
  );
};

/** Horizontal meter that steps green -> amber -> red at 0.5 / 0.8 / 1.0. */
export const Meter: React.FC<{value: number; w: number; h: number; u: number; label?: string; mode?: Mode}> = ({value, w, h, u, label, mode = 'dark'}) => {
  const col = value >= 1 ? C.error : value >= 0.8 ? C.warn : value >= 0.5 ? C.warn : C.ok;
  const P = pal(mode);
  return (
    <div style={{width: w, fontFamily: FONT}}>
      {label ? <div style={{fontSize: 26 * u, color: P.mute, marginBottom: 8 * u, letterSpacing: '0.1em', textTransform: 'uppercase'}}>{label}</div> : null}
      <div style={{width: w, height: h, borderRadius: h / 2, background: alpha('#FFFFFF', mode === 'dark' ? 0.08 : 0), boxShadow: `inset 0 0 0 ${1.5 * u}px ${P.cardBorder}`,
                   overflow: 'hidden', backgroundColor: mode === 'light' ? '#E6E8EC' : undefined}}>
        <div style={{width: `${Math.min(1, value) * 100}%`, height: '100%', borderRadius: h / 2, background: col,
                     boxShadow: value >= 1 ? `0 0 ${24 * u}px ${col}` : undefined}} />
      </div>
    </div>
  );
};

// ---- cards, stamps, badges -------------------------------------------------------------------------------------

export const Card: React.FC<{
  t: number; at: number; x: number; y: number; w: number; h?: number; u: number; mode?: Mode; out?: number; tilt?: number;
  children: React.ReactNode; style?: React.CSSProperties; from?: 'up' | 'down' | 'left' | 'right' | 'pop';
}> = ({t, at, x, y, w, h, u, mode = 'dark', out, tilt = 0, children, style, from = 'up'}) => {
  if (t < at) return null;
  const s = sp(t, at, 'settle');
  const fade = out !== undefined ? 1 - prog(t, out, 6) : 1;
  const P = pal(mode);
  const off = (1 - s) * 60 * u;
  const tr = from === 'pop' ? `scale(${0.8 + 0.2 * s})` : from === 'up' ? `translateY(${off}px)` : from === 'down' ? `translateY(${-off}px)` :
    from === 'left' ? `translateX(${-off}px)` : `translateX(${off}px)`;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, background: P.card, borderRadius: 22 * u,
                 boxShadow: `0 ${18 * u}px ${45 * u}px rgba(0,0,0,${P.shadow}), inset 0 0 0 ${1.5 * u}px ${P.cardBorder}`,
                 opacity: Math.min(1, s * 1.5) * fade, transform: `${tr} rotate(${tilt}deg)`, filter: `blur(${(1 - Math.min(1, s * 1.3)) * 8}px)`,
                 padding: 28 * u, boxSizing: 'border-box', fontFamily: FONT, color: P.fg, ...style}}>
      {children}
    </div>
  );
};

/** Highlighter sweep behind a span of text (evidence cards). */
export const Marker: React.FC<{t: number; at: number; children: React.ReactNode; color?: string; dur?: number}> = ({t, at, children, color = C.marker, dur = 8}) => {
  const p = prog(t, at, dur, INOUT);
  return (
    <span style={{backgroundImage: `linear-gradient(${alpha(color, 0.6)}, ${alpha(color, 0.6)})`, backgroundRepeat: 'no-repeat',
                  backgroundSize: `${p * 100}% 62%`, backgroundPosition: '0 85%', WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone',
                  padding: '0 0.08em', borderRadius: '0.1em'}}>
      {children}
    </span>
  );
};

export const Stamp: React.FC<{t: number; at: number; text: string; color?: string; u: number; rot?: number}> = ({t, at, text, color = C.ok, u, rot = -10}) => {
  if (t < at) return null;
  const s = sp(t, at, 'bouncy');
  return (
    <div style={{display: 'inline-block', padding: `${10 * u}px ${22 * u}px`, border: `${5 * u}px solid ${color}`, borderRadius: 14 * u, color,
                 fontFamily: FONT, fontWeight: 800, fontSize: 44 * u, letterSpacing: '0.08em', textTransform: 'uppercase',
                 transform: `rotate(${rot}deg) scale(${2.2 - 1.2 * s})`, opacity: Math.min(1, s * 2), background: alpha(color, 0.1)}}>
      {text}
    </div>
  );
};

export const Badge: React.FC<{t: number; at: number; kind: 'ok' | 'error' | 'unknown' | 'warn'; size: number}> = ({t, at, kind, size}) => {
  if (t < at) return null;
  const s = sp(t, at, 'pop');
  const col = {ok: C.ok, error: C.error, unknown: C.neutral, warn: C.warn}[kind];
  const glyph = {ok: 'M-9,1 L-3,7 L10,-7', error: 'M-7,-7 L7,7 M7,-7 L-7,7', unknown: '', warn: 'M0,-8 L0,3 M0,8 L0,8.5'}[kind];
  return (
    <svg width={size} height={size} viewBox="-20 -20 40 40" style={{transform: `scale(${s})`, overflow: 'visible'}}>
      <circle r={18} fill={col} />
      {kind === 'unknown' ? <text y={7} textAnchor="middle" fontSize={22} fontWeight={800} fill="#fff" fontFamily={FONT}>?</text> :
        <path d={glyph} stroke="#fff" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </svg>
  );
};

// ---- flows, grids, charts --------------------------------------------------------------------------------------

/** Polyline wire that draws on, then carries packets (dots) from start to end. Pure: no DOM measuring. */
export const FlowPath: React.FC<{
  t: number; at: number; points: [number, number][]; color?: string; u: number; drawDur?: number;
  packets?: {at: number; dur?: number; color?: string}[]; width?: number; dashed?: boolean;
}> = ({t, at, points, color = '#FFFFFF', u, drawDur = 12, packets = [], width = 3, dashed = false}) => {
  if (t < at || points.length < 2) return null;
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const len = segs.reduce((a, b) => a + b, 0);
  const draw = prog(t, at, drawDur);
  const posAt = (q: number): [number, number] => {
    let d = q * len;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i]) {
        const f = segs[i] ? d / segs[i] : 0;
        return [lerp(points[i][0], points[i + 1][0], f), lerp(points[i][1], points[i + 1][1], f)];
      }
      d -= segs[i];
    }
    return points[points.length - 1];
  };
  return (
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <polyline points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke={alpha(color === '#FFFFFF' ? '#FFFFFF' : color, 0.55)}
                strokeWidth={width * u} strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={dashed ? `${8 * u} ${8 * u}` : len} strokeDashoffset={dashed ? -t * 1.5 * u : len * (1 - draw)}
                opacity={dashed ? draw : 1} />
      {packets.map((pk, i) => {
        if (t < pk.at) return null;
        const q = prog(t, pk.at, pk.dur ?? 18, INOUT);
        if (q >= 1) return null;
        const [x, y] = posAt(q);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={16 * u} fill={pk.color ?? color} opacity={0.25} />
            <circle cx={x} cy={y} r={8 * u} fill={pk.color ?? color} />
          </g>
        );
      })}
    </svg>
  );
};

/** Quantity as a picture: n cells appear with a 1-frame stagger; `lit` cells take the accent colour. */
export const UnitGrid: React.FC<{
  t: number; at: number; n: number; cols: number; cell: number; gap: number; lit?: number; color?: string; litColor?: string; litAt?: number;
}> = ({t, at, n, cols, cell, gap, lit = 0, color = '#2A2E32', litColor = C.info, litAt}) => (
  <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap}}>
    {Array.from({length: n}).map((_, i) => {
      const s = sp(t, at + i * 1, 'pop');
      const on = i < lit && t >= (litAt ?? at) + i * 0.5;
      return <div key={i} style={{width: cell, height: cell, borderRadius: cell * 0.22, background: on ? litColor : color,
                                  transform: `scale(${s})`, boxShadow: on ? `0 0 ${cell * 0.6}px ${alpha(litColor, 0.5)}` : undefined}} />;
    })}
  </div>
);

/** Bars that grow on a stagger; values 0..1 of max height; labels under, value on top (count-up). */
export const Bars: React.FC<{
  t: number; at: number; values: number[]; labels?: string[]; colors?: string[]; w: number; h: number; u: number; mode?: Mode; valueText?: (v: number, i: number) => string;
}> = ({t, at, values, labels = [], colors = [], w, h, u, mode = 'dark', valueText}) => {
  const P = pal(mode);
  const bw = (w / values.length) * 0.62;
  return (
    <div style={{position: 'relative', width: w, height: h + 60 * u, fontFamily: FONT}}>
      {values.map((v, i) => {
        const g = sp(t, at + i * 4, 'settle');
        const x = (i + 0.5) * (w / values.length) - bw / 2;
        return (
          <div key={i}>
            <div style={{position: 'absolute', left: x, bottom: 60 * u, width: bw, height: Math.max(0, h * v * g), borderRadius: `${10 * u}px ${10 * u}px 0 0`,
                         background: colors[i] ?? C.info}} />
            {valueText ? <div style={{position: 'absolute', left: x - 20 * u, width: bw + 40 * u, bottom: 60 * u + h * v * g + 8 * u, textAlign: 'center',
                                      fontWeight: 800, fontSize: 36 * u, color: P.fg, opacity: g}}>{valueText(v * g, i)}</div> : null}
            {labels[i] ? <div style={{position: 'absolute', left: x - 30 * u, width: bw + 60 * u, bottom: 8 * u, textAlign: 'center', fontSize: 28 * u,
                                      color: P.mute, fontWeight: 600}}>{labels[i]}</div> : null}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 58 * u, height: 2 * u, background: P.cardBorder}} />
    </div>
  );
};

// ---- chrome: footnote, rail, focus -------------------------------------------------------------------------------

/** Source line at the lower-left of the stage: >= 22 px, >= 1.5 s on screen. */
export const Footnote: React.FC<{t: number; at: number; until?: number; text: string; W: number; H: number; mode?: Mode}> = ({t, at, until, text, W, H, mode = 'dark'}) => {
  const u = unit(W);
  if (t < at || (until !== undefined && t > until + 6)) return null;
  const o = prog(t, at, 6) * (until !== undefined ? 1 - prog(t, until, 6) : 1);
  return (
    <div style={{position: 'absolute', left: 60 * u, top: H * BANDS.stageBottom - 40 * u, fontFamily: FONT, fontSize: 24 * u, color: pal(mode).mute, opacity: o * 0.9}}>
      {text}
    </div>
  );
};

/** Persistent progress rail (videos > 60 s): thin bar under the caption band with chapter ticks. */
export const ProgressRail: React.FC<{t: number; total: number; chapters: {t: number; label: string}[]; W: number; H: number; mode?: Mode}> = ({
  t, total, chapters, W, H, mode = 'dark',
}) => {
  const u = unit(W);
  const P = pal(mode);
  const x0 = W * 0.18, x1 = W * 0.82, y = H * 0.105; // HUD line above the caption band
  const p = clamp01(t / total);
  const cur = chapters.reduce((a, c, i) => (t >= c.t ? i : a), 0);
  return (
    <div style={{position: 'absolute', left: x0, top: y, width: x1 - x0, fontFamily: FONT}}>
      <div style={{height: 5 * u, borderRadius: 3 * u, background: alpha(mode === 'dark' ? '#FFFFFF' : '#000000', 0.1)}}>
        <div style={{width: `${p * 100}%`, height: '100%', borderRadius: 3 * u, background: C.info}} />
      </div>
      {chapters.map((c, i) => (
        <div key={i} style={{position: 'absolute', left: `${(c.t / total) * 100}%`, top: -4 * u, width: 13 * u, height: 13 * u, borderRadius: 7 * u,
                             transform: 'translateX(-50%)', background: i <= cur ? C.info : P.bg, boxShadow: `0 0 0 ${2 * u}px ${C.info}`}} />
      ))}
      <div style={{position: 'absolute', top: 16 * u, left: 0, right: 0, textAlign: 'center', fontSize: 24 * u, letterSpacing: '0.14em',
                   textTransform: 'uppercase', color: P.mute, fontWeight: 600}}>
        {chapters[cur]?.label}
      </div>
    </div>
  );
};

/** Dim + blur everything except the focused layer (steer focus without zooming). */
export const focusStyle = (t: number, at: number, until: number | undefined, focused: boolean): React.CSSProperties => {
  const on = prog(t, at, DUR.dim) * (until !== undefined ? 1 - prog(t, until, DUR.dim) : 1);
  if (focused) return {transform: `scale(${1 + 0.04 * on})`};
  return {opacity: 1 - 0.72 * on, filter: `blur(${on * 3}px)`};
};

/** Whole-stage enter for a new hero after a hard cut: 3 f blur-in. */
export const blurIn = (t: number, at: number) => {
  const p = prog(t, at, 3);
  return {opacity: p, filter: `blur(${(1 - p) * 14}px)`} as React.CSSProperties;
};
