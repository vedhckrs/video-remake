// S11 call to action: a big phone with a profile (a fingertip presses Follow -> Following), then the Part 2 teaser card
// ("What happens when you hit delete?") with a Delete key and a trash bin. No real brand names or handles.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const q = clamp01(x);
  return q * q * (3 - 2 * q);
};
const outC = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const id = 's11';
const VIO = '#8B5CF6', PINK = '#FF5FA2', CY = '#5CC8FF', INK = '#0E1020', AM = '#FFC247', RED = '#FF4D5E', GREEN = '#3FDC7B';

// phone
const PX = 820, PY = 720, PW = 760, PH = 1580, PR = 118, BZ = 22;
const BTN = {x: 70, y: 520, w: PW - 2 * BZ - 140, h: 112}; // in screen coords
const BTN_C: [number, number] = [PX + BZ + BTN.x + BTN.w / 2, PY + BZ + BTN.y + BTN.h / 2];
// teaser card
const TX = 1960, TY = 760, TW = 1020, TH = 1500;
const KEY: [number, number] = [TX + 290, TY + 1130], BIN: [number, number] = [TX + 730, TY + 1150];
const HEART = 'M0,18 C-40,-10 -22,-46 0,-22 C22,-46 40,-10 0,18 Z';

const Thumb: React.FC<{x: number; y: number; w: number; h: number; k: number}> = ({x, y, w, h, k}) => (
  <g transform={`translate(${x},${y})`}>
    <rect width={w} height={h} rx={18} fill={['#16224A', '#2A1650', '#0F2E3A', '#3A1530', '#1B2A5C', '#2B1B55'][k % 6]} />
    <rect width={w} height={h} rx={18} fill={`url(#${id}-thumb)`} />
    {k % 3 === 0 ? <><rect x={w * 0.2} y={h * 0.3} width={w * 0.6} height={h * 0.3} rx={6} fill="#0B1220" stroke={CY} strokeWidth={3} />{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={w * 0.24 + i * w * 0.11} y={h * 0.6} width={w * 0.06} height={h * 0.07} fill={AM} />)}</>
      : k % 3 === 1 ? <>{[0, 1, 2, 3].map((i) => <rect key={i} x={w * 0.2 + i * w * 0.16} y={h * (0.55 - i * 0.09)} width={w * 0.11} height={h * (0.15 + i * 0.09)} rx={5} fill={[CY, VIO, PINK, AM][i]} />)}</>
      : <><circle cx={w / 2} cy={h * 0.45} r={w * 0.2} fill="none" stroke={PINK} strokeWidth={8} /><circle cx={w / 2} cy={h * 0.45} r={w * 0.07} fill={PINK} /></>}
    <rect x={12} y={h - 44} width={w * 0.55} height={10} rx={5} fill="rgba(255,255,255,0.7)" /><rect x={12} y={h - 26} width={w * 0.35} height={8} rx={4} fill="rgba(255,255,255,0.35)" />
    <polygon points={`${w - 40},${16} ${w - 40},${40} ${w - 20},${28}`} fill="rgba(255,255,255,0.85)" />
  </g>
);

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tFol = wordAt(beats, 'follow', 3.5), tPart = wordAt(beats, 'part', 23.5), tTwo = wordAt(beats, 'two', 30);
  const tWhat = wordAt(beats, 'what', 48.5), tHap = wordAt(beats, 'happens', 54), tWhen = wordAt(beats, 'when', 63), tHit = wordAt(beats, 'hit', 70.5), tDel = wordAt(beats, 'delete', 75);
  const pressed = sp(t, tFol, 'pop');
  const following = t > tFol + 1.5;
  const flip = clamp01((t - tFol - 0.5) / 4), flipS = Math.abs(Math.cos(flip * Math.PI));
  const press = smooth((t - tFol + 5) / 5) * (1 - smooth((t - tFol - 3) / 6));
  const fingerIn = smooth((t + 6) / 7), fingerOut = smooth((t - tFol - 5) / 8);
  const sw = PW - 2 * BZ, sh = PH - 2 * BZ;
  const followers = following ? '12.4K' : '12.3K';
  // teaser
  const card = sp(t, tPart, 'settle'), two = sp(t, tTwo, 'bouncy');
  const words: [string, number, number, number][] = [['What', tWhat, 0, 0], ['happens', tHap, 1, 0], ['when', tWhen, 0, 1], ['you', tWhen + 3.5, 1, 1], ['hit', tHit, 2, 1], ['delete?', tDel, 0, 2]];
  const lineX = [[70, 410], [70, 420, 680], [70]];
  const hit = sp(t, tHit, 'pop'), keyDown = smooth((t - tHit) / 2.5) * (1 - smooth((t - tHit - 5) / 5)) + smooth((t - tDel + 1) / 2) * (1 - smooth((t - tDel - 4) / 6));
  const del = sp(t, tDel, 'bouncy');
  const lid = smooth((t - tHit) / 5) * (1 - smooth((t - tDel - 9) / 5));
  const drop = clamp01((t - tDel) / 9), dropE = drop * drop;
  const shake = t > tDel + 8 && t < tDel + 18 ? Math.sin((t - tDel - 8) * 2.6) * 10 * (1 - (t - tDel - 8) / 10) : 0;
  const ghost = sp(t, tDel + 16, 'settle');
  const endPulse = t > tDel + 20 ? 0.5 + 0.5 * Math.sin((t - tDel - 20) * 0.28) : 0;
  const fileX = BIN[0] - 250 * (1 - drop), fileY = BIN[1] - 330 + 300 * dropE - Math.sin(drop * Math.PI) * 120;

  return (
    <svg width={3400} height={3000} style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-ti`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9CED8" /><stop offset="0.3" stopColor="#5A5F6B" /><stop offset="0.55" stopColor="#2A2C34" /><stop offset="0.8" stopColor="#8A909C" /><stop offset="1" stopColor="#3A3D46" /></linearGradient>
        <linearGradient id={`${id}-scr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A1440" /><stop offset="0.35" stopColor="#0F1026" /><stop offset="1" stopColor="#0A0B18" /></linearGradient>
        <linearGradient id={`${id}-cover`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B8CFF" /><stop offset="0.5" stopColor={VIO} /><stop offset="1" stopColor={PINK} /></linearGradient>
        <linearGradient id={`${id}-btn`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3B8CFF" /><stop offset="1" stopColor={VIO} /></linearGradient>
        <linearGradient id={`${id}-thumb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" /><stop offset="1" stopColor="#000000" stopOpacity="0.35" /></linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2A2060" /><stop offset="1" stopColor="#120F2C" /></linearGradient>
        <linearGradient id={`${id}-refl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" /><stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F7D2B0" /><stop offset="1" stopColor="#D9A47A" /></linearGradient>
        <linearGradient id={`${id}-key`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4F6FA" /><stop offset="1" stopColor="#C4CAD6" /></linearGradient>
        <linearGradient id={`${id}-bin`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FF7B88" /><stop offset="0.5" stopColor={RED} /><stop offset="1" stopColor="#B02537" /></linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F7BFF" /><stop offset="1" stopColor="#BFE3FF" /></linearGradient>
        <radialGradient id={`${id}-gv`}><stop offset="0" stopColor={VIO} stopOpacity="0.6" /><stop offset="1" stopColor={VIO} stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-gp`}><stop offset="0" stopColor={PINK} stopOpacity="0.5" /><stop offset="1" stopColor={PINK} stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-gb`}><stop offset="0" stopColor="#5CC8FF" stopOpacity="0.55" /><stop offset="1" stopColor="#3B8CFF" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-sh`}><stop offset="0" stopColor="#000" stopOpacity="0.7" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <clipPath id={`${id}-clip`}><rect width={sw} height={sh} rx={PR - BZ} /></clipPath>
      </defs>

      {/* stage: glows, floor rings, floating UI chips */}
      <circle cx={PX + PW / 2} cy={PY + 700} r={1300} fill={`url(#${id}-gv)`} opacity={0.75} />
      <circle cx={TX + TW / 2} cy={TY + 800} r={1300} fill={`url(#${id}-gp)`} opacity={0.5 * card} />
      {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={PX + PW / 2} cy={PY + PH + 90} rx={520 + k * 230} ry={(520 + k * 230) * 0.2} fill="none" stroke={k % 2 ? PINK : VIO} strokeWidth={3} opacity={0.4 - k * 0.08} />)}
      {Array.from({length: 14}).map((_, i) => {
        const x = 200 + rnd(i * 2.1) * 3000, y = 300 + rnd(i * 4.3) * 2300 + Math.sin(t * 0.05 + i) * 20, s = 0.7 + rnd(i * 7) * 0.9, kind = i % 3;
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${s}) rotate(${(rnd(i) - 0.5) * 30})`} opacity={0.22}>
            {kind === 0 ? <path d={HEART} fill={PINK} />
              : kind === 1 ? <><rect x={-34} y={-24} width={68} height={48} rx={14} fill={VIO} /><polygon points="-8,22 8,22 -14,40" fill={VIO} /></>
              : <><circle r={26} fill="none" stroke={CY} strokeWidth={7} /><polygon points="-8,-12 -8,12 14,0" fill={CY} /></>}
          </g>
        );
      })}

      {/* ---------------- the phone ---------------- */}
      <ellipse cx={PX + PW / 2 + 40} cy={PY + PH + 80} rx={560} ry={110} fill={`url(#${id}-sh)`} />
      <g transform={`translate(${PX},${PY})`}>
        {/* thickness + side buttons */}
        <rect x={16} y={14} width={PW} height={PH} rx={PR} fill="#0B0C12" />
        <rect x={8} y={7} width={PW} height={PH} rx={PR} fill="#23252E" />
        <rect x={PW - 2} y={360} width={16} height={200} rx={7} fill="#4A4E5A" /><rect x={-12} y={300} width={14} height={110} rx={6} fill="#6A6F7C" /><rect x={-12} y={440} width={14} height={180} rx={6} fill="#6A6F7C" />
        <rect width={PW} height={PH} rx={PR} fill={`url(#${id}-ti)`} />
        <rect x={5} y={5} width={PW - 10} height={PH - 10} rx={PR - 5} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
        <rect x={BZ * 0.45} y={BZ * 0.45} width={PW - BZ * 0.9} height={PH - BZ * 0.9} rx={PR - BZ * 0.45} fill="#040408" />
        <g transform={`translate(${BZ},${BZ})`} clipPath={`url(#${id}-clip)`}>
          <rect width={sw} height={sh} fill={`url(#${id}-scr)`} />
          {/* cover + status bar */}
          <rect width={sw} height={300} fill={`url(#${id}-cover)`} />
          {Array.from({length: 9}).map((_, i) => <circle key={i} cx={rnd(i * 3.1) * sw} cy={rnd(i * 5.3) * 300} r={30 + rnd(i) * 90} fill="#FFFFFF" opacity={0.07} />)}
          <text x={64} y={74} fontFamily={FONT} fontWeight={700} fontSize={30} fill="#FFFFFF">9:41</text>
          <rect x={sw - 118} y={50} width={56} height={26} rx={8} fill="none" stroke="#FFFFFF" strokeWidth={3} /><rect x={sw - 113} y={55} width={38} height={16} rx={4} fill="#FFFFFF" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={sw - 196 + i * 14} y={70 - i * 7} width={9} height={8 + i * 7} rx={2} fill="#FFFFFF" />)}
          {/* avatar */}
          <circle cx={150} cy={300} r={112} fill="#0F1026" />
          <circle cx={150} cy={300} r={100} fill={`url(#${id}-btn)`} />
          <rect x={102} y={262} width={96} height={76} rx={12} fill="#0B1220" stroke="#FFFFFF" strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={110 + i * 22} y={338} width={12} height={16} fill="#FFD27A" />)}
          <text x={150} y={312} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#FFFFFF">SSD</text>
          <circle cx={226} cy={372} r={26} fill="#3B8CFF" stroke="#0F1026" strokeWidth={6} /><path d="M214,372 L223,381 L239,363" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          {/* name + bio */}
          <text x={290} y={372} fontFamily={FONT} fontWeight={800} fontSize={46} fill="#FFFFFF">Tech, explained</text>
          <text x={290} y={412} fontFamily={FONT} fontWeight={500} fontSize={27} fill="#A9B0D0">how things work in 90 seconds</text>
          {/* stats */}
          {[['128', 'videos'], [followers, 'followers'], ['4.9M', 'likes']].map(([n, l], i) => (
            <g key={l} transform={`translate(${sw * (0.2 + i * 0.3)},470)`}>
              <text textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={i === 1 && following ? '#FFFFFF' : '#E8EAF6'} transform={i === 1 ? `scale(${1 + 0.25 * pressed * Math.exp(-Math.max(0, t - tFol) / 8)})` : undefined}>{n}</text>
              <text y={34} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={24} fill="#8D94B8">{l}</text>
            </g>
          ))}
          {/* follow button */}
          <g transform={`translate(${BTN.x + BTN.w / 2},${BTN.y + BTN.h / 2}) scale(${1 - 0.06 * press},${(1 - 0.06 * press) * Math.max(0.08, flipS)})`}>
            <rect x={-BTN.w / 2 + 6} y={-BTN.h / 2 + 10} width={BTN.w} height={BTN.h} rx={BTN.h / 2} fill="#000" opacity={0.45} />
            {following ? (
              <>
                <rect x={-BTN.w / 2} y={-BTN.h / 2} width={BTN.w} height={BTN.h} rx={BTN.h / 2} fill="#1B1D36" stroke={GREEN} strokeWidth={5} />
                <circle cx={-128} cy={0} r={28} fill={GREEN} /><path d="M-142,0 L-131,11 L-113,-10" fill="none" stroke="#0B2415" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                <text x={30} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill="#FFFFFF">Following</text>
              </>
            ) : (
              <>
                <rect x={-BTN.w / 2} y={-BTN.h / 2} width={BTN.w} height={BTN.h} rx={BTN.h / 2} fill={`url(#${id}-btn)`} />
                <rect x={-BTN.w / 2 + 8} y={-BTN.h / 2 + 6} width={BTN.w - 16} height={BTN.h * 0.42} rx={BTN.h * 0.21} fill="#FFFFFF" opacity={0.18} />
                <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={52} fill="#FFFFFF">Follow</text>
              </>
            )}
          </g>
          {/* tabs + grid */}
          {['Videos', 'Series', 'About'].map((l, i) => <text key={l} x={sw * (0.2 + i * 0.3)} y={720} textAnchor="middle" fontFamily={FONT} fontWeight={i === 0 ? 700 : 500} fontSize={30} fill={i === 0 ? '#FFFFFF' : '#7A80A4'}>{l}</text>)}
          <rect x={sw * 0.2 - 70} y={738} width={140} height={6} rx={3} fill={VIO} /><rect x={0} y={752} width={sw} height={2} fill="rgba(255,255,255,0.08)" />
          {Array.from({length: 9}).map((_, i) => <Thumb key={i} x={30 + (i % 3) * ((sw - 60 + 14) / 3)} y={780 + Math.floor(i / 3) * 266} w={(sw - 60 - 28) / 3} h={250} k={i} />)}
          <g transform="translate(30,780)">
            <rect width={(sw - 60 - 28) / 3} height={250} rx={18} fill="none" stroke={AM} strokeWidth={5} />
            <rect x={10} y={10} width={116} height={40} rx={20} fill={AM} /><text x={68} y={39} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill={INK}>PART 1</text>
          </g>
          <rect x={sw / 2 - 120} y={sh - 26} width={240} height={9} rx={4.5} fill="rgba(255,255,255,0.7)" />
          {/* island + reflection */}
          <rect x={sw / 2 - 112} y={26} width={224} height={64} rx={32} fill="#040408" />
          <rect width={sw} height={sh} fill={`url(#${id}-refl)`} />
        </g>
      </g>
      {/* press ripple + hearts */}
      {t > tFol && t < tFol + 22 ? (() => {
        const q = (t - tFol) / 22, e = outC(q);
        return (
          <g>
            <circle cx={BTN_C[0]} cy={BTN_C[1]} r={60 + 520 * e} fill="none" stroke={GREEN} strokeWidth={10 * (1 - q)} opacity={1 - q} />
            <circle cx={BTN_C[0]} cy={BTN_C[1]} r={420} fill={`url(#${id}-gb)`} opacity={(1 - q) * 0.9} />
            {Array.from({length: 14}).map((_, i) => {
              const a = -Math.PI / 2 + (rnd(i * 2.3) - 0.5) * 2.6, d = (160 + rnd(i * 3.7) * 420) * e;
              const x = BTN_C[0] + Math.cos(a) * d, y = BTN_C[1] + Math.sin(a) * d - 80 * q;
              return <path key={i} d={HEART} fill={i % 3 ? PINK : '#FFFFFF'} opacity={1 - q} transform={`translate(${x},${y}) scale(${(0.6 + rnd(i) * 0.9) * (1 - q * 0.4)}) rotate(${(rnd(i * 5) - 0.5) * 60})`} />;
            })}
          </g>
        );
      })() : null}
      {/* fingertip */}
      {fingerOut < 1 ? (
        <g transform={`translate(${BTN_C[0] + 60 + (1 - fingerIn) * 300 + fingerOut * 380},${BTN_C[1] + 40 + (1 - fingerIn) * 520 + fingerOut * 620 - press * 26}) rotate(-24) scale(${1 - 0.05 * press})`} opacity={1 - fingerOut}>
          <ellipse cx={30} cy={120} rx={130} ry={60} fill="#000" opacity={0.3 * press} />
          <path d="M-62,40 C-62,-20 62,-20 62,40 L74,520 C40,640 -70,640 -86,520 Z" fill={`url(#${id}-skin)`} />
          <path d="M-62,40 C-62,-20 62,-20 62,40 L64,120 C20,150 -30,150 -66,120 Z" fill="#FBE0C6" opacity={0.55} />
          <path d="M-40,30 C-40,-4 40,-4 40,30 L40,84 C14,98 -14,98 -40,84 Z" fill="#FFEFE3" stroke="#E8B692" strokeWidth={3} />
          <path d="M-60,300 Q0,318 68,300" fill="none" stroke="#C98F66" strokeWidth={4} opacity={0.6} /><path d="M-64,330 Q0,348 70,330" fill="none" stroke="#C98F66" strokeWidth={3} opacity={0.4} />
          <path d="M-86,520 C-160,560 -200,700 -160,900 L260,900 C300,700 240,560 74,520 Z" fill={`url(#${id}-skin)`} />
        </g>
      ) : null}

      {/* ---------------- part two teaser ---------------- */}
      {card > 0.01 ? (
        <g transform={`translate(${TX + (1 - card) * 700},${TY}) rotate(${(1 - card) * 8} ${TW / 2} ${TH / 2})`} opacity={Math.min(1, card * 1.6)}>
          <ellipse cx={TW / 2 + 40} cy={TH + 70} rx={TW * 0.55} ry={100} fill={`url(#${id}-sh)`} />
          <rect x={22} y={24} width={TW} height={TH} rx={64} fill="#07060F" />
          <rect width={TW} height={TH} rx={64} fill={`url(#${id}-glass)`} stroke="rgba(190,170,255,0.55)" strokeWidth={4} />
          <rect x={6} y={6} width={TW - 12} height={TH * 0.4} rx={58} fill={`url(#${id}-refl)`} />
          {/* badge */}
          <g transform={`translate(70,80) scale(${0.7 + 0.3 * two})`}>
            <rect width={330} height={104} rx={52} fill={`url(#${id}-cover)`} />
            <text x={54} y={70} fontFamily={FONT} fontWeight={800} fontSize={54} fill="#FFFFFF" letterSpacing={3}>PART</text>
            <circle cx={266} cy={52} r={42} fill="#FFFFFF" /><text x={266} y={74} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={62} fill={VIO}>2</text>
          </g>
          <text x={TW - 70} y={146} textAnchor="end" fontFamily={MONO} fontSize={30} fill="#A99BE0" letterSpacing={4}>NEXT UP</text>
          {two > 0.01 && t - tTwo < 14 ? <circle cx={336} cy={132} r={50 + (t - tTwo) * 30} fill="none" stroke="#FFFFFF" strokeWidth={8 * (1 - (t - tTwo) / 14)} opacity={1 - (t - tTwo) / 14} /> : null}
          {/* title, word by word */}
          {words.map(([w, at, col, row], i) => {
            const p = sp(t, at, 'bouncy'), isDel = i === 5;
            return (
              <g key={i} transform={`translate(${lineX[row][col]},${360 + row * 150}) scale(${0.8 + 0.2 * p})`} opacity={0.16 + 0.84 * Math.min(1, p * 1.4)}>
                {isDel && p > 0.01 ? <rect x={-18} y={-104} width={500 * p} height={136} rx={22} fill={RED} /> : null}
                <text fontFamily={FONT} fontWeight={800} fontSize={isDel ? 128 : 112} fill="#FFFFFF">{w}</text>
              </g>
            );
          })}
          <rect x={70} y={780} width={TW - 140} height={3} fill="rgba(190,170,255,0.3)" />
        </g>
      ) : null}
      {/* key + bin (inside the card area) */}
      {card > 0.5 ? (
        <g opacity={smooth((card - 0.5) * 2)}>
          {/* delete key */}
          <g transform={`translate(${KEY[0]},${KEY[1]}) scale(${0.85 + 0.15 * hit})`}>
            <ellipse cx={10} cy={150} rx={250} ry={50} fill={`url(#${id}-sh)`} />
            <rect x={-200} y={-74} width={400} height={230} rx={40} fill="#5B6274" />
            <rect x={-200} y={-74} width={400} height={214} rx={40} fill="#8E96A8" />
            <g transform={`translate(0,${-40 + keyDown * 34})`}>
              <rect x={-186} y={-80} width={372} height={186} rx={34} fill={`url(#${id}-key)`} stroke="#FFFFFF" strokeWidth={4} />
              <text x={-150} y={70} fontFamily={FONT} fontWeight={700} fontSize={58} fill={INK}>delete</text>
              <path d="M90,-46 H150 V0 H90 L64,-23 Z" fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" /><path d="M104,-34 L128,-12 M128,-34 L104,-12" stroke={INK} strokeWidth={7} strokeLinecap="round" />
              {keyDown > 0.2 ? <rect x={-186} y={-80} width={372} height={186} rx={34} fill={RED} opacity={0.3 * keyDown} /> : null}
            </g>
            {t > tHit && t < tHit + 10 ? [0, 1, 2, 3, 4].map((i) => <line key={i} x1={-230 + i * 115} y1={-150} x2={-250 + i * 125} y2={-150 - 60 * (1 - (t - tHit) / 10)} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={1 - (t - tHit) / 10} />) : null}
          </g>
          {/* trash bin */}
          <g transform={`translate(${BIN[0] + shake},${BIN[1]}) scale(${1 + 0.08 * del})`}>
            <circle cx={0} cy={0} r={330} fill={`url(#${id}-gp)`} opacity={0.5 + 0.5 * del} />
            <ellipse cx={10} cy={196} rx={190} ry={40} fill={`url(#${id}-sh)`} />
            <path d="M-130,-90 H130 L104,180 Q100,200 80,200 H-80 Q-100,200 -104,180 Z" fill={`url(#${id}-bin)`} stroke="#FFC2C8" strokeWidth={4} />
            {[-56, 0, 56].map((x) => <rect key={x} x={x - 9} y={-50} width={18} height={200} rx={9} fill="#7E1626" opacity={0.75} />)}
            <path d="M-130,-90 H-70 L-86,196 Q-100,196 -104,180 Z" fill="#FFFFFF" opacity={0.18} />
            <g transform={`translate(-150,-104) rotate(${-58 * lid})`}>
              <rect x={0} y={-30} width={300} height={36} rx={14} fill="#FF7B88" stroke="#FFC2C8" strokeWidth={4} />
              <rect x={104} y={-58} width={92} height={32} rx={12} fill="none" stroke="#FF7B88" strokeWidth={12} />
            </g>
          </g>
          {/* the file falling in */}
          {t > tHit + 2 && drop < 1 ? (
            <g transform={`translate(${fileX},${fileY}) rotate(${-12 + drop * 40}) scale(${(1 - drop * 0.45) * smooth((t - tHit - 2) / 3)})`}>
              <rect x={-70} y={-88} width={140} height={176} rx={16} fill="#FFFFFF" stroke="#DCE6F2" strokeWidth={3} />
              <rect x={-54} y={-70} width={108} height={84} rx={8} fill={`url(#${id}-sky)`} /><polygon points="-54,14 -18,-30 6,-4 24,-20 54,14" fill="#2C8F6C" /><circle cx={30} cy={-46} r={11} fill="#FFF3B0" />
              <rect x={-54} y={30} width={76} height={10} rx={5} fill="#9FB0C6" /><rect x={-54} y={50} width={50} height={8} rx={4} fill="#C3CEDD" />
            </g>
          ) : null}
          {/* gone ... or is it? */}
          {ghost > 0.01 ? (
            <g transform={`translate(${BIN[0]},${BIN[1] - 250 - 30 * ghost + Math.sin(t * 0.18) * 8}) scale(${ghost})`}>
              <rect x={-70} y={-88} width={140} height={176} rx={16} fill="rgba(255,255,255,0.07)" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="16 12" strokeDashoffset={-t * 1.5} />
              <text x={0} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={130} fill="#FFFFFF">?</text>
            </g>
          ) : null}
          {t > tDel + 8 && t < tDel + 26 ? Array.from({length: 16}).map((_, i) => {
            const q = (t - tDel - 8) / 18, a = -Math.PI / 2 + (rnd(i * 2.9) - 0.5) * 2.4, d = (120 + rnd(i * 4.1) * 300) * outC(q);
            return <rect key={i} x={BIN[0] + Math.cos(a) * d - 9} y={BIN[1] - 110 + Math.sin(a) * d - 9} width={18} height={18} rx={3} fill={['#FFFFFF', CY, AM, PINK][i % 4]} opacity={1 - q} />;
          }) : null}
          {/* end pill */}
          {t > tDel + 20 ? (
            <g transform={`translate(${TX + TW / 2},${TY + TH - 100}) scale(${sp(t, tDel + 20, 'bouncy') * (1 + 0.03 * endPulse)})`}>
              <rect x={-330} y={-52} width={660} height={104} rx={52} fill={`url(#${id}-btn)`} stroke="#FFFFFF" strokeWidth={4} />
              <text x={0} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={48} fill="#FFFFFF">Follow for Part 2</text>
            </g>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
};

export const ctaWorld: WorldDef = {
  id: 'cta', home: 'phone',
  anchors: {
    phone: {x: PX + PW / 2, y: PY + 560, zoom: 0.9},
    follow: {x: BTN_C[0], y: BTN_C[1] - 110, zoom: 1.2},
    part: {x: TX + TW / 2, y: TY + 510, zoom: 0.8},
    what: {x: TX + TW / 2 - 40, y: TY + 500, zoom: 1.02},
    hit: {x: TX + TW / 2 - 20, y: TY + 580, zoom: 0.9},
    delete: {x: TX + TW / 2, y: TY + 630, zoom: 0.82},
  },
  aliases: {two: 'part', happens: 'what', when: 'what'},
  palette: {bg0: '#06030F', bg1: '#2B1458', particles: '#D9BEFF', glow: '#B36BFF'},
  Draw,
};
