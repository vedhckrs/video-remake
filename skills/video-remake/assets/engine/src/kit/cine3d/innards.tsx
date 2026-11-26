// cine3d innards (26 Nov 2026): the 2D inside of the phone, drawn for PhoneShot's `interior` plane. The logic board is
// the silicon kit's LogicBoard seen from straight above (boards and chips stay 2D code - the 3D phone only supplies
// the real shell around them). Size: PHONE.interior, 300 px per model unit = 1356 x 2916 px, seen from the back.
import React from 'react';
import {LogicBoard, SiScene, boardLayout, sweepAcross, type BoardPartState} from '../explainer/silicon';
import type {V3} from './core';
import {PHONE} from './phone';

const I = PHONE.interior;
export const INNARDS = {
  w: (I.x1 - I.x0) * I.pxPerUnit, h: (I.y1 - I.y0) * I.pxPerUnit,
  /** board: px per mm and the px of its plan origin (top-left) */
  u: 17, bx: 66, by: 962,
};
const LAYOUT = boardLayout(7);

/** Phone-space point of a board part's centre (e.g. 'soc', 'modem', 'wireless', 'pmic'): feed it to `view.point`. */
export const innardsPoint = (id: string): V3 => {
  const p = LAYOUT.parts.find((k) => k.id === id) ?? LAYOUT.parts[0];
  const px = INNARDS.bx + (p.x + p.w / 2) * INNARDS.u, py = INNARDS.by + (p.y + p.d / 2) * INNARDS.u;
  return [I.x0 + px / I.pxPerUnit, I.y1 - py / I.pxPerUnit, I.z];
};

export const PhoneInnards: React.FC<{
  t?: number;
  /** silicon kit part states by id (glow, highlight, xray ...) */
  parts?: Record<string, BoardPartState>;
  focus?: string | string[]; dim?: number;
  /** 0..1 position of a light band crossing the board (omit for none) */
  sweep?: number;
  /** 0..1: how lit the inside is (fade it in with the x-ray) */
  light?: number;
}> = ({parts, focus, dim, sweep, light = 1}) => {
  const {w, h, u, bx, by} = INNARDS;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, background: '#07080B', opacity: light}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="c3i-tray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1A1D23" /><stop offset="0.5" stopColor="#0E1014" /><stop offset="1" stopColor="#15181D" /></linearGradient>
          <linearGradient id="c3i-can" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B4048" /><stop offset="0.35" stopColor="#23262C" /><stop offset="0.7" stopColor="#2E3239" /><stop offset="1" stopColor="#191B20" /></linearGradient>
          <linearGradient id="c3i-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8D939C" /><stop offset="0.5" stopColor="#555A63" /><stop offset="1" stopColor="#7A808A" /></linearGradient>
          <pattern id="c3i-brush" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 1H6M0 4H6" stroke="#fff" strokeOpacity="0.025" strokeWidth="1" /></pattern>
          <filter id="c3i-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        {/* mid-plate */}
        <rect width={w} height={h} fill="url(#c3i-tray)" />
        <rect width={w} height={h} fill="url(#c3i-brush)" />
        <path d={`M40 ${by - 40}H${w - 40}`} stroke="#fff" strokeOpacity={0.06} strokeWidth={2} />
        {/* board shadow */}
        <rect x={bx - 6} y={by - 6} width={72 * u + 12} height={26 * u + 12} rx={20} fill="#000" opacity={0.7} filter="url(#c3i-soft)" />
        <rect x={bx - 6} y={by + 24 * u} width={22 * u + 12} height={16 * u + 12} rx={20} fill="#000" opacity={0.7} filter="url(#c3i-soft)" />
        {/* battery: steel can with the L-shaped notch round the board's arm */}
        <path d={`M${bx + 24 * u} ${by + 28 * u}H${w - 70}a26 26 0 0 1 26 26V${h - 420}a26 26 0 0 1 -26 26H96a26 26 0 0 1 -26 -26V${by + 43 * u + 26}a26 26 0 0 1 26 -26H${bx + 24 * u - 26}a26 26 0 0 0 26 -26V${by + 28 * u + 26}a26 26 0 0 1 26 -26Z`} fill="#000" opacity={0.6} filter="url(#c3i-soft)" />
        <path d={`M${bx + 24 * u + 26} ${by + 28 * u}H${w - 70}a26 26 0 0 1 26 26V${h - 420}a26 26 0 0 1 -26 26H96a26 26 0 0 1 -26 -26V${by + 43 * u + 26}a26 26 0 0 1 26 -26H${bx + 24 * u - 26}a26 26 0 0 0 26 -26V${by + 28 * u + 26}a26 26 0 0 1 26 -26Z`} fill="url(#c3i-can)" stroke="#fff" strokeOpacity={0.1} strokeWidth={2} />
        <path d={`M${bx + 24 * u + 26} ${by + 28 * u}H${w - 70}a26 26 0 0 1 26 26V${h - 420}a26 26 0 0 1 -26 26H96a26 26 0 0 1 -26 -26V${by + 43 * u + 26}a26 26 0 0 1 26 -26H${bx + 24 * u - 26}a26 26 0 0 0 26 -26V${by + 28 * u + 26}a26 26 0 0 1 26 -26Z`} fill="url(#c3i-brush)" />
        <text x={140} y={h - 760} fontFamily="Poppins, sans-serif" fontWeight={600} fontSize={30} letterSpacing={7} fill="#AEB5BF" opacity={0.42}>Li-ion Battery</text>
        <text x={140} y={h - 716} fontFamily="JetBrains Mono, monospace" fontSize={20} letterSpacing={4} fill="#AEB5BF" opacity={0.3}>3.87 V  ·  RECHARGEABLE</text>
        <path d={`M140 ${h - 680}h300M140 ${h - 656}h210M140 ${h - 632}h260`} stroke="#AEB5BF" strokeOpacity={0.16} strokeWidth={8} />
        {/* wireless-charging coil, faint, on the battery */}
        {[250, 268, 286, 304].map((r) => <circle key={r} cx={w / 2} cy={by + 43 * u + 620} r={r} fill="none" stroke="#C98B4E" strokeOpacity={0.16} strokeWidth={7} />)}
        {/* haptic engine and speaker at the bottom */}
        <rect x={86} y={h - 370} width={470} height={250} rx={18} fill="url(#c3i-steel)" opacity={0.85} />
        <rect x={86} y={h - 370} width={470} height={250} rx={18} fill="url(#c3i-brush)" />
        <text x={116} y={h - 320} fontFamily="JetBrains Mono, monospace" fontSize={18} letterSpacing={4} fill="#111" opacity={0.5}>TAPTIC ENGINE</text>
        <rect x={600} y={h - 370} width={w - 690} height={250} rx={18} fill="#15171B" stroke="#fff" strokeOpacity={0.08} strokeWidth={2} />
        {Array.from({length: 9}, (_, r) => Array.from({length: 24}, (_, c) => <circle key={`${r}-${c}`} cx={632 + c * 26} cy={h - 336 + r * 22} r={5} fill="#000" opacity={0.7} />))}
        {/* flex cable from the board down to the port */}
        <path d={`M${bx + 10 * u} ${by + 40 * u}V${by + 43 * u}`} stroke="#B8661C" strokeWidth={90} opacity={0.75} />
      </svg>
      <SiScene id="c3i" width={w} height={h} u={u} tilt={0} origin={[bx, by]} sweep={sweep === undefined ? undefined : sweepAcross(sweep, 0, 0, 72, 40)}>
        <LogicBoard layout={LAYOUT} parts={parts} focus={focus} dim={dim} />
      </SiScene>
    </div>
  );
};
