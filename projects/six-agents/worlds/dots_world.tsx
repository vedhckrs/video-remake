// S03 "Dots studio" - a pastel pink / lilac studio at dusk with glossy giant dots on the floor. Four stations along
// one wall; the camera glides between them when the voice names them, and Iggy (the real OpenAI card art, unaltered)
// pops out of the Dots card and travels with it:
//   home  - the Dots AgentCard (portal lands here), OpenAI wordmark, Alfred / Todd / Jojo fan out behind the card
//   desk  - "its own cloud computer": a cloud desktop window showing OpenAI's official slide, 4,000+ counter, app tiles
//   phone - iMessage chat, then the Face ID approval sheet
//   pass  - ChatGPT Pro pass, "$100+/mo" stamp, "Not in EU / UK yet"
import React from 'react';
import {siGmail, siGooglecalendar, siShopify, siHubspot, siStripe, siImessage} from 'simple-icons';
import {type WorldDef, type WorldDrawProps, wordAt, Burst, Ripple} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {AgentCard, ASSETS, SvgImg, FONT, MONO} from './shared';
import {ArtTile, Panel, Phone, Pill, Shadow, Si, Tick, clamp01, easeIO, easeOut, flash, lerp, ramp, rnd} from './dots_kit';

const id = 's03';
const PINK = '#FF6FAE', HOT = '#FF3D8F', LILAC = '#C9A8FF', INK = '#2A1030', CREAM = '#FFF4FA', BLUE = '#0A84FF', GREEN = '#22C55E';
const A = 700, B = 2040, C = 3380, D = 4720;          // station centres (x); every station is framed at y = 1000
const CARD = {x: 380, y: 640, w: 640};
const FLOOR = 1560;

// ---- the studio ---------------------------------------------------------------------------------------------------
const ORBS: [number, number, number, string][] = [
  [30, 1650, 120, '#C9A8FF'], [1370, 1650, 112, '#FF8CC0'], [1228, 1742, 56, '#8FD3FF'], [2710, 1668, 130, '#FFD766'], [2862, 1750, 62, '#FF8CC0'],
  [4050, 1656, 118, '#9BE37A'], [3916, 1744, 54, '#C9A8FF'], [5390, 1650, 116, '#8FD3FF'], [5540, 1746, 60, '#FFD766'],
];
const Studio: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} gradientUnits="userSpaceOnUse" x1={0} y1={-500} x2={0} y2={FLOOR}>
        <stop offset="0" stopColor="#1C0A21" /><stop offset="0.42" stopColor="#4B1F55" /><stop offset="0.8" stopColor="#9B4C90" /><stop offset="1" stopColor="#D685B6" />
      </linearGradient>
      <linearGradient id={`${id}-floor`} gradientUnits="userSpaceOnUse" x1={0} y1={FLOOR} x2={0} y2={2500}>
        <stop offset="0" stopColor="#7A3577" /><stop offset="0.25" stopColor="#4A1E52" /><stop offset="1" stopColor="#170819" />
      </linearGradient>
      <linearGradient id={`${id}-arch`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD3EA" stopOpacity={0.5} /><stop offset="0.6" stopColor="#D9B4FF" stopOpacity={0.22} /><stop offset="1" stopColor="#C9A8FF" stopOpacity={0.08} />
      </linearGradient>
      <linearGradient id={`${id}-refl`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFC6E4" stopOpacity={0.3} /><stop offset="1" stopColor="#FFC6E4" stopOpacity={0} />
      </linearGradient>
      <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFF1F8" stopOpacity={0.55} /><stop offset="0.5" stopColor="#FFB3DA" stopOpacity={0.18} /><stop offset="1" stopColor="#FFB3DA" stopOpacity={0} />
      </radialGradient>
      {ORBS.map(([, , , c], i) => (
        <radialGradient key={i} id={`${id}-orb${i}`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.16" stopColor={c} /><stop offset="0.75" stopColor={c} stopOpacity={0.92} /><stop offset="1" stopColor="#3A1440" />
        </radialGradient>
      ))}
    </defs>
    <rect x={-1200} y={-900} width={8000} height={FLOOR + 900} fill={`url(#${id}-wall)`} />
    {/* arches with a soft lamp glow inside each */}
    {Array.from({length: 11}).map((_, i) => {
      const cx = -640 + i * 670, glow = 0.75 + 0.25 * Math.sin(t * 0.03 + i * 1.7);
      return (
        <g key={i}>
          <path d={`M${cx - 250} ${FLOOR} V690 A250 250 0 0 1 ${cx + 250} 690 V${FLOOR} Z`} fill={`url(#${id}-arch)`} />
          <path d={`M${cx - 250} ${FLOOR} V690 A250 250 0 0 1 ${cx + 250} 690 V${FLOOR}`} fill="none" stroke="#FFE3F2" strokeOpacity={0.4} strokeWidth={4} />
          <path d={`M${cx - 205} ${FLOOR} V700 A205 205 0 0 1 ${cx + 205} 700 V${FLOOR}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
          <circle cx={cx} cy={760} r={300} fill={`url(#${id}-lamp)`} opacity={glow} />
          <rect x={cx - 250} y={FLOOR} width={500} height={520} fill={`url(#${id}-refl)`} opacity={0.7} />
        </g>
      );
    })}
    {/* wall rail of tiny dots */}
    {Array.from({length: 80}).map((_, i) => <circle key={i} cx={-900 + i * 90} cy={FLOOR - 46} r={5} fill="#FFE3F2" opacity={0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t * 0.08 - i * 0.6))} />)}
    <rect x={-1200} y={FLOOR} width={8000} height={1400} fill={`url(#${id}-floor)`} />
    <rect x={-1200} y={FLOOR - 2} width={8000} height={4} fill="#FFE3F2" opacity={0.45} />
    {[1, 2, 3, 4, 5].map((k) => <rect key={k} x={-1200} y={FLOOR + k * k * 26} width={8000} height={2} fill="#FFC6E4" opacity={0.1} />)}
    {/* glossy giant dots resting on the floor */}
    {ORBS.map(([x, y, r, c], i) => {
      const dy = Math.sin(t * 0.05 + i * 1.9) * 8;
      return (
        <g key={i}>
          <ellipse cx={x} cy={y + r * 0.98} rx={r * 0.9} ry={r * 0.16} fill="#12041A" opacity={0.42} />
          <circle cx={x} cy={y + dy - 14} r={r} fill={`url(#${id}-orb${i})`} />
          <ellipse cx={x - r * 0.3} cy={y + dy - 14 - r * 0.42} rx={r * 0.26} ry={r * 0.14} fill="#FFFFFF" opacity={0.55} transform={`rotate(-28 ${x - r * 0.3} ${y + dy - 14 - r * 0.42})`} />
          <circle cx={x} cy={y + dy - 14} r={r} fill="none" stroke={c} strokeOpacity={0.5} strokeWidth={3} />
        </g>
      );
    })}
  </g>
);

// ---- mechanical drum counter (SVG) -----------------------------------------------------------------------------------
const Drum: React.FC<{x: number; y: number; size: number; t: number; at: number; dur: number; to: number}> = ({x, y, size, t, at, dur, to}) => {
  const v = to * easeOut(ramp(t, at, dur));
  const cw = size * 0.7, ch = size * 1.24, gap = size * 0.07, pad = size * 0.16, comma = size * 0.26;
  const n = String(to).length;
  const smooth = (a: number, b: number, q: number) => { const p = clamp01((q - a) / (b - a)); return p * p * (3 - 2 * p); };
  const pos = (i: number) => {
    const P = Math.pow(10, i);
    if (i === 0) return v;
    return Math.floor(v / P) + smooth((P - 1) / P, 1, (v % P) / P);
  };
  const total = n * cw + (n - 1) * gap + comma + pad * 2;
  const live = t >= at && t < at + dur;
  let cx = x + pad;
  const cols: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const p = ((pos(i) % 10) + 10) % 10, base = Math.floor(p), fr = p - base;
    cols.push(
      <g key={i} transform={`translate(${cx} ${y + pad})`}>
        <clipPath id={`${id}-dc${i}`}><rect width={cw} height={ch} rx={size * 0.07} /></clipPath>
        <rect width={cw} height={ch} rx={size * 0.07} fill={`url(#${id}-drum)`} />
        <g clipPath={`url(#${id}-dc${i})`}>
          {[0, 1].map((k) => (
            <text key={k} x={cw / 2} y={ch / 2 + size * 0.36 + (fr - k) * size * 1.12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill="#FFF6FB">{(base + k) % 10}</text>
          ))}
          <rect width={cw} height={ch} fill={`url(#${id}-drumsh)`} />
        </g>
      </g>,
    );
    cx += cw + gap;
    if (i === 3) {
      cols.push(<text key="c" x={cx + comma * 0.3} y={y + pad + ch - size * 0.1} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={size * 0.8} fill="#FFF6FB">,</text>);
      cx += comma;
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-drum`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12061A" /><stop offset="0.5" stopColor="#4A2356" /><stop offset="1" stopColor="#12061A" />
        </linearGradient>
        <linearGradient id={`${id}-drumsh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.7} /><stop offset="0.3" stopColor="#000" stopOpacity={0} /><stop offset="0.7" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.75} />
        </linearGradient>
        <linearGradient id={`${id}-house`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD3EA" /><stop offset="0.35" stopColor="#E889BD" /><stop offset="0.7" stopColor="#8F3F8A" /><stop offset="1" stopColor="#E7A6D6" />
        </linearGradient>
      </defs>
      <Shadow x={x} y={y} w={total} h={ch + pad * 2} r={size * 0.2} o={0.3} />
      <rect x={x} y={y} width={total} height={ch + pad * 2} rx={size * 0.2} fill={`url(#${id}-house)`} />
      <rect x={x + 5} y={y + 5} width={total - 10} height={ch + pad * 2 - 10} rx={size * 0.17} fill="#2B1034" />
      {cols}
      <rect x={x + total / 2 - size * 0.14} y={y + pad * 0.3} width={size * 0.28} height={size * 0.05} rx={size * 0.03} fill={live ? '#FFFFFF' : PINK} opacity={live ? 1 : 0.7} />
    </g>
  );
};

// real app logos (Simple Icons) for the "4,000+ apps" tiles
const APPS = [siGmail, siGooglecalendar, siShopify, siHubspot, siStripe];
const GHOST = ['#FF8CC0', '#8FD3FF', '#FFD766', '#9BE37A', '#C9A8FF'];

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const w = (word: string, d: number) => wordAt(beats, word, d);
  const T = {
    first: w('first', 11), openai: w("openai's", 28.5), dots: w('dots', 47.5), each: w('each', 92.5), dot: w('dot', 99), gets: w('gets', 105.5),
    own: w('own', 116), cloud: w('cloud', 123.5), computer: w('computer', 131), links: w('links', 149.5), four: w('four', 166.5), thousand: w('thousand', 174),
    apps: w('apps', 185.5), even: w('even', 215.5), text: w('text', 220.5), im: w('imessage', 233), asks: w('asks', 270.5), before: w('before', 278.5),
    pays: w('pays', 291.5), comes: w('comes', 327), chatgpt: w('chatgpt', 339), pro: w('pro', 360), hundred: w('hundred', 386), dollars: w('dollars', 393),
    month: w('month', 403), not: w('not', 427.5), europe: w('europe', 436), yet: w('yet', 443),
  };

  // ---- Iggy: in the card window -> pops out -> travels station to station ----
  const win = CARD.w * 0.84;
  const popAt = T.dots + 14;
  const pop = sp(t, popAt, 'bouncy');
  const q1 = easeIO(ramp(t, T.each - 2, 46)), q2 = easeIO(ramp(t, T.even - 2, 50)), q3 = easeIO(ramp(t, T.comes - 2, 50));
  const P = [
    {x: A, y: CARD.y + CARD.w * 0.08 + win / 2, s: win, r: 0},
    {x: 1668, y: 604, s: 250, r: -6},
    {x: 3734, y: 656, s: 300, r: 5},
    {x: 4306, y: 1404, s: 290, r: -5},
  ];
  const mixP = (k: 'x' | 'y' | 's' | 'r') => P[0][k] + (P[1][k] - P[0][k]) * q1 + (P[2][k] - P[1][k]) * q2 + (P[3][k] - P[2][k]) * q3;
  const arc = Math.sin(Math.PI * q1) + Math.sin(Math.PI * q2) + Math.sin(Math.PI * q3);
  const hop = [T.dot, T.computer, T.thousand, T.im, T.pays, T.pro, T.hundred, T.yet].reduce((m, at) => m + (t >= at ? Math.sin(Math.min(1, (t - at) / 10) * Math.PI) : 0), 0);
  const ig = {
    x: mixP('x'), y: mixP('y') - 46 * pop * (1 - q1) - 120 * arc - 26 * hop,
    s: mixP('s') * (1 + 0.1 * pop * (1 - q1)), r: mixP('r') - 5 * pop * (1 - q1) + 8 * Math.sin(Math.PI * 2 * (q1 + q2 + q3)),
  };

  // ---- home ----
  const kAlf = sp(t, T.first, 'bouncy'), kTodd = sp(t, T.openai, 'bouncy'), kJojo = sp(t, T.dots, 'bouncy');
  const kOA = sp(t, T.openai, 'pop'), kNames = sp(t, T.dots + 4, 'pop');
  const cardGlow = Math.max(flash(t, T.dots, 12), flash(t, T.first, 10) * 0.5);

  // ---- desk ----
  const kCloud = sp(t, T.cloud, 'settle'), kWin = sp(t, T.computer, 'pop');
  const kOwn = sp(t, T.own, 'pop');
  const WX = 1560, WY = 690, WW = 960, BAR = 66, WH = BAR + 540;
  const kLink = easeOut(ramp(t, T.links, 14));
  const tileX = (i: number) => B + (i - 2) * 185, TY = 1548, TS = 150;
  const kPlus = sp(t, T.thousand + 6, 'bouncy'), kAppsTxt = sp(t, T.apps, 'pop');
  const curX = B + 250 * Math.sin(t * 0.045 + 1), curY = WY + BAR + 290 + 130 * Math.cos(t * 0.06);

  // ---- phone ----
  const PX = 2960, PY = 500, PW = 580, PH = 1180, SW = PW - 32;
  const kMsg = sp(t, T.text, 'pop'), kBadge = sp(t, T.im, 'bouncy'), kReply = sp(t, T.im + 16, 'pop');
  const typing = t >= T.im - 2 && t < T.im + 16;
  const kAsk = sp(t, T.asks, 'pop'), kSheet = sp(t, T.before, 'settle'), kPaid = sp(t, T.pays, 'bouncy');
  const scan = ramp(t, T.before + 4, Math.max(4, T.pays - T.before - 4));
  const SX = 2900, SY = 1160, SHW = 700, SHH = 570;

  // ---- pass ----
  const kHead = sp(t, T.comes, 'pop'), kPass = sp(t, T.comes + 3, 'settle'), kGpt = sp(t, T.chatgpt, 'pop'), kPro = sp(t, T.pro, 'bouncy');
  const kStamp = sp(t, T.hundred, 'bouncy'), kChip = sp(t, T.not, 'pop'), kSlash = easeOut(ramp(t, T.europe, 8)), kYet = sp(t, T.yet, 'bouncy');
  const STX = 4800, STY = 1196;

  return (
    <svg width={5600} height={2400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#5A2466" stopOpacity={0.92} /><stop offset="1" stopColor="#1B0920" stopOpacity={0.96} />
        </linearGradient>
        <linearGradient id={`${id}-pass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3A1244" /><stop offset="0.5" stopColor="#170619" /><stop offset="1" stopColor="#4A1340" />
        </linearGradient>
        <linearGradient id={`${id}-holo`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF8CC0" /><stop offset="0.35" stopColor="#FFD766" /><stop offset="0.65" stopColor="#8FD3FF" /><stop offset="1" stopColor="#C9A8FF" />
        </linearGradient>
        <linearGradient id={`${id}-hot`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8CC0" /><stop offset="1" stopColor={HOT} /></linearGradient>
        <linearGradient id={`${id}-im`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#67F27F" /><stop offset="1" stopColor="#12B83A" /></linearGradient>
        <clipPath id={`${id}-win`}><rect x={WX} y={WY} width={WW} height={WH} rx={28} /></clipPath>
      </defs>
      <Studio t={t} />

      {/* ================= HOME: the Dots card ================= */}
      <ArtTile src={ASSETS.dotsAlfred} cx={lerp(860, 1108, kAlf)} cy={lerp(1000, 930, kAlf)} size={280} t={t} seed={3} rot={lerp(0, 11, kAlf)} opacity={clamp01(kAlf * 2)} />
      <ArtTile src={ASSETS.dotsTodd} cx={lerp(540, 300, kTodd)} cy={1300} size={270} t={t} seed={5} rot={lerp(0, -10, kTodd)} opacity={clamp01(kTodd * 2)} />
      <ArtTile src={ASSETS.dotsJojo} cx={lerp(540, 310, kJojo)} cy={lerp(900, 800, kJojo)} size={236} t={t} seed={7} rot={lerp(0, -8, kJojo)} opacity={clamp01(kJojo * 2)} />
      <Ripple t={t} at={T.dots} x={A} y={1090} color="#FFC6E4" r={620} />
      <AgentCard id="dots" x={CARD.x} y={CARD.y} w={CARD.w} t={t} glow={cardGlow} uid={`${id}dots`} />
      {/* the window slot once Iggy has popped out */}
      {pop > 0.01 ? (
        <g opacity={clamp01(pop * 1.5)}>
          <rect x={CARD.x + CARD.w * 0.08} y={CARD.y + CARD.w * 0.08} width={win} height={win} rx={CARD.w * 0.06} fill="#3A1340" />
          <rect x={CARD.x + CARD.w * 0.08 + 14} y={CARD.y + CARD.w * 0.08 + 14} width={win - 28} height={win - 28} rx={CARD.w * 0.05} fill="none" stroke="#FFB3DA" strokeOpacity={0.55} strokeWidth={4} strokeDasharray="18 16" />
          <g transform={`rotate(${t * 0.6} ${A} ${P[0].y})`}><SvgImg src={ASSETS.dotsRing} x={A - 110} y={P[0].y - 110} w={220} h={220} opacity={0.75} /></g>
        </g>
      ) : null}
      {/* OpenAI wordmark */}
      {kOA > 0.01 ? (
        <g transform={`translate(${A} 522) scale(${0.7 + 0.3 * kOA})`} opacity={clamp01(kOA * 1.5)}>
          <SvgImg src={ASSETS.openaiLogo} x={-172} y={-46} w={344} h={92} filter="invert(1)" />
          <rect x={-172} y={62} width={344 * easeOut(ramp(t, T.openai + 4, 12))} height={5} rx={2.5} fill={`url(#${id}-holo)`} />
        </g>
      ) : null}
      {/* the dots' names (as on OpenAI's page) */}
      {kNames > 0.01 ? (
        <g transform={`translate(${A} ${1655 + 40 * (1 - kNames)})`} opacity={clamp01(kNames * 1.5)}>
          <Panel x={-390} y={-56} w={780} h={112} r={56} fill={`url(#${id}-glass)`} stroke="rgba(255,198,228,0.6)" />
          <g transform={`rotate(${t * 1.2} -322 0)`}><SvgImg src={ASSETS.dotsRing} x={-360} y={-38} w={76} h={76} /></g>
          <text x={40} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill="#FFFFFF">Iggy · Alfred · Todd · Jojo</text>
        </g>
      ) : null}

      {/* ================= DESK: its own cloud computer + 4,000 apps ================= */}
      {kCloud > 0.01 ? (
        <g opacity={0.3 * clamp01(kCloud * 1.4)} transform={`translate(${B} 720) scale(${0.6 + 0.4 * kCloud}) translate(${-B} -720)`}>
          {[[1700, 730, 150], [1890, 660, 185], [2120, 640, 205], [2350, 700, 165], [2490, 770, 110], [1590, 790, 100]].map(([x, y, r], i) => (
            <circle key={i} cx={x + Math.sin(t * 0.03 + i) * 10} cy={y + Math.cos(t * 0.04 + i * 2) * 6} r={r} fill="#FFFFFF" />
          ))}
        </g>
      ) : null}
      <g opacity={clamp01(kOwn * 1.5)}><Panel x={1800} y={556} w={720} h={100} r={50} fill={`url(#${id}-glass)`} stroke="rgba(255,198,228,0.6)" /></g>
      <text x={1840} y={625} fontFamily={FONT} fontWeight={800} fontSize={54} fill="#FFFFFF">
        <tspan opacity={0.25 + 0.75 * kOwn}>Its own </tspan>
        <tspan opacity={0.25 + 0.75 * kCloud} fill={t >= T.cloud ? '#FFD3EA' : '#FFFFFF'}>cloud </tspan>
        <tspan opacity={0.25 + 0.75 * kWin}>computer</tspan>
      </text>
      {kWin > 0.01 ? (
        <g transform={`translate(${B} ${WY + WH / 2}) scale(${0.35 + 0.65 * kWin}) translate(${-B} ${-(WY + WH / 2)})`} opacity={clamp01(kWin * 1.6)}>
          <Shadow x={WX} y={WY} w={WW} h={WH} r={28} o={0.34} d={40} />
          <g clipPath={`url(#${id}-win)`}>
            <rect x={WX} y={WY} width={WW} height={WH} fill="#FFFFFF" />
            <rect x={WX} y={WY + BAR} width={WW} height={540} fill="#FBDDE6" />
            <SvgImg src={ASSETS.dotsSlides[0]} x={WX - WW * 0.17} y={WY + BAR - 540 * 0.2} w={WW * 1.3} h={540 * 1.3} fit="cover" />
            <rect x={WX} y={WY + BAR} width={WW} height={540} fill="#FFFFFF" opacity={1 - ramp(t, T.computer + 5, 12)} />
            <rect x={WX} y={WY} width={WW} height={BAR} fill="#F6ECF4" />
            <rect x={WX} y={WY + BAR - 2} width={WW} height={2} fill="#E4D2E2" />
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => <circle key={c} cx={WX + 40 + i * 34} cy={WY + BAR / 2} r={11} fill={c} />)}
            <text x={WX + WW / 2} y={WY + 46} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={36} fill="#5B4466">Iggy's cloud computer</text>
          </g>
          <rect x={WX + 1.5} y={WY + 1.5} width={WW - 3} height={WH - 3} rx={28} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={3} />
          {/* a cursor working by itself */}
          <g transform={`translate(${curX} ${curY})`}>
            <circle r={26 + 30 * (1 - flash(t, T.links, 9))} fill="none" stroke={HOT} strokeWidth={5} opacity={flash(t, T.links, 9)} />
            <path d="M0 0 L0 44 L12 33 L20 52 L28 48 L20 30 L36 30 Z" fill="#1A1020" stroke="#FFFFFF" strokeWidth={3.5} strokeLinejoin="round" />
          </g>
        </g>
      ) : null}
      {/* links from the computer down to the apps */}
      {kLink > 0.01 ? APPS.map((_, i) => {
        const x1 = tileX(i), q = (t * 0.03 + i * 0.21) % 1, mt = 1 - q;
        const bx = mt * mt * mt * B + 3 * mt * mt * q * B + 3 * mt * q * q * x1 + q * q * q * x1;
        const by = mt * mt * mt * (WY + WH) + 3 * mt * mt * q * (WY + WH + 150) + 3 * mt * q * q * (TY - 150) + q * q * q * TY;
        return (
          <g key={i}>
            <path d={`M${B} ${WY + WH} C${B} ${WY + WH + 150} ${x1} ${TY - 150} ${x1} ${TY}`} fill="none" stroke="#FFC6E4" strokeWidth={5} strokeLinecap="round" opacity={0.75}
              pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - kLink} />
            {kLink > 0.98 ? <circle cx={bx} cy={by} r={8} fill="#FFFFFF" opacity={0.9} /> : null}
          </g>
        );
      }) : null}
      {/* (25 Nov, Ved's higher framing: the two pastel "dot" tile rows that sat below the logos reached the YouTube
          name/description zone at the bottom - removed; the ghost tiles beside the logo row carry "thousands more".) */}
      {[-4, -3, 3, 4].map((i) => {
        const dist = Math.abs(i);
        const k = sp(t, T.thousand + dist * 2.2, 'bouncy');
        if (k <= 0.01) return null;
        const bump = 1 + 0.14 * flash(t, T.apps + dist * 1.6, 5) * (t >= T.apps + dist * 1.6 ? 1 : 0);
        return (
          <g key={i} transform={`translate(${B + i * 185} ${TY + TS / 2}) scale(${k * bump * (dist === 3 ? 0.9 : 0.78)})`} opacity={dist === 3 ? 0.7 : 0.4}>
            <rect x={-TS / 2} y={-TS / 2} width={TS} height={TS} rx={36} fill="#FFF4FA" />
            <circle r={30} fill={GHOST[(i + 5) % 5]} />
          </g>
        );
      })}
      {APPS.map((ic, i) => {
        const dist = Math.abs(i - 2);
        const k = sp(t, T.thousand - 2 + dist * 2.2, 'bouncy');
        if (k <= 0.01) return null;
        const bump = 1 + 0.16 * flash(t, T.apps + dist * 1.6, 5) * (t >= T.apps + dist * 1.6 ? 1 : 0);
        return (
          <g key={i} transform={`translate(${tileX(i)} ${TY + TS / 2 - 10 * Math.sin(t * 0.07 + i)}) scale(${k * bump})`}>
            <Shadow x={-TS / 2} y={-TS / 2} w={TS} h={TS} r={36} o={0.3} d={18} />
            <rect x={-TS / 2} y={-TS / 2} width={TS} height={TS} rx={36} fill="#FFFFFF" />
            <rect x={-TS / 2 + 2} y={-TS / 2 + 2} width={TS - 4} height={TS - 4} rx={34} fill="none" stroke="#F3D4E6" strokeWidth={3} />
            <Si icon={ic} x={-43} y={-43} size={86} />
          </g>
        );
      })}
      {/* 4,000+ apps */}
      {t >= T.links + 6 ? (
        <g opacity={clamp01((t - T.links - 6) / 6)}>
          <Drum x={1688} y={1332} size={104} t={t} at={T.four} dur={20} to={4000} />
          <text x={2118} y={1472} fontFamily={FONT} fontWeight={800} fontSize={130} fill={`url(#${id}-hot)`} transform={`translate(2150 1430) scale(${kPlus}) translate(-2150 -1430)`} opacity={clamp01(kPlus * 2)}>+</text>
          <g opacity={0.3 + 0.7 * kAppsTxt} transform={`translate(${6 * (1 - kAppsTxt)} 0)`}>
            <text x={2222} y={1420} fontFamily={FONT} fontWeight={800} fontSize={76} fill="#FFFFFF">apps</text>
            <text x={2224} y={1472} fontFamily={MONO} fontWeight={600} fontSize={37} fill="#FFD3EA" letterSpacing={1}>connected</text>
          </g>
        </g>
      ) : null}
      <Burst t={t} at={T.thousand + 6} x={2150} y={1420} color="#FFC6E4" n={18} r={150} />

      {/* ================= PHONE: text it on iMessage, it asks before it pays ================= */}
      <ArtTile src={ASSETS.dotsJojo} cx={lerp(3080, 2932, sp(t, T.asks, 'bouncy'))} cy={940} size={222} t={t} seed={9} rot={-9} opacity={clamp01(sp(t, T.asks, 'pop') * 2)} />
      <Phone id={`${id}-ph`} x={PX} y={PY} w={PW} h={PH}>
        <rect width={SW} height={206} fill="#F7F7F9" />
        <rect y={204} width={SW} height={2} fill="#E3E3E8" />
        <path d="M34 108 L18 124 L34 140" fill="none" stroke={BLUE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={SW / 2} cy={108} r={44} fill="#FCE0EE" />
        <SvgImg src={ASSETS.dotsRing} x={SW / 2 - 29} y={79} w={58} h={58} />
        <text x={SW / 2} y={190} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#15151A">Dots</text>
        <text x={SW / 2} y={258} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={30} fill="#8E8E93">iMessage</text>
        {/* my text */}
        {kMsg > 0.01 ? (
          <g transform={`translate(${SW - 24} 426) scale(${kMsg}) translate(${-(SW - 24)} -426)`}>
            <rect x={SW - 24 - 336} y={290} width={336} height={136} rx={40} fill={BLUE} />
            <text x={SW - 24 - 168} y={346} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={38} fill="#FFFFFF">Order my usual</text>
            <text x={SW - 24 - 168} y={396} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={38} fill="#FFFFFF">coffee beans</text>
          </g>
        ) : null}
        {typing ? (
          <g>
            <rect x={24} y={452} width={132} height={76} rx={38} fill="#E9E9EB" />
            {[0, 1, 2].map((i) => <circle key={i} cx={62 + i * 28} cy={490 - 7 * Math.max(0, Math.sin(t * 0.6 - i * 0.9))} r={9} fill="#8E8E93" />)}
          </g>
        ) : null}
        {kReply > 0.01 ? (
          <g transform={`translate(24 528) scale(${kReply}) translate(-24 -528)`}>
            <rect x={24} y={452} width={170} height={76} rx={38} fill="#E9E9EB" />
            <text x={109} y={504} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={38} fill="#15151A">On it.</text>
          </g>
        ) : null}
        {kAsk > 0.01 ? (
          <g transform={`translate(24 622) scale(${kAsk}) translate(-24 -622)`}>
            <rect x={24} y={546} width={448} height={76} rx={38} fill="#E9E9EB" />
            <text x={248} y={598} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={38} fill="#15151A">Approve to pay?</text>
          </g>
        ) : null}
        <rect x={24} y={1052} width={SW - 48} height={66} rx={33} fill="none" stroke="#D1D1D6" strokeWidth={3} />
        <circle cx={SW - 58} cy={1085} r={24} fill={BLUE} />
      </Phone>
      {/* iMessage badge */}
      {kBadge > 0.01 ? (
        <g transform={`translate(3734 962) scale(${kBadge})`}>
          <Shadow x={-72} y={-72} w={144} h={144} r={36} o={0.3} d={18} />
          <rect x={-72} y={-72} width={144} height={144} rx={36} fill={`url(#${id}-im)`} />
          <Si icon={siImessage} x={-46} y={-46} size={92} color="#FFFFFF" />
          <text x={0} y={136} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={52} fill="#FFFFFF">iMessage</text>
        </g>
      ) : null}
      <Ripple t={t} at={T.im} x={3734} y={962} color="#8CF5A0" r={220} />
      {/* Face ID approval sheet */}
      {kSheet > 0.01 ? (
        <g transform={`translate(0 ${(1 - kSheet) * 640})`} opacity={clamp01(kSheet * 2)}>
          <Panel x={SX} y={SY} w={SHW} h={SHH} r={52} fill="#FFFFFF" stroke={kPaid > 0.5 ? GREEN : '#F3C4DC'} sw={5} shadow={0.4} sheen={0} />
          <rect x={SX + SHW / 2 - 46} y={SY + 18} width={92} height={9} rx={4.5} fill="#D9D3DE" />
          <text x={SX + SHW / 2} y={SY + 98} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={52} fill={INK}>Review and approve</text>
          <rect x={SX + 44} y={SY + 136} width={SHW - 88} height={104} rx={26} fill="#FBF1F7" />
          <rect x={SX + 64} y={SY + 152} width={72} height={72} rx={18} fill="#B6783F" /><rect x={SX + 82} y={SY + 170} width={36} height={12} rx={6} fill="#F4DDBF" /><circle cx={SX + 100} cy={SY + 204} r={10} fill="#F4DDBF" />
          <text x={SX + 160} y={SY + 201} fontFamily={FONT} fontWeight={600} fontSize={38} fill={INK}>Coffee beans</text>
          <rect x={SX + SHW - 170} y={SY + 176} width={104} height={22} rx={11} fill="#D9C7D6" />
          {/* Face ID glyph -> approved */}
          <g transform={`translate(${SX + SHW / 2} ${SY + 358})`}>
            {kPaid < 0.6 ? (
              <g opacity={1 - kPaid}>
                {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
                  <path key={i} d={`M${sx * 78} ${sy * 40} V${sy * 62} A16 16 0 0 ${sx * sy > 0 ? 0 : 1} ${sx * 62} ${sy * 78} H${sx * 40}`} fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" />
                ))}
                <path d="M-26 -22 V-6 M26 -22 V-6 M2 -24 V8 Q2 16 -8 16 M-26 34 Q0 54 26 34" fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" />
                <rect x={-84} y={-70 + 140 * (0.5 - 0.5 * Math.cos(scan * Math.PI * 3))} width={168} height={6} rx={3} fill={HOT} opacity={scan > 0 && scan < 1 ? 0.9 : 0} />
              </g>
            ) : null}
            <Tick cx={0} cy={0} r={80} k={kPaid} fill={GREEN} />
          </g>
          <text x={SX + SHW / 2} y={SY + 510} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill={kPaid > 0.5 ? '#12843A' : BLUE}>
            {kPaid > 0.5 ? 'Approved with Face ID' : 'Confirm with Face ID'}
          </text>
        </g>
      ) : null}
      <Burst t={t} at={T.pays} x={SX + SHW / 2} y={SY + 358} color="#7CF0A0" n={20} r={230} />

      {/* ================= PASS: ChatGPT Pro, $100+/mo, not in Europe yet ================= */}
      {kHead > 0.01 ? <text x={D} y={540} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={44} fill="#FFD3EA" letterSpacing={8} opacity={clamp01(kHead * 1.5)}>COMES WITH</text> : null}
      <ArtTile src={ASSETS.dotsAlfred} cx={lerp(5000, 5130, sp(t, T.pro, 'bouncy'))} cy={lerp(700, 600, sp(t, T.pro, 'bouncy'))} size={210} t={t} seed={11} rot={10} opacity={clamp01(sp(t, T.pro, 'pop') * 2)} />
      <ArtTile src={ASSETS.dotsTodd} cx={lerp(4420, 4330, sp(t, T.dollars, 'bouncy'))} cy={lerp(940, 1060, sp(t, T.dollars, 'bouncy'))} size={200} t={t} seed={13} rot={-8} opacity={clamp01(sp(t, T.dollars, 'pop') * 2)} />
      {kPass > 0.01 ? (
        <g transform={`translate(${D} 790) rotate(${-3 + 6 * (1 - kPass)}) scale(${0.7 + 0.3 * kPass}) translate(${-D} -790)`} opacity={clamp01(kPass * 1.6)}>
          <Shadow x={4290} y={580} w={860} h={420} r={44} o={0.4} d={44} />
          <rect x={4290} y={580} width={860} height={420} rx={44} fill={`url(#${id}-pass)`} />
          <rect x={4290} y={868} width={860} height={10} fill={`url(#${id}-holo)`} opacity={0.9} />
          <rect x={4292} y={582} width={856} height={416} rx={42} fill="none" stroke={`url(#${id}-holo)`} strokeWidth={4} opacity={0.85} />
          <SvgImg src={ASSETS.openaiLogo} x={4344} y={622} w={216} h={58} filter="invert(1)" />
          <text x={4340} y={808} fontFamily={FONT} fontWeight={800} fontSize={104} fill="#FFFFFF" opacity={0.3 + 0.7 * kGpt} letterSpacing={-2}>ChatGPT</text>
          {kPro > 0.01 ? (
            <g transform={`translate(4950 770) scale(${kPro})`}>
              <rect x={-112} y={-64} width={224} height={128} rx={36} fill={`url(#${id}-hot)`} />
              <text x={0} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={92} fill="#FFFFFF">Pro</text>
            </g>
          ) : null}
          <g transform={`rotate(${t * 1.1} 4372 940)`}><SvgImg src={ASSETS.dotsRing} x={4344} y={912} w={56} h={56} /></g>
          <text x={4420} y={955} fontFamily={FONT} fontWeight={600} fontSize={40} fill="#FFD3EA">Dots included</text>
        </g>
      ) : null}
      {/* the price stamp */}
      {kStamp > 0.01 ? (
        <g transform={`translate(${STX} ${STY}) rotate(-6) scale(${2.3 - 1.3 * kStamp})`} opacity={clamp01(kStamp * 2)}>
          <Shadow x={-330} y={-150} w={660} h={300} r={40} o={0.36} d={30} />
          <rect x={-330} y={-150} width={660} height={300} rx={40} fill={CREAM} />
          <rect x={-316} y={-136} width={632} height={272} rx={30} fill="none" stroke={HOT} strokeWidth={8} />
          <rect x={-300} y={-120} width={600} height={240} rx={20} fill="none" stroke={HOT} strokeWidth={3} strokeDasharray="4 12" />
          <text x={-272} y={-62} fontFamily={MONO} fontWeight={600} fontSize={40} fill="#8A3B6A" letterSpacing={3}>FROM</text>
          <text x={-276} y={58} fontFamily={FONT} fontWeight={800} fontSize={150} fill={HOT} letterSpacing={-4}
            transform={`translate(-276 58) scale(${1 + 0.07 * flash(t, T.dollars, 6)}) translate(276 -58)`}>$100+</text>
          <text x={206} y={58} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={72} fill={INK} opacity={0.45 + 0.55 * sp(t, T.month, 'pop')}>/mo</text>
          <rect x={150} y={72} width={112 * easeOut(ramp(t, T.month, 8))} height={8} rx={4} fill={HOT} />
          <text x={-272} y={112} fontFamily={FONT} fontWeight={700} fontSize={42} fill={INK}>ChatGPT Pro</text>
        </g>
      ) : null}
      <Burst t={t} at={T.hundred + 2} x={STX} y={STY} color="#FFC6E4" n={22} r={420} />
      {/* not in EU / UK yet */}
      {kChip > 0.01 ? (
        <g transform={`translate(${4812 + 80 * (1 - kChip)} 1578)`} opacity={clamp01(kChip * 1.6)}>
          <Panel x={-340} y={-66} w={680} h={132} r={66} fill={`url(#${id}-glass)`} stroke={t >= T.europe ? '#FF8F8F' : 'rgba(255,198,228,0.6)'} sw={4} />
          <g transform="translate(-270 0)">
            <circle r={40} fill="#3B1B4A" stroke="#C9A8FF" strokeWidth={4} />
            <ellipse rx={18} ry={40} fill="none" stroke="#C9A8FF" strokeWidth={3} />
            <path d="M-40 0 H40 M-34 -20 H34 M-34 20 H34" stroke="#C9A8FF" strokeWidth={3} />
            <path d={`M-32 -32 L${-32 + 64 * kSlash} ${-32 + 64 * kSlash}`} stroke="#FF5A6A" strokeWidth={10} strokeLinecap="round" opacity={kSlash > 0 ? 1 : 0} />
            <circle r={46} fill="none" stroke="#FF5A6A" strokeWidth={6} opacity={kSlash} />
          </g>
          <text x={-204} y={17} fontFamily={FONT} fontWeight={700} fontSize={48} fill="#FFFFFF">Not in EU / UK <tspan fill={t >= T.yet ? '#FFD766' : '#FFFFFF'}>yet</tspan></text>
          <rect x={194} y={30} width={86 * kYet} height={6} rx={3} fill="#FFD766" />
        </g>
      ) : null}

      {/* ================= Iggy (on top of everything) ================= */}
      <ArtTile src={ASSETS.dotsIggy} cx={ig.x} cy={ig.y} size={ig.s} t={t} seed={1} rot={ig.r} rim={clamp01(pop * 1.4)} life={0.4 + 0.8 * pop} />
      <Burst t={t} at={popAt} x={A} y={P[0].y} color="#FFC6E4" n={20} r={380} />
    </svg>
  );
};

export const dotsWorld: WorldDef = {
  id: 's03',
  home: 'home',
  anchors: {
    home: {x: A, y: 985, zoom: 1.1},
    desk: {x: B, y: 985, zoom: 1.1},
    phone: {x: C, y: 985, zoom: 1.1},
    pass: {x: D, y: 985, zoom: 1.1},
  },
  // one move per sentence: "Each dot gets its own cloud computer" / "even text it on iMessage" / "It comes with ChatGPT Pro"
  aliases: {each: 'desk', even: 'phone', comes: 'pass'},
  palette: {bg0: '#1A0A1F', bg1: '#6B2F6E', particles: '#FFD3EA', glow: '#FF9CCB'},
  Draw,
};
