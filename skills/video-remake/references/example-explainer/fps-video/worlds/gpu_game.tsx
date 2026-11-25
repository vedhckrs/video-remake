// The game picture on the S08/S09 monitor: a generic neon scene (a spaceship over a city), drawn in 1360 x 850 local px.
// One GameFrame = one rendered frame of the game: `shipX` / `scroll` differ between frames, so a torn screen shows a
// sideways offset between the bands. Pure SVG, no brand.
import React from 'react';
import {MONO} from '../../../src/kit/explainer/stage';

export const GW = 1360, GH = 850;
export type Fr = {shipX: number; shipY: number; scroll: number};
export const lerpFr = (a: Fr, b: Fr, p: number): Fr => ({shipX: a.shipX + (b.shipX - a.shipX) * p, shipY: a.shipY + (b.shipY - a.shipY) * p, scroll: a.scroll + (b.scroll - a.scroll) * p});

const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// skylines as single paths (cheap): buildings with stepped roofs and antennas
const skyline = (seed: number, x0: number, x1: number, base: number, hMin: number, hMax: number, wMin: number, wMax: number, gap0 = 6, gap1 = 16) => {
  let x = x0, d = `M${x0},${base}`;
  let i = 0;
  while (x < x1) {
    const w = wMin + rnd(seed + i * 1.9) * (wMax - wMin), h = hMin + rnd(seed + i * 4.3 + 1) * (hMax - hMin);
    const top = base - h, kind = Math.floor(rnd(seed + i * 7.7) * 4);
    d += `L${x},${top}`;
    if (kind === 0) d += `L${x + w * 0.3},${top}L${x + w * 0.3},${top - h * 0.12}L${x + w * 0.7},${top - h * 0.12}L${x + w * 0.7},${top}`;
    else if (kind === 1) d += `L${x + w * 0.46},${top}L${x + w * 0.46},${top - h * 0.3}L${x + w * 0.54},${top - h * 0.3}L${x + w * 0.54},${top}`;
    else if (kind === 2) d += `L${x + w * 0.5},${top - h * 0.1}`;
    d += `L${x + w},${top}L${x + w},${base}`;
    x += w + gap0 + rnd(seed + i * 3.1) * gap1;
    d += `L${x},${base}`;
    i++;
  }
  return d + 'Z';
};
const FAR = skyline(3, -200, 2400, 660, 110, 300, 70, 130);
const NEAR = skyline(11, -200, 3000, 850, 190, 540, 110, 180, 24, 70);
const STARS = Array.from({length: 34}).map((_, i) => [rnd(i * 2.3) * GW, rnd(i * 5.1 + 2) * 330, 1.2 + rnd(i * 9.7) * 2.2] as const);

/** shared gradients / patterns: render ONCE inside the world's <defs> */
export const GameDefs: React.FC = () => (
  <>
    <linearGradient id="gm-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0B0630" /><stop offset="0.42" stopColor="#3A1280" /><stop offset="0.68" stopColor="#C2338F" /><stop offset="0.82" stopColor="#FF7A59" />
    </linearGradient>
    <linearGradient id="gm-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF2A6" /><stop offset="0.5" stopColor="#FF9D4D" /><stop offset="1" stopColor="#FF3D9A" /></linearGradient>
    <radialGradient id="gm-sunglow"><stop offset="0" stopColor="#FF8FD0" stopOpacity="0.55" /><stop offset="1" stopColor="#FF8FD0" stopOpacity="0" /></radialGradient>
    <linearGradient id="gm-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF4FB0" stopOpacity="0" /><stop offset="1" stopColor="#FF4FB0" stopOpacity="0.5" /></linearGradient>
    <linearGradient id="gm-hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.5" stopColor="#C9D6F2" /><stop offset="1" stopColor="#5E6C96" /></linearGradient>
    <linearGradient id="gm-flame" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.25" stopColor="#7DF3FF" /><stop offset="1" stopColor="#2B8CFF" stopOpacity="0" /></linearGradient>
    <linearGradient id="gm-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B1148" /><stop offset="1" stopColor="#090520" /></linearGradient>
    <pattern id="gm-winA" width={26} height={30} patternUnits="userSpaceOnUse">
      <rect x={5} y={6} width={8} height={11} fill="#FF7AD9" opacity={0.45} />
    </pattern>
    <pattern id="gm-winB" width={62} height={74} patternUnits="userSpaceOnUse">
      <rect x={10} y={12} width={14} height={20} rx={2} fill="#5CF0FF" opacity={0.8} /><rect x={38} y={44} width={14} height={20} rx={2} fill="#FFC857" opacity={0.65} />
      <rect x={10} y={48} width={14} height={10} rx={2} fill="#FF5CC8" opacity={0.55} />
    </pattern>
  </>
);

const Ship: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x},${y})`}>
    {/* exhaust */}
    <rect x={-470} y={-9} width={330} height={18} rx={9} fill="url(#gm-flame)" opacity={0.95} />
    <rect x={-380} y={-26} width={240} height={52} rx={26} fill="url(#gm-flame)" opacity={0.3} />
    {[-58, -36, 36, 58].map((dy, i) => <rect key={i} x={-330 - i * 22} y={dy - 2} width={150 + i * 18} height={4} rx={2} fill="#9DF6FF" opacity={0.5} />)}
    {/* far wing + tail fin */}
    <path d="M-60,-8 L-150,-98 L-96,-98 L20,-18 Z" fill="#3B4470" stroke="#5CF0FF" strokeWidth={3} />
    <path d="M-110,-20 L-168,-78 L-138,-78 L-74,-22 Z" fill="#FF4FB0" />
    {/* hull */}
    <path d="M-150,-30 L40,-42 L150,-16 L188,0 L150,16 L40,42 L-150,30 L-170,0 Z" fill="url(#gm-hull)" stroke="#0B0630" strokeWidth={4} strokeLinejoin="round" />
    <path d="M-150,0 L186,0" stroke="#FF4FB0" strokeWidth={7} />
    <path d="M-150,30 L40,42 L150,16 L188,0 L-170,0 Z" fill="#141A3A" opacity={0.35} />
    {/* canopy */}
    <path d="M20,-40 L84,-52 L132,-21 L58,-20 Z" fill="#5CF0FF" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" />
    <path d="M40,-40 L76,-46 L96,-32 Z" fill="#FFFFFF" opacity={0.7} />
    {/* near wing */}
    <path d="M-70,10 L-176,104 L-104,104 L40,22 Z" fill="#E9EEFB" stroke="#0B0630" strokeWidth={4} strokeLinejoin="round" />
    <path d="M-150,92 L-118,92 L-20,36 L-48,34 Z" fill="#5CF0FF" />
    {/* engine */}
    <rect x={-186} y={-24} width={40} height={48} rx={8} fill="#1A2046" stroke="#7DF3FF" strokeWidth={4} />
    <circle cx={-170} cy={0} r={13} fill="#FFFFFF" /><circle cx={-170} cy={0} r={30} fill="#7DF3FF" opacity={0.35} />
    <circle cx={150} cy={0} r={5} fill="#FF4FB0" />
  </g>
);

/** one whole game frame (1360 x 850). HUD is screen-locked, so it never tears. */
export const GameFrame: React.FC<{fr: Fr}> = ({fr}) => (
  <g>
    <rect width={GW} height={GH} fill="url(#gm-sky)" />
    {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.5 + 0.5 * rnd(i)} />)}
    <circle cx={1010} cy={452} r={330} fill="url(#gm-sunglow)" />
    <circle cx={1010} cy={452} r={196} fill="url(#gm-sun)" />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={800} y={470 + i * 34} width={420} height={7 + i * 4} fill="#B03090" opacity={0.85} />)}
    <g transform={`translate(${-fr.scroll * 0.4},0)`}>
      <path d={FAR} fill="#3A1B7A" /><path d={FAR} fill="url(#gm-winA)" />
    </g>
    <rect y={520} width={GW} height={330} fill="url(#gm-haze)" opacity={0.6} />
    <g transform={`translate(${-fr.scroll},0)`}>
      <path d={NEAR} fill="url(#gm-near)" stroke="#5CF0FF" strokeWidth={3.5} strokeLinejoin="round" /><path d={NEAR} fill="url(#gm-winB)" />
    </g>
    <Ship x={fr.shipX} y={fr.shipY} />
    {/* game HUD */}
    <rect x={34} y={30} width={250} height={64} rx={12} fill="#0B0630" opacity={0.6} stroke="#5CF0FF" strokeWidth={2.5} />
    <text x={52} y={58} fontFamily={MONO} fontWeight={600} fontSize={20} fill="#9DF6FF" letterSpacing={3}>SHIELD</text>
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={52 + i * 36} y={68} width={28} height={12} rx={3} fill={i < 5 ? '#5CF0FF' : '#24306A'} />)}
    <rect x={GW - 284} y={30} width={250} height={64} rx={12} fill="#0B0630" opacity={0.6} stroke="#FF5CC8" strokeWidth={2.5} />
    <text x={GW - 266} y={58} fontFamily={MONO} fontWeight={600} fontSize={20} fill="#FFB3E6" letterSpacing={3}>BOOST</text>
    <rect x={GW - 266} y={68} width={214} height={12} rx={6} fill="#3A1250" /><rect x={GW - 266} y={68} width={150} height={12} rx={6} fill="#FF5CC8" />
    <text x={GW / 2} y={GH - 34} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill="#FFFFFF" opacity={0.75} letterSpacing={8}>NEON CITY · RUN</text>
  </g>
);

/** small frame card that rides the lane from the graphics card to the monitor (200 x 125, centred) */
export const FrameThumb: React.FC<{x: number; y: number; hot?: number; tag?: string; op?: number; green?: number}> = ({x, y, hot = 0, tag, op = 1, green = 0}) => (
  <g transform={`translate(${x},${y})`} opacity={op}>
    <rect x={-112} y={-74} width={224} height={148} rx={18} fill={green > 0.5 ? '#3DFFA2' : '#5CF0FF'} opacity={0.16 + 0.3 * hot} />
    <rect x={-92} y={-52} width={200} height={125} rx={12} fill="#000" opacity={0.45} />
    <svg x={-100} y={-62.5} width={200} height={125} viewBox="0 0 200 125">
      <rect width={200} height={125} fill="url(#gm-sky)" />
      <circle cx={148} cy={68} r={30} fill="url(#gm-sun)" />
      <path d="M0,125V92h16V78h22v20h14V70h18v30h20V84h24v16h16V74h20v24h18V88h32v37Z" fill="#120A36" stroke="#5CF0FF" strokeWidth={1.5} />
      <path d="M40,58 L92,52 L120,60 L92,68 L40,62 Z" fill="#FFFFFF" /><path d="M56,60 L30,82 L48,82 L84,64 Z" fill="#DDE5FA" />
      <rect x={4} y={57} width={38} height={6} rx={3} fill="#7DF3FF" opacity={0.9} />
    </svg>
    <rect x={-100} y={-62.5} width={200} height={125} rx={12} fill="none" stroke={green > 0.5 ? '#3DFFA2' : hot > 0.3 ? '#FFFFFF' : '#BFEFFF'} strokeWidth={4 + 3 * hot} />
    {tag ? (
      <g transform="translate(0,-84)">
        <rect x={-58} y={-22} width={116} height={40} rx={20} fill={green > 0.5 ? '#3DFFA2' : '#FFFFFF'} />
        <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill="#0B0630" letterSpacing={3}>{tag}</text>
      </g>
    ) : null}
  </g>
);
