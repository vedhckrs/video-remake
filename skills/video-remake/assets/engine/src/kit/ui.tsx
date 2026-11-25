// UI-mockup building blocks. Every component takes `t` (scene-local frame) and an `at` frame,
// so a scene is a list of timed elements - no state, no effects.
import React from 'react';
import type {Palette} from './types';
import {EASE, clamp01, countUp, enter, pop, prog, rand, springAt} from './motion';
import {MONO, SANS} from './fonts';

type Pos = {x: number; y: number; w?: number; h?: number};
const abs = ({x, y, w, h}: Pos): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w, height: h});

// ------------------------------------------------------------------ icons (simple, brand-free glyphs)
export type GlyphName = 'star' | 'check' | 'x' | 'doc' | 'folder' | 'user' | 'users' | 'search' | 'bolt' | 'bell' |
  'link' | 'code' | 'chat' | 'layers' | 'play' | 'film' | 'eye' | 'sparkle' | 'repo' | 'download' | 'arrow';
const PATHS: Record<GlyphName, string> = {
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z',
  check: 'M5 12.5l4.2 4.2L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  doc: 'M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 15.5h6',
  folder: 'M3 7h6l2 2h10v10H3z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M16 10.5a3 3 0 100-6M17.5 14.5c2 .6 3.4 2.4 4 5.5',
  search: 'M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.5 15.5L21 21',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  bell: 'M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  code: 'M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5',
  chat: 'M4 5h16v11H9l-5 4z',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  play: 'M8 5v14l11-7z',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  repo: 'M5 4h12v16H7a2 2 0 01-2-2zM5 18a2 2 0 012-2h10M9 8h5',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  arrow: 'M4 12h15M13 6l6 6-6 6',
};
export const Glyph: React.FC<{name: GlyphName; size?: number; color?: string; fill?: boolean; stroke?: number}> = ({
  name, size = 24, color = 'currentColor', fill = false, stroke = 2,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d={PATHS[name]} fill={fill ? color : 'none'} stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeLinejoin="round" />
  </svg>
);

// ------------------------------------------------------------------ surfaces
export const Card: React.FC<React.PropsWithChildren<Pos & {
  t: number; at?: number; pal: Palette; radius?: number; pad?: number; style?: React.CSSProperties;
  enterAs?: 'rise' | 'pop' | 'none'; fps?: number;
}>> = ({t, at = 0, pal, radius = 22, pad = 24, style, enterAs = 'rise', fps = 30, children, ...pos}) => {
  const anim = enterAs === 'none' ? {} : enterAs === 'pop' ? pop(t, at, fps) : enter(t, at);
  return (
    <div style={{
      ...abs(pos), background: pal.card, border: `1.5px solid ${pal.cardBorder}`, borderRadius: radius,
      padding: pad, boxSizing: 'border-box', boxShadow: '0 18px 50px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)',
      overflow: 'hidden', ...anim, ...style,
    }}>
      {children}
    </div>
  );
};

/** App / browser window with the three traffic-light dots and an optional title or URL. */
export const Window: React.FC<React.PropsWithChildren<Pos & {
  t: number; at?: number; pal: Palette; title?: string; style?: React.CSSProperties; fps?: number; enterAs?: 'rise' | 'pop' | 'none';
}>> = ({title, children, ...rest}) => (
  <Card {...rest} pad={0}>
    <div style={{height: 46, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px',
                 borderBottom: `1.5px solid ${rest.pal.cardBorder}`, fontFamily: SANS, fontSize: 18, color: rest.pal.mute}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 13, height: 13, borderRadius: 13, background: c}} />)}
      {title ? <span style={{marginLeft: 14, whiteSpace: 'nowrap', overflow: 'hidden'}}>{title}</span> : null}
    </div>
    <div style={{padding: 22}}>{children}</div>
  </Card>
);

export const Pill: React.FC<{text: string; t: number; at: number; fps: number; bg: string; fg: string; size?: number;
  style?: React.CSSProperties; icon?: GlyphName}> = ({text, t, at, fps, bg, fg, size = 22, style, icon}) => (
  <span style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.35, padding: `${size * 0.32}px ${size * 0.7}px`,
                borderRadius: 999, background: bg, color: fg, fontFamily: SANS, fontWeight: 650, fontSize: size,
                whiteSpace: 'nowrap', ...pop(t, at, fps), ...style}}>
    {icon ? <Glyph name={icon} size={size * 1.05} color={fg} /> : null}{text}
  </span>
);

/** Round tick / cross badge that pops in. */
export const Tick: React.FC<{t: number; at: number; fps: number; color: string; size?: number; kind?: 'check' | 'x'}> = ({
  t, at, fps, color, size = 34, kind = 'check',
}) => (
  <span style={{display: 'inline-flex', width: size, height: size, borderRadius: size, background: color,
                alignItems: 'center', justifyContent: 'center', ...pop(t, at, fps)}}>
    <Glyph name={kind} size={size * 0.62} color="#fff" stroke={3} />
  </span>
);

// ------------------------------------------------------------------ text-ish
export const Counter: React.FC<{t: number; at: number; dur: number; from: number; to: number; decimals?: number;
  prefix?: string; suffix?: string; style?: React.CSSProperties; grouping?: boolean}> = ({
  t, at, dur, from, to, decimals = 0, prefix = '', suffix = '', style, grouping = true,
}) => {
  const v = countUp(t, at, dur, from, to);
  const s = grouping ? v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals})
    : v.toFixed(decimals);
  return <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>{prefix}{s}{suffix}</span>;
};

/** Text typed on at `cps` characters per second, with a blinking block cursor while typing. */
export const TypeOn: React.FC<{t: number; at: number; text: string; fps: number; cps?: number; cursor?: boolean;
  style?: React.CSSProperties}> = ({t, at, text, fps, cps = 28, cursor = true, style}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor(((t - at) / fps) * cps)));
  const typing = n < text.length && t >= at;
  const blink = Math.floor(t / (fps / 2)) % 2 === 0;
  return (
    <span style={{whiteSpace: 'pre', ...style}}>
      {t >= at ? text.slice(0, n) : ''}
      {cursor && (typing || (t >= at && blink)) ? <span style={{opacity: 0.8}}>▍</span> : null}
    </span>
  );
};

export const Terminal: React.FC<Pos & {t: number; at?: number; fps: number; lines: {text: string; at: number; color?: string}[];
  title?: string; fontSize?: number}> = ({t, at = 0, fps, lines, title = 'terminal', fontSize = 22, ...pos}) => (
  <div style={{...abs(pos), background: '#0E1014', border: '1.5px solid #2A2E36', borderRadius: 18, overflow: 'hidden',
               boxShadow: '0 20px 60px rgba(0,0,0,0.45)', ...enter(t, at)}}>
    <div style={{height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#15181E',
                 color: '#7D8590', fontFamily: SANS, fontSize: 16}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 11, height: 11, borderRadius: 11, background: c}} />)}
      <span style={{marginLeft: 10}}>{title}</span>
    </div>
    <div style={{padding: '16px 20px', fontFamily: MONO, fontSize, lineHeight: 1.6, color: '#E6EDF3'}}>
      {lines.map((l, i) => (
        <div key={i} style={{color: l.color ?? '#E6EDF3', minHeight: fontSize * 1.6}}>
          <TypeOn t={t} at={l.at} text={l.text} fps={fps} cursor={i === lines.filter((x) => t >= x.at).length - 1} />
        </div>
      ))}
    </div>
  </div>
);

// ------------------------------------------------------------------ data
/** Area/line chart that draws left to right, ending in a glowing dot. points: 0..1 values. */
export const LineChart: React.FC<Pos & {t: number; at: number; dur: number; points: number[]; color: string; area?: boolean}> = ({
  t, at, dur, points, color, area = true, ...pos
}) => {
  const W = pos.w ?? 400, H = pos.h ?? 200;
  const xy = points.map((v, i) => [(i / (points.length - 1)) * W, H - v * H * 0.9 - H * 0.05] as const);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const p = prog(t, at, dur, EASE.inOut);
  const k = Math.min(xy.length - 1, Math.floor(p * (xy.length - 1)));
  const [ex, ey] = xy[k];
  return (
    <svg style={abs(pos)} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id="lcClip"><rect x="0" y="0" width={W * p} height={H} /></clipPath>
      </defs>
      {area ? <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#lc)" clipPath="url(#lcClip)" /> : null}
      <path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" clipPath="url(#lcClip)" />
      {p > 0.02 ? <circle cx={ex} cy={ey} r={9} fill={color} style={{filter: `drop-shadow(0 0 10px ${color})`}} /> : null}
    </svg>
  );
};

/** Grid of coloured icon tiles appearing with a ripple stagger from the centre. */
export const IconGrid: React.FC<Pos & {t: number; at: number; cols: number; rows: number; tile: number; gap: number;
  colors: string[]; fps: number; glyphs?: GlyphName[]}> = ({t, at, cols, rows, tile, gap, colors, fps, glyphs, ...pos}) => {
  const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
  const items = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    const delay = Math.hypot(c - cx, r - cy) * 1.6;
    const s = springAt(t, at + delay, fps, {damping: 12, stiffness: 180, mass: 0.6});
    const col = colors[Math.floor(rand(i + 3) * colors.length)];
    const g = glyphs ? glyphs[Math.floor(rand(i + 11) * glyphs.length)] : undefined;
    items.push(
      <div key={i} style={{position: 'absolute', left: c * (tile + gap), top: r * (tile + gap), width: tile, height: tile,
                           borderRadius: tile * 0.26, background: `${col}22`, border: `1.5px solid ${col}88`,
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           opacity: clamp01(s * 1.4), transform: `scale(${0.4 + 0.6 * s})`}}>
        {g ? <Glyph name={g} size={tile * 0.5} color={col} /> : null}
      </div>,
    );
  }
  return <div style={{...abs(pos), width: cols * (tile + gap) - gap, height: rows * (tile + gap) - gap}}>{items}</div>;
};

/** Horizontal step tracker: steps complete at their `doneAt` frames. */
export const Stepper: React.FC<Pos & {t: number; at: number; fps: number; pal: Palette; accent: string;
  steps: {label: string; doneAt: number}[]}> = ({t, at, fps, pal, accent, steps, ...pos}) => (
  <div style={{...abs(pos), display: 'flex', alignItems: 'center', gap: 14, background: pal.card, borderRadius: 999,
               border: `1.5px solid ${pal.cardBorder}`, padding: '14px 22px', boxSizing: 'border-box', ...enter(t, at)}}>
    {steps.map((s, i) => {
      const done = t >= s.doneAt;
      return (
        <React.Fragment key={i}>
          {i ? <div style={{flex: 1, height: 3, borderRadius: 3, background: pal.cardBorder, position: 'relative'}}>
            <div style={{position: 'absolute', inset: 0, background: accent, transformOrigin: 'left',
                         transform: `scaleX(${prog(t, s.doneAt - 8, 8)})`}} />
          </div> : null}
          <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 20, fontWeight: 600,
                       color: done ? pal.fg : pal.mute, whiteSpace: 'nowrap'}}>
            {done ? <Tick t={t} at={s.doneAt} fps={fps} color={accent} size={30} />
              : <span style={{width: 30, height: 30, borderRadius: 30, border: `2px solid ${pal.cardBorder}`, display: 'inline-flex',
                              alignItems: 'center', justifyContent: 'center', fontSize: 15}}>{i + 1}</span>}
            {s.label}
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

/** Phone-style notification banner dropping in from the top. */
export const Notification: React.FC<Pos & {t: number; at: number; fps: number; pal: Palette; title: string; body: string;
  icon?: GlyphName; accent: string}> = ({t, at, fps, pal, title, body, icon = 'bell', accent, ...pos}) => {
  const s = springAt(t, at, fps, {damping: 15, stiffness: 170, mass: 0.7});
  return (
    <div style={{...abs(pos), display: 'flex', gap: 16, alignItems: 'center', background: pal.card, borderRadius: 24,
                 border: `1.5px solid ${pal.cardBorder}`, padding: '18px 22px', boxSizing: 'border-box',
                 boxShadow: '0 16px 40px rgba(0,0,0,0.25)', opacity: clamp01(s * 1.3),
                 transform: `translateY(${(1 - s) * -60}px)`}}>
      <div style={{width: 52, height: 52, borderRadius: 14, background: `${accent}22`, display: 'flex',
                   alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
        <Glyph name={icon} size={30} color={accent} />
      </div>
      <div style={{fontFamily: SANS, minWidth: 0}}>
        <div style={{fontSize: 21, fontWeight: 700, color: pal.fg}}>{title}</div>
        <div style={{fontSize: 18, color: pal.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{body}</div>
      </div>
    </div>
  );
};

/** Mouse pointer moving through keyframes; a ripple on click frames. */
export const Cursor: React.FC<{t: number; path: {at: number; x: number; y: number}[]; clicks?: number[]; color?: string}> = ({
  t, path, clicks = [], color = '#111',
}) => {
  let x = path[0].x, y = path[0].y;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    if (t >= a.at) {
      const p = prog(t, a.at, b.at - a.at, EASE.inOut);
      x = a.x + (b.x - a.x) * p; y = a.y + (b.y - a.y) * p;
    }
  }
  const c = clicks.find((k) => t >= k && t < k + 12);
  const r = c !== undefined ? (t - c) / 12 : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, zIndex: 50, pointerEvents: 'none'}}>
      {c !== undefined ? <div style={{position: 'absolute', left: -24 * r, top: -24 * r, width: 48 * r, height: 48 * r,
                                       borderRadius: 99, border: `3px solid ${color}`, opacity: 1 - r}} /> : null}
      <svg width={30} height={30} viewBox="0 0 24 24" style={{transform: `scale(${c !== undefined ? 0.9 : 1})`}}>
        <path d="M4 3l7 17 2.5-7.2L21 10z" fill={color} stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Strike-through line drawing across an element (e.g. "don't just clone it"). */
export const Strike: React.FC<{t: number; at: number; dur?: number; color: string; width?: number}> = ({t, at, dur = 8, color, width = 4}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: width, background: color, borderRadius: width,
               transformOrigin: 'left', transform: `scaleX(${prog(t, at, dur)})`}} />
);
