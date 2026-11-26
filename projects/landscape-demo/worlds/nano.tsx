// landscape-demo S02: NanoZoom on a 1920x1080 frame. Levels are drawn in CENTRED px (0,0 = the frame centre; the
// visible frame at native scale is x -960..960, y -540..540). Every portal is [0,0] (pure zoom, no pan) and each level
// draws a 1/10 copy of the next one inside its portal, so the hand-off is seamless.
import React from 'react';
import type {SceneProps} from '../../../src/kit/types';
import {NanoZoom, type NanoKey, type NanoLevel} from '../../../src/kit/explainer/nano';
import {C} from '../../../src/kit/explainer/tokens';

const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** level 2: fin transistors, 2040 x 1200 px of cells around the centre */
const Fins: React.FC<{t: number; lite?: boolean}> = ({t, lite}) => {
  const cols = lite ? 20 : 34, rows = lite ? 12 : 20, cw = 2040 / cols, ch = 1200 / rows;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const on = Math.sin(t / 7 + rnd(r * 31 + k) * 6.283) > 0.25;
      const x = -1020 + k * cw, y = -600 + r * ch;
      out.push(
        <g key={`${r}-${k}`}>
          <rect x={x + cw * 0.1} y={y + ch * 0.16} width={cw * 0.8} height={ch * 0.68} rx={4} fill="#101826" stroke="#22324A" strokeWidth={1.5} />
          <rect x={x + cw * 0.42} y={y + ch * 0.08} width={cw * 0.16} height={ch * 0.84} rx={3} fill={on ? C.info : '#2B3A52'} opacity={on ? 1 : 0.8} />
          {lite ? null : <rect x={x + cw * 0.16} y={y + ch * 0.42} width={cw * 0.68} height={ch * 0.16} rx={3} fill={on ? '#9CC3FF' : '#3A4C68'} opacity={0.85} />}
        </g>,
      );
    }
  }
  return <g><rect x={-1100} y={-660} width={2200} height={1320} fill="#070B12" />{out}</g>;
};

/** level 1: the die floorplan, 1740 x 980 px */
const Die: React.FC<{t: number; lite?: boolean}> = ({t, lite}) => {
  const blocks: [number, number, number, number, string, string][] = [
    [-830, -450, 520, 400, '#1B3A6B', 'PERFORMANCE CORES'], [-830, -30, 520, 460, '#1F4D3F', 'GRAPHICS'],
    [-290, -450, 580, 300, '#3A2B63', 'CACHE'], [-290, -130, 580, 260, '#16263F', 'LOGIC'], [-290, 150, 580, 280, '#4A3A1C', 'NEURAL ENGINE'],
    [310, -450, 520, 520, '#1B3A6B', 'EFFICIENCY CORES'], [310, 90, 520, 340, '#2D3340', 'I/O + MODEM LINK'],
  ];
  return (
    <g>
      <rect x={-870} y={-490} width={1740} height={980} rx={14} fill="#0A0F18" stroke="#33455F" strokeWidth={4} />
      {blocks.map(([x, y, w, h, col, name], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx={8} fill={col} opacity={0.92} />
          {lite ? null : Array.from({length: 9}).map((_, k) => (
            <line key={k} x1={x + 14} x2={x + w - 14} y1={y + 20 + (k * (h - 40)) / 8} y2={y + 20 + (k * (h - 40)) / 8} stroke="rgba(255,255,255,0.10)" strokeWidth={2} />
          ))}
          {lite ? null : <text x={x + 22} y={y + 50} fill="rgba(255,255,255,0.78)" fontFamily="Poppins, sans-serif" fontWeight={700} fontSize={30} letterSpacing={2}>{name}</text>}
        </g>
      ))}
      {/* the next level (transistors) at 1/10 inside the portal */}
      <g transform="scale(0.1)"><Fins t={t} lite /></g>
      <rect x={-110} y={-66} width={220} height={132} fill="none" stroke={C.info} strokeWidth={3} opacity={0.9} />
    </g>
  );
};

/** level 0: the package seen from above, 820 x 820 px */
const Package: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-1000} y={-600} width={2000} height={1200} fill="#0B1410" />
    {Array.from({length: 40}).map((_, i) => (
      <line key={i} x1={-1000} x2={1000} y1={-590 + i * 30} y2={-590 + i * 30 + (rnd(i) - 0.5) * 60} stroke="#1F3A2C" strokeWidth={3} opacity={0.7} />
    ))}
    {Array.from({length: 26}).map((_, i) => [-1, 1].map((s) => (
      <rect key={`${i}${s}`} x={-403 + i * 31} y={s < 0 ? -446 : 414} width={18} height={32} rx={3} fill="#C9A24A" />
    )))}
    {Array.from({length: 26}).map((_, i) => [-1, 1].map((s) => (
      <rect key={`v${i}${s}`} x={s < 0 ? -446 : 414} y={-403 + i * 31} width={32} height={18} rx={3} fill="#C9A24A" />
    )))}
    <rect x={-410} y={-410} width={820} height={820} rx={26} fill="#14161A" stroke="#2C3036" strokeWidth={4} />
    <rect x={-410} y={-410} width={820} height={300} rx={26} fill="rgba(255,255,255,0.035)" />
    <circle cx={-350} cy={-350} r={16} fill="rgba(255,255,255,0.2)" />
    <text x={0} y={-230} textAnchor="middle" fill="rgba(235,238,242,0.62)" fontFamily="Poppins, sans-serif" fontWeight={700} fontSize={84} letterSpacing={8}>SoC</text>
    <text x={0} y={270} textAnchor="middle" fill="rgba(235,238,242,0.4)" fontFamily="JetBrains Mono, monospace" fontSize={34} letterSpacing={3}>6-CORE  3 nm  ILLUSTRATION</text>
    {/* x-ray window onto the die (the next level at 1/10) */}
    <rect x={-100} y={-62} width={200} height={124} rx={6} fill="#0A0F18" stroke={C.info} strokeWidth={3} />
    <g transform="scale(0.1)"><Die t={t} lite /></g>
  </g>
);

const svg = (node: React.ReactNode) => <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{node}</svg>;
const LEVELS: NanoLevel[] = [
  {id: 'package', depth: 0, portal: [0, 0], bg: '#0B1410', Draw: ({t}) => svg(<Package t={t} />)},
  {id: 'die', depth: 1, portal: [0, 0], bg: '#0A0F18', Draw: ({t}) => svg(<Die t={t} />)},
  {id: 'fins', depth: 2, bg: '#070B12', Draw: ({t}) => svg(<Fins t={t} />)},
];
const KEYS: NanoKey[] = [{t: 4, depth: 0}, {t: 72, depth: 1}, {t: 122, depth: 2}];

export const NanoS02: React.FC<SceneProps> = ({t, W, H, spec}) => (
  <NanoZoom levels={LEVELS} keys={KEYS} t={t} beats={spec.beats ?? []} W={W} H={H} top="#03060C" />
);
