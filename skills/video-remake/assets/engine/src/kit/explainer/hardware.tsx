// Detail layer for 2.5D hardware (reference quality bar: dense micro-detail, real materials, lighting).
// Everything is still flat SVG inside an IsoScene. World units: 1 unit ~ 1 mm works well for boards/chips.
import React, {useId} from 'react';
import {C, alpha, shade, tint} from './tokens';
import {IsoBox, OnFace, type P3, project, useIso} from './iso';

const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export const MAT = {
  epoxy: {color: '#26282D', gloss: 0.9, sheen: 0.7},
  pcb: {color: '#173A2A', gloss: 0.25, sheen: 0.6},
  pcbBlack: {color: '#1B1D21', gloss: 0.25, sheen: 0.6},
  gold: {color: '#D8AE52', gloss: 1, sheen: 1},
  metal: {color: '#B8BEC7', gloss: 1, sheen: 0.95},
  ceramic: {color: '#B79E78', gloss: 0.3, sheen: 0.5},
  tin: {color: '#D9DCE0', gloss: 0.8, sheen: 0.9},
} as const;

/** SMD capacitor / resistor: ceramic body with two tinned end caps. along = 'x' | 'y'. */
export const SmdCap: React.FC<{x: number; y: number; z?: number; l?: number; w?: number; h?: number; along?: 'x' | 'y'; body?: string}> = ({
  x, y, z = 0, l = 1.6, w = 0.8, h = 0.7, along = 'x', body = MAT.ceramic.color,
}) => {
  const cap = l * 0.24;
  if (along === 'x') {
    return (
      <g>
        <IsoBox x={x} y={y} z={z} w={cap} d={w} h={h} color={MAT.tin.color} gloss={0.8} sheen={0.9} edge={false} ao={false} />
        <IsoBox x={x + cap} y={y} z={z} w={l - 2 * cap} d={w} h={h * 0.96} color={body} sheen={0.4} edge={false} ao={false} />
        <IsoBox x={x + l - cap} y={y} z={z} w={cap} d={w} h={h} color={MAT.tin.color} gloss={0.8} sheen={0.9} edge={false} ao={false} />
      </g>
    );
  }
  return (
    <g>
      <IsoBox x={x} y={y} z={z} w={w} d={cap} h={h} color={MAT.tin.color} gloss={0.8} sheen={0.9} edge={false} ao={false} />
      <IsoBox x={x} y={y + cap} z={z} w={w} d={l - 2 * cap} h={h * 0.96} color={body} sheen={0.4} edge={false} ao={false} />
      <IsoBox x={x} y={y + l - cap} z={z} w={w} d={cap} h={h} color={MAT.tin.color} gloss={0.8} sheen={0.9} edge={false} ao={false} />
    </g>
  );
};

/** A row/grid of SMD parts with seeded variation (draw order: back to front). */
export const SmdArray: React.FC<{x: number; y: number; z?: number; cols: number; rows: number; dx?: number; dy?: number; seed?: number; along?: 'x' | 'y'}> = ({
  x, y, z = 0, cols, rows, dx = 2.2, dy = 1.5, seed = 1, along = 'x',
}) => {
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const v = rnd(seed * 31 + r * 7 + k);
      if (v < 0.12) continue;
      const big = v > 0.82;
      out.push(<SmdCap key={`${r}-${k}`} x={x + k * dx} y={y + r * dy} z={z} l={big ? 2.0 : 1.6} w={big ? 1.25 : 0.8} h={big ? 1.1 : 0.7}
                       along={along} body={big ? '#8C7A5C' : v > 0.5 ? MAT.ceramic.color : '#2A2B2E'} />);
    }
  }
  return <g>{out}</g>;
};

/** Gold edge-connector fingers along the board's x = x0 edge (M.2 / RAM style). */
export const GoldFingers: React.FC<{x: number; y: number; z: number; n: number; len?: number; pitch?: number; gapAt?: number}> = ({
  x, y, z, n, len = 3.2, pitch = 0.5, gapAt,
}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    if (gapAt !== undefined && i >= gapAt && i < gapAt + 2) continue;
    out.push(<IsoBox key={i} x={x} y={y + i * pitch} z={z} w={len} d={pitch * 0.66} h={0.05} color={MAT.gold.color} gloss={1} sheen={1}
                     edge={false} ao={false} lit />);
  }
  return <g>{out}</g>;
};

/** Glossy black epoxy package (BGA/TSOP look) with laser-etched text, pin-1 mark and bevel highlight. */
export const EpoxyChip: React.FC<{
  x: number; y: number; z?: number; w: number; d: number; h?: number; lines?: string[]; logo?: string; xray?: number;
  xrayNode?: React.ReactNode; color?: string;
}> = ({x, y, z = 0, w, d, h = 1.2, lines = [], logo, xray = 0, xrayNode, color = MAT.epoxy.color}) => {
  const cw = 100, ch = (100 * d) / w;
  const etched = (
    <g opacity={1 - xray}>
      <circle cx={7} cy={7} r={2.4} fill="rgba(255,255,255,0.18)" />
      {logo ? <text x={cw / 2} y={ch * 0.42} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={700} fontSize={Math.min(16, ch * 0.22)}
                    fill="rgba(235,238,242,0.62)" letterSpacing={1}>{logo}</text> : null}
      {lines.map((l, i) => (
        <text key={i} x={cw / 2} y={ch * 0.42 + (logo ? 14 : 0) + i * 9} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
              fontSize={7} fill="rgba(235,238,242,0.42)" letterSpacing={0.6}>{l}</text>
      ))}
    </g>
  );
  return (
    <g>
      {xray > 0 && xrayNode ? (
        <OnFace o={[x, y, z + 0.15]} a={[x + w, y, z + 0.15]} b={[x, y + d, z + 0.15]} cw={cw} ch={ch} opacity={xray}>{xrayNode}</OnFace>
      ) : null}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} color={color} gloss={0.9} sheen={0.7} glass={xray}
              topContent={{cw, ch, node: etched}} />
    </g>
  );
};

/** Silkscreen text / marks on a face (white, slightly worn). Place via OnFace or a box's topContent. */
export const Silk: React.FC<{x: number; y: number; text: string; size?: number; anchor?: 'start' | 'middle' | 'end'; rot?: number}> = ({
  x, y, text, size = 5, anchor = 'start', rot = 0,
}) => (
  <text x={x} y={y} fontSize={size} fontFamily="Poppins, sans-serif" fontWeight={600} fill="rgba(240,242,236,0.72)" textAnchor={anchor}
        letterSpacing={0.4} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>{text}</text>
);

/** Trace + via pattern for a board top face (content box 100 x ch). Copper-ish traces under the solder mask. */
export const TracePattern: React.FC<{ch: number; seed?: number; n?: number; color?: string}> = ({ch, seed = 5, n = 60, color}) => {
  const tc = color ?? 'rgba(120,190,150,0.16)';
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const sx = rnd(seed + i) * 100, sy = rnd(seed * 3 + i * 1.7) * ch;
    const L = 6 + rnd(seed + i * 2.3) * 26;
    const horiz = rnd(seed + i * 5.1) > 0.4;
    const k = 2 + rnd(i * 3.3) * 4;
    const ex = horiz ? Math.min(99, sx + L) : sx + k, ey = horiz ? sy + k * (rnd(i) > 0.5 ? 1 : -1) : Math.min(ch - 1, sy + L);
    out.push(
      <g key={i}>
        <polyline points={`${sx},${sy} ${horiz ? ex - k : sx},${horiz ? sy : ey - k} ${ex},${ey}`} fill="none" stroke={tc} strokeWidth={0.55}
                  strokeLinejoin="round" strokeLinecap="round" />
        {rnd(i * 9.1) > 0.55 ? <circle cx={ex} cy={ey} r={0.75} fill="rgba(210,190,140,0.55)" stroke="rgba(0,0,0,0.35)" strokeWidth={0.2} /> : null}
      </g>,
    );
  }
  for (let i = 0; i < n * 0.6; i++) {
    out.push(<circle key={`v${i}`} cx={rnd(seed * 7 + i * 1.3) * 100} cy={rnd(seed * 11 + i * 2.9) * ch} r={0.45} fill="rgba(210,190,140,0.4)" />);
  }
  return <g>{out}</g>;
};

/** Mounting half-hole with gold ring. */
export const MountHole: React.FC<{cx: number; cy: number; r?: number}> = ({cx, cy, r = 2.2}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#C9A24A" />
    <circle cx={cx} cy={cy} r={r * 0.62} fill="#0B0C0E" />
    <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.9} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} strokeDasharray="2 6" />
  </g>
);

/** Flash cell field (x-ray content for a NAND package): rows of cells, some lit, a glowing active block. */
export const CellField: React.FC<{cw: number; ch: number; t: number; lit?: string; seed?: number; activeRow?: number}> = ({
  cw, ch, t, lit = C.info, seed = 3, activeRow,
}) => {
  const id = useId().replace(/:/g, '');
  const cols = 22, rows = Math.max(6, Math.round((ch / cw) * cols));
  const cs = cw / cols;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const v = rnd(seed * 13 + r * 31 + k);
      const active = activeRow !== undefined && r === activeRow && k <= ((t * 0.9) % (cols + 6));
      const stored = v > 0.62;
      const on = active || (activeRow === undefined && v > 0.55);
      out.push(<rect key={`${r}-${k}`} x={k * cs + cs * 0.12} y={r * (ch / rows) + cs * 0.12} width={cs * 0.76} height={ch / rows - cs * 0.24} rx={0.8}
                     fill={on ? lit : stored ? shade(lit, 0.55) : '#232A36'} opacity={on ? 1 : stored ? 0.75 : 0.9} />);
    }
  }
  return (
    <g>
      <defs><filter id={`cf${id}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={2.4} /></filter></defs>
      <rect width={cw} height={ch} fill="#0E1218" />
      {out}
      <g filter={`url(#cf${id})`} opacity={1} style={{mixBlendMode: 'screen'}}>
        {out.filter((_, i) => (out[i] as React.ReactElement<{fill: string}>).props.fill === lit)}
      </g>
    </g>
  );
};

/** Light beam / cone from a point (UV, laser, data) - screen-blended gradient polygon. */
export const Beam: React.FC<{from: [number, number]; to: [number, number]; width: number; color: string; strength?: number}> = ({from, to, width, color, strength = 0.7}) => {
  const id = useId().replace(/:/g, '');
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const nx = -Math.sin(ang) * width / 2, ny = Math.cos(ang) * width / 2;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`bm${id}`} gradientUnits="userSpaceOnUse" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
          <stop offset="0" stopColor={color} stopOpacity={strength} />
          <stop offset="1" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <polygon points={`${from[0]},${from[1]} ${to[0] + nx},${to[1] + ny} ${to[0] - nx},${to[1] - ny}`} fill={`url(#bm${id})`} />
    </g>
  );
};

// ---- stage lighting (HTML/SVG overlays in frame coordinates) -------------------------------------------------

/** Pool of light on the stage + soft haze + colour rim. Put it UNDER the IsoScene. */
export const StageLight: React.FC<{W: number; H: number; cx?: number; cy?: number; r?: number; color?: string; rim?: string; strength?: number}> = ({
  W, H, cx = 0.5, cy = 0.47, r = 0.62, color = '#FFFFFF', rim, strength = 0.11,
}) => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse ${r * W}px ${r * H * 0.42}px at ${cx * 100}% ${cy * 100}%, ${alpha(color, strength)}, transparent 70%)`}} />
    {rim ? <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse ${W * 0.7}px ${H * 0.25}px at 85% 30%, ${alpha(rim, 0.12)}, transparent 70%)`}} /> : null}
  </div>
);

/** Fake depth of field: blurred, darkened bands at the top and bottom of the stage band (put it OVER the stage). */
export const DepthBands: React.FC<{W: number; H: number; top?: number; bottom?: number; band?: number; blur?: number; bg?: string}> = ({
  W, H, top = 0.25, bottom = 0.72, band = 0.07, blur = 10, bg = C.bgDark,
}) => {
  const bh = H * band;
  const fade = (dir: 'down' | 'up'): React.CSSProperties => ({
    WebkitMaskImage: `linear-gradient(${dir === 'down' ? 'to bottom' : 'to top'}, black 0%, black 35%, transparent 100%)`,
    maskImage: `linear-gradient(${dir === 'down' ? 'to bottom' : 'to top'}, black 0%, black 35%, transparent 100%)`,
  });
  return (
    <>
      <div style={{position: 'absolute', left: 0, width: W, top: H * top - bh * 0.35, height: bh, backdropFilter: `blur(${blur}px)`,
                   background: `linear-gradient(to bottom, ${alpha(bg, 0.85)}, ${alpha(bg, 0)})`, ...fade('down')}} />
      <div style={{position: 'absolute', left: 0, width: W, top: H * bottom - bh * 0.65, height: bh, backdropFilter: `blur(${blur}px)`,
                   background: `linear-gradient(to top, ${alpha(bg, 0.9)}, ${alpha(bg, 0)})`, ...fade('up')}} />
    </>
  );
};

/** Crop the stage to its band (y 25-72 %) so full-bleed art never runs into captions or presenter. */
export const StageBand: React.FC<{W: number; H: number; top?: number; bottom?: number; children: React.ReactNode}> = ({
  W, H, top = 0.235, bottom = 0.735, children,
}) => (
  <div style={{position: 'absolute', left: 0, top: H * top, width: W, height: H * (bottom - top), overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: -H * top, width: W, height: H}}>{children}</div>
  </div>
);

export {tint, shade, project, useIso};
export type {P3};
