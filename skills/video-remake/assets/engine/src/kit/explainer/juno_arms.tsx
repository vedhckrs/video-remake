// juno_arms.tsx - Juno's hoodie sleeves and hands (artwork only, pure functions of props).
//
// Plan
// - Sleeves: slim tapered tubes. Upper arm 38 px at the soft shoulder cap (36 just past it) tapering to
//   30 px at the elbow; forearm 29 px at the elbow tapering to 24 px before the ribbed cuff.
// - Shoulder: the outline is stroked with a fading gradient (invisible for the first ~14 px) and a radial
//   patch of flat hoodie pink covers shading around the pivot, so the cap melts into the torso shoulder.
// - Elbow: the forearm begins with an unstroked round cap centred on the elbow (reaching ~14 px into the
//   upper arm); the upper arm keeps a stroked round elbow cap. Whatever the draw order, any bend reads as
//   one continuous sleeve.
// - Hands: same construction as before, drawn inside a scale(1.25) group (wrist to fingertip ~80,
//   palm ~50), line weights compensated, wrist narrowed so it tucks into the slimmer cuff.
import React from 'react';

export type Hand =
  | 'open'
  | 'palm'
  | 'fist'
  | 'point'
  | 'thumb'
  | 'peace'
  | 'three'
  | 'four'
  | 'five'
  | 'pinch'
  | 'hold';

const L1 = 118;
const L2 = 108;
const HAND_SCALE = 1.25;

const PK = {
  base: '#FF4F9A',
  light: '#FF8FC2',
  shade: '#D42C7A',
  line: '#A01A58',
  fold: '#B92068',
};

const SK = {
  base: '#C98B62',
  light: '#E6B08A',
  shade: '#A2673F',
  line: '#75401F',
  crease: '#8A4E2B',
  nail: '#F0C6AA',
  nailLine: '#96583A',
};

const n = (v: number): number => Math.round(v * 100) / 100;

/* ------------------------------------------------------------------ */
/* Paths shared by defs and components                                 */
/* ------------------------------------------------------------------ */

const UPPER_D =
  'M0,-19 C40,-19 84,-16.5 118,-15 A15,15 0 0 1 118,15 C84,16.5 40,19 0,19 A19,19 0 0 1 0,-19 Z';
// same long edges + elbow cap; stroked with a gradient that is transparent near the shoulder
const UPPER_EDGE =
  'M0,-19 C40,-19 84,-16.5 118,-15 A15,15 0 0 1 118,15 C84,16.5 40,19 0,19';

const FORE_D =
  'M0,-14.5 C30,-14.5 60,-13 82,-12 C85,-12 87,-11.5 87,-10.5 L87,10.5 C87,11.5 85,12 82,12 C60,13 30,14.5 0,14.5 A14.5,14.5 0 0 1 0,-14.5 Z';
const FORE_EDGE_TOP = 'M0,-14.5 C30,-14.5 60,-13 82,-12 C85,-12 87,-11.5 87,-10.5';
const FORE_EDGE_BOT = 'M0,14.5 C30,14.5 60,13 82,12 C85,12 87,11.5 87,10.5';

const CUFF_D =
  'M88,-13.2 L106,-12.6 Q108.5,-12.6 108.5,-10.4 L108.5,10.4 Q108.5,12.6 106,12.6 L88,13.2 Q86,13.2 86,11 L86,-11 Q86,-13.2 88,-13.2 Z';

const PALM_D =
  'M-3,-10 C1,-12.5 6,-23 14,-24 C20,-24.5 26,-22 31,-18.6 L33.5,-9.5 L34.5,0 L33.5,9.8 L30.5,18.3 C22,20.6 11,19.8 5,16.5 C1.5,14.5 0,11 -3,10 Z';
const PALM_EDGE =
  'M-3,-10 C1,-12.5 6,-23 14,-24 C20,-24.5 26,-22 31,-18.6 L33.5,-9.5 L34.5,0 L33.5,9.8 L30.5,18.3 C22,20.6 11,19.8 5,16.5 C1.5,14.5 0,11 -3,10';

/* ------------------------------------------------------------------ */
/* Defs                                                                */
/* ------------------------------------------------------------------ */

export const DefsArms: React.FC = () => (
  <defs>
    <linearGradient id="juno-arm-sleeve" gradientUnits="userSpaceOnUse" x1={0} y1={-20} x2={0} y2={20}>
      <stop offset="0" stopColor="#FF6CAB" />
      <stop offset="0.45" stopColor={PK.base} />
      <stop offset="1" stopColor="#EC3F8C" />
    </linearGradient>
    {/* flat hoodie pink around the shoulder pivot, fading out along the arm */}
    <radialGradient id="juno-arm-shoulder-blend" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={36}>
      <stop offset="0" stopColor={PK.base} stopOpacity={1} />
      <stop offset="0.42" stopColor={PK.base} stopOpacity={1} />
      <stop offset="1" stopColor={PK.base} stopOpacity={0} />
    </radialGradient>
    {/* outline that is invisible near the shoulder and fades in along the arm */}
    <linearGradient id="juno-arm-line-fade" gradientUnits="userSpaceOnUse" x1={12} y1={0} x2={28} y2={0}>
      <stop offset="0" stopColor={PK.line} stopOpacity={0} />
      <stop offset="1" stopColor={PK.line} stopOpacity={1} />
    </linearGradient>
    <linearGradient id="juno-arm-fold-fade" gradientUnits="userSpaceOnUse" x1={14} y1={0} x2={30} y2={0}>
      <stop offset="0" stopColor={PK.fold} stopOpacity={0} />
      <stop offset="1" stopColor={PK.fold} stopOpacity={1} />
    </linearGradient>
    <linearGradient id="juno-arm-cuff" gradientUnits="userSpaceOnUse" x1={0} y1={-13.5} x2={0} y2={13.5}>
      <stop offset="0" stopColor="#FF66A8" />
      <stop offset="0.5" stopColor="#F4438F" />
      <stop offset="1" stopColor="#D8317E" />
    </linearGradient>
    <radialGradient id="juno-arm-skin-palm" gradientUnits="userSpaceOnUse" cx={15} cy={-4} r={32}>
      <stop offset="0" stopColor="#E3AB85" />
      <stop offset="0.65" stopColor={SK.base} />
      <stop offset="1" stopColor="#B87952" />
    </radialGradient>
    <linearGradient id="juno-arm-skin-finger" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#DCA27B" />
      <stop offset="0.55" stopColor={SK.base} />
      <stop offset="1" stopColor="#BA7B54" />
    </linearGradient>
    <linearGradient id="juno-arm-nail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F8D6BF" />
      <stop offset="1" stopColor="#E3B093" />
    </linearGradient>
    <clipPath id="juno-arm-clip-upper">
      <path d={UPPER_D} />
    </clipPath>
    <clipPath id="juno-arm-clip-fore">
      <path d={FORE_D} />
    </clipPath>
    <clipPath id="juno-arm-clip-cuff">
      <path d={CUFF_D} />
    </clipPath>
    <clipPath id="juno-arm-clip-palm">
      <path d={PALM_D} />
    </clipPath>
  </defs>
);

/* ------------------------------------------------------------------ */
/* Sleeves                                                             */
/* ------------------------------------------------------------------ */

const foldProps = {
  fill: 'none',
  stroke: PK.fold,
  strokeWidth: 1.3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  opacity: 0.7,
};

export const UpperArm: React.FC<{side: 'L' | 'R'}> = ({side}) => (
  <g transform={side === 'L' ? 'scale(1,-1)' : undefined}>
    <path d={UPPER_D} fill="url(#juno-arm-sleeve)" />
    <g clipPath="url(#juno-arm-clip-upper)">
      {/* shadow shape on the body side */}
      <path
        d="M-30,9 C10,12 60,7.5 96,9 C112,10 126,6 140,2 L140,30 L-30,30 Z"
        fill={PK.shade}
        opacity={0.45}
      />
      {/* inside-elbow fold wedge */}
      <path d="M98,-16.5 C104,-8 104,3 97,10 C101,2 101,-8 98,-16.5 Z" fill={PK.shade} opacity={0.5} />
      {/* highlight shape */}
      <path
        d="M26,-16 C50,-16.4 84,-14.2 108,-12.6 C84,-12.2 50,-12.8 26,-16 Z"
        fill={PK.light}
        opacity={0.7}
      />
      <ellipse cx={L1 - 2} cy={-6} rx={8} ry={4.5} fill={PK.light} opacity={0.22} />
      {/* shoulder blend: flat body pink over all shading near the pivot */}
      <circle cx={0} cy={0} r={36} fill="url(#juno-arm-shoulder-blend)" />
    </g>
    {/* fold lines: one at the elbow inside, one soft drape at the shoulder */}
    <path d="M98,-16 C103.5,-8 103.5,2 98,9" {...foldProps} />
    <path
      d="M20,18.5 C27,12 31,5 30.5,-2"
      fill="none"
      stroke="url(#juno-arm-fold-fade)"
      strokeWidth={1.3}
      strokeLinecap="round"
      opacity={0.55}
    />
    {/* outline: fades in after the shoulder, runs round the elbow cap */}
    <path
      d={UPPER_EDGE}
      fill="none"
      stroke="url(#juno-arm-line-fade)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

const CUFF_RIBS: number[] = [89.5, 92.6, 95.7, 98.8, 101.9, 105];

export const Forearm: React.FC<{side: 'L' | 'R'}> = ({side}) => (
  <g transform={side === 'L' ? 'scale(1,-1)' : undefined}>
    {/* rounded, unstroked elbow cap reaches ~14 px back into the upper arm */}
    <path d={FORE_D} fill="url(#juno-arm-sleeve)" />
    <g clipPath="url(#juno-arm-clip-fore)">
      <path d="M-20,7 C16,9.5 58,7 90,5 L90,22 L-20,22 Z" fill={PK.shade} opacity={0.45} />
      {/* elbow fold wedge */}
      <path d="M9,-15 C15,-7 15,2 9,9 C12,2 12,-7 9,-15 Z" fill={PK.shade} opacity={0.45} />
      {/* fabric gathering above the cuff */}
      <path d="M87,-11.5 C81,-8 80,-4 83,0 C83,-5 84.5,-8.5 87,-11.5 Z" fill={PK.shade} opacity={0.4} />
      <path d="M87,2 C82,4 81,7 82.5,10 C84,7 85,4.5 87,2 Z" fill={PK.shade} opacity={0.35} />
      {/* highlight */}
      <path
        d="M18,-11.5 C40,-12.4 62,-11.2 78,-9.6 C62,-8.6 40,-9 18,-11.5 Z"
        fill={PK.light}
        opacity={0.7}
      />
      <ellipse cx={2} cy={-6} rx={8} ry={4.5} fill={PK.light} opacity={0.2} />
    </g>
    <path d="M10,-14 C15,-7 15,1 10,8" {...foldProps} />
    <path d="M79,-12 C76,-8.5 76,-5 78,-2" {...foldProps} opacity={0.55} />
    <path d="M80,12 C76.5,8.5 76.5,5 79,2.5" {...foldProps} opacity={0.55} />
    <path
      d={FORE_EDGE_TOP}
      fill="none"
      stroke={PK.line}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d={FORE_EDGE_BOT}
      fill="none"
      stroke={PK.line}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* ribbed cuff ending at the wrist (x = L2) */}
    <path d={CUFF_D} fill="url(#juno-arm-cuff)" />
    <g clipPath="url(#juno-arm-clip-cuff)">
      <rect x={84} y={4.5} width={27} height={12} fill={PK.shade} opacity={0.45} />
      <rect x={84} y={-10.8} width={27} height={2.6} fill={PK.light} opacity={0.55} />
      {CUFF_RIBS.map((x) => (
        <path
          key={x}
          d={`M${x},-12.6 Q${n(x + 0.9)},0 ${x},12.6`}
          fill="none"
          stroke={PK.fold}
          strokeWidth={1.1}
          opacity={0.55}
        />
      ))}
    </g>
    <path d={CUFF_D} fill="none" stroke={PK.line} strokeWidth={1.8} strokeLinejoin="round" />
    {/* small shadow the cuff throws toward the hand */}
    <path
      d={`M${L2 + 0.6},-9.5 L${L2 + 0.6},9.5`}
      stroke={PK.line}
      strokeWidth={1}
      opacity={0.35}
      strokeLinecap="round"
    />
  </g>
);

/* ------------------------------------------------------------------ */
/* Hand building blocks (drawn in the unscaled design frame; HandArt   */
/* wraps everything in scale(1.25), stroke widths are compensated)     */
/* ------------------------------------------------------------------ */

const skinLine = {
  fill: 'none',
  stroke: SK.line,
  strokeWidth: 1.45,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const creaseLine = {
  fill: 'none',
  stroke: SK.crease,
  strokeWidth: 0.85,
  strokeLinecap: 'round' as const,
  opacity: 0.6,
};

/** tapered capsule along +x, open at the base (x0), rounded tip at x = len */
const capsule = (len: number, h: number, x0: number): string => {
  const tr = h * 0.86;
  const m = Math.max(len * 0.45, x0 + 0.5);
  return (
    `M${n(x0)},${n(-h)} L${n(m)},${n(-h * 0.96)} L${n(len - tr)},${n(-tr)} ` +
    `A${n(tr)},${n(tr)} 0 0 1 ${n(len - tr)},${n(tr)} L${n(m)},${n(h * 0.96)} L${n(x0)},${n(h)}`
  );
};

/** cel-shadow strip along the +y side of a capsule */
const shadeStrip = (len: number, h: number, x0: number): string => {
  const tr = h * 0.86;
  const cx = len - tr;
  const m = Math.max(len * 0.45, x0 + 0.5);
  return (
    `M${n(x0)},${n(h)} L${n(m)},${n(h * 0.96)} L${n(cx)},${n(tr)} ` +
    `A${n(tr)},${n(tr)} 0 0 0 ${n(cx + tr * 0.82)},${n(tr * 0.57)} ` +
    `Q${n(cx)},${n(tr * 0.3)} ${n(m)},${n(h * 0.42)} L${n(x0)},${n(h * 0.42)} Z`
  );
};

const creaseArc = (x: number, h: number, bow: number): string =>
  `M${n(x)},${n(-h * 0.72)} Q${n(x + bow)},0 ${n(x)},${n(h * 0.72)}`;

type FingerDef = {bx: number; by: number; len: number; w: number; cx0: number; cx1: number};

// index, middle, ring, pinky
const FINGERS: [FingerDef, FingerDef, FingerDef, FingerDef] = [
  {bx: 31, by: -13.5, len: 30, w: 9.6, cx0: 19, cx1: 43},
  {bx: 33.5, by: -4.3, len: 31.5, w: 10, cx0: 19, cx1: 46},
  {bx: 33, by: 5, len: 30, w: 9.6, cx0: 19, cx1: 44.5},
  {bx: 30.5, by: 14, len: 24, w: 8.4, cx0: 19.5, cx1: 40.5},
];

const ExtFinger: React.FC<{d: FingerDef; a: number; s: number}> = ({d, a, s}) => {
  const len = d.len * s;
  const h = d.w / 2;
  const tr = h * 0.86;
  return (
    <g transform={`translate(${d.bx},${d.by}) rotate(${a})`}>
      <path d={capsule(len, h, -5)} fill="url(#juno-arm-skin-finger)" />
      <path d={shadeStrip(len, h, -4)} fill={SK.shade} opacity={0.32} />
      {/* fingertip pad highlight */}
      <ellipse cx={n(len - tr - 1.5)} cy={n(-h * 0.18)} rx={n(tr * 0.85)} ry={n(tr * 0.5)} fill={SK.light} opacity={0.45} />
      <ellipse cx={n(len * 0.2)} cy={n(-h * 0.25)} rx={n(len * 0.12)} ry={n(h * 0.35)} fill={SK.light} opacity={0.25} />
      {/* phalanx creases: base, PIP (double), DIP */}
      <path d={creaseArc(1, h, 1.6)} {...creaseLine} />
      <path d={creaseArc(len * 0.36, h, 1.4)} {...creaseLine} />
      <path d={creaseArc(len * 0.36 + 1.8, h * 0.8, 1.2)} {...creaseLine} opacity={0.4} />
      <path d={creaseArc(len * 0.68, h * 0.92, 1.2)} {...creaseLine} />
      <path d={capsule(len, h, -1)} {...skinLine} />
    </g>
  );
};

const BentFinger: React.FC<{d: FingerDef; a1: number; l1: number; a2: number; l2: number}> = ({d, a1, l1, a2, l2}) => {
  const h = d.w / 2;
  const tr = h * 0.86;
  const h2 = h * 0.86;
  const tr2 = h2 * 0.86;
  const pl = l1 + tr; // proximal capsule: tip circle centred on the joint
  return (
    <g transform={`translate(${d.bx},${d.by}) rotate(${a1})`}>
      <path d={capsule(pl, h, -5)} fill="url(#juno-arm-skin-finger)" />
      <path d={shadeStrip(pl, h, -4)} fill={SK.shade} opacity={0.32} />
      <path d={creaseArc(1, h, 1.6)} {...creaseLine} />
      <path d={creaseArc(l1 * 0.55, h, 1.4)} {...creaseLine} opacity={0.45} />
      <path d={capsule(pl, h, -1)} {...skinLine} />
      <g transform={`translate(${n(l1)},0) rotate(${a2 - a1})`}>
        <path d={capsule(l2, h2, 0)} fill="url(#juno-arm-skin-finger)" />
        <path d={shadeStrip(l2, h2, 0.5)} fill={SK.shade} opacity={0.3} />
        <ellipse cx={n(l2 - tr2 - 1)} cy={n(-h2 * 0.15)} rx={n(tr2 * 0.8)} ry={n(tr2 * 0.5)} fill={SK.light} opacity={0.45} />
        <path d={creaseArc(l2 * 0.42, h2 * 0.9, 1.2)} {...creaseLine} />
        <path d={capsule(l2, h2, 0.4)} {...skinLine} />
      </g>
    </g>
  );
};

/** finger folded onto the palm: middle phalanx with knuckle at x1, fingertip and nail at x0 */
const CurlFinger: React.FC<{d: FingerDef}> = ({d}) => {
  const h = d.w / 2;
  const x0 = d.cx0;
  const x1 = d.cx1;
  const body =
    `M${n(x0 + h)},${n(-h)} L${n(x1 - h)},${n(-h)} A${n(h)},${n(h)} 0 0 1 ${n(x1 - h)},${n(h)} ` +
    `L${n(x0 + h)},${n(h)} A${n(h)},${n(h)} 0 0 1 ${n(x0 + h)},${n(-h)} Z`;
  const shade =
    `M${n(x0 + h)},${n(h)} L${n(x1 - h)},${n(h)} A${n(h)},${n(h)} 0 0 0 ${n(x1 - h + h * 0.917)},${n(h * 0.4)} ` +
    `L${n(x0 + h * 0.083)},${n(h * 0.4)} A${n(h)},${n(h)} 0 0 0 ${n(x0 + h)},${n(h)} Z`;
  const xc = x0 + (x1 - x0) * 0.48;
  const na = x0 + 1.5;
  const nb = x0 + (x1 - x0) * 0.34;
  const nh = h * 0.62;
  const nail =
    `M${n(na + nh * 0.9)},${n(-nh)} L${n(nb)},${n(-nh * 0.92)} Q${n(nb + 1.3)},0 ${n(nb)},${n(nh * 0.92)} ` +
    `L${n(na + nh * 0.9)},${n(nh)} Q${n(na)},${n(nh)} ${n(na)},0 Q${n(na)},${n(-nh)} ${n(na + nh * 0.9)},${n(-nh)} Z`;
  return (
    <g transform={`translate(0,${d.by})`}>
      <path d={body} fill="url(#juno-arm-skin-finger)" />
      <path d={shade} fill={SK.shade} opacity={0.34} />
      <ellipse cx={n(x1 - h - 0.5)} cy={n(-h * 0.25)} rx={n(h * 0.6)} ry={n(h * 0.42)} fill={SK.light} opacity={0.5} />
      <path d={body} {...skinLine} />
      {/* DIP crease and knuckle wrinkle */}
      <path d={`M${n(xc)},${n(-h * 0.8)} Q${n(xc - 1.6)},0 ${n(xc)},${n(h * 0.8)}`} {...creaseLine} />
      <path d={`M${n(x1 - h * 1.1)},${n(-h * 0.5)} Q${n(x1 - h * 0.55)},0 ${n(x1 - h * 1.1)},${n(h * 0.5)}`} {...creaseLine} opacity={0.4} />
      {/* nail */}
      <path d={nail} fill="url(#juno-arm-nail)" stroke={SK.nailLine} strokeWidth={0.7} strokeLinejoin="round" />
      <path
        d={`M${n(na + nh * 0.8)},${n(-nh * 0.45)} L${n(nb - 1)},${n(-nh * 0.42)}`}
        stroke="#FFFFFF"
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.55}
      />
    </g>
  );
};

type ThumbPose = {bx: number; by: number; a: number; len: number; nail: 'side' | 'full'};

const THUMB_W = 11.5;

const Thumb: React.FC<{t: ThumbPose}> = ({t}) => {
  const h = THUMB_W / 2;
  const hb = h * 1.2;
  const tr = h * 0.9;
  const len = t.len;
  const cx = len - tr;
  const top = `C${n(len * 0.25)},${n(-hb)} ${n(len * 0.3)},${n(-h)} ${n(len * 0.5)},${n(-h)} L${n(cx)},${n(-tr)}`;
  const tip = `A${n(tr)},${n(tr)} 0 0 1 ${n(cx)},${n(tr)}`;
  const bot = `L${n(len * 0.5)},${n(h)} C${n(len * 0.3)},${n(h)} ${n(len * 0.25)},${n(hb)} 0,${n(hb)}`;
  const fillD = `M-4,${n(-hb)} L0,${n(-hb)} ${top} ${tip} ${bot} L-4,${n(hb)} Z`;
  const edgeD = `M-4,${n(-hb)} L0,${n(-hb)} ${top} ${tip} ${bot}`;
  const shade =
    `M2,${n(hb)} C${n(len * 0.25)},${n(hb)} ${n(len * 0.3)},${n(h)} ${n(len * 0.5)},${n(h)} L${n(cx)},${n(tr)} ` +
    `A${n(tr)},${n(tr)} 0 0 0 ${n(cx + tr * 0.82)},${n(tr * 0.57)} Q${n(cx)},${n(tr * 0.3)} ${n(len * 0.5)},${n(h * 0.42)} ` +
    `L2,${n(hb * 0.45)} Z`;
  // side nail: sliver on the outer (-y) edge near the tip
  const sideNail =
    `M${n(len - tr * 1.75)},${n(-tr * 1.02)} L${n(cx)},${n(-tr)} A${n(tr)},${n(tr)} 0 0 1 ${n(cx + tr * 0.866)},${n(-tr * 0.5)} ` +
    `Q${n(cx)},${n(-tr * 0.42)} ${n(len - tr * 1.75)},${n(-tr * 0.6)} Z`;
  // full nail: seen from the back of the thumb
  const fa = len - tr * 2.0;
  const fb = len - 1.3;
  const fh = tr * 0.66;
  const fullNail =
    `M${n(fa)},${n(-fh * 0.9)} L${n(fb - fh * 0.9)},${n(-fh)} Q${n(fb)},${n(-fh)} ${n(fb)},0 ` +
    `Q${n(fb)},${n(fh)} ${n(fb - fh * 0.9)},${n(fh)} L${n(fa)},${n(fh * 0.9)} Q${n(fa - 1.3)},0 ${n(fa)},${n(-fh * 0.9)} Z`;
  return (
    <g transform={`translate(${t.bx},${t.by}) rotate(${t.a})`}>
      <path d={fillD} fill="url(#juno-arm-skin-finger)" />
      <path d={shade} fill={SK.shade} opacity={0.32} />
      <ellipse cx={n(len * 0.24)} cy={n(-h * 0.2)} rx={n(len * 0.17)} ry={n(h * 0.5)} fill={SK.light} opacity={0.35} />
      {t.nail === 'side' ? (
        <ellipse cx={n(cx - 1)} cy={n(h * 0.05)} rx={n(tr * 0.8)} ry={n(tr * 0.5)} fill={SK.light} opacity={0.4} />
      ) : null}
      {/* joint creases */}
      <path d={creaseArc(len * 0.52, h * 0.95, 1.4)} {...creaseLine} />
      <path d={creaseArc(len * 0.52 + 1.8, h * 0.7, 1.1)} {...creaseLine} opacity={0.38} />
      <path d={edgeD} {...skinLine} />
      {t.nail === 'side' ? (
        <path d={sideNail} fill="url(#juno-arm-nail)" stroke={SK.nailLine} strokeWidth={0.7} strokeLinejoin="round" />
      ) : (
        <g>
          <path d={fullNail} fill="url(#juno-arm-nail)" stroke={SK.nailLine} strokeWidth={0.7} strokeLinejoin="round" />
          <path
            d={`M${n(fa + 1.5)},${n(-fh * 0.45)} L${n(fb - fh)},${n(-fh * 0.48)}`}
            stroke="#FFFFFF"
            strokeWidth={0.8}
            strokeLinecap="round"
            opacity={0.55}
          />
        </g>
      )}
    </g>
  );
};

const Palm: React.FC<{creases: boolean}> = ({creases}) => (
  <g>
    <path d={PALM_D} fill="url(#juno-arm-skin-palm)" />
    <g clipPath="url(#juno-arm-clip-palm)">
      {/* shadow shape: little-finger edge and heel */}
      <path
        d="M-5,6 C8,12.5 20,13.5 32,11.5 L33,22 L-5,22 Z"
        fill={SK.shade}
        opacity={0.32}
      />
      {/* shadow under the knuckle pads */}
      <path d="M29,-19 C26.5,-8 27,6 29,18 L36,18 L36,-19 Z" fill={SK.shade} opacity={0.16} />
      {/* thenar mound highlight */}
      <ellipse cx={11} cy={-12} rx={8.5} ry={5.5} transform="rotate(-38 11 -12)" fill={SK.light} opacity={0.5} />
      {/* wrist shadow from the cuff */}
      <rect x={-5} y={-14} width={4.5} height={28} fill={SK.shade} opacity={0.3} />
    </g>
    {creases ? (
      <g>
        {/* life line around the thenar, head line, heart line */}
        <path d="M26,-18 C20,-10 12,-4 3.5,-2.5" {...creaseLine} strokeWidth={0.95} />
        <path d="M26,-18 C22.5,-8 20.5,3 19.5,11.5" {...creaseLine} opacity={0.45} />
        <path d="M29.5,14.5 C26.5,7 26.5,-2 28.5,-9.5" {...creaseLine} opacity={0.5} />
      </g>
    ) : null}
    {/* wrist creases */}
    <path d="M1.2,-7.5 Q2.8,0 1.2,8" {...creaseLine} opacity={0.5} />
    <path d="M3.8,-5 Q4.8,1 3.8,6.5" {...creaseLine} opacity={0.3} />
    <path d={PALM_EDGE} {...skinLine} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Poses                                                               */
/* ------------------------------------------------------------------ */

type FingerPose =
  | {k: 'ext'; a: number; s?: number}
  | {k: 'curl'}
  | {k: 'bent'; a1: number; l1: number; a2: number; l2: number};

type Pose = {
  f: [FingerPose, FingerPose, FingerPose, FingerPose];
  t: ThumbPose;
  thumbBehind?: boolean;
};

const CURL: FingerPose = {k: 'curl'};

const POSES: Record<Hand, Pose> = {
  open: {
    f: [
      {k: 'ext', a: -9},
      {k: 'ext', a: -2},
      {k: 'ext', a: 5},
      {k: 'ext', a: 13},
    ],
    t: {bx: 15, by: -17, a: -48, len: 29, nail: 'side'},
  },
  palm: {
    f: [
      {k: 'ext', a: -1.5},
      {k: 'ext', a: 0},
      {k: 'ext', a: 1.5},
      {k: 'ext', a: 3.5},
    ],
    t: {bx: 15, by: -17, a: -24, len: 29, nail: 'side'},
  },
  five: {
    f: [
      {k: 'ext', a: -16},
      {k: 'ext', a: -5},
      {k: 'ext', a: 6},
      {k: 'ext', a: 18},
    ],
    t: {bx: 14, by: -17, a: -64, len: 30, nail: 'side'},
  },
  four: {
    f: [
      {k: 'ext', a: -12},
      {k: 'ext', a: -4},
      {k: 'ext', a: 5},
      {k: 'ext', a: 14},
    ],
    t: {bx: 12, by: -12, a: 28, len: 22, nail: 'full'},
  },
  three: {
    f: [{k: 'ext', a: -10}, {k: 'ext', a: 0}, {k: 'ext', a: 10}, CURL],
    t: {bx: 12, by: -12, a: 50, len: 29, nail: 'full'},
  },
  peace: {
    f: [{k: 'ext', a: -11}, {k: 'ext', a: 5}, CURL, CURL],
    t: {bx: 12, by: -12, a: 36, len: 28, nail: 'full'},
  },
  point: {
    // index fully extended straight along +x, the other three curled, thumb folded across them
    f: [{k: 'ext', a: 0, s: 1.1}, CURL, CURL, CURL],
    t: {bx: 12, by: -12, a: 24, len: 28, nail: 'full'},
  },
  fist: {
    f: [CURL, CURL, CURL, CURL],
    t: {bx: 12, by: -13, a: 18, len: 30, nail: 'full'},
  },
  thumb: {
    // thumbs-up: thumb straight along -y, four fingers curled into a fist
    f: [CURL, CURL, CURL, CURL],
    t: {bx: 15, by: -15, a: -90, len: 35, nail: 'side'},
  },
  pinch: {
    f: [
      {k: 'bent', a1: 12, l1: 17, a2: -75, l2: 12},
      {k: 'ext', a: 7, s: 0.9},
      {k: 'ext', a: 15, s: 0.9},
      {k: 'ext', a: 25, s: 0.9},
    ],
    t: {bx: 15, by: -17, a: -19, len: 33, nail: 'side'},
  },
  hold: {
    f: [
      {k: 'bent', a1: -10, l1: 16, a2: -42, l2: 13},
      {k: 'bent', a1: -3, l1: 17, a2: -36, l2: 13.5},
      {k: 'bent', a1: 5, l1: 16, a2: -30, l2: 13},
      {k: 'bent', a1: 13, l1: 13, a2: -22, l2: 11},
    ],
    t: {bx: 14, by: -16, a: -72, len: 26, nail: 'side'},
    thumbBehind: true,
  },
};

const ORDER: number[] = [3, 2, 1, 0]; // pinky first, index on top

/* ------------------------------------------------------------------ */
/* HandArt                                                             */
/* ------------------------------------------------------------------ */

export const HandArt: React.FC<{shape: Hand; prop?: React.ReactNode}> = ({shape, prop}) => {
  const pose = POSES[shape];
  const anyCurl = pose.f.some((p) => p.k === 'curl');
  const sc = `scale(${HAND_SCALE})`;

  const straight = ORDER.map((i) => {
    const p = pose.f[i];
    const d = FINGERS[i];
    if (p.k === 'ext') {
      return <ExtFinger key={`e${i}`} d={d} a={p.a} s={p.s === undefined ? 1 : p.s} />;
    }
    if (p.k === 'bent') {
      return <BentFinger key={`b${i}`} d={d} a1={p.a1} l1={p.l1} a2={p.a2} l2={p.l2} />;
    }
    return null;
  });

  const curled = ORDER.map((i) => {
    const p = pose.f[i];
    if (p.k !== 'curl') {
      return null;
    }
    return <CurlFinger key={`c${i}`} d={FINGERS[i]} />;
  });

  // the prop keeps its contract position and size (not scaled with the hand)
  const propNode =
    shape === 'hold' && prop !== undefined && prop !== null ? (
      <g transform="translate(30,-46)">{prop}</g>
    ) : null;

  return (
    <g>
      {pose.thumbBehind ? (
        <g transform={sc}>
          <Thumb t={pose.t} />
        </g>
      ) : null}
      {propNode}
      <g transform={sc}>
        <Palm creases={!anyCurl} />
        {anyCurl ? (
          /* soft shadow the folded fingers cast on the palm */
          <path
            d="M17,-19 C14,-8 14,8 17.5,18 L24,18 L24,-19 Z"
            fill={SK.shade}
            opacity={0.3}
            clipPath="url(#juno-arm-clip-palm)"
          />
        ) : null}
        {straight}
        {curled}
        {pose.thumbBehind ? null : <Thumb t={pose.t} />}
      </g>
    </g>
  );
};
