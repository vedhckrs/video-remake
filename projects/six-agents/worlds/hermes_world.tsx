// S08 "Hermes atelier" - Hermes by Nous Research. Nous electric blue + silver, an engraver's atelier: the official hero
// line-art hangs framed and glows; it steps aside for the workbench (task card ticks done -> it writes SKILL.md ->
// a leaf sprouts on the glowing skill tree and the leaves multiply); the camera pans to the second bay: the REAL
// GitHub header (Star 266k marked + magnified), FREE · MIT, model chips plugging in, hosted cloud from $20/month,
// and the catch: a setup checklist that ends centred for the iris into S09.
import React from 'react';
import {siOllama, siOpenrouter} from 'simple-icons';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {Burst, pulseOn, wordAt} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {ASSETS, FONT, MONO, SvgImg, usePreload} from './shared';
import {GitProof, LogoDot, Plate, clamp01, flash, inOut, lerp, outC, rnd, seg} from './claw_kit';

const id = 's08';
const BLUE = '#2A35FF', NOUS = '#0000F2', ICE = '#AEE6FF', SILVER = '#DCE3F2', INK = '#02033A', OKG = '#5BF0B0', AMBER = '#FFB020', GOLD = '#FFD84D';
const CY = 1100;                       // camera height of both bays
const B2 = 3400;                       // centre x of the second bay
const HERO_R = 1500 / 1392;
const TX = 1650;                     // skill tree trunk x
const CX0 = 500, CW = 670;           // workbench cards (left column)

// ---- skill tree (deterministic) ----
type Br = {x0: number; y0: number; x1: number; y1: number; w: number; d: number; len: number};
type Leaf = {x: number; y: number; a: number; s: number};
const TREE = (() => {
  const brs: Br[] = [], leaves: Leaf[] = [];
  const grow = (x: number, y: number, ang: number, len: number, w: number, d: number, seed: number) => {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    brs.push({x0: x, y0: y, x1, y1, w, d, len});
    if (d >= 2) leaves.push({x: (x + x1) / 2, y: (y + y1) / 2, a: ang + (seed % 2 ? 1.1 : -1.1), s: 0.8});
    if (d >= 3) { leaves.push({x: x1, y: y1, a: ang, s: 1}); return; }
    const spread = d === 0 ? [-0.55, 0.02, 0.55] : [-0.37, 0.34];
    spread.forEach((sprd, k) => grow(x1, y1, ang + sprd + (rnd(seed * 7 + k) - 0.5) * 0.22, len * (0.72 + rnd(seed + k * 3) * 0.1), w * 0.62, d + 1, seed * 3 + k + 1));
  };
  grow(TX, 2020, -Math.PI / 2, 300, 30, 0, 1);
  // first leaf: the tip closest to the workbench; the rest spread out from it
  const tips = leaves.filter((l) => l.s === 1);
  const first = tips.reduce((a, b) => (Math.hypot(a.x - 1600, a.y - 1250) < Math.hypot(b.x - 1600, b.y - 1250) ? a : b));
  const rest = leaves.filter((l) => l !== first).map((l, i) => ({l, k: rnd(i * 3.7 + 1)})).sort((a, b) => a.k - b.k).map((o) => o.l);
  return {brs, leaves: [first, ...rest]};
})();

const LEAF_D = 'M0,0 C22,-16 36,-52 0,-92 C-36,-52 -22,-16 0,0 Z';

const Column: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 90} y={-900} width={180} height={3200} fill={`url(#${id}-col)`} />
    {Array.from({length: 7}).map((_, i) => <rect key={i} x={x - 78 + i * 26} y={-760} width={3} height={2960} fill="#FFFFFF" opacity={0.16} />)}
    <rect x={x - 130} y={2200} width={260} height={50} rx={8} fill="#0A0F8A" stroke={SILVER} strokeOpacity={0.5} strokeWidth={3} />
    <rect x={x - 150} y={2250} width={300} height={46} rx={8} fill="#060A6A" stroke={SILVER} strokeOpacity={0.5} strokeWidth={3} />
    <rect x={x - 120} y={-820} width={240} height={56} rx={8} fill="#0A0F8A" stroke={SILVER} strokeOpacity={0.5} strokeWidth={3} />
  </g>
);

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  usePreload([ASSETS.hermesHero, ASSETS.hermesWing, ASSETS.ghHermes]);
  const tHermes = wordAt(beats, 'hermes', 13.5), tNous = wordAt(beats, 'nous', 37.5), tRes = wordAt(beats, 'research', 44), tLearn = wordAt(beats, 'learner', 70.5);
  const tAfter = wordAt(beats, 'after', 101), tHard = wordAt(beats, 'hard', 112.5), tTask = wordAt(beats, 'task', 119);
  const tWrites = wordAt(beats, 'writes', 133), tItself = wordAt(beats, 'itself', 140.5), tNew = wordAt(beats, 'new', 150), tSkill = wordAt(beats, 'skill', 154.5);
  const tGets = wordAt(beats, 'gets', 169.5), tBetter = wordAt(beats, 'better', 175), tMore = wordAt(beats, 'more', 185), tUse = wordAt(beats, 'use', 194);
  const tFree = wordAt(beats, 'free', 229), tAny = wordAt(beats, 'any', 238.5), tAi = wordAt(beats, 'ai', 243), tModel = wordAt(beats, 'model', 252);
  const tHosted = wordAt(beats, 'hosted', 269.5), tTwenty = wordAt(beats, 'twenty', 281.5), tDollars = wordAt(beats, 'dollars', 288.5), tMonth = wordAt(beats, 'month', 298);
  const tCatch = wordAt(beats, 'catch', 324), tPick = wordAt(beats, 'pick', 352.5), tSet = wordAt(beats, 'set', 360.5), tYou = wordAt(beats, 'yourself', 378);
  const tModel2 = beats.filter((b) => b.word === 'model')[1]?.t ?? 370.5;
  const pulse = pulseOn(t, beats);

  // ---- bay 1: the hero art steps aside for the workbench ----
  const m = inOut(seg(t, tAfter - 6, tAfter + 9));
  const artW = lerp(1080, 540, m), artX = lerp(760, 500, m), artY = 340, artH = artW * HERO_R;
  const acx = artX + artW / 2, acy = artY + artH / 2;
  const wakeArt = sp(t, tHermes, 'settle');
  const learn = sp(t, tLearn, 'settle');
  const artGlow = 0.35 + 0.65 * wakeArt + 0.5 * flash(t, tHermes, 10) + 0.6 * flash(t, tLearn, 14) + 0.5 * flash(t, tItself, 9) + 0.25 * pulse;
  const nbX = lerp(830, 1100, m), nbY = lerp(1575, 380, m), nbS = lerp(1.36, 1, m);
  const wing = sp(t, tNous, 'bouncy'), res = sp(t, tRes, 'pop');

  // workbench
  const bench = sp(t, tAfter, 'settle');
  const prog = seg(t, tAfter + 3, tTask);
  const hard = sp(t, tHard, 'bouncy'), done = sp(t, tTask, 'bouncy');
  const file = sp(t, tWrites - 2, 'settle'), isNew = sp(t, tNew, 'bouncy'), skill = sp(t, tSkill, 'bouncy');
  const wr = seg(t, tWrites, tItself + 8);
  const self = sp(t, tItself, 'settle');
  const grown = seg(t, tAfter + 2, tTask + 6);
  const leafAt = (i: number) => (i === 0 ? tSkill : i < 4 ? tGets + (i - 1) * 1.2 : i < 10 ? tBetter + (i - 4) * 1.1 : i < 18 ? tMore + (i - 10) * 0.9 : tUse + (i - 18) * 0.7);
  const leaf0 = TREE.leaves[0];
  const canopy = clamp01((t - tSkill) / (tUse + 12 - tSkill));

  // ---- bay 2 ----
  const tPanel = tUse + 12;
  const freeK = sp(t, tFree, 'bouncy');
  const chipT = [tAny, tAi, tModel];
  const hosted = sp(t, tHosted, 'settle'), twenty = sp(t, tTwenty, 'bouncy'), month = sp(t, tMonth, 'pop');
  const catchK = sp(t, tCatch, 'settle');
  const PX = B2 - 820, PW = 1640;                 // GitHub panel
  const RW = 1472;                                // rows under the panel stay clear of the app's buttons (right 14 %)
  const CHIPS = [
    {x: PX, w: 460, label: 'OpenRouter', icon: siOpenrouter},
    {x: PX + 468, w: 336, label: 'Ollama', icon: siOllama},
    {x: PX + 812, w: 660, label: 'Your own endpoint', icon: null},
  ];
  const CL = {x: B2 - 750, y: CY - 580, w: 1500, h: 1160};
  const rows = [
    {title: 'Pick an AI model', sub: 'OpenRouter, Ollama, your own', at: tPick},
    {title: 'Set it up', sub: 'install it and connect it', at: tSet},
    {title: 'Do it yourself', sub: 'the setup is on you', at: tYou},
  ];

  return (
    <svg width={4800} height={3000} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="0.5" cy="0.45" r="0.75"><stop offset="0" stopColor="#1A22F0" /><stop offset="0.55" stopColor="#0A0FB4" /><stop offset="1" stopColor="#03044A" /></radialGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A0FA0" /><stop offset="1" stopColor="#02022E" /></linearGradient>
        <linearGradient id={`${id}-col`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#050880" /><stop offset="0.4" stopColor="#2A33FF" /><stop offset="1" stopColor="#04066A" /></linearGradient>
        <radialGradient id={`${id}-halo`}><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} /><stop offset="0.35" stopColor={ICE} stopOpacity={0.25} /><stop offset="1" stopColor={ICE} stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#1A22C8" stopOpacity={0.96} /><stop offset="1" stopColor="#03053C" stopOpacity={0.97} /></linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} /><stop offset="0.5" stopColor={ICE} stopOpacity={0.45} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.18} /></linearGradient>
        <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor="#B9C3DA" /><stop offset="0.55" stopColor="#F2F5FB" /><stop offset="1" stopColor="#8E9AB8" /></linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#5BD8FF" /><stop offset="1" stopColor="#FFFFFF" /></linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D5DCF2" /></linearGradient>
        <clipPath id={`${id}-cl`}><rect x={CL.x} y={CL.y} width={CL.w} height={CL.h} rx={56} /></clipPath>
      </defs>

      {/* ================= atelier ================= */}
      <rect x={-1600} y={-1900} width={8000} height={4200} fill={`url(#${id}-bg)`} />
      {/* engraved hatching on the wall */}
      {Array.from({length: 60}).map((_, i) => <rect key={i} x={-1400 + i * 128} y={-1900} width={2} height={4200} fill="#FFFFFF" opacity={0.045} />)}
      {[-420, 250, 2290].map((y, i) => <rect key={i} x={-1600} y={y} width={8000} height={i === 2 ? 5 : 3} fill={SILVER} opacity={i === 2 ? 0.5 : 0.14} />)}
      {/* arches over each bay */}
      {[1300, B2].map((cx, k) => (
        <g key={k} fill="none" stroke={SILVER}>
          {[0, 1, 2].map((i) => <path key={i} d={`M${cx - 960 + i * 30},250 V${-200} A${960 - i * 30},${760 - i * 30} 0 0 1 ${cx + 960 - i * 30},${-200} V250`} strokeWidth={i === 0 ? 5 : 2} opacity={0.3 - i * 0.07} />)}
          {Array.from({length: 17}).map((_, i) => {
            const a = Math.PI + ((i + 0.5) / 17) * Math.PI;
            return <line key={`r${i}`} x1={cx + Math.cos(a) * 520} y1={-200 + Math.sin(a) * 420} x2={cx + Math.cos(a) * 900} y2={-200 + Math.sin(a) * 700} strokeWidth={2} opacity={0.14} />;
          })}
        </g>
      ))}
      {/* floor: engraved perspective tiles */}
      <rect x={-1600} y={2292} width={8000} height={1400} fill={`url(#${id}-floor)`} />
      {Array.from({length: 7}).map((_, i) => <rect key={i} x={-1600} y={2292 + Math.pow(i + 1, 1.7) * 26} width={8000} height={2} fill={SILVER} opacity={0.22 - i * 0.02} />)}
      {Array.from({length: 40}).map((_, i) => {
        const x = -900 + i * 170, cxm = 2350;
        return <line key={i} x1={x} y1={2292} x2={cxm + (x - cxm) * 2.1} y2={3200} stroke={SILVER} strokeWidth={2} opacity={0.14} />;
      })}
      <Column x={160} /><Column x={2350} /><Column x={4560} />

      {/* ================= bay 1: the hero art ================= */}
      {/* radiating engraved rays (echo the artwork) */}
      <g transform={`translate(${acx} ${acy}) rotate(${t * 0.12})`} opacity={(0.35 + 0.4 * wakeArt + 0.3 * flash(t, tLearn, 16)) * (1 - 0.45 * m)}>
        {Array.from({length: 72}).map((_, i) => {
          const a = (i / 72) * Math.PI * 2, r0 = artW * 0.62, r1 = artW * (i % 3 === 0 ? 1.15 : 0.92);
          return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke="#FFFFFF" strokeWidth={i % 3 === 0 ? 3 : 1.6} opacity={i % 3 === 0 ? 0.3 : 0.16} />;
        })}
        <circle r={artW * 0.98} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeDasharray="3 14" opacity={0.3} />
      </g>
      <ellipse cx={acx} cy={acy} rx={artW * 0.95} ry={artH * 0.85} fill={`url(#${id}-halo)`} opacity={0.5 * artGlow} />
      {(() => {
        const q = (t - tLearn) / 26;
        return q > 0 && q < 1 ? <ellipse cx={acx} cy={acy} rx={artW * (0.55 + 0.6 * outC(q))} ry={artH * (0.55 + 0.6 * outC(q))} fill="none" stroke="#FFFFFF" strokeWidth={10 * (1 - q)} opacity={0.7 * (1 - q)} /> : null;
      })()}
      {/* the framed artwork (official hero line-art, unaltered) */}
      <g transform={`translate(${acx} ${acy + Math.sin(t * 0.05) * 5}) scale(${1 + 0.035 * (1 - wakeArt) + 0.012 * flash(t, tLearn, 12)}) translate(${-acx} ${-acy})`}>
        <rect x={artX - 4} y={artY + 26} width={artW + 28} height={artH} rx={30} fill="#000030" opacity={0.55} />
        <rect x={artX - 22} y={artY - 22} width={artW + 44} height={artH + 44} rx={34} fill={`url(#${id}-silver)`} />
        <rect x={artX - 8} y={artY - 8} width={artW + 16} height={artH + 16} rx={24} fill="#000008" />
        <SvgImg src={ASSETS.hermesHero} x={artX} y={artY} w={artW} h={artH} radius={18} opacity={0.86 + 0.14 * clamp01(wakeArt)} />
        <rect x={artX} y={artY} width={artW} height={artH} rx={18} fill={BLUE} opacity={0.1 * (1 - clamp01(wakeArt))} />
        {/* glint that sweeps the glass on its words */}
        {[tHermes, tLearn, tItself].map((w, i) => {
          const q = (t - w) / 14;
          return q > 0 && q < 1 ? <polygon key={i} points={`${artX + artW * (q * 1.5 - 0.4)},${artY} ${artX + artW * (q * 1.5 - 0.22)},${artY} ${artX + artW * (q * 1.5 - 0.42)},${artY + artH} ${artX + artW * (q * 1.5 - 0.6)},${artY + artH}`} fill="#FFFFFF" opacity={0.16 * Math.sin(q * Math.PI)} /> : null;
        })}
        <rect x={artX - 22} y={artY - 22} width={artW + 44} height={artH + 44} rx={34} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.5 * artGlow} />
        {/* hanging wires */}
        <path d={`M${artX + artW * 0.2},${artY - 22} L${acx},${artY - 150} L${artX + artW * 0.8},${artY - 22}`} fill="none" stroke={SILVER} strokeWidth={3} opacity={0.5} />
        <circle cx={acx} cy={artY - 150} r={9} fill={SILVER} />
      </g>
      {/* orbiting sparks around the art on "learner" */}
      {learn > 0.01 ? Array.from({length: 10}).map((_, i) => {
        const a = t * 0.05 + (i / 10) * Math.PI * 2, r = artW * (0.62 + 0.05 * Math.sin(t * 0.1 + i));
        return <circle key={i} cx={acx + Math.cos(a) * r} cy={acy + Math.sin(a) * r * 1.02} r={5 + 3 * Math.sin(t * 0.3 + i)} fill="#FFFFFF" opacity={0.75 * learn} />;
      }) : null}

      {/* name block: wing + Hermes + Nous Research + "The learner" */}
      <g transform={`translate(${nbX} ${nbY}) scale(${nbS})`}>
        <g transform={`translate(85 85) scale(${0.25 + 0.75 * wing}) rotate(${-14 + 14 * wing})`} opacity={0.25 + 0.75 * clamp01(wing)}>
          <rect x={-93} y={-93} width={186} height={186} rx={44} fill="#FFFFFF" opacity={0.25 + 0.5 * flash(t, tNous, 8)} />
          <SvgImg src={ASSETS.hermesWing} x={-85} y={-85} w={170} h={170} radius={38} />
        </g>
        <text x={204} y={104} fontFamily={FONT} fontWeight={800} fontSize={128} fill="#FFFFFF" letterSpacing={-2} opacity={0.6 + 0.4 * clamp01(wakeArt)}>Hermes</text>
        <rect x={204} y={126} width={420 * clamp01(res)} height={5} rx={2.5} fill={ICE} />
        <text x={206} y={182} fontFamily={MONO} fontWeight={600} fontSize={46} fill={ICE} letterSpacing={5} opacity={0.3 + 0.7 * clamp01(res)}>NOUS RESEARCH</text>
        {learn > 0.01 ? (
          <g transform={`translate(0 ${228 + (1 - learn) * 40})`} opacity={clamp01(learn * 1.5)}>
            <rect x={-12} y={-12} width={664} height={144} rx={72} fill="#FFFFFF" opacity={0.22 * (0.6 + 0.4 * Math.sin(t * 0.25)) + 0.3 * flash(t, tLearn, 10)} />
            <rect x={0} y={0} width={640} height={120} rx={60} fill={`url(#${id}-silver)`} />
            <path d="M60,60 l16,-34 l16,34 l34,10 l-34,10 l-16,34 l-16,-34 l-34,-10 z" fill={NOUS} transform="translate(-6 -10) scale(0.9)" />
            <text x={138} y={86} fontFamily={FONT} fontWeight={800} fontSize={76} fill={NOUS}>The learner</text>
          </g>
        ) : null}
      </g>

      {/* ================= bay 1: workbench ================= */}
      {bench > 0.01 ? (
        <g opacity={clamp01(bench * 1.4)}>
          {/* ---- the workbench board ---- */}
          <rect x={452 + 10} y={952 + 26} width={1700} height={1276} rx={64} fill="#000030" opacity={0.45} />
          <rect x={452} y={952} width={1700} height={1276} rx={64} fill="#03053C" opacity={0.62} />
          {Array.from({length: 16}).map((_, i) => <rect key={`bv${i}`} x={552 + i * 100} y={964} width={2} height={1252} fill="#FFFFFF" opacity={0.05} />)}
          {Array.from({length: 12}).map((_, i) => <rect key={`bh${i}`} x={464} y={1052 + i * 100} width={1676} height={2} fill="#FFFFFF" opacity={0.05} />)}
          <rect x={452} y={952} width={1700} height={1276} rx={64} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={4} />
          {[[492, 992], [2112, 992], [492, 2188], [2112, 2188]].map(([x, y], i) => <path key={`bc${i}`} d={`M${x - 16},${y} H${x + 16} M${x},${y - 16} V${y + 16}`} stroke={ICE} strokeWidth={4} opacity={0.7} />)}
          {/* ---- skill tree ---- */}
          <ellipse cx={TX} cy={2030} rx={470} ry={50} fill="#000030" opacity={0.6} />
          <ellipse cx={TX} cy={1500} rx={560} ry={520} fill={`url(#${id}-halo)`} opacity={0.12 + 0.5 * canopy + 0.25 * flash(t, tSkill, 10)} />
          <path d={`M${TX - 210},2024 Q${TX},1974 ${TX + 210},2024 L${TX + 180},2054 H${TX - 180} Z`} fill={`url(#${id}-silver)`} opacity={0.9} />
          {TREE.brs.map((b, i) => {
            const g = clamp01(grown * 4.2 - b.d);
            if (g <= 0) return null;
            const x1 = lerp(b.x0, b.x1, g), y1 = lerp(b.y0, b.y1, g);
            return (
              <g key={i}>
                <line x1={b.x0} y1={b.y0} x2={x1} y2={y1} stroke={ICE} strokeWidth={b.w + 14} strokeLinecap="round" opacity={0.1 + 0.16 * canopy} />
                <line x1={b.x0} y1={b.y0} x2={x1} y2={y1} stroke={`url(#${id}-silver)`} strokeWidth={b.w} strokeLinecap="round" />
                <line x1={b.x0} y1={b.y0} x2={x1} y2={y1} stroke="#FFFFFF" strokeWidth={Math.max(2, b.w * 0.18)} strokeLinecap="round" opacity={0.8} />
                {g >= 1 ? <circle cx={b.x1} cy={b.y1} r={b.w * 0.5 + 3} fill="#FFFFFF" /> : null}
              </g>
            );
          })}
          {/* energy running up the trunk on each skill word */}
          {[tSkill, tGets, tBetter, tMore, tUse].map((w, i) => {
            const q = (t - w) / 10;
            return q > 0 && q < 1 ? <circle key={i} cx={TX} cy={lerp(2020, 1720, q)} r={22 * (1 - q) + 8} fill="#FFFFFF" opacity={1 - q} /> : null;
          })}
          {TREE.leaves.map((L, i) => {
            const k = sp(t, leafAt(i), 'bouncy');
            if (k <= 0.01) return null;
            const sway = Math.sin(t * 0.09 + i * 1.7) * 7;
            const s = (i === 0 ? 1.9 : L.s * (1.2 + 0.45 * rnd(i * 5.3))) * k;
            return (
              <g key={i} transform={`translate(${L.x} ${L.y}) rotate(${(L.a * 180) / Math.PI + 90 + sway}) scale(${s})`}>
                <path d={LEAF_D} fill={ICE} opacity={0.3} transform="scale(1.45)" />
                <path d={LEAF_D} fill={`url(#${id}-leaf)`} stroke="#FFFFFF" strokeWidth={3} />
                <line x1={0} y1={-6} x2={0} y2={-70} stroke={NOUS} strokeWidth={3} opacity={0.5} />
              </g>
            );
          })}
          <Burst t={t} at={tSkill} x={leaf0.x} y={leaf0.y} color="#FFFFFF" n={16} r={200} />
          {[tGets, tBetter, tMore, tUse].map((w, i) => <Burst key={i} t={t} at={w} x={TX + [-200, 180, -60, 110][i]} y={1440 - i * 40} color={ICE} n={12} r={260} />)}
          {/* first leaf label */}
          {skill > 0.01 ? (
            <g transform={`translate(${leaf0.x} ${leaf0.y - 215}) scale(${0.5 + 0.5 * skill})`} opacity={clamp01(skill * 1.5)}>
              <rect x={-190} y={-52} width={380} height={104} rx={52} fill="#FFFFFF" /><rect x={-190} y={-52} width={380} height={104} rx={52} fill="none" stroke={ICE} strokeWidth={5} />
              <path d="M-8,52 L8,52 L0,76 Z" fill="#FFFFFF" />
              <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={62} fill={NOUS}>New skill</text>
            </g>
          ) : null}
          {/* caption under the tree */}
          {(() => {
            const k = sp(t, tBetter, 'pop');
            return k > 0.01 ? (
              <g transform={`translate(${TX} 2142) scale(${0.7 + 0.3 * k})`} opacity={clamp01(k * 1.5)}>
                <rect x={-430} y={-58} width={860} height={104} rx={52} fill="#000030" opacity={0.7} stroke={ICE} strokeOpacity={0.6} strokeWidth={3} />
                <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={62} fill="#FFFFFF">Better with every use</text>
              </g>
            ) : null;
          })()}

          {/* ---- task card ---- */}
          <g transform={`translate(${-(1 - bench) * 500} 0)`}>
            <Plate id={id} x={CX0} y={990} w={CW} h={380} r={40} glow={0.9 * flash(t, tTask, 10)} accent={OKG}>
              <rect x={CX0 + 40} y={1030} width={64} height={76} rx={12} fill="none" stroke="#FFFFFF" strokeWidth={6} /><rect x={CX0 + 56} y={1018} width={32} height={22} rx={8} fill="#FFFFFF" />
              <text x={CX0 + 130} y={1096} fontFamily={FONT} fontWeight={800} fontSize={76} fill="#FFFFFF">Task</text>
              {hard > 0.01 ? (
                <g transform={`translate(${CX0 + CW - 150} 1068) scale(${hard}) rotate(${6 - 6 * hard + Math.sin(t * 1.4) * 2 * (1 - done)})`}>
                  <rect x={-116} y={-46} width={232} height={92} rx={46} fill={AMBER} />
                  <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={62} fill="#3A2300">Hard</text>
                </g>
              ) : null}
              {[0, 1, 2].map((i) => {
                const f = clamp01(prog * 3 - i), y = 1176 + i * 62;
                return (
                  <g key={i}>
                    <circle cx={CX0 + 62} cy={y} r={19} fill={f >= 1 ? OKG : 'none'} stroke={f >= 1 ? OKG : SILVER} strokeWidth={5} />
                    {f >= 1 ? <path d={`M${CX0 + 52},${y} l8,8 l13,-16`} fill="none" stroke="#03251A" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /> : null}
                    <rect x={CX0 + 104} y={y - 12} width={[500, 420, 470][i]} height={24} rx={12} fill="#FFFFFF" opacity={0.14} />
                    <rect x={CX0 + 104} y={y - 12} width={[500, 420, 470][i] * f} height={24} rx={12} fill={f >= 1 ? OKG : ICE} />
                  </g>
                );
              })}
            </Plate>
            {done > 0.01 ? (
              <g transform={`translate(${CX0 + CW - 60} 1346) scale(${done}) rotate(${-10 + 10 * done})`}>
                <rect x={-150 + 6} y={-52 + 14} width={300} height={104} rx={52} fill="#000030" opacity={0.6} />
                <rect x={-150} y={-52} width={300} height={104} rx={52} fill={OKG} stroke="#FFFFFF" strokeWidth={5} />
                <path d="M-108,2 l18,18 l32,-38" fill="none" stroke="#03251A" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
                <text x={36} y={24} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={66} fill="#03251A">Done</text>
              </g>
            ) : null}
          </g>
          <Burst t={t} at={tTask} x={CX0 + CW - 60} y={1346} color={OKG} n={14} r={220} />

          {/* ---- it writes itself a skill file ---- */}
          {file > 0.01 ? (
            <g transform={`translate(${-(1 - file) * 400} 0)`} opacity={clamp01(file * 1.5)}>
              <path d={`M${CX0 + 300},1380 V1420 M${CX0 + 280},1404 L${CX0 + 300},1426 L${CX0 + 320},1404`} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
              <Plate id={id} x={CX0} y={1440} w={CW} h={520} r={40} glow={flash(t, tWrites, 9) + flash(t, tSkill, 10)} accent={ICE} fill={`url(#${id}-paper)`}>
                <rect x={CX0} y={1440} width={CW} height={120} rx={40} fill={NOUS} /><rect x={CX0} y={1510} width={CW} height={50} fill={NOUS} />
                <path d={`M${CX0 + 40},1470 h40 l18,18 v48 h-58 z`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinejoin="round" />
                <text x={CX0 + 122} y={1524} fontFamily={MONO} fontWeight={600} fontSize={60} fill="#FFFFFF">SKILL.md</text>
                {isNew > 0.01 ? (
                  <g transform={`translate(${CX0 + CW - 100} 1500) scale(${isNew}) rotate(${10 - 10 * isNew})`}>
                    <rect x={-82} y={-40} width={164} height={80} rx={40} fill={GOLD} /><text x={0} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={54} fill="#3A2A00">New</text>
                  </g>
                ) : null}
                {[560, 470, 530, 500, 420, 300].map((w, i) => {
                  const f = clamp01(wr * 6 - i), y = 1604 + i * 56;
                  return (
                    <g key={i}>
                      <rect x={CX0 + 40} y={y} width={590} height={24} rx={12} fill={INK} opacity={0.07} />
                      <rect x={CX0 + 40} y={y} width={w * f} height={24} rx={12} fill={i === 0 ? NOUS : '#4A56C8'} opacity={i === 0 ? 1 : 0.75} />
                      {f > 0 && f < 1 ? (
                        <g transform={`translate(${CX0 + 40 + w * f} ${y + 10}) rotate(-38)`}>
                          <rect x={0} y={-11} width={150} height={22} rx={6} fill={INK} /><path d="M0,-11 L-28,0 L0,11 Z" fill={SILVER} /><rect x={120} y={-11} width={30} height={22} rx={6} fill={GOLD} />
                        </g>
                      ) : null}
                    </g>
                  );
                })}
              </Plate>
            </g>
          ) : null}
          {/* "itself": the art feeds the file - a dashed loop down the left gutter */}
          {self > 0.01 ? (
            <g opacity={clamp01(self * 1.4) * (0.55 + 0.45 * flash(t, tItself, 20))}>
              <path d={`M${acx - 120},${artY + artH + 22} C${acx - 120},${artY + artH + 70} 444,950 444,1040 V1640 C444,1690 466,1700 496,1700`} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeDasharray="6 20" strokeDashoffset={-t * 5} strokeLinecap="round" />
              <path d="M474,1680 L500,1700 L474,1720" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : null}
          {/* spark: file -> first leaf */}
          {(() => {
            const q = seg(t, tNew, tSkill);
            if (q <= 0 || q >= 1) return null;
            const e = inOut(q), x = lerp(CX0 + CW, leaf0.x, e), y = lerp(1700, leaf0.y, e) - Math.sin(q * Math.PI) * 120;
            return <g><circle cx={x} cy={y} r={34} fill="#FFFFFF" opacity={0.3} /><circle cx={x} cy={y} r={15} fill="#FFFFFF" /></g>;
          })()}
        </g>
      ) : null}

      {/* ================= bay 2: proof, price, models ================= */}
      <GitProof id={id} src={ASSETS.ghHermes} url="github.com/NousResearch/hermes-agent" x={PX} y={345} w={PW} t={t} tIn={tPanel} tMark={tFree + 6} tLens={tFree + 11}
        lens={{x: B2 + 20, y: 1162, w: 760}} accent={ICE} rim={ICE} mit={tFree + 2} pulse={flash(t, tFree + 11, 8)} />
      <Burst t={t} at={tFree + 11} x={B2 + 400} y={1310} color={GOLD} n={14} r={300} />
      {/* FREE · MIT */}
      {freeK > 0.01 ? (
        <g transform={`translate(${PX + 380} 1300) scale(${(0.3 + 0.7 * freeK) * (1 + 0.05 * flash(t, tFree, 6))}) rotate(${-9 + 6 * freeK})`} opacity={clamp01(freeK * 1.6)}>
          <rect x={-394} y={-134} width={788} height={268} rx={60} fill="#FFFFFF" opacity={0.2 + 0.3 * flash(t, tFree, 10)} />
          <rect x={-374 + 8} y={-114 + 22} width={748} height={228} rx={50} fill="#000030" opacity={0.6} />
          <rect x={-374} y={-114} width={748} height={228} rx={50} fill={`url(#${id}-silver)`} />
          <rect x={-354} y={-94} width={708} height={188} rx={36} fill="none" stroke={NOUS} strokeWidth={6} />
          <text x={0} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={124} fill={NOUS} letterSpacing={-1}>FREE · MIT</text>
        </g>
      ) : null}
      <Burst t={t} at={tFree} x={PX + 380} y={1300} color="#FFFFFF" n={18} r={420} />

      {/* any AI model: chips plug into the rail */}
      {(() => {
        const k = sp(t, tAny - 3, 'pop');
        return k > 0.01 ? (
          <g opacity={clamp01(k * 1.5)}>
            <rect x={PX} y={1752} width={RW} height={14} rx={7} fill="#000030" opacity={0.8} />
            <rect x={PX} y={1752} width={RW * clamp01(k)} height={14} rx={7} fill={ICE} opacity={0.5 + 0.5 * pulse} />
            {CHIPS.map((c, i) => <rect key={i} x={c.x + c.w / 2 - 50} y={1738} width={100} height={22} rx={8} fill="#FFFFFF" opacity={0.85} />)}
          </g>
        ) : null;
      })()}
      {CHIPS.map((c, i) => {
        const k = sp(t, chipT[i], 'bouncy');
        if (k <= 0.01) return null;
        const plugged = flash(t, chipT[i] + 4, 8);
        return (
          <g key={i} transform={`translate(0 ${-(1 - k) * 260})`} opacity={clamp01(k * 1.6)}>
            <rect x={c.x + c.w / 2 - 34} y={1722} width={68} height={22} rx={6} fill={SILVER} />
            <Plate id={id} x={c.x} y={1552} w={c.w} h={172} r={44} glow={plugged} accent="#FFFFFF">
              {c.icon ? <LogoDot icon={c.icon} cx={c.x + 74} cy={1638} r={46} bg="#FFFFFF" fg="#0B0B10" ring={ICE} /> : (
                <g transform={`translate(${c.x + 74} 1638) scale(0.85)`}>
                  <circle r={54} fill="#FFFFFF" /><path d="M-18,-30 v20 M18,-30 v20 M-30,-10 h60 v14 a30,30 0 0 1 -60,0 z M0,34 v14" fill="none" stroke={NOUS} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              <text x={c.x + 136} y={1657} fontFamily={FONT} fontWeight={700} fontSize={52} letterSpacing={-0.5} fill="#FFFFFF">{c.label}</text>
            </Plate>
          </g>
        );
      })}
      {CHIPS.map((c, i) => <Burst key={i} t={t} at={chipT[i] + 4} x={c.x + c.w / 2} y={1748} color="#FFFFFF" n={10} r={150} />)}
      {/* label over the chips */}
      {(() => {
        const k = sp(t, tAny - 2, 'pop');
        return k > 0.01 ? <text x={PX + 6} y={1528} fontFamily={MONO} fontWeight={600} fontSize={50} fill={ICE} letterSpacing={3} opacity={clamp01(k)}>USE ANY AI MODEL</text> : null;
      })()}

      {/* hosted cloud from $20 / month */}
      {hosted > 0.01 ? (
        <g transform={`translate(0 ${(1 - hosted) * 300})`} opacity={clamp01(hosted * 1.5)}>
          <Plate id={id} x={PX} y={1806} w={RW} h={330} r={50} glow={flash(t, tTwenty, 10) + 0.6 * flash(t, tMonth, 10)} accent={ICE}>
            <SvgImg src={ASSETS.hermesWing} x={PX + 44} y={1876} w={190} h={190} radius={42} />
            {/* cloud glyph */}
            <g transform={`translate(${PX + 330} 1912) translate(0 ${Math.sin(t * 0.1) * 5}) scale(0.82)`}>
              <path d="M-58,24 a34,34 0 0 1 6,-66 a46,46 0 0 1 88,-6 a38,38 0 0 1 22,72 z" fill="#FFFFFF" opacity={0.95} />
            </g>
            <text x={PX + 428} y={1928} fontFamily={FONT} fontWeight={700} fontSize={64} fill="#FFFFFF">Hosted cloud</text>
            <text x={PX + 282} y={2072} fontFamily={FONT} fontWeight={600} fontSize={72} fill={ICE}>from</text>
            <g transform={`translate(${PX + 480} 2072) scale(${twenty})`} opacity={clamp01(twenty * 1.5)}>
              <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={150} fill="#FFFFFF" letterSpacing={-3}>
                <tspan fill={flash(t, tDollars, 8) > 0.2 ? GOLD : '#FFFFFF'}>$</tspan>20
              </text>
            </g>
            <text x={PX + 770} y={2072} fontFamily={FONT} fontWeight={700} fontSize={84} fill="#FFFFFF" opacity={0.25 + 0.75 * clamp01(month)}>/month</text>
            {month > 0.01 ? (
              <g transform={`translate(${PX + RW - 272} 1906) scale(${0.6 + 0.4 * month})`} opacity={clamp01(month * 1.5)}>
                <rect x={-252} y={-46} width={504} height={92} rx={46} fill="#FFFFFF" /><text x={0} y={17} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={51} letterSpacing={-1} fill={NOUS}>Nous Portal Plus</text>
              </g>
            ) : null}
          </Plate>
        </g>
      ) : null}
      {/* coin glint on "dollars" */}
      <Burst t={t} at={tDollars} x={PX + 520} y={2020} color={GOLD} n={12} r={200} />

      {/* ================= the catch: setup checklist (ends centred on the camera) ================= */}
      {catchK > 0.01 ? (
        <g>
          <rect x={B2 - 1700} y={-900} width={3400} height={4200} fill="#02022E" opacity={0.74 * clamp01(catchK)} />
          <g transform={`translate(${(1 - catchK) * 1500} 0) rotate(${(1 - catchK) * 5} ${B2} ${CY})`}>
            <ellipse cx={B2} cy={CY} rx={1000} ry={820} fill={`url(#${id}-halo)`} opacity={0.22} />
            <rect x={CL.x + 14} y={CL.y + 36} width={CL.w} height={CL.h} rx={56} fill="#00001A" opacity={0.6} />
            <rect x={CL.x} y={CL.y} width={CL.w} height={CL.h} rx={56} fill={`url(#${id}-paper)`} />
            <g clipPath={`url(#${id}-cl)`}>
              <rect x={CL.x} y={CL.y} width={CL.w} height={250} fill={NOUS} />
              {Array.from({length: 30}).map((_, i) => <line key={i} x1={CL.x + CL.w - 200} y1={CL.y + 125} x2={CL.x + CL.w - 200 + Math.cos((i / 30) * Math.PI * 2 + t * 0.01) * 420} y2={CL.y + 125 + Math.sin((i / 30) * Math.PI * 2 + t * 0.01) * 420} stroke="#FFFFFF" strokeWidth={2} opacity={0.14} />)}
            </g>
            <SvgImg src={ASSETS.hermesWing} x={CL.x + 56} y={CL.y + 50} w={150} h={150} radius={34} />
            <rect x={CL.x + 56} y={CL.y + 50} width={150} height={150} rx={34} fill="none" stroke="#FFFFFF" strokeWidth={4} />
            <text x={CL.x + 250} y={CL.y + 166} fontFamily={FONT} fontWeight={800} fontSize={128} fill="#FFFFFF" letterSpacing={-2}>The catch</text>
            {rows.map((r, i) => {
              const y = CL.y + 290 + i * 284;
              const k = sp(t, r.at, 'bouncy'), hot = flash(t, r.at, 12) + (i < 2 ? 0.7 * flash(t, tModel2, 9) * (i === 0 ? 1 : 0.4) : 0);
              const you = sp(t, tYou + i * 2.2, 'bouncy');
              return (
                <g key={i}>
                  <rect x={CL.x + 40} y={y} width={CL.w - 80} height={254} rx={40} fill={k > 0.4 ? '#E3E8FF' : '#F4F6FD'} stroke={NOUS} strokeOpacity={0.15 + 0.85 * clamp01(k)} strokeWidth={4 + 5 * hot} />
                  <rect x={CL.x + 40} y={y} width={14 + 6 * hot} height={254} rx={7} fill={NOUS} opacity={clamp01(k)} />
                  <g transform={`translate(${CL.x + 150} ${y + 127}) scale(${1 + 0.14 * hot})`}>
                    <rect x={-56} y={-56} width={112} height={112} rx={26} fill="#FFFFFF" stroke={k > 0.4 ? NOUS : '#9AA5CF'} strokeWidth={8} />
                    <text x={0} y={24} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={68} fill={k > 0.4 ? NOUS : '#9AA5CF'}>{i + 1}</text>
                  </g>
                  <text x={CL.x + 250} y={y + 118} fontFamily={FONT} fontWeight={800} fontSize={86} fill={INK}>{r.title}</text>
                  <text x={CL.x + 252} y={y + 196} fontFamily={MONO} fontWeight={600} fontSize={47} fill="#4A56B0">{r.sub}</text>
                  {you > 0.01 ? (
                    <g transform={`translate(${CL.x + CL.w - 225} ${y + 82}) scale(${you}) rotate(${8 - 8 * you})`}>
                      <rect x={-105} y={-46} width={210} height={92} rx={46} fill={NOUS} /><text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={62} fill="#FFFFFF">You</text>
                    </g>
                  ) : null}
                </g>
              );
            })}
            <rect x={CL.x} y={CL.y} width={CL.w} height={CL.h} rx={56} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.9} />
            <rect x={CL.x - 12} y={CL.y - 12} width={CL.w + 24} height={CL.h + 24} rx={66} fill="none" stroke={ICE} strokeWidth={6} opacity={0.35 + 0.5 * pulse} />
          </g>
        </g>
      ) : null}
      <Burst t={t} at={tYou} x={B2} y={CY} color="#FFFFFF" n={24} r={900} />
    </svg>
  );
};

export const hermesWorld: WorldDef = {
  id: 's08-hermes-atelier', home: 'hermes',
  anchors: {
    hermes: {x: 1300, y: CY, zoom: 0.72},
    free: {x: B2, y: CY, zoom: 0.72},
  },
  aliases: {use: 'free'},
  palette: {bg0: '#02022E', bg1: '#141CE0', particles: '#DDE6FF', glow: '#8C95FF'},
  Draw,
};
