// cine3d mac innards (26 Nov 2026): the 2D inside of the MacBook Air M1, drawn for MacShot's `interior` plane (the
// plane just under the keyboard, seen from above through a ghosted deck). Boards and chips stay 2D code: the logic
// board is built from the silicon kit, seen from straight above. Size: MAC.interior = 290 x 196.9 mm at 6 px per mm
// = 1740 x 1181 px; x runs left to right, y from the hinge to the front edge. Fanless: no fan, a flat heat spreader.
// The arrangement is an illustration (logic board across the rear with the M1 in the upper middle, four battery
// cells and the trackpad in front of it, a speaker at each side) - not a trace of Apple's board.
import React, {useMemo} from 'react';
import {SI, SiChip, SiGlow, SiPassives, SiPrism, SiScene, SiTop, dot, sweepAcross, tint, type Passive, type PassiveType, type SiChipProps} from '../explainer/silicon';
import {seeded, type V3} from './core';
import {MAC} from './macbook';

const I = MAC.interior, PX = I.pxPerMm;
/** the logic board: its place on the plane (mm from the plane's rear-left corner) and its drawing scale. Kit parts
 *  are drawn 2 x life size so the M1 reads from a whole-laptop framing. */
const BOARD = {x: 62, y: 14, w: 170, d: 48, k: 2};
const BW = BOARD.w / BOARD.k, BD = BOARD.d / BOARD.k;            // plan size in kit mm: 85 x 24
const M1 = {x: 27.5, y: 5.75, w: 14, d: 14};
type PChip = {id: string; x: number; y: number; w: number; d: number; role: SiChipProps['role']; kind?: SiChipProps['kind']};
const CHIPS: PChip[] = [
  {id: 'dram1', x: 44.5, y: 2.6, w: 8.6, d: 8.6, role: 'dram'}, {id: 'dram2', x: 44.5, y: 12.8, w: 8.6, d: 8.6, role: 'dram'},
  {id: 'nand', x: 6, y: 3.2, w: 10.5, d: 8, role: 'nand'}, {id: 'pmic', x: 8, y: 14.4, w: 6, d: 6, role: 'pmic'},
  {id: 'pmic2', x: 57.5, y: 3.4, w: 6, d: 6, role: 'pmic'}, {id: 'wireless', x: 58, y: 13.6, w: 5.4, d: 5.4, role: 'wireless'},
  {id: 'audio', x: 19.5, y: 16.6, w: 4.2, d: 4.2, role: 'audio'}, {id: 'shield', x: 68, y: 4, w: 11, d: 7.4, role: 'shield', kind: 'shield'},
  {id: 'tb', x: 70.5, y: 14.6, w: 5.6, d: 5.6, role: 'transceiver'},
];
const PT: {type: PassiveType; l: number; w: number; h: number; n: number}[] = [
  {type: 'cap', l: 0.6, w: 0.3, h: 0.3, n: 5}, {type: 'cap', l: 1.0, w: 0.5, h: 0.5, n: 3}, {type: 'res', l: 0.6, w: 0.3, h: 0.23, n: 5},
  {type: 'capDark', l: 1.6, w: 0.8, h: 0.8, n: 1}, {type: 'ind', l: 1.5, w: 1.5, h: 1.0, n: 1}, {type: 'icSi', l: 1.3, w: 1.3, h: 0.36, n: 1}, {type: 'ic', l: 1.5, w: 1.5, h: 0.5, n: 1},
];
const hit = (x: number, y: number, w: number, d: number, r: {x: number; y: number; w: number; d: number}, m: number) => x < r.x + r.w + m && x + w > r.x - m && y < r.y + r.d + m && y + d > r.y - m;
const boardArt = () => {
  const rnd = seeded(5120), groups: Passive[][] = PT.map(() => []), C = 2.0;
  for (let gx = 0.8; gx + C <= BW - 0.5; gx += C) for (let gy = 0.8; gy + C <= BD - 0.5; gy += C) {
    const a = rnd(), b = rnd(), c = rnd(), e = rnd();
    if (hit(gx, gy, C, C, M1, 1.0) || CHIPS.some((ch) => hit(gx, gy, C, C, ch, 0.35)) || a > 0.72) continue;
    const k = Math.floor(b * PT.length), T = PT[k], along: 'x' | 'y' = c > 0.5 ? 'x' : 'y', n = 1 + Math.floor(e * T.n);
    for (let i = 0; i < n; i++) {
      const pitch = T.w + 0.16, off = (C - 0.3 - n * pitch) / 2 + i * pitch;
      if (off < 0) break;
      groups[k].push(along === 'x' ? {x: gx + (C - 0.3 - T.l) / 2, y: gy + off, l: T.l, w: T.w, along} : {x: gx + off, y: gy + (C - 0.3 - T.l) / 2, l: T.l, w: T.w, along});
    }
  }
  let fan = '', tr = '', vias = '';
  for (let i = 0; i < 24; i++) {
    const f = (i + 0.5) / 24, a = 0.8 + rnd() * 2.0;
    fan += `M${(M1.x + M1.w * f).toFixed(2)} ${M1.y}v${-a}l${(f - 0.5) * 3} -1.1M${(M1.x + M1.w * f).toFixed(2)} ${M1.y + M1.d}v${a}l${(f - 0.5) * 3} 1.1`;
    fan += `M${M1.x} ${(M1.y + M1.d * f).toFixed(2)}h${-a}l-1.1 ${(f - 0.5) * 3}M${M1.x + M1.w} ${(M1.y + M1.d * f).toFixed(2)}h${a}l1.1 ${(f - 0.5) * 3}`;
  }
  for (let i = 0; i < 90; i++) {
    const x = 1 + rnd() * (BW - 2), y = 1 + rnd() * (BD - 2), l = 2 + rnd() * 8, s = rnd() > 0.5 ? 1 : -1;
    if (hit(x - 1, y - 1, l + 3, 3, M1, 0.2)) continue;
    tr += `M${x.toFixed(2)} ${y.toFixed(2)}h${Math.min(l, BW - 1 - x).toFixed(2)}l${s} ${s}`;
    vias += dot(x, y, 0.13);
  }
  return {groups, fan, tr, vias};
};

/** Base-space point (mm) of a part of the inside view: 'm1' (= MAC_POINTS.chip), or a chip id of the board. */
export const macInnardsPoint = (id: string): V3 => {
  const c = id === 'm1' ? M1 : CHIPS.find((k) => k.id === id) ?? M1;
  return [I.x0 + BOARD.x + (c.x + c.w / 2) * BOARD.k, I.y, I.z0 + BOARD.y + (c.y + c.d / 2) * BOARD.k];
};

const Board = React.memo<{m1?: Partial<SiChipProps>; lit: number; accent: string; flow: number}>(({m1, lit, accent, flow}) => {
  const art = useMemo(boardArt, []);
  const MASK = '#0D1418';
  return (
    <g>
      <SiPrism x={0} y={0} w={BW} d={BD} z={0} h={0.8} color="#4A3418" />
      <SiTop z={0.8}>
        <rect width={BW} height={BD} rx={0.6} fill={MASK} />
        <rect width={BW} height={BD} rx={0.6} fill="url(#c3m-env)" opacity={0.55} />
        <path d={art.tr} stroke={tint(MASK, 0.2)} strokeWidth={0.11} fill="none" />
        <path d={art.fan} stroke={tint(MASK, 0.26)} strokeWidth={0.09} fill="none" />
        <path d={art.vias} fill={SI.gold} opacity={0.75} />
        <rect x={0.25} y={0.25} width={BW - 0.5} height={BD - 0.5} rx={0.45} fill="none" stroke={SI.gold} strokeOpacity={0.5} strokeWidth={0.12} />
        <rect width={BW} height={BD} rx={0.6} fill="url(#c3m-sweep)" opacity={0.3} />
        {lit > 0.01 ? (
          <g style={{mixBlendMode: 'screen'}}>
            <path d={art.fan} stroke={accent} strokeWidth={0.2} fill="none" opacity={lit} strokeDasharray="1.4 1.2" strokeDashoffset={-flow} />
            <path d={art.tr} stroke={accent} strokeWidth={0.14} fill="none" opacity={lit * 0.6} strokeDasharray="2.4 1.8" strokeDashoffset={-flow * 1.4} />
          </g>
        ) : null}
      </SiTop>
      {art.groups.map((g, k) => (g.length ? <SiPassives key={k} items={g} type={PT[k].type} h={PT[k].h} z={0.8} /> : null))}
      {CHIPS.map((c, i) => <SiChip key={c.id} x={c.x} y={c.y} w={c.w} d={c.d} z={0.8} role={c.role} kind={c.kind} seed={i + 51} perf={c.kind === 'shield'} />)}
      <SiGlow x={M1.x + M1.w / 2} y={M1.y + M1.d / 2} r={15} z={0.85} color={accent} strength={0.7 * lit} />
      <SiChip x={M1.x} y={M1.y} w={M1.w} d={M1.d} z={0.8} role="soc" mark={{logo: 'apple', title: 'M1', top: [], lines: ['APPLE SILICON'], layout: 'center'}} glowColor={accent} {...m1} />
    </g>
  );
});

export const MacInnards: React.FC<{
  /** design frame: only moves the light running along the board traces when `lit` is on */
  t?: number;
  /** silicon kit chip props for the M1 (glow, glowColor, highlight, highlightColor, xray, dieActive ...) */
  m1?: Partial<SiChipProps>;
  /** 0..1: the board's traces light up round the M1 */
  lit?: number;
  accent?: string;
  /** 0..1 position of a light band crossing the board (omit for none) */
  sweep?: number;
  /** 0..1: how lit the inside is (fade it in with the x-ray) */
  light?: number;
}> = ({t = 0, m1, lit = 0, accent = '#62E0FF', sweep, light = 1}) => {
  const w = I.w, h = I.h, P = PX;
  const cell = (x: number, y: number, cw: number, ch: number, key: string) => (
    <g key={key}>
      <rect x={x * P - 5} y={y * P - 3} width={cw * P + 10} height={ch * P + 12} rx={16} fill="#000" opacity={0.55} filter="url(#c3m-soft)" />
      <rect x={x * P} y={y * P} width={cw * P} height={ch * P} rx={13} fill="url(#c3m-can)" stroke="#fff" strokeOpacity={0.1} strokeWidth={2} />
      <rect x={x * P} y={y * P} width={cw * P} height={ch * P} rx={13} fill="url(#c3m-brush)" />
      <rect x={x * P + 18} y={y * P + 18} width={cw * P * 0.42} height={7} rx={3.5} fill="#AEB5BF" opacity={0.3} />
      <rect x={x * P + 18} y={y * P + 34} width={cw * P * 0.27} height={5} rx={2.5} fill="#AEB5BF" opacity={0.2} />
    </g>
  );
  const speaker = (x: number, key: string) => (
    <g key={key}>
      <rect x={x * P} y={12 * P} width={28 * P} height={50 * P} rx={14} fill="#15171B" stroke="#fff" strokeOpacity={0.09} strokeWidth={2} />
      {Array.from({length: 17}, (_, r) => Array.from({length: 8}, (_, c) => <circle key={`${r}-${c}`} cx={x * P + 24 + c * 17.5} cy={12 * P + 24 + r * 16} r={4.2} fill="#000" opacity={0.7} />))}
      <circle cx={(x + 14) * P} cy={48 * P} r={56} fill="#0B0C0F" stroke="#3A3F48" strokeWidth={3} /><circle cx={(x + 14) * P} cy={48 * P} r={30} fill="#1B1E24" stroke="#4A505A" strokeWidth={2} />
    </g>
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, background: '#07080B', opacity: light}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="c3m-tray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1C1F25" /><stop offset="0.5" stopColor="#0E1014" /><stop offset="1" stopColor="#16191E" /></linearGradient>
          <linearGradient id="c3m-can" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#353A42" /><stop offset="0.35" stopColor="#1F2227" /><stop offset="0.7" stopColor="#2A2E35" /><stop offset="1" stopColor="#17191D" /></linearGradient>
          <linearGradient id="c3m-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D939C" /><stop offset="0.5" stopColor="#555A63" /><stop offset="1" stopColor="#7A808A" /></linearGradient>
          <linearGradient id="c3m-cu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3A3D44" /><stop offset="0.5" stopColor="#5A5F68" /><stop offset="1" stopColor="#33363C" /></linearGradient>
          <pattern id="c3m-brush" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 1H6M0 4H6" stroke="#fff" strokeOpacity="0.025" strokeWidth="1" /></pattern>
          <filter id="c3m-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="12" /></filter>
        </defs>
        <rect width={w} height={h} fill="url(#c3m-tray)" />
        <rect width={w} height={h} fill="url(#c3m-brush)" />
        {/* antenna / hinge bar */}
        <rect x={30 * P} y={2.5 * P} width={230 * P} height={6 * P} rx={10} fill="#1A1C21" stroke="#fff" strokeOpacity={0.08} strokeWidth={2} />
        {Array.from({length: 22}, (_, i) => <rect key={i} x={(36 + i * 10) * P} y={4.2 * P} width={5 * P} height={2.6 * P} rx={4} fill="#000" opacity={0.5} />)}
        {/* I/O boards at the sides: USB-C on the left, the headphone jack on the right */}
        <rect x={4 * P} y={12 * P} width={22 * P} height={40 * P} rx={8} fill="#0D1418" stroke="#C9A24B" strokeOpacity={0.4} strokeWidth={1.5} />
        {[19.5, 35.5].map((z) => <g key={z}><rect x={4 * P} y={(z - 4.5) * P} width={11 * P} height={9 * P} rx={5} fill="url(#c3m-steel)" /><rect x={16 * P} y={(z - 3) * P} width={7 * P} height={6 * P} rx={3} fill="#191A1D" /></g>)}
        <rect x={264 * P} y={12 * P} width={22 * P} height={24 * P} rx={8} fill="#0D1418" stroke="#C9A24B" strokeOpacity={0.4} strokeWidth={1.5} />
        <rect x={275 * P} y={15.5 * P} width={11 * P} height={8 * P} rx={5} fill="url(#c3m-steel)" /><rect x={267 * P} y={26 * P} width={8 * P} height={7 * P} rx={3} fill="#191A1D" />
        {speaker(30, 'sl')}{speaker(232, 'sr')}
        {/* flat heat spreader under the board (fanless) and the board's shadow */}
        <rect x={(BOARD.x - 2) * P} y={(BOARD.y - 2) * P} width={(BOARD.w + 4) * P} height={(BOARD.d + 4) * P} rx={14} fill="url(#c3m-cu)" opacity={0.55} />
        <rect x={BOARD.x * P - 6} y={BOARD.y * P - 4} width={BOARD.w * P + 12} height={BOARD.d * P + 14} rx={14} fill="#000" opacity={0.7} filter="url(#c3m-soft)" />
        {/* battery: two cells behind the trackpad, a taller cell at each side */}
        {cell(64, 70, 79, 50, 'c1')}{cell(147, 70, 79, 50, 'c2')}{cell(6, 70, 54, 121, 'c3')}{cell(230, 70, 54, 121, 'c4')}
        <text x={76 * P} y={111 * P} fontFamily="Poppins, sans-serif" fontWeight={600} fontSize={22} letterSpacing={6} fill="#AEB5BF" opacity={0.4}>Li-ion Battery</text>
        {/* trackpad plate and its flex */}
        <rect x={72 * P} y={127 * P} width={146 * P} height={64 * P} rx={12} fill="url(#c3m-steel)" opacity={0.8} />
        <rect x={72 * P} y={127 * P} width={146 * P} height={64 * P} rx={12} fill="url(#c3m-brush)" />
        {[[80, 134], [210, 134], [80, 184], [210, 184], [145, 134], [145, 184]].map(([x, y], i) => <circle key={i} cx={x * P} cy={y * P} r={9} fill="#2A2D33" stroke="#B9BEC6" strokeWidth={2} />)}
        <path d={`M${145 * P} ${(BOARD.y + BOARD.d) * P}V${150 * P}`} stroke="#B8661C" strokeWidth={66} opacity={0.7} />
        <rect x={136 * P} y={148 * P} width={18 * P} height={8 * P} rx={5} fill="#191A1D" stroke="#C9A24B" strokeOpacity={0.5} strokeWidth={1.5} />
        {/* flexes from the board to the I/O boards */}
        <path d={`M${26 * P} ${22 * P}H${BOARD.x * P}`} stroke="#B8661C" strokeWidth={40} opacity={0.6} /><path d={`M${(BOARD.x + BOARD.w) * P} ${24 * P}H${264 * P}`} stroke="#B8661C" strokeWidth={34} opacity={0.6} />
      </svg>
      <SiScene id="c3m" width={w} height={h} u={P * BOARD.k} tilt={0} origin={[BOARD.x * P, BOARD.y * P]} style={{position: 'absolute', left: 0, top: 0}} sweep={sweep === undefined ? undefined : sweepAcross(sweep, 0, 0, BW, BD)}>
        <Board m1={m1} lit={lit} accent={accent} flow={t * 0.2} />
      </SiScene>
    </div>
  );
};
