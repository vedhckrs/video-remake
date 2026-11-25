// Shared art for the "screen" worlds (S01 flipbook, S02 two machines, S11 payoff, S12 CTA):
// maths, gradients, the neon-ball frame picture, frame cards, a generic phone, the FPS / Hz gauge, a fingertip,
// and tiny CSS-3D helpers (perspective container + transformed layers - plain CSS transforms, no 3D engine).
// Everything is a pure function of its props.
import React from 'react';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smooth = (x: number) => {
  const q = clamp01(x);
  return q * q * (3 - 2 * q);
};
export const easeIO = (x: number) => {
  const q = clamp01(x);
  return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
};
export const outC = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
/** triangle wave 0..1..0 with period 2 */
export const tri = (x: number) => {
  const q = ((x % 2) + 2) % 2;
  return q < 1 ? q : 2 - q;
};
/** integral of a smoothstep ramp that starts at `at` and takes `d` frames (frames-at-full-rate) */
export const rampInt = (t: number, at: number, d: number) => {
  const x = (t - at) / d;
  if (x <= 0) return 0;
  if (x >= 1) return d * (0.5 + (x - 1));
  return d * (x * x * x - (x * x * x * x) / 2);
};
/** 1 -> 0 decay after `at` */
export const decay = (t: number, at: number, d = 8) => (t < at ? 0 : Math.exp(-(t - at) / d));

export const CY = '#2BE4FF', MG = '#FF45D0', VIO = '#7C5CFF', BLU = '#3B7BFF', GRN = '#3DF08A', INK = '#060818', AM = '#FFC64A', RED = '#FF4D6A';
export {FONT, MONO};

// ---- CSS 3D helpers ---------------------------------------------------------------------------------------------
export const Stage3: React.FC<{w: number; h: number; ox: number; oy: number; persp?: number; children?: React.ReactNode}> = ({w, h, ox, oy, persp = 2800, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, perspective: `${persp}px`, perspectiveOrigin: `${ox}px ${oy}px`}}>{children}</div>
);
export const L3: React.FC<{tf: string; w?: number; h?: number; o?: number; children?: React.ReactNode}> = ({tf, w = 10, h = 10, o = 1, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transform: tf, opacity: o}}>{children}</div>
);
const f1 = (x: number) => x.toFixed(2);
export const t3 = (x: number, y: number, z = 0) => `translate3d(${f1(x)}px,${f1(y)}px,${f1(z)}px)`;
export const rX = (a: number) => `rotateX(${f1(a)}deg)`;
export const rY = (a: number) => `rotateY(${f1(a)}deg)`;
export const rZ = (a: number) => `rotateZ(${f1(a)}deg)`;

// ---- gradients (one hidden svg per scene) -------------------------------------------------------------------------
export const CW = 600, CH = 720, CR = 34;   // frame card
export const Defs: React.FC<{id: string}> = ({id}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <linearGradient id={`${id}-ti`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D5DAE6" /><stop offset="0.28" stopColor="#5C6272" /><stop offset="0.55" stopColor="#262933" /><stop offset="0.8" stopColor="#8D94A6" /><stop offset="1" stopColor="#3A3E4A" /></linearGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F2F5FA" /><stop offset="0.35" stopColor="#7C8597" /><stop offset="0.6" stopColor="#C9CFDB" /><stop offset="1" stopColor="#3D4352" /></linearGradient>
      <linearGradient id={`${id}-scr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#151040" /><stop offset="0.4" stopColor="#0B0C26" /><stop offset="1" stopColor="#070817" /></linearGradient>
      <linearGradient id={`${id}-art`} x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stopColor="#2A1470" /><stop offset="0.45" stopColor="#141A5C" /><stop offset="0.74" stopColor="#0B2C63" /><stop offset="0.75" stopColor="#070B26" /><stop offset="1" stopColor="#0E0A30" /></linearGradient>
      <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={CY} /><stop offset="0.5" stopColor={VIO} /><stop offset="1" stopColor={MG} /></linearGradient>
      <linearGradient id={`${id}-btn`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={BLU} /><stop offset="1" stopColor={VIO} /></linearGradient>
      <linearGradient id={`${id}-refl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" /><stop offset="0.32" stopColor="#FFFFFF" stopOpacity="0.02" /><stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
      <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2B2270" /><stop offset="1" stopColor="#0E0C2A" /></linearGradient>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F7D2B0" /><stop offset="1" stopColor="#D9A47A" /></linearGradient>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFF" stopOpacity="0" /><stop offset="0.5" stopColor="#FFF" stopOpacity="0.4" /><stop offset="1" stopColor="#FFF" stopOpacity="0" /></linearGradient>
      <linearGradient id={`${id}-beam`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={CY} stopOpacity="0.5" /><stop offset="1" stopColor={VIO} stopOpacity="0" /></linearGradient>
      <radialGradient id={`${id}-ball`} cx="38%" cy="34%" r="70%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor="#9DF4FF" /><stop offset="0.75" stopColor={CY} /><stop offset="1" stopColor="#1284E0" /></radialGradient>
      <radialGradient id={`${id}-face`} cx="50%" cy="38%" r="70%"><stop offset="0" stopColor="#1B2150" /><stop offset="0.6" stopColor="#0A0D24" /><stop offset="1" stopColor="#04050E" /></radialGradient>
      <radialGradient id={`${id}-gc`}><stop offset="0" stopColor={CY} stopOpacity="0.85" /><stop offset="0.4" stopColor={BLU} stopOpacity="0.3" /><stop offset="1" stopColor={BLU} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-gm`}><stop offset="0" stopColor="#FFB0F0" stopOpacity="0.85" /><stop offset="0.4" stopColor={MG} stopOpacity="0.3" /><stop offset="1" stopColor={MG} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-gv`}><stop offset="0" stopColor={VIO} stopOpacity="0.6" /><stop offset="1" stopColor={VIO} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-gg`}><stop offset="0" stopColor="#C8FFE0" stopOpacity="0.9" /><stop offset="0.4" stopColor={GRN} stopOpacity="0.32" /><stop offset="1" stopColor={GRN} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-gw`}><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" /><stop offset="0.35" stopColor="#BFF6FF" stopOpacity="0.45" /><stop offset="1" stopColor={CY} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-sh`}><stop offset="0" stopColor="#000" stopOpacity="0.75" /><stop offset="0.7" stopColor="#000" stopOpacity="0.3" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      <clipPath id={`${id}-cclip`}><rect width={CW} height={CH} rx={CR} /></clipPath>
    </defs>
  </svg>
);

// ---- the picture every frame shows: a neon ball one step further along its bounce --------------------------------
export const ballPos = (p: number, w: number, h: number): [number, number] => {
  const q = clamp01(p);
  return [w * (0.15 + 0.7 * q), h * 0.69 - Math.abs(Math.sin(q * Math.PI * 3)) * h * 0.4];
};
export const FrameArt: React.FC<{id: string; w: number; h: number; p: number; ghosts?: number; gstep?: number; trail?: number; dir?: number}> = ({id, w, h, p, ghosts = 0, gstep = 0.05, trail = 0, dir = 1}) => {
  const fl = h * 0.75, [bx, by] = ballPos(p, w, h), r = w * 0.075;
  const hgt = clamp01((fl - by) / (h * 0.4));
  return (
    <g>
      <rect width={w} height={h} fill={`url(#${id}-art)`} />
      <circle cx={w * 0.78} cy={h * 0.2} r={w * 0.42} fill={`url(#${id}-gm)`} opacity={0.4} />
      <circle cx={w * 0.78} cy={h * 0.2} r={w * 0.09} fill="#FF9BE6" opacity={0.5} />
      {/* neon floor grid */}
      <line x1={0} y1={fl} x2={w} y2={fl} stroke={CY} strokeWidth={h * 0.005} opacity={0.9} />
      {[0.06, 0.16, 0.32, 0.56, 0.9].map((k) => <line key={k} x1={0} y1={fl + (h - fl) * k} x2={w} y2={fl + (h - fl) * k} stroke={VIO} strokeWidth={h * 0.003} opacity={0.55} />)}
      {[-3, -2, -1, 0, 1, 2, 3].map((k) => <line key={k} x1={w / 2 + k * w * 0.07} y1={fl} x2={w / 2 + k * w * 0.42} y2={h} stroke={VIO} strokeWidth={h * 0.003} opacity={0.5} />)}
      {/* the whole path, dotted */}
      {Array.from({length: 22}).map((_, i) => {
        const [x, y] = ballPos(i / 21, w, h);
        return <circle key={i} cx={x} cy={y} r={w * 0.007} fill="#FFFFFF" opacity={0.22} />;
      })}
      {/* earlier stills (ghosts) */}
      {Array.from({length: ghosts}).map((_, i) => {
        const pp = p - dir * (i + 1) * gstep;
        if (pp < 0 || pp > 1) return null;
        const [x, y] = ballPos(pp, w, h);
        return <circle key={i} cx={x} cy={y} r={r * 0.92} fill={CY} fillOpacity={0.1} stroke={CY} strokeWidth={w * 0.006} opacity={0.75 - (i / ghosts) * 0.6} />;
      })}
      {/* smooth motion trail */}
      {Array.from({length: trail}).map((_, i) => {
        const pp = p - dir * (i + 1) * 0.012;
        if (pp < 0 || pp > 1) return null;
        const [x, y] = ballPos(pp, w, h);
        return <circle key={i} cx={x} cy={y} r={r * (1 - (i / trail) * 0.75)} fill={i % 2 ? MG : CY} opacity={0.34 * (1 - i / trail)} />;
      })}
      <ellipse cx={bx} cy={fl + h * 0.012} rx={r * (1.5 - hgt * 0.7)} ry={h * 0.011} fill={CY} opacity={0.75 - hgt * 0.55} />
      <circle cx={bx} cy={by} r={r * 3} fill={`url(#${id}-gc)`} opacity={0.8} />
      <circle cx={bx} cy={by} r={r * 1.14} fill="none" stroke={MG} strokeWidth={w * 0.008} opacity={0.9} />
      <circle cx={bx} cy={by} r={r} fill={`url(#${id}-ball)`} />
      <ellipse cx={bx - r * 0.3} cy={by - r * 0.38} rx={r * 0.34} ry={r * 0.2} fill="#FFFFFF" opacity={0.85} />
    </g>
  );
};

/** One glowing frame card (CW x CH). `pip` = which sprocket pip is lit (shows "a step further"). */
export const FrameCard: React.FC<{id: string; p: number; fog?: number; ghosts?: number; pip?: number; hot?: number; blank?: number; dir?: number}> = ({id, p, fog = 0, ghosts = 0, pip = 0, hot = 0, blank = 0, dir = 1}) => (
  <svg width={CW} height={CH} style={{overflow: 'visible', display: 'block'}}>
    <rect x={-9} y={-9} width={CW + 18} height={CH + 18} rx={CR + 9} fill={`url(#${id}-edge)`} opacity={0.28 + 0.4 * hot} />
    <rect x={-4} y={-4} width={CW + 8} height={CH + 8} rx={CR + 4} fill={`url(#${id}-edge)`} />
    <g clipPath={`url(#${id}-cclip)`}>
      <FrameArt id={id} w={CW} h={CH} p={p} ghosts={ghosts} dir={dir} />
      {blank > 0.01 ? <rect width={CW} height={CH} fill="#0A0D2C" opacity={blank} /> : null}
      {/* sprocket pips */}
      <rect y={CH - 62} width={CW} height={62} fill="#04051A" opacity={0.78} />
      {Array.from({length: 10}).map((_, i) => <rect key={i} x={36 + i * 54} y={CH - 44} width={38} height={24} rx={6} fill={i === ((pip % 10) + 10) % 10 ? CY : '#FFFFFF'} opacity={i === ((pip % 10) + 10) % 10 ? 1 : 0.16} />)}
      <rect width={CW} height={CH} fill={`url(#${id}-refl)`} />
      {fog > 0.01 ? <rect width={CW} height={CH} fill={INK} opacity={fog} /> : null}
    </g>
    <rect x={3} y={3} width={CW - 6} height={CH - 6} rx={CR - 3} fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.45} />
  </svg>
);

// ---- generic phone -------------------------------------------------------------------------------------------------
export const PhoneFront: React.FC<{id: string; w: number; h: number; r?: number; bz?: number; rim?: string; rimO?: number; children?: React.ReactNode}> = ({id, w, h, r = 120, bz = 22, rim = CY, rimO = 0, children}) => {
  const sw = w - 2 * bz, sh = h - 2 * bz;
  return (
    <svg width={w} height={h} style={{overflow: 'visible', display: 'block'}}>
      <defs><clipPath id={`${id}-pclip`}><rect width={sw} height={sh} rx={r - bz} /></clipPath></defs>
      {rimO > 0.01 ? <rect x={-14} y={-14} width={w + 28} height={h + 28} rx={r + 14} fill="none" stroke={rim} strokeWidth={16} opacity={0.5 * rimO} /> : null}
      <rect width={w} height={h} rx={r} fill={`url(#${id}-ti)`} />
      <rect x={4} y={4} width={w - 8} height={h - 8} rx={r - 4} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={2} />
      <rect x={bz * 0.45} y={bz * 0.45} width={w - bz * 0.9} height={h - bz * 0.9} rx={r - bz * 0.45} fill="#03040A" />
      <g transform={`translate(${bz},${bz})`} clipPath={`url(#${id}-pclip)`}>
        <rect width={sw} height={sh} fill={`url(#${id}-scr)`} />
        {children}
        <circle cx={sw / 2} cy={54} r={17} fill="#020308" /><circle cx={sw / 2 + 5} cy={50} r={4} fill="#26305A" />
        <rect width={sw} height={sh} fill={`url(#${id}-refl)`} />
      </g>
      {rimO > 0.01 ? <rect x={1} y={1} width={w - 2} height={h - 2} rx={r} fill="none" stroke={rim} strokeWidth={5} opacity={rimO} /> : null}
    </svg>
  );
};
/** Phone with real thickness: `tf` puts the phone's top-left corner (local 0,0) in the 3D stage. */
export const Phone3D: React.FC<{id: string; tf: string; w: number; h: number; r?: number; bz?: number; rim?: string; rimO?: number; depth?: number; children?: React.ReactNode}> = ({id, tf, w, h, r = 120, bz = 22, rim, rimO, depth = 34, children}) => (
  <>
    {[5, 4, 3, 2, 1].map((k) => (
      <L3 key={k} tf={`${tf} translateZ(${-(k * depth) / 5}px)`} w={w} h={h}>
        <div style={{width: w, height: h, borderRadius: r, boxSizing: 'border-box',
                     background: k === 5 ? '#07080E' : 'linear-gradient(100deg,#AEB5C6 0%,#2B2E3A 9%,#5A6070 50%,#20222C 91%,#B8BFD0 100%)'}} />
      </L3>
    ))}
    <L3 tf={tf} w={w} h={h}><PhoneFront id={id} w={w} h={h} r={r} bz={bz} rim={rim} rimO={rimO}>{children}</PhoneFront></L3>
  </>
);

// ---- gauge ------------------------------------------------------------------------------------------------------------
const GA0 = -220, GSW = 260, GMAX = 180;
export const gAng = (v: number) => GA0 + GSW * clamp01(v / GMAX);
const pol = (r: number, a: number): [number, number] => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = pol(r, a0), [x1, y1] = pol(r, a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};
/** Round dial drawn around (0,0). `val` 0..180 moves the needle; ticks are labelled 60 / 120 / 144 only. */
export const Gauge: React.FC<{id: string; R: number; color: string; label: string; val: number; lit?: number; lock?: number; readout?: string; sweep?: number}> = ({id, R, color, label, val, lit = 1, lock = 0, readout, sweep = 0}) => {
  const a = gAng(val), col = lock > 0.5 ? GRN : color;
  return (
    <g>
      <circle r={R * 1.5} fill={`url(#${id}-${lock > 0.5 ? 'gg' : color === MG ? 'gm' : 'gc'})`} opacity={0.2 + 0.5 * lit} />
      <circle r={R} fill={`url(#${id}-metal)`} />
      <circle r={R * 0.985} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={R * 0.012} />
      <circle r={R * 0.93} fill="#04050D" />
      <circle r={R * 0.9} fill={`url(#${id}-face)`} />
      <circle r={R * 0.915} fill="none" stroke={col} strokeWidth={R * 0.022} opacity={0.25 + 0.75 * lit} />
      {Array.from({length: 37}).map((_, i) => {
        const v = i * 5, aa = gAng(v), major = i % 6 === 0, on = v <= val;
        const [x0, y0] = pol(R * (major ? 0.68 : 0.73), aa), [x1, y1] = pol(R * 0.8, aa);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={on ? col : '#FFFFFF'} strokeWidth={R * (major ? 0.022 : 0.012)} strokeLinecap="round" opacity={on ? 0.45 + 0.55 * lit : 0.3} />;
      })}
      {[60, 120, 144].map((v) => {
        const [x, y] = pol(R * 0.56, gAng(v));
        return <text key={v} x={x} y={y + R * 0.035} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={R * 0.1} fill="#C9D4FF" opacity={0.55 + 0.4 * lit}>{v}</text>;
      })}
      <path d={arc(R * 0.845, GA0, GA0 + GSW)} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={R * 0.05} strokeLinecap="round" />
      {val > 1 ? <path d={arc(R * 0.845, GA0, a)} fill="none" stroke={col} strokeWidth={R * 0.05} strokeLinecap="round" opacity={0.4 + 0.6 * lit} /> : null}
      {sweep > 0.01 && sweep < 0.999 ? <path d={arc(R * 1.07, -90, -90 + 359.9 * sweep)} fill="none" stroke="#FFFFFF" strokeWidth={R * 0.03} strokeLinecap="round" opacity={0.9} /> : null}
      {/* readout + label */}
      {readout ? <text y={R * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={R * 0.34} fill="#FFFFFF">{readout}</text> : null}
      <text y={readout ? R * 0.6 : R * 0.5} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={readout ? R * 0.2 : R * 0.3} fill={col} opacity={0.6 + 0.4 * lit}>{label}</text>
      {/* needle */}
      <g transform={`rotate(${a.toFixed(2)})`}>
        <polygon points={`${-R * 0.14},${-R * 0.03} ${R * 0.76},${-R * 0.008} ${R * 0.76},${R * 0.008} ${-R * 0.14},${R * 0.03}`} fill={col} opacity={0.35} transform="translate(0,5)" />
        <polygon points={`${-R * 0.14},${-R * 0.028} ${R * 0.78},${-R * 0.007} ${R * 0.78},${R * 0.007} ${-R * 0.14},${R * 0.028}`} fill="#FFFFFF" />
        <circle cx={R * 0.78} cy={0} r={R * 0.03} fill={col} />
      </g>
      <circle r={R * 0.1} fill={`url(#${id}-metal)`} /><circle r={R * 0.05} fill={col} />
      <path d={`M${-R * 0.8},${-R * 0.25} A${R * 0.86},${R * 0.86} 0 0 1 ${R * 0.45},${-R * 0.73} A${R * 1.3},${R * 1.3} 0 0 0 ${-R * 0.8},${-R * 0.25} Z`} fill="#FFFFFF" opacity={0.07} />
      {lock > 0.01 ? <circle r={R * 1.06} fill="none" stroke={GRN} strokeWidth={R * 0.04} opacity={lock} /> : null}
    </g>
  );
};

// ---- fingertip (points up; tip at 0,0) -------------------------------------------------------------------------------
export const Finger: React.FC<{id: string; press?: number}> = ({id, press = 0}) => (
  <g>
    <ellipse cx={30} cy={120} rx={130} ry={60} fill="#000" opacity={0.3 * press} />
    <path d="M-62,40 C-62,-20 62,-20 62,40 L74,520 C40,640 -70,640 -86,520 Z" fill={`url(#${id}-skin)`} />
    <path d="M-62,40 C-62,-20 62,-20 62,40 L64,120 C20,150 -30,150 -66,120 Z" fill="#FBE0C6" opacity={0.55} />
    <path d="M-40,30 C-40,-4 40,-4 40,30 L40,84 C14,98 -14,98 -40,84 Z" fill="#FFEFE3" stroke="#E8B692" strokeWidth={3} />
    <path d="M-60,300 Q0,318 68,300" fill="none" stroke="#C98F66" strokeWidth={4} opacity={0.6} /><path d="M-64,330 Q0,348 70,330" fill="none" stroke="#C98F66" strokeWidth={3} opacity={0.4} />
    <path d="M-86,520 C-160,560 -200,700 -160,900 L260,900 C300,700 240,560 74,520 Z" fill={`url(#${id}-skin)`} />
  </g>
);
