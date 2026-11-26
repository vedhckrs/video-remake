// S03 THE DEADLINE: OLED macro (diamond sub-pixels = picture x emitter mask) -> one eased pull-back -> VSYNC timeline.
import React from 'react';
import {DrumCounter} from '../../../src/kit/explainer/premium';
import {Callout} from '../../../src/kit/explainer/stage';
import {SiLens} from '../../../src/kit/explainer/silicon';
import {sp} from '../../../src/kit/explainer/tokens';
import {Burst, onWord, wordAt, type Beat, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {COL, FONT, FeedDefs, FeedPic, Plate, SvgStamp, clamp01, ease, lerp, outCubic, ramp, smooth} from './loop_kit';

const PW = 326, PH = 184, PX = 960 - PW / 2, PY = 36;   // the display panel in the pulled-back world
const PS = PW / 480;                              // panel scale against the v1 panel
const A1 = 6 * PS, Z0 = 16 / PS;                  // sub-pixel lattice pitch (panel px), macro zoom
const PIV: [number, number] = [PX + 186 * PS, PY + 96 * PS];
const FX = PIV[0] - (960 - PIV[0]) / (Z0 - 1), FY = PIV[1] - (540 - PIV[1]) / (Z0 - 1);   // fixed point of the pull-back
const GAP = 744, GX = (k: number) => 250 + GAP * k;
const R1 = 312, R2 = 578, RH = 252, CW = 420, CH = 236, GT = 300, GB = 838, BY = 256;
const picScroll = (k: number) => 40 + 26 * k;

type Keys = ReturnType<typeof keysOf>;
const keysOf = (beats: Beat[]) => {
  const miss = wordAt(beats, 'miss', 258), beat = wordAt(beats, 'beat', 345);
  const G3 = miss + 2;
  return {
    start: wordAt(beats, 'start', 9), screen: wordAt(beats, 'screen', 24), redraw: wordAt(beats, 'redraw', 60), n120: wordAt(beats, '120', 74),
    times: wordAt(beats, 'times', 92), second: wordAt(beats, 'second', 104), every: wordAt(beats, 'every', 143), deadline: wordAt(beats, 'deadline', 168),
    n83: wordAt(beats, '83', 198), old: wordAt(beats, 'old', 286), picture: wordAt(beats, 'picture', 293), stays: wordAt(beats, 'stays', 302),
    one: wordAt(beats, 'one', 332), engineers: wordAt(beats, 'engineers', 372), call: wordAt(beats, 'call', 389), hitch: wordAt(beats, 'hitch', 402),
    G: [G3 - 66, G3 - 44, G3 - 22, G3, beat], resume: beat - 23, held: 317,
  };
};
const zoomAt = (t: number, K: Keys) => {
  const q = ease(ramp(t, K.every - 7, K.every + 53));
  const Z = Math.exp(Math.log(Z0) * (1 - q));
  return {q, Z, tx: FX * (1 - Z), ty: FY * (1 - Z)};
};
/** refresh sweeps: the picture above the scan line is the new frame, below it the old one */
const scrollAt = (t: number, K: Keys) => {
  const sw: {t0: number; d: number; step: number}[] = [];
  for (let s = K.redraw; s < K.second - 9; s += 10) sw.push({t0: s, d: 8, step: 5});
  for (let i = 0; i < 12; i++) sw.push({t0: K.second - 3 + 7 * i, d: 6, step: 5});
  const base = sw.length * 5;
  sw.push({t0: K.G[1], d: 5, step: 26}, {t0: K.G[2], d: 5, step: 26}, {t0: K.G[4], d: 5, step: 26});
  let a = 40 - base, b = 40 - base, ph = -1;
  for (const s of sw) if (t >= s.t0) { a += s.step; if (t >= s.t0 + s.d) b += s.step; else ph = (t - s.t0) / s.d; }
  // replay at speed after the race: smooth scroll, one freeze + jump on "hitch"
  const r0 = K.G[4] + 11, h0 = K.hitch - 1;
  const tt = t < h0 ? t : t < h0 + 8 ? h0 : t < h0 + 9.5 ? lerp(h0, h0 + 9.5, (t - h0 - 8) / 1.5) : t;
  const tau = Math.max(0, tt - r0), extra = 2.6 * (tau - 8 * (1 - Math.exp(-tau / 8)));
  return {above: a + extra, below: b + extra, ph, frozen: t >= h0 && t < h0 + 8};
};

/** the timeline is a conveyor under the fixed panel: one eased slide across the race, a short one as the late frame lands */
const panAt = (t: number, K: Keys) => GX(1) - 960 + (GX(3) + 100 - GX(1)) * ease(ramp(t, K.G[0] - 6, K.G[3] + 8)) + 190 * ease(ramp(t, K.resume - 8, K.G[4] + 8));

const Defs: React.FC = React.memo(() => {
  const a = A1, P = (x: number, y: number) => `${x} ${y}`;
  const R: [number, number][] = [[0, 0], [2 * a, 0], [0, 2 * a], [2 * a, 2 * a], [a, a]], B: [number, number][] = [[a, 0], [0, a], [2 * a, a], [a, 2 * a]];
  const G: [number, number, number][] = [[a / 2, a / 2, 45], [a * 1.5, a / 2, -45], [a / 2, a * 1.5, -45], [a * 1.5, a * 1.5, 45]];
  const dia = (c: [number, number], s: number, f: string, k: string) => <rect key={k} x={-s} y={-s} width={2 * s} height={2 * s} rx={s * 0.3} fill={f} transform={`translate(${P(c[0], c[1])}) rotate(45)`} />;
  return (
    <defs>
      <FeedDefs g="s03" />
      <radialGradient id="s03-hr"><stop offset="0" stopColor="#FF3B28" stopOpacity={0.55} /><stop offset="1" stopColor="#FF3B28" stopOpacity={0} /></radialGradient>
      <radialGradient id="s03-hg"><stop offset="0" stopColor="#35FF4A" stopOpacity={0.5} /><stop offset="1" stopColor="#35FF4A" stopOpacity={0} /></radialGradient>
      <radialGradient id="s03-hb"><stop offset="0" stopColor="#3360FF" stopOpacity={0.6} /><stop offset="1" stopColor="#3360FF" stopOpacity={0} /></radialGradient>
      <radialGradient id="s03-cr"><stop offset="0" stopColor="#FF8A70" /><stop offset="0.7" stopColor="#FF2A18" /><stop offset="1" stopColor="#D01208" /></radialGradient>
      <radialGradient id="s03-cg"><stop offset="0" stopColor="#B4FFA8" /><stop offset="0.7" stopColor="#2CFF3E" /><stop offset="1" stopColor="#12C424" /></radialGradient>
      <radialGradient id="s03-cb"><stop offset="0" stopColor="#8FA8FF" /><stop offset="0.7" stopColor="#2C56FF" /><stop offset="1" stopColor="#1230D8" /></radialGradient>
      <pattern id="s03-px" patternUnits="userSpaceOnUse" x={PX} y={PY} width={2 * a} height={2 * a}>
        <rect x={0} y={0} width={2 * a} height={2 * a} fill="#000" />
        {R.map((c, i) => <circle key={`hr${i}`} cx={c[0]} cy={c[1]} r={a * 0.52} fill="url(#s03-hr)" />)}
        {B.map((c, i) => <circle key={`hb${i}`} cx={c[0]} cy={c[1]} r={a * 0.56} fill="url(#s03-hb)" />)}
        {G.map((c, i) => <circle key={`hg${i}`} cx={c[0]} cy={c[1]} r={a * 0.4} fill="url(#s03-hg)" />)}
        {R.map((c, i) => dia(c, a * 0.2, 'url(#s03-cr)', `r${i}`))}
        {B.map((c, i) => dia(c, a * 0.25, 'url(#s03-cb)', `b${i}`))}
        {G.map((c, i) => <ellipse key={`g${i}`} rx={a * 0.2} ry={a * 0.135} fill="url(#s03-cg)" transform={`translate(${P(c[0], c[1])}) rotate(${c[2]})`} />)}
      </pattern>
      <clipPath id="s03-pc"><rect x={PX} y={PY} width={PW} height={PH} rx={3} /></clipPath>
      <linearGradient id="s03-bez" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8B929E" /><stop offset="0.3" stopColor="#3A3F49" /><stop offset="0.7" stopColor="#1B1E25" /><stop offset="1" stopColor="#5B616C" /></linearGradient>
      <linearGradient id="s03-rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FB4FF" stopOpacity={0.13} /><stop offset="0.5" stopColor="#8FB4FF" stopOpacity={0.035} /><stop offset="1" stopColor="#8FB4FF" stopOpacity={0.09} /></linearGradient>
      <linearGradient id="s03-post" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F4F7FB" /><stop offset="0.3" stopColor="#AEB6C4" /><stop offset="0.62" stopColor="#59616F" /><stop offset="1" stopColor="#262B35" /></linearGradient>
      <pattern id="s03-chk" patternUnits="userSpaceOnUse" width={12} height={12}><rect width={12} height={12} fill="#0B0E14" /><rect width={6} height={6} fill="#F2F5FA" /><rect x={6} y={6} width={6} height={6} fill="#F2F5FA" /></pattern>
      <pattern id="s03-haz" patternUnits="userSpaceOnUse" width={16} height={16} patternTransform="rotate(45)"><rect width={16} height={16} fill="#3A0A10" /><rect width={8} height={16} fill="#FF4D5E" /></pattern>
      <pattern id="s03-wire" patternUnits="userSpaceOnUse" width={14} height={14}><rect width={14} height={14} fill="#0B1224" /><path d="M0 0H14M0 0V14" stroke="#3B8CFF" strokeOpacity={0.45} strokeWidth={1} /></pattern>
      <radialGradient id="s03-pool"><stop offset="0" stopColor="#4C8DFF" stopOpacity={0.32} /><stop offset="1" stopColor="#4C8DFF" stopOpacity={0} /></radialGradient>
      <linearGradient id="s03-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A1222" /><stop offset="1" stopColor="#03050A" /></linearGradient>
      <linearGradient id="s03-refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFE0FF" stopOpacity={0.32} /><stop offset="1" stopColor="#CFE0FF" stopOpacity={0} /></linearGradient>
      <linearGradient id="s03-trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#62E0FF" stopOpacity={0} /><stop offset="1" stopColor="#62E0FF" stopOpacity={0.4} /></linearGradient>
      <linearGradient id="s03-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE8FF" stopOpacity={0} /><stop offset="0.85" stopColor="#BFE8FF" stopOpacity={0.35} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.95} /></linearGradient>
      <filter id="s03-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16" /></filter>
    </defs>
  );
});

/** static set dressing of the timeline (floor, rails, far gates) */
const Backdrop: React.FC = React.memo(() => (
  <g>
    <rect x={-2200} y={-500} width={8400} height={2080} fill="#04060B" />
    <rect x={-2200} y={250} width={8400} height={640} fill="url(#s03-floor)" />
    {[-2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map((k) => <ellipse key={k} cx={GX(k)} cy={846} rx={300} ry={56} fill="url(#s03-pool)" />)}
    {[R1, R2].map((y) => (
      <g key={y}>
        <rect x={-2200} y={y - 8} width={8400} height={RH + 16} fill="url(#s03-rail)" />
        <path d={`M-2200 ${y - 8}H6200M-2200 ${y + RH + 8}H6200`} stroke="#CFE0FF" strokeOpacity={0.3} strokeWidth={2} />
        <path d={`M-2200 ${y - 2}H6200M-2200 ${y + RH + 2}H6200`} stroke="#CFE0FF" strokeOpacity={0.1} strokeWidth={5} strokeDasharray="14 18" />
      </g>
    ))}
    <rect x={-2200} y={GB + 6} width={8400} height={2.5} fill="#CFE0FF" opacity={0.3} />
    {Array.from({length: 60}).map((_, i) => <path key={`fl${i}`} d={`M${960 + (i - 20) * 150} 872L${960 + (i - 20) * 150 - 260} 1120`} stroke="#6FA8FF" strokeOpacity={0.1} strokeWidth={1.5} />)}
    {[872, 900, 940, 1000, 1070].map((y, i) => <rect key={`fh${i}`} x={-2200} y={y} width={8400} height={1.5} fill="#6FA8FF" opacity={0.12 - i * 0.015} />)}
    {[-2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map((k) => <rect key={`rf${k}`} x={GX(k) - 9} y={GB + 10} width={18} height={210} fill="url(#s03-refl)" />)}
    <g filter="url(#s03-soft)" opacity={0.5}>
      {[-1.5, -0.55, 0.45, 1.5, 2.55, 3.6, 4.6, 5.5, 6.5].map((k) => <rect key={k} x={GX(k) - 9} y={250} width={18} height={620} fill="#5D8CFF" opacity={0.45} />)}
    </g>
  </g>
));

const Card: React.FC<{id: string; x: number; y: number; scroll: number; pr?: number; stroke?: string; opacity?: number; tint?: number}> = ({id, x, y, scroll, pr = 1, stroke = '#DCE8FF', opacity = 1, tint = 0}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <rect x={12} y={18} width={CW} height={CH} rx={12} fill="#000" opacity={0.6} />
    <rect x={6} y={8} width={CW} height={CH} rx={12} fill="#2A3554" /><rect x={3} y={4} width={CW} height={CH} rx={12} fill="#141B2E" />
    <FeedPic id={id} g="s03" x={0} y={0} w={CW} h={CH} scroll={scroll} r={10} />
    {pr < 1 ? <rect x={CW * pr} y={0} width={CW * (1 - pr)} height={CH} fill="url(#s03-wire)" clipPath={`url(#${id})`} /> : null}
    {pr < 1 && pr > 0 ? <rect x={CW * pr - 2} y={0} width={4} height={CH} fill="#BFF2FF" /> : null}
    {tint > 0 ? <rect width={CW} height={CH} rx={10} fill="#FF2038" opacity={0.42 * tint} /> : null}
    <rect width={CW} height={CH} rx={10} fill="none" stroke={stroke} strokeWidth={2.5} strokeOpacity={0.9} />
    <path d={`M10 1H${CW * 0.55}L${CW * 0.3} ${CH * 0.5}H1V10Q1 1 10 1Z`} fill="#FFFFFF" opacity={0.07} />
  </g>
);

const Timeline: React.FC<{t: number; K: Keys}> = ({t, K}) => {
  const G = K.G, pan = panAt(t, K);
  const head = t < G[3] ? lerp(GX(0), GX(3), (t - G[0]) / (G[3] - G[0])) : t < K.resume ? GX(3) : GX(3) + ((t - K.resume) / (G[4] - K.resume)) * GAP;
  const headO = ramp(t, G[0] - 10, G[0] - 2), GH = GB - GT;
  const gates = [-1, 0, 1, 2, 3, 4, 5, 6].map((k) => {
    const on = sp(t, K.deadline + (k + 1) * 3, 'settle'), x = GX(k), shut = k === 3 ? sp(t, G[3], 'bouncy') : 0;
    const flash = k >= 0 && k <= 4 && t >= G[k] ? Math.exp(-(t - G[k]) / 7) : 0;
    const col = shut > 0.01 ? COL.red : flash > 0.02 ? COL.green : '#7FB2FF';
    return (
      <g key={k} opacity={Math.min(1, on * 3)}>
        {/* light curtain */}
        <rect x={x - 80} y={GT} width={160} height={GH * on} fill={col} opacity={0.05 + 0.22 * flash + 0.1 * shut} />
        <rect x={x - 34} y={GT} width={68} height={GH * on} fill={col} opacity={0.1 + 0.4 * flash + 0.18 * shut} />
        {/* the post: lit face, shaded side, checkered finish strips across both lanes */}
        <rect x={x + 9} y={GT + 5} width={9} height={GH * on} fill="#07090D" />
        <rect x={x - 10} y={GT} width={20} height={GH * on} fill="url(#s03-post)" />
        <rect x={x - 10} y={GT} width={3} height={GH * on} fill="#FFFFFF" opacity={0.55} />
        <rect x={x - 10} y={R1 - 8} width={20} height={(RH + 16) * on} fill="url(#s03-chk)" opacity={0.92} />
        <rect x={x - 10} y={R2 - 8} width={20} height={(RH + 16) * on} fill="url(#s03-chk)" opacity={0.92} />
        <rect x={x - 3} y={GT} width={6} height={GH * on} fill={col} opacity={0.35 + 0.6 * flash + 0.4 * shut} />
        <rect x={x - 40} y={GB - 4} width={80} height={18} rx={5} fill="#2A303B" stroke="#AAB3C2" strokeOpacity={0.6} /><rect x={x - 40} y={GB - 4} width={80} height={3} rx={1.5} fill="#E9EEF5" opacity={0.5} />
        {/* lamp housing */}
        <rect x={x - 41} y={GT - 21} width={88} height={30} rx={8} fill="#05070B" />
        <rect x={x - 44} y={GT - 26} width={88} height={30} rx={8} fill="#262B35" stroke="#C3CBD8" strokeOpacity={0.7} strokeWidth={1.5} /><rect x={x - 40} y={GT - 24} width={80} height={3} rx={1.5} fill="#FFFFFF" opacity={0.4} />
        <rect x={x - 32} y={GT - 15} width={64} height={10} rx={5} fill={col} /><rect x={x - 32} y={GT - 15} width={64} height={4} rx={2} fill="#FFFFFF" opacity={0.5} />
        <ellipse cx={x} cy={GT - 10} rx={70 + 60 * flash} ry={26 + 22 * flash} fill={col} opacity={0.16 + 0.35 * flash} />
        <text x={x} y={GT - 38} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={28} letterSpacing={3} fill={col} opacity={on * 0.95}>VSYNC</text>
        {shut > 0.01 ? <rect x={x - 18} y={R2 - 12} width={36} height={(RH + 24) * Math.min(1, shut)} rx={4} fill="url(#s03-haz)" stroke="#FF8A96" strokeWidth={2} /> : null}
      </g>
    );
  });
  // brackets "8.3 ms" between the gates
  const late = sp(t, K.one, 'pop');
  const brackets = [-1, 0, 1, 2, 3, 4, 5].map((k) => {
    const o = sp(t, K.n83 - 8 + (k + 1) * 2, 'settle'), x0 = GX(k) + 110, x1 = GX(k + 1) - 110, red = k === 3 ? late : 0, c = red > 0.5 ? COL.red : '#BFD6FF';
    if (o < 0.01) return null;
    const xm = (x0 + x1) / 2, half = ((x1 - x0) / 2) * o;
    return (
      <g key={k} opacity={o}>
        <path d={`M${xm - half} ${BY - 9}V${BY + 9}M${xm + half} ${BY - 9}V${BY + 9}M${xm - half} ${BY}H${xm - 84}M${xm + 84} ${BY}H${xm + half}`} stroke={c} strokeWidth={2.5} strokeOpacity={0.85} fill="none" />
        {red > 0 ? <rect x={x0} y={BY - 4} width={(x1 - x0) * ramp(t, K.resume, G[4])} height={8} fill={COL.red} opacity={0.9} /> : null}
        <Plate x={xm} y={BY} text={red > 0.5 ? '+8.3 ms' : '8.3 ms'} size={30} color={c} fill={red > 0.5 ? '#2A060B' : '#0A0F1C'} />
      </g>
    );
  });
  // ruler: one tick per half ms (8.3 ms per gate)
  const ticks: React.ReactNode[] = [];
  const ms = GAP / 8.3, rO = sp(t, K.deadline + 6, 'settle');
  for (let i = -18; i < 118; i++) {
    const x = GX(0) + (i * ms) / 2, major = i % 2 === 0, lit = x <= head && headO > 0.5;
    if (x - pan < -40 || x - pan > 1960) continue;
    ticks.push(<rect key={i} x={x - 1.5} y={GB + 16} width={3} height={(major ? 20 : 10) * rO} fill={lit ? COL.cyan : '#7C8AAE'} opacity={lit ? 1 : 0.55} />);
  }
  // lane cards: frame k renders in the window before gate k
  const lx = (k: number, pr: number) => GX(k - 1) + 28 + pr * (GAP - 60 - CW);
  const cards: React.ReactNode[] = [];
  const cardsO = sp(t, K.every + 9, 'settle');
  [1, 2].forEach((k) => {
    const t0 = G[k - 1], pr = outCubic(ramp(t, t0, G[k] - 6)), fly = outCubic(ramp(t, G[k], G[k] + 7));
    if (t < t0 - 0.01) return;
    const x = lx(k, pr);
    cards.push(
      <g key={`c${k}`}>
        {pr < 0.98 ? <rect x={x - 220} y={R2 + 44} width={220} height={CH - 72} fill="url(#s03-trail)" /> : null}
        <Card id={`s03c${k}`} x={x} y={R2 + 8} scroll={picScroll(k)} pr={pr} stroke={pr >= 1 ? COL.green : '#DCE8FF'} opacity={1 - 0.6 * fly} />
        {fly > 0 ? <Card id={`s03s${k}`} x={lerp(x, GX(k) + 24, fly)} y={lerp(R2 + 8, R1 + 8, fly)} scroll={picScroll(k)} stroke="#DCE8FF" /> : null}
        <SvgStamp t={t} at={G[k] - 6} x={x + CW / 2 + 8} y={R2 + 8 + CH / 2 + 6} text="ON TIME" color={COL.green} size={50} />
      </g>,
    );
  });
  // frame 3: too slow, the gate shuts, it lands one refresh late
  if (t >= G[2]) {
    const pr = t < G[3] ? 0.6 * ramp(t, G[2], G[3]) : t < K.resume ? 0.6 + 0.015 * Math.sin(t * 0.9) : lerp(0.6, 1, ease(ramp(t, K.resume, G[4] - 5)));
    const fly = outCubic(ramp(t, G[4], G[4] + 7)), x = lx(3, pr), stuck = t >= G[3] && t < K.resume;
    cards.push(
      <g key="c3">
        <Card id="s03c3" x={x + (stuck ? Math.sin(t * 2.2) * 2 : 0)} y={R2 + 8} scroll={picScroll(3)} pr={pr} stroke={t >= G[3] ? COL.red : COL.amber} opacity={1 - 0.6 * fly} />
        {fly > 0 ? <Card id="s03s3" x={lerp(x, GX(4) + 24, fly)} y={lerp(R2 + 8, R1 + 8, fly)} scroll={picScroll(3)} /> : null}
        <SvgStamp t={t} at={G[3] + 3} x={x + CW / 2} y={R2 + 8 + CH / 2 + 6} text="LATE" color={COL.red} size={58} />
      </g>,
    );
  }
  // on-screen strip: slot 0 holds the frame already showing; slot 3 gets the red duplicate of slot 2
  const gq = ease(ramp(t, K.stays, K.stays + 12)), lift = sp(t, K.picture, 'pop'), oldP = t >= K.old ? Math.exp(-(t - K.old) / 9) : 0;
  const sx3 = GX(3) + 24, hitP = t >= K.hitch ? Math.exp(-(t - K.hitch) / 8) : 0, engP = t >= K.engineers ? 0.5 + 0.5 * Math.sin((t - K.engineers) * 0.35) : 0;
  const ret = sp(t, K.call, 'pop');
  const curX = lerp(lerp(lerp(GX(0), GX(1), ease(ramp(t, G[1], G[1] + 7))), GX(2), ease(ramp(t, G[2], G[2] + 7))), GX(3), gq) + 24 + CW / 2 - pan;
  const tab = (y: number, text: string) => (
    <g opacity={cardsO}>
      <rect x={-20} y={y - 2} width={84} height={RH + 4} fill="#05070B" opacity={0.92} /><rect x={62} y={y - 2} width={3} height={RH + 4} fill="#8FB4FF" opacity={0.55} />
      <text transform={`translate(42 ${y + RH / 2}) rotate(-90)`} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={28} letterSpacing={4} fill="#DCE8FF">{text}</text>
    </g>
  );
  return (
    <g>
      <g transform={`translate(${-pan} 0)`}>
        <Backdrop />
        {brackets}{gates}{ticks}
        <g opacity={cardsO}>
          <Card id="s03s0" x={GX(0) + 24} y={R1 + 8} scroll={picScroll(0)} />
          {cards}
          {t >= G[3] && gq < 1 ? (
            <g opacity={1 - gq}>
              <rect x={sx3} y={R1 + 8} width={CW} height={CH} rx={12} fill="#1A0508" fillOpacity={0.7} stroke={COL.red} strokeWidth={3.5} strokeDasharray="14 10" />
              <text x={sx3 + CW / 2} y={R1 + 8 + CH / 2 + 14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={COL.red}>NO NEW FRAME</text>
            </g>
          ) : null}
          {oldP > 0.02 ? <rect x={GX(2) + 16} y={R1} width={CW + 16} height={CH + 16} rx={16} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={oldP} /> : null}
          {lift > 0.01 ? (
            <g>
              <Card id="s03gh" x={lerp(GX(2) + 24 + 14 * lift, sx3, gq)} y={R1 + 8 - 14 * lift * (1 - gq)} scroll={picScroll(2)} stroke={COL.red} tint={0.35 + 0.65 * gq} />
              {gq > 0.9 ? <Plate x={sx3 + 14} y={R1 + 44} text="REPEAT" size={34} color="#FFD9DD" fill="#B0182A" anchor="start" pad={0.35} /> : null}
            </g>
          ) : null}
          {gq >= 1 ? <rect x={sx3 - 8} y={R1} width={CW + 16} height={CH + 16} rx={17} fill="none" stroke={COL.red} strokeWidth={4 + 7 * hitP} opacity={0.35 + 0.5 * Math.max(engP, hitP)} /> : null}
          {ret > 0.01 ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => {
            const cx = sx3 + CW / 2 + a * (CW / 2 + 46 - 22 * ret), cy = R1 + 8 + CH / 2 + b * (CH / 2 + 40 - 22 * ret);
            return <path key={i} d={`M${cx} ${cy - b * 34}V${cy}H${cx - a * 34}`} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={ret} />;
          }) : null}
        </g>
        <g opacity={headO * (1 - ramp(t, G[4] + 2, G[4] + 10))}>
          <rect x={head - 14} y={GT} width={28} height={GH + 30} fill="#FFFFFF" opacity={0.14} />
          <rect x={head - 2} y={GT} width={4} height={GH + 30} fill="#FFFFFF" />
          <path d={`M${head - 14} ${GT - 20}H${head + 14}L${head} ${GT + 2}Z`} fill="#FFFFFF" />
        </g>
        <Burst t={t} at={K.hitch} x={sx3 + CW / 2} y={R1 + 8 + CH / 2} color={COL.red} n={22} r={330} />
        <SvgStamp t={t} at={K.hitch} x={sx3 + CW / 2 + 12} y={R1 + 8 + CH / 2} text="HITCH" color={COL.red} size={104} rot={-9} />
      </g>
      <path d={`M960 ${PY + PH + 16}C960 ${PY + PH + 60} ${curX} ${R1 - 80} ${curX} ${R1 + 2}`} fill="none" stroke={t >= G[3] ? COL.red : COL.cyan} strokeWidth={3} strokeDasharray="3 10" strokeDashoffset={-t * 2} strokeLinecap="round" opacity={0.85 * cardsO} />
      {tab(R1, 'ON SCREEN')}{tab(R2, 'RENDERING')}
    </g>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const K = keysOf(beats);
  const {Z, tx, ty} = zoomAt(t, K);
  const sc = scrollAt(t, K);
  const vTop = Math.max(PY, (-90 - ty) / Z), vBot = Math.min(PY + PH, (1170 - ty) / Z);
  const scanY = sc.ph >= 0 ? lerp(vTop, vBot, sc.ph) : -1;
  const patK = smooth(ramp(A1 * Z, 13, 42));
  const rA = 30 + 120 * ease(ramp(t, -14, 6)), rB = 60 + 90 * ease(ramp(t, K.start - 6, K.screen + 4));
  const rip = (t * 1.3) % 44;
  const held = t >= K.G[3] && t < K.G[4], heldP = held ? 0.6 + 0.4 * Math.sin(t * 0.5) * (t >= K.held ? 1 : 0.3) : 0;
  const jerk = sc.frozen ? 1 : t >= K.hitch ? Math.exp(-(t - K.hitch - 8) / 6) : 0;
  const housing = Z < 16;
  const pic = (id: string, scroll: number) => <FeedPic id={id} g="s03" x={PX} y={PY} w={PW} h={PH} scroll={scroll} />;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <Defs />
      <defs>
        <radialGradient id="s03-va" gradientUnits="userSpaceOnUse" cx={PIV[0]} cy={PIV[1]} r={rA}><stop offset="0.6" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.95} /></radialGradient>
        <radialGradient id="s03-vb" gradientUnits="userSpaceOnUse" cx={PIV[0] + 20} cy={PIV[1] - 10} r={rB}><stop offset="0.6" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.4} /></radialGradient>
        <linearGradient id="s03-rip" gradientUnits="userSpaceOnUse" x1={PX + rip} y1={PY} x2={PX + rip + 22} y2={PY + 12} spreadMethod="reflect"><stop offset="0" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.3} /></linearGradient>
        <clipPath id="s03-ca"><rect x={PX} y={PY} width={PW} height={Math.max(0, scanY - PY)} /></clipPath>
        <clipPath id="s03-cb2"><rect x={PX} y={Math.max(PY, scanY)} width={PW} height={PH} /></clipPath>
      </defs>
      <g transform={`translate(${tx} ${ty}) scale(${Z})`}>
        {Z < 10 ? <g opacity={smooth(ramp(Z, 10, 4))}><Timeline t={t} K={K} /></g> : null}
        {housing ? (
          <g>
            <ellipse cx={PX + PW / 2} cy={PY + PH / 2} rx={PW * 0.75} ry={PH * 0.9} fill="url(#s03-pool)" opacity={0.9} />
            <path d={`M${PX + 60} ${PY - 14}V-400M${PX + PW - 60} ${PY - 14}V-400`} stroke="#3A404B" strokeWidth={6} />
            <rect x={PX - 8} y={PY - 6} width={PW + 26} height={PH + 26} rx={18} fill="#05070B" />
            <rect x={PX - 14} y={PY - 14} width={PW + 28} height={PH + 28} rx={18} fill="url(#s03-bez)" />
            <rect x={PX - 5} y={PY - 5} width={PW + 10} height={PH + 10} rx={7} fill="#020305" />
          </g>
        ) : null}
        <g clipPath="url(#s03-pc)">
          <g style={{isolation: 'isolate'}}>
            {scanY < 0 ? pic('s03p', sc.above) : (
              <>
                <g clipPath="url(#s03-ca)">{pic('s03pa', sc.above)}</g>
                <g clipPath="url(#s03-cb2)">{pic('s03pb', sc.below)}</g>
              </>
            )}
            {rA < 150 ? <rect x={PX} y={PY} width={PW} height={PH} fill="url(#s03-va)" /> : null}
            {rB < 150 ? <rect x={PX} y={PY} width={PW} height={PH} fill="url(#s03-vb)" /> : null}
            {patK > 0 ? <rect x={PX} y={PY} width={PW} height={PH} fill="url(#s03-rip)" opacity={patK} /> : null}
            {patK > 0 ? <rect x={PX} y={PY} width={PW} height={PH} fill="url(#s03-px)" opacity={patK} style={{mixBlendMode: 'multiply'}} /> : null}
          </g>
          {patK > 0 ? <rect x={PX} y={PY} width={PW} height={PH} fill="url(#s03-px)" opacity={0.3 * patK} style={{mixBlendMode: 'screen'}} /> : null}
          {scanY >= 0 ? <rect x={PX} y={scanY - 60 / Z - 3} width={PW} height={60 / Z + 3} fill="url(#s03-scan)" style={{mixBlendMode: 'screen'}} /> : null}
          {heldP > 0 ? <rect x={PX} y={PY} width={PW} height={PH} fill={COL.red} opacity={0.14 * heldP} /> : null}
          {jerk > 0.02 ? <rect x={PX} y={PY} width={PW} height={PH} fill={COL.red} opacity={0.3 * clamp01(jerk)} /> : null}
          {housing ? <path d={`M${PX} ${PY}H${PX + PW * 0.5}L${PX + PW * 0.3} ${PY + PH}H${PX}Z`} fill="#FFFFFF" opacity={0.05 * (1 - patK)} /> : null}
        </g>
        {housing && (held || jerk > 0.02) ? (
          <g>
            <rect x={PX - 14} y={PY - 14} width={PW + 28} height={PH + 28} rx={18} fill="none" stroke={COL.red} strokeWidth={5} opacity={Math.max(heldP, clamp01(jerk))} />
            {t >= K.held && held ? <Plate x={PX + PW - 12} y={PY + 30} text="SAME PICTURE" size={26} color="#FFD9DD" fill="#B0182A" anchor="end" pad={0.4} /> : null}
          </g>
        ) : null}
      </g>
    </svg>
  );
};

const Overlay: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}> = ({t, beats, W, H, toScreen}) => {
  const K = keysOf(beats);
  const {Z, tx, ty} = zoomAt(t, K);
  const inn = onWord(t, beats, 'redraw', 'settle'), dl = sp(t, K.n83 - 9, 'settle');
  const sub = toScreen((PX + 216 * PS) * Z + tx, (PY + 84 * PS) * Z + ty);
  const nT = Math.round(120 * ramp(t, K.times, K.second + 22)), secP = onWord(t, beats, 'second'), stripO = ramp(t, K.times - 2, K.times + 4) * (1 - ramp(t, K.every + 4, K.every + 24));
  return (
    <>
      <SiLens W={W} H={H} t={t} focus={[0.16, 0.84]} blur={5} dust={10} tint="#6FA8FF" seed={4} />
      <Callout t={t} at={K.screen + 6} out={K.every - 8} from={sub} to={[W * 0.76, H * 0.2]} text="Sub-pixels" gloss="red · green · blue emitters" W={W} color="#FFFFFF" />
      <div style={{position: 'absolute', left: W * 0.04, top: H * 0.034, opacity: inn, transform: `translateX(${(1 - inn) * -80}px)`}}>
        <DrumCounter t={t} at={K.n120} to={120} dur={26} size={110} unitText="Hz" label={t < K.every + 16 ? 'refresh rate' : undefined} accent={COL.cyan} />
        <div style={{marginTop: 14, display: 'flex', gap: 1.6, alignItems: 'flex-end', height: 22, opacity: stripO}}>
          {Array.from({length: 120}).map((_, i) => <div key={i} style={{width: 1.8, height: i % 10 === 0 ? 22 : 14, background: i < nT ? COL.cyan : '#3A4560', boxShadow: i === nT - 1 ? `0 0 8px ${COL.cyan}` : undefined}} />)}
        </div>
        <div style={{marginTop: 8, fontFamily: FONT, fontWeight: 600, fontSize: 26, letterSpacing: '0.08em', color: secP > 0.5 ? '#EAF1FF' : '#8FA0C2', opacity: stripO}}>one second</div>
      </div>
      <div style={{position: 'absolute', right: W * 0.04, top: H * 0.034, opacity: dl, transform: `translateX(${(1 - dl) * 80}px)`}}>
        <DrumCounter t={t} at={K.n83 - 7} to={8.3} dur={18} decimals={1} size={110} unitText="ms" accent={COL.amber} />
      </div>
    </>
  );
};

export const deadlineWorld: WorldDef = {
  id: 's03deadline',
  home: 'home',
  anchors: {home: {x: 960, y: 540, zoom: 1}, hitch: {x: 960, y: 566, zoom: 1.05}},
  aliases: {engineers: 'hitch', call: 'hitch'},
  palette: {bg0: '#020308', bg1: '#070B16', glow: '#3B8CFF', particles: '#9CC3FF'},
  Draw, Overlay,
};
