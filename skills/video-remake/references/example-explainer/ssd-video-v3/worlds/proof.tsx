// S09 "proof" - the LIGHT act: a bright silver lab table with the drive, a giant spec sheet, a per-day counter with a
// flipping calendar and a five-year timeline. Four zones; the camera flies between them on the words.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {pulseOn, wordAt} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {BT, CH, Drive, NAND_D, NAND_U, NAND_V, NAND_W, P} from './ssd';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const outC = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const INK = '#0F1B2D', MUTE = '#5C6B80', BLUE = '#2F6BFF', SKY = '#DCE8FF', MARK = '#FFD84D', RED = '#E5484D', GREEN = '#1FAE62';
const id = 's09';

// ---- zone A: the drive (drawn with the shared art, scaled) ----
const DS = 0.6, DC: [number, number] = [1200, 920];
const D = (u: number, v: number, z = 0): [number, number] => {
  const [x, y] = P(u, v, z);
  return [DC[0] + (x - 1448) * DS, DC[1] + (y - 1648) * DS];
};
// ---- zone B: spec sheet ----
const SX = 580, SY = 1760, SW = 1240, SH = 1330;
// ---- zone C: per day ----
const CX = 3050, CNT_Y = 2080, CAL_X = 2500, CAL_Y = 2330, CAL_W = 1100, CAL_H = 800;
const TILE_W = 132, TILE_H = 112, TILE_X0 = 52, TILE_Y0 = 150, TILE_DX = 144, TILE_DY = 124;
const DAY = 17; // the "single day" tile
// ---- zone D: five years ----
const TL_X = 2400, TL_Y = 3420, TL_W = 1300, TL_H = 430;

const Plate: React.FC<{x: number; y: number; w: number; h: number; r?: number; fill?: string; depth?: number; rot?: number; children?: React.ReactNode; glow?: number}> = ({
  x, y, w, h, r = 30, fill = '#FFFFFF', depth = 18, rot = 0, children, glow = 0,
}) => (
  <g transform={`translate(${x},${y}) rotate(${rot} ${w / 2} ${h / 2})`}>
    <ellipse cx={w / 2 + 30} cy={h + 46} rx={w * 0.56} ry={90} fill={`url(#${id}-sh)`} />
    <rect x={depth} y={depth} width={w} height={h} rx={r} fill="#9FAEC2" />
    <rect x={depth * 0.5} y={depth * 0.5} width={w} height={h} rx={r} fill="#C3CEDC" />
    {glow > 0.01 ? <rect x={-14} y={-14} width={w + 28} height={h + 28} rx={r + 12} fill="none" stroke={BLUE} strokeWidth={14} opacity={glow * 0.35} /> : null}
    <rect width={w} height={h} rx={r} fill={fill} stroke="#FFFFFF" strokeWidth={3} />
    <rect x={3} y={3} width={w - 6} height={h * 0.5} rx={r} fill={`url(#${id}-gloss)`} />
    {children}
  </g>
);

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tTyp = wordAt(beats, 'typical', 17), tOne = wordAt(beats, 'one', 27), tTb = wordAt(beats, 'terabyte', 32), tDrive = wordAt(beats, 'drive', 43);
  const tRated = wordAt(beats, 'rated', 65), t600 = wordAt(beats, '600', 76), tTbs = wordAt(beats, 'terabytes', 89), tWritten = wordAt(beats, 'written', 101);
  const t300 = wordAt(beats, '300', 133), tGb = wordAt(beats, 'gigabytes', 146), tEvery = wordAt(beats, 'every', 160), tSingle = wordAt(beats, 'single', 167), tDay = wordAt(beats, 'day', 175);
  const tFive = wordAt(beats, 'five', 183), tYears = wordAt(beats, 'years', 190);
  const pulse = pulseOn(t, beats);

  // zone A
  const typ = sp(t, tTyp, 'settle'), one = sp(t, tOne, 'bouncy'), tb = sp(t, tTb, 'bouncy'), drv = sp(t, tDrive, 'pop');
  const n1 = D(NAND_U[0] + NAND_W / 2, NAND_V + NAND_D, BT + CH), n2 = D(NAND_U[1] + NAND_W / 2, NAND_V + NAND_D, BT + CH);
  const dc = D(800, 220, BT);
  // zone B
  const rated = sp(t, tRated, 'settle');
  const n600 = Math.round(600 * outC((t - t600) / 11));
  const big = sp(t, t600, 'bouncy'), unitP = sp(t, tTbs, 'bouncy'), stamp = sp(t, tWritten, 'pop');
  // zone C
  const n329 = Math.round(329 * outC((t - t300) / 15));
  const cnt = sp(t, t300, 'bouncy'), gb = sp(t, tGb, 'bouncy'), single = sp(t, tSingle, 'pop'), day = sp(t, tDay, 'bouncy');
  // zone D
  const five = sp(t, tFive, 'settle'), years = sp(t, tYears, 'bouncy');

  const rows: [string, string][] = [['Capacity', '1 TB'], ['Interface', 'PCIe 4.0 x4 · NVMe'], ['Flash', '3D TLC NAND'], ['Warranty', '5 years']];
  const dayTile = (i: number) => [TILE_X0 + (i % 7) * TILE_DX, TILE_Y0 + Math.floor(i / 7) * TILE_DY];

  return (
    <svg width={4200} height={4300} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${id}-sh`}><stop offset="0" stopColor="#1B2A44" stopOpacity="0.32" /><stop offset="1" stopColor="#1B2A44" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor="#8D99AA" /><stop offset="0.55" stopColor="#E3E9F0" /><stop offset="1" stopColor="#6B7686" /></linearGradient>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5C9BFF" /><stop offset="1" stopColor="#1E4FE0" /></linearGradient>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2F6BFF" /><stop offset="1" stopColor="#5CC8FF" /></linearGradient>
        <radialGradient id={`${id}-halo`}><stop offset="0" stopColor="#FFFFFF" stopOpacity="1" /><stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.5" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-bl`}><stop offset="0" stopColor={BLUE} stopOpacity="0.35" /><stop offset="1" stopColor={BLUE} stopOpacity="0" /></radialGradient>
      </defs>

      {/* lab table: dotted grid, registration marks, soft light pools */}
      <ellipse cx={1200} cy={2300} rx={1700} ry={2100} fill={`url(#${id}-halo)`} opacity={0.75} />
      <ellipse cx={3050} cy={2900} rx={1500} ry={1700} fill={`url(#${id}-halo)`} opacity={0.75} />
      {Array.from({length: 24}).map((_, i) => <line key={`h${i}`} x1={-400} x2={4600} y1={i * 200 - 100} y2={i * 200 - 100} stroke="#7C93B5" strokeWidth={2} opacity={0.14} />)}
      {Array.from({length: 26}).map((_, i) => <line key={`v${i}`} y1={-300} y2={4600} x1={i * 200 - 400} x2={i * 200 - 400} stroke="#7C93B5" strokeWidth={2} opacity={0.14} />)}
      {Array.from({length: 40}).map((_, i) => {
        const x = Math.round(rnd(i * 1.7) * 22) * 200 - 400, y = Math.round(rnd(i * 3.9 + 2) * 22) * 200 - 100;
        return <g key={`r${i}`} opacity={0.4}><line x1={x - 16} x2={x + 16} y1={y} y2={y} stroke="#5E7799" strokeWidth={3} /><line x1={x} x2={x} y1={y - 16} y2={y + 16} stroke="#5E7799" strokeWidth={3} /></g>;
      })}
      {[[1200, 920, 900], [3050, 2500, 1000]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#7C93B5" strokeWidth={2} strokeDasharray="6 14" opacity={0.35} />)}
      {/* dimension line linking the zones */}
      <path d={`M1200,1560 V1700`} stroke="#7C93B5" strokeWidth={3} strokeDasharray="10 10" opacity={0.6} />
      <path d={`M${SX + SW + 40},2500 H${CAL_X - 60}`} stroke="#7C93B5" strokeWidth={3} strokeDasharray="10 10" opacity={0.6} />
      <path d={`M${CX},${CAL_Y + CAL_H + 40} V${TL_Y - 30}`} stroke="#7C93B5" strokeWidth={3} strokeDasharray="10 10" opacity={0.6} />

      {/* ---------------- zone A: the drive ---------------- */}
      <g transform={`translate(${DC[0]},${DC[1]}) scale(${DS}) translate(-1448,-1648)`}>
        <Drive id={id} t={t} light sheen={(t - tDrive) / 14} led={0.5 + 0.5 * pulse} strip={0.4 + 0.6 * Math.max(typ * 0.6, drv)} boardGlow={drv * 0.6 * Math.exp(-(t - tDrive) / 10)}
               chips={{n1: {glow: one * 0.9, edge: '#5CC8FF'}, n2: {glow: one * 0.9, edge: '#5CC8FF'}}} />
      </g>
      {drv > 0.01 && t - tDrive < 16 ? <ellipse cx={dc[0]} cy={dc[1]} rx={200 + (t - tDrive) * 50} ry={260 + (t - tDrive) * 60} fill="none" stroke={BLUE} strokeWidth={10 * (1 - (t - tDrive) / 16)} opacity={1 - (t - tDrive) / 16} /> : null}
      {/* "typical" tag */}
      {typ > 0.01 ? (
        <g transform={`translate(${DC[0] - 300},${DC[1] - 420}) scale(${0.6 + 0.4 * typ})`} opacity={Math.min(1, typ * 1.5)}>
          <rect x={-190} y={-52} width={380} height={104} rx={24} fill="#FFFFFF" stroke={BLUE} strokeWidth={4} />
          <rect x={-190} y={-52} width={12} height={104} rx={6} fill={BLUE} />
          <text x={-156} y={-6} fontFamily={MONO} fontSize={22} fill={MUTE} letterSpacing={2}>TYPICAL DRIVE</text>
          <text x={-156} y={32} fontFamily={FONT} fontWeight={700} fontSize={34} fill={INK}>M.2 NVMe SSD</text>
          <line x1={190} y1={0} x2={190 + 150 * typ} y2={90 * typ} stroke={BLUE} strokeWidth={4} /><circle cx={190 + 150 * typ} cy={90 * typ} r={10} fill={BLUE} />
        </g>
      ) : null}
      {/* 512 + 512 = 1 TB */}
      {[n1, n2].map((n, k) => one > 0.01 ? (
        <g key={k} transform={`translate(${n[0] + 150},${n[1] + 30}) scale(${one})`}>
          <line x1={-150} y1={-30} x2={-70} y2={0} stroke={BLUE} strokeWidth={4} />
          <rect x={-70} y={-34} width={210} height={68} rx={34} fill={BLUE} />
          <text x={35} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#FFFFFF">512 GB</text>
        </g>
      ) : null)}
      {tb > 0.01 ? (
        <g transform={`translate(${DC[0] + 330},${DC[1] + 330}) scale(${tb}) rotate(${-6 + 6 * tb})`}>
          <rect x={-170} y={-96} width={354} height={204} rx={36} fill="#9FAEC2" />
          <rect x={-180} y={-106} width={354} height={204} rx={36} fill={`url(#${id}-blue)`} stroke="#FFFFFF" strokeWidth={5} />
          <text x={-150} y={-52} fontFamily={MONO} fontSize={24} fill="#DCE8FF" letterSpacing={3}>CAPACITY</text>
          <text x={-150} y={62} fontFamily={FONT} fontWeight={800} fontSize={124} fill="#FFFFFF">1 TB</text>
        </g>
      ) : null}

      {/* ---------------- zone B: the spec sheet ---------------- */}
      <Plate x={SX + 40} y={SY + 30} w={SW} h={SH} rot={3.2} fill="#EEF2F7" depth={10} />
      <Plate x={SX} y={SY} w={SW} h={SH} rot={-1.2} glow={rated * (0.5 + 0.5 * Math.exp(-(t - tRated) / 8))}>
        {/* header */}
        <rect x={0} y={0} width={SW} height={210} rx={30} fill={INK} /><rect x={0} y={120} width={SW} height={90} fill={INK} />
        <rect x={60} y={56} width={104} height={104} rx={22} fill={`url(#${id}-blue)`} />
        <rect x={84} y={84} width={56} height={48} rx={8} fill="none" stroke="#fff" strokeWidth={7} /><line x1={96} y1={132} x2={96} y2={146} stroke="#fff" strokeWidth={7} /><line x1={112} y1={132} x2={112} y2={146} stroke="#fff" strokeWidth={7} /><line x1={128} y1={132} x2={128} y2={146} stroke="#fff" strokeWidth={7} />
        <text x={200} y={104} fontFamily={FONT} fontWeight={800} fontSize={62} fill="#FFFFFF">SPEC SHEET</text>
        <text x={202} y={156} fontFamily={MONO} fontSize={27} fill="#9FC0FF" letterSpacing={3}>NVMe SSD · 1 TB · REV 2.1</text>
        <text x={SW - 60} y={110} textAnchor="end" fontFamily={MONO} fontSize={24} fill="#7E93B5">DOC 0421-A</text>
        {/* table */}
        {rows.map(([k, v], i) => {
          const y = 250 + i * 104, hot = i === 0 ? Math.max(one, tb) * (1 - rated) : 0;
          return (
            <g key={k}>
              {i % 2 === 0 ? <rect x={40} y={y} width={SW - 80} height={104} rx={14} fill="#F1F5FA" /> : null}
              {hot > 0.01 ? <rect x={40} y={y} width={(SW - 80) * hot} height={104} rx={14} fill={MARK} opacity={0.8} /> : null}
              <text x={76} y={y + 68} fontFamily={FONT} fontWeight={500} fontSize={44} fill={MUTE}>{k}</text>
              <text x={SW - 76} y={y + 68} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={46} fill={INK}>{v}</text>
            </g>
          );
        })}
        {/* endurance block */}
        <rect x={40} y={690} width={SW - 80} height={470} rx={26} fill={SKY} stroke={BLUE} strokeWidth={rated > 0.01 ? 3 + 5 * rated : 3} />
        <rect x={76} y={726} width={(430) * Math.max(0.0, rated)} height={62} rx={10} fill={MARK} />
        <text x={90} y={772} fontFamily={FONT} fontWeight={700} fontSize={42} fill={INK} letterSpacing={2}>RATED ENDURANCE</text>
        <text x={SW - 80} y={772} textAnchor="end" fontFamily={MONO} fontSize={26} fill={MUTE}>JESD218 · client</text>
        <g transform={`translate(${90},${1070}) scale(${0.9 + 0.1 * big})`}>
          <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={300} fill={t > t600 ? INK : '#B8C6DA'} letterSpacing={-6} style={{fontVariantNumeric: 'tabular-nums'}}>{t > t600 ? n600 : '000'}</text>
        </g>
        <g transform={`translate(${690},${1070}) scale(${unitP})`} opacity={unitP > 0.01 ? 1 : 0}>
          <rect x={-10} y={-190} width={410} height={130} rx={24} fill={`url(#${id}-blue)`} />
          <text x={195} y={-96} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={104} fill="#FFFFFF" letterSpacing={4}>TBW</text>
          <text x={0} y={-10} fontFamily={FONT} fontWeight={600} fontSize={41} fill={INK}>terabytes written</text>
        </g>
        {/* small print + barcode */}
        {[0, 1, 2].map((i) => <rect key={i} x={60} y={1200 + i * 30} width={[620, 540, 380][i]} height={12} rx={6} fill="#C9D4E2" />)}
        {Array.from({length: 34}).map((_, i) => <rect key={`bc${i}`} x={SW - 330 + i * 8} y={1196} width={rnd(i * 2.3) > 0.5 ? 5 : 2.5} height={84} fill={INK} opacity={0.85} />)}
        {/* stamp */}
        {stamp > 0.01 ? (
          <g transform={`translate(${SW - 290},${800}) rotate(-13) scale(${(2.6 - 1.6 * stamp) * 0.8})`} opacity={Math.min(1, stamp * 1.4)}>
            <rect x={-270} y={-110} width={540} height={220} rx={34} fill="rgba(229,72,77,0.07)" stroke={RED} strokeWidth={14} />
            <rect x={-246} y={-86} width={492} height={172} rx={20} fill="none" stroke={RED} strokeWidth={4} />
            <text x={0} y={-22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={92} fill={RED} letterSpacing={4}>600 TBW</text>
            <text x={0} y={46} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={34} fill={RED} letterSpacing={8}>RATED · WRITTEN</text>
            {Array.from({length: 14}).map((_, i) => <circle key={i} cx={(rnd(i * 3.1) - 0.5) * 620} cy={(rnd(i * 5.7) - 0.5) * 300} r={3 + rnd(i) * 6} fill={RED} opacity={0.5} />)}
          </g>
        ) : null}
      </Plate>
      {/* binder clip */}
      <g transform={`translate(${SX + SW / 2 - 130},${SY - 62})`}>
        <rect x={40} y={-44} width={180} height={70} rx={30} fill="none" stroke={`url(#${id}-chrome)`} strokeWidth={12} />
        <rect x={0} y={0} width={260} height={104} rx={14} fill="#1B2638" /><rect x={0} y={0} width={260} height={34} rx={14} fill="#33445E" />
        <rect x={10} y={84} width={240} height={10} rx={5} fill="#0C1320" />
      </g>
      {stamp > 0.01 && t - tWritten < 12 ? <circle cx={SX + SW - 290} cy={SY + 800} r={200 + (t - tWritten) * 46} fill="none" stroke={RED} strokeWidth={12 * (1 - (t - tWritten) / 12)} opacity={0.8 * (1 - (t - tWritten) / 12)} /> : null}

      {/* ---------------- zone C: per day ---------------- */}
      <circle cx={CX} cy={CNT_Y - 80} r={520} fill={`url(#${id}-bl)`} opacity={0.5 * cnt} />
      <g transform={`translate(${CX},${CNT_Y}) scale(${0.85 + 0.15 * cnt})`} opacity={t > t300 - 6 ? 1 : 0.25}>
        <text x={-40} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={400} fill={INK} letterSpacing={-10} style={{fontVariantNumeric: 'tabular-nums'}}>{t > t300 ? n329 : 0}</text>
        <g transform={`translate(360,-150) scale(${gb})`}>
          <rect x={-10} y={-76} width={250} height={108} rx={26} fill={`url(#${id}-blue)`} />
          <text x={115} y={4} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={84} fill="#FFFFFF">GB</text>
          <text x={0} y={96} fontFamily={FONT} fontWeight={600} fontSize={52} fill={INK}>per day</text>
        </g>
        <text x={-40} y={-330} textAnchor="middle" fontFamily={MONO} fontSize={34} fill={MUTE} letterSpacing={6}>YOU COULD WRITE</text>
      </g>
      <Plate x={CAL_X} y={CAL_Y} w={CAL_W} h={CAL_H} rot={0.8}>
        <rect x={0} y={0} width={CAL_W} height={120} rx={30} fill={RED} /><rect x={0} y={80} width={CAL_W} height={40} fill={RED} />
        <text x={56} y={80} fontFamily={FONT} fontWeight={800} fontSize={54} fill="#FFFFFF">EVERY SINGLE DAY</text>
        <text x={CAL_W - 56} y={80} textAnchor="end" fontFamily={MONO} fontSize={30} fill="#FFD6D8">365 × 5</text>
        {[150, 400, 700, 950].map((x) => <g key={x}><rect x={x - 12} y={-34} width={24} height={74} rx={12} fill={`url(#${id}-chrome)`} /><circle cx={x} cy={46} r={15} fill="#8A1F23" /></g>)}
        {Array.from({length: 35}).map((_, i) => {
          const [x, y] = dayTile(i);
          const ft = tEvery + i * 0.42;
          const q = clamp01((t - ft) / 5);
          const flipped = q > 0.5, sy = Math.abs(Math.cos(q * Math.PI));
          const isDay = i === DAY;
          const hot = isDay ? Math.max(single * 0.6, day) : 0;
          return (
            <g key={i} transform={`translate(${x + TILE_W / 2},${y + TILE_H / 2}) scale(${1 + 0.16 * hot},${Math.max(0.06, sy) * (1 + 0.16 * hot)})`}>
              <rect x={-TILE_W / 2 + 5} y={-TILE_H / 2 + 7} width={TILE_W} height={TILE_H} rx={16} fill="#AEBBCB" />
              <rect x={-TILE_W / 2} y={-TILE_H / 2} width={TILE_W} height={TILE_H} rx={16} fill={flipped ? (isDay && hot > 0.3 ? MARK : `url(#${id}-fill)`) : '#EEF2F7'} stroke={isDay && hot > 0.3 ? INK : flipped ? '#FFFFFF' : '#D5DEE9'} strokeWidth={isDay && hot > 0.3 ? 5 : 2.5} />
              <text x={-TILE_W / 2 + 14} y={-TILE_H / 2 + 32} fontFamily={MONO} fontSize={22} fill={flipped ? (isDay && hot > 0.3 ? INK : '#DCE8FF') : '#8C9BB0'}>{i + 1}</text>
              {flipped ? <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={isDay && hot > 0.3 ? INK : '#FFFFFF'}>329</text> : null}
              {flipped ? <text x={TILE_W / 2 - 14} y={TILE_H / 2 - 12} textAnchor="end" fontFamily={MONO} fontSize={17} fill={isDay && hot > 0.3 ? INK : '#DCE8FF'}>GB</text> : null}
            </g>
          );
        })}
      </Plate>
      {day > 0.01 ? (() => {
        const [x, y] = dayTile(DAY);
        return (
          <g transform={`translate(${CAL_X + x + TILE_W + 20},${CAL_Y + y - 30}) scale(${day})`}>
            <circle r={44} fill={GREEN} stroke="#FFFFFF" strokeWidth={6} /><path d="M-20,2 L-6,16 L20,-14" fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })() : null}

      {/* ---------------- zone D: five years ---------------- */}
      <Plate x={TL_X} y={TL_Y} w={TL_W} h={TL_H} rot={-0.8} glow={years * 0.8}>
        <text x={60} y={96} fontFamily={FONT} fontWeight={800} fontSize={66} fill={INK}>FOR FIVE YEARS</text>
        <text x={TL_W - 60} y={92} textAnchor="end" fontFamily={MONO} fontSize={30} fill={MUTE}>329 GB × 365 × 5 ≈ 600 TB</text>
        <rect x={56} y={150} width={TL_W - 112} height={120} rx={60} fill="#E3EAF3" stroke="#C6D2E1" strokeWidth={3} />
        {Array.from({length: 5}).map((_, k) => {
          const segW = (TL_W - 112 - 16) / 5, f = clamp01((t - tFive - k * 1.5) / 3.2) * five;
          return (
            <g key={k}>
              {f > 0.01 ? <rect x={64 + k * segW} y={158} width={(segW - 8) * f} height={104} rx={k === 0 || k === 4 ? 52 : 14} fill={`url(#${id}-fill)`} /> : null}
              <text x={64 + k * segW + segW / 2} y={226} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={46} fill={f > 0.6 ? '#FFFFFF' : '#9AA9BD'}>{`Y${k + 1}`}</text>
              <line x1={64 + k * segW + segW / 2} y1={280} x2={64 + k * segW + segW / 2} y2={304} stroke="#9AA9BD" strokeWidth={4} />
              <text x={64 + k * segW + segW / 2} y={346} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={f > 0.6 ? BLUE : '#9AA9BD'}>{`${(k + 1) * 120} TB`}</text>
            </g>
          );
        })}
        {years > 0.01 ? <rect x={56} y={150} width={TL_W - 112} height={120} rx={60} fill="none" stroke={INK} strokeWidth={5} opacity={years} /> : null}
        <text x={60} y={400} fontFamily={FONT} fontWeight={500} fontSize={32} fill={MUTE}>total written over the warranty</text>
      </Plate>
      {years > 0.01 ? (
        <g transform={`translate(${TL_X + TL_W - 150},${TL_Y - 40}) scale(${years}) rotate(${14 - 4 * years})`}>
          {Array.from({length: 24}).map((_, i) => <circle key={i} cx={Math.cos(i * 0.2618) * 150} cy={Math.sin(i * 0.2618) * 150} r={22} fill={BLUE} />)}
          <circle r={150} fill={`url(#${id}-blue)`} /><circle r={124} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="4 9" />
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={150} fill="#FFFFFF">5</text>
          <text x={0} y={76} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={32} fill="#FFFFFF" letterSpacing={6}>YEARS</text>
        </g>
      ) : null}
      {years > 0.01 && t - tYears < 14 ? Array.from({length: 16}).map((_, i) => {
        const q = (t - tYears) / 14, a = i * 0.3927;
        return <rect key={i} x={TL_X + TL_W - 150 + Math.cos(a) * (170 + 260 * outC(q)) - 8} y={TL_Y - 40 + Math.sin(a) * (170 + 260 * outC(q)) - 8} width={16} height={16} rx={4}
                     fill={[BLUE, MARK, RED, GREEN][i % 4]} opacity={1 - q} transform={`rotate(${q * 200 + i * 30} ${TL_X + TL_W - 150 + Math.cos(a) * (170 + 260 * outC(q))} ${TL_Y - 40 + Math.sin(a) * (170 + 260 * outC(q))})`} />;
      }) : null}
    </svg>
  );
};

export const proofWorld: WorldDef = {
  id: 'proof', home: 'drive',
  anchors: {
    drive: {x: DC[0], y: DC[1] + 20, zoom: 0.92},
    one: {x: DC[0] + 120, y: DC[1] + 40, zoom: 1.12},
    rated: {x: SX + SW / 2, y: SY + SH / 2 + 10, zoom: 0.72},
    '600': {x: SX + SW / 2 + 10, y: SY + 880, zoom: 0.7},
    '300': {x: CX, y: CNT_Y + 180, zoom: 0.78},
    every: {x: CX, y: CAL_Y + CAL_H / 2 - 20, zoom: 0.88},
    day: {x: CAL_X + TILE_X0 + 3 * TILE_DX + TILE_W / 2 + 40, y: CAL_Y + TILE_Y0 + 2 * TILE_DY + TILE_H / 2, zoom: 1.5},
    five: {x: TL_X + TL_W / 2, y: TL_Y + TL_H / 2 - 90, zoom: 0.62},
  },
  aliases: {why: 'drive', typical: 'drive', terabyte: 'one', terabytes: '600', written: '600', gigabytes: '300', single: 'every', years: 'five'},
  palette: {bg0: '#C3CEDD', bg1: '#FFFFFF', particles: '#7FA2D6', glow: '#FFFFFF'},
  Draw,
};
