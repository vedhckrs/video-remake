// S02 - 'Cloud vs your PC'. One tall world: a glowing glass cloud (top) over a desk (bottom).
// 'Four' -> Dots, Muse, Grok Bot and Claude Duet rise out of the line-up into the cloud, each docking into its own
// little cloud computer (window); 'big company's' -> the four real maker logos clip on; 'own computer' -> every window
// gets its own frame + cursor. 'Two' -> the camera glides down to the desk, the laptop opens, OpenClaw + Hermes hop
// onto it; FREE / OPEN SOURCE / MIT chips stamp on their words; 'yours' -> "Runs on your own computer".
// END STATE: the Dots card (in its cloud computer) sits at screen (0.30, 0.32) and steps forward for S03's portal.
import React from 'react';
import {siMeta, siAnthropic} from 'simple-icons';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, Burst, Ripple} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {AGENTS, ASSETS, ORDER, FONT, SvgImg, usePreload, type AgentId} from './shared';
import {Z, ALL, GREEN, Card, GlowDefs, Spark, Pill, clamp01, lerp, smooth, outC, easeIO, rnd, decay, hop} from './frame_kit';

const p = 's02';
const CW = 230, CH = CW * 1.42, LW = 190;
const HOME_Y = 920, DESK_Y = 1325, PAN = DESK_Y - HOME_Y;   // desk framing puts the Dots art centre (324, 1094) at screen (0.30, 0.32)
const DOCKS: {id: AgentId; x: number; top: number; launch: number}[] = [
  {id: 'dots', x: 324, top: 979, launch: 0}, {id: 'muse', x: 756, top: 979, launch: 3},
  {id: 'grok', x: 324, top: 499, launch: 6}, {id: 'duet', x: 756, top: 499, launch: 9},
];
const LOCAL: {id: AgentId; wait: number; x: number}[] = [{id: 'openclaw', wait: 420, x: 400}, {id: 'hermes', wait: 660, x: 680}];
const startX = (id: AgentId) => 125 + ORDER.indexOf(id) * 166;
const ROW_Y = 1506.5;
const CLOUD: [number, number, number][] = [[250, 560, 190], [470, 470, 200], [720, 500, 215], [910, 660, 160], [150, 790, 130], [950, 930, 120], [125, 1090, 130], [955, 1190, 140], [330, 1290, 110], [740, 1300, 110]];

const CloudShape: React.FC<{grow: number; fill: string}> = ({grow, fill}) => (
  <g fill={fill}>
    <rect x={70 - grow} y={540 - grow} width={940 + 2 * grow} height={830 + 2 * grow} rx={170} />
    {CLOUD.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r + grow} />)}
  </g>
);

const MakerChip: React.FC<{id: AgentId; x: number; y: number; k: number}> = ({id, x, y, k}) => {
  if (k <= 0.01) return null;
  const w = id === 'dots' ? 136 : id === 'muse' ? 150 : id === 'grok' ? 112 : 218, h = 48;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-w / 2 + 2} y={-h / 2 + 5} width={w} height={h} rx={h / 2} fill="#000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#FFFFFF" />
      {id === 'dots' ? <SvgImg src={ASSETS.openaiLogo} x={-50} y={-13.5} w={100} h={27} /> : null}
      {id === 'grok' ? <SvgImg src={ASSETS.xaiLogo} x={-37} y={-14} w={74} h={28} /> : null}
      {id === 'muse' ? (
        <g>
          <path d={siMeta.path} fill={'#' + siMeta.hex} transform="translate(-60 -17) scale(1.4)" />
          <text x={-18} y={10.5} fontFamily={FONT} fontWeight={700} fontSize={30} fill="#10131C">Meta</text>
        </g>
      ) : null}
      {id === 'duet' ? (
        <g>
          <path d={siAnthropic.path} fill="#141413" transform="translate(-96 -14) scale(1.15)" />
          <text x={-60} y={10.5} fontFamily={FONT} fontWeight={700} fontSize={30} fill="#141413">Anthropic</text>
        </g>
      ) : null}
    </g>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats, cam}) => {
  usePreload(ALL.map((id) => AGENTS[id].art).concat([ASSETS.openaiLogo, ASSETS.xaiLogo]));
  const tFour = wordAt(beats, 'four', 10), tLive = wordAt(beats, 'live', 24.5), tBig = wordAt(beats, 'big', 35.5), tCo = wordAt(beats, "company's", 42);
  const tCloud = wordAt(beats, 'cloud', 52.5), tOwn = wordAt(beats, 'own', 80), tComp = wordAt(beats, 'computer', 84.5);
  const tTwo = wordAt(beats, 'two', 121), tFree = wordAt(beats, 'free', 132.5), tOpen = wordAt(beats, 'open', 145), tSrc = wordAt(beats, 'source', 154.5);
  const tRun = wordAt(beats, 'run', 171), tYours = wordAt(beats, 'yours', 178.5), tEnd = tYours + 8;

  const pan = clamp01((cam.y - HOME_Y) / PAN);
  const o1 = 1 - smooth(pan / 0.6);                 // the top row melts into the cloud as the camera leaves
  const swell = 1 + 0.02 * sp(t, tBig, 'settle') + 0.03 * decay(t, tBig, 7) + 0.004 * Math.sin(t * 0.07);
  const rim = 0.5 + 0.5 * Math.max(decay(t, tCloud, 14), decay(t, tLive, 9) * 0.6) + 0.1 * Math.sin(t * 0.12);
  const lid = sp(t, tTwo, 'settle'), lamp = sp(t, tTwo + 2, 'settle');
  const run = sp(t, tRun, 'pop');
  const hero = smooth((t - tEnd) / 12);            // Dots steps forward at the very end

  return (
    <svg width={1080} height={2500} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <GlowDefs p={p} />
      <defs>
        <linearGradient id={`${p}-bg`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="2500">
          <stop offset="0" stopColor="#071B5C" /><stop offset="0.3" stopColor="#1857C8" /><stop offset="0.5" stopColor="#2A3F9C" />
          <stop offset="0.62" stopColor="#2A1B3C" /><stop offset="0.8" stopColor="#241208" /><stop offset="1" stopColor="#0E0704" />
        </linearGradient>
        <radialGradient id={`${p}-sun`}><stop offset="0" stopColor="#BFE6FF" stopOpacity={0.85} /><stop offset="0.5" stopColor="#5AA8FF" stopOpacity={0.3} /><stop offset="1" stopColor="#5AA8FF" stopOpacity={0} /></radialGradient>
        <radialGradient id={`${p}-warm`}><stop offset="0" stopColor="#FFC06A" stopOpacity={0.7} /><stop offset="1" stopColor="#FF9A3C" stopOpacity={0} /></radialGradient>
        <linearGradient id={`${p}-cl`} gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="1400">
          <stop offset="0" stopColor="#5E9BFF" /><stop offset="0.45" stopColor="#2957C4" /><stop offset="1" stopColor="#122C7A" />
        </linearGradient>
        <linearGradient id={`${p}-clhi`} gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="900"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.4} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${p}-win`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0C2466" /><stop offset="1" stopColor="#061233" /></linearGradient>
        <linearGradient id={`${p}-lid`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5A6274" /><stop offset="0.5" stopColor="#2A2F3C" /><stop offset="1" stopColor="#3C4352" /></linearGradient>
        <linearGradient id={`${p}-scr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141C36" /><stop offset="1" stopColor="#070B18" /></linearGradient>
        <linearGradient id={`${p}-base`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D6DAE3" /><stop offset="1" stopColor="#8D94A4" /></linearGradient>
        <linearGradient id={`${p}-desk`} gradientUnits="userSpaceOnUse" x1="0" y1="1945" x2="0" y2="2500"><stop offset="0" stopColor="#6B4426" /><stop offset="0.12" stopColor="#4A2D17" /><stop offset="1" stopColor="#1A0E06" /></linearGradient>
        <linearGradient id={`${p}-cone`} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD58A" stopOpacity={0.5} /><stop offset="1" stopColor="#FFD58A" stopOpacity={0} /></linearGradient>
        <clipPath id={`${p}-scrclip`}><rect x={218} y={1473} width={644} height={394} rx={12} /></clipPath>
      </defs>

      {/* sky -> room */}
      <rect x={-700} y={-700} width={2480} height={3900} fill={`url(#${p}-bg)`} />
      <circle cx={540} cy={880} r={900} fill={`url(#${p}-sun)`} opacity={0.55 + 0.25 * rim} />
      {[0, 1, 2, 3, 4].map((i) => {
        const x = ((rnd(i * 3.7) * 1500 + t * (0.25 + rnd(i) * 0.3)) % 1500) - 210, y = 250 + rnd(i * 5.3) * 1050, s = 0.6 + rnd(i * 2.2) * 0.7;
        return <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.13} fill="#FFFFFF"><ellipse rx={120} ry={34} /><circle cx={-40} cy={-22} r={38} /><circle cx={30} cy={-34} r={48} /></g>;
      })}
      <circle cx={540} cy={1760} r={820} fill={`url(#${p}-warm)`} opacity={0.12 + 0.4 * lamp} />
      {/* data rising into the cloud */}
      {Array.from({length: 26}).map((_, i) => {
        const x = 110 + (i % 13) * 72 + rnd(i) * 20, q = ((t * 0.012 * (0.7 + rnd(i * 3)) + rnd(i * 7)) % 1);
        return <rect key={i} x={x} y={1900 - q * 620} width={4} height={16 + rnd(i * 2) * 22} rx={2} fill="#BFE6FF" opacity={Math.sin(q * Math.PI) * (0.2 + 0.4 * decay(t, tCloud, 30)) * (1 - pan)} />;
      })}

      {/* the cloud */}
      <g transform={`translate(540 900) scale(${swell}) translate(-540 -900)`}>
        <g opacity={0.3 + 0.6 * rim}><CloudShape grow={7} fill="#CFEAFF" /></g>
        <CloudShape grow={0} fill={`url(#${p}-cl)`} />
        <g opacity={0.5}><CloudShape grow={-26} fill={`url(#${p}-clhi)`} /></g>
        {/* server lights inside */}
        {Array.from({length: 40}).map((_, i) => (
          <circle key={i} cx={110 + rnd(i * 2.9) * 860} cy={560 + rnd(i * 4.7) * 780} r={3} fill={i % 5 === 0 ? GREEN : '#DDF1FF'}
            opacity={(0.25 + 0.6 * sp(t, tLive + (i % 8), 'pop')) * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.11 + i * 1.9)))} />
        ))}
      </g>
      <Ripple t={t} at={tCloud} x={540} y={900} color="#DDF1FF" r={900} />

      {/* cloud computers + their agents */}
      {DOCKS.map((d, i) => {
        const a = AGENTS[d.id];
        const q = easeIO((t - tFour - d.launch) / 18), landT = tFour + d.launch + 18;
        const live = sp(t, Math.max(landT, tLive - 4 + i * 2), 'pop');
        const own = sp(t, tOwn + i * 1.5, 'bouncy');
        const isTop = d.top < 700, o = isTop ? o1 : 1;
        if (o <= 0.01) return null;
        const h = d.id === 'dots' ? hero : 0, dim = d.id === 'muse' ? 1 - 0.35 * hero : 1;
        const sc = 1 + 0.18 * h + 0.04 * decay(t, landT, 5);
        const ax = d.x, ay = d.top + CW * 0.5;       // art centre = the scale pivot (Dots: screen 0.30, 0.32 at the end)
        const fx = d.x - 131, fy = d.top - 42, fw = 262, fh = CH + 58;
        const cx = lerp(startX(d.id), d.x, q), cy = lerp(ROW_Y, d.top + CH / 2, outC((t - tFour - d.launch) / 18)) - Math.sin(q * Math.PI) * 40;
        return (
          <g key={d.id} opacity={o * dim}>
            <g transform={`translate(${ax} ${ay}) scale(${sc}) translate(${-ax} ${-ay})`}>
              {h > 0.01 ? <circle cx={ax} cy={ay + 40} r={330} fill={`url(#${p}-g-${d.id})`} opacity={h} /> : null}
              <rect x={fx + 5} y={fy + 9} width={fw} height={fh} rx={22} fill="#000" opacity={0.35} />
              <rect x={fx} y={fy} width={fw} height={fh} rx={22} fill={`url(#${p}-win)`} opacity={0.9} />
              <rect x={fx} y={fy} width={fw} height={fh} rx={22} fill={a.accent} opacity={0.14 * live} />
              <rect x={fx} y={fy} width={fw} height={fh} rx={22} fill="none" stroke={live > 0.5 ? a.glow : '#FFFFFF'} strokeWidth={3} strokeDasharray={live > 0.5 ? undefined : '10 9'} opacity={0.45 + 0.4 * live} />
              {[0, 1, 2].map((k) => <circle key={k} cx={fx + 22 + k * 17} cy={fy + 21} r={5.5} fill={['#FF6059', '#FFBD2E', '#28C941'][k]} opacity={0.4 + 0.6 * live} />)}
              <rect x={fx + 78} y={fy + 13} width={118} height={16} rx={8} fill="#FFFFFF" opacity={0.14} />
              <rect x={fx + 78} y={fy + 13} width={118 * (((t * 0.02 + i * 0.3) % 1))} height={16} rx={8} fill={a.glow} opacity={0.35 * live} />
              <circle cx={fx + fw - 22} cy={fy + 21} r={6} fill={GREEN} opacity={live * (0.6 + 0.4 * Math.sin(t * 0.3 + i))} />
              {q >= 1 ? <Card id={d.id} uid={p + d.id} w={CW} t={t} cx={d.x} cy={d.top + CH / 2} glow={Math.max(decay(t, landT, 8), h, own * 0.5)} /> : null}
              {/* its OWN computer: frame brackets + a cursor at work */}
              {own > 0.01 ? (
                <g opacity={own}>
                  <rect x={fx - 7} y={fy - 7} width={fw + 14} height={fh + 14} rx={27} fill="none" stroke={a.glow} strokeWidth={5} opacity={0.5 + 0.5 * decay(t, tOwn + i * 1.5, 10)} />
                  {([[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]] as const).map(([u, v, sx, sy], k) => (
                    <path key={k} d={`M${fx - 9 + u * (fw + 18)},${fy - 9 + v * (fh + 18) + sy * 34} v${-sy * 34} h${sx * 34}`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                  <path transform={`translate(${d.x + Math.sin(t * 0.07 + i * 2) * 70} ${d.top + CH * 0.9 + Math.cos(t * 0.05 + i) * 10}) scale(1.5)`} d="M0,0 L0,22 L6,17 L10,26 L14,24 L10,15 L18,15 Z" fill="#FFFFFF" stroke="#0A1433" strokeWidth={2} strokeLinejoin="round" />
                </g>
              ) : null}
            </g>
            {q < 1 ? <Card id={d.id} uid={p + d.id} w={CW} t={t} cx={cx} cy={cy} s={lerp(150 / CW, 1, q)} rot={Math.sin(q * Math.PI) * (i % 2 ? 7 : -7)} glow={0.5} /> : null}
            <MakerChip id={d.id} x={d.x} y={fy + fh} k={sp(t, tCo + i * 2, 'bouncy') * (d.id === 'dots' ? 1 - h : 1)} />
            <Burst t={t} at={landT} x={d.x} y={d.top + CH / 2} color={a.glow} n={12} r={220} />
          </g>
        );
      })}
      <Pill x={540} y={893} w={610} h={52} fs={31} text="Each on its own cloud computer" fill="#FFFFFF" color="#0A1F5C" s={sp(t, tComp, 'bouncy')} o={o1} />

      {/* ------------------------------ the desk ------------------------------ */}
      <rect x={-700} y={1945} width={2480} height={1300} fill={`url(#${p}-desk)`} />
      <rect x={-700} y={1945} width={2480} height={5} fill="#FFD9A8" opacity={0.35} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-300 + i * 300 + rnd(i) * 80} y={1975 + rnd(i * 3) * 300} width={240 + rnd(i * 2) * 200} height={3} rx={1.5} fill="#000" opacity={0.14} />)}
      {/* lamp */}
      <ellipse cx={1010} cy={1948} rx={56} ry={11} fill="#1C1F2A" /><rect x={1005} y={1690} width={10} height={258} rx={5} fill="#3A4052" />
      <path d="M1010,1694 L948,1612" stroke="#3A4052" strokeWidth={10} strokeLinecap="round" /><circle cx={1010} cy={1694} r={11} fill="#59617A" />
      <polygon points="905,1640 978,1570 1000,1592 930,1664" fill={lamp > 0.5 ? '#FFDFA0' : '#4A5066'} /><polygon points="978,1570 1000,1592 1012,1580 990,1558" fill="#2B3040" />
      <polygon points="905,1640 930,1664 760,1945 420,1945" fill={`url(#${p}-cone)`} opacity={lamp * 0.55} />
      {/* mug */}
      <ellipse cx={92} cy={1950} rx={48} ry={9} fill="#000" opacity={0.35} />
      <path d="M124,1890 q34,2 30,26 q-4,22 -32,20" fill="none" stroke="#E8E2D6" strokeWidth={9} />
      <rect x={56} y={1868} width={72} height={80} rx={12} fill="#EFE9DD" /><rect x={56} y={1868} width={22} height={80} rx={11} fill="#FFFFFF" opacity={0.5} /><ellipse cx={92} cy={1871} rx={34} ry={7} fill="#3A2414" />
      {[0, 1].map((k) => { const q = ((t * 0.018 + k * 0.5) % 1); return <path key={k} d={`M${80 + k * 22},${1858 - q * 60} q10,-14 0,-28 q-10,-14 0,-28`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={Math.sin(q * Math.PI) * 0.35} />; })}
      {/* laptop: the lid opens on 'two' */}
      <ellipse cx={540} cy={1962} rx={470} ry={26} fill="#000" opacity={0.45} />
      <g transform={`translate(0 1885) scale(1 ${Math.max(0.02, lid)}) translate(0 -1885)`}>
        <rect x={200} y={1455} width={680} height={430} rx={26} fill={`url(#${p}-lid)`} />
        <rect x={200} y={1455} width={680} height={430} rx={26} fill="none" stroke="#B9C2D6" strokeWidth={3} opacity={0.7} />
        <rect x={218} y={1473} width={644} height={394} rx={12} fill={`url(#${p}-scr)`} />
        <g clipPath={`url(#${p}-scrclip)`}>
          {Array.from({length: 14}).map((_, r) => {
            const y = 1490 + ((r * 32 - (run > 0.01 ? t * 2.2 : 0)) % 448 + 448) % 448 - 20, w = 90 + rnd(r * 3.1) * 250;
            return (
              <g key={r} opacity={0.5 + 0.3 * run}>
                <rect x={236} y={y} width={18} height={10} rx={5} fill="#5B6B9A" />
                <rect x={268 + (r % 3) * 26} y={y} width={w} height={10} rx={5} fill={['#7FA6FF', '#FF8A7A', '#8C95FF', GREEN][r % 4]} />
                <rect x={280 + (r % 3) * 26 + w} y={y} width={60 + rnd(r) * 90} height={10} rx={5} fill="#3D4A72" />
              </g>
            );
          })}
          <circle cx={400} cy={1680} r={190} fill={`url(#${p}-g-openclaw)`} opacity={0.5} /><circle cx={680} cy={1680} r={190} fill={`url(#${p}-g-hermes)`} opacity={0.5} />
          <rect x={218} y={1473} width={644} height={394} fill={GREEN} opacity={0.1 * decay(t, tRun, 10)} />
        </g>
        <circle cx={540} cy={1464} r={3.5} fill="#0A0C12" />
      </g>
      {lid < 0.06 ? <g><rect x={172} y={1868} width={736} height={18} rx={9} fill={`url(#${p}-lid)`} /><rect x={172} y={1868} width={736} height={4} rx={2} fill="#B9C2D6" opacity={0.6} /></g> : null}
      <polygon points="176,1885 904,1885 950,1950 130,1950" fill={`url(#${p}-base)`} />
      <rect x={130} y={1948} width={820} height={15} rx={7} fill="#6C7384" />
      {[0, 1, 2].map((r) => Array.from({length: 13}).map((_, k) => {
        const wRow = 660 + r * 34, x0 = 540 - wRow / 2, kw = wRow / 13;
        return <rect key={`${r}-${k}`} x={x0 + k * kw + 3} y={1892 + r * 13} width={kw - 6} height={9} rx={3} fill="#2B303C" opacity={0.85 + 0.15 * (run > 0.5 && (Math.floor(t / 2) + k * 3 + r * 5) % 9 === 0 ? -1 : 0)} />;
      }))}
      <rect x={470} y={1933} width={140} height={12} rx={5} fill="#B4BAC7" />
      {lid < 0.5 ? <g opacity={1 - lid * 2}><polygon points="176,1885 904,1885 950,1950 130,1950" fill={`url(#${p}-lid)`} /><polygon points="176,1885 904,1885 950,1950 130,1950" fill="none" stroke="#B9C2D6" strokeWidth={3} opacity={0.6} /><circle cx={540} cy={1916} r={13} fill="#B9C2D6" opacity={0.35} /></g> : null}

      {/* the two open-source agents */}
      {LOCAL.map((l, k) => {
        const a = AGENTS[l.id];
        const q1 = easeIO((t - tFour - 2) / 14), q2 = easeIO((t - tTwo - 3 - k * 4) / 18), landT = tTwo + 3 + k * 4 + 18;
        const x = lerp(lerp(startX(l.id), l.wait, q1), l.x, q2), y = lerp(ROW_Y, 1670, q2) - Math.sin(q2 * Math.PI) * 130 - hop(t, tRun + k * 2, 9) * 22;
        return (
          <g key={l.id}>
            {q2 < 0.05 ? <ellipse cx={x} cy={ROW_Y + 150} rx={90} ry={12} fill="#000" opacity={0.3} /> : null}
            <Card id={l.id} uid={p + l.id} w={LW} t={t} cx={x} cy={y + (q2 < 0.01 ? Math.sin(t * 0.08 + k * 2) * 6 : 0)} s={lerp(150 / LW, 1, q2)}
              rot={Math.sin(q2 * Math.PI) * (k ? 9 : -9)} glow={Math.max(decay(t, landT, 8), decay(t, tRun, 9), decay(t, tYours, 9))} />
            <Burst t={t} at={landT} x={l.x} y={1700} color={a.glow} n={12} r={200} />
          </g>
        );
      })}
      {/* running indicator on the laptop */}
      {run > 0.01 ? (
        <g transform={`translate(540 1500) scale(${run})`}>
          <rect x={-104} y={-22} width={208} height={44} rx={22} fill="#06140C" stroke={GREEN} strokeWidth={2.5} />
          <polygon points="-80,-11 -80,11 -62,0" fill={GREEN} />
          <text x={14} y={10.5} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill="#FFFFFF">running</text>
        </g>
      ) : null}

      {/* OPEN SOURCE · MIT · FREE */}
      <Pill x={385} y={1411} w={284} h={54} fs={30} text="OPEN SOURCE" ls={1} fill="#0B1020" stroke="#FFFFFF" color="#FFFFFF" s={sp(t, tOpen, 'bouncy')} />
      <Pill x={596} y={1411} w={118} h={54} fs={30} text="MIT" ls={1} fill="#FFFFFF" color="#10131C" s={sp(t, tSrc, 'bouncy')} />
      <Pill x={737} y={1411} w={144} h={54} fs={30} text="FREE" ls={1} fill={GREEN} color="#06200F" s={sp(t, tFree, 'bouncy')} />
      <Burst t={t} at={tFree} x={737} y={1411} color={GREEN} n={14} r={150} />
      <Burst t={t} at={tOpen} x={385} y={1411} color="#FFFFFF" n={12} r={170} />
      {[0, 1, 2, 3, 4, 5].map((i) => <Spark key={i} x={300 + rnd(i * 3.1) * 480} y={1380 + rnd(i * 4.7) * 70} r={26 * decay(t, tSrc + i * 0.8, 5)} o={decay(t, tSrc + i * 0.8, 5)} />)}

      {/* yours */}
      <Ripple t={t} at={tYours} x={540} y={1930} color="#FFD58A" r={620} />
      <Pill x={540} y={2040} w={520} h={58} fs={31} text="Runs on your own computer" fill="#FFC36B" color="#1E1004" s={sp(t, tYours, 'bouncy')} />
    </svg>
  );
};

export const s02World: WorldDef = {
  id: 's02', home: 'cloud',
  anchors: {cloud: {x: 540, y: HOME_Y, zoom: Z}, desk: {x: 540, y: DESK_Y, zoom: Z}},
  aliases: {two: 'desk'},
  palette: {bg0: '#050D2A', bg1: '#12408F', particles: '#CFE6FF', glow: '#6FB6FF'},
  Draw,
};
