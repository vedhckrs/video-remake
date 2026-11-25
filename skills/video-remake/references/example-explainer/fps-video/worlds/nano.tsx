// S04 - ONE continuous dive: phone screen -> display stack (cut-away) -> pixel grid with the scan line -> one pixel
// (R G B subpixels) -> that pixel's circuit (two thin-film transistors + the storage capacitor).
// Engine: src/kit/explainer/nano.tsx (NanoZoom). The whole dive is ONE picture, `Scene(t, s)`, that depends only on the
// time and on the magnification s (1 = the phone screen fills the frame). Every NanoZoom level draws that same picture
// pre-scaled by its own factor, so each hand-off is a cross-fade between two identical images (seamless by construction).
// All portals are the level centre (0,0): the camera never pans, the zoom is the only camera move.
import React from 'react';
import type {SceneProps} from '../../../src/kit/types';
import {NanoZoom, type NanoKey, type NanoLevel, type NanoLevelProps} from '../../../src/kit/explainer/nano';
import {Burst, Ripple, type Beat} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';

// ---- maths ---------------------------------------------------------------------------------------------------------
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const h2 = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const ss = (x: number, a: number, b: number) => {
  const q = clamp01((x - a) / (b - a));
  return q * q * (3 - 2 * q);
};
/** smooth 0..1 as a magnification goes from a to b (log space) - level-of-detail fades */
const ramp = (s: number, a: number, b: number) => ss(Math.log(s), Math.log(a), Math.log(b));
const decayAt = (t: number, a: number, d = 7) => (t >= a ? Math.exp(-(t - a) / d) : 0);
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const wt = (beats: Beat[], word: string, n: number, d: number) => beats.filter((b) => clean(b.word || b.w) === word)[n]?.t ?? d;

// ---- the nesting: how many px of each level one phone-screen px is ---------------------------------------------------
const F1 = 8, F2 = 4, F3 = 7.5, F4 = 5.4;                 // screen -> stack -> grid -> pixel -> circuit
const MAG = [1, F1, F1 * F2, F1 * F2 * F3, F1 * F2 * F3 * F4];
const DEPTH = MAG.map((m) => Math.log10(m));
const P = 120, CU = 900;                                  // pixel pitch in grid px; the same pixel in "cell units" (= pixel-level px)

// ---- the dive: depth (log10 magnification) over design frames --------------------------------------------------------
const KNOTS: [number, number][] = [[-200, 0], [9, 0], [22, 0.72], [35, 1.08], [46, DEPTH[2]], [100, DEPTH[2] + 0.1], [123, DEPTH[3]], [131, DEPTH[3] + 0.12],
  [144, DEPTH[4] + 0.1], [200, DEPTH[4] + 0.125], [222, DEPTH[4] + 0.03], [2000, DEPTH[4] + 0.03]];
const rawDepth = (t: number) => {
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const [ta, da] = KNOTS[i], [tb, db] = KNOTS[i + 1];
    if (t <= tb) return da + (db - da) * clamp01((t - ta) / (tb - ta));
  }
  return KNOTS[KNOTS.length - 1][1];
};
/** piecewise-linear dive smoothed with a wide Hann window: speed and acceleration are continuous, no stops at the levels */
const SMOOTH_R = 8;
const smoothDepth = (t: number) => {
  let sum = 0, wsum = 0;
  const N = 24;
  for (let k = -N; k <= N; k++) {
    const w = 0.5 + 0.5 * Math.cos((Math.PI * k) / N);
    sum += w * rawDepth(t + (SMOOTH_R * k) / N);
    wsum += w;
  }
  return sum / wsum;
};
const KEYS: NanoKey[] = Array.from({length: 4 * 250 + 1}, (_, i) => ({t: i / 4, depth: smoothDepth(i / 4)}));

// ---- the refresh: the scan line sweeps the pixel grid top to bottom, again and again ---------------------------------
const SWEEPS = [38, 68, 98, 137, 183], SW_DUR = 30, SW_Y0 = -1000, SW_Y1 = 1000;
const scanY = (t: number) => {
  for (const T of SWEEPS) if (t >= T && t < T + SW_DUR) return lerp(SW_Y0, SW_Y1, (t - T) / SW_DUR);
  return null;
};
/** when sweep T writes row r (its gate line sits 52 px under the row centre) */
const rowTime = (T: number, r: number) => T + ((r * P + 52 - SW_Y0) / (SW_Y1 - SW_Y0)) * SW_DUR;
const frameOf = (r: number, t: number) => SWEEPS.filter((T) => t >= rowTime(T, r)).length;
const rowEnv = (r: number, t: number) => {
  let v = 0;
  for (const T of SWEEPS) {
    const q = clamp01(1 - Math.abs(t - rowTime(T, r)) / (T > 130 ? 4.5 : 2.2));
    v = Math.max(v, q * q * (3 - 2 * q));
  }
  return v;
};
const LATCH = SWEEPS.map((T) => rowTime(T, 0));            // the hero pixel's row: 53.8, 83.8, 113.8, 152.8, 198.8
/** brightness 0..1 of one subpixel in picture number n (a slow colour wave, so every refresh visibly changes the rows) */
const BGC = [[1, 0.42, 0.78], [0.3, 0.82, 1]];
const subVal = (c: number, r: number, n: number, ch: number) => {
  const bg = BGC[n % 2][ch] * (0.72 + 0.28 * Math.sin(0.45 * c + 0.3 * r + n));
  const d = Math.hypot(c - (-2.6 + 1.7 * n), r - (3.2 - 1.5 * n));   // a white ball that steps once per picture
  const ball = 1 - ss(d, 1.5, 2.5);
  return clamp01(0.2 + 0.8 * (bg * (1 - ball) + ball));
};
/** the storage capacitor's charge: written at the latch before "hold", sags a little, topped up at the next refresh */
const chargeAt = (t: number) => {
  const q0 = lerp(0.14, 1, ss(t, LATCH[3] - 1, LATCH[3] + 4.5));
  const sag = 0.17 * clamp01((t - 163) / (LATCH[4] - 163)) * (1 - ss(t, LATCH[4] - 0.5, LATCH[4] + 3));
  return q0 - sag;
};

// ---- stage -------------------------------------------------------------------------------------------------------------
const BX = 1500, BY = 2600;
const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={2 * BX} height={2 * BY} viewBox={`${-BX} ${-BY} ${2 * BX} ${2 * BY}`}
       style={{position: 'absolute', left: -BX, top: -BY, display: 'block', overflow: 'visible'}}>
    {children}
  </svg>
);
const SUBS = [
  {id: 'r', x: -270, c: '#FF4257', hot: '#FFE1DA', deep: '#7A0A1C'},
  {id: 'g', x: 0, c: '#35F07A', hot: '#E6FFEC', deep: '#06702C'},
  {id: 'b', x: 270, c: '#4A86FF', hot: '#E0EAFF', deep: '#0B2A8C'},
];
const RR: React.FC<{w: number; h: number; r: number} & React.SVGProps<SVGRectElement>> = ({w, h, r, ...rest}) => <rect x={-w} y={-h} width={2 * w} height={2 * h} rx={r} {...rest} />;

/** one pixel in cell units (900 x 900, centred): substrate, copper data lines, the gold scan line, three emitters */
const CellBase: React.FC<{lod: number}> = ({lod}) => (
  <g>
    <rect x={-450} y={-450} width={900} height={900} fill="#050A1C" />
    {SUBS.map((sb) => <ellipse key={sb.id} cx={sb.x} cy={-30} rx={170} ry={400} fill={`url(#n4-halo-${sb.id})`} />)}
    {[-405, -135, 135].map((x) => <rect key={x} x={x - 9} y={-450} width={18} height={900} fill="url(#n4-cuV)" />)}
    <rect x={398} y={-450} width={14} height={900} fill="#4E6FB0" />
    <rect x={-450} y={372} width={900} height={36} fill="url(#n4-goldH)" />
    <rect x={-450} y={372} width={900} height={5} fill="#FFF3B8" opacity={0.8} />
    {lod > 0.01 ? (
      <g opacity={lod}>
        {SUBS.map((sb) => (
          <g key={sb.id}>
            <rect x={sb.x - 127} y={316} width={40} height={12} fill="url(#n4-cuH)" />
            <rect x={sb.x - 96} y={298} width={74} height={48} rx={9} fill="#1FB8A8" opacity={0.75} stroke="#8FFFEA" strokeWidth={2} />
            <rect x={sb.x - 68} y={292} width={18} height={84} fill="url(#n4-gold)" />
            <rect x={sb.x - 30} y={292} width={14} height={30} fill="url(#n4-gold)" />
            <rect x={sb.x - 141} y={314} width={16} height={16} fill="#3A1A08" />
          </g>
        ))}
        {Array.from({length: 9}).map((_, i) => <rect key={i} x={-420 + i * 104} y={384} width={12} height={12} fill="#6E4E0A" opacity={0.8} />)}
        <rect x={-450} y={-450} width={900} height={900} fill="none" stroke="#16306E" strokeWidth={4} opacity={0.7} />
      </g>
    ) : null}
    {SUBS.map((sb) => <rect key={sb.id} x={sb.x - 105} y={-350} width={210} height={640} rx={60} fill={`url(#n4-sub-${sb.id})`} stroke={sb.hot} strokeOpacity={0.55} strokeWidth={5} />)}
    {SUBS.map((sb) => <rect key={sb.id} x={sb.x - 82} y={-322} width={46} height={560} rx={23} fill="#FFFFFF" opacity={0.17} />)}
    {lod > 0.01 ? SUBS.map((sb) => <rect key={sb.id} x={sb.x - 105} y={-350} width={210} height={640} rx={60} fill="url(#n4-anode)" opacity={0.5 * lod} />) : null}
  </g>
);

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="n4-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.3" stopColor="#F7CB52" /><stop offset="0.6" stopColor="#C9941A" /><stop offset="1" stopColor="#8A6410" /></linearGradient>
    <linearGradient id="n4-goldH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0AE" /><stop offset="0.25" stopColor="#F2C445" /><stop offset="0.7" stopColor="#B8860F" /><stop offset="1" stopColor="#6E4E0A" /></linearGradient>
    <linearGradient id="n4-goldV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFF0AE" /><stop offset="0.25" stopColor="#F2C445" /><stop offset="0.7" stopColor="#B8860F" /><stop offset="1" stopColor="#6E4E0A" /></linearGradient>
    <linearGradient id="n4-cuV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFD9B8" /><stop offset="0.3" stopColor="#E59A62" /><stop offset="0.75" stopColor="#B5622E" /><stop offset="1" stopColor="#6E3414" /></linearGradient>
    <linearGradient id="n4-cuH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD9B8" /><stop offset="0.3" stopColor="#E59A62" /><stop offset="0.75" stopColor="#B5622E" /><stop offset="1" stopColor="#6E3414" /></linearGradient>
    <radialGradient id="n4-soft"><stop offset="0" stopColor="#FFFFFF" stopOpacity={1} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient>
    <radialGradient id="n4-softg"><stop offset="0" stopColor="#D8FFE4" stopOpacity={0.95} /><stop offset="0.4" stopColor="#35F07A" stopOpacity={0.4} /><stop offset="1" stopColor="#35F07A" stopOpacity={0} /></radialGradient>
    {SUBS.map((sb) => (
      <React.Fragment key={sb.id}>
        <linearGradient id={`n4-sub-${sb.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sb.hot} /><stop offset="0.22" stopColor={sb.c} /><stop offset="0.8" stopColor={sb.c} /><stop offset="1" stopColor={sb.deep} /></linearGradient>
        <radialGradient id={`n4-halo-${sb.id}`}><stop offset="0" stopColor={sb.c} stopOpacity={0.55} /><stop offset="0.6" stopColor={sb.c} stopOpacity={0.2} /><stop offset="1" stopColor={sb.c} stopOpacity={0} /></radialGradient>
      </React.Fragment>
    ))}
    <pattern id="n4-anode" width={40} height={14} patternUnits="userSpaceOnUse"><rect x={0} y={0} width={40} height={2} fill="#000" opacity={0.28} /><rect x={0} y={7} width={40} height={1.5} fill="#FFF" opacity={0.2} /></pattern>
    <pattern id="n4-far" width={P} height={P} patternUnits="userSpaceOnUse" patternTransform={`translate(${-P / 2},${-P / 2})`}>
      <g transform={`translate(${P / 2},${P / 2}) scale(${P / CU})`}><CellBase lod={0} /></g>
    </pattern>
    {/* phone UI */}
    <linearGradient id="n4-wall" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#0A1034" /><stop offset="0.5" stopColor="#0B1A4A" /><stop offset="1" stopColor="#081030" /></linearGradient>
    {[['v', '#7A4BFF'], ['c', '#22D3EE'], ['m', '#FF4FA8'], ['b', '#2F6BFF']].map(([k, c]) => (
      <radialGradient key={k} id={`n4-blob-${k}`}><stop offset="0" stopColor={c} stopOpacity={0.75} /><stop offset="0.55" stopColor={c} stopOpacity={0.25} /><stop offset="1" stopColor={c} stopOpacity={0} /></radialGradient>
    ))}
    <linearGradient id="n4-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B2C9A" /><stop offset="0.45" stopColor="#7A4BD8" /><stop offset="0.68" stopColor="#F0679E" /><stop offset="0.86" stopColor="#FFB067" /><stop offset="1" stopColor="#FFE2A0" /></linearGradient>
    <linearGradient id="n4-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#05081A" stopOpacity={0} /><stop offset="1" stopColor="#05081A" stopOpacity={0.9} /></linearGradient>
    <linearGradient id="n4-glassw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.2} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.05} /></linearGradient>
    <linearGradient id="n4-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C8D4EE" /><stop offset="0.3" stopColor="#4A556E" /><stop offset="0.7" stopColor="#151A26" /><stop offset="1" stopColor="#7C89A6" /></linearGradient>
    <linearGradient id="n4-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFF4FF" stopOpacity={0} /><stop offset="0.92" stopColor="#BFF4FF" stopOpacity={0.22} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.9} /></linearGradient>
    {['#FF7A59', '#35D8FF', '#B48CFF', '#35F07A', '#FFC24A', '#FF5FA2', '#4A86FF', '#9AA8C4'].map((c, i) => (
      <linearGradient key={i} id={`n4-icon${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} /><stop offset="0.12" stopColor={c} /><stop offset="1" stopColor={c} stopOpacity={0.55} /></linearGradient>
    ))}
    <clipPath id="n4-screen"><rect x={-522} y={-942} width={1044} height={1884} rx={84} /></clipPath>
    <clipPath id="n4-card"><rect x={-450} y={-440} width={900} height={700} rx={60} /></clipPath>
    {/* display stack */}
    <linearGradient id="n4-riser" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3C7FA6" /><stop offset="0.35" stopColor="#9FDCF5" /><stop offset="0.5" stopColor="#F2FCFF" /><stop offset="0.65" stopColor="#8FD0EE" /><stop offset="1" stopColor="#2B6688" /></linearGradient>
    <linearGradient id="n4-touch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0C3A44" /><stop offset="0.5" stopColor="#072730" /><stop offset="1" stopColor="#0E4650" /></linearGradient>
    <linearGradient id="n4-film" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#59657E" /><stop offset="0.5" stopColor="#C9D4EC" /><stop offset="1" stopColor="#3A4459" /></linearGradient>
    <radialGradient id="n4-up"><stop offset="0" stopColor="#9FC8FF" stopOpacity={0.2} /><stop offset="0.6" stopColor="#6FA8FF" stopOpacity={0.08} /><stop offset="1" stopColor="#6FA8FF" stopOpacity={0} /></radialGradient>
    <pattern id="n4-diamond" width={44} height={44} patternUnits="userSpaceOnUse"><path d="M22 2 L42 22 L22 42 L2 22 Z" fill="#3FE0D0" fillOpacity={0.1} stroke="#5FF0E0" strokeOpacity={0.55} strokeWidth={1.6} /><circle cx={22} cy={22} r={2.4} fill="#BFFFF6" opacity={0.7} /></pattern>
    <pattern id="n4-oled" width={30} height={30} patternUnits="userSpaceOnUse">
      <rect x={3.5} y={5} width={5.5} height={20} rx={2.5} fill="#FF4257" /><rect x={12.2} y={5} width={5.5} height={20} rx={2.5} fill="#35F07A" /><rect x={21} y={5} width={5.5} height={20} rx={2.5} fill="#4A86FF" />
    </pattern>
    <pattern id="n4-hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect x={0} y={0} width={3} height={14} fill="#FFFFFF" opacity={0.2} /></pattern>
    <clipPath id="n4-winA"><rect x={-468} y={-832} width={936} height={1664} /></clipPath>
    <clipPath id="n4-floor"><rect x={-290} y={-652} width={580} height={1144} /></clipPath>
    <linearGradient id="n4-wallGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2FCFF" /><stop offset="0.12" stopColor="#A9E4FA" /><stop offset="0.6" stopColor="#58A9D0" /><stop offset="1" stopColor="#2B6E96" /></linearGradient>
    <linearGradient id="n4-wallTouch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FFFF0" /><stop offset="0.3" stopColor="#27B8AE" /><stop offset="1" stopColor="#0A5A5E" /></linearGradient>
    <linearGradient id="n4-wallOled" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A2A58" /><stop offset="1" stopColor="#0A0A1C" /></linearGradient>
    <pattern id="n4-oledStripe" width={30} height={60} patternUnits="userSpaceOnUse"><rect x={3} y={0} width={6} height={60} fill="#FF4257" opacity={0.8} /><rect x={12} y={0} width={6} height={60} fill="#35F07A" opacity={0.8} /><rect x={21} y={0} width={6} height={60} fill="#4A86FF" opacity={0.8} /></pattern>
    <linearGradient id="n4-castT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0.7} /><stop offset="1" stopColor="#000" stopOpacity={0} /></linearGradient>
    <linearGradient id="n4-castL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity={0.55} /><stop offset="1" stopColor="#000" stopOpacity={0} /></linearGradient>
    <linearGradient id="n4-castR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.35} /></linearGradient>
    {/* scan line */}
    <linearGradient id="n4-trail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFF4FF" stopOpacity={0} /><stop offset="0.8" stopColor="#BFF4FF" stopOpacity={0.2} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.6} /></linearGradient>
    {/* circuit */}
    <radialGradient id="n4-cbg" cx="50%" cy="46%" r="70%"><stop offset="0" stopColor="#123A30" /><stop offset="0.55" stopColor="#0A2420" /><stop offset="1" stopColor="#051210" /></radialGradient>
    <pattern id="n4-dots" width={26} height={26} patternUnits="userSpaceOnUse"><circle cx={13} cy={13} r={1.6} fill="#8FFFD8" opacity={0.16} /><path d="M0 0 H26" stroke="#8FFFD8" strokeWidth={0.6} opacity={0.07} /></pattern>
    <linearGradient id="n4-charge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2FFF6" /><stop offset="0.12" stopColor="#7DFFB0" /><stop offset="0.6" stopColor="#2FE56B" /><stop offset="1" stopColor="#0E8C3C" /></linearGradient>
    <linearGradient id="n4-plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3A2A10" /><stop offset="0.5" stopColor="#1C1408" /><stop offset="1" stopColor="#4A3612" /></linearGradient>
    <clipPath id="n4-cwin"><rect x={-100} y={-178} width={200} height={356} rx={26} /></clipPath>
    <clipPath id="n4-cap"><rect x={-250} y={90} width={260} height={260} rx={12} /></clipPath>
  </defs>
);

const Tag: React.FC<{x: number; y: number; text: string; a: number; size?: number; color?: string; from?: [number, number][]}> = ({x, y, text, a, size = 26, color = '#EAF6FF', from}) => {
  if (a < 0.01) return null;
  const w = text.length * size * 0.62 + size * 1.5, h = size * 1.9;
  return (
    <g opacity={clamp01(a)}>
      {from?.map((f, i) => <path key={i} d={`M${f[0]} ${f[1]} L${x + (f[0] < x ? -w / 2 + 8 : w / 2 - 8)} ${y}`} stroke={color} strokeWidth={size * 0.1} fill="none" opacity={0.85} />)}
      {from?.map((f, i) => <circle key={i} cx={f[0]} cy={f[1]} r={size * 0.22} fill={color} />)}
      <g transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * clamp01(a)})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#04070F" fillOpacity={0.86} stroke={color} strokeWidth={size * 0.08} />
        <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={size} letterSpacing={size * 0.06} fill={color}>{text}</text>
      </g>
    </g>
  );
};

type ArtProps = {t: number; beats: Beat[]; /** on-screen magnification of this art's own px */ s: number};

// =====================================================================================================================
// LEVEL 4 - THE PIXEL CIRCUIT (circuit px; frame = +-540 x +-960): scan line, data line, switch TFT, storage capacitor,
// drive TFT and the emitter - gold and copper on dark glass, lit green by the subpixel above it
// =====================================================================================================================
const CircuitArt: React.FC<ArtProps> = ({t, beats, s}) => {
  const tTr = wt(beats, 'transistors', 0, 142), tHold = wt(beats, 'hold', 0, 157), tColor = wt(beats, 'color', 0, 167.5), tUntil = wt(beats, 'until', 0, 180.5);
  const full = ramp(s, 0.45, 0.9);                         // fine detail and labels only once the circuit is big enough
  const gp = Math.max(rowEnv(0, t) * (t > 125 ? 1 : 0), 0);
  const q = chargeAt(t);
  const trHi = decayAt(t, tTr, 9), holdHi = decayAt(t, tHold, 9), colHi = decayAt(t, tColor, 9);
  const relatch = decayAt(t, LATCH[4], 8), latch1 = decayAt(t, LATCH[3], 8);
  const capY = 350 - 260 * q;
  const dash = -t * 13;
  const packet = [LATCH[3], LATCH[4]].map((L) => (t > L - 9 && t < L ? lerp(-640, -190, (t - (L - 9)) / 8.5) : null)).find((v) => v !== null) ?? null;
  const sagA = ss(t, tUntil, tUntil + 5) * (1 - ss(t, LATCH[4], LATCH[4] + 5));
  return (
    <g>
      <rect x={-760} y={-1180} width={1520} height={2360} fill="url(#n4-cbg)" />
      <rect x={-760} y={-1180} width={1520} height={2360} fill="url(#n4-dots)" />
      {/* light from the emitter above bleeds in around the edges */}
      <rect x={-540} y={-961} width={1080} height={1922} rx={140} fill="none" stroke="#35F07A" strokeWidth={260} opacity={0.2 + 0.12 * q} />
      <rect x={-540} y={-961} width={1080} height={1922} rx={140} fill="none" stroke="#9DFFC0" strokeWidth={70} opacity={0.3 + 0.2 * q} />
      <ellipse cx={-60} cy={150} rx={520} ry={620} fill="url(#n4-softg)" opacity={0.1 + 0.16 * q} />
      {Array.from({length: 15}).map((_, i) => <rect key={i} x={-760} y={-900 + i * 118 + (i % 2) * 30} width={1520} height={5} fill="#2C8A6C" opacity={0.28} />)}
      {Array.from({length: 9}).map((_, i) => <rect key={i} x={-640 + i * 160} y={-1180} width={5} height={2360} fill="#2C8A6C" opacity={0.2} />)}
      <path d="M-760 -1180 H-100 L-620 1180 H-760 Z" fill="#FFFFFF" opacity={0.035} />
      <path d="M120 -1180 H260 L-260 1180 H-400 Z" fill="#FFFFFF" opacity={0.03} />
      {/* soft shadows: the metal sits above the glass */}
      <g fill="#000" opacity={0.32}>
        <rect x={-752} y={-310} width={1520} height={44} /><rect x={-382} y={-1180} width={40} height={2360} /><rect x={358} y={-1180} width={40} height={2360} />
        <rect x={-260} y={84} width={300} height={300} rx={18} /><rect x={130} y={144} width={180} height={340} rx={56} />
        <rect x={-254} y={-184} width={144} height={92} rx={14} /><rect x={172} y={-224} width={92} height={172} rx={14} /><rect x={-254} y={542} width={614} height={22} />
      </g>
      {/* background routing: the next row's lines, guard rings, test pads */}
      {full > 0.01 ? (
        <g opacity={full}>
          {[610, 650].map((y) => <rect key={y} x={-760} y={y} width={1520} height={12} fill="url(#n4-cuH)" opacity={0.55} />)}
          <rect x={-760} y={720} width={1520} height={44} fill="url(#n4-goldH)" opacity={0.6} />
          {Array.from({length: 13}).map((_, i) => <rect key={i} x={-520 + i * 86} y={733} width={18} height={18} fill="#4A3608" opacity={0.7} />)}
          {[-470, 470].map((x) => <rect key={x} x={x - 5} y={-1180} width={10} height={2360} fill="url(#n4-cuV)" opacity={0.4} />)}
          {[[-470, -40], [-470, 300], [470, 60], [470, 460], [-470, 600]].map(([x, y], i) => <rect key={i} x={x - 22} y={y - 22} width={44} height={44} rx={6} fill="url(#n4-gold)" opacity={0.75} />)}
          {[[60, 30], [300, 560], [-300, 590], [300, -60]].map(([x, y], i) => <path key={i} d={`M${x - 14} ${y} H${x + 14} M${x} ${y - 14} V${y + 14}`} stroke="#8FFFD8" strokeWidth={2.5} opacity={0.4} />)}
        </g>
      ) : null}
      {/* ---- buses ---- */}
      <rect x={-760} y={-322} width={1520} height={44} fill="url(#n4-goldH)" />
      <rect x={-760} y={-322} width={1520} height={5} fill="#FFF8D0" opacity={0.9} />
      <rect x={-390} y={-1180} width={40} height={2360} fill="url(#n4-cuV)" />
      <rect x={350} y={-1180} width={40} height={2360} fill="url(#n4-goldV)" />
      {full > 0.01 ? (
        <g opacity={full}>
          {Array.from({length: 16}).map((_, i) => <rect key={i} x={-700 + i * 92} y={-308} width={16} height={16} fill="#6E4E0A" opacity={0.75} />)}
          {Array.from({length: 22}).map((_, i) => <rect key={i} x={-377} y={-1000 + i * 92} width={14} height={14} fill="#5A2A10" opacity={0.7} />)}
          {Array.from({length: 22}).map((_, i) => <rect key={i} x={363} y={-1000 + i * 92} width={14} height={14} fill="#6E4E0A" opacity={0.7} />)}
          <text x={52} y={-292} fontFamily={MONO} fontWeight={600} fontSize={20} letterSpacing={5} fill="#4A3608">SCAN LINE</text>
          <text transform="translate(-362 520) rotate(-90)" fontFamily={MONO} fontWeight={600} fontSize={20} letterSpacing={5} fill="#4A1E08">DATA</text>
          <text transform="translate(378 520) rotate(-90)" fontFamily={MONO} fontWeight={600} fontSize={20} letterSpacing={5} fill="#4A3608">POWER</text>
        </g>
      ) : null}
      {/* ---- traces ---- */}
      <rect x={-352} y={-161} width={92} height={22} fill="url(#n4-cuH)" />
      <rect x={-120} y={-160} width={252} height={20} fill="url(#n4-goldH)" />
      <rect x={-51} y={-150} width={22} height={222} fill="url(#n4-goldV)" />
      <rect x={253} y={-229} width={99} height={22} fill="url(#n4-goldH)" />
      <rect x={199} y={-67} width={22} height={200} fill="url(#n4-goldV)" />
      <rect x={-262} y={368} width={22} height={184} fill="url(#n4-cuV)" />
      <rect x={-262} y={530} width={614} height={22} fill="url(#n4-cuH)" />
      {[[-40, -150], [-40, 80], [210, 122], [-251, 541], [352, 541], [352, -218]].map(([x, y], i) => <rect key={i} x={x - 15} y={y - 15} width={30} height={30} rx={4} fill="url(#n4-gold)" stroke="#5A3F08" strokeWidth={2} />)}
      {/* ---- switch transistor (scan line opens it; the data line's level passes through) ---- */}
      <rect x={-262} y={-196} width={144} height={92} rx={14} fill="#1FB8A8" fillOpacity={0.55} stroke="#8FFFEA" strokeWidth={3} />
      <rect x={-262} y={-196} width={42} height={92} rx={8} fill="url(#n4-gold)" /><rect x={-160} y={-196} width={42} height={92} rx={8} fill="url(#n4-gold)" />
      {[-178, -150, -122].map((y) => <rect key={y} x={-248} y={y - 6} width={12} height={12} fill="#4A3608" />)}
      {[-178, -150, -122].map((y) => <rect key={y} x={-146} y={y - 6} width={12} height={12} fill="#4A3608" />)}
      <rect x={-207} y={-280} width={34} height={196} rx={5} fill="url(#n4-goldV)" stroke="#5A3F08" strokeWidth={2} />
      {gp > 0.02 ? <rect x={-222} y={-196} width={64} height={92} fill="#E6FFEC" opacity={0.85 * gp} /> : null}
      {gp > 0.02 ? <rect x={-207} y={-280} width={34} height={196} rx={5} fill="#FFFFFF" opacity={0.75 * gp} /> : null}
      {/* ---- drive transistor (the capacitor's level sets how much current reaches the emitter) ---- */}
      <rect x={164} y={-236} width={92} height={172} rx={14} fill="#1FB8A8" fillOpacity={0.55} stroke="#8FFFEA" strokeWidth={3} />
      <rect x={164} y={-236} width={92} height={42} rx={8} fill="url(#n4-gold)" /><rect x={164} y={-106} width={92} height={42} rx={8} fill="url(#n4-gold)" />
      {[182, 210, 238].map((x) => <rect key={x} x={x - 6} y={-221} width={12} height={12} fill="#4A3608" />)}
      {[182, 210, 238].map((x) => <rect key={x} x={x - 6} y={-91} width={12} height={12} fill="#4A3608" />)}
      <rect x={130} y={-167} width={160} height={34} rx={5} fill="url(#n4-goldH)" stroke="#5A3F08" strokeWidth={2} />
      <rect x={164} y={-167} width={92} height={34} fill="#7DFFB0" opacity={0.15 + 0.6 * q} />
      {/* "transistors": both light up */}
      {trHi > 0.02 ? (
        <g opacity={trHi}>
          <rect x={-276} y={-294} width={172} height={212} rx={22} fill="none" stroke="#FFFFFF" strokeWidth={6} />
          <rect x={116} y={-250} width={188} height={200} rx={22} fill="none" stroke="#FFFFFF" strokeWidth={6} />
          <ellipse cx={-190} cy={-170} rx={190} ry={170} fill="url(#n4-soft)" opacity={0.5} /><ellipse cx={210} cy={-150} rx={190} ry={170} fill="url(#n4-soft)" opacity={0.5} />
        </g>
      ) : null}
      <Ripple t={t} at={tTr} x={-190} y={-160} color="#FFE08A" r={230} />
      <Ripple t={t} at={tTr + 2} x={210} y={-150} color="#FFE08A" r={230} />
      {/* ---- storage capacitor ---- */}
      <ellipse cx={-120} cy={220} rx={300} ry={300} fill="url(#n4-softg)" opacity={0.25 * q + 0.45 * holdHi + 0.4 * relatch} />
      <rect x={-270} y={70} width={300} height={300} rx={18} fill="url(#n4-cuH)" stroke="#3A1A08" strokeWidth={3} />
      <rect x={-250} y={90} width={260} height={260} rx={12} fill="url(#n4-plate)" />
      <g clipPath="url(#n4-cap)">
        <rect x={-250} y={capY} width={260} height={350 - capY + 2} fill="url(#n4-charge)" opacity={0.95} />
        {Array.from({length: 12}).map((_, i) => {
          const yy = 350 - ((t * (1.6 + h2(i, 3)) + i * 37) % 260);
          return yy > capY + 10 ? <circle key={i} cx={-232 + h2(i, 5) * 224} cy={yy} r={4 + 5 * h2(i, 9)} fill="#F2FFF6" opacity={0.55} /> : null;
        })}
        <rect x={-250} y={capY - 3} width={260} height={7} fill="#FFFFFF" />
        <rect x={-250} y={capY - 26} width={260} height={26} fill="#9DFFC0" opacity={0.3 + 0.5 * Math.max(latch1, relatch)} />
        <rect x={-236} y={100} width={34} height={240} rx={14} fill="#FFFFFF" opacity={0.1} />
      </g>
      <rect x={-250} y={90} width={260} height={260} rx={12} fill="none" stroke="url(#n4-gold)" strokeWidth={7} />
      {Array.from({length: 11}).map((_, i) => <rect key={i} x={14} y={98 + i * 24.4} width={i % 5 === 0 ? 16 : 9} height={3} fill="#FFE9A0" opacity={0.85} />)}
      {sagA > 0.01 ? (
        <g opacity={sagA}>
          <path d="M-250 92 H10" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="10 8" />
          <path d={`M36 92 V${capY} M28 ${capY - 12} L36 ${capY} L44 ${capY - 12}`} stroke="#FFE08A" strokeWidth={4} fill="none" />
        </g>
      ) : null}
      {holdHi > 0.02 ? <rect x={-270} y={70} width={300} height={300} rx={18} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={holdHi} /> : null}
      <Ripple t={t} at={tHold} x={-120} y={220} color="#9DFFC0" r={420} />
      <Ripple t={t} at={LATCH[4]} x={-120} y={220} color="#FFFFFF" r={460} />
      <Burst t={t} at={LATCH[4]} x={-190} y={-150} color="#FFE08A" n={16} r={170} />
      <Burst t={t} at={LATCH[3]} x={-190} y={-150} color="#FFE08A" n={12} r={130} />
      {/* ---- the emitter (the subpixel itself): its light follows the stored level ---- */}
      <ellipse cx={210} cy={300} rx={270} ry={330} fill="url(#n4-softg)" opacity={0.2 + 0.6 * q + 0.3 * colHi} />
      <rect x={120} y={130} width={180} height={340} rx={56} fill="#06250F" stroke="url(#n4-gold)" strokeWidth={7} />
      <rect x={130} y={140} width={160} height={320} rx={48} fill="url(#n4-sub-g)" opacity={0.2 + 0.8 * q} />
      <rect x={146} y={160} width={34} height={270} rx={17} fill="#FFFFFF" opacity={0.2 * q} />
      {colHi > 0.02 ? Array.from({length: 10}).map((_, i) => {
        const a = (i / 10) * Math.PI * 2, r0 = 210 + 60 * (1 - colHi), r2 = r0 + 70;
        return <line key={i} x1={210 + Math.cos(a) * r0 * 0.8} y1={300 + Math.sin(a) * r0} x2={210 + Math.cos(a) * r2 * 0.8} y2={300 + Math.sin(a) * r2} stroke="#D8FFE4" strokeWidth={7} strokeLinecap="round" opacity={colHi} />;
      }) : null}
      <Ripple t={t} at={tColor} x={210} y={300} color="#9DFFC0" r={330} />
      {/* ---- signals ---- */}
      {gp > 0.02 ? (
        <g opacity={gp}>
          <rect x={-760} y={-352} width={1520} height={104} fill="url(#n4-softRow)" />
          <rect x={-760} y={-322} width={1520} height={44} fill="#FFFFFF" opacity={0.7} />
          <path d="M-370 -1180 V-150 H-40 V80" fill="none" stroke="#E6FFEC" strokeWidth={9} strokeDasharray="18 16" strokeDashoffset={dash * 1.6} strokeLinecap="round" />
        </g>
      ) : null}
      {packet !== null ? (
        <g>
          <ellipse cx={packet} cy={-300} rx={150} ry={60} fill="url(#n4-soft)" opacity={0.95} />
          <rect x={packet - 90} y={-322} width={110} height={44} fill="#FFFFFF" opacity={0.9} />
        </g>
      ) : null}
      <path d="M370 -1180 V-218 H210 V132" fill="none" stroke="#D8FFE4" strokeWidth={6} strokeDasharray="10 22" strokeDashoffset={dash * (0.4 + q)} strokeLinecap="round" opacity={(0.15 + 0.75 * q) * full} />
      {/* ---- labels ---- */}
      {full > 0.5 ? (
        <g>
          <Tag x={5} y={-222} text="transistor" a={sp(t, tTr, 'pop')} size={24} color="#FFE9A0" from={[[-112, -196], [158, -205]]} />
          <Tag x={-110} y={452} text="capacitor holds the level" a={sp(t, tHold, 'pop')} size={24} color="#B8FFD0" from={[[-120, 376]]} />
          <text x={-190} y={-64} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={17} letterSpacing={3} fill="#8FFFEA" opacity={0.75}>SWITCH</text>
          <text x={300} y={-112} fontFamily={MONO} fontWeight={600} fontSize={17} letterSpacing={3} fill="#8FFFEA" opacity={0.75}>DRIVE</text>
        </g>
      ) : null}
    </g>
  );
};

// =====================================================================================================================
// LEVELS 2 + 3 - THE PIXEL GRID (grid px, pitch 120) and, closer, ONE PIXEL: the same drawing at two magnifications
// =====================================================================================================================
const GridArt: React.FC<ArtProps> = ({t, beats, s}) => {
  const sc = (s * P) / CU, s4 = sc / F4;
  const circuit = (
    <g transform={`scale(${P / CU})`}>
      <g clipPath={s4 < 1.03 ? 'url(#n4-cwin)' : undefined}><g transform={`scale(${1 / F4})`}><CircuitArt t={t} beats={beats} s={s4} /></g></g>
    </g>
  );
  if (s4 >= 1.03) return circuit;                           // the circuit fills the frame: nothing else can be seen
  const tScreen = wt(beats, 'screen', 0, 37), tInside = wt(beats, 'inside', 0, 106.5), tEach = wt(beats, 'each', 0, 118.5), tPixel = wt(beats, 'pixel', 0, 123.5), tTiny = wt(beats, 'tiny', 0, 134);
  const near = s >= 2.4;
  const cMax = Math.min(10, Math.ceil((540 / s + 60) / P)), rMax = Math.min(19, Math.ceil((960 / s + 60) / P));
  const sy = scanY(t);
  const beamA = (1 - ss(t, 118, 126)) * ramp(s, 0.1, 0.2);
  const lodC = ramp(sc, 1.25, 2.5);
  const els: React.ReactNode[] = [];
  if (!near) {
    // far: one pattern for all the pixels + darkening rects (grouped by level) that carry the picture
    els.push(<rect key="far" x={-(cMax + 0.5) * P} y={-(rMax + 0.5) * P} width={(2 * cMax + 1) * P} height={(2 * rMax + 1) * P} fill="url(#n4-far)" />);
    const ov = ramp(s, 0.14, 0.26);
    if (ov > 0.01) {
      const lv = ['', '', '', '', ''];
      for (let r = -rMax; r <= rMax; r++) {
        const n = frameOf(r, t);
        for (let c = -cMax; c <= cMax; c++) {
          if (c === 0 && r === 0) continue;
          for (let ch = 0; ch < 3; ch++) {
            const k = Math.round((1 - subVal(c, r, n, ch)) * 4);
            if (k > 0) lv[k] += `M${r1(c * P + SUBS[ch].x * (P / CU) - 14.9)} ${r1(r * P - 47.7)}h29.8v87.4h-29.8Z`;
          }
        }
      }
      els.push(<g key="ov" opacity={ov}>{lv.map((d, k) => (d ? <path key={k} d={d} fill="#03060F" opacity={(k / 4) * 0.86} /> : null))}</g>);
    }
  } else {
    const lodN = ramp(s, 2.4, 5);
    for (let r = -rMax; r <= rMax; r++) {
      const n = frameOf(r, t), e = rowEnv(r, t);
      for (let c = -cMax; c <= cMax; c++) {
        const hero = c === 0 && r === 0;
        els.push(
          <g key={`${c}_${r}`} transform={`translate(${c * P},${r * P}) scale(${P / CU})`}>
            <CellBase lod={lodN} />
            {!hero ? SUBS.map((sb, ch) => <rect key={ch} x={sb.x - 112} y={-358} width={224} height={656} rx={64} fill="#03060F" opacity={(1 - subVal(c, r, n, ch)) * 0.86} />) : null}
            {e > 0.02 ? <rect x={-450} y={300} width={900} height={180} fill="url(#n4-softRow)" opacity={e} /> : null}
            {e > 0.02 ? <rect x={-450} y={372} width={900} height={36} fill="#FFFFFF" opacity={0.85 * e} /> : null}
            {e > 0.02 ? <rect x={-450} y={-450} width={900} height={900} fill="#DFFBFF" opacity={0.16 * e} /> : null}
          </g>,
        );
      }
    }
  }
  const scr = decayAt(t, tScreen, 9);
  const brk = sp(t, tInside, 'pop') * (1 - ss(t, tPixel + 5, tPixel + 14)) * ramp(s, 1.1, 1.6);
  const subA = sp(t, tEach, 'pop') * (1 - ss(t, tTiny - 3, tTiny + 4)) * ramp(sc, 0.5, 0.8);
  return (
    <g>
      <rect x={-(cMax + 0.5) * P - 4} y={-(rMax + 0.5) * P - 4} width={(2 * cMax + 1) * P + 8} height={(2 * rMax + 1) * P + 8} fill="#050A1C" />
      {els}
      {scr > 0.02 ? <rect x={-(cMax + 0.5) * P} y={-(rMax + 0.5) * P} width={(2 * cMax + 1) * P} height={(2 * rMax + 1) * P} fill="#BFE0FF" opacity={0.2 * scr} /> : null}
      {/* the scan line: rows above it already show the new picture */}
      {sy !== null && beamA > 0.01 ? (
        <g opacity={beamA}>
          <rect x={-1300} y={sy - 300} width={2600} height={300} fill="url(#n4-trail)" />
          <rect x={-1300} y={sy - 26} width={2600} height={52} fill="url(#n4-softRow)" />
          <rect x={-1300} y={sy - 4} width={2600} height={8} fill="#FFFFFF" />
          {(() => {
            const a = ramp(s, 0.75, 0.95) * (1 - ramp(s, 1.7, 2.4)) * ss(t, 44, 48);
            return a > 0.01 ? <Tag x={300} y={sy - 44} text="scan line" a={a} size={26} color="#DFFBFF" from={[[396, sy - 4]]} /> : null;
          })()}
        </g>
      ) : null}
      {/* the hero pixel */}
      <g transform={`scale(${P / CU})`}>
        {brk > 0.01 ? (
          <g opacity={brk}>
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy2], i) => (
              <path key={i} d={`M${sx * 470 - sx * 150} ${sy2 * 470} L${sx * 470} ${sy2 * 470} L${sx * 470} ${sy2 * 470 - sy2 * 150}`} fill="none" stroke="#FFFFFF" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            <rect x={-450} y={-450} width={900} height={900} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.5} />
          </g>
        ) : null}
        {subA > 0.01 ? (
          <g opacity={subA}>
            <path d="M-375 322 V346 H375 V322" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            {SUBS.map((sb) => <text key={sb.id} x={sb.x} y={-250} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={74} fill="#FFFFFF" opacity={0.9}>{sb.id.toUpperCase()}</text>)}
          </g>
        ) : null}
        <Tag x={0} y={468} text="subpixels" a={subA} size={44} color="#FFFFFF" from={[[0, 350]]} />
      </g>
      {lodC > 0.01 ? (
        <g opacity={lodC}>
          {circuit}
          <g transform={`scale(${P / CU})`}><rect x={-100} y={-178} width={200} height={356} rx={26} fill="none" stroke="#E6FFEC" strokeWidth={5} opacity={0.9} /></g>
        </g>
      ) : null}
    </g>
  );
};

// =====================================================================================================================
// LEVEL 1 - THE DISPLAY STACK (stack px): a terraced cut-away through cover glass, touch layer and OLED emitters down to
// the thin-film-transistor backplane (the floor = the pixel grid)
// =====================================================================================================================
type Box = [number, number, number, number];
const O1: Box = [-468, -832, 468, 832], I1: Box = [-436, -806, 436, 722];      // cover glass: the hole and its bottom edge
const O2: Box = [-380, -740, 380, 650], I2: Box = [-362, -726, 362, 606];      // touch layer
const O3: Box = [-306, -664, 306, 536], I3: Box = [-290, -652, 290, 492];      // OLED emitters; I3 = the backplane floor
const box = (b: Box, extra?: React.SVGProps<SVGRectElement>) => <rect x={b[0]} y={b[1]} width={b[2] - b[0]} height={b[3] - b[1]} {...extra} />;
/** the four cut faces of one layer: we look down from above the top edge, so the bottom face is the tall, lit one */
const Walls: React.FC<{o: Box; i: Box; bottom: string; side: string; top: string; tex?: string}> = ({o, i, bottom, side, top, tex}) => {
  const bt = `M${o[0]} ${o[3]} L${o[2]} ${o[3]} L${i[2]} ${i[3]} L${i[0]} ${i[3]} Z`;
  return (
    <g>
      <path d={`M${o[0]} ${o[1]} L${o[2]} ${o[1]} L${i[2]} ${i[1]} L${i[0]} ${i[1]} Z`} fill={top} />
      <path d={`M${o[0]} ${o[1]} L${i[0]} ${i[1]} L${i[0]} ${i[3]} L${o[0]} ${o[3]} Z`} fill={side} />
      <path d={`M${o[2]} ${o[1]} L${i[2]} ${i[1]} L${i[2]} ${i[3]} L${o[2]} ${o[3]} Z`} fill={side} />
      <path d={`M${o[2]} ${o[1]} L${i[2]} ${i[1]} L${i[2]} ${i[3]} L${o[2]} ${o[3]} Z`} fill="#FFFFFF" opacity={0.12} />
      <path d={bt} fill={bottom} />
      {tex ? <path d={bt} fill={tex} /> : null}
      {[[0, 1], [2, 1], [2, 3], [0, 3]].map(([a, b2], k) => <line key={k} x1={o[a]} y1={o[b2]} x2={i[a]} y2={i[b2]} stroke="#FFFFFF" strokeWidth={2} opacity={0.55} />)}
      {box(o, {fill: 'none', stroke: '#FFFFFF', strokeWidth: 3, opacity: 0.85})}
      {box(i, {fill: 'none', stroke: '#01060A', strokeWidth: 3, opacity: 0.8})}
    </g>
  );
};
/** shadow that the layer above casts on a terrace (strongest under the top edge) */
const Cast: React.FC<{b: Box}> = ({b}) => (
  <g>
    <rect x={b[0]} y={b[1]} width={b[2] - b[0]} height={70} fill="url(#n4-castT)" />
    <rect x={b[0]} y={b[1]} width={46} height={b[3] - b[1]} fill="url(#n4-castL)" />
    <rect x={b[2] - 46} y={b[1]} width={46} height={b[3] - b[1]} fill="url(#n4-castR)" />
  </g>
);
const PitArt: React.FC<ArtProps> = ({t, beats, s}) => {
  const floor = <g transform={`scale(${1 / F2})`}><GridArt t={t} beats={beats} s={s / F2} /></g>;
  if (s >= 2.5) return floor;                               // the floor fills the frame
  const tRef = wt(beats, 'refresh', 0, 17);
  const rim = decayAt(t, tRef, 10);
  const lab = ramp(s, 0.4, 0.62);
  const lbl = (y: number, text: string, i: number, color: string) => <Tag x={0} y={y} text={text} a={lab * sp(t, 17 + i * 2.5, 'pop') * (1 - ramp(s, 1.7 - i * 0.2, 2.2 - i * 0.2))} size={22} color={color} />;
  return (
    <g>
      {/* touch layer (seen through the hole in the cover glass) */}
      {box(I1, {fill: 'url(#n4-touch)'})}
      {box(I1, {fill: 'url(#n4-diamond)'})}
      <Cast b={I1} />
      {/* OLED emitter layer */}
      {box(I2, {fill: '#04060E'})}
      {box(I2, {fill: 'url(#n4-oled)'})}
      <Cast b={I2} />
      {/* the backplane floor = the pixel grid */}
      <g clipPath="url(#n4-floor)">{floor}</g>
      <Cast b={I3} />
      {/* the cut faces */}
      <Walls o={O3} i={I3} bottom="url(#n4-wallOled)" side="#0B0F1E" top="#05070F" tex="url(#n4-oledStripe)" />
      <rect x={I3[0]} y={I3[3] - 5} width={I3[2] - I3[0]} height={10} fill="url(#n4-goldH)" />
      <Walls o={O2} i={I2} bottom="url(#n4-wallTouch)" side="#0C4A52" top="#062A30" />
      <Walls o={O1} i={I1} bottom="url(#n4-wallGlass)" side="#3A86AC" top="#1C4C68" tex="url(#n4-hatch)" />
      <rect x={I1[0] + 6} y={I1[3] + 14} width={860} height={8} fill="#FFFFFF" opacity={0.5} />
      {/* light coming up from the pixels, and the cut edge glowing on "refresh" */}
      <ellipse cx={0} cy={-60} rx={520} ry={900} fill="url(#n4-up)" />
      {box(O1, {fill: 'none', stroke: '#7FE6FF', strokeWidth: 26, opacity: 0.16 + 0.5 * rim})}
      {box(I1, {fill: 'none', stroke: '#BFF4FF', strokeWidth: 5, opacity: 0.6 * rim})}
      {lbl(777, 'COVER GLASS', 0, '#DFF6FF')}
      {lbl(628, 'TOUCH LAYER', 1, '#8FFFEA')}
      {lbl(514, 'OLED EMITTERS', 2, '#FFD0E0')}
      {lbl(440, 'TFT BACKPLANE', 3, '#FFE9A0')}
    </g>
  );
};

// =====================================================================================================================
// LEVEL 0 - THE PHONE SCREEN (screen px; the frame is the phone): glowing home screen, generic and unbranded
// =====================================================================================================================
const ICONS = [0, 1, 2, 3, 4, 5, 6, 7];
const Glyph: React.FC<{k: number}> = ({k}) => {
  const w = {fill: 'none', stroke: '#FFFFFF', strokeWidth: 9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  switch (k) {
    case 0: return <g><rect x={-36} y={-24} width={72} height={52} rx={12} {...w} /><circle cx={0} cy={2} r={13} {...w} /></g>;
    case 1: return <path d="M-34 -26 H34 V14 H-6 L-26 32 V14 H-34 Z" {...w} />;
    case 2: return <g><path d="M-10 26 V-28 L26 -36 V18" {...w} /><circle cx={-20} cy={26} r={10} fill="#FFF" /><circle cx={16} cy={18} r={10} fill="#FFF" /></g>;
    case 3: return <g><path d="M0 36 C-34 -2 -26 -36 0 -36 C26 -36 34 -2 0 36 Z" {...w} /><circle cx={0} cy={-10} r={8} fill="#FFF" /></g>;
    case 4: return <g><circle cx={0} cy={0} r={32} {...w} /><path d="M0 -18 V0 L14 10" {...w} /></g>;
    case 5: return <g><rect x={-36} y={-24} width={72} height={48} rx={8} {...w} /><path d="M-34 -20 L0 6 L34 -20" {...w} /></g>;
    case 6: return <g><rect x={-36} y={-30} width={72} height={60} rx={10} {...w} /><path d="M-30 22 L-8 -4 L8 12 L18 2 L32 22" {...w} /></g>;
    default: return <g><circle cx={0} cy={0} r={14} {...w} /><path d="M0 -36 V-26 M0 26 V36 M-36 0 H-26 M26 0 H36 M-25 -25 L-18 -18 M18 18 L25 25 M-25 25 L-18 18 M18 -18 L25 -25" {...w} /></g>;
  }
};

const UiArt: React.FC<ArtProps> = ({t, beats, s}) => {
  const tEvery = wt(beats, 'every', 0, 8), tRef = wt(beats, 'refresh', 0, 17);
  const open = ss(t, tEvery - 3, tEvery + 5);
  const pit = open > 0.001 ? (
    <g clipPath={open < 0.999 ? 'url(#n4-rev)' : undefined}>
      <g transform={`scale(${1 / F1})`}><g clipPath={s < 10.5 ? 'url(#n4-winA)' : undefined}><PitArt t={t} beats={beats} s={s / F1} /></g></g>
    </g>
  ) : null;
  const rev = <defs><clipPath id="n4-rev"><rect x={-80} y={-110} width={160} height={220 * open} /></clipPath></defs>;
  if (s >= 10.5) return <g>{rev}{pit}</g>;                  // the cut-away fills the frame
  const band = t > tRef - 4 && t < tRef + 14 ? lerp(-1000, 1000, (t - (tRef - 4)) / 18) : null;
  const knob = -400 + 800 * ((t / 900 + 0.3) % 1);
  const brA = sp(t, tEvery - 2, 'pop') * (1 - ss(t, tEvery + 6, tEvery + 13));
  const laserY = lerp(-110, 110, open);
  return (
    <g>
      {rev}
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="#020308" />
      <rect x={-540} y={-960} width={1080} height={1920} rx={100} fill="url(#n4-edge)" />
      <rect x={-530} y={-950} width={1060} height={1900} rx={92} fill="#020308" />
      <g clipPath="url(#n4-screen)">
        <rect x={-522} y={-942} width={1044} height={1884} fill="url(#n4-wall)" />
        <ellipse cx={-260 + 30 * Math.sin(t / 40)} cy={-380} rx={640} ry={620} fill="url(#n4-blob-v)" />
        <ellipse cx={330} cy={520 + 30 * Math.cos(t / 50)} rx={600} ry={600} fill="url(#n4-blob-c)" opacity={0.8} />
        <ellipse cx={380} cy={-620} rx={440} ry={440} fill="url(#n4-blob-m)" opacity={0.7} />
        <ellipse cx={-340} cy={760} rx={520} ry={500} fill="url(#n4-blob-b)" />
        {/* status bar (icons only) */}
        <circle cx={0} cy={-894} r={17} fill="#020308" stroke="#2A3350" strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={-452 + i * 15} y={-886 - i * 7} width={10} height={12 + i * 7} rx={3} fill="#FFFFFF" opacity={0.9} />)}
        <rect x={386} y={-908} width={58} height={28} rx={9} fill="none" stroke="#FFFFFF" strokeWidth={3.5} opacity={0.9} /><rect x={392} y={-902} width={38} height={16} rx={4} fill="#FFFFFF" opacity={0.9} /><rect x={447} y={-900} width={5} height={12} rx={2} fill="#FFFFFF" opacity={0.9} />
        {/* the picture card */}
        <rect x={-450} y={-428} width={900} height={700} rx={60} fill="#000" opacity={0.35} />
        <g clipPath="url(#n4-card)">
          <rect x={-450} y={-440} width={900} height={700} fill="url(#n4-sky)" />
          {Array.from({length: 26}).map((_, i) => <circle key={i} cx={-430 + h2(i, 1) * 860} cy={-430 + h2(i, 2) * 300} r={1.5 + 2.5 * h2(i, 3)} fill="#FFFFFF" opacity={0.3 + 0.6 * h2(i, 4)} />)}
          <circle cx={190} cy={-40} r={190} fill="url(#n4-soft)" opacity={0.55} />
          <circle cx={190} cy={-40} r={74} fill="#FFF3CF" />
          <path d="M-450 260 V70 L-300 -70 L-190 30 L-60 -120 L80 60 L170 -10 L330 110 L450 30 V260 Z" fill="#2A2470" />
          <path d="M-60 -120 L-20 -68 L-52 -74 L-74 -40 L-96 -78 Z" fill="#FFFFFF" opacity={0.75} />
          <path d="M-450 260 V150 L-340 90 L-200 170 L-40 100 L120 190 L280 130 L450 200 V260 Z" fill="#120F3C" />
          <rect x={-450} y={40} width={900} height={220} fill="url(#n4-fade)" />
          <rect x={-400} y={150} width={300} height={24} rx={12} fill="#FFFFFF" opacity={0.92} />
          <rect x={-400} y={188} width={190} height={14} rx={7} fill="#FFFFFF" opacity={0.55} />
          <rect x={-400} y={226} width={800} height={6} rx={3} fill="#FFFFFF" opacity={0.3} /><rect x={-400} y={226} width={knob + 400} height={6} rx={3} fill="#FFFFFF" /><circle cx={knob} cy={229} r={11} fill="#FFFFFF" />
          <path d="M-450 -440 H80 L-180 260 H-450 Z" fill="#FFFFFF" opacity={0.05} />
        </g>
        <rect x={-450} y={-440} width={900} height={700} rx={60} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={3} />
        {/* two glass widgets */}
        {[-450, 20].map((x, k) => (
          <g key={k}>
            <rect x={x} y={300} width={430} height={226} rx={50} fill="url(#n4-glassw)" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={2.5} />
            {k === 0 ? Array.from({length: 7}).map((_, i) => {
              const hgt = 40 + 110 * (0.5 + 0.5 * Math.sin(i * 1.3 + t / 14));
              return <rect key={i} x={x + 46 + i * 50} y={486 - hgt} width={30} height={hgt} rx={12} fill={i === 4 ? '#FFFFFF' : '#BFE9FF'} opacity={i === 4 ? 0.95 : 0.55} />;
            }) : [0, 1, 2].map((i) => (
              <g key={i}>
                <circle cx={x + 130} cy={413} r={84 - i * 24} fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={17} />
                <circle cx={x + 130} cy={413} r={84 - i * 24} fill="none" stroke={['#FF5FA2', '#7DFFB0', '#5FD8FF'][i]} strokeWidth={17} strokeLinecap="round"
                        strokeDasharray={`${(84 - i * 24) * 6.283 * (0.55 + 0.12 * i)} 999`} transform={`rotate(-90 ${x + 130} 413)`} />
              </g>
            ))}
            {k === 1 ? [0, 1, 2].map((i) => <rect key={i} x={x + 250} y={356 + i * 44} width={130 - i * 26} height={18} rx={9} fill="#FFFFFF" opacity={0.75 - i * 0.2} />) : null}
          </g>
        ))}
        {/* apps + dock */}
        {ICONS.map((k) => {
          const x = -337.5 + (k % 4) * 225, y = 628 + Math.floor(k / 4) * 166;
          return (
            <g key={k} transform={`translate(${x} ${y})`}>
              <rect x={-65} y={-59} width={130} height={130} rx={38} fill="#000" opacity={0.3} />
              <rect x={-65} y={-65} width={130} height={130} rx={38} fill={`url(#n4-icon${k})`} />
              <rect x={-65} y={-65} width={130} height={130} rx={38} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2.5} />
              <Glyph k={k} />
            </g>
          );
        })}
        {[-1, 0, 1].map((i) => <circle key={i} cx={i * 28} cy={902} r={i === 0 ? 8 : 6} fill="#FFFFFF" opacity={i === 0 ? 0.95 : 0.45} />)}
        {/* glass reflection + the refresh passing over the whole screen */}
        <path d="M-522 -942 H-60 L-522 420 Z" fill="#FFFFFF" opacity={0.035} />
        {band !== null ? <rect x={-522} y={band - 420} width={1044} height={420} fill="url(#n4-band)" /> : null}
      </g>
      <rect x={-522} y={-942} width={1044} height={1884} rx={84} fill="none" stroke="#000" strokeWidth={5} opacity={0.8} />
      {/* the cut-away window: lasered open on "every" */}
      {pit}
      {open > 0.001 ? <rect x={-58.5} y={-104} width={117} height={208} fill="none" stroke="#DFFBFF" strokeWidth={1.6} opacity={0.9} /> : null}
      {open > 0.01 && open < 0.995 ? (
        <g>
          <ellipse cx={0} cy={laserY} rx={120} ry={26} fill="url(#n4-soft)" opacity={0.8} />
          <rect x={-64} y={laserY - 1.5} width={128} height={3} fill="#FFFFFF" />
        </g>
      ) : null}
      {brA > 0.01 ? (
        <g opacity={brA}>
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => {
            const g = (1 - brA) * 50;
            return <path key={i} d={`M${sx * (78 + g) - sx * 26} ${sy * (124 + g)} L${sx * (78 + g)} ${sy * (124 + g)} L${sx * (78 + g)} ${sy * (124 + g) - sy * 26}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
          })}
        </g>
      ) : null}
    </g>
  );
};

// ---- HUD: a slim depth gauge locked to the screen (identical in every level, so it never changes in a hand-off) ------
const STOPS = ['SCREEN', 'DISPLAY STACK', 'PIXEL GRID', 'ONE PIXEL', 'PIXEL CIRCUIT'];
const Hud: React.FC<{t: number; scale: number; k: number}> = ({t, scale, k}) => {
  const a = ss(t, 6, 14) * (1 - ss(t, 140, 150));
  if (a < 0.01) return null;
  const D = Math.min(DEPTH[4], DEPTH[k] + Math.log10(scale));
  const x = -486, y0 = -300, y1 = 560;
  const yy = (d: number) => y0 + ((y1 - y0) * d) / DEPTH[4];
  const py = yy(D);
  return (
    <g transform={`scale(${1 / scale})`} opacity={a}>
      <rect x={x - 20} y={y0 - 30} width={40} height={y1 - y0 + 60} rx={20} fill="#02060F" opacity={0.5} />
      <line x1={x} y1={y0} x2={x} y2={y1} stroke="#DCEBFF" strokeWidth={2} opacity={0.5} />
      <line x1={x} y1={y0} x2={x} y2={py} stroke="#7FE6FF" strokeWidth={4} strokeLinecap="round" />
      {Array.from({length: 32}).map((_, i) => <line key={i} x1={x - (i % 5 === 0 ? 9 : 5)} x2={x} y1={yy(i * 0.1)} y2={yy(i * 0.1)} stroke="#DCEBFF" strokeWidth={1.5} opacity={i * 0.1 <= D ? 0.9 : 0.35} />)}
      {STOPS.map((name, i) => {
        const near = clamp01(1 - Math.abs(D - DEPTH[i]) / 0.5), on = D >= DEPTH[i] - 0.02;
        return (
          <g key={i}>
            <circle cx={x} cy={yy(DEPTH[i])} r={7} fill={on ? '#7FE6FF' : '#0A1830'} stroke="#DCEBFF" strokeWidth={2} />
            <text x={x + 28} y={yy(DEPTH[i]) + 7} fontFamily={MONO} fontWeight={600} fontSize={19} letterSpacing={2} fill={on ? '#EAF6FF' : '#9FB4D8'}
                  stroke="#02060F" strokeWidth={5} paintOrder="stroke" opacity={0.15 + 0.85 * near}>{name}</text>
          </g>
        );
      })}
      <circle cx={x} cy={py} r={20} fill="url(#n4-soft)" opacity={0.55} />
      <path d={`M${x + 8} ${py} l14 -9 l0 18 Z`} fill="#FFE08A" />
      <circle cx={x} cy={py} r={5} fill="#FFFFFF" />
    </g>
  );
};

// ---- the five levels: the same picture, pre-scaled -------------------------------------------------------------------
const mkLevel = (k: number): React.FC<NanoLevelProps> => {
  const Level: React.FC<NanoLevelProps> = ({t, beats, scale}) => (
    <Stage>
      <Defs />
      <defs><linearGradient id="n4-softRow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFF4FF" stopOpacity={0} /><stop offset="0.5" stopColor="#DFFBFF" stopOpacity={0.75} /><stop offset="1" stopColor="#BFF4FF" stopOpacity={0} /></linearGradient></defs>
      <g transform={`scale(${MAG[k]})`}><UiArt t={t} beats={beats} s={scale * MAG[k]} /></g>
      <Hud t={t} scale={scale} k={k} />
    </Stage>
  );
  return Level;
};
const BG = ['#020308', '#04141A', '#050A1C', '#050A1C', '#051210'];
const LEVELS: NanoLevel[] = [0, 1, 2, 3, 4].map((k) => ({id: `l${k}`, depth: DEPTH[k], portal: k < 4 ? [0, 0] as [number, number] : undefined, bg: BG[k], Draw: mkLevel(k)}));

export const NanoS04: React.FC<SceneProps> = ({t, W, H, spec}) => (
  <NanoZoom levels={LEVELS} keys={KEYS} t={t} beats={spec.beats ?? []} W={W} H={H} top="#03060C" />
);
