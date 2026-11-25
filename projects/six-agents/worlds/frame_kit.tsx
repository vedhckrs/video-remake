// six-agents / agent A - shared bits for the four "frame" scenes (S01 hook, S02 cloud vs PC, S09 picks, S10 CTA).
// These four worlds are drawn in SCREEN px: every anchor uses zoom Z = 1 / safe.zoom, so 1 world px = 1 px of the
// 1080 x 1920 frame and the anchor (540, 960) is the frame itself.
import React from 'react';
import {AgentCard, AGENTS, ORDER, SvgImg, FONT, type AgentId} from './shared';

export const Z = 1 / 0.86;
/** world y that lands on the camera focus (44 % of the height): use it as the anchor y for true screen-px worlds */
export const FY = 1920 * 0.44;
export const FW = 1080, FH = 1920;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smooth = (x: number) => { const q = clamp01(x); return q * q * (3 - 2 * q); };
export const outC = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const inC = (x: number) => Math.pow(clamp01(x), 3);
export const easeIO = (x: number) => { const q = clamp01(x); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; };
export const rnd = (s: number) => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
/** 1 -> 0 after `at` */
export const decay = (t: number, at: number, d = 8) => (t < at ? 0 : Math.exp(-(t - at) / d));
/** a single hop: 0 -> 1 -> 0 over `dur` frames from `at` */
export const hop = (t: number, at: number, dur = 10) => (t < at || t > at + dur ? 0 : Math.sin(((t - at) / dur) * Math.PI));

export const GREEN = '#3DDC84';
export const ALL: AgentId[] = ORDER;

/** An AgentCard placed by its CENTRE with scale / rotation / opacity. Children are drawn in card-local px (0,0 = top-left). */
export const Card: React.FC<{
  id: AgentId; cx: number; cy: number; w: number; t: number; uid: string; s?: number; rot?: number; o?: number;
  price?: number; glow?: number; life?: number; children?: React.ReactNode;
}> = ({id, cx, cy, w, t, uid, s = 1, rot = 0, o = 1, price, glow, life, children}) => {
  if (o <= 0.004) return null;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${s}) translate(${-w / 2} ${-w * 0.71})`} opacity={o}>
      <AgentCard id={id} x={0} y={0} w={w} t={t} price={price} glow={glow} life={life} uid={uid} />
      {children}
    </g>
  );
};

/** The agent's official art on its own (square tile or round chip), centred on (cx, cy). Never altered - only framed. */
export const Art: React.FC<{id: AgentId; cx: number; cy: number; size: number; round?: boolean; ring?: number}> = ({id, cx, cy, size, round, ring = 0}) => {
  const a = AGENTS[id];
  const r = round ? size / 2 : size * 0.2;
  const x = cx - size / 2, y = cy - size / 2;
  const k = a.artMode === 'icon' ? 0.74 : 0.8;
  return (
    <g>
      {a.artMode === 'cover' ? <SvgImg src={a.art} x={x} y={y} w={size} h={size} fit="cover" radius={r} /> : (
        <g>
          <rect x={x} y={y} width={size} height={size} rx={r} fill={a.deep} />
          <rect x={x} y={y} width={size} height={size} rx={r} fill={a.accent} opacity={0.3} />
          <SvgImg src={a.art} x={cx - (size * k) / 2} y={cy - (size * k) / 2} w={size * k} h={size * k} />
        </g>
      )}
      <rect x={x} y={y} width={size} height={size} rx={r} fill="none" stroke={a.glow} strokeWidth={Math.max(2, size * 0.03) * (1 + ring)} opacity={0.75} />
    </g>
  );
};

/** One radial glow gradient per agent: url(#<p>-g-<id>) */
export const GlowDefs: React.FC<{p: string}> = ({p}) => (
  <defs>
    {ALL.map((id) => (
      <radialGradient key={id} id={`${p}-g-${id}`}>
        <stop offset="0" stopColor={AGENTS[id].glow} stopOpacity={0.75} /><stop offset="0.5" stopColor={AGENTS[id].accent} stopOpacity={0.28} />
        <stop offset="1" stopColor={AGENTS[id].accent} stopOpacity={0} />
      </radialGradient>
    ))}
    <radialGradient id={`${p}-sh`}><stop offset="0" stopColor="#000" stopOpacity={0.65} /><stop offset="1" stopColor="#000" stopOpacity={0} /></radialGradient>
    <linearGradient id={`${p}-skin`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F7D2B0" /><stop offset="1" stopColor="#D9A47A" /></linearGradient>
  </defs>
);

/** Four-point sparkle */
export const Spark: React.FC<{x: number; y: number; r: number; o: number; color?: string}> = ({x, y, r, o, color = '#FFFFFF'}) =>
  o <= 0.01 || r <= 0.2 ? null : (
    <path transform={`translate(${x} ${y})`} opacity={o} fill={color}
      d={`M0,${-r} Q${r * 0.14},${-r * 0.14} ${r},0 Q${r * 0.14},${r * 0.14} 0,${r} Q${-r * 0.14},${r * 0.14} ${-r},0 Q${-r * 0.14},${-r * 0.14} 0,${-r} Z`} />
  );

/** Round tick badge */
export const Tick: React.FC<{x: number; y: number; r: number; o?: number; color?: string}> = ({x, y, r, o = 1, color = GREEN}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <circle r={r} fill={color} /><circle r={r} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.12} opacity={0.7} />
    <path d={`M${-r * 0.45},${r * 0.02} L${-r * 0.12},${r * 0.36} L${r * 0.48},${-r * 0.34}`} fill="none" stroke="#06200F" strokeWidth={r * 0.26} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** A pill with centred text (h = height, text size = fs). */
export const Pill: React.FC<{
  x: number; y: number; w: number; h: number; text: string; fs: number; fill: string; color: string; stroke?: string; s?: number; o?: number; weight?: number; ls?: number;
}> = ({x, y, w, h, text, fs, fill, color, stroke, s = 1, o = 1, weight = 800, ls = 0}) =>
  s <= 0.01 || o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-w / 2 + 3} y={-h / 2 + 6} width={w} height={h} rx={h / 2} fill="#000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={stroke ? 3 : 0} />
      <rect x={-w / 2 + 6} y={-h / 2 + 4} width={w - 12} height={h * 0.4} rx={h * 0.2} fill="#FFFFFF" opacity={0.12} />
      <text x={0} y={fs * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={weight} fontSize={fs} fill={color} letterSpacing={ls}>{text}</text>
    </g>
  );

/** Fingertip (tip at 0,0 pointing up-left); press 0..1 squashes it. */
export const Finger: React.FC<{p: string; x: number; y: number; s?: number; press?: number; o?: number}> = ({p, x, y, s = 0.42, press = 0, o = 1}) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(-24) scale(${s * (1 - 0.05 * press)}) translate(0 20)`} opacity={o}>
      <ellipse cx={30} cy={100} rx={130} ry={60} fill="#000" opacity={0.3 * press} />
      <path d="M-62,40 C-62,-20 62,-20 62,40 L74,520 C40,640 -70,640 -86,520 Z" fill={`url(#${p}-skin)`} />
      <path d="M-62,40 C-62,-20 62,-20 62,40 L64,120 C20,150 -30,150 -66,120 Z" fill="#FBE0C6" opacity={0.55} />
      <path d="M-40,30 C-40,-4 40,-4 40,30 L40,84 C14,98 -14,98 -40,84 Z" fill="#FFEFE3" stroke="#E8B692" strokeWidth={3} />
      <path d="M-60,300 Q0,318 68,300" fill="none" stroke="#C98F66" strokeWidth={4} opacity={0.6} />
      <path d="M-86,520 C-160,560 -200,700 -160,1200 L260,1200 C300,700 240,560 74,520 Z" fill={`url(#${p}-skin)`} />
    </g>
  );

// ---- the big wall (S01 from 'for you'; S10 flies back into it). TRUE screen px (anchor y = FY). ---------------------
export const WALL_W = 310, WALL_H = WALL_W * 1.42;
/** centre of wall slot i (0..5, ORDER) */
export const wallSlot = (i: number) => ({x: 540 + ((i % 3) - 1) * 335, y: [400, 890][Math.floor(i / 3)] + WALL_H / 2});

/** Evening -> night room backdrop shared by S01 and the end of S10 (n = night 0..1). */
export const mixc = (a: string, b: string, p: number) => {
  const h = (s: string) => { const n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const A = h(a), B = h(b), q = clamp01(p);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * q)},${Math.round(A[1] + (B[1] - A[1]) * q)},${Math.round(A[2] + (B[2] - A[2]) * q)})`;
};
export const RoomBack: React.FC<{p: string; n: number; t: number; o?: number}> = ({p, n, t, o = 1}) => (
  <g opacity={o}>
    <defs>
      <linearGradient id={`${p}-wallg`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1600">
        <stop offset="0" stopColor={mixc('#1A1147', '#050A26', n)} /><stop offset="0.55" stopColor={mixc('#3B2180', '#0C1746', n)} />
        <stop offset="1" stopColor={mixc('#6A2E8E', '#132257', n)} />
      </linearGradient>
      <linearGradient id={`${p}-floorg`} gradientUnits="userSpaceOnUse" x1="0" y1="1600" x2="0" y2="2000">
        <stop offset="0" stopColor={mixc('#2A1A5C', '#0B1238', n)} /><stop offset="1" stopColor={mixc('#0D0824', '#03040F', n)} />
      </linearGradient>
      <radialGradient id={`${p}-hor`}><stop offset="0" stopColor={mixc('#FF8FB8', '#5C7CFF', n)} stopOpacity={0.55} /><stop offset="1" stopColor={mixc('#FF8FB8', '#5C7CFF', n)} stopOpacity={0} /></radialGradient>
    </defs>
    <rect x={-700} y={-700} width={2480} height={2300} fill={`url(#${p}-wallg)`} />
    {/* soft wall panels */}
    {Array.from({length: 9}).map((_, i) => <rect key={i} x={-180 + i * 180} y={-700} width={2} height={2300} fill="#FFFFFF" opacity={0.045} />)}
    <ellipse cx={540} cy={1600} rx={1100} ry={420} fill={`url(#${p}-hor)`} opacity={0.8} />
    <rect x={-700} y={1600} width={2480} height={1100} fill={`url(#${p}-floorg)`} />
    <rect x={-700} y={1598} width={2480} height={4} fill="#FFFFFF" opacity={0.22} />
    {Array.from({length: 7}).map((_, i) => <line key={i} x1={540 + (i - 3) * 150} y1={1602} x2={540 + (i - 3) * 520} y2={2000} stroke="#FFFFFF" strokeWidth={2} opacity={0.05} />)}
    {/* slow dust in the light */}
    {Array.from({length: 22}).map((_, i) => (
      <circle key={i} cx={(rnd(i * 3.3) * 1180 - 50 + t * (rnd(i) - 0.5) * 0.8 + 1180) % 1180 - 50} cy={(rnd(i * 5.1) * 1300 + 400 - t * (0.15 + rnd(i * 2) * 0.3) + 1700) % 1300 + 400}
        r={1.5 + rnd(i * 7) * 2.5} fill="#FFFFFF" opacity={0.1 + 0.25 * rnd(i * 9)} />
    ))}
  </g>
);
