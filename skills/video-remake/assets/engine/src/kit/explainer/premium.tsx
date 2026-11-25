// Premium parts: physical, lit versions of the explainer templates (reference quality bar).
// Numbers are mechanical drum counters, grids/charts are 3D tiles/bars, cards are glass with depth,
// the CTA lives on a phone, macro shots are top-down chip dies. All pure functions of design time t.
import React, {useId} from 'react';
import {Easing} from 'remotion';
import {C, alpha, shade, sp, tint, unit} from './tokens';
import {FONT, MONO, prog} from './stage';
import {IsoBox, IsoScene, project as isoProject} from './iso';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const q = clamp01((x - a) / (b - a));
  return q * q * (3 - 2 * q);
};

// ---- mechanical drum counter ------------------------------------------------------------------------------

/** Odometer-style drum counter in a machined housing. Digits roll with mechanical carry and motion blur. */
export const DrumCounter: React.FC<{
  t: number; at: number; to: number; from?: number; dur?: number; digits?: number; size: number; unitText?: string;
  label?: string; accent?: string; housing?: boolean; decimals?: number;
}> = ({t, at, to, from = 0, dur = 32, digits, size, unitText, label, accent = C.info, housing = true, decimals = 0}) => {
  const ease = Easing.bezier(0.2, 0.9, 0.3, 1);
  const val = (tt: number) => (from + (to - from) * ease(clamp01((tt - at) / dur))) * Math.pow(10, decimals);
  const v = val(t), vPrev = val(t - 0.6);
  const n = digits ?? Math.max(1, String(Math.round(Math.abs(to) * Math.pow(10, decimals))).length);
  const cw = size * 0.68, ch = size * 1.22;
  const pos = (x: number, i: number) => {
    const P = Math.pow(10, i);
    const base = Math.floor(x / P);
    if (i === 0) return x;
    const frac = (x % P) / P;                    // progress of the lower places
    return base + smooth((P - 1) / P, 1, frac);  // carry only while the lower drum rolls 9 -> 0
  };
  const cols: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const p = pos(v, i) % 10;
    const leading = i > decimals && Math.abs(to) < Math.pow(10, i) && Math.abs(v) < Math.pow(10, i);
    const speed = Math.abs(pos(v, i) - pos(vPrev, i));
    const blur = Math.min(size * 0.06, speed * size * 0.05);
    cols.push(
      <div key={i} style={{position: 'relative', width: cw, height: ch, overflow: 'hidden', borderRadius: size * 0.06, opacity: leading ? 0.28 : 1,
                           background: 'linear-gradient(180deg,#07080A 0%,#24272D 16%,#3A3E46 50%,#24272D 84%,#07080A 100%)',
                           boxShadow: `inset 0 0 ${size * 0.08}px rgba(0,0,0,0.9)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: (ch - size * 1.1) / 2 - p * size * 1.1, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
          {Array.from({length: 11}).map((_, d) => (
            <div key={d} style={{height: size * 1.1, lineHeight: `${size * 1.1}px`, textAlign: 'center', fontFamily: FONT, fontWeight: 700,
                                 fontSize: size, color: '#F4F6F8', fontVariantNumeric: 'tabular-nums'}}>{d % 10}</div>
          ))}
        </div>
        {/* cylinder shading + glass */}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,0.8) 100%)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: ch * 0.12, height: ch * 0.12, background: 'linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0))'}} />
      </div>,
    );
    if (decimals > 0 && i === decimals) cols.push(<div key="dot" style={{width: size * 0.18, alignSelf: 'flex-end', marginBottom: size * 0.2, height: size * 0.14, borderRadius: size, background: '#F4F6F8'}} />);
  }
  const pad = size * 0.16;
  return (
    <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.14, fontFamily: FONT}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.22}}>
        <div style={{display: 'inline-flex', gap: size * 0.06, padding: housing ? pad : 0, borderRadius: size * 0.16,
                     background: housing ? 'linear-gradient(145deg,#5B606A 0%,#2A2D33 35%,#15171A 70%,#3B3F46 100%)' : undefined,
                     boxShadow: housing ? `0 ${size * 0.2}px ${size * 0.5}px rgba(0,0,0,0.6), inset 0 ${size * 0.02}px 0 rgba(255,255,255,0.25), inset 0 -${size * 0.03}px ${size * 0.05}px rgba(0,0,0,0.6)` : undefined,
                     position: 'relative'}}>
          {cols}
          {housing ? [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], k) => (
            <div key={k} style={{position: 'absolute', width: size * 0.07, height: size * 0.07, borderRadius: size,
                                 left: x ? undefined : pad * 0.3, right: x ? pad * 0.3 : undefined, top: y ? undefined : pad * 0.3, bottom: y ? pad * 0.3 : undefined,
                                 background: 'radial-gradient(circle at 35% 35%,#C9CED6,#4A4F57)'}} />
          )) : null}
          {/* activity light */}
          {housing ? <div style={{position: 'absolute', top: pad * 0.32, left: '50%', width: size * 0.22, height: size * 0.05, borderRadius: size, transform: 'translateX(-50%)',
                                   background: t >= at && t < at + dur ? accent : '#30343A', boxShadow: t >= at && t < at + dur ? `0 0 ${size * 0.2}px ${accent}` : undefined}} /> : null}
        </div>
        {unitText ? <div style={{fontSize: size * 0.36, fontWeight: 700, color: '#AEB3BA', letterSpacing: '0.02em'}}>{unitText}</div> : null}
      </div>
      {label ? <div style={{fontSize: Math.max(28, size * 0.22), fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8E9196'}}>{label}</div> : null}
    </div>
  );
};

// ---- glass card with depth ----------------------------------------------------------------------------------

/** Card that swings in from a 3D tilt and settles with a slight resting tilt; layered shadows + glass edge. */
export const GlassCard: React.FC<{
  t: number; at: number; x: number; y: number; w: number; h?: number; u: number; light?: boolean; out?: number; rest?: [number, number];
  children: React.ReactNode; style?: React.CSSProperties; radius?: number;
}> = ({t, at, x, y, w, h, u, light = false, out, rest = [4, -3], children, style, radius = 26}) => {
  if (t < at) return null;
  const s = sp(t, at, 'settle');
  const o = out !== undefined ? 1 - prog(t, out, 7) : 1;
  const rx = rest[0] + (1 - s) * 28, ry = rest[1] + (1 - s) * -18;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, perspective: 1400 * u, opacity: Math.min(1, s * 1.6) * o}}>
      <div style={{position: 'relative', width: '100%', height: '100%', transform: `rotateX(${rx}deg) rotateY(${ry}deg) translateY(${(1 - s) * 90 * u}px)`,
                   transformOrigin: '50% 100%', borderRadius: radius * u, overflow: 'hidden',
                   background: light ? 'linear-gradient(180deg,#FFFFFF 0%,#F2F4F7 100%)' : 'linear-gradient(180deg,#22252B 0%,#16181C 100%)',
                   boxShadow: `0 ${4 * u}px ${10 * u}px rgba(0,0,0,0.35), 0 ${40 * u}px ${90 * u}px rgba(0,0,0,${light ? 0.45 : 0.7}), inset 0 ${1.5 * u}px 0 rgba(255,255,255,${light ? 0.9 : 0.12}), inset 0 0 0 ${1.2 * u}px rgba(${light ? '0,0,0,0.06' : '255,255,255,0.08'})`,
                   fontFamily: FONT, color: light ? C.ink : '#F2F3F5', ...style}}>
        {children}
        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(115deg, rgba(255,255,255,${light ? 0 : 0.06}) 0%, rgba(255,255,255,0) 40%)`}} />
        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', transform: `translateX(${(-1.2 + 2.6 * prog(t, at + 6, 22)) * 100}%)`,
                     background: 'linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0) 60%)'}} />
      </div>
    </div>
  );
};

// ---- 3D tile field and bar chart (IsoScene) ----------------------------------------------------------------

/** Quantity as a picture: a field of 3D tiles; `lit` tiles rise and glow (stagger by distance from the corner). */
export const IsoTileField: React.FC<{
  t: number; at: number; cols: number; rows: number; W: number; H: number; u: number; origin: [number, number]; lit?: number; litAt?: number;
  color?: string; litColor?: string; gap?: number;
}> = ({t, at, cols, rows, W, H, u, origin, lit = 0, litAt, color = '#2B2F36', litColor = C.info, gap = 0.25}) => {
  const tiles: React.ReactNode[] = [];
  const order: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) order.push([r, k]);
  order.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));   // painter: back to front
  for (const [r, k] of order) {
    const idx = r * cols + k;
    const appear = sp(t, at + (r + k) * 0.8, 'pop');
    const on = idx < lit && t >= (litAt ?? at) + idx * 0.35;
    const rise = on ? sp(t, (litAt ?? at) + idx * 0.35, 'bouncy') : 0;
    if (appear <= 0.01) continue;
    tiles.push(<IsoBox key={idx} x={k} y={r} z={rise * 0.6} w={1 - gap} d={1 - gap} h={0.35 * appear} color={on ? litColor : color}
                       gloss={on ? 0.6 : 0.3} sheen={0.7} edge ao={false} emissive={on ? litColor : undefined} />);
  }
  return <IsoScene width={W} height={H} u={u} origin={origin}>{tiles}</IsoScene>;
};

/** 3D bar chart: glossy columns that grow on a stagger, value + label pinned above/below each bar. */
export const IsoBarChart: React.FC<{
  t: number; at: number; values: number[]; labels?: string[]; colors?: string[]; W: number; H: number; u: number; origin: [number, number];
  maxH?: number; valueText?: (v: number, i: number) => string; highlight?: number; spacing?: number;
}> = ({t, at, values, labels = [], colors = [], W, H, u, origin, maxH = 14, valueText, highlight, spacing = 4.2}) => {
  const fu = unit(W);
  const ctx = {u, tilt: 1, mode: 'dark' as const};
  const n = values.length;
  const bars: React.ReactNode[] = [];
  const texts: React.ReactNode[] = [];
  values.forEach((v, i) => {
    const g = sp(t, at + i * 4, 'settle');
    const h = Math.max(0.05, v * maxH * g);
    const x = i * spacing, y = 0;
    const col = colors[i] ?? (i === highlight ? C.info : '#5A6070');
    bars.push(<IsoBox key={i} x={x} y={y} w={2.2} d={2.2} h={h} color={col} gloss={0.5} sheen={0.8} shadow={0.6}
                      emissive={i === highlight && g > 0.9 ? col : undefined} />);
    const [tx, ty] = isoProject([x + 1.1, y + 1.1, h + 0.6], ctx);
    const [lx, ly] = isoProject([x + 1.6, y + 3.4, 0], ctx);
    if (valueText) texts.push(<text key={`v${i}`} x={tx} y={ty - 14 * fu} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={38 * fu}
                                    fill="#FFFFFF" opacity={g} style={{paintOrder: 'stroke'}} stroke="rgba(0,0,0,0.55)" strokeWidth={6 * fu}>{valueText(v * g, i)}</text>);
    if (labels[i]) texts.push(<text key={`l${i}`} x={lx} y={ly + 34 * fu} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30 * fu}
                                    fill={i === highlight ? C.info : '#8E9196'} letterSpacing={3 * fu}>{labels[i].toUpperCase()}</text>);
  });
  return (
    <IsoScene width={W} height={H} u={u} origin={origin}>
      <IsoBox x={-1} y={-1} w={n * spacing + 0.2} d={4.2} h={0.3} color="#1B1E23" gloss={0.4} sheen={0.6} shadow={0.5} />
      {bars}
      {texts}
    </IsoScene>
  );
};

// ---- pedestal + spotlight (compare scenes) ------------------------------------------------------------------

/** Lit round pedestal with a soft spotlight cone; put the compared object on top (children, HTML). */
export const Pedestal: React.FC<{cx: number; cy: number; r: number; u: number; color?: string; winner?: boolean; t: number; at: number; children?: React.ReactNode}> = ({
  cx, cy, r, u, color = '#2A2D33', winner = false, t, at, children,
}) => {
  const id = useId().replace(/:/g, '');
  const s = sp(t, at, 'settle');
  const glow = winner ? prog(t, at + 30, 14) : 0;
  const ry = r * 0.28, h = r * 0.22;
  return (
    <div style={{position: 'absolute', left: cx - r * 1.6, top: cy - r * 2.6, width: r * 3.2, height: r * 3.4, opacity: Math.min(1, s * 1.4),
                 transform: `translateY(${(1 - s) * 60 * u}px)`}}>
      <svg width={r * 3.2} height={r * 3.4} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`ps${id}`} x1="0" x2="1">
            <stop offset="0" stopColor={shade(color, 0.6)} /><stop offset="0.45" stopColor={tint(color, 0.25)} /><stop offset="1" stopColor={shade(color, 0.45)} />
          </linearGradient>
          <linearGradient id={`cone${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0.0} /><stop offset="1" stopColor={winner ? C.ok : '#fff'} stopOpacity={0.08 + 0.12 * glow} />
          </linearGradient>
        </defs>
        <polygon points={`${r * 1.6 - r * 0.25},0 ${r * 1.6 + r * 0.25},0 ${r * 2.6},${r * 2.6} ${r * 0.6},${r * 2.6}`} fill={`url(#cone${id})`} />
        <ellipse cx={r * 1.6} cy={r * 2.6 + h + ry * 0.6} rx={r * 1.25} ry={ry * 1.1} fill="rgba(0,0,0,0.55)" filter="blur(6px)" />
        <path d={`M${r * 0.6},${r * 2.6} L${r * 0.6},${r * 2.6 + h} A${r},${ry} 0 0 0 ${r * 2.6},${r * 2.6 + h} L${r * 2.6},${r * 2.6} Z`} fill={`url(#ps${id})`} />
        <ellipse cx={r * 1.6} cy={r * 2.6} rx={r} ry={ry} fill={tint(color, 0.18)} stroke={winner ? alpha(C.ok, 0.4 + 0.6 * glow) : 'rgba(255,255,255,0.18)'} strokeWidth={2.5 * u} />
        <ellipse cx={r * 1.6} cy={r * 2.6} rx={r * 0.8} ry={ry * 0.8} fill={shade(color, 0.85)} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: r * 0.85, display: 'flex', justifyContent: 'center'}}>{children}</div>
    </div>
  );
};

// ---- phone (front elevation) --------------------------------------------------------------------------------

/** Modern phone, front view: titanium frame, glass reflection, island, side buttons. Screen content = children. */
export const PhoneFrame: React.FC<{x: number; y: number; w: number; u: number; t: number; at: number; children: React.ReactNode; tiltIn?: boolean}> = ({
  x, y, w, u, t, at, children, tiltIn = true,
}) => {
  if (t < at) return null;
  const s = sp(t, at, 'settle');
  const h = w * 2.05, bz = w * 0.035, r = w * 0.16;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, perspective: 1600 * u, opacity: Math.min(1, s * 1.5)}}>
      <div style={{position: 'relative', width: w, height: h, transform: tiltIn ? `rotateY(${(1 - s) * -32}deg) rotateX(${(1 - s) * 12}deg) translateY(${(1 - s) * 120 * u}px)` : undefined}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: r, background: 'linear-gradient(135deg,#9EA3AB 0%,#53575E 30%,#2A2C30 55%,#7B8089 100%)',
                     boxShadow: `0 ${40 * u}px ${90 * u}px rgba(0,0,0,0.7), 0 ${6 * u}px ${12 * u}px rgba(0,0,0,0.4)`}} />
        {[[0.2, 0.08], [0.3, 0.12], [0.45, 0.12]].map(([top, len], k) => (
          <div key={k} style={{position: 'absolute', left: k ? -w * 0.012 : undefined, right: k ? undefined : -w * 0.012, top: h * top, width: w * 0.02, height: h * len,
                               borderRadius: w, background: 'linear-gradient(90deg,#6A6E75,#2A2C30)'}} />
        ))}
        <div style={{position: 'absolute', inset: bz * 0.45, borderRadius: r - bz * 0.45, background: '#050506'}} />
        <div style={{position: 'absolute', inset: bz, borderRadius: r - bz, overflow: 'hidden', background: '#FFFFFF'}}>
          {children}
          <div style={{position: 'absolute', top: w * 0.035, left: '50%', width: w * 0.3, height: w * 0.085, borderRadius: w, transform: 'translateX(-50%)', background: '#050506'}} />
          <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 32%)'}} />
        </div>
      </div>
    </div>
  );
};

// ---- macro chip die (top-down extreme close-up) -------------------------------------------------------------

const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Extreme close-up of a processor package, top-down: green substrate with traces and gold BGA pads, a gold
 *  heat-spreader frame, two dies with a muted metallic floorplan (cores, cache arrays, I/O strips, fine
 *  circuitry), memory stacks either side, a light sweep, vignette. `zoom` scales about the centre. */
export const MacroDie: React.FC<{W: number; H: number; t: number; at?: number; zoom?: number; dies?: number; label?: string; serial?: string; cy?: number}> = ({
  W, H, t, at = 0, zoom = 1, dies = 2, label = '', serial = '', cy: cyF = 0.48,
}) => {
  const id = useId().replace(/:/g, '');
  const cx = W / 2, cy = H * cyF;
  const frame = W * 0.36;                 // half-size of the gold frame
  const die = frame * 0.66;
  const sweep = prog(t, at + 10, 44, Easing.inOut(Easing.cubic));
  const tint4 = ['#4C6EF5', '#7950F2', '#15AABF', '#20C997'];
  const blocks: React.ReactNode[] = [];
  for (let d = 0; d < dies; d++) {
    const dw = (2 * die) / dies - die * 0.06, dh = die * 1.6;
    const dx = cx - die + d * ((2 * die) / dies) + die * 0.03, dy = cy - dh / 2;
    blocks.push(<rect key={`base${d}`} x={dx} y={dy} width={dw} height={dh} fill={`url(#die${id})`} />);
    // cores (2 x 4) with iridescent tint
    for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) {
      const bx = dx + dw * 0.06 + k * dw * 0.46, by = dy + dh * 0.05 + r * dh * 0.155, bw = dw * 0.42, bh = dh * 0.135;
      blocks.push(
        <g key={`c${d}${r}${k}`}>
          <rect x={bx} y={by} width={bw} height={bh} fill="#2B3346" />
          <rect x={bx} y={by} width={bw} height={bh} fill={tint4[(r + k + d) % 4]} opacity={0.32} />
          <rect x={bx} y={by} width={bw} height={bh} fill={`url(#fine${id})`} />
          <rect x={bx + bw * 0.08} y={by + bh * 0.2} width={bw * 0.32} height={bh * 0.6} fill="#9AA6C0" opacity={0.25} />
          <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke="rgba(210,220,240,0.35)" strokeWidth={1.2} />
        </g>,
      );
    }
    // cache array (regular grid) + I/O strip
    const cy0 = dy + dh * 0.68;
    blocks.push(<rect key={`cache${d}`} x={dx + dw * 0.06} y={cy0} width={dw * 0.88} height={dh * 0.2} fill={`url(#cache${id})`} />);
    blocks.push(<rect key={`io${d}`} x={dx + dw * 0.06} y={dy + dh * 0.9} width={dw * 0.88} height={dh * 0.06} fill="#B8935A" opacity={0.55} />);
    blocks.push(<rect key={`edge${d}`} x={dx} y={dy} width={dw} height={dh} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.6} />);
  }
  const pads: React.ReactNode[] = [];
  const pn = 26;
  for (let k = 0; k < pn; k++) for (let row = 0; row < 2; row++) for (const side of [0, 1, 2, 3]) {
    const a = -frame * 1.18 + (k + 0.5) * ((frame * 2.36) / pn);
    const off = frame * (1.16 + row * 0.1);
    const [px, py] = side === 0 ? [cx + a, cy - off] : side === 1 ? [cx + a, cy + off] : side === 2 ? [cx - off, cy + a] : [cx + off, cy + a];
    pads.push(<circle key={`${k}-${row}-${side}`} cx={px} cy={py} r={frame * 0.022} fill={`url(#pad${id})`} />);
  }
  const traces: React.ReactNode[] = [];
  for (let k = 0; k < 40; k++) {
    const a = -frame * 1.4 + rnd(k) * frame * 2.8;
    const vert = k % 2 === 0;
    const L = frame * (0.15 + rnd(k * 3) * 0.25);
    const [x0, y0] = vert ? [cx + a, cy - frame * 1.5] : [cx - frame * 1.5, cy + a];
    traces.push(<path key={k} d={vert ? `M${x0},${y0} v${L} l${frame * 0.06},${frame * 0.06} v${L * 0.5}` : `M${x0},${y0} h${L} l${frame * 0.06},${frame * 0.06} h${L * 0.5}`}
                      stroke="rgba(212,169,73,0.32)" strokeWidth={1.6} fill="none" />);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`gold${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6E3A4" /><stop offset="0.25" stopColor="#D4A949" /><stop offset="0.5" stopColor="#8E6A1F" />
          <stop offset="0.75" stopColor="#D9B25A" /><stop offset="1" stopColor="#6E5016" />
        </linearGradient>
        <radialGradient id={`pad${id}`} cx="35%" cy="35%"><stop offset="0" stopColor="#FFF0B8" /><stop offset="1" stopColor="#9A7426" /></radialGradient>
        <linearGradient id={`die${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5A6278" /><stop offset="0.5" stopColor="#262C3A" /><stop offset="1" stopColor="#3C4458" />
        </linearGradient>
        <pattern id={`fine${id}`} width={7} height={7} patternUnits="userSpaceOnUse">
          <path d="M0,3.5 H7 M3.5,0 V2 M3.5,5 V7" stroke="rgba(230,236,250,0.22)" strokeWidth={0.6} />
        </pattern>
        <pattern id={`cache${id}`} width={6} height={6} patternUnits="userSpaceOnUse">
          <rect width={6} height={6} fill="#323A4E" /><rect x={0.8} y={0.8} width={4.4} height={4.4} fill="#6C7894" opacity={0.7} />
        </pattern>
        <linearGradient id={`sw${id}`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset={Math.max(0, sweep - 0.14)} stopColor="#fff" stopOpacity={0} />
          <stop offset={sweep} stopColor="#fff" stopOpacity={0.32} />
          <stop offset={Math.min(1, sweep + 0.14)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`vig${id}`} cx="50%" cy={`${cyF * 100}%`} r="62%"><stop offset="0.5" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.8} /></radialGradient>
      </defs>
      <g transform={`translate(${cx},${cy}) scale(${zoom}) translate(${-cx},${-cy})`}>
        <rect x={cx - frame * 1.6} y={cy - frame * 1.6} width={frame * 3.2} height={frame * 3.2} rx={frame * 0.05} fill="#15291F" />
        {traces}
        {pads}
        <rect x={cx - frame - 6} y={cy - frame - 2} width={frame * 2 + 12} height={frame * 2 + 12} rx={frame * 0.05} fill="rgba(0,0,0,0.5)" />
        <rect x={cx - frame} y={cy - frame} width={frame * 2} height={frame * 2} rx={frame * 0.05} fill={`url(#gold${id})`} />
        <rect x={cx - frame * 0.92} y={cy - frame * 0.92} width={frame * 1.84} height={frame * 1.84} rx={frame * 0.035} fill="#0B0D10" />
        {[-1, 1].map((sgn) => [0, 1, 2, 3].map((k) => {
          const mx = cx + sgn * frame * 0.81 - frame * 0.08, my = cy - frame * 0.82 + k * frame * 0.43;
          return (
            <g key={`${sgn}${k}`}>
              <rect x={mx} y={my} width={frame * 0.16} height={frame * 0.36} rx={3} fill={`url(#gold${id})`} />
              <rect x={mx + frame * 0.025} y={my + frame * 0.03} width={frame * 0.11} height={frame * 0.3} rx={2} fill="#7A5C20" opacity={0.55} />
            </g>
          );
        }))}
        {blocks}
        <rect x={cx - frame} y={cy - frame} width={frame * 2} height={frame * 2} fill={`url(#sw${id})`} style={{mixBlendMode: 'screen'}} />
        {label ? <text x={cx + frame * 0.88} y={cy + frame * 0.96} textAnchor="end" fontFamily={MONO} fontSize={frame * 0.055} fill="rgba(60,40,10,0.8)">{label}</text> : null}
        {serial ? <text x={cx - frame * 0.88} y={cy - frame * 0.945} fontFamily={MONO} fontSize={frame * 0.05} fill="rgba(60,40,10,0.8)" letterSpacing={3}>{serial}</text> : null}
      </g>
      <rect width={W} height={H} fill={`url(#vig${id})`} />
    </svg>
  );
};

// ---- chapter title (metal text + sweep) ---------------------------------------------------------------------

export const MetalTitle: React.FC<{t: number; at: number; kicker?: string; title: string; W: number; y: number; out?: number}> = ({t, at, kicker, title, W, y, out}) => {
  const u = unit(W);
  if (t < at) return null;
  const s = sp(t, at, 'pop');
  const o = out !== undefined ? 1 - prog(t, out, 6) : 1;
  const sweep = prog(t, at + 4, 18);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT, opacity: Math.min(1, s * 1.5) * o,
                 transform: `scale(${0.86 + 0.14 * s})`, filter: `blur(${(1 - Math.min(1, s * 1.2)) * 10}px)`}}>
      {kicker ? <div style={{fontSize: 34 * u, fontWeight: 700, letterSpacing: '0.24em', color: C.info, textShadow: `0 0 ${18 * u}px ${alpha(C.info, 0.6)}`}}>{kicker}</div> : null}
      <div style={{fontSize: 118 * u, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: 10 * u,
                   backgroundImage: `linear-gradient(105deg, #8A9099 0%, #F4F6F8 ${Math.max(0, sweep * 100 - 12)}%, #FFFFFF ${sweep * 100}%, #F4F6F8 ${Math.min(100, sweep * 100 + 12)}%, #9AA0A8 100%)`,
                   WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 ${8 * u}px ${18 * u}px rgba(0,0,0,0.6))`}}>{title}</div>
      <div style={{margin: `${18 * u}px auto 0`, width: 260 * u * prog(t, at + 6, 14), height: 4 * u, borderRadius: 4 * u,
                   background: `linear-gradient(90deg, ${alpha(C.info, 0)}, ${C.info}, ${alpha(C.info, 0)})`}} />
    </div>
  );
};

/** Hero number (big_number template): drum counter centred in the stage band with unit, label and an optional source line. */
export const HeroNumber: React.FC<{
  t: number; at: number; to: number; W: number; H: number; unitText?: string; label?: string; source?: string; y?: number; size?: number; decimals?: number; accent?: string;
}> = ({t, at, to, W, H, unitText, label, source, y, size, decimals = 0, accent}) => {
  const u = unit(W);
  if (t < at) return null;
  const s = sp(t, at, 'pop');
  const digits = String(Math.round(Math.abs(to) * Math.pow(10, decimals))).length;
  const sz = size ?? Math.min(150 * u, (W * 0.74) / (digits * 0.76 + (unitText ? 1.6 : 0.4)));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y ?? H * 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 * u,
                 opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * 50 * u}px) scale(${0.9 + 0.1 * s})`}}>
      <DrumCounter t={t} at={at + 4} to={to} size={sz} unitText={unitText} label={label} decimals={decimals} accent={accent} />
      {source ? <div style={{fontFamily: FONT, fontSize: 24 * u, color: '#7E838A', opacity: prog(t, at + 20, 8)}}>{source}</div> : null}
    </div>
  );
};
