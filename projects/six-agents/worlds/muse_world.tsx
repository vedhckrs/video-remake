// S04 "Muse day" - a sunny Meta-blue room: tall windows with warm daylight, wooden floor, plants. Four stations along
// the wall; the Muse creature (Meta's official art, unaltered) waves in its card, lifts out and travels with the camera:
//   home  - the Muse AgentCard, Meta logo, the Muse "m" icon, everyday chips
//   chat  - WhatsApp chat (trip, sneakers, phone bill), the bill gets slashed, then the "Approve purchase?" sheet
//   plans - Free · $20 Power · $100 Maximum
//   globe - a dotted globe with pins on the US and Singapore
import React from 'react';
import {siMeta, siWhatsapp, siStripe} from 'simple-icons';
import {type WorldDef, type WorldDrawProps, wordAt, Burst, Ripple} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {AgentCard, ASSETS, SvgImg, FONT, MONO} from './shared';
import {ArtTile, Panel, Phone, Shadow, Si, Tick, clamp01, easeIO, easeOut, flash, lerp, ramp} from './dots_kit';

const id = 's04';
const BLUE = '#0866FF', NAVY = '#0A1F52', INK = '#10203F', WARM = '#FFB45E', SUN = '#FFE2A8', GREEN = '#1FB25A', WA = '#25D366', RED = '#F0453A';
const A = 700, B = 2040, C = 3380, D = 4720;
const CARD = {x: 380, y: 640, w: 640};
const FLOOR = 1560;

// ---- the room ------------------------------------------------------------------------------------------------------
const Room: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} gradientUnits="userSpaceOnUse" x1={0} y1={-500} x2={0} y2={FLOOR}>
        <stop offset="0" stopColor="#050E2A" /><stop offset="0.42" stopColor="#0B2A78" /><stop offset="0.82" stopColor="#1B55CC" /><stop offset="1" stopColor="#3D7BF2" />
      </linearGradient>
      <linearGradient id={`${id}-floor`} gradientUnits="userSpaceOnUse" x1={0} y1={FLOOR} x2={0} y2={2500}>
        <stop offset="0" stopColor="#C98A52" /><stop offset="0.3" stopColor="#8A5530" /><stop offset="1" stopColor="#2A160A" />
      </linearGradient>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6FB2FF" /><stop offset="0.6" stopColor="#BFDcFF" /><stop offset="1" stopColor="#FFE3BD" />
      </linearGradient>
      <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.3" stopColor="#FFF0C4" /><stop offset="0.6" stopColor="#FFD27A" stopOpacity={0.35} /><stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
      </radialGradient>
      <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE0A8" stopOpacity={0.32} /><stop offset="1" stopColor="#FFE0A8" stopOpacity={0.04} />
      </linearGradient>
    </defs>
    <rect x={-1200} y={-900} width={8000} height={FLOOR + 900} fill={`url(#${id}-wall)`} />
    {/* tall windows: sky, sun, drifting clouds, warm light falling on the floor */}
    {Array.from({length: 11}).map((_, i) => {
      const x = -850 + i * 670, wy = 430, ww = 420, wh = 860, sun = i % 2 === 0;
      const cl = ((t * 0.35 + i * 137) % 560) - 70;
      return (
        <g key={i}>
          <clipPath id={`${id}-wc${i}`}><rect x={x} y={wy} width={ww} height={wh} rx={210} /></clipPath>
          <rect x={x - 14} y={wy - 14} width={ww + 28} height={wh + 28} rx={224} fill="#EAF2FF" opacity={0.92} />
          <g clipPath={`url(#${id}-wc${i})`}>
            <rect x={x} y={wy} width={ww} height={wh} fill={`url(#${id}-sky)`} />
            {sun ? <circle cx={x + ww * 0.62} cy={wy + 250} r={210} fill={`url(#${id}-sun)`} /> : null}
            <g fill="#FFFFFF" opacity={0.9}>
              <ellipse cx={x + cl} cy={wy + 470} rx={90} ry={30} /><ellipse cx={x + cl + 50} cy={wy + 448} rx={56} ry={30} />
              <ellipse cx={x + ((cl * 0.7 + 260) % 560) - 60} cy={wy + 640} rx={70} ry={22} />
            </g>
            <rect x={x} y={wy + wh - 150} width={ww} height={150} fill="#FFE3BD" opacity={0.5} />
          </g>
          <rect x={x + ww / 2 - 5} y={wy} width={10} height={wh} fill="#EAF2FF" opacity={0.9} />
          <rect x={x} y={wy + wh * 0.56} width={ww} height={10} fill="#EAF2FF" opacity={0.9} />
          <rect x={x - 30} y={wy + wh + 10} width={ww + 60} height={22} rx={8} fill="#F6FAFF" />
          {/* light beam + floor patch */}
          <polygon points={`${x},${wy + wh + 32} ${x + ww},${wy + wh + 32} ${x + ww + 330},${FLOOR + 330} ${x + 150},${FLOOR + 330}`} fill={`url(#${id}-beam)`} />
          <polygon points={`${x + 120},${FLOOR + 40} ${x + ww + 170},${FLOOR + 40} ${x + ww + 420},${FLOOR + 380} ${x + 260},${FLOOR + 380}`} fill="#FFD9A0" opacity={0.26 + 0.05 * Math.sin(t * 0.03 + i)} />
        </g>
      );
    })}
    <rect x={-1200} y={FLOOR - 40} width={8000} height={40} fill="#0C2F86" />
    <rect x={-1200} y={FLOOR - 44} width={8000} height={5} fill="#8FB6FF" opacity={0.6} />
    <rect x={-1200} y={FLOOR} width={8000} height={1400} fill={`url(#${id}-floor)`} />
    {[1, 2, 3, 4, 5, 6].map((k) => <rect key={k} x={-1200} y={FLOOR + k * k * 20} width={8000} height={3} fill="#3A1F0C" opacity={0.28} />)}
    {Array.from({length: 26}).map((_, i) => <rect key={i} x={-1100 + i * 300 + (i % 2) * 90} y={FLOOR + 20} width={3} height={60} fill="#3A1F0C" opacity={0.22} />)}
    {/* potted plants between the stations */}
    {[-30, 1370, 2710, 4050, 5390].map((px, i) => (
      <g key={i} transform={`translate(${px} ${FLOOR + 96})`}>
        <ellipse cx={0} cy={86} rx={120} ry={20} fill="#1A0C04" opacity={0.4} />
        {[-62, -38, -14, 12, 36, 60].map((a, j) => (
          <ellipse key={j} cx={0} cy={-150} rx={30} ry={150} fill={j % 2 ? '#2FA36B' : '#1F8A57'} transform={`rotate(${a + Math.sin(t * 0.04 + j + i) * 3} 0 0)`} />
        ))}
        <path d="M-74 -6 H74 L58 84 H-58 Z" fill="#E98A4B" /><rect x={-82} y={-22} width={164} height={28} rx={10} fill="#F6A468" />
        <path d="M-74 -6 H-30 L-36 84 H-58 Z" fill="#FFFFFF" opacity={0.16} />
      </g>
    ))}
  </g>
);

// ---- dotted globe ------------------------------------------------------------------------------------------------------
const LAND: [number, number][][] = [
  [[-168, 66], [-156, 71], [-128, 70], [-110, 73], [-95, 72], [-82, 73], [-78, 62], [-64, 60], [-56, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 20], [-91, 18], [-87, 21], [-87, 15], [-83, 10], [-78, 8], [-82, 8], [-92, 15], [-105, 20], [-110, 24], [-114, 30], [-117, 33], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 55], [-160, 60], [-166, 62]],
  [[-55, 60], [-42, 60], [-22, 70], [-20, 80], [-45, 83], [-70, 78], [-55, 70]],
  [[-78, 8], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -15], [-48, -25], [-55, -34], [-65, -41], [-68, -52], [-74, -52], [-73, -40], [-70, -18], [-77, -12], [-81, -5], [-79, 1]],
  [[-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 24], [43, 12], [51, 12], [42, -2], [40, -15], [35, -24], [28, -33], [19, -35], [12, -18], [13, -5], [9, 4], [-5, 5], [-13, 8], [-17, 15]],
  [[-9, 37], [-9, 43], [-1, 44], [-4, 48], [3, 51], [8, 54], [8, 57], [5, 59], [10, 64], [20, 70], [30, 71], [45, 68], [60, 69], [75, 73], [100, 77], [115, 74], [140, 73], [160, 70], [180, 68], [180, 65], [170, 60], [162, 57], [156, 51], [143, 58], [137, 54], [140, 48], [131, 43], [127, 35], [122, 31], [121, 25], [110, 21], [108, 16], [109, 11], [105, 9], [100, 13], [103, 4], [104, 1.3], [101, 3], [98, 8], [98, 16], [94, 17], [91, 22], [86, 20], [80, 15], [78, 8], [74, 15], [72, 21], [67, 25], [57, 25], [60, 22], [52, 17], [44, 13], [42, 17], [35, 28], [35, 36], [27, 37], [27, 41], [23, 38], [20, 40], [15, 38], [16, 41], [12, 44], [8, 44], [3, 43], [0, 39], [-5, 36]],
  [[-5, 50], [1, 51], [0, 54], [-2, 58], [-6, 57], [-4, 54]],
  [[114, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [143, -38], [135, -34], [129, -32], [115, -34]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -2]], [[95, 5], [104, -3], [106, -6], [100, -2]], [[106, -6], [114, -7], [114, -8.5], [106, -7.5]],
  [[131, -1], [141, -3], [150, -6], [147, -10], [138, -8]], [[130, 32], [136, 34], [141, 36], [142, 40], [141, 45], [139, 38], [133, 35]], [[120, 18], [122, 18], [126, 8], [122, 7], [120, 13]],
  [[166, -46], [172, -41], [178, -38], [174, -36], [170, -44]],
];
const inPoly = (x: number, y: number, p: [number, number][]) => {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  }
  return c;
};
const RAD = Math.PI / 180;
const DOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let lat = -54; lat <= 78; lat += 4.5) {
    const n = Math.max(6, Math.round((360 * Math.cos(lat * RAD)) / 4.5));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (360 * (i + 0.5)) / n;
      if (LAND.some((p) => inPoly(lon, lat, p))) out.push([lon, lat]);
    }
  }
  return out;
})();
const project = (lon: number, lat: number, lon0: number, lat0: number) => {
  const l = (lon - lon0) * RAD, p = lat * RAD, p0 = lat0 * RAD;
  return {
    x: Math.cos(p) * Math.sin(l),
    y: -(Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
    z: Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l),
  };
};

const Globe: React.FC<{cx: number; cy: number; R: number; lon0: number; lat0: number; t: number; pins: {lon: number; lat: number; label: string; at: number; side: 1 | -1}[]}> = ({cx, cy, R, lon0, lat0, t, pins}) => {
  const line = (pts: {x: number; y: number; z: number}[]) => {
    let d = '', pen = false;
    for (const q of pts) {
      if (q.z > 0.02) { d += `${pen ? 'L' : 'M'}${(cx + q.x * R).toFixed(1)} ${(cy + q.y * R).toFixed(1)}`; pen = true; } else pen = false;
    }
    return d;
  };
  const grat: string[] = [];
  for (let lon = -180; lon < 180; lon += 30) grat.push(line(Array.from({length: 37}).map((_, i) => project(lon, -90 + i * 5, lon0, lat0))));
  for (let lat = -60; lat <= 60; lat += 30) grat.push(line(Array.from({length: 73}).map((_, i) => project(-180 + i * 5, lat, lon0, lat0))));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-gl`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#5E9BFF" /><stop offset="0.45" stopColor="#1C56D6" /><stop offset="1" stopColor="#071A52" />
        </radialGradient>
        <radialGradient id={`${id}-atm`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.78" stopColor="#9CC6FF" stopOpacity={0} /><stop offset="0.86" stopColor="#9CC6FF" stopOpacity={0.5} /><stop offset="1" stopColor="#9CC6FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy + R * 1.2} rx={R * 0.8} ry={R * 0.09} fill="#0A0F2A" opacity={0.4} />
      <circle cx={cx} cy={cy} r={R * 1.16} fill={`url(#${id}-atm)`} />
      <circle cx={cx} cy={cy} r={R} fill={`url(#${id}-gl)`} />
      <path d={grat.join('')} fill="none" stroke="#BBD6FF" strokeWidth={2} opacity={0.22} />
      {DOTS.map(([lon, lat], i) => {
        const q = project(lon, lat, lon0, lat0);
        if (q.z <= 0.03) return null;
        return <circle key={i} cx={cx + q.x * R} cy={cy + q.y * R} r={(3.2 + 5 * q.z) * (R / 385)} fill="#EAF3FF" opacity={0.35 + 0.6 * q.z} />;
      })}
      <ellipse cx={cx - R * 0.34} cy={cy - R * 0.46} rx={R * 0.4} ry={R * 0.2} fill="#FFFFFF" opacity={0.12} transform={`rotate(-28 ${cx - R * 0.34} ${cy - R * 0.46})`} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#CFE2FF" strokeWidth={3} opacity={0.6} />
      {pins.map((p) => {
        const q = project(p.lon, p.lat, lon0, lat0);
        const k = sp(t, p.at, 'bouncy');
        if (k <= 0.01 || q.z <= -0.05) return null;
        const x = cx + q.x * R, y = cy + q.y * R, drop = (1 - k) * -220;
        const lw = p.label.length * 25 + 56;
        return (
          <g key={p.label}>
            <ellipse cx={x} cy={y} rx={34 + 60 * ((t * 0.04) % 1)} ry={(34 + 60 * ((t * 0.04) % 1)) * 0.5} fill="none" stroke={WARM} strokeWidth={4} opacity={(1 - ((t * 0.04) % 1)) * k} />
            <ellipse cx={x} cy={y} rx={20} ry={9} fill="#071A52" opacity={0.5 * k} />
            <g transform={`translate(${x} ${y + drop})`}>
              <path d="M0 0 C-14 -34 -44 -52 -44 -88 A44 44 0 1 1 44 -88 C44 -52 14 -34 0 0 Z" fill={WARM} stroke="#FFFFFF" strokeWidth={5} />
              <circle cx={0} cy={-88} r={17} fill="#FFFFFF" />
              <g transform={`translate(${p.side * (lw / 2 + 40)} -92)`} opacity={clamp01(k * 1.5)}>
                <rect x={-lw / 2} y={-36} width={lw} height={72} rx={36} fill="#FFFFFF" />
                <text x={0} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={42} fill={INK}>{p.label}</text>
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
};

// little line icons for the everyday chips / chat replies (drawn centred on 0,0 in a 48 box)
const ICONS: Record<string, string> = {
  plane: 'M-20 4 L20 -14 L8 18 L2 6 Z M2 6 L20 -14',
  bag: 'M-15 -6 H15 L18 18 H-18 Z M-8 -6 V-12 A8 8 0 0 1 8 -12 V-6',
  bill: 'M-14 -20 H14 V20 L7 15 L0 20 L-7 15 L-14 20 Z M-7 -9 H7 M-7 0 H7',
  chat: 'M-18 -14 H18 V8 H-4 L-14 18 V8 H-18 Z',
};
const Icon: React.FC<{name: string; cx: number; cy: number; s?: number; color?: string}> = ({name, cx, cy, s = 1, color = '#FFFFFF'}) => (
  <path d={ICONS[name]} transform={`translate(${cx} ${cy}) scale(${s})`} fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
);

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const w = (word: string, d: number) => wordAt(beats, word, d);
  const T = {
    meta: w("meta's", 11.5), muse: w('muse', 20.5), everyday: w('everyday', 39.5), helper: w('helper', 51.5), books: w('books', 73), trips: w('trips', 79.5),
    shops: w('shops', 98), even: w('even', 121.5), neg: w('negotiates', 128), bills: w('bills', 145.5), right: w('right', 155.5), inside: w('inside', 161.5),
    wa: w('whatsapp', 169), checks: w('checks', 200), before: w('before', 215), spends: w('spends', 225.5), most: w('most', 262.5), tasks: w('tasks', 269),
    free: w('free', 281.5), twenty: w('twenty', 303), hundred: w('hundred', 314), dollar: w('dollar', 321), plans: w('plans', 327.5), now: w('now', 368.5),
    only: w('only', 389.5), us: w('us', 405), sg: w('singapore', 417),
  };

  // ---- the creature: waves in the card window -> lifts out -> travels ----
  const win = CARD.w * 0.84;
  const pop = sp(t, T.everyday, 'bouncy');
  const q1 = easeIO(ramp(t, T.helper - 2, 50)), q2 = easeIO(ramp(t, T.most - 2, 50)), q3 = easeIO(ramp(t, T.now - 2, 50));
  const P = [
    {x: A, y: CARD.y + CARD.w * 0.08 + win / 2, s: win, r: 0},
    {x: 2402, y: 1404, s: 290, r: 5},
    {x: C, y: 1424, s: 300, r: -4},
    {x: 4312, y: 1322, s: 280, r: -6},
  ];
  const mixP = (k: 'x' | 'y' | 's' | 'r') => P[0][k] + (P[1][k] - P[0][k]) * q1 + (P[2][k] - P[1][k]) * q2 + (P[3][k] - P[2][k]) * q3;
  const arc = Math.sin(Math.PI * q1) + Math.sin(Math.PI * q2) + Math.sin(Math.PI * q3);
  const hop = [T.muse, T.trips, T.shops, T.bills, T.spends, T.free, T.plans, T.sg].reduce((m, at) => m + (t >= at ? Math.sin(Math.min(1, (t - at) / 10) * Math.PI) : 0), 0);
  const hello = 1 + 0.035 * Math.pow(Math.sin(t * 0.32), 2) * (1 - pop) + 0.05 * flash(t, T.muse, 8);   // waving in the window (cover zoom, never below 1)
  const mu = {
    x: mixP('x'), y: mixP('y') - 40 * pop * (1 - q1) - 120 * arc - 24 * hop * (pop > 0.5 ? 1 : 0),
    s: mixP('s') * (pop > 0.01 ? 1 + 0.08 * pop * (1 - q1) : hello), r: mixP('r') + 4 * pop * (1 - q1) + 3 * Math.sin(t * 0.3) * pop + 7 * Math.sin(Math.PI * 2 * (q1 + q2 + q3)),
  };

  // ---- home ----
  const kMeta = sp(t, T.meta, 'pop'), kIcon = sp(t, T.muse, 'bouncy'), kHelper = sp(t, T.helper, 'pop');
  const CHIPS: [string, number, number][] = [['plane', 236, 800], ['bag', 1164, 760], ['bill', 228, 1290], ['chat', 1172, 1240]];

  // ---- chat ----
  const PX = 1560, PY = 480, PW = 600, PH = 1220, SW = PW - 32;
  const scroll = 252 * easeIO(ramp(t, T.checks - 2, 16));
  const userB = (text: string, y: number, at: number) => {
    const k = sp(t, at, 'pop');
    if (k <= 0.01) return null;
    const bw = text.length * 20.5 + 64;
    return (
      <g transform={`translate(${SW - 22} ${y + 84}) scale(${k}) translate(${-(SW - 22)} ${-(y + 84)})`}>
        <rect x={SW - 22 - bw} y={y} width={bw} height={84} rx={24} fill="#D9FDD3" />
        <text x={SW - 22 - bw + 26} y={y + 55} fontFamily={FONT} fontWeight={500} fontSize={38} fill="#111B21">{text}</text>
        <path d={`M${SW - 62} ${y + 66} l6 6 l12 -13 M${SW - 52} ${y + 66} l6 6 l12 -13`} fill="none" stroke="#53BDEB" strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  };
  const replyB = (text: string, icon: string, col: string, y: number, at: number, done = 1) => {
    const k = sp(t, at, 'pop');
    if (k <= 0.01) return null;
    const bw = text.length * 20 + 150;
    return (
      <g transform={`translate(22 ${y + 84}) scale(${k}) translate(-22 ${-(y + 84)})`}>
        <rect x={22} y={y} width={bw} height={84} rx={24} fill="#FFFFFF" />
        <circle cx={66} cy={y + 42} r={28} fill={col} /><Icon name={icon} cx={66} cy={y + 42} s={0.8} />
        <text x={108} y={y + 55} fontFamily={FONT} fontWeight={600} fontSize={37} fill="#111B21">{text}</text>
        <Tick cx={22 + bw - 34} cy={y + 42} r={17} k={done} fill={GREEN} />
      </g>
    );
  };
  const kBill = sp(t, T.even, 'settle'), kSlash = easeOut(ramp(t, T.neg, 9)), kLower = sp(t, T.bills, 'bouncy');
  const kWa = sp(t, T.wa, 'bouncy'), ring = Math.max(flash(t, T.right, 10), flash(t, T.inside, 10), flash(t, T.wa, 14));
  const SX = 1500, SY = 1140, SHW = 720, SHH = 590;
  const kSheet = sp(t, T.checks, 'settle'), kOk = sp(t, T.spends, 'bouncy');
  const press = flash(t, T.before, 7);
  const BX = 2236, BY = 744, BW = 360, BH = 420;

  // ---- plans ----
  const kMost = sp(t, T.most, 'pop'), kFree = sp(t, T.free, 'bouncy'), k20 = sp(t, T.twenty, 'bouncy'), k100 = sp(t, T.hundred, 'bouncy');
  const kPlans = sp(t, T.plans, 'pop'), bumpD = flash(t, T.dollar, 6);
  const CY = 640, CH = 530, CW = 352, cx0 = (i: number) => 2832 + i * 372;

  // ---- globe ----
  const kNow = sp(t, T.now, 'pop'), kOnly = sp(t, T.only, 'pop');
  const turn = easeIO(ramp(t, T.us + 3, 15));
  const lon0 = -116 + 18 * easeOut(ramp(t, T.now, 38)) - 87 * turn, lat0 = 30 - 8 * turn;

  return (
    <svg width={5600} height={2400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#14429F" stopOpacity={0.95} /><stop offset="1" stopColor="#081A4A" stopOpacity={0.97} />
        </linearGradient>
        <linearGradient id={`${id}-paid`} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#1B57D0" /><stop offset="1" stopColor="#0A2166" /></linearGradient>
        <linearGradient id={`${id}-warm`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD27A" /><stop offset="1" stopColor="#FF9A3D" /></linearGradient>
      </defs>
      <Room t={t} />

      {/* ================= HOME: the Muse card ================= */}
      {CHIPS.map(([name, x, y], i) => {
        const k = sp(t, T.everyday + i * 2.5, 'bouncy');
        if (k <= 0.01) return null;
        return (
          <g key={name} transform={`translate(${lerp(A, x, k)} ${lerp(1000, y, k) + Math.sin(t * 0.07 + i * 1.7) * 10}) scale(${k})`}>
            <Shadow x={-70} y={-70} w={140} h={140} r={70} o={0.3} d={18} />
            <circle r={70} fill={`url(#${id}-warm)`} /><circle r={66} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={3} />
            <Icon name={name} cx={0} cy={0} s={1.7} color={INK} />
          </g>
        );
      })}
      <Ripple t={t} at={T.muse} x={A} y={1090} color="#BBD6FF" r={620} />
      <AgentCard id="muse" x={CARD.x} y={CARD.y} w={CARD.w} t={t} glow={Math.max(flash(t, T.muse, 12), flash(t, T.helper, 10))} uid={`${id}muse`} />
      {pop > 0.01 ? (
        <g opacity={clamp01(pop * 1.5)}>
          <rect x={CARD.x + CARD.w * 0.08} y={CARD.y + CARD.w * 0.08} width={win} height={win} rx={CARD.w * 0.06} fill="#0B2468" />
          <rect x={CARD.x + CARD.w * 0.08 + 14} y={CARD.y + CARD.w * 0.08 + 14} width={win - 28} height={win - 28} rx={CARD.w * 0.05} fill="none" stroke="#9CC0FF" strokeOpacity={0.6} strokeWidth={4} strokeDasharray="18 16" />
          <SvgImg src={ASSETS.museIcon} x={A - 120} y={P[0].y - 120} w={240} h={240} opacity={0.9} />
        </g>
      ) : null}
      {/* Meta logo + Muse icon */}
      {kMeta > 0.01 ? (
        <g transform={`translate(${A - 90} 524) scale(${0.7 + 0.3 * kMeta})`} opacity={clamp01(kMeta * 1.5)}>
          <Panel x={-170} y={-52} w={340} h={104} r={52} fill="#FFFFFF" stroke="#CFE0FF" shadow={0.3} sheen={0} />
          <Si icon={siMeta} x={-136} y={-36} size={72} />
          <text x={44} y={19} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={54} fill="#1C2B33">Meta</text>
        </g>
      ) : null}
      {kIcon > 0.01 ? (
        <g transform={`translate(${A + 180} 524) rotate(${8 * (1 - kIcon) + 3 * Math.sin(t * 0.06)}) scale(${kIcon})`}>
          <Shadow x={-56} y={-56} w={112} h={112} r={28} o={0.3} d={16} />
          <SvgImg src={ASSETS.museIcon} x={-66} y={-66} w={132} h={132} />
        </g>
      ) : null}
      {kHelper > 0.01 ? (
        <g transform={`translate(${A} ${1655 + 40 * (1 - kHelper)})`} opacity={clamp01(kHelper * 1.5)}>
          <Panel x={-330} y={-56} w={660} h={112} r={56} fill={`url(#${id}-glass)`} stroke="rgba(160,196,255,0.7)" />
          <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={46} fill="#FFFFFF">The everyday helper</text>
        </g>
      ) : null}

      {/* ================= CHAT: books trips, shops, negotiates bills - inside WhatsApp ================= */}
      {ring > 0.02 ? <rect x={PX - 22} y={PY - 22} width={PW + 44} height={PH + 44} rx={PW * 0.13 + 22} fill="none" stroke={WA} strokeWidth={10} opacity={ring * 0.9} /> : null}
      <Phone id={`${id}-ph`} x={PX} y={PY} w={PW} h={PH} bg="#EFEAE2">
        {Array.from({length: 24}).map((_, i) => <circle key={i} cx={40 + (i % 4) * 150 + (Math.floor(i / 4) % 2) * 70} cy={230 + Math.floor(i / 4) * 170} r={9} fill="#D9CFC0" opacity={0.5} />)}
        <g transform={`translate(0 ${-scroll})`}>
          {userB('Book a weekend trip', 196, T.books)}
          {replyB('Trip booked', 'plane', BLUE, 296, T.trips + 5)}
          {userB('Find me sneakers', 396, T.shops)}
          {replyB('Found your pair', 'bag', '#8A5CF6', 496, T.shops + 10)}
          {userB('Lower my phone bill', 596, T.even)}
          {t < T.bills ? replyB('Negotiating...', 'bill', WARM, 696, T.neg, 0) : replyB('Bill lowered', 'bill', GREEN, 696, T.bills)}
        </g>
        <rect width={SW} height={176} fill="#008069" />
        <rect y={176} width={SW} height={4} fill="#000" opacity={0.08} />
        <circle cx={76} cy={112} r={42} fill="#FFFFFF" /><SvgImg src={ASSETS.museIcon} x={36} y={72} w={80} h={80} />
        <text x={136} y={112} fontFamily={FONT} fontWeight={700} fontSize={40} fill="#FFFFFF">Muse</text>
        <text x={136} y={150} fontFamily={FONT} fontWeight={500} fontSize={30} fill="#D7F5EC">online</text>
        <Si icon={siWhatsapp} x={SW - 98} y={80} size={62} color="#FFFFFF" opacity={0.55 + 0.45 * kWa} />
        <rect x={20} y={1094} width={SW - 130} height={72} rx={36} fill="#FFFFFF" />
        <circle cx={SW - 58} cy={1130} r={36} fill="#00A884" />
      </Phone>
      {/* WhatsApp badge */}
      {kWa > 0.01 ? (
        <g transform={`translate(2416 566) scale(${kWa})`}>
          <Shadow x={-70} y={-70} w={140} h={140} r={36} o={0.3} d={18} />
          <rect x={-70} y={-70} width={140} height={140} rx={36} fill={WA} />
          <Si icon={siWhatsapp} x={-46} y={-46} size={92} color="#FFFFFF" />
          <text x={0} y={128} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill="#FFFFFF">WhatsApp</text>
        </g>
      ) : null}
      <Ripple t={t} at={T.wa} x={2416} y={566} color="#8CF5B0" r={220} />
      {/* the phone bill, slashed on "negotiates" */}
      {kBill > 0.01 ? (
        <g transform={`translate(${BX + BW / 2 + 120 * (1 - kBill)} ${BY + BH / 2}) rotate(${3 + 5 * flash(t, T.neg, 5) * Math.sin((t - T.neg) * 1.4)}) translate(${-BW / 2} ${-BH / 2})`} opacity={clamp01(kBill * 1.6)}>
          <Panel x={0} y={0} w={BW} h={BH} r={26} fill="#FFFDF8" stroke="#F1E4CF" shadow={0.3} sheen={0} />
          <rect x={0} y={0} width={BW} height={16} rx={8} fill={WARM} />
          <text x={30} y={86} fontFamily={FONT} fontWeight={800} fontSize={46} fill={INK}>Phone bill</text>
          {[0, 1, 2].map((i) => (
            <g key={i}><rect x={30} y={122 + i * 48} width={150 + (i % 2) * 40} height={18} rx={9} fill="#D8CFC0" /><rect x={BW - 100} y={122 + i * 48} width={70} height={18} rx={9} fill="#D8CFC0" /></g>
          ))}
          <rect x={30} y={272} width={BW - 60} height={3} fill="#E6DAC6" />
          <text x={30} y={332} fontFamily={FONT} fontWeight={600} fontSize={37} fill="#6B5C48">Monthly</text>
          <rect x={BW - 170} y={304} width={140} height={34} rx={12} fill={kSlash > 0.5 ? '#C9BFB0' : INK} />
          <path d={`M${BW - 186} 348 L${BW - 186 + 172 * kSlash} ${348 - 54 * kSlash}`} stroke={RED} strokeWidth={11} strokeLinecap="round" opacity={kSlash > 0 ? 1 : 0} />
          {kLower > 0.01 ? (
            <g transform={`translate(${BW / 2} 384) scale(${kLower})`}>
              <rect x={-150} y={-36} width={300} height={72} rx={36} fill={GREEN} />
              <path d="M-112 -12 V12 M-124 2 L-112 14 L-100 2" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              <text x={14} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={38} fill="#FFFFFF">Lower rate</text>
            </g>
          ) : null}
        </g>
      ) : null}
      <Burst t={t} at={T.bills} x={BX + BW / 2} y={BY + 384} color="#9CF0B8" n={16} r={200} />
      {/* approval sheet: it checks with you before it spends */}
      {kSheet > 0.01 ? (
        <g transform={`translate(0 ${(1 - kSheet) * 660})`} opacity={clamp01(kSheet * 2)}>
          <Panel x={SX} y={SY} w={SHW} h={SHH} r={52} fill="#FFFFFF" stroke={kOk > 0.5 ? GREEN : '#BBD3FF'} sw={5} shadow={0.42} sheen={0} />
          <rect x={SX + SHW / 2 - 46} y={SY + 18} width={92} height={9} rx={4.5} fill="#D3DBE8" />
          <text x={SX + SHW / 2} y={SY + 104} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={56} fill={INK}>Approve purchase?</text>
          <rect x={SX + 40} y={SY + 142} width={SHW - 80} height={112} rx={28} fill="#F1F6FF" />
          <rect x={SX + 60} y={SY + 158} width={80} height={80} rx={20} fill="#8A5CF6" /><Icon name="bag" cx={SX + 100} cy={SY + 198} s={1.1} />
          <text x={SX + 166} y={SY + 212} fontFamily={FONT} fontWeight={600} fontSize={40} fill={INK}>Sneakers</text>
          <rect x={SX + SHW - 176} y={SY + 187} width={110} height={22} rx={11} fill="#C9D6EA" />
          <rect x={SX + 40} y={SY + 270} width={SHW - 80} height={112} rx={28} fill="#F1F6FF" />
          <rect x={SX + 60} y={SY + 286} width={80} height={80} rx={20} fill="#635BFF" /><Si icon={siStripe} x={SX + 74} y={SY + 300} size={52} color="#FFFFFF" />
          <text x={SX + 166} y={SY + 340} fontFamily={FONT} fontWeight={600} fontSize={40} fill={INK}>Link by Stripe</text>
          <path d={`M${SX + SHW - 96} ${SY + 316} l10 10 l20 -22`} fill="none" stroke={GREEN} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          {/* buttons */}
          <rect x={SX + 40} y={SY + 416} width={280} height={116} rx={58} fill="none" stroke="#C4CFDF" strokeWidth={4} />
          <text x={SX + 180} y={SY + 489} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill="#5A6B85">Not now</text>
          <g transform={`translate(${SX + 510} ${SY + 474}) scale(${1 + 0.06 * press - 0.05 * flash(t, T.spends, 4)})`}>
            <rect x={-176} y={-64} width={352} height={128} rx={64} fill="none" stroke={kOk > 0.5 ? GREEN : BLUE} strokeWidth={6} opacity={0.5 * Math.max(press, flash(t, T.spends, 10))} transform={`scale(${1.12})`} />
            <rect x={-170} y={-58} width={340} height={116} rx={58} fill={kOk > 0.5 ? GREEN : BLUE} />
            <text x={kOk > 0.5 ? 24 : 0} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill="#FFFFFF">{kOk > 0.5 ? 'Approved' : 'Approve'}</text>
            {kOk > 0.5 ? <path d="M-128 2 l14 14 l26 -30" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /> : null}
          </g>
          {/* your fingertip */}
          {t >= T.before - 6 && kOk < 0.9 ? (
            <g transform={`translate(${lerp(SX + 660, SX + 560, easeOut(ramp(t, T.before - 6, 10)))} ${lerp(SY + 640, SY + 510, easeOut(ramp(t, T.before - 6, 10)))})`} opacity={1 - kOk}>
              <circle r={34} fill="#10203F" opacity={0.22} /><circle r={22} fill="#FFFFFF" stroke="#10203F" strokeOpacity={0.5} strokeWidth={4} />
            </g>
          ) : null}
        </g>
      ) : null}
      <Burst t={t} at={T.spends} x={SX + 510} y={SY + 474} color="#9CF0B8" n={20} r={240} />

      {/* ================= PLANS: Free · $20 · $100 ================= */}
      {kMost > 0.01 ? (
        <g opacity={clamp01(kMost * 1.5)} transform={`translate(0 ${20 * (1 - kMost)})`}>
          <Panel x={C - 350} y={474} w={700} h={112} r={56} fill={`url(#${id}-glass)`} stroke="rgba(160,196,255,0.7)" />
          <SvgImg src={ASSETS.museIcon} x={C - 334} y={488} w={84} h={84} />
          <text x={C + 44} y={549} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill="#FFFFFF">
            <tspan>Most </tspan><tspan fill={t >= T.tasks ? SUN : '#FFFFFF'}>tasks</tspan><tspan opacity={0.3 + 0.7 * clamp01(kFree)}> are free</tspan>
          </text>
        </g>
      ) : null}
      {/* Free */}
      {kFree > 0.01 ? (
        <g transform={`translate(${cx0(0) + CW / 2} ${CY + CH / 2 + 80 * (1 - kFree)}) rotate(${-3 * (1 - kFree)}) scale(${0.6 + 0.4 * kFree}) translate(${-CW / 2} ${-CH / 2})`} opacity={clamp01(kFree * 1.6)}>
          <Panel x={0} y={0} w={CW} h={CH} r={40} fill="#FFFFFF" stroke={`url(#${id}-warm)`} sw={7} shadow={0.36} sheen={0} />
          <rect x={30} y={34} width={132} height={52} rx={26} fill="#E7F0FF" /><text x={96} y={72} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={34} fill={BLUE}>MUSE</text>
          <text x={CW / 2} y={230} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={132} fill={BLUE} letterSpacing={-3}>Free</text>
          <text x={CW / 2} y={300} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={INK}>Most tasks</text>
          {[0, 1, 2].map((i) => (
            <g key={i}><Tick cx={56} cy={372 + i * 50} r={17} k={sp(t, T.free + 6 + i * 3, 'pop')} fill={GREEN} /><rect x={90} y={362 + i * 50} width={150 + ((i * 53) % 80)} height={20} rx={10} fill="#D6E2F5" /></g>
          ))}
        </g>
      ) : null}
      <Burst t={t} at={T.free} x={cx0(0) + CW / 2} y={CY + 200} color="#FFE2A8" n={22} r={320} />
      {/* $20 Power, $100 Maximum */}
      {([[1, k20, '$20', 'Power', T.twenty], [2, k100, '$100', 'Maximum', T.hundred]] as [number, number, string, string, number][]).map(([i, k, price, name, at]) => (
        k > 0.01 ? (
          <g key={name} transform={`translate(${cx0(i) + CW / 2} ${CY + CH / 2 + 80 * (1 - k)}) scale(${(0.6 + 0.4 * k) * (1 + 0.05 * bumpD)}) translate(${-CW / 2} ${-CH / 2})`} opacity={clamp01(k * 1.6)}>
            <Panel x={0} y={0} w={CW} h={CH} r={40} fill={`url(#${id}-paid)`} stroke={kPlans > 0.4 ? '#FFD27A' : 'rgba(160,196,255,0.8)'} sw={5} shadow={0.36} />
            <text x={CW / 2} y={104} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={50} fill={kPlans > 0.4 ? SUN : '#CFE0FF'}>{name}</text>
            <rect x={CW / 2 - 70 * kPlans} y={122} width={140 * kPlans} height={6} rx={3} fill="#FFD27A" />
            <text x={CW / 2} y={290} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={price.length > 3 ? 124 : 140} fill="#FFFFFF" letterSpacing={-3}>{price}</text>
            <text x={CW / 2} y={352} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={42} fill="#A9C4FF">per month</text>
            {[0, 1].map((j) => <rect key={j} x={56} y={404 + j * 44} width={CW - 112 - j * 60} height={18} rx={9} fill="#FFFFFF" opacity={0.16} />)}
            <circle cx={CW - 44} cy={46} r={10} fill="#FFD27A" opacity={flash(t, at, 14)} />
          </g>
        ) : null
      ))}
      <Burst t={t} at={T.twenty} x={cx0(1) + CW / 2} y={CY + 250} color="#BBD6FF" n={14} r={220} />
      <Burst t={t} at={T.hundred} x={cx0(2) + CW / 2} y={CY + 250} color="#BBD6FF" n={14} r={220} />
      {kPlans > 0.01 ? (
        <g transform={`translate(${C} ${1676 + 30 * (1 - kPlans)})`} opacity={clamp01(kPlans * 1.5)}>
          <Panel x={-350} y={-54} w={700} h={108} r={54} fill={`url(#${id}-glass)`} stroke="rgba(255,210,122,0.8)" />
          <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={46} fill="#FFFFFF">Free · $20 · $100 plans</text>
        </g>
      ) : null}

      {/* ================= GLOBE: only in the US and Singapore ================= */}
      {kNow > 0.01 ? (
        <g transform={`translate(${D} ${530 + 20 * (1 - kNow)})`} opacity={clamp01(kNow * 1.5)}>
          <Panel x={-300} y={-56} w={600} h={112} r={56} fill={`url(#${id}-glass)`} stroke="rgba(160,196,255,0.7)" />
          <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill="#FFFFFF">For now, <tspan fill={kOnly > 0.3 ? SUN : '#FFFFFF'}>only in</tspan></text>
        </g>
      ) : null}
      <Globe cx={4780} cy={1010} R={380} lon0={lon0} lat0={lat0} t={t} pins={[
        {lon: -98, lat: 39, label: 'US', at: T.us, side: -1},
        {lon: 103.8, lat: 1.35, label: 'Singapore', at: T.sg, side: 1},
      ]} />
      {([['United States', 4560, 400, T.us], ['Singapore', 4972, 340, T.sg]] as [string, number, number, number][]).map(([label, x, pw, at]) => {
        const k = sp(t, at, 'bouncy');
        if (k <= 0.01) return null;
        return (
          <g key={label} transform={`translate(${x} ${1538 + 50 * (1 - k)}) scale(${0.7 + 0.3 * k})`} opacity={clamp01(k * 1.6)}>
            <Panel x={-pw / 2} y={-54} w={pw} h={108} r={54} fill="#FFFFFF" stroke={`url(#${id}-warm)`} sw={6} shadow={0.32} sheen={0} />
            <path d="M0 0 C-7 -17 -22 -26 -22 -44 A22 22 0 1 1 22 -44 C22 -26 7 -17 0 0 Z" fill={WARM} transform={`translate(${-pw / 2 + 50} 32)`} />
            <text x={26} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill={INK}>{label}</text>
          </g>
        );
      })}

      {/* ================= the Muse creature (on top) ================= */}
      <ArtTile src={ASSETS.museCreature} cx={mu.x} cy={mu.y} size={mu.s} t={t} seed={2} rot={mu.r} rim={clamp01(pop * 1.4)} life={pop} />
      <Burst t={t} at={T.everyday} x={A} y={P[0].y} color="#BBD6FF" n={18} r={380} />
      <g opacity={0}><rect width={1} height={1} fill={NAVY} /></g>
    </svg>
  );
};

export const museWorld: WorldDef = {
  id: 's04',
  home: 'home',
  anchors: {
    home: {x: A, y: 985, zoom: 1.1},
    chat: {x: 2060, y: 985, zoom: 1.1},
    plans: {x: C, y: 985, zoom: 1.1},
    globe: {x: D, y: 985, zoom: 1.1},
  },
  // one move per sentence: "...the everyday helper. It books trips" / "Most tasks are free" / "For now, it's only in..."
  aliases: {helper: 'chat', most: 'plans', now: 'globe'},
  palette: {bg0: '#050E2A', bg1: '#1747B0', particles: '#FFE7BF', glow: '#FFC56B'},
  Draw,
};
