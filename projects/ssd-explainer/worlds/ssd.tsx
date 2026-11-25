// SSD worlds (S01 hook, S02 "open one up", S10 callback): one hand-drawn M.2 NVMe drive in a dimetric 2.5D
// projection, shared by the three scenes (and by the proof world). Everything is a pure function of t.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {pulseOn, wordAt} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

// ---- maths ---------------------------------------------------------------------------------------------------
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// smooth eased ramp for inner zooms (Ved: no jumpy camera) - replaces springs in K
const ramp = (t: number, at: number, d = 26) => { const q = Math.max(0, Math.min(1, (t - at) / d)); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (x: number) => {
  const q = clamp01(x);
  return q * q * (3 - 2 * q);
};
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// ---- projection: board units (u along the length, v across, z up) -> world px -----------------------------------
export const AX = 0.46, AY = -0.8, BX = 0.82, BY = 0.4, OX = 900, OY = 2200;
export type P2 = [number, number];
export const P = (u: number, v: number, z = 0): P2 => [OX + u * AX + v * BX, OY + u * AY + v * BY - z];
export const plane = (z = 0) => `matrix(${AX},${AY},${BX},${BY},${OX},${OY - z})`;
/** text frame inside a plane group: x runs along +v (screen right-down), y runs along -u (screen down-left) */
const along = (u: number, v: number) => `matrix(0,1,-1,0,${u},${v})`;
/** vertical face spanned by v (x) and z (y up -> negative) at (u, v, z) */
const faceV = (u: number, v: number, z = 0) => {
  const [x, y] = P(u, v, z);
  return `matrix(${BX},${BY},0,1,${x},${y})`;
};
const pts = (a: P2[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
export const anchor = (u: number, v: number, z: number, zoom: number) => {
  const [x, y] = P(u, v, z);
  return {x, y, zoom};
};

// ---- geometry of the drive ----------------------------------------------------------------------------------------
export const PZ = 40;          // platform top
export const BT = PZ + 20;     // board top
export const CH = 14;          // chip height
export const NAND_U = [700, 1120], NAND_V = 50, NAND_W = 380, NAND_D = 340;
const NR = 15, NC = 13, CPU = (NAND_W - 32) / NR, CPV = (NAND_D - 32) / NC, CS = 17;
export const cellUV = (chip: number, r: number, c: number): P2 => [NAND_U[chip] + 16 + (r + 0.5) * CPU, NAND_V + 16 + (c + 0.5) * CPV];
const CZ = BT + 3;
const BOARD = 'M0,0 H1600 V192 A28 28 0 0 0 1600 248 V440 H0 V356 H55 V330 H0 Z';

const CY = '#5CC8FF', BL = '#3B8CFF', AM = '#FFC247', RED = '#FF4D5E';

// ---- primitives -----------------------------------------------------------------------------------------------------
type BoxP = {u: number; v: number; w: number; d: number; h: number; z?: number; top: string; left: string; right: string; opacity?: number;
             topOpacity?: number; sideOpacity?: number; stroke?: string; sw?: number; children?: React.ReactNode};
export const Box: React.FC<BoxP> = ({u, v, w, d, h, z = 0, top, left, right, opacity = 1, topOpacity = 1, sideOpacity = 1, stroke, sw = 1, children}) => (
  <g opacity={opacity}>
    <polygon points={pts([P(u, v, z), P(u, v + d, z), P(u, v + d, z + h), P(u, v, z + h)])} fill={left} opacity={sideOpacity} stroke={stroke} strokeWidth={sw * 0.8} />
    <polygon points={pts([P(u, v + d, z), P(u + w, v + d, z), P(u + w, v + d, z + h), P(u, v + d, z + h)])} fill={right} opacity={sideOpacity} stroke={stroke} strokeWidth={sw * 0.8} />
    <g transform={plane(z + h)}>
      <g transform={`translate(${u},${v})`}>
        <rect width={w} height={d} fill={top} opacity={topOpacity} stroke={stroke} strokeWidth={sw} />
        {children}
      </g>
    </g>
  </g>
);

const Defs: React.FC<{id: string; light?: boolean}> = ({id, light}) => (
  <defs>
    <linearGradient id={`${id}-pcb`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#24589A" /><stop offset="0.45" stopColor="#143460" /><stop offset="1" stopColor="#0C2140" />
    </linearGradient>
    <linearGradient id={`${id}-epoxy`} x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stopColor="#3C424E" /><stop offset="0.3" stopColor="#1C1F26" /><stop offset="0.62" stopColor="#111317" /><stop offset="1" stopColor="#2B303A" />
    </linearGradient>
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#7C5C1A" /><stop offset="0.25" stopColor="#F5DC8E" /><stop offset="0.55" stopColor="#D2A546" /><stop offset="0.8" stopColor="#FFF1BC" /><stop offset="1" stopColor="#B4842A" />
    </linearGradient>
    <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
      {light
        ? <><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.5" stopColor="#E9EEF5" /><stop offset="1" stopColor="#CBD5E2" /></>
        : <><stop offset="0" stopColor="#2C3B4F" /><stop offset="0.5" stopColor="#18222F" /><stop offset="1" stopColor="#0E151F" /></>}
    </linearGradient>
    <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#F4F7FA" /><stop offset="0.4" stopColor="#8E98A6" /><stop offset="0.6" stopColor="#D9DEE5" /><stop offset="1" stopColor="#5E6672" />
    </linearGradient>
    <radialGradient id={`${id}-pool`}><stop offset="0" stopColor={light ? '#FFFFFF' : '#3F7DD6'} stopOpacity={light ? 0.9 : 0.42} /><stop offset="0.6" stopColor={light ? '#FFFFFF' : '#1E4C8F'} stopOpacity={light ? 0.4 : 0.14} /><stop offset="1" stopColor={light ? '#FFFFFF' : '#1E4C8F'} stopOpacity="0" /></radialGradient>
    <radialGradient id={`${id}-shadow`}><stop offset="0" stopColor="#000" stopOpacity={light ? 0.28 : 0.7} /><stop offset="0.7" stopColor="#000" stopOpacity={light ? 0.1 : 0.3} /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
    <radialGradient id={`${id}-el`}><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.28" stopColor="#FFE98A" /><stop offset="0.55" stopColor="#FFB629" stopOpacity="0.55" /><stop offset="1" stopColor="#FF9A1F" stopOpacity="0" /></radialGradient>
    <radialGradient id={`${id}-gc`}><stop offset="0" stopColor={CY} stopOpacity="0.9" /><stop offset="0.4" stopColor={BL} stopOpacity="0.35" /><stop offset="1" stopColor={BL} stopOpacity="0" /></radialGradient>
    <radialGradient id={`${id}-ga`}><stop offset="0" stopColor="#FFF3C4" stopOpacity="0.95" /><stop offset="0.35" stopColor={AM} stopOpacity="0.45" /><stop offset="1" stopColor="#FF8A1F" stopOpacity="0" /></radialGradient>
    <radialGradient id={`${id}-gr`}><stop offset="0" stopColor="#FFB0B8" stopOpacity="0.9" /><stop offset="0.4" stopColor={RED} stopOpacity="0.35" /><stop offset="1" stopColor={RED} stopOpacity="0" /></radialGradient>
    <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE3FF" stopOpacity="0.22" /><stop offset="1" stopColor="#BFE3FF" stopOpacity="0" /></linearGradient>
    <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFF" stopOpacity="0" /><stop offset="0.5" stopColor="#FFF" stopOpacity="0.5" /><stop offset="1" stopColor="#FFF" stopOpacity="0" /></linearGradient>
    <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F7BFF" /><stop offset="0.6" stopColor="#8FD0FF" /><stop offset="1" stopColor="#FFE2B0" /></linearGradient>
    <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#DCE6F2" /></linearGradient>
    <linearGradient id={`${id}-song`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B36BFF" /><stop offset="1" stopColor="#5B2BD6" /></linearGradient>
    <radialGradient id={`${id}-spec`}><stop offset="0" stopColor="#CFE6FF" stopOpacity="0.2" /><stop offset="1" stopColor="#CFE6FF" stopOpacity="0" /></radialGradient>
    <clipPath id={`${id}-bclip`}><path d={BOARD} /></clipPath>
  </defs>
);

// ---- chip ---------------------------------------------------------------------------------------------------------------
export type ChipState = {xray?: number; lift?: number; inner?: React.ReactNode; glow?: number; edge?: string};
const Chip: React.FC<{id: string; u: number; v: number; w: number; d: number; title: string; lines: string[]; st?: ChipState; big?: boolean}> = ({
  id, u, v, w, d, title, lines, st = {}, big,
}) => {
  const xr = st.xray ?? 0, lift = st.lift ?? 0, glow = st.glow ?? 0, edge = st.edge ?? CY;
  const z = BT;
  return (
    <g>
      {/* contact shadow on the board */}
      <g transform={plane(z)}><rect x={u - 9} y={v + 3} width={w + 6} height={d + 9} rx={6} fill="#000" opacity={0.42 * (1 - xr * 0.6)} /></g>
      {xr > 0.01 ? (
        <g transform={plane(z + 2)} opacity={Math.min(1, xr * 1.4)}>
          <rect x={u + 3} y={v + 3} width={w - 6} height={d - 6} rx={5} fill="#050C17" stroke={edge} strokeOpacity={0.55} strokeWidth={1.4} />
          {st.inner}
        </g>
      ) : null}
      {/* body walls */}
      <polygon points={pts([P(u, v, z), P(u, v + d, z), P(u, v + d, z + CH), P(u, v, z + CH)])} fill={xr > 0.5 ? '#0D2A4A' : '#12151A'} opacity={1 - xr * 0.72}
               stroke={xr > 0.01 ? edge : undefined} strokeOpacity={xr * 0.7} strokeWidth={1} />
      <polygon points={pts([P(u, v + d, z), P(u + w, v + d, z), P(u + w, v + d, z + CH), P(u, v + d, z + CH)])} fill={xr > 0.5 ? '#0A2140' : '#08090C'} opacity={1 - xr * 0.72}
               stroke={xr > 0.01 ? edge : undefined} strokeOpacity={xr * 0.7} strokeWidth={1} />
      {/* lid (lifts when opened) */}
      {lift > 0.5 ? (
        <>
          <polygon points={pts([P(u, v, z + CH + lift - 4), P(u, v + d, z + CH + lift - 4), P(u, v + d, z + CH + lift), P(u, v, z + CH + lift)])} fill="#1A2A40" opacity={0.75} stroke={edge} strokeOpacity={0.6} strokeWidth={0.8} />
          <polygon points={pts([P(u, v + d, z + CH + lift - 4), P(u + w, v + d, z + CH + lift - 4), P(u + w, v + d, z + CH + lift), P(u, v + d, z + CH + lift)])} fill="#12203A" opacity={0.75} stroke={edge} strokeOpacity={0.6} strokeWidth={0.8} />
        </>
      ) : null}
      <g transform={plane(z + CH + lift)}>
        <g transform={`translate(${u},${v})`}>
          <rect width={w} height={d} rx={4} fill={`url(#${id}-epoxy)`} opacity={1 - xr * 0.9} />
          <rect width={w} height={d} rx={4} fill={xr > 0.01 ? '#5CC8FF' : 'none'} fillOpacity={xr * 0.05} stroke={xr > 0.01 ? edge : 'rgba(255,255,255,0.16)'} strokeOpacity={xr > 0.01 ? 0.35 + xr * 0.5 : 1} strokeWidth={1.3} />
          <g opacity={1 - xr}>
            <rect x={5} y={5} width={w - 10} height={d - 10} rx={3} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            {/* gloss band */}
            <polygon points={`${w * 0.52},0 ${w * 0.74},0 ${w * 0.3},${d} ${w * 0.08},${d}`} fill="rgba(255,255,255,0.055)" />
            <polygon points={`${w * 0.8},0 ${w * 0.86},0 ${w * 0.42},${d} ${w * 0.36},${d}`} fill="rgba(255,255,255,0.04)" />
            <line x1={1} y1={2} x2={1} y2={d - 2} stroke="rgba(255,255,255,0.34)" strokeWidth={2} />
            <line x1={2} y1={d - 1} x2={w - 2} y2={d - 1} stroke="rgba(255,255,255,0.16)" strokeWidth={2} />
            <circle cx={w - 18} cy={18} r={6} fill="rgba(255,255,255,0.2)" />
            <circle cx={w - 18} cy={18} r={3} fill="rgba(0,0,0,0.35)" />
            <g transform={along(w, 0)}>
              <text x={d / 2} y={w * (big ? 0.42 : 0.44)} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={big ? 46 : 34} fill="rgba(226,233,244,0.6)" letterSpacing={3}>{title}</text>
              {lines.map((l, i) => (
                <text key={i} x={d / 2} y={w * (big ? 0.42 : 0.44) + (big ? 40 : 30) + i * (big ? 26 : 21)} textAnchor="middle" fontFamily={MONO} fontSize={big ? 19 : 15}
                      fill="rgba(226,233,244,0.36)" letterSpacing={2}>{l}</text>
              ))}
            </g>
          </g>
          {glow > 0.01 ? <rect x={-10} y={-10} width={w + 20} height={d + 20} rx={12} fill="none" stroke={edge} strokeWidth={10} opacity={glow * 0.35} /> : null}
          {glow > 0.01 ? <rect width={w} height={d} rx={4} fill={edge} opacity={glow * 0.16} /> : null}
        </g>
      </g>
    </g>
  );
};

// ---- the drive -----------------------------------------------------------------------------------------------------------
type Part = {key: string; depth: number; node: React.ReactNode};
const depthOf = (u: number, v: number, d: number) => u - 0.5 * (v + d);

export type DriveProps = {
  id: string; t: number; light?: boolean; chips?: Partial<Record<'ctrl' | 'dram' | 'n1' | 'n2', ChipState>>;
  sheen?: number; scan?: number; led?: number; strip?: number; boardGlow?: number; hidePlatform?: boolean;
};

export const Drive: React.FC<DriveProps> = ({id, light, chips = {}, sheen = -1, scan = -1, led = 0.6, strip = 0.6, boardGlow = 0, hidePlatform}) => {
  const parts: Part[] = [];
  const cap = (key: string, u: number, v: number, alongU: boolean, kind: number, s = 1) => {
    const w = (alongU ? 24 : 13) * s, d = (alongU ? 13 : 24) * s, h = kind === 2 ? 11 : 7;
    const body = kind === 0 ? '#B89C72' : kind === 1 ? '#26282D' : '#D9952B';
    parts.push({key, depth: depthOf(u, v, d), node: (
      <Box key={key} u={u} v={v} w={w} d={d} h={h} z={BT} top={body} left={kind === 1 ? '#15161A' : kind === 2 ? '#9A6412' : '#8C7350'} right={kind === 1 ? '#0C0D10' : kind === 2 ? '#74490A' : '#6B573B'}>
        {alongU
          ? <><rect width={w * 0.24} height={d} fill="#E1E5EA" /><rect x={w * 0.76} width={w * 0.24} height={d} fill="#C9CED6" /></>
          : <><rect width={w} height={d * 0.24} fill="#E1E5EA" /><rect y={d * 0.76} width={w} height={d * 0.24} fill="#C9CED6" /></>}
        <rect width={w} height={d} fill="rgba(255,255,255,0.08)" />
      </Box>
    )});
  };
  let n = 0;
  for (let i = 0; i < 11; i++) if (rnd(i * 3.1) > 0.15) cap(`a${n++}`, 1088, 62 + i * 29.5, true, rnd(i * 7) > 0.6 ? 1 : 0);
  for (let i = 0; i < 12; i++) {
    if (rnd(i * 5.3 + 1) > 0.2) cap(`b${n++}`, 646, 58 + i * 27.5, true, rnd(i * 2.2) > 0.7 ? 1 : 0, 0.9);
    if (rnd(i * 4.1 + 2) > 0.3) cap(`c${n++}`, 673, 58 + i * 27.5, true, rnd(i * 9.2) > 0.5 ? 1 : 0, 0.9);
  }
  for (let i = 0; i < 9; i++) if (rnd(i * 6.7 + 3) > 0.15) cap(`d${n++}`, 432, 108 + i * 27, true, rnd(i * 1.7) > 0.6 ? 1 : 0);
  for (let i = 0; i < 8; i++) {
    if (rnd(i * 2.9 + 4) > 0.2) cap(`e${n++}`, 158 + i * 32, 34, false, rnd(i * 3.7) > 0.55 ? 1 : 0);
    if (rnd(i * 8.3 + 5) > 0.2) cap(`f${n++}`, 158 + i * 32, 380, false, rnd(i * 4.9) > 0.55 ? 1 : 0);
  }
  for (let i = 0; i < 5; i++) {
    cap(`g${n++}`, 626 - i * 24, 350, false, i % 2);
    if (i < 4) cap(`h${n++}`, 86, 100 + i * 62, true, i % 2 ? 0 : 1, 1.1);
  }
  cap('t1', 1524, 300, true, 2, 1.7); cap('t2', 1524, 340, true, 2, 1.7); cap('t3', 1524, 380, true, 2, 1.7);
  cap('t4', 1570, 64, false, 0); cap('t5', 1570, 104, false, 1); cap('t6', 1514, 150, true, 0);
  // inductor
  parts.push({key: 'ind', depth: depthOf(1514, 54, 60), node: (
    <Box key="ind" u={1514} v={54} w={46} d={60} h={22} z={BT} top="#3A3F48" left="#23262C" right="#16181C">
      <rect x={4} y={4} width={38} height={52} rx={6} fill="#2A2E36" stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
      <g transform={along(46, 0)}><text x={30} y={29} textAnchor="middle" fontFamily={MONO} fontSize={13} fill="rgba(255,255,255,0.55)">2R2</text></g>
    </Box>
  )});
  // PMIC + small ICs
  const smallIc = (key: string, u: number, v: number, w: number, d: number, label: string) => parts.push({key, depth: depthOf(u, v, d), node: (
    <Box key={key} u={u} v={v} w={w} d={d} h={9} z={BT} top={`url(#${id}-epoxy)`} left="#12151A" right="#08090C" stroke="rgba(255,255,255,0.1)">
      <circle cx={w - 7} cy={7} r={2.5} fill="rgba(255,255,255,0.3)" />
      <g transform={along(w, 0)}><text x={d / 2} y={w / 2 + 4} textAnchor="middle" fontFamily={MONO} fontSize={10} fill="rgba(226,233,244,0.45)">{label}</text></g>
    </Box>
  )});
  smallIc('pm', 500, 28, 64, 66, 'PMIC');
  smallIc('ic2', 590, 30, 40, 50, 'U7');
  // chips
  const chip = (key: 'ctrl' | 'dram' | 'n1' | 'n2', u: number, v: number, w: number, d: number, title: string, lines: string[], big = false) =>
    parts.push({key, depth: depthOf(u, v, d), node: <Chip key={key} id={id} u={u} v={v} w={w} d={d} title={title} lines={lines} st={chips[key]} big={big} />});
  chip('ctrl', 150, 92, 262, 262, 'CTRL', ['NVMe 8-CH', 'PX5-2280 A1']);
  chip('dram', 470, 112, 168, 220, 'DRAM', ['1GB LP4', 'K4-8G16']);
  chip('n1', NAND_U[0], NAND_V, NAND_W, NAND_D, '3D NAND', ['TLC 512GB', '176L  B47R', 'CE0 2241'], true);
  chip('n2', NAND_U[1], NAND_V, NAND_W, NAND_D, '3D NAND', ['TLC 512GB', '176L  B47R', 'CE1 2241'], true);
  parts.sort((a, b) => b.depth - a.depth);

  const fingers: React.ReactNode[] = [];
  for (let v = 8; v < 432; v += 11.2) {
    if (v > 320 && v < 362) continue;
    fingers.push(<rect key={v} x={10} y={v} width={54} height={7.4} rx={1.5} fill={`url(#${id}-gold)`} />);
  }
  const traces: React.ReactNode[] = [];
  const bundle = (key: string, u1: number, va: number, um: number, vb: number, u2: number, cnt: number, s = 7) => {
    for (let k = 0; k < cnt; k++) {
      const dv = Math.abs(vb - va);
      traces.push(<polyline key={`${key}${k}`} points={`${u1},${va + k * s} ${um},${va + k * s} ${um + dv},${vb + k * s} ${u2},${vb + k * s}`} fill="none"
                            stroke="rgba(140,200,255,0.36)" strokeWidth={2.2} strokeLinejoin="round" />);
      traces.push(<circle key={`${key}v${k}`} cx={u2} cy={vb + k * s} r={3} fill="#D9B45A" opacity={0.75} />);
    }
  };
  bundle('t1', 414, 120, 430, 132, 468, 10);
  bundle('t2', 414, 250, 424, 282, 698, 8, 6.5);
  bundle('t3', 640, 150, 650, 96, 698, 9, 6);
  bundle('t4', 1082, 100, 1090, 100, 1118, 12, 8);
  bundle('t5', 1082, 250, 1090, 250, 1118, 12, 8);
  bundle('t6', 66, 20, 96, 44, 148, 9, 8);
  bundle('t7', 66, 150, 90, 150, 148, 14, 8);
  bundle('t8', 66, 372, 90, 372, 148, 7, 8);
  bundle('t9', 1502, 110, 1508, 130, 1560, 6, 9);
  bundle('t10', 414, 60, 440, 22, 1500, 3, 6);
  bundle('t11', 414, 372, 440, 412, 1500, 4, 6);
  for (let i = 0; i < 70; i++) traces.push(<circle key={`via${i}`} cx={20 + rnd(i * 1.3) * 1560} cy={8 + rnd(i * 2.9 + 4) * 424} r={2.2} fill="#D9B45A" opacity={0.45} />);

  const pc = P(800, 220, 0);
  const bz = BT - 14;
  const gridC = light ? '#5B7BA6' : '#8FB8FF';
  return (
    <g>
      <Defs id={id} light={light} />
      {/* floor: light pool + grid + shadow */}
      <ellipse cx={pc[0]} cy={pc[1] + 60} rx={1500} ry={1250} fill={`url(#${id}-pool)`} />
      <g transform={plane(0)}>
        {Array.from({length: 23}).map((_, i) => {
          const u = -1400 + i * 200, o = (1 - Math.abs(u - 800) / 2300) * 0.12;
          return <line key={`gu${i}`} x1={u} y1={-1700} x2={u} y2={2100} stroke={gridC} strokeWidth={2} opacity={Math.max(0, o)} />;
        })}
        {Array.from({length: 19}).map((_, i) => {
          const v = -1600 + i * 200, o = (1 - Math.abs(v - 220) / 1900) * 0.12;
          return <line key={`gv${i}`} x1={-1500} y1={v} x2={3100} y2={v} stroke={gridC} strokeWidth={2} opacity={Math.max(0, o)} />;
        })}
      </g>
      <ellipse cx={pc[0] + 30} cy={pc[1] + 80} rx={1150} ry={900} fill={`url(#${id}-shadow)`} />
      {/* platform */}
      {hidePlatform ? null : (
        <Box u={-170} v={-200} w={1940} d={840} h={PZ} top={`url(#${id}-steel)`} left={light ? '#B4BFCD' : '#111925'} right={light ? '#98A5B6' : '#0A1019'}>
          {Array.from({length: 34}).map((_, i) => <line key={i} x1={rnd(i) * 500} y1={rnd(i * 3.3) * 840} x2={rnd(i) * 500 + 700 + rnd(i * 2) * 700} y2={rnd(i * 3.3) * 840}
                                                        stroke={light ? '#7A8798' : '#FFFFFF'} strokeWidth={1.2} opacity={0.035 + rnd(i * 7) * 0.05} />)}
          <rect x={3} y={3} width={1934} height={834} fill="none" stroke={light ? '#FFFFFF' : 'rgba(170,205,255,0.22)'} strokeWidth={3} />
          <rect x={86} y={86} width={1768} height={668} rx={34} fill={light ? '#D5DDE8' : '#0A1019'} stroke={light ? 'rgba(60,80,110,0.3)' : 'rgba(150,190,255,0.14)'} strokeWidth={2} />
          <rect x={110} y={110} width={1720} height={620} rx={24} fill="none" stroke={light ? '#3B8CFF' : CY} strokeWidth={26} opacity={0.07 + strip * 0.1} />
          <rect x={110} y={110} width={1720} height={620} rx={24} fill="none" stroke={light ? '#3B8CFF' : CY} strokeWidth={5} opacity={0.3 + strip * 0.6} />
          {[[44, 44], [1896, 44], [44, 796], [1896, 796]].map(([x, y], i) => (
            <g key={i}><circle cx={x} cy={y} r={22} fill={`url(#${id}-metal)`} /><circle cx={x} cy={y} r={22} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
              <polygon points={[0, 1, 2, 3, 4, 5].map((k) => `${x + Math.cos(k * 1.047) * 11},${y + Math.sin(k * 1.047) * 11}`).join(' ')} fill="rgba(10,14,20,0.75)" /></g>
          ))}
          <g transform={along(150, 760)} opacity={light ? 0.55 : 0.4}>
            <text x={0} y={0} fontFamily={MONO} fontSize={22} fill={light ? '#3A4A60' : '#BFD7FF'} letterSpacing={4}>M2_1  ·  PCIe 4.0 x4  ·  2280</text>
          </g>
        </Box>
      )}
      {/* board shadow on the platform */}
      <g transform={plane(PZ)}><path d={BOARD} transform="translate(-16,16)" fill="#000" opacity={light ? 0.3 : 0.55} /></g>
      {/* standoff under the screw end */}
      <g transform={plane(PZ)}><circle cx={1604} cy={220} r={30} fill="#3A2E12" /></g>
      {/* board body */}
      <polygon points={pts([P(0, 0, bz), P(0, 440, bz), P(0, 440, BT), P(0, 0, BT)])} fill="#0A1626" />
      <polygon points={pts([P(0, 440, bz), P(1600, 440, bz), P(1600, 440, BT), P(0, 440, BT)])} fill="#060E19" />
      <polygon points={pts([P(0, 440, BT - 3), P(1600, 440, BT - 3), P(1600, 440, BT), P(0, 440, BT)])} fill="#2A5B96" opacity={0.7} />
      <polygon points={pts([P(0, 440, bz + 5), P(1600, 440, bz + 5), P(1600, 440, bz + 7), P(0, 440, bz + 7)])} fill="#C9A24A" opacity={0.5} />
      <g transform={plane(BT)}>
        <path d={BOARD} fill={`url(#${id}-pcb)`} />
        <g clipPath={`url(#${id}-bclip)`}>
          {traces}
          {/* silkscreen */}
          {[[150, 92, 262, 262], [470, 112, 168, 220], [NAND_U[0], NAND_V, NAND_W, NAND_D], [NAND_U[1], NAND_V, NAND_W, NAND_D]].map(([u, v, w, d], i) => (
            <rect key={i} x={u - 9} y={v - 9} width={w + 18} height={d + 18} rx={4} fill="none" stroke="rgba(235,242,250,0.42)" strokeWidth={1.6} strokeDasharray={`${w * 0.22} ${w * 0.1}`} />
          ))}
          <g transform={along(1596, 268)}><text x={0} y={22} fontFamily={FONT} fontWeight={700} fontSize={20} fill="rgba(235,242,250,0.75)" letterSpacing={2}>M.2 2280</text>
            <text x={0} y={44} fontFamily={MONO} fontSize={13} fill="rgba(235,242,250,0.55)" letterSpacing={1.5}>NVMe 1TB</text></g>
          <g transform={along(142, 12)}><text x={0} y={0} fontFamily={MONO} fontSize={12} fill="rgba(235,242,250,0.55)" letterSpacing={1}>U1</text></g>
          <g transform={along(692, 6)}><text x={0} y={-4} fontFamily={MONO} fontSize={11} fill="rgba(235,242,250,0.5)">C41 C42 R17</text></g>
          <g transform={along(1508, 8)}><text x={0} y={0} fontFamily={MONO} fontSize={12} fill="rgba(235,242,250,0.55)">L1</text></g>
          {/* data-matrix */}
          {Array.from({length: 49}).map((_, i) => rnd(i * 3.7 + 9) > 0.45 ? <rect key={`dm${i}`} x={1522 + (i % 7) * 6} y={196 + Math.floor(i / 7) * 6} width={6} height={6} fill="rgba(235,242,250,0.8)" /> : null)}
          {/* gold fingers + screw ring */}
          <rect x={0} y={0} width={70} height={440} fill="#0A1626" opacity={0.55} />
          {fingers}
          <path d="M1600,180 A40 40 0 0 0 1600 260" fill="none" stroke={`url(#${id}-gold)`} strokeWidth={15} />
          {/* test pads */}
          {Array.from({length: 10}).map((_, i) => <circle key={`tp${i}`} cx={1458 + (i % 5) * 9} cy={410 + Math.floor(i / 5) * 12} r={3.4} fill="#E7C66E" />)}
          {sheen >= 0 && sheen <= 1 ? <rect x={-300 + sheen * 2000} y={-200} width={240} height={900} fill={`url(#${id}-sheen)`} transform="skewX(-28)" opacity={0.55} /> : null}
          <ellipse cx={900} cy={200} rx={760} ry={300} fill={`url(#${id}-spec)`} />
          {boardGlow > 0.01 ? <path d={BOARD} fill={CY} opacity={boardGlow * 0.2} /> : null}
        </g>
        <path d={BOARD} fill="none" stroke="rgba(160,205,255,0.45)" strokeWidth={1.6} />
        {/* status LED */}
        <circle cx={1474} cy={180} r={34} fill={`url(#${id}-gc)`} opacity={led} />
        <rect x={1466} y={174} width={16} height={12} rx={2} fill="#D9F2FF" />
      </g>
      {parts.map((p) => p.node)}
      {/* scan line (a wall of light travelling along the board) */}
      {scan >= 0 && scan <= 1 ? (
        <g>
          <polygon points={pts([P(scan * 1600, -30, BT), P(scan * 1600, 470, BT), P(scan * 1600, 470, BT + 170), P(scan * 1600, -30, BT + 170)])} fill={CY} opacity={0.13} />
          <polygon points={pts([P(scan * 1600, -30, BT), P(scan * 1600, 470, BT), P(scan * 1600 - 120, 470, BT), P(scan * 1600 - 120, -30, BT)])} fill={CY} opacity={0.1} />
          <line x1={P(scan * 1600, -30, BT)[0]} y1={P(scan * 1600, -30, BT)[1]} x2={P(scan * 1600, 470, BT)[0]} y2={P(scan * 1600, 470, BT)[1]} stroke="#E8F7FF" strokeWidth={5} />
          <line x1={P(scan * 1600, -30, BT)[0]} y1={P(scan * 1600, -30, BT)[1]} x2={P(scan * 1600, 470, BT)[0]} y2={P(scan * 1600, 470, BT)[1]} stroke={CY} strokeWidth={16} opacity={0.35} />
        </g>
      ) : null}
      {/* M.2 socket (in front of the gold fingers) + screw */}
      {hidePlatform ? null : (
        <Box u={-74} v={-14} w={84} d={468} h={46} z={PZ} top="#1B1F26" left="#12151A" right="#0A0C10" stroke="rgba(255,255,255,0.08)">
          <rect x={8} y={10} width={30} height={448} rx={3} fill="#0A0C10" />
          {Array.from({length: 38}).map((_, i) => <rect key={i} x={44} y={14 + i * 11.6} width={30} height={5} fill={`url(#${id}-gold)`} opacity={0.85} />)}
          <rect x={0} y={0} width={84} height={468} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
        </Box>
      )}
      <g transform={plane(BT + 9)}>
        <circle cx={1606} cy={222} r={34} fill="#1A1408" opacity={0.6} />
      </g>
      <g transform={plane(BT + 14)}>
        <circle cx={1604} cy={220} r={32} fill={`url(#${id}-metal)`} stroke="rgba(0,0,0,0.45)" strokeWidth={1.5} />
        <rect x={1583} y={216} width={42} height={8} rx={2} fill="rgba(15,20,28,0.8)" /><rect x={1600} y={199} width={8} height={42} rx={2} fill="rgba(15,20,28,0.8)" />
      </g>
    </g>
  );
};

// ---- flat cell grid (inside a NAND, drawn in the chip's plane group) --------------------------------------------------------
type CellLook = {fill: string; o?: number; glow?: string; gr?: number} | null;
const Cells: React.FC<{id: string; chip: number; look: (r: number, c: number) => CellLook}> = ({id, chip, look}) => {
  const out: React.ReactNode[] = [], glows: React.ReactNode[] = [];
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
    const L = look(r, c);
    if (!L) continue;
    const [u, v] = cellUV(chip, r, c);
    out.push(<rect key={`${r}-${c}`} x={u - CS / 2} y={v - CS / 2} width={CS} height={CS} rx={3} fill={L.fill} opacity={L.o ?? 1} />);
    if (L.glow) glows.push(<circle key={`g${r}-${c}`} cx={u} cy={v} r={L.gr ?? 26} fill={`url(#${id}-${L.glow})`} />);
  }
  return <g>{out}{glows}</g>;
};

const Glow: React.FC<{id: string; x: number; y: number; r: number; kind?: 'gc' | 'ga' | 'gr'; o?: number}> = ({id, x, y, r, kind = 'gc', o = 1}) =>
  o > 0.01 ? <circle cx={x} cy={y} r={r} fill={`url(#${id}-${kind})`} opacity={o} /> : null;

// ---- file cards (billboards) --------------------------------------------------------------------------------------------------
const FileCard: React.FC<{id: string; kind: number; x: number; y: number; s?: number; rot?: number; o?: number; name?: string}> = ({id, kind, x, y, s = 1, rot = 0, o = 1, name}) => {
  const w = 150, h = 190;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={o}>
      <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={16} fill="#000" opacity={0.35} />
      <path d={`M${-w / 2 + 14},${-h / 2} H${w / 2 - 34} L${w / 2},${-h / 2 + 34} V${h / 2 - 14} a14 14 0 0 1 -14 14 H${-w / 2 + 14} a14 14 0 0 1 -14 -14 V${-h / 2 + 14} a14 14 0 0 1 14 -14 Z`}
            fill={`url(#${id}-paper)`} stroke="rgba(255,255,255,0.9)" strokeWidth={2} />
      <path d={`M${w / 2 - 34},${-h / 2} L${w / 2},${-h / 2 + 34} H${w / 2 - 28} a6 6 0 0 1 -6 -6 Z`} fill="#B9C6D8" />
      {kind === 0 ? (
        <g>
          <rect x={-w / 2 + 14} y={-h / 2 + 44} width={w - 28} height={96} rx={8} fill={`url(#${id}-sky)`} />
          <circle cx={30} cy={-28} r={13} fill="#FFF3B0" />
          <polygon points={`${-w / 2 + 14},${44} ${-22},${-18} ${8},${20} ${30},${-2} ${w / 2 - 14},${44}`} fill="#1E6B52" />
          <polygon points={`${-w / 2 + 14},${44} ${-22},${-18} ${-4},${6} ${-30},${44}`} fill="#2C8F6C" />
          <rect x={-w / 2 + 14} y={56} width={70} height={9} rx={4} fill="#9FB0C6" /><rect x={-w / 2 + 14} y={72} width={44} height={7} rx={3.5} fill="#C3CEDD" />
        </g>
      ) : kind === 1 ? (
        <g>
          <rect x={-w / 2 + 14} y={-h / 2 + 46} width={72} height={34} rx={7} fill="#E5484D" />
          <text x={-w / 2 + 50} y={-h / 2 + 71} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={22} fill="#fff">PDF</text>
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-w / 2 + 14} y={-4 + i * 17} width={i === 4 ? 60 : w - 28 - (i % 2) * 18} height={8} rx={4} fill={i === 0 ? '#7F8EA3' : '#B7C3D3'} />)}
        </g>
      ) : (
        <g>
          <rect x={-w / 2 + 14} y={-h / 2 + 44} width={w - 28} height={96} rx={8} fill={`url(#${id}-song)`} />
          <ellipse cx={-14} cy={18} rx={13} ry={10} fill="#fff" /><ellipse cx={26} cy={8} rx={13} ry={10} fill="#fff" />
          <path d="M-3,18 V-34 L37,-44 V8" fill="none" stroke="#fff" strokeWidth={6} strokeLinejoin="round" /><path d="M-3,-34 L37,-44 V-32 L-3,-22 Z" fill="#fff" />
          {Array.from({length: 11}).map((_, i) => <rect key={i} x={-w / 2 + 16 + i * 11} y={66 - (6 + rnd(i * 3.3) * 16) / 2} width={6} height={6 + rnd(i * 3.3) * 16} rx={3} fill="#8E6BE8" />)}
        </g>
      )}
      {name ? <text x={0} y={h / 2 + 30} textAnchor="middle" fontFamily={MONO} fontSize={20} fill="#DDEBFF">{name}</text> : null}
    </g>
  );
};

/** glass tag with a leader (billboard) */
const Tag: React.FC<{x: number; y: number; tx: number; ty: number; title: string; sub?: string; p: number; color?: string; w?: number}> = ({x, y, tx, ty, title, sub, p, color = CY, w = 300}) => {
  if (p <= 0.01) return null;
  const h = sub ? 86 : 58;
  return (
    <g opacity={Math.min(1, p * 1.6)}>
      <line x1={tx} y1={ty} x2={lerp(tx, x, p)} y2={lerp(ty, y, p)} stroke={color} strokeWidth={2.5} opacity={0.8} />
      <circle cx={tx} cy={ty} r={7} fill={color} /><circle cx={tx} cy={ty} r={15} fill="none" stroke={color} strokeWidth={2} opacity={0.5} />
      <g transform={`translate(${x},${y}) scale(${0.7 + 0.3 * p})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill="rgba(8,16,30,0.82)" stroke={color} strokeWidth={2.2} />
        <rect x={-w / 2} y={-h / 2} width={8} height={h} rx={4} fill={color} />
        <text x={-w / 2 + 28} y={sub ? -6 : 10} fontFamily={FONT} fontWeight={700} fontSize={30} fill="#FFFFFF">{title}</text>
        {sub ? <text x={-w / 2 + 28} y={26} fontFamily={MONO} fontSize={19} fill={color}>{sub}</text> : null}
      </g>
    </g>
  );
};

// =====================================================================================================================
// S01 - hook
// =====================================================================================================================
const F1: [number, number, number] = [1, 7, 6]; // focus cell (chip, r, c)
const [F1U, F1V] = cellUV(F1[0], F1[1], F1[2]);
const HDD: [number, number, number] = [880, 220, 430];

const S01Draw: React.FC<WorldDrawProps> = ({t, beats, cam}) => {
  const id = 's01';
  const tSsd = wordAt(beats, 'ssd', 6), tNo = wordAt(beats, 'no', 30), tMov = wordAt(beats, 'moving', 36), tParts = wordAt(beats, 'parts', 44);
  const tWhere = wordAt(beats, 'where', 71), tFiles = wordAt(beats, 'files', 84), tAct = wordAt(beats, 'actually', 94), tLive = wordAt(beats, 'live', 108);
  const tIn = wordAt(beats, 'inside', 134), tBil = wordAt(beats, 'billions', 148), tTiny = wordAt(beats, 'tiny', 164), tTraps = wordAt(beats, 'traps', 174), tEl = wordAt(beats, 'electrons', 190);
  const xr = sp(t, tIn, 'settle');
  const ext = sp(t, tTiny, 'settle');
  const trap = sp(t, tTraps, 'bouncy');
  const pulse = pulseOn(t, beats);
  // inner zoom about the focus cell (keeps the engine zoom low so its motion blur stays small)
  const K = Math.exp(Math.log(4.2) * ramp(t, tIn - 2, Math.max(30, tEl - tIn + 10)));   // one continuous log-speed dive
  const FP = P(F1U, F1V, CZ);
  const es = cam.s * K, ecx = FP[0] + (cam.x - FP[0]) / K, ecy = FP[1] + (cam.y - FP[1]) / K;
  const deep = es > 2.6;

  // --- NAND inner (x-ray) ---
  const inner = (chip: number) => (
    <Cells id={id} chip={chip} look={(r, c) => {
      const d = Math.hypot(r - F1[1], c - F1[2]) + (chip === F1[0] ? 0 : 14);
      const wave = clamp01((t - tBil) * 1.1 - d * 0.55);
      const seed = rnd(chip * 91 + r * 17 + c * 3.1);
      const on = seed > 0.38;
      if (chip === F1[0] && ext > 0.05) return {fill: '#0B1B30', o: 1};
      if (wave > 0 && on) return {fill: wave > 0.6 ? CY : BL, o: 0.55 + 0.45 * wave, glow: wave < 0.9 || seed > 0.86 ? 'gc' : undefined, gr: 20};
      return {fill: '#17375E', o: 0.9};
    }} />
  );

  // --- detailed 3D traps (only around the camera when it is deep) ---
  const traps: React.ReactNode[] = [];
  if (ext > 0.02 && deep) {
    const hx = 640 / es, hy = 1150 / es;
    const list: {r: number; c: number; dep: number}[] = [];
    for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
      const [u, v] = cellUV(F1[0], r, c);
      const [x, y] = P(u, v, CZ);
      if (Math.abs(x - ecx) > hx || Math.abs(y - ecy) > hy) continue;
      list.push({r, c, dep: u - 0.5 * v});
    }
    list.sort((a, b) => b.dep - a.dep);
    for (const {r, c} of list) {
      const [cu, cv] = cellUV(F1[0], r, c);
      const u = cu - CS / 2, v = cv - CS / 2, z = CZ, dist = Math.hypot(r - F1[1], c - F1[2]);
      const h = 12 * ext;
      const seed = rnd(r * 17 + c * 3.1 + 5);
      const elp = sp(t, tEl + dist * 0.9, 'bouncy');
      const nEl = 2 + Math.floor(seed * 4);
      const k = `${r}-${c}`;
      traps.push(
        <g key={k}>
          {/* floor + back walls */}
          <g transform={plane(z)}>
            <rect x={u} y={v} width={CS} height={CS} rx={1.5} fill="#06101D" stroke="rgba(110,190,255,0.5)" strokeWidth={0.35} />
            <rect x={u + 2.5} y={v + 2.5} width={CS - 5} height={CS - 5} rx={1} fill="#0D2F55" opacity={0.9} />
            {elp > 0.01 ? <circle cx={cu} cy={cv} r={11} fill={`url(#${id}-ga)`} opacity={elp * 0.8} /> : null}
          </g>
          <polygon points={pts([P(u + CS, v, z), P(u + CS, v + CS, z), P(u + CS, v + CS, z + h), P(u + CS, v, z + h)])} fill="rgba(70,150,255,0.22)" stroke="rgba(140,210,255,0.5)" strokeWidth={0.25} />
          <polygon points={pts([P(u, v, z), P(u + CS, v, z), P(u + CS, v, z + h), P(u, v, z + h)])} fill="rgba(70,150,255,0.14)" stroke="rgba(140,210,255,0.5)" strokeWidth={0.25} />
          {/* electrons */}
          {elp > 0.01 ? Array.from({length: nEl}).map((_, i) => {
            const a = rnd(seed * 9 + i) * 6.28 + t * (0.12 + rnd(i + seed) * 0.1), rr = 2.2 + rnd(i * 3 + seed) * 3.2;
            const [ex, ey] = P(cu + Math.cos(a) * rr, cv + Math.sin(a) * rr, z + (2 + rnd(i * 5 + seed * 3) * 7 + Math.sin(t * 0.3 + i * 2) * 1.2) * ext);
            return <circle key={i} cx={ex} cy={ey} r={3.6 * elp} fill={`url(#${id}-el)`} />;
          }) : null}
          {/* front glass walls */}
          <polygon points={pts([P(u, v, z), P(u, v + CS, z), P(u, v + CS, z + h), P(u, v, z + h)])} fill={`rgba(80,170,255,${0.12 + 0.1 * trap})`} stroke="rgba(170,225,255,0.75)" strokeWidth={0.3} />
          <polygon points={pts([P(u, v + CS, z), P(u + CS, v + CS, z), P(u + CS, v + CS, z + h), P(u, v + CS, z + h)])} fill={`rgba(50,120,230,${0.16 + 0.1 * trap})`} stroke="rgba(170,225,255,0.75)" strokeWidth={0.3} />
          <polygon points={pts([P(u, v, z + h * 0.82), P(u, v + CS, z + h * 0.82), P(u, v + CS, z + h), P(u, v, z + h)])} fill="rgba(220,245,255,0.28)" />
          {/* rim + trap gate */}
          <g transform={plane(z + h)}>
            <rect x={u} y={v} width={CS} height={CS} rx={1.5} fill={trap > 0.01 ? `rgba(120,205,255,${0.13 * trap})` : 'none'} stroke={trap > 0.3 ? '#C9EEFF' : 'rgba(150,215,255,0.8)'} strokeWidth={0.4 + 0.5 * trap} />
            {trap > 0.01 ? (
              <g opacity={Math.min(1, trap * 1.5)}>
                {[0.33, 0.66].map((f) => <line key={f} x1={u + CS * f} y1={v + CS * (1 - trap) * 0.5} x2={u + CS * f} y2={v + CS - CS * (1 - trap) * 0.5} stroke="#BFE9FF" strokeWidth={0.55} />)}
                {[0.33, 0.66].map((f) => <line key={`h${f}`} x1={u + CS * (1 - trap) * 0.5} y1={v + CS * f} x2={u + CS - CS * (1 - trap) * 0.5} y2={v + CS * f} stroke="#BFE9FF" strokeWidth={0.55} />)}
              </g>
            ) : null}
          </g>
          {/* sparks when the electrons arrive */}
          {elp > 0.01 && t - (tEl + dist * 0.9) < 9 ? Array.from({length: 6}).map((_, i) => {
            const q = clamp01((t - (tEl + dist * 0.9)) / 9), a = i * 1.047 + seed * 6;
            const [sx, sy] = P(cu, cv, z + h + 2);
            return <line key={`s${i}`} x1={sx + Math.cos(a) * (4 + 12 * q)} y1={sy + Math.sin(a) * (4 + 12 * q)} x2={sx + Math.cos(a) * (7 + 16 * q)} y2={sy + Math.sin(a) * (7 + 16 * q)}
                         stroke="#FFE98A" strokeWidth={0.7 * (1 - q)} strokeLinecap="round" />;
          }) : null}
        </g>,
      );
    }
  }

  // --- HDD hologram ---
  const hddIn = sp(t, tNo, 'settle'), strike = sp(t, tParts, 'pop'), strike2 = sp(t, tParts + 2.5, 'pop');
  const hddOut = smooth((t - tParts - 9) / 9);
  const spin = t * 9 + Math.max(0, t - tMov) * 22;
  const hc = P(HDD[0], HDD[1], HDD[2]);
  const holo = strike > 0.3 ? RED : CY;
  const flick = 0.85 + 0.15 * Math.sin(t * 2.7);

  // --- files rain ---
  const cards: React.ReactNode[] = [];
  const splashes: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const t0 = tFiles + i * 2.6 - 1, fall = 13;
    const q = (t - t0) / fall;
    const chip = i % 2, lu = NAND_U[chip] + 70 + rnd(i * 3.1) * 240, lv = NAND_V + 60 + rnd(i * 5.7) * 220;
    const [lx, ly] = P(lu, lv, BT + CH);
    if (q > 0 && q < 1.25) {
      const g = Math.min(1, q) * Math.min(1, q);
      const y = ly - 1150 * (1 - g) - 60, sink = clamp01((q - 1) / 0.25);
      const x = lx + (rnd(i * 9) - 0.5) * 160 * (1 - g);
      cards.push(
        <g key={i}>
          <rect x={x - 46 * (1 - sink)} y={y - 420 * (1 - g * 0.4)} width={92 * (1 - sink)} height={420 * (1 - g * 0.4)} fill={`url(#${id}-beam)`} transform={`rotate(180 ${x} ${y - 210 * (1 - g * 0.4)})`} opacity={0.9} />
          <Glow id={id} x={x} y={y} r={150} o={0.5 * (1 - sink)} />
          <FileCard id={id} kind={i % 3} x={x} y={y + sink * 50} s={(1.05 - 0.35 * g) * (1 - sink * 0.85)} rot={(rnd(i * 2.3) - 0.5) * 30 * (1 - g)} o={1 - sink * 0.6} />
        </g>,
      );
    }
    const sq = (t - t0 - fall) / 14;
    if (sq > 0 && sq < 1) {
      splashes.push(
        <g key={`s${i}`} transform={plane(BT + CH + 1)}>
          <circle cx={lu} cy={lv} r={30 + 150 * sq} fill="none" stroke={CY} strokeWidth={7 * (1 - sq)} opacity={1 - sq} />
          <circle cx={lu} cy={lv} r={70 * (1 - sq) + 20} fill={`url(#${id}-gc)`} opacity={(1 - sq) * 0.9} />
        </g>,
      );
    }
  }
  const absorbed = clamp01((t - tFiles - 12) / 24);
  const nandGlow = Math.max(absorbed * (0.35 + 0.25 * Math.sin(t * 0.5)), sp(t, tLive, 'pop') * 0.9) * (1 - xr);

  const tagP = sp(t, tSsd, 'settle') * (1 - smooth((t - tNo + 4) / 6));
  const tagAt = P(300, 440, BT), liveP = sp(t, tLive, 'settle') * (1 - smooth((t - tIn + 2) / 6));
  const n2 = P(NAND_U[1] + 190, NAND_V + NAND_D, BT + CH);
  const bx = P(1300, 220, 0)[0];

  return (
    <svg width={2800} height={3000} style={{overflow: 'visible'}}>
      <g transform={`translate(${FP[0]},${FP[1]}) scale(${K}) translate(${-FP[0]},${-FP[1]})`}>
      <Drive id={id} t={t} sheen={(t - tSsd) / 16} scan={(t - tWhere) / 13} led={0.45 + 0.55 * pulse} strip={0.35 + 0.65 * sp(t, tSsd, 'settle')}
             boardGlow={pulse * 0.5}
             chips={{n1: {xray: xr * 0.85, inner: xr > 0.01 ? inner(0) : null, glow: nandGlow}, n2: {xray: xr, inner: xr > 0.01 ? inner(1) : null, glow: nandGlow},
                     ctrl: {glow: pulseOn(t, beats, (b) => b.word === 'ssd') * 0.5}}} />
      {/* x-ray scan flash over the NAND */}
      {xr > 0.01 && t - tIn < 14 ? <g transform={plane(BT + CH + 2)}><rect x={NAND_U[1] + ((t - tIn) / 14) * NAND_W - 14} y={NAND_V} width={28} height={NAND_D} fill="#DDF4FF" opacity={0.7 * (1 - (t - tIn) / 14)} /></g> : null}
      {traps}
      {splashes}
      {/* light beam from above */}
      <polygon points={pts([[bx - 120, -200], [bx + 160, -200], P(1500, 620, PZ), P(700, -180, PZ)])} fill={`url(#${id}-beam)`} opacity={0.5} />
      {/* HDD hologram */}
      {hddIn > 0.01 && hddOut < 0.99 ? (
        <g opacity={(1 - hddOut) * Math.min(1, hddIn * 1.4) * flick}>
          <g transform={plane(HDD[2])}>
            <g transform={`translate(${HDD[0]},${HDD[1]}) scale(${0.6 + 0.4 * hddIn})`}>
              <rect x={-330} y={-260} width={700} height={520} rx={36} fill="rgba(40,120,220,0.10)" stroke={holo} strokeWidth={5} />
              <rect x={-316} y={-246} width={672} height={492} rx={28} fill="none" stroke={holo} strokeWidth={1.5} opacity={0.6} />
              {[[-300, -230], [340, -230], [-300, 230], [340, 230]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill="none" stroke={holo} strokeWidth={3} />)}
              <circle cx={-70} cy={0} r={236} fill="rgba(92,200,255,0.10)" stroke={holo} strokeWidth={5} />
              {[205, 170, 135, 100].map((r) => <circle key={r} cx={-70} cy={0} r={r} fill="none" stroke={holo} strokeWidth={1.4} opacity={0.5} />)}
              <g transform={`rotate(${spin} -70 0)`}>
                <path d="M-70,0 L166,0 A236 236 0 0 1 97,167 Z" fill={holo} opacity={0.3} />
                <path d="M-70,0 L-306,0 A236 236 0 0 1 -237,-167 Z" fill={holo} opacity={0.18} />
                <line x1={-70} y1={0} x2={166} y2={0} stroke="#E8F7FF" strokeWidth={4} />
                {[0, 1, 2, 3, 4, 5].map((k) => <circle key={k} cx={-70 + Math.cos(k * 1.047) * 38} cy={Math.sin(k * 1.047) * 38} r={7} fill={holo} />)}
              </g>
              <circle cx={-70} cy={0} r={62} fill="rgba(8,16,30,0.6)" stroke={holo} strokeWidth={4} />
              <circle cx={-70} cy={0} r={20} fill={holo} />
              {/* actuator arm */}
              <g transform={`rotate(${-18 + Math.sin(t * 0.55) * 13} 270 170)`}>
                <path d="M270,140 L-10,60 L-10,86 L270,200 Z" fill="rgba(92,200,255,0.22)" stroke={holo} strokeWidth={4} strokeLinejoin="round" />
                <rect x={-34} y={56} width={30} height={34} rx={5} fill={holo} />
              </g>
              <circle cx={270} cy={170} r={44} fill="rgba(8,16,30,0.6)" stroke={holo} strokeWidth={4} /><circle cx={270} cy={170} r={14} fill={holo} />
              {/* motion arcs on "moving" */}
              {t > tMov ? [0, 1, 2].map((k) => (
                <path key={k} d="M-70,-262 A262 262 0 0 1 157,-131" fill="none" stroke="#E8F7FF" strokeWidth={6} strokeLinecap="round" opacity={0.75 * sp(t, tMov, 'pop')}
                      transform={`rotate(${spin * 0.6 + k * 120} -70 0)`} />
              )) : null}
            </g>
          </g>
          {/* scanlines */}
          {Array.from({length: 13}).map((_, i) => <line key={i} x1={hc[0] - 420} x2={hc[0] + 420} y1={hc[1] - 300 + ((i * 50 + t * 6) % 650)} y2={hc[1] - 300 + ((i * 50 + t * 6) % 650)} stroke={holo} strokeWidth={2} opacity={0.12} />)}
          <Tag x={hc[0] - 250} y={hc[1] - 330} tx={hc[0] - 150} ty={hc[1] - 150} title="Hard disk" sub="spinning platter" p={hddIn * (1 - strike)} w={330} />
          {/* strike-out */}
          {strike > 0.01 ? (
            <g>
              <Glow id={id} x={hc[0]} y={hc[1]} r={560} kind="gr" o={0.55 * strike} />
              <line x1={hc[0] - 380} y1={hc[1] - 300} x2={hc[0] - 380 + 760 * strike} y2={hc[1] - 300 + 600 * strike} stroke="#FFFFFF" strokeWidth={34} strokeLinecap="round" />
              <line x1={hc[0] - 380} y1={hc[1] - 300} x2={hc[0] - 380 + 760 * strike} y2={hc[1] - 300 + 600 * strike} stroke={RED} strokeWidth={22} strokeLinecap="round" />
              {strike2 > 0.01 ? <line x1={hc[0] + 380} y1={hc[1] - 300} x2={hc[0] + 380 - 760 * strike2} y2={hc[1] - 300 + 600 * strike2} stroke="#FFFFFF" strokeWidth={34} strokeLinecap="round" /> : null}
              {strike2 > 0.01 ? <line x1={hc[0] + 380} y1={hc[1] - 300} x2={hc[0] + 380 - 760 * strike2} y2={hc[1] - 300 + 600 * strike2} stroke={RED} strokeWidth={22} strokeLinecap="round" /> : null}
            </g>
          ) : null}
        </g>
      ) : null}
      {cards}
      <Tag x={tagAt[0] - 60} y={tagAt[1] + 250} tx={tagAt[0]} ty={tagAt[1]} title="M.2 NVMe SSD" sub="1 TB · no moving parts" p={tagP} w={400} />
      <Tag x={n2[0] - 110} y={n2[1] + 180} tx={n2[0]} ty={n2[1]} title="NAND flash" sub="your files live here" p={liveP} w={370} color={AM} />
      {/* focus glow under the deep dive */}
      <Glow id={id} x={P(F1U, F1V, CZ)[0]} y={P(F1U, F1V, CZ)[1]} r={90} kind="ga" o={0.35 * sp(t, tEl, 'pop')} />
      {t > tAct && t < tAct + 12 ? <g transform={plane(BT + CH + 1)}>{[0, 1].map((k) => <rect key={k} x={NAND_U[k] - 14 * (t - tAct) / 2} y={NAND_V - 14 * (t - tAct) / 2} width={NAND_W + 14 * (t - tAct)} height={NAND_D + 14 * (t - tAct)} rx={10} fill="none" stroke={AM} strokeWidth={6} opacity={1 - (t - tAct) / 12} />)}</g> : null}
      </g>
    </svg>
  );
};

const s01: WorldDef = {
  id: 'ssd-hook', home: 'ssd',
  anchors: {
    ssd: anchor(800, 220, 60, 0.84),
    hdd: anchor(HDD[0], HDD[1], HDD[2] - 60, 1.02),
    files: anchor(1090, 220, 330, 0.98),
    nand: anchor(1120, 240, BT, 1.55),
    inside: anchor(F1U, F1V, CZ, 1.7),
    billions: anchor(F1U - 6, F1V + 4, CZ, 1.9),
    tiny: anchor(F1U, F1V, CZ + 2, 2.0),
    traps: anchor(F1U + 3, F1V - 2, CZ + 3, 2.1),
    electrons: anchor(F1U, F1V, CZ + 3, 2.2),
  },
  aliases: {no: 'hdd', moving: 'hdd', parts: 'hdd', where: 'ssd', actually: 'files', live: 'nand'},
  palette: {bg0: '#04070D', bg1: '#182A44', particles: '#A9CCFF', glow: '#4C9BFF'},
  Draw: S01Draw,
};

// =====================================================================================================================
// S02 - open one up, follow a single photo
// =====================================================================================================================
const F2: [number, number, number] = [1, 6, 7];
const [F2U, F2V] = cellUV(F2[0], F2[1], F2[2]);
const CARD2 = P(NAND_U[1] + 250, NAND_V - 150, 430); // where the photo card hovers

const S02Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const id = 's02';
  const tOpen = wordAt(beats, 'open', 14), tOne = wordAt(beats, 'one', 20), tFol = wordAt(beats, 'follow', 31);
  const tPhoto = wordAt(beats, 'photo', 48), tGets = wordAt(beats, 'gets', 62), tSaved = wordAt(beats, 'saved', 67);
  const open = sp(t, tOpen, 'settle'), one = sp(t, tOne, 'bouncy'), fol = sp(t, tFol, 'settle');
  const lift = open * 150;
  const pulse = pulseOn(t, beats);
  const travel = smooth((t - tGets) / (tSaved - tGets + 4));
  const sink = smooth((t - tSaved - 3) / 6);
  const saved = sp(t, tSaved + 5, 'bouncy');
  const target = P(F2U, F2V, CZ + 2);
  const ctrl: P2 = [lerp(CARD2[0], target[0], 0.25) - 60, lerp(CARD2[1], target[1], 0.75) + 40];
  const bez = (q: number): P2 => [
    (1 - q) * (1 - q) * CARD2[0] + 2 * (1 - q) * q * ctrl[0] + q * q * target[0],
    (1 - q) * (1 - q) * (CARD2[1] + 130) + 2 * (1 - q) * q * ctrl[1] + q * q * target[1],
  ];
  const cardIn = sp(t, tFol, 'bouncy');
  const cp = bez(travel);
  const cardPos: P2 = travel > 0 ? [cp[0], cp[1] - 130 * (1 - travel)] : [CARD2[0], CARD2[1] + Math.sin(t * 0.22) * 8];
  const hot = sp(t, tPhoto, 'pop');
  const inner = (
    <Cells id={id} chip={1} look={(r, c) => {
      const seed = rnd(191 + r * 17 + c * 3.1);
      const isT = r === F2[1] && c === F2[2];
      const d = Math.hypot(r - F2[1], c - F2[2]);
      const ring = saved > 0 ? clamp01(1 - Math.abs(d - (t - tSaved - 5) * 0.9) / 1.4) : 0;
      if (isT) return saved > 0.05 ? {fill: '#FFE08A', glow: 'ga', gr: 30 + 26 * saved} : {fill: one > 0.05 ? '#E8F7FF' : '#17375E', glow: one > 0.05 ? 'gc' : undefined, gr: 34};
      if (ring > 0.05) return {fill: AM, o: 0.5 + 0.5 * ring};
      const rowcol = (r === F2[1] || c === F2[2]) && one > 0.05;
      if (rowcol) return {fill: BL, o: 0.5 + 0.4 * one};
      return seed > 0.5 ? {fill: '#2A5E9C', o: 0.55 + 0.35 * open} : {fill: '#15335A', o: 0.9};
    }} />
  );
  const lidTop = P(NAND_U[1] + 190, NAND_V + 170, BT + CH + lift);
  const K = 1 + 0.45 * ramp(t, tSaved);
  return (
    <svg width={2800} height={3000} style={{overflow: 'visible'}}>
      <g transform={`translate(${target[0]},${target[1]}) scale(${K}) translate(${-target[0]},${-target[1]})`}>
      <Drive id={id} t={t} led={0.5 + 0.5 * pulse} strip={0.8} boardGlow={pulse * 0.35}
             chips={{n2: {xray: open, lift, inner: open > 0.01 ? inner : null, glow: (1 - open) * (0.35 + 0.3 * Math.sin(t * 0.6))}, n1: {glow: 0.12}}} />
      {/* light spilling out of the opened chip */}
      {open > 0.01 ? <polygon points={pts([P(NAND_U[1], NAND_V, BT + CH), P(NAND_U[1] + NAND_W, NAND_V + NAND_D, BT + CH), P(NAND_U[1] + NAND_W, NAND_V + NAND_D, BT + CH + lift), P(NAND_U[1], NAND_V, BT + CH + lift)])}
                              fill={CY} opacity={0.07 * open} /> : null}
      {open > 0.01 ? [[0, 0], [NAND_W, 0], [0, NAND_D], [NAND_W, NAND_D]].map(([a, b], i) => (
        <line key={i} x1={P(NAND_U[1] + a, NAND_V + b, BT + CH)[0]} y1={P(NAND_U[1] + a, NAND_V + b, BT + CH)[1]} x2={P(NAND_U[1] + a, NAND_V + b, BT + CH + lift)[0]} y2={P(NAND_U[1] + a, NAND_V + b, BT + CH + lift)[1]}
              stroke={CY} strokeWidth={1.5} strokeDasharray="5 6" opacity={0.6 * open} />
      )) : null}
      {t > tOpen && t < tOpen + 10 ? <Glow id={id} x={lidTop[0]} y={lidTop[1]} r={420} o={0.6 * (1 - (t - tOpen) / 10)} /> : null}
      {/* target marker on "one" */}
      {one > 0.01 && sink < 1 ? (
        <g transform={plane(CZ + 3)} opacity={Math.min(1, one * 1.5) * (1 - saved)}>
          <rect x={F2U - 16 - 14 * (1 - one)} y={F2V - 16 - 14 * (1 - one)} width={32 + 28 * (1 - one)} height={32 + 28 * (1 - one)} rx={5} fill="none" stroke="#FFFFFF" strokeWidth={2.4} />
          {[0, 1, 2, 3].map((k) => <line key={k} x1={F2U + [-34, 22, 0, 0][k]} y1={F2V + [0, 0, -34, 22][k]} x2={F2U + [-22, 34, 0, 0][k]} y2={F2V + [0, 0, -22, 34][k]} stroke="#FFFFFF" strokeWidth={2.4} />)}
        </g>
      ) : null}
      {/* highlighted path */}
      {fol > 0.01 ? Array.from({length: 34}).map((_, i) => {
        const q = i / 33;
        if (q > fol || q < travel) return null;
        const [x, y] = bez(q);
        const head = ((t * 0.045 + 10 - q) % 0.3) < 0.04;
        return <circle key={i} cx={x} cy={y} r={head ? 9 : 5} fill={head ? '#FFFFFF' : AM} opacity={head ? 1 : 0.85} />;
      }) : null}
      {fol > 0.01 && travel < 1 ? <Glow id={id} x={target[0]} y={target[1]} r={60 + 20 * Math.sin(t * 0.5)} kind="ga" o={fol * 0.9} /> : null}
      {/* the photo */}
      {cardIn > 0.01 && sink < 0.99 ? (
        <g>
          <Glow id={id} x={cardPos[0]} y={cardPos[1]} r={(250 + 90 * hot) * (1 - travel * 0.7)} kind="ga" o={(0.55 + 0.3 * hot) * (1 - sink)} />
          <FileCard id={id} kind={0} x={cardPos[0]} y={cardPos[1] + sink * 30} s={cardIn * (1.35 + 0.2 * hot) * (1 - travel * 0.78) * (1 - sink * 0.9)} rot={-7 + travel * 14}
                    name={travel < 0.05 ? 'IMG_0421.jpg' : undefined} o={1 - sink} />
          {hot > 0.01 && travel < 0.05 ? <rect x={cardPos[0] - 125 * 1.55} y={cardPos[1] - 150 * 1.55} width={250 * 1.55} height={300 * 1.55} rx={34} fill="none" stroke={AM} strokeWidth={5}
                                               strokeDasharray="26 16" strokeDashoffset={-t * 3} opacity={0.9 * hot} transform={`rotate(-7 ${cardPos[0]} ${cardPos[1]})`} /> : null}
        </g>
      ) : null}
      {/* saved burst */}
      {t > tSaved + 4 && t < tSaved + 24 ? (() => {
        const q = clamp01((t - tSaved - 4) / 18), e = 1 - Math.pow(1 - q, 3);
        return (
          <g>
            <Glow id={id} x={target[0]} y={target[1]} r={120 + 360 * e} kind="ga" o={1 - q} />
            {Array.from({length: 18}).map((_, i) => {
              const a = (i / 18) * 6.283 + rnd(i) * 0.3, d = (90 + rnd(i * 3) * 190) * e;
              return <circle key={i} cx={target[0] + Math.cos(a) * d} cy={target[1] + Math.sin(a) * d * 0.7} r={(4 + rnd(i * 7) * 6) * (1 - q)} fill="#FFE08A" />;
            })}
            <g transform={plane(CZ + 4)}><circle cx={F2U} cy={F2V} r={30 + 190 * e} fill="none" stroke={AM} strokeWidth={8 * (1 - q)} opacity={1 - q} /></g>
          </g>
        );
      })() : null}
      {saved > 0.01 ? (
        <g transform={`translate(${target[0]},${target[1] - 150 - 30 * saved}) scale(${saved})`}>
          <rect x={-128} y={-40} width={256} height={80} rx={40} fill="#12331F" stroke="#3FDC7B" strokeWidth={3.5} />
          <circle cx={-88} cy={0} r={24} fill="#3FDC7B" /><path d="M-100,0 L-91,10 L-76,-9" fill="none" stroke="#0B2415" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <text x={-52} y={13} fontFamily={FONT} fontWeight={700} fontSize={36} fill="#EFFFF4">Saved</text>
        </g>
      ) : null}
      </g>
    </svg>
  );
};

const s02: WorldDef = {
  id: 'ssd-open', home: 'deep',
  anchors: {
    deep: anchor(F2U, F2V, CZ + 40, 3.0),
    nand: anchor(NAND_U[1] + 190, NAND_V + 170, BT + 10, 1.75),
    open: anchor(NAND_U[1] + 190, NAND_V + 170, BT + 90, 1.5),
    follow: anchor(NAND_U[1] + 215, NAND_V + 40, BT + 220, 1.12),
    photo: {x: CARD2[0], y: CARD2[1] + 40, zoom: 1.55},
    saved: anchor(F2U, F2V, CZ + 40, 1.6),
  },
  aliases: {one: 'open', single: 'follow', gets: 'follow'},
  palette: {bg0: '#03060C', bg1: '#13233E', particles: '#BFD9FF', glow: '#5CC8FF'},
  Draw: S02Draw,
};

// =====================================================================================================================
// S10 - callback: the whole drive in x-ray
// =====================================================================================================================
// 12 pages of the photo, scattered over both NANDs
const PAGES: [number, number, number][] = [[0, 2, 2], [0, 5, 9], [0, 9, 4], [0, 12, 10], [0, 7, 6], [0, 13, 2], [1, 1, 8], [1, 4, 3], [1, 8, 10], [1, 11, 5], [1, 13, 11], [1, 6, 1]];
const TW_U = 4, TW_V = 3, TW_L = 7, TW_S = 66, TW_H = 24, TW_GAP = 7;
const towerUV = (chip: number, i: number, j: number): P2 => [NAND_U[chip] + 22 + i * ((NAND_W - 44 - TW_S) / (TW_U - 1)), NAND_V + 22 + j * ((NAND_D - 44 - TW_S) / (TW_V - 1))];
type Slab = [number, number, number, number]; // chip, i, j, layer
const SLABS0: Slab[] = PAGES.map((_, k) => [k < 6 ? 0 : 1, k % TW_U, (k * 2 + (k < 6 ? 0 : 1)) % TW_V, (k * 3 + 1) % TW_L]);
const HOPS: {page: number; to: Slab; dt: number}[] = [
  {page: 0, to: [1, 0, 2, 5], dt: 0}, {page: 7, to: [0, 3, 2, 2], dt: 2.5}, {page: 3, to: [0, 0, 2, 6], dt: 5}, {page: 9, to: [1, 2, 2, 1], dt: 7.5},
  {page: 5, to: [1, 3, 1, 4], dt: 13}, {page: 10, to: [0, 1, 2, 4], dt: 15.5}, {page: 2, to: [0, 2, 1, 6], dt: 18}, {page: 6, to: [1, 1, 2, 6], dt: 20.5},
];
const slabCenter = (s: Slab): P2 => {
  const [u, v] = towerUV(s[0], s[1], s[2]);
  return P(u + TW_S / 2, v + TW_S / 2, BT + 6 + s[3] * (TW_H + TW_GAP) + TW_H / 2);
};
const PHOTO10 = P(1100, 220, 520);
const BUCK = P(NAND_U[0] + 150, NAND_V + NAND_D - 60, 160);

const S10Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const id = 's10';
  const tPhoto = wordAt(beats, 'photo', 21), tIsnt = wordAt(beats, "isn't", 29), tStored = wordAt(beats, 'stored', 35), tOne = wordAt(beats, 'one', 45);
  const tCharge = wordAt(beats, 'charge', 75), tSpread = wordAt(beats, 'spread', 98), tTow = wordAt(beats, 'towers', 114);
  const tTiny = wordAt(beats, 'tiny', 128), tBuck = wordAt(beats, 'buckets', 135), tConst = wordAt(beats, 'constantly', 156), tShuf = wordAt(beats, 'shuffled', 170);
  const tAlive = wordAt(beats, 'alive', 198);
  const pulse = pulseOn(t, beats);
  const charge = sp(t, tCharge, 'pop'), chargeP = pulseOn(t, beats, (b) => b.word === 'charge', 12);
  const rise = sp(t, tTow, 'settle');
  const buck = sp(t, tBuck, 'bouncy'), tiny = sp(t, tTiny, 'settle');
  const alive = sp(t, tAlive, 'pop');
  const beat = t > tAlive ? Math.pow(Math.max(0, Math.sin((t - tAlive) * 0.42)), 6) : 0;

  // where is each page right now (slab) once towers exist
  const pageSlab: Slab[] = SLABS0.map((s) => s);
  const flying: {from: Slab; to: Slab; q: number}[] = [];
  HOPS.forEach((h) => {
    const q = (t - tShuf - h.dt) / 9;
    if (q >= 1) pageSlab[h.page] = h.to;
    else if (q > 0) { flying.push({from: pageSlab[h.page], to: h.to, q}); pageSlab[h.page] = [-1, 0, 0, 0]; }
  });
  const slabLit = (c: number, i: number, j: number, l: number) => pageSlab.some((s) => s[0] === c && s[1] === i && s[2] === j && s[3] === l);

  // page landing (0..1) for the flat cells
  const landed = (k: number) => smooth((t - (tOne + k * 0.7) - 9) / 3);
  const inner = (chip: number) => (
    <Cells id={id} chip={chip} look={(r, c) => {
      const k = PAGES.findIndex((p) => p[0] === chip && p[1] === r && p[2] === c);
      const seed = rnd(chip * 91 + r * 17 + c * 3.1);
      const dim = 1 - rise * 0.55;
      const wave = t > tSpread ? clamp01(1 - Math.abs((r + chip * 18) - (t - tSpread) * 2.2) / 3) : 0;
      if (k >= 0 && landed(k) > 0.02) return {fill: '#FFE08A', o: landed(k) * dim, glow: 'ga', gr: (26 + 30 * chargeP + 8 * Math.sin(t * 0.4 + k)) * (0.6 + 0.4 * charge) * dim};
      if (wave > 0.05) return {fill: CY, o: 0.4 + 0.6 * wave};
      return seed > 0.55 ? {fill: '#2A5E9C', o: (0.6 + 0.25 * charge) * dim} : {fill: '#15335A', o: 0.9 * dim};
    }} />
  );
  const die = (u: number, v: number, w: number, d: number) => (
    <g>
      <rect x={u + w * 0.2} y={v + d * 0.2} width={w * 0.6} height={d * 0.6} rx={4} fill="#0E2C52" stroke={CY} strokeWidth={1.4} opacity={0.9} />
      {Array.from({length: 7}).map((_, i) => <line key={i} x1={u + w * 0.2} x2={u + w * 0.8} y1={v + d * (0.25 + i * 0.083)} y2={v + d * (0.25 + i * 0.083)} stroke={CY} strokeWidth={1} opacity={0.4} />)}
      {Array.from({length: 7}).map((_, i) => <line key={`v${i}`} y1={v + d * 0.2} y2={v + d * 0.8} x1={u + w * (0.25 + i * 0.083)} x2={u + w * (0.25 + i * 0.083)} stroke={CY} strokeWidth={1} opacity={0.3} />)}
      {Array.from({length: 24}).map((_, i) => {
        const side = i % 4, f = 0.24 + (Math.floor(i / 4) / 5) * 0.52;
        const a: P2 = side === 0 ? [u + w * f, v + d * 0.2] : side === 1 ? [u + w * f, v + d * 0.8] : side === 2 ? [u + w * 0.2, v + d * f] : [u + w * 0.8, v + d * f];
        const b: P2 = side === 0 ? [u + w * f, v + d * 0.06] : side === 1 ? [u + w * f, v + d * 0.94] : side === 2 ? [u + w * 0.06, v + d * f] : [u + w * 0.94, v + d * f];
        return <g key={`b${i}`}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#E7C66E" strokeWidth={1.3} opacity={0.75} /><circle cx={b[0]} cy={b[1]} r={3} fill="#E7C66E" /></g>;
      })}
      <rect x={u + w * 0.3 + ((t * 2.2) % (w * 0.4))} y={v + d * 0.2} width={5} height={d * 0.6} fill="#DDF4FF" opacity={0.5} />
    </g>
  );

  // towers
  const towers: React.ReactNode[] = [];
  if (rise > 0.01) {
    for (const chip of [1, 0]) for (let i = TW_U - 1; i >= 0; i--) for (let j = 0; j < TW_V; j++) {
      const [u, v] = towerUV(chip, i, j);
      const delay = (TW_U - 1 - i) * 0.6 + j * 0.9 + (chip === 1 ? 2 : 0);
      const rs = sp(t, tTow + delay, 'bouncy');
      if (rs < 0.01) continue;
      for (let l = 0; l < TW_L; l++) {
        const lp = clamp01(rs * TW_L - l * 0.75);
        if (lp < 0.02) continue;
        const z = BT + 6 + l * (TW_H + TW_GAP) * rs;
        const lit = slabLit(chip, i, j, l);
        const shim = lit ? 0.75 + 0.25 * Math.sin(t * 0.5 + l + i) : 0;
        const cst = t > tConst ? clamp01(1 - Math.abs(((t - tConst) * 0.9 + i + j) % 9 - l) / 1.2) : 0;
        const top = lit ? `rgba(255,214,110,${0.75 + 0.25 * shim})` : `rgba(96,170,255,${0.62 + 0.3 * cst})`;
        const left = lit ? 'rgba(232,160,40,0.92)' : `rgba(40,96,196,${0.66 + 0.3 * cst})`;
        const right = lit ? 'rgba(180,112,20,0.92)' : `rgba(22,58,136,${0.72 + 0.26 * cst})`;
        const fill = lit ? 0.78 : 0.18 + rnd(chip * 7 + i * 3 + j * 5 + l) * 0.5;
        const gc = P(u + TW_S / 2, v + TW_S / 2, z + TW_H / 2);
        towers.push(
          <g key={`${chip}-${i}-${j}-${l}`} opacity={Math.min(1, lp * 1.3)}>
            {lit ? <Glow id={id} x={gc[0]} y={gc[1]} r={70 + 26 * buck + 16 * shim} kind="ga" o={0.8} /> : null}
            <Box u={u} v={v} w={TW_S} d={TW_S} h={TW_H * lp} z={z} top={top} left={left} right={right} stroke={lit ? '#FFF0C0' : 'rgba(150,210,255,0.7)'} sw={1} />
            {/* bucket glyph on the front face */}
            {tiny > 0.05 && lp > 0.9 ? (
              <g transform={faceV(u, v, z)} opacity={tiny}>
                <rect x={TW_S * 0.2} y={-TW_H * 0.82 + TW_H * 0.64 * (1 - fill * (0.4 + 0.6 * buck))} width={TW_S * 0.6} height={TW_H * 0.64 * fill * (0.4 + 0.6 * buck)} fill={lit ? '#FFF6D0' : CY} opacity={lit ? 1 : 0.75} />
                <path d={`M${TW_S * 0.2},${-TW_H * 0.86} V${-TW_H * 0.18} H${TW_S * 0.8} V${-TW_H * 0.86}`} fill="none" stroke={lit ? '#5A3600' : '#DDF4FF'} strokeWidth={2} strokeLinejoin="round" />
              </g>
            ) : null}
          </g>,
        );
      }
    }
  }

  // photo card -> 12 tiles -> cells
  const cardIn = sp(t, tPhoto, 'bouncy'), crack = sp(t, tIsnt, 'pop'), split = sp(t, tStored, 'settle');
  const tiles: React.ReactNode[] = [];
  if (cardIn > 0.01) {
    for (let k = 0; k < 12; k++) {
      const col = k % 3, row = Math.floor(k / 3);
      const tw = 92, th = 82, gap = 4 + split * 16 + crack * 5;
      const hx = PHOTO10[0] + (col - 1) * (tw + gap), hy = PHOTO10[1] + (row - 1.5) * (th + gap) + Math.sin(t * 0.2 + k) * 4 * split;
      const [cu, cv] = cellUV(PAGES[k][0], PAGES[k][1], PAGES[k][2]);
      const dest = P(cu, cv, CZ + 4);
      const q = smooth((t - (tOne + k * 0.7)) / 10.5);
      if (q >= 1) continue;
      const x = lerp(hx, dest[0], q), y = lerp(hy, dest[1], q) - Math.sin(q * Math.PI) * 170;
      const s = cardIn * lerp(1, 0.2, q);
      const fillc = row === 0 ? '#3D8BFF' : row === 1 ? '#8FD0FF' : row === 2 ? '#2C8F6C' : '#1E6B52';
      tiles.push(
        <g key={k} transform={`translate(${x},${y}) rotate(${(rnd(k * 3.1) - 0.5) * (split * 10 + q * 80)}) scale(${s})`}>
          {q > 0 ? <circle r={120} fill={`url(#${id}-ga)`} opacity={0.8} /> : null}
          <rect x={-tw / 2} y={-th / 2} width={tw} height={th} rx={4 + split * 8} fill={fillc} stroke="#FFFFFF" strokeWidth={split > 0.05 ? 3 : 0} />
          {k === 2 ? <circle cx={0} cy={6} r={24} fill="#FFF3B0" /> : null}
          {row === 1 ? <polygon points={`${-tw / 2},${th / 2} ${-tw / 2},${10 - col * 12} ${0},${col === 1 ? -30 : 0} ${tw / 2},${col * 14 - 6} ${tw / 2},${th / 2}`} fill="#2C8F6C" /> : null}
          {split > 0.3 ? <text x={0} y={th / 2 - 10} textAnchor="middle" fontFamily={MONO} fontSize={18} fill="rgba(255,255,255,0.85)">p{k + 1}</text> : null}
        </g>,
      );
    }
  }
  const cardGone = smooth((t - tOne - 4) / 8);

  // constellation links between the pages
  const links: React.ReactNode[] = [];
  const order = [0, 4, 1, 2, 5, 3, 7, 11, 9, 6, 8, 10];
  const linkP = clamp01((t - tSpread) / (tTow - tSpread)) * (1 - rise);
  if (linkP > 0.01) {
    for (let k = 0; k < order.length - 1; k++) {
      const a = PAGES[order[k]], b = PAGES[order[k + 1]];
      const q = clamp01(linkP * (order.length - 1) - k);
      if (q <= 0) continue;
      const ca = cellUV(a[0], a[1], a[2]), cb = cellUV(b[0], b[1], b[2]);
      const pa = P(ca[0], ca[1], CZ + 4), pb = P(cb[0], cb[1], CZ + 4);
      links.push(<line key={k} x1={pa[0]} y1={pa[1]} x2={lerp(pa[0], pb[0], q)} y2={lerp(pa[1], pb[1], q)} stroke="#FFE08A" strokeWidth={3} strokeDasharray="10 7" strokeDashoffset={-t * 2} opacity={0.9 * (1 - rise)} />);
    }
  }

  // heartbeat trace along the front edge of the board
  const ecg: P2[] = [];
  const head = (t - tAlive) / 16;
  if (t > tAlive) {
    for (let k = 0; k <= 160; k++) {
      const f = k / 160;
      if (f > head * 1.05) break;
      const ph = (f * 5) % 1;
      const a = ph < 0.42 ? 0 : ph < 0.47 ? -(ph - 0.42) * 500 : ph < 0.53 ? -25 + (ph - 0.47) * 2600 : ph < 0.59 ? 131 - (ph - 0.53) * 3200 : ph < 0.64 ? -61 + (ph - 0.59) * 1220 : ph > 0.78 && ph < 0.9 ? Math.sin((ph - 0.78) / 0.12 * Math.PI) * 22 : 0;
      ecg.push(P(f * 1600, 300, BT + 50 + a));
    }
  }
  const cg = P(800, 220, BT), cc = P(1100, 220, BT);
  const K = 1 + 0.6 * (ramp(t, tBuck) - ramp(t, tShuf));
  return (
    <svg width={2800} height={3000} style={{overflow: 'visible'}}>
      <g transform={`translate(${BUCK[0]},${BUCK[1]}) scale(${K}) translate(${-BUCK[0]},${-BUCK[1]})`}>
      <Drive id={id} t={t} led={0.5 + 0.5 * Math.max(pulse, beat)} strip={0.5 + 0.5 * Math.max(chargeP, beat, alive * 0.6)} boardGlow={Math.max(chargeP * 0.9, beat * 1.2, pulse * 0.3)}
             chips={{ctrl: {xray: 1, inner: die(150, 92, 262, 262)}, dram: {xray: 1, inner: die(470, 112, 168, 220)}, n1: {xray: 1, inner: inner(0), edge: chargeP > 0.3 ? AM : CY}, n2: {xray: 1, inner: inner(1), edge: chargeP > 0.3 ? AM : CY}}} />
      {links}
      {/* charge surge */}
      {chargeP > 0.02 ? <Glow id={id} x={cc[0]} y={cc[1]} r={300 + 700 * (1 - chargeP)} kind="ga" o={chargeP * 0.75} /> : null}
      {charge > 0.01 && rise < 0.5 ? PAGES.map((p, k) => {
        const c = cellUV(p[0], p[1], p[2]);
        const [cx, cy] = P(c[0], c[1], CZ + 6);
        return [0, 1, 2].map((e) => {
          const a = t * 0.35 + e * 2.09 + k;
          return <circle key={`${k}-${e}`} cx={cx + Math.cos(a) * 22} cy={cy + Math.sin(a) * 12 - 8} r={7 * charge} fill={`url(#${id}-el)`} opacity={1 - rise * 2} />;
        });
      }) : null}
      {towers}
      {/* shuffling pages */}
      {flying.map((f, k) => {
        const a = slabCenter(f.from), b = slabCenter(f.to), q = smooth(f.q);
        const x = lerp(a[0], b[0], q), y = lerp(a[1], b[1], q) - Math.sin(q * Math.PI) * 240;
        return (
          <g key={k}>
            {[0.1, 0.2, 0.3].map((d) => {
              const qq = Math.max(0, q - d);
              return <circle key={d} cx={lerp(a[0], b[0], qq)} cy={lerp(a[1], b[1], qq) - Math.sin(qq * Math.PI) * 240} r={16 - d * 30} fill="#FFE08A" opacity={0.5 - d} />;
            })}
            <Glow id={id} x={x} y={y} r={110} kind="ga" />
            <rect x={x - 26} y={y - 20} width={52} height={40} rx={7} fill="#FFF3C4" stroke="#FFFFFF" strokeWidth={3} transform={`rotate(${q * 180} ${x} ${y})`} />
          </g>
        );
      })}
      {/* the photo */}
      {cardIn > 0.01 && cardGone < 1 ? (
        <g opacity={1 - cardGone}>
          <Glow id={id} x={PHOTO10[0]} y={PHOTO10[1]} r={420} kind="ga" o={0.55 * cardIn} />
          <rect x={PHOTO10[0] - 170 - split * 26} y={PHOTO10[1] - 200 - split * 30} width={340 + split * 52} height={400 + split * 60} rx={26} fill="rgba(255,255,255,0.10)" stroke="#FFFFFF" strokeWidth={4} opacity={cardIn * (1 - split * 0.6)} />
        </g>
      ) : null}
      {tiles}
      {t > tOne && t < tOne + 10 ? <circle cx={PHOTO10[0]} cy={PHOTO10[1]} r={120 + (t - tOne) * 60} fill="none" stroke="#FFFFFF" strokeWidth={10 * (1 - (t - tOne) / 10)} opacity={1 - (t - tOne) / 10} /> : null}
      <Tag x={PHOTO10[0] - 120} y={PHOTO10[1] - 290} tx={PHOTO10[0] - 150} ty={PHOTO10[1] - 190} title="your photo" sub="IMG_0421.jpg" p={cardIn * (1 - split)} color={AM} w={300} />
      {/* heartbeat */}
      {ecg.length > 1 ? (
        <g>
          <polyline points={pts(ecg)} fill="none" stroke="#3FDC7B" strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" opacity={0.22} />
          <polyline points={pts(ecg)} fill="none" stroke="#B8FFD2" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={ecg[ecg.length - 1][0]} cy={ecg[ecg.length - 1][1]} r={16} fill="#FFFFFF" />
          <Glow id={id} x={ecg[ecg.length - 1][0]} y={ecg[ecg.length - 1][1]} r={150} kind="gc" o={head < 1.05 ? 1 : 0.4} />
        </g>
      ) : null}
      {alive > 0.01 ? <ellipse cx={cg[0]} cy={cg[1]} rx={900 + beat * 80} ry={760 + beat * 60} fill={`url(#${id}-gc)`} opacity={0.12 + beat * 0.3} /> : null}
      </g>
    </svg>
  );
};

const s10: WorldDef = {
  id: 'ssd-callback', home: 'drive',
  anchors: {
    drive: anchor(800, 220, 110, 0.74),
    photo: {x: PHOTO10[0], y: PHOTO10[1] + 60, zoom: 1.2},
    place: anchor(1100, 220, 160, 0.98),
    charge: anchor(1100, 220, BT, 1.3),
    spread: anchor(1100, 220, BT, 1.02),
    towers: anchor(1100, 220, 190, 1.02),
    buckets: {x: BUCK[0], y: BUCK[1], zoom: 1.6},
    shuffled: anchor(1100, 220, 230, 0.95),
  },
  aliases: {"isn't": 'photo', stored: 'photo', one: 'photo', across: 'spread', tiny: 'towers', constantly: 'buckets', keep: 'shuffled', alive: 'drive'},
  palette: {bg0: '#03040F', bg1: '#141C4A', particles: '#9FE3FF', glow: '#5CC8FF'},
  Draw: S10Draw,
};

export const ssdWorlds: Record<string, WorldDef> = {S01: s01, S02: s02, S10: s10};
