// S03 "TIME LANES" - a premium timing instrument: three recessed glass lanes (60 / 120 / 144 Hz) in a dark anodised
// panel. In each lane a light bar is exactly as long as one frame's time (16.7 : 8.3 : 6.9), a stopwatch ring sweeps
// once per frame time and a counter lands on the number when the voice says it.
// Camera: home = lane 1 (with the hero read-out above it); ONE move on "120" to the framing of all three lanes.
// At the end the frame centre sits on lane 2's glowing pixel-matrix bar (S04 enters with a portal from the centre).
import React from 'react';
import type {WorldDef, WorldDrawProps, Beat} from '../../../src/kit/explainer/world';
import {Burst, Ripple} from '../../../src/kit/explainer/world';
import {sp, mix, shade, tint} from '../../../src/kit/explainer/tokens';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

const ID = 's03';
const WW = 2400, WH = 3200;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ss = (x: number, a: number, b: number) => {
  const q = clamp01((x - a) / (b - a));
  return q * q * (3 - 2 * q);
};
const frac = (x: number) => x - Math.floor(x);
const rnd = (s: number) => frac(Math.sin(s * 12.9898 + 78.233) * 43758.5453);
const decay = (t: number, a: number, d = 7) => (t >= a ? Math.exp(-(t - a) / d) : 0);
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const wt = (beats: Beat[], word: string, d: number) => beats.find((b) => clean(b.word || b.w) === clean(word))?.t ?? d;

// ---- geometry (world px) ---------------------------------------------------------------------------------------------
const LX0 = 680, LX1 = 1720, LH = 320;            // lane channel
const XB = 980;                                   // where every bar starts (t = 0)
const K = 42;                                     // px per millisecond: the three bars are exactly 16.7 : 8.3 : 6.9
const BAR_Y = -50, BAR_H = 120;                   // bar inside the lane (relative to the lane centre)
const RING_X = 830, RING_R = 104;
type Lane = {hz: string; ms: number; cy: number; c: string; hot: string; deep: string; tag: string};
const LANES: Lane[] = [
  {hz: '60', ms: 16.7, cy: 1100, c: '#FFB23E', hot: '#FFF3D6', deep: '#7A3E00', tag: 'A'},
  {hz: '120', ms: 8.3, cy: 1500, c: '#35D8FF', hot: '#E9FCFF', deep: '#004E6E', tag: 'B'},
  {hz: '144', ms: 6.9, cy: 1900, c: '#A98BFF', hot: '#F1ECFF', deep: '#34208A', tag: 'C'},
];
const RULER_Y = 2150;

const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => `${(cx + r * Math.sin(a)).toFixed(1)} ${(cy - r * Math.cos(a)).toFixed(1)}`;
  return `M${p(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`;
};

type LaneState = {on: number; len: number; val: number; snapAt: number; hzAt: number; sweepAt: number; phase: number; done: number};
const laneState = (t: number, beats: Beat[], i: number): LaneState => {
  const hzAt = wt(beats, ['60', '120', '144'][i], [15, 114, 172][i]);
  const snapAt = wt(beats, ['16.7', '8.3', 'seven'][i], [52, 141.5, 205.5][i]);
  const sweepAt = i === 0 ? wt(beats, 'gets', 47) : i === 2 ? wt(beats, 'under', 199) : snapAt - 6;
  const L = LANES[i].ms * K;
  const pre = 0.6 * ss(t, sweepAt, snapAt);                       // the bar reaches out while the voice gets to the number
  const snap = sp(t, snapAt, 'bouncy');
  const len = L * (pre + (1 - pre) * snap);
  const val = LANES[i].ms * (1 - Math.pow(1 - clamp01((t - snapAt) / 7), 3));
  const T = LANES[i].ms * 2;                                       // slow-motion frame time (design frames): 33.4 / 16.6 / 13.8
  return {on: sp(t, hzAt, 'settle'), len, val, snapAt, hzAt, sweepAt, phase: t > snapAt ? frac((t - snapAt) / T) : 0, done: ss(t, snapAt, snapAt + 5)};
};

// ---- one lane ----------------------------------------------------------------------------------------------------------
const LaneArt: React.FC<{i: number; t: number; beats: Beat[]}> = ({i, t, beats}) => {
  const ln = LANES[i], st = laneState(t, beats, i);
  const cy = ln.cy, y0 = cy - LH / 2, on = st.on;
  const by = cy + BAR_Y, L = ln.ms * K;
  const tMs = wt(beats, 'milliseconds', 78);
  const msHit = i === 0 ? decay(t, tMs, 9) : 0;
  const dimA = i === 0 ? sp(t, tMs, 'pop') : st.done;
  const snapFlash = decay(t, st.snapAt, 6);
  const hzFlash = decay(t, st.hzAt, 8);
  const eachWave = i === 0 ? wt(beats, 'each', 33.5) : -999;
  // ruler ticks: lit while the bar covers them
  let lit = '', dim = '';
  for (let m = 0; m <= 34; m++) {
    const x = XB + (m / 2) * K, major = m % 2 === 0;
    const seg = `M${x.toFixed(1)} ${cy + 86}v${major ? 26 : 14}`;
    if ((m / 2) * K <= st.len + 0.5 && st.len > 2) lit += seg; else dim += seg;
  }
  const ringA = st.phase * Math.PI * 2;
  const armA = t > st.snapAt ? ringA : 0.9 * Math.PI * 2 * 0.6 * ss(t, st.sweepAt, st.snapAt);
  const txt = st.val >= ln.ms - 0.04 ? ln.ms.toFixed(1) : st.val.toFixed(1);
  const pulseX = XB + st.phase * L;
  return (
    <g>
      {/* light pool on the panel behind an active lane */}
      <ellipse cx={1200} cy={cy} rx={900} ry={330} fill={`url(#${ID}-pool${i})`} opacity={0.55 * on + 0.35 * snapFlash} />
      {/* bezel + recessed glass channel */}
      <rect x={LX0 - 22} y={y0 - 22 + 14} width={LX1 - LX0 + 44} height={LH + 44} rx={62} fill="#000" opacity={0.5} />
      <rect x={LX0 - 22} y={y0 - 22} width={LX1 - LX0 + 44} height={LH + 44} rx={62} fill={`url(#${ID}-bezel)`} />
      <rect x={LX0 - 22} y={y0 - 22} width={LX1 - LX0 + 44} height={LH + 44} rx={62} fill="none" stroke="#C9D6F2" strokeOpacity={0.35} strokeWidth={2} />
      <rect x={LX0} y={y0} width={LX1 - LX0} height={LH} rx={44} fill={`url(#${ID}-glass)`} />
      <rect x={LX0} y={y0} width={LX1 - LX0} height={LH} rx={44} fill={`url(#${ID}-tint${i})`} opacity={0.5 * on} />
      <rect x={LX0} y={y0} width={LX1 - LX0} height={LH} rx={44} fill="none" stroke="#000" strokeOpacity={0.8} strokeWidth={6} />
      <rect x={LX0 + 3} y={y0 + 3} width={LX1 - LX0 - 6} height={LH - 6} rx={41} fill="none" stroke={mix('#3A465E', ln.c, on)} strokeOpacity={0.3 + 0.5 * on} strokeWidth={2.5} />
      {/* racing edge lights: faster lanes race faster */}
      {on > 0.02 ? (
        <rect x={LX0 + 3} y={y0 + 3} width={LX1 - LX0 - 6} height={LH - 6} rx={41} fill="none" stroke={ln.hot} strokeWidth={4} strokeLinecap="round"
              strokeDasharray="70 1180" strokeDashoffset={-t * (1800 / ln.ms) * 0.09} opacity={0.85 * on} />
      ) : null}
      {hzFlash > 0.02 ? <rect x={LX0} y={y0} width={LX1 - LX0} height={LH} rx={44} fill={ln.c} opacity={0.22 * hzFlash} /> : null}
      {/* screws + engraving */}
      {[[LX0 - 2, y0 - 2], [LX1 + 2, y0 - 2], [LX0 - 2, y0 + LH + 2], [LX1 + 2, y0 + LH + 2]].map(([x, y], k) => (
        <g key={k}><circle cx={x} cy={y} r={9} fill="#1B2232" stroke="#8793AD" strokeWidth={1.5} /><line x1={x - 5} y1={y - 3} x2={x + 5} y2={y + 3} stroke="#05070C" strokeWidth={2} /></g>
      ))}
      <text x={LX1 - 40} y={y0 + 46} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={20} letterSpacing={4} fill={mix('#5C6A86', ln.hot, on)} opacity={0.9}>{`LANE ${ln.tag} · ONE PICTURE`}</text>
      <circle cx={LX1 - 404} cy={y0 + 39} r={7} fill={mix('#2A3346', ln.c, on)} />
      {on > 0.05 ? <circle cx={LX1 - 404} cy={y0 + 39} r={18} fill={`url(#${ID}-dot${i})`} opacity={on * (0.6 + 0.4 * Math.sin(t * 0.5 + i))} /> : null}

      {/* ---- the stopwatch ring ---- */}
      <rect x={RING_X - 15} y={cy - RING_R - 30} width={30} height={26} rx={6} fill="#2B3447" stroke="#8793AD" strokeWidth={1.5} />
      <circle cx={RING_X} cy={cy} r={RING_R + 14} fill="#05080F" stroke={`url(#${ID}-bezel)`} strokeWidth={8} />
      <circle cx={RING_X} cy={cy} r={RING_R + 18} fill="none" stroke="#C9D6F2" strokeOpacity={0.3} strokeWidth={1.5} />
      <circle cx={RING_X} cy={cy} r={RING_R} fill={`url(#${ID}-dial${i})`} opacity={0.25 + 0.75 * on} />
      {Array.from({length: 48}).map((_, k) => {
        const a = (k / 48) * Math.PI * 2, r0 = RING_R - (k % 4 === 0 ? 20 : 11);
        const passed = t > st.snapAt ? k / 48 <= st.phase : false;
        const wave = eachWave > 0 ? decay(t, eachWave + k * 0.12, 3) : 0;
        return <line key={k} x1={RING_X + r0 * Math.sin(a)} y1={cy - r0 * Math.cos(a)} x2={RING_X + (RING_R - 4) * Math.sin(a)} y2={cy - (RING_R - 4) * Math.cos(a)}
                     stroke={passed || wave > 0.3 ? ln.hot : mix('#465270', ln.c, on * 0.6)} strokeWidth={k % 4 === 0 ? 3.5 : 2} opacity={0.5 + 0.5 * on} />;
      })}
      {armA > 0.01 ? <path d={arc(RING_X, cy, RING_R + 4, 0, Math.min(armA, Math.PI * 2 - 0.001))} fill="none" stroke={ln.c} strokeWidth={10} strokeLinecap="round" opacity={0.95 * on} /> : null}
      {armA > 0.01 ? <path d={arc(RING_X, cy, RING_R + 4, 0, Math.min(armA, Math.PI * 2 - 0.001))} fill="none" stroke={ln.c} strokeWidth={26} strokeLinecap="round" opacity={0.2 * on} /> : null}
      {on > 0.05 ? (
        <g opacity={on}>
          <line x1={RING_X} y1={cy} x2={RING_X + (RING_R - 26) * Math.sin(armA)} y2={cy - (RING_R - 26) * Math.cos(armA)} stroke={ln.hot} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
          <circle cx={RING_X + (RING_R + 4) * Math.sin(armA)} cy={cy - (RING_R + 4) * Math.cos(armA)} r={26} fill={`url(#${ID}-dot${i})`} />
          <circle cx={RING_X + (RING_R + 4) * Math.sin(armA)} cy={cy - (RING_R + 4) * Math.cos(armA)} r={7} fill="#FFFFFF" />
        </g>
      ) : null}
      <circle cx={RING_X} cy={cy} r={52} fill="#070B14" stroke={mix('#3A465E', ln.c, on)} strokeWidth={2} />
      <text x={RING_X} y={cy + 10} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={ln.hz.length > 2 ? 44 : 54} fill={mix('#6B7892', ln.hot, on)}
            transform={`translate(${RING_X} ${cy}) scale(${1 + 0.16 * hzFlash}) translate(${-RING_X} ${-cy})`}>{ln.hz}</text>
      <text x={RING_X} y={cy + 36} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={19} letterSpacing={3} fill={mix('#5C6A86', ln.c, on)}>Hz</text>

      {/* ---- track + ruler ---- */}
      <rect x={XB - 10} y={by - 10} width={17 * K + 20} height={BAR_H + 20} rx={20} fill="#03060C" stroke="#1E2A40" strokeWidth={2} />
      <rect x={XB - 10} y={by - 10} width={17 * K + 20} height={BAR_H + 20} rx={20} fill={`url(#${ID}-pix)`} opacity={0.5} />
      <line x1={XB} y1={by - 22} x2={XB} y2={by + BAR_H + 62} stroke="#C9D6F2" strokeWidth={3} opacity={0.55} />
      <path d={dim} stroke="#4A5670" strokeWidth={2.5} opacity={0.8} fill="none" />
      <path d={lit} stroke={ln.hot} strokeWidth={3} fill="none" />
      {/* ---- the light bar: one frame's time ---- */}
      {st.len > 2 ? (
        <g>
          <rect x={XB - 60} y={by - 90} width={st.len + 120} height={BAR_H + 180} fill={`url(#${ID}-halo${i})`} opacity={0.75 + 0.25 * snapFlash} />
          <ellipse cx={XB + st.len} cy={by + BAR_H / 2} rx={110} ry={150} fill={`url(#${ID}-dot${i})`} opacity={0.5 + 0.5 * snapFlash} />
          <rect x={XB} y={by} width={st.len} height={BAR_H} rx={14} fill={`url(#${ID}-bar${i})`} />
          <rect x={XB} y={by} width={st.len} height={BAR_H} rx={14} fill={`url(#${ID}-pix)`} />
          <rect x={XB + 8} y={by + 10} width={Math.max(0, st.len - 16)} height={30} rx={12} fill="#FFFFFF" opacity={0.3} />
          {/* a packet of light runs the bar once per frame time */}
          {t > st.snapAt + 2 ? (
            <g clipPath={`url(#${ID}-clip${i})`}>
              <rect x={pulseX - 150} y={by} width={170} height={BAR_H} fill={`url(#${ID}-streak)`} opacity={0.9} />
            </g>
          ) : null}
          <rect x={XB} y={by} width={st.len} height={BAR_H} rx={14} fill="none" stroke={ln.hot} strokeWidth={3} opacity={0.9} />
          {snapFlash > 0.02 ? <rect x={XB} y={by} width={st.len} height={BAR_H} rx={14} fill="#FFFFFF" opacity={0.7 * snapFlash} /> : null}
          {/* end marker */}
          <line x1={XB + st.len} y1={by - 24} x2={XB + st.len} y2={by + BAR_H + 62} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
          <path d={`M${XB + st.len - 13} ${by - 40} h26 l-13 18 Z`} fill={ln.hot} />
          {/* reflection in the glass */}
          <rect x={XB} y={by + BAR_H + 14} width={st.len} height={20} rx={8} fill={ln.c} opacity={0.16} />
        </g>
      ) : null}
      {/* dimension line under the bar ("milliseconds") */}
      {dimA > 0.01 && st.len > 40 ? (
        <g opacity={dimA}>
          <line x1={XB + 8} x2={XB + 8 + (st.len - 16) * dimA} y1={by + BAR_H + 48} y2={by + BAR_H + 48} stroke={ln.hot} strokeWidth={3} />
          <path d={`M${XB + 2} ${by + BAR_H + 48} l16 -9 v18 Z`} fill={ln.hot} />
          <path d={`M${XB + st.len - 2} ${by + BAR_H + 48} l-16 -9 v18 Z`} fill={ln.hot} opacity={dimA} />
        </g>
      ) : null}
      {/* ---- the counter ---- */}
      <g opacity={0.35 + 0.65 * on}>
        <text x={XB} y={cy - 78} fontFamily={FONT} fontWeight={800} fontSize={86} letterSpacing={-1} fill={mix('#56627C', st.val > 0.05 ? ln.hot : ln.c, on)}
              style={{fontVariantNumeric: 'tabular-nums'}}>{txt}</text>
        <text x={XB + 196} y={cy - 78} fontFamily={FONT} fontWeight={700} fontSize={50 * (1 + 0.22 * msHit)} fill={mix('#56627C', msHit > 0.1 ? '#FFFFFF' : ln.c, on)}>ms</text>
      </g>
      {snapFlash > 0.02 ? <ellipse cx={XB + 130} cy={cy - 106} rx={230} ry={80} fill={`url(#${ID}-dot${i})`} opacity={0.6 * snapFlash} /> : null}
      {i === 2 ? (() => {
        const a = sp(t, st.sweepAt, 'pop');
        if (a < 0.01) return null;
        return (
          <g opacity={a} transform={`translate(${XB + 300 + (1 - a) * 30} ${cy - 104})`}>
            <rect x={0} y={-30} width={196} height={56} rx={28} fill="#120B33" stroke={ln.c} strokeWidth={2.5} />
            <text x={98} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={25} letterSpacing={3} fill={ln.hot}>UNDER 7</text>
          </g>
        );
      })() : null}
      <Burst t={t} at={st.snapAt} x={XB + L} y={by + BAR_H / 2} color={ln.hot} n={18} r={170} />
      <Ripple t={t} at={st.hzAt} x={RING_X} y={cy} color={ln.c} r={260} />
      {i === 0 ? <Ripple t={t} at={tMs} x={XB + 222} y={cy - 96} color={ln.hot} r={150} /> : null}
    </g>
  );
};

// ---- the hero read-out above lane 1 (home framing only) ----------------------------------------------------------------
const Hero: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const st = laneState(t, beats, 0), ln = LANES[0];
  const tEach = wt(beats, 'each', 33.5), tPic = wt(beats, 'picture', 39), tGets = wt(beats, 'gets', 47), tMs = wt(beats, 'milliseconds', 78);
  const out = 1 - ss(t, wt(beats, '120', 114) - 6, wt(beats, '120', 114) + 12);
  if (out < 0.01) return null;
  const X = 700, Y = 584, PW = 1000, PH = 318;
  const sx = 742, sy = 626, sw = 380, sh = 234;                    // the "picture" screen
  const picOn = sp(t, tPic, 'pop'), each = sp(t, tEach, 'pop');
  const frame = t > st.snapAt ? Math.floor((t - st.snapAt) / (ln.ms * 2)) : 0;
  const ballX = sx + 60 + ((frame * 62) % (sw - 120));
  const flip = t > st.snapAt ? decay(t, st.snapAt + frame * ln.ms * 2, 3) : 0;
  const txt = st.val >= ln.ms - 0.04 ? ln.ms.toFixed(1) : st.val.toFixed(1);
  const msHit = decay(t, tMs, 9);
  const flow = ss(t, tPic + 2, tGets + 3);
  return (
    <g opacity={out}>
      <rect x={X - 10} y={Y + 8} width={PW + 40} height={PH} rx={48} fill="#000" opacity={0.45} />
      <rect x={X} y={Y} width={PW} height={PH} rx={48} fill={`url(#${ID}-bezel)`} />
      <rect x={X + 14} y={Y + 14} width={PW - 28} height={PH - 28} rx={36} fill={`url(#${ID}-glass)`} stroke="#000" strokeOpacity={0.8} strokeWidth={5} />
      <rect x={X + 14} y={Y + 14} width={PW - 28} height={PH - 28} rx={36} fill={`url(#${ID}-tint0)`} opacity={0.45 * st.on} />
      <path d={`M${X + 60} ${Y + 16} H${X + PW - 60}`} stroke="#DCE8FF" strokeWidth={2} opacity={0.35} />
      {/* stack of pictures behind the screen ("each") */}
      {[2, 1].map((k) => (
        <rect key={k} x={sx + k * 16 * each} y={sy - k * 12 * each} width={sw} height={sh} rx={20} fill="#0B1220" stroke={ln.c} strokeOpacity={0.5 * each} strokeWidth={2} opacity={0.75 * each} />
      ))}
      {/* the picture: a glowing mini display; its ball steps once per frame */}
      <rect x={sx - 8} y={sy - 8} width={sw + 16} height={sh + 16} rx={26} fill="#04070D" stroke="#8793AD" strokeWidth={2} />
      <g clipPath={`url(#${ID}-scr)`}>
        <rect x={sx} y={sy} width={sw} height={sh} fill={`url(#${ID}-sky)`} opacity={0.4 + 0.6 * Math.max(st.on * 0.6, picOn)} />
        <circle cx={sx + 285} cy={sy + 70} r={30} fill="#FFE9B0" opacity={0.9} />
        <path d={`M${sx} ${sy + sh} L${sx + 90} ${sy + 118} L${sx + 170} ${sy + 176} L${sx + 250} ${sy + 96} L${sx + sw} ${sy + 200} V${sy + sh} Z`} fill="#161F3D" />
        <path d={`M${sx} ${sy + sh} L${sx + 120} ${sy + 170} L${sx + 230} ${sy + 206} L${sx + sw} ${sy + 160} V${sy + sh} Z`} fill="#0A1024" />
        <circle cx={ballX} cy={sy + 160} r={22} fill={`url(#${ID}-ball)`} />
        <rect x={sx} y={sy} width={sw} height={sh} fill={`url(#${ID}-pix)`} opacity={0.6} />
        <rect x={sx} y={sy} width={sw} height={sh} fill="#FFFFFF" opacity={0.5 * flip + 0.5 * decay(t, tPic, 5)} />
        <path d={`M${sx} ${sy} h${sw * 0.55} l-90 ${sh} h${-sw * 0.55 + 90} Z`} fill="#FFFFFF" opacity={0.06} />
      </g>
      <rect x={sx} y={sy} width={sw} height={sh} rx={18} fill="none" stroke={mix('#5C6A86', ln.hot, picOn)} strokeWidth={3} />
      {picOn > 0.02 ? <rect x={sx - 14} y={sy - 14} width={sw + 28} height={sh + 28} rx={30} fill="none" stroke={ln.c} strokeWidth={10} opacity={0.25 * picOn + 0.5 * decay(t, tPic, 6)} /> : null}
      {/* the hero counter */}
      <text x={1180} y={Y + 84} fontFamily={MONO} fontWeight={600} fontSize={26} letterSpacing={6} fill={mix('#5C6A86', ln.hot, st.on)}>TIME PER PICTURE</text>
      <line x1={1180} x2={1650} y1={Y + 104} y2={Y + 104} stroke={mix('#2E3A52', ln.c, st.on)} strokeWidth={2} opacity={0.8} />
      <text x={1172} y={Y + 262} fontFamily={FONT} fontWeight={800} fontSize={178} letterSpacing={-4} fill={mix('#4A5670', st.val > 0.05 ? ln.hot : ln.c, 0.3 + 0.7 * st.on)} style={{fontVariantNumeric: 'tabular-nums'}}>{txt}</text>
      <text x={1560} y={Y + 262} fontFamily={FONT} fontWeight={700} fontSize={70 * (1 + 0.2 * msHit)} fill={mix('#4A5670', msHit > 0.1 ? '#FFFFFF' : ln.c, 0.3 + 0.7 * st.on)}>ms</text>
      {st.val > 0.05 ? <ellipse cx={1400} cy={Y + 200} rx={330} ry={130} fill={`url(#${ID}-dot0)`} opacity={0.25 + 0.5 * decay(t, st.snapAt, 7) + 0.4 * msHit} /> : null}
      {/* feed line: the picture drops into the lane, and its time starts */}
      <path d={`M${RING_X} ${Y + PH - 6} V${LANES[0].cy - RING_R - 34}`} stroke="#33405A" strokeWidth={8} strokeLinecap="round" />
      {flow > 0.01 && flow < 0.999 ? <circle cx={RING_X} cy={lerp(Y + PH - 6, LANES[0].cy - RING_R - 34, flow)} r={22} fill={`url(#${ID}-dot0)`} /> : null}
      {flow > 0.01 ? <path d={`M${RING_X} ${Y + PH - 6} V${lerp(Y + PH - 6, LANES[0].cy - RING_R - 34, flow)}`} stroke={ln.c} strokeWidth={4} strokeLinecap="round" /> : null}
    </g>
  );
};

// ---- the panel, the comparison ruler and the plate ---------------------------------------------------------------------
const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const states = LANES.map((_, i) => laneState(t, beats, i));
  const sweepX = lerp(-400, WW + 400, frac(t / 170));
  return (
    <svg width={WW} height={WH} viewBox={`0 0 ${WW} ${WH}`} style={{position: 'absolute', left: 0, top: 0, display: 'block'}}>
      <defs>
        <linearGradient id={`${ID}-panel`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1A2236" /><stop offset="0.45" stopColor="#0E1422" /><stop offset="1" stopColor="#070A12" /></linearGradient>
        <pattern id={`${ID}-brush`} width={900} height={6} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={900} height={1} fill="#FFFFFF" opacity={0.035} /><rect x={120} y={3} width={520} height={1} fill="#000000" opacity={0.22} /><rect x={500} y={4.5} width={400} height={0.8} fill="#FFFFFF" opacity={0.03} />
        </pattern>
        <pattern id={`${ID}-pix`} width={9} height={9} patternUnits="userSpaceOnUse"><rect x={0} y={0} width={9} height={1.6} fill="#000" opacity={0.3} /><rect x={0} y={0} width={1.6} height={9} fill="#000" opacity={0.3} /></pattern>
        <linearGradient id={`${ID}-bezel`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8B98B4" /><stop offset="0.25" stopColor="#3B465C" /><stop offset="0.6" stopColor="#1A2130" /><stop offset="1" stopColor="#566279" /></linearGradient>
        <linearGradient id={`${ID}-glass`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#04060B" /><stop offset="0.5" stopColor="#0A1020" /><stop offset="1" stopColor="#111A30" /></linearGradient>
        <linearGradient id={`${ID}-streak`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0} /><stop offset="0.85" stopColor="#FFFFFF" stopOpacity={0.85} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${ID}-sheen`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#BFD2FF" stopOpacity={0} /><stop offset="0.5" stopColor="#BFD2FF" stopOpacity={0.07} /><stop offset="1" stopColor="#BFD2FF" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${ID}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2B3FA8" /><stop offset="0.55" stopColor="#B4559E" /><stop offset="1" stopColor="#FFB067" /></linearGradient>
        <radialGradient id={`${ID}-ball`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.5" stopColor="#FFD27A" /><stop offset="1" stopColor="#C56A10" /></radialGradient>
        <clipPath id={`${ID}-scr`}><rect x={742} y={626} width={380} height={234} rx={18} /></clipPath>
        <radialGradient id={`${ID}-vig`} gradientUnits="userSpaceOnUse" cx={1200} cy={1500} r={1700}><stop offset="0.45" stopColor="#02040A" stopOpacity={0} /><stop offset="1" stopColor="#02040A" stopOpacity={0.8} /></radialGradient>
        {LANES.map((ln, i) => (
          <React.Fragment key={i}>
            <radialGradient id={`${ID}-pool${i}`}><stop offset="0" stopColor={ln.c} stopOpacity={0.42} /><stop offset="0.5" stopColor={ln.c} stopOpacity={0.12} /><stop offset="1" stopColor={ln.c} stopOpacity={0} /></radialGradient>
            <radialGradient id={`${ID}-dot${i}`}><stop offset="0" stopColor={ln.hot} stopOpacity={0.95} /><stop offset="0.35" stopColor={ln.c} stopOpacity={0.45} /><stop offset="1" stopColor={ln.c} stopOpacity={0} /></radialGradient>
            <radialGradient id={`${ID}-dial${i}`}><stop offset="0" stopColor={shade(ln.c, 0.2)} /><stop offset="0.75" stopColor={shade(ln.c, 0.12)} /><stop offset="1" stopColor={shade(ln.c, 0.34)} /></radialGradient>
            <linearGradient id={`${ID}-tint${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ln.c} stopOpacity={0.02} /><stop offset="1" stopColor={ln.c} stopOpacity={0.3} /></linearGradient>
            <linearGradient id={`${ID}-bar${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tint(ln.c, 0.55)} /><stop offset="0.3" stopColor={ln.hot} /><stop offset="0.6" stopColor={ln.c} /><stop offset="1" stopColor={mix(ln.c, ln.deep, 0.6)} /></linearGradient>
            <linearGradient id={`${ID}-halo${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ln.c} stopOpacity={0} /><stop offset="0.5" stopColor={ln.c} stopOpacity={0.5} /><stop offset="1" stopColor={ln.c} stopOpacity={0} /></linearGradient>
            <clipPath id={`${ID}-clip${i}`}><rect x={XB} y={ln.cy + BAR_Y} width={ln.ms * K} height={BAR_H} rx={14} /></clipPath>
          </React.Fragment>
        ))}
      </defs>
      {/* the instrument panel */}
      <rect width={WW} height={WH} fill={`url(#${ID}-panel)`} />
      <rect width={WW} height={WH} fill={`url(#${ID}-brush)`} />
      <rect x={sweepX - 500} y={0} width={1000} height={WH} fill={`url(#${ID}-sheen)`} transform="skewX(-18)" />
      {/* panel seams, rails and vents */}
      {[560, 1840].map((x, k) => (
        <g key={k}>
          <rect x={x - 5} y={0} width={10} height={WH} fill="#03050A" /><line x1={x + 6} x2={x + 6} y1={0} y2={WH} stroke="#8793AD" strokeWidth={1.5} opacity={0.35} />
          {Array.from({length: 26}).map((_, j) => <circle key={j} cx={x + (k ? 60 : -60)} cy={300 + j * 110} r={7} fill="#05080F" stroke="#5C6A86" strokeWidth={1.5} />)}
          {Array.from({length: 40}).map((_, j) => <rect key={j} x={x + (k ? 110 : -310)} y={420 + j * 62} width={200} height={10} rx={5} fill="#04060B" stroke="#2A3448" strokeWidth={1} opacity={0.9} />)}
        </g>
      ))}
      {LANES.map((ln, i) => <line key={i} x1={LX0 - 22} x2={560} y1={ln.cy} y2={ln.cy} stroke={mix('#2A3448', ln.c, states[i].on)} strokeWidth={6} opacity={0.85} />)}
      {LANES.map((ln, i) => (states[i].on > 0.02 ? <line key={i} x1={LX0 - 22} x2={560} y1={ln.cy} y2={ln.cy} stroke={ln.hot} strokeWidth={3} strokeDasharray="14 22" strokeDashoffset={-t * 5} opacity={states[i].on} /> : null))}
      <line x1={1200} x2={1200} y1={2082} y2={RULER_Y - 30} stroke="#2A3448" strokeWidth={6} />

      <Hero t={t} beats={beats} />
      {[0, 1, 2].map((i) => <LaneArt key={i} i={i} t={t} beats={beats} />)}

      {/* comparison board: every bar drops its end onto one shared scale */}
      <rect x={LX0 - 22} y={RULER_Y - 30 + 14} width={LX1 - LX0 + 44} height={330} rx={56} fill="#000" opacity={0.5} />
      <rect x={LX0 - 22} y={RULER_Y - 30} width={LX1 - LX0 + 44} height={330} rx={56} fill={`url(#${ID}-bezel)`} />
      <rect x={LX0} y={RULER_Y - 8} width={LX1 - LX0} height={286} rx={38} fill={`url(#${ID}-glass)`} stroke="#000" strokeOpacity={0.8} strokeWidth={5} />
      <text x={LX0 + 46} y={RULER_Y + 40} fontFamily={MONO} fontWeight={600} fontSize={22} letterSpacing={5} fill="#8793AD">FRAME TIME · SIDE BY SIDE</text>
      {Array.from({length: 35}).map((_, m) => <line key={m} x1={XB + (m / 2) * K} x2={XB + (m / 2) * K} y1={RULER_Y + 232} y2={RULER_Y + (m % 2 ? 246 : 258)} stroke="#6B7892" strokeWidth={2.5} />)}
      <line x1={XB} x2={XB + 17 * K} y1={RULER_Y + 232} y2={RULER_Y + 232} stroke="#6B7892" strokeWidth={2.5} />
      <line x1={XB} x2={XB} y1={RULER_Y + 60} y2={RULER_Y + 258} stroke="#C9D6F2" strokeWidth={3} opacity={0.55} />
      {LANES.map((ln, i) => {
        const a = states[i].done, on = states[i].on;
        const x = XB + ln.ms * K, yb = RULER_Y + 70 + i * 52;
        return (
          <g key={i}>
            <rect x={XB} y={yb} width={17 * K} height={36} rx={10} fill="#03060C" stroke="#1E2A40" strokeWidth={2} />
            <text x={XB - 22} y={yb + 27} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={30} fill={mix('#56627C', ln.c, on)}>{`${ln.hz} Hz`}</text>
            {a > 0.01 ? (
              <g opacity={a}>
                <line x1={x} x2={x} y1={ln.cy + BAR_Y + BAR_H + 66} y2={yb} stroke={ln.c} strokeWidth={2.5} strokeDasharray="5 9" opacity={0.6} />
                <rect x={XB - 20} y={yb - 16} width={ln.ms * K * a + 40} height={68} fill={`url(#${ID}-halo${i})`} opacity={0.7} />
                <rect x={XB} y={yb} width={ln.ms * K * a} height={36} rx={10} fill={`url(#${ID}-bar${i})`} />
                <rect x={XB} y={yb} width={ln.ms * K * a} height={36} rx={10} fill={`url(#${ID}-pix)`} />
                <line x1={x} x2={x} y1={yb - 8} y2={RULER_Y + 232} stroke="#FFFFFF" strokeWidth={3} opacity={0.9} />
                <circle cx={x} cy={RULER_Y + 232} r={18} fill={`url(#${ID}-dot${i})`} />
              </g>
            ) : null}
          </g>
        );
      })}
      {/* engraved formula plate */}
      <rect x={820} y={RULER_Y + 350} width={760} height={104} rx={20} fill="#0A0F1A" stroke="#56627C" strokeWidth={2.5} />
      <rect x={828} y={RULER_Y + 358} width={744} height={88} rx={14} fill="none" stroke="#000" strokeWidth={2} opacity={0.6} />
      <text x={1200} y={RULER_Y + 416} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={40} letterSpacing={5} fill="#C6D2EA">FRAME TIME = 1000 / Hz</text>
      {[848, 1552].map((x, k) => <circle key={k} cx={x} cy={RULER_Y + 402} r={7} fill="#1B2232" stroke="#8793AD" strokeWidth={1.5} />)}
      {/* floor grid fading out below */}
      {Array.from({length: 9}).map((_, j) => <line key={j} x1={620} x2={1780} y1={RULER_Y + 520 + j * 70} y2={RULER_Y + 520 + j * 70} stroke="#35D8FF" strokeWidth={2} opacity={0.2 - j * 0.018} />)}
      {Array.from({length: 15}).map((_, j) => <line key={j} x1={640 + j * 80} x2={640 + j * 80} y1={RULER_Y + 490} y2={RULER_Y + 1050} stroke="#35D8FF" strokeWidth={2} opacity={0.08} />)}
      <rect width={WW} height={WH} fill={`url(#${ID}-vig)`} />
      {/* tiny dust glints */}
      {Array.from({length: 22}).map((_, k) => (
        <circle key={k} cx={600 + rnd(k) * 1200} cy={500 + rnd(k * 3.3) * 2000 - ((t * (0.3 + rnd(k * 7) * 0.5)) % 200)} r={1.5 + rnd(k * 5) * 2.5} fill="#DCE8FF" opacity={0.12 + 0.2 * rnd(k * 9)} />
      ))}
    </svg>
  );
};

export const lanesWorld: WorldDef = {
  id: 'S03-lanes',
  home: 'lane60',
  anchors: {
    lane60: {x: 1200, y: 1040, zoom: 0.88},     // lane 1 with the hero counter above it (0.97 -> 0.88: safe area, lane 3 above the 85 % line)
    all: {x: 1200, y: 1580, zoom: 0.82},        // all three lanes; lane 2's bar is on the frame centre
  },
  aliases: {'60': 'lane60', '120': 'all', '144': 'all'},
  palette: {bg0: '#04060C', bg1: '#141C30', particles: '#BFD2FF', glow: '#35D8FF'},
  Draw,
};
