// S07 "Lobster lab" - OpenClaw. A deep red / black desk at night: the neon turns the act ("the free ones"), the real
// lobster mascot scuttles in and hops onto a laptop, the REAL GitHub header drops in on glass (Star box marked,
// magnified, drum counter to 395,174), the laptop wakes, chat-app logos fly into it, the software plate flips to
// "MIT · FREE · no paid tier", a terminal opens with a hazard stripe and a padlock snaps shut over it.
import React from 'react';
import {siDiscord, siGithub, siImessage, siTelegram, siWhatsapp} from 'simple-icons';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {Burst, pulseOn, wordAt} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {ASSETS, FONT, MONO, SvgImg, bob, usePreload} from './shared';
import {Drum, GH, GitProof, LogoDot, Plate, clamp01, drumWidth, flash, hop, inOut, lerp, outC, rnd, seg, starPath} from './claw_kit';

const id = 's07';
const RED = '#FF4B3E', HOT = '#FF8A7A', DEEP = '#260706', GOLD = '#FFD84D', OKG = '#3DDC84', WARN = '#FFC400';

// ---- geometry (world px) ----
const LID = {x: 700, y: 1640, w: 1200, h: 740};
const SCR = {x: 728, y: 1668, w: 1144, h: 672};
const LOB = 500;                                   // lobster size
const PAN = {x: 450, y: 20, w: 1700};             // GitHub panel
const LENS = {x: 1420, y: 884, w: 720};
const DR = {size: 150, y: 934};
const TERM = {x: 590, y: 1700, w: 1420, h: 560};
const PLATE = {x: 740, y: 2700, w: 1160, h: 190};
const PHONE = {x: 500, y: 2462, w: 236, h: 470};
const SIGN = {x: 490, y: 1190, w: 520, h: 380};
const TILES = [0, 1, 2, 3].map((i) => ({x: 744 + (i % 2) * 568, y: 1806 + Math.floor(i / 2) * 164, w: 552, h: 148}));
const APPS = [
  {icon: siWhatsapp, name: 'WhatsApp', from: [566, 2566]},
  {icon: siTelegram, name: 'Telegram', from: [566, 2654]},
  {icon: siImessage, name: 'iMessage', from: [566, 2742]},
  {icon: siDiscord, name: 'Discord', from: [566, 2830]},
] as const;

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  usePreload([ASSETS.clawMascot, ASSETS.ghOpenclaw]);
  const tNow = wordAt(beats, 'now', 8.5), tFree = wordAt(beats, 'free', 16.5), tOnes = wordAt(beats, 'ones', 22);
  const tClaw = wordAt(beats, 'openclaw', 54.5), tLob = wordAt(beats, 'lobster', 74.5);
  const tThree = wordAt(beats, 'three', 99), tHun = wordAt(beats, 'hundred', 106), tNin = wordAt(beats, 'ninetyfive', 113.5), tThou = wordAt(beats, 'thousand', 126.5);
  const tGit = wordAt(beats, 'github', 136), tStars = wordAt(beats, 'stars', 144);
  const tRuns = wordAt(beats, 'runs', 180), tOwn = wordAt(beats, 'own', 193), tComp = wordAt(beats, 'computer', 197.5);
  const tChat = wordAt(beats, 'chat', 222.5), tWa = wordAt(beats, 'whatsapp', 237), tTg = wordAt(beats, 'telegram', 254);
  const tSoft = wordAt(beats, 'software', 285), tCosts = wordAt(beats, 'costs', 297.5), tNothing = wordAt(beats, 'nothing', 305.5);
  const tRun = wordAt(beats, 'run', 340), tCmd = wordAt(beats, 'commands', 345), tMach = wordAt(beats, 'machine', 361);
  const tLock = wordAt(beats, 'lock', 376), tDown = wordAt(beats, 'down', 385);
  const tPanel = tThree - 5, tLand = tLob + 13;
  const appT = [tWa, tTg, tTg + 9, tTg + 17];
  const pulse = pulseOn(t, beats);

  // ---- act light ----
  const lamp = sp(t, tNow, 'settle');
  const turn = sp(t, tFree, 'settle');
  const flick = t < tFree ? 0 : t < tFree + 7 ? (rnd(Math.floor(t * 2)) > 0.4 ? 1 : 0.25) : 1;
  const proofOut = inOut(seg(t, tRuns - 3, tRuns + 9));
  const proofIn = sp(t, tPanel, 'settle') * (1 - proofOut);
  const neon = flick * (0.9 + 0.1 * Math.sin(t * 0.9)) + flash(t, tNothing, 9) * 0.5;
  const sub = t < tOnes ? 0 : t < tOnes + 5 ? (rnd(Math.floor(t * 2) + 9) > 0.45 ? 1 : 0.2) : 1;
  const act = 0.3 + 0.7 * turn;

  // ---- laptop state ----
  const boot = sp(t, tRuns, 'settle'), own = sp(t, tOwn, 'pop'), osk = sp(t, tComp, 'pop'), wake = sp(t, tChat - 10, 'settle');
  const term = sp(t, tRun, 'settle');
  const danger = sp(t, tCmd, 'settle') * (1 - sp(t, tDown, 'settle'));
  const locked = sp(t, tDown, 'bouncy');
  const lidBounce = flash(t, tLand, 4) * 10;
  const screenLight = Math.max(boot * 0.35, wake) * (1 - 0.3 * term);

  // ---- lobster ----
  const run = outC(seg(t, tClaw, tClaw + 17));
  const j = seg(t, tLob, tLand), je = inOut(j);
  const b = bob(t, 4, 0.7);
  const reacts = [tThree, tHun, tNin, tThou, tStars, tComp, tWa, tTg, tTg + 9, tTg + 17, tNothing, tCmd, tDown];
  let hopY = 0;
  for (const r of reacts) hopY = Math.max(hopY, hop(t, r + 1, 9));
  const settled = sp(t, tLand + 2, 'settle');
  const lookUp = proofIn;
  const afraid = danger * (0.5 + 0.5 * Math.sin(t * 2.4));
  let lx = lerp(2790, 2010, run), ly = 2650 - Math.abs(Math.sin(t * 1.5)) * 18 * (run < 1 ? 1 : 0.35);
  let lrot = Math.sin(t * 1.5) * 7 * (run < 1 ? 1 : 0.4);
  let lsx = 1, lsy = 1;
  if (t >= tLob) {
    lx = lerp(2010, 1300, je) + settled * (Math.sin(t * 0.045) * 52 + afraid * 5);
    ly = lerp(2650, 1654, je) - Math.sin(j * Math.PI) * 400 - hopY * 44 + lidBounce + b.dy * 0.25 * settled;
    lrot = -Math.sin(j * Math.PI) * 18 + settled * (b.rot * 0.9 + Math.cos(t * 0.045) * 2.4 - lookUp * 4 + Math.sin(t * 0.8) * 0.8);
    const sq = flash(t, tLand, 4) * 0.16;
    lsx = (1 + sq) * (settled ? b.sx : 1) * (1 - hopY * 0.05);
    lsy = (1 - sq) * (settled ? b.sy : 1) * (1 + hopY * 0.07 + lookUp * 0.025);
  }
  const lobVisible = t >= tClaw - 0.5;

  // ---- GitHub panel star box (world) ----
  const gs = PAN.w / GH.W, bar = PAN.w * 0.038;
  const starX = PAN.x + (GH.star.x + 44) * gs, starY = PAN.y + bar + (GH.star.y + GH.star.h / 2) * gs;
  const dW = drumWidth(395174, DR.size);
  const drumX = 440;

  // ---- plate (software costs nothing) ----
  const plateIn = sp(t, tSoft, 'settle');
  const flip = seg(t, tNothing, tNothing + 8);
  const plateSy = Math.max(0.04, Math.abs(Math.cos(flip * Math.PI)));
  const badge = flip >= 0.5;
  const costs = sp(t, tCosts, 'bouncy');

  const typed = (s: string, at: number, cps = 2.6) => s.slice(0, Math.max(0, Math.floor((t - at) * cps)));
  const keyRow = (r: number) => {
    const q = r / 5, y = 2408 + r * 20;
    return {y, x0: lerp(690, 600, q), x1: lerp(1910, 2000, q)};
  };

  return (
    <svg width={2600} height={3400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070102" /><stop offset="0.6" stopColor="#1C0506" /><stop offset="1" stopColor="#2B0809" /></linearGradient>
        <radialGradient id={`${id}-wash`}><stop offset="0" stopColor={RED} stopOpacity={0.6} /><stop offset="0.5" stopColor="#B3201A" stopOpacity={0.22} /><stop offset="1" stopColor="#B3201A" stopOpacity={0} /></radialGradient>
        <radialGradient id={`${id}-warm`}><stop offset="0" stopColor="#FFC27A" stopOpacity={0.55} /><stop offset="0.6" stopColor="#FF7A3D" stopOpacity={0.14} /><stop offset="1" stopColor="#FF7A3D" stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}-desk`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A0E0D" /><stop offset="0.35" stopColor="#210707" /><stop offset="1" stopColor="#0B0202" /></linearGradient>
        <linearGradient id={`${id}-deskfront`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#170404" /><stop offset="1" stopColor="#050101" /></linearGradient>
        <linearGradient id={`${id}-alu`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5A5E68" /><stop offset="0.3" stopColor="#2A2D34" /><stop offset="1" stopColor="#121317" /></linearGradient>
        <linearGradient id={`${id}-deck`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#23252B" /><stop offset="1" stopColor="#3B3E46" /></linearGradient>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#3A0D0C" /><stop offset="0.5" stopColor="#1A0606" /><stop offset="1" stopColor="#0B0303" /></linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#4A1310" stopOpacity={0.96} /><stop offset="1" stopColor="#120404" stopOpacity={0.97} /></linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} /><stop offset="0.5" stopColor={HOT} stopOpacity={0.45} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.12} /></linearGradient>
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD7A0" stopOpacity={0.5} /><stop offset="1" stopColor="#FFD7A0" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFB0A0" stopOpacity={0} /><stop offset="0.5" stopColor="#FFD0C4" stopOpacity={0.5} /><stop offset="1" stopColor="#FFB0A0" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${id}-brass`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9A6" /><stop offset="0.5" stopColor="#E0A93A" /><stop offset="1" stopColor="#8A5A12" /></linearGradient>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7C838F" /><stop offset="0.5" stopColor="#F2F4F7" /><stop offset="1" stopColor="#6C727D" /></linearGradient>
        <pattern id={`${id}-haz`} width={90} height={90} patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width={90} height={90} fill={WARN} /><rect width={45} height={90} fill="#141414" /></pattern>
        <clipPath id={`${id}-scr`}><rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx={14} /></clipPath>
        <clipPath id={`${id}-term`}><rect x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} rx={30} /></clipPath>
      </defs>

      {/* ================= room ================= */}
      <rect x={-1200} y={-1700} width={5000} height={4050} fill={`url(#${id}-wall)`} />
      {/* wall panels + seams */}
      {Array.from({length: 13}).map((_, i) => <rect key={i} x={-1100 + i * 380} y={-1700} width={6} height={4030} fill="#000" opacity={0.35} />)}
      {Array.from({length: 13}).map((_, i) => <rect key={`h${i}`} x={-1094 + i * 380} y={-1700} width={3} height={4030} fill={HOT} opacity={0.05 * act} />)}
      {[-300, 520, 1340].map((y, i) => <rect key={i} x={-1200} y={y} width={5000} height={5} fill="#000" opacity={0.3} />)}
      {/* red wash from the neon + warm pool from the lamp */}
      <ellipse cx={1300} cy={1050} rx={1700} ry={1250} fill={`url(#${id}-wash)`} opacity={act * (0.55 + 0.45 * neon)} />
      <ellipse cx={1300} cy={2300} rx={1500} ry={700} fill={`url(#${id}-wash)`} opacity={0.5 * act} />
      <ellipse cx={1300} cy={2350} rx={1300} ry={560} fill={`url(#${id}-warm)`} opacity={0.3 + 0.35 * lamp} />
      {/* vertical LED strip (right) */}
      <rect x={2330} y={600} width={26} height={1500} rx={13} fill="#3A0A0A" />
      <rect x={2336} y={606} width={14} height={1488} rx={7} fill={RED} opacity={0.3 + 0.7 * lamp} />
      <rect x={2290} y={560} width={106} height={1580} rx={53} fill={RED} opacity={0.14 * act} />
      {/* skyline of small equipment lights far back */}
      {Array.from({length: 26}).map((_, i) => (
        <circle key={i} cx={-200 + rnd(i * 3.3) * 3000} cy={1900 + rnd(i * 7.1) * 380} r={3 + rnd(i) * 4} fill={i % 4 ? HOT : '#FFD9A0'} opacity={(0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.2 + i))) * act} />
      ))}

      {/* ---- neon sign (wall, left of the lobster) ---- */}
      <g opacity={0.3 + 0.7 * clamp01(neon + 0.05)}>
        <path d={`M${SIGN.x + 120},${SIGN.y} V${SIGN.y - 900} M${SIGN.x + SIGN.w - 120},${SIGN.y} V${SIGN.y - 900}`} stroke="#000" strokeWidth={5} opacity={0.6} />
        <rect x={SIGN.x} y={SIGN.y} width={SIGN.w} height={SIGN.h} rx={44} fill="#0B0202" opacity={0.78} />
        <rect x={SIGN.x} y={SIGN.y} width={SIGN.w} height={SIGN.h} rx={44} fill="none" stroke="#4A100E" strokeWidth={6} />
        {[SIGN.x + 26, SIGN.x + SIGN.w - 26].map((x) => <circle key={x} cx={x} cy={SIGN.y + 26} r={9} fill="#5A1512" />)}
      </g>
      <ellipse cx={SIGN.x + SIGN.w / 2} cy={SIGN.y + SIGN.h / 2} rx={520} ry={400} fill={`url(#${id}-wash)`} opacity={0.7 * neon} />
      <g>
        {[{w: 44, o: 0.1}, {w: 24, o: 0.2}, {w: 11, o: 0.95}].map((l, i) => (
          <text key={i} x={SIGN.x + SIGN.w / 2 + 8} y={SIGN.y + 218} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={176} letterSpacing={14} fill="none" stroke={i === 2 ? '#FF6A5C' : RED}
            strokeWidth={l.w} strokeLinejoin="round" opacity={l.o * neon + (i === 2 ? 0.16 : 0)}>FREE</text>
        ))}
        <text x={SIGN.x + SIGN.w / 2 + 8} y={SIGN.y + 218} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={176} letterSpacing={14} fill="none" stroke="#FFF1EC" strokeWidth={4} opacity={neon}>FREE</text>
        {[{w: 20, o: 0.18}, {w: 7, o: 0.9}].map((l, i) => (
          <text key={i} x={SIGN.x + SIGN.w / 2 + 4} y={SIGN.y + 322} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={54} letterSpacing={7} fill={i ? '#FFE3C2' : 'none'} stroke="#FFB15C"
            strokeWidth={i ? 0 : l.w} opacity={l.o * sub + (i ? 0.12 : 0)}>OPEN SOURCE</text>
        ))}
      </g>

      {/* ================= desk ================= */}
      <polygon points={`-1200,2330 3800,2330 4300,3080 -1700,3080`} fill={`url(#${id}-desk)`} />
      <rect x={-1700} y={3080} width={6000} height={1100} fill={`url(#${id}-deskfront)`} />
      <rect x={-1700} y={3076} width={6000} height={8} fill={HOT} opacity={0.28 * act} />
      <rect x={-1200} y={2328} width={5000} height={5} fill={HOT} opacity={0.22 * act} />
      {/* wood grain / reflections */}
      {Array.from({length: 16}).map((_, i) => <rect key={i} x={-900 + rnd(i * 2.9) * 3600} y={2380 + i * 42} width={500 + rnd(i * 5.1) * 900} height={3} rx={1.5} fill={HOT} opacity={0.05 + 0.05 * rnd(i)} />)}
      <ellipse cx={1300} cy={2660} rx={900} ry={170} fill={RED} opacity={0.1 * act * (0.4 + 0.6 * neon)} />
      {/* screen light spill on the desk */}
      <ellipse cx={1300} cy={2640} rx={1050} ry={230} fill={danger > 0.3 ? WARN : locked > 0.3 ? OKG : HOT} opacity={0.2 * screenLight} />

      {/* ---- desk mat ---- */}
      <polygon points="440,2372 2160,2372 2330,2990 270,2990" fill="#0E0303" opacity={0.85} />
      <polygon points="440,2372 2160,2372 2330,2990 270,2990" fill="none" stroke={HOT} strokeOpacity={0.22 * act} strokeWidth={4} />
      <polygon points="468,2392 2132,2392 2288,2966 312,2966" fill="none" stroke={HOT} strokeOpacity={0.3 * act} strokeWidth={3} strokeDasharray="16 14" />
      {/* ---- mug with steam (right front) ---- */}
      <g transform="translate(1560 110)">
        <ellipse cx={470} cy={2650} rx={120} ry={24} fill="#000" opacity={0.5} />
        <path d="M545,2530 q70,0 70,50 q0,50 -70,50" fill="none" stroke="#2A2D34" strokeWidth={22} />
        <rect x={385} y={2480} width={170} height={170} rx={26} fill={`url(#${id}-alu)`} />
        <rect x={385} y={2480} width={170} height={170} rx={26} fill="none" stroke={HOT} strokeOpacity={0.3 * act} strokeWidth={4} />
        <ellipse cx={470} cy={2484} rx={78} ry={14} fill="#120303" />
        <rect x={420} y={2540} width={100} height={60} rx={10} fill={RED} opacity={0.8} />
        {[0, 1, 2].map((i) => {
          const ph = t * 0.06 + i * 2.1, up = (t * 1.2 + i * 60) % 180;
          return <path key={i} d={`M${440 + i * 30},${2460 - up} q${14 * Math.sin(ph)},-30 0,-60 q${-14 * Math.sin(ph)},-30 0,-60`} fill="none" stroke="#FFD9D2" strokeWidth={7} strokeLinecap="round" opacity={0.25 * Math.sin((up / 180) * Math.PI)} />;
        })}
      </g>
      {/* ---- mini server (right): your own machine ---- */}
      <g>
        <ellipse cx={2230} cy={2540} rx={170} ry={30} fill="#000" opacity={0.5} />
        <rect x={2110} y={2330} width={240} height={206} rx={22} fill={`url(#${id}-alu)`} />
        <rect x={2110} y={2330} width={240} height={206} rx={22} fill="none" stroke={HOT} strokeOpacity={0.35 * act} strokeWidth={4} />
        {[0, 1, 2].map((i) => <rect key={i} x={2134} y={2360 + i * 52} width={192} height={36} rx={8} fill="#0B0C0F" />)}
        {[0, 1, 2].map((i) => <circle key={`l${i}`} cx={2302} cy={2378 + i * 52} r={7} fill={i === 1 ? '#FFB15C' : OKG} opacity={0.35 + 0.65 * (Math.sin(t * (0.5 + i * 0.23) + i) > 0 ? 1 : 0.2)} />)}
        {[0, 1, 2].map((i) => <rect key={`v${i}`} x={2148} y={2374 + i * 52} width={90} height={8} rx={4} fill="#3A3D45" />)}
      </g>
      {/* cable from the server to the laptop */}
      <path d="M2110,2500 C2020,2600 2000,2470 1940,2470" fill="none" stroke="#0A0A0C" strokeWidth={12} strokeLinecap="round" />

      {/* ================= laptop ================= */}
      <g transform={`translate(0 ${lidBounce})`}>
        <ellipse cx={1300} cy={2566} rx={900} ry={52} fill="#000" opacity={0.6} />
        {/* screen glow behind the lid */}
        <ellipse cx={1300} cy={2010} rx={900} ry={620} fill={danger > 0.3 ? '#FF5A2E' : locked > 0.3 ? OKG : RED} opacity={0.2 * screenLight} />
        {/* lid */}
        <rect x={LID.x} y={LID.y} width={LID.w} height={LID.h} rx={34} fill={`url(#${id}-alu)`} />
        <rect x={LID.x + 2} y={LID.y + 2} width={LID.w - 4} height={LID.h - 4} rx={34} fill="none" stroke={HOT} strokeOpacity={0.3 + 0.4 * act} strokeWidth={4} />
        <rect x={LID.x + 12} y={LID.y + 12} width={LID.w - 24} height={LID.h - 24} rx={24} fill="#050506" />
        {/* display */}
        <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx={14} fill="#07080A" />
        <g clipPath={`url(#${id}-scr)`}>
          {/* asleep: faint reflection + standby */}
          <polygon points={`${SCR.x + 120},${SCR.y} ${SCR.x + 420},${SCR.y} ${SCR.x + 120},${SCR.y + SCR.h} ${SCR.x - 180},${SCR.y + SCR.h}`} fill="#FFFFFF" opacity={0.035} />
          <polygon points={`${SCR.x + 520},${SCR.y} ${SCR.x + 600},${SCR.y} ${SCR.x + 300},${SCR.y + SCR.h} ${SCR.x + 220},${SCR.y + SCR.h}`} fill="#FFFFFF" opacity={0.03} />
          {wake < 0.98 && boot < 0.05 ? <circle cx={1300} cy={2004} r={10 + 3 * Math.sin(t * 0.3)} fill={HOT} opacity={0.3 + 0.25 * Math.sin(t * 0.3)} /> : null}
          {/* boot: runs -> own */}
          {boot > 0.01 && wake < 0.98 ? (
            <g opacity={boot * (1 - wake)}>
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} fill={`url(#${id}-screen)`} opacity={0.8} />
              <circle cx={1300} cy={1800} r={54} fill="none" stroke="#3A1412" strokeWidth={14} />
              <path d={`M1300,1746 A54,54 0 0 1 1354,1800`} fill="none" stroke={RED} strokeWidth={14} strokeLinecap="round" transform={`rotate(${t * 22} 1300 1800)`} />
              <text x={1300} y={1960} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={54} fill={HOT} letterSpacing={6} opacity={boot}>RUNS ON</text>
              <g transform={`translate(1300 2062) scale(${0.7 + 0.3 * own})`} opacity={clamp01(own)}>
                <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={92} fill="#FFFFFF">your own computer</text>
              </g>
              <g transform={`translate(1300 2160) scale(${0.7 + 0.3 * osk})`} opacity={clamp01(osk)}>
                <text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={54} fill={HOT} letterSpacing={2}>macOS · Windows · Linux</text>
              </g>
              <rect x={900} y={2250} width={800} height={16} rx={8} fill="#3A1412" />
              <rect x={900} y={2250} width={800 * clamp01((t - tRuns) / (tChat - 10 - tRuns))} height={16} rx={8} fill={RED} />
            </g>
          ) : null}
          {/* awake: the OpenClaw chat UI */}
          {wake > 0.01 ? (
            <g opacity={clamp01(wake * 1.3)}>
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} fill={`url(#${id}-screen)`} />
              <rect x={SCR.x} y={SCR.y} width={SCR.w} height={124} fill="#000" opacity={0.35} />
              <circle cx={792} cy={1730} r={46} fill="#3A0D0C" stroke={HOT} strokeOpacity={0.6} strokeWidth={3} />
              <SvgImg src={ASSETS.clawMascot} x={752} y={1688} w={80} h={80} />
              <text x={858} y={1752} fontFamily={FONT} fontWeight={800} fontSize={62} fill="#FFFFFF">OpenClaw</text>
              <circle cx={1404} cy={1731} r={11} fill={OKG} opacity={0.6 + 0.4 * Math.sin(t * 0.4)} />
              <text x={1850} y={1746} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={44} fill="#FFC9BF">on your computer</text>
              {/* app tiles */}
              {TILES.map((T, i) => {
                const ghost = sp(t, tChat + i * 1.5, 'pop'), k = sp(t, appT[i] + 12, 'bouncy');
                const A = APPS[i];
                return (
                  <g key={i}>
                    {ghost > 0.01 && k < 0.99 ? <rect x={T.x} y={T.y} width={T.w} height={T.h} rx={30} fill="#FFFFFF" fillOpacity={0.03} stroke={HOT} strokeOpacity={0.5 * ghost} strokeWidth={4} strokeDasharray="14 14" strokeDashoffset={-t * 2} /> : null}
                    {k > 0.01 ? (
                      <g transform={`translate(${T.x + T.w / 2} ${T.y + T.h / 2}) scale(${0.8 + 0.2 * k}) translate(${-T.w / 2} ${-T.h / 2})`} opacity={clamp01(k * 1.5)}>
                        <rect x={0} y={0} width={T.w} height={T.h} rx={30} fill="#FFFFFF" fillOpacity={0.09} stroke={'#' + A.icon.hex} strokeOpacity={0.8} strokeWidth={4} />
                        <rect x={0} y={0} width={T.w} height={T.h} rx={30} fill={'#' + A.icon.hex} opacity={0.14 + 0.3 * flash(t, appT[i] + 12, 6)} />
                        <LogoDot icon={A.icon} cx={76} cy={T.h / 2} r={52} />
                        <text x={152} y={T.h / 2 + 20} fontFamily={FONT} fontWeight={700} fontSize={56} fill="#FFFFFF">{A.name}</text>
                      </g>
                    ) : null}
                  </g>
                );
              })}
              {/* + more */}
              {(() => {
                const k = sp(t, tTg + 26, 'pop');
                return k > 0.01 ? (
                  <g transform={`translate(1300 2185) scale(${0.7 + 0.3 * k})`} opacity={clamp01(k * 1.5)}>
                    <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={48} fill="#FFD9D2">+ Slack, Teams and 20 more</text>
                  </g>
                ) : null;
              })()}
              {/* composer */}
              {(() => {
                const k = sp(t, tChat, 'pop');
                return k > 0.01 ? (
                  <g transform={`translate(0 ${(1 - k) * 90})`} opacity={clamp01(k * 1.5)}>
                    <rect x={744} y={2246} width={1112} height={80} rx={40} fill="#000" opacity={0.45} stroke={HOT} strokeOpacity={0.4 + 0.5 * flash(t, tChat, 8)} strokeWidth={3} />
                    <text x={786} y={2301} fontFamily={FONT} fontWeight={500} fontSize={44} fill="#C99A93">Message OpenClaw</text>
                    {Math.sin(t * 0.55) > 0 ? <rect x={1206} y={2264} width={5} height={46} fill="#FFFFFF" /> : null}
                    <circle cx={1812} cy={2286} r={30} fill={RED} /><path d="M1800,2298 L1812,2272 L1824,2298" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ) : null;
              })()}
            </g>
          ) : null}
          {/* glass sheen */}
          <polygon points={`${SCR.x},${SCR.y} ${SCR.x + 760},${SCR.y} ${SCR.x + 420},${SCR.y + SCR.h} ${SCR.x},${SCR.y + SCR.h}`} fill="#FFFFFF" opacity={0.03 + 0.02 * wake} />
        </g>
        {/* camera dot */}
        <circle cx={1300} cy={1654} r={6} fill="#1E2026" /><circle cx={1300} cy={1654} r={2.5} fill={wake > 0.5 ? OKG : '#3A3D45'} />
        {/* hinge + base */}
        <rect x={760} y={2378} width={1080} height={20} rx={8} fill="#0A0A0C" />
        <polygon points="660,2396 1940,2396 2070,2530 530,2530" fill={`url(#${id}-deck)`} />
        <polygon points="660,2396 1940,2396 1946,2402 654,2402" fill="#FFFFFF" opacity={0.12} />
        {Array.from({length: 5}).map((_, r) => {
          const R = keyRow(r), n = 15, kw = (R.x1 - R.x0) / n;
          return Array.from({length: n}).map((__, c) => {
            const hit = boot > 0.2 && rnd(r * 17 + c + Math.floor(t / 3)) > 0.93;
            return <rect key={`${r}-${c}`} x={R.x0 + c * kw + 3} y={R.y} width={kw - 6} height={15} rx={4} fill={hit ? HOT : '#0C0D10'} stroke={RED} strokeOpacity={0.5 * screenLight} strokeWidth={1.5} />;
          });
        })}
        <polygon points="1130,2510 1470,2510 1478,2526 1122,2526" fill="#1B1D22" stroke="#4C5059" strokeWidth={1.5} />
        <rect x={530} y={2530} width={1540} height={26} rx={12} fill="#15161A" /><rect x={530} y={2530} width={1540} height={5} rx={2.5} fill="#8D929C" opacity={0.6} />
        <rect x={1240} y={2536} width={120} height={8} rx={4} fill="#000" opacity={0.6} />
        {/* power LED */}
        <circle cx={2010} cy={2543} r={6} fill={boot > 0.2 ? OKG : HOT} opacity={boot > 0.2 ? 1 : 0.35 + 0.3 * Math.sin(t * 0.25)} />
      </g>

      {/* ================= your phone, propped on the desk: the chats start here ================= */}
      <g transform={`translate(${PHONE.x} ${PHONE.y}) rotate(-5 ${PHONE.w / 2} ${PHONE.h})`}>
        <ellipse cx={PHONE.w / 2 + 30} cy={PHONE.h + 6} rx={170} ry={22} fill="#000" opacity={0.55} />
        <rect x={-16} y={-16} width={PHONE.w + 32} height={PHONE.h + 32} rx={52} fill={HOT} opacity={0.1 * lamp + 0.3 * Math.max(...appT.map((a) => flash(t, a, 7)))} />
        <rect x={0} y={0} width={PHONE.w} height={PHONE.h} rx={40} fill={`url(#${id}-alu)`} />
        <rect x={8} y={8} width={PHONE.w - 16} height={PHONE.h - 16} rx={32} fill="#07080A" />
        <rect x={8} y={8} width={PHONE.w - 16} height={PHONE.h - 16} rx={32} fill={`url(#${id}-screen)`} opacity={0.25 + 0.75 * lamp} />
        <rect x={PHONE.w / 2 - 34} y={18} width={68} height={16} rx={8} fill="#000" />
        <rect x={26} y={50} width={90} height={14} rx={7} fill="#FFFFFF" opacity={0.5 * lamp} />
        {APPS.map((A, i) => {
          const on = t >= appT[i], sent = flash(t, appT[i], 8);
          return (
            <g key={i} transform={`translate(0 ${104 + i * 88})`}>
              <rect x={20} y={-36} width={PHONE.w - 40} height={72} rx={22} fill="#FFFFFF" opacity={0.06 + 0.3 * sent} />
              <g transform={`translate(58 0) scale(${1 + 0.35 * sent})`}>
                <LogoDot icon={A.icon} cx={0} cy={0} r={26} bg={on ? '#' + A.icon.hex : '#3A2A2A'} />
              </g>
              <rect x={98} y={-16} width={96} height={12} rx={6} fill="#FFFFFF" opacity={on ? 0.8 : 0.25} />
              <rect x={98} y={6} width={64} height={10} rx={5} fill="#FFFFFF" opacity={on ? 0.45 : 0.15} />
            </g>
          );
        })}
        <polygon points={`8,60 ${PHONE.w * 0.5},8 ${PHONE.w * 0.72},8 8,${PHONE.h * 0.5}`} fill="#FFFFFF" opacity={0.05} />
      </g>

      {/* ================= terminal (commands) ================= */}
      {term > 0.01 ? (
        <g transform={`translate(1300 1990) scale(${0.55 + 0.45 * term}) translate(-1300 -1990)`} opacity={clamp01(term * 1.6)}>
          <rect x={TERM.x - 30} y={TERM.y - 30} width={TERM.w + 60} height={TERM.h + 60} rx={56} fill={locked > 0.3 ? OKG : '#FF3B1F'} opacity={0.14 + 0.14 * danger * (0.5 + 0.5 * Math.sin(t * 0.9)) + 0.2 * flash(t, tMach, 8)} />
          <rect x={TERM.x + 12} y={TERM.y + 30} width={TERM.w} height={TERM.h} rx={30} fill="#000" opacity={0.6} />
          <rect x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} rx={30} fill="#0A0B0E" />
          <g clipPath={`url(#${id}-term)`}>
            <rect x={TERM.x} y={TERM.y} width={TERM.w} height={76} fill="#1C1E24" />
            {[0, 1, 2].map((i) => <circle key={i} cx={TERM.x + 44 + i * 40} cy={TERM.y + 38} r={12} fill={['#FF5F57', '#FEBC2E', '#28C840'][i]} />)}
            <text x={TERM.x + 190} y={TERM.y + 54} fontFamily={MONO} fontWeight={600} fontSize={44} fill="#8E95A3">terminal</text>
            {(() => {
              const k = sp(t, tMach, 'bouncy');
              return (
                <g transform={`translate(${TERM.x + TERM.w - 30} ${TERM.y + 38}) scale(${1 + 0.12 * flash(t, tMach, 6)})`}>
                  <rect x={-462} y={-30} width={462} height={60} rx={30} fill={lerpCol(k)} />
                  <text x={-231} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={44} fill={k > 0.5 ? '#FFFFFF' : '#8E95A3'}>on your machine</text>
                </g>
              );
            })()}
            {[
              {s: '$ mkdir ~/reports', at: tCmd + 1, c: '#E6EAF0'},
              {s: '$ mv *.pdf ~/reports', at: tCmd + 6, c: '#E6EAF0'},
              {s: '$ rm -r ~/old-files', at: tCmd + 12, c: '#FF8A7A'},
            ].map((L, i) => (
              <g key={i}>
                <text x={TERM.x + 50} y={TERM.y + 162 + i * 84} fontFamily={MONO} fontWeight={600} fontSize={58} fill={L.c}>{typed(L.s, L.at)}</text>
                {t > L.at + L.s.length / 2.6 + 1 ? <path d={`M${TERM.x + TERM.w - 110},${TERM.y + 142 + i * 84} l16,16 l30,-34`} fill="none" stroke={i === 2 ? '#FF8A7A' : OKG} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /> : null}
              </g>
            ))}
            {/* hazard stripe */}
            {(() => {
              const k = sp(t, tCmd + 3, 'settle');
              const y0 = TERM.y + TERM.h - 150 + (1 - k) * 170;
              const lit = 1 - 0.75 * sp(t, tDown, 'settle');
              return (
                <g opacity={clamp01(k * 1.5)}>
                  <rect x={TERM.x} y={y0} width={TERM.w} height={150} fill={`url(#${id}-haz)`} opacity={0.35 + 0.65 * lit} transform={`translate(${(t * 3) % 110} 0)`} />
                  <rect x={TERM.x - 120} y={y0} width={TERM.w + 240} height={150} fill="#000" opacity={0.25} />
                  <rect x={TERM.x + 150} y={y0 + 22} width={TERM.w - 300} height={106} rx={22} fill="#111111" stroke={WARN} strokeOpacity={lit} strokeWidth={5} />
                  <g transform={`translate(${TERM.x + 216} ${y0 + 75})`}>
                    <path d="M0,-36 L40,32 L-40,32 Z" fill={WARN} opacity={lit} /><rect x={-5} y={-12} width={10} height={24} rx={3} fill="#111" /><circle cx={0} cy={22} r={5.5} fill="#111" />
                  </g>
                  <text x={TERM.x + TERM.w / 2 + 40} y={y0 + 97} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={64} fill={WARN} opacity={0.45 + 0.55 * lit}>
                    sandbox <tspan fill="#FFFFFF">OFF</tspan> by default
                  </text>
                </g>
              );
            })()}
          </g>
          <rect x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} rx={30} fill="none" stroke={locked > 0.3 ? OKG : danger > 0.3 ? '#FF6A3D' : '#3A3D45'} strokeWidth={5 + 3 * locked} />
        </g>
      ) : null}

      {/* ================= software plate / badge ================= */}
      {plateIn > 0.01 ? (
        <g transform={`translate(${PLATE.x + PLATE.w / 2} ${PLATE.y + PLATE.h / 2 + (1 - plateIn) * 260}) scale(${1 + 0.06 * flash(t, tNothing + 8, 5)} ${plateSy}) translate(${-PLATE.w / 2} ${-PLATE.h / 2})`} opacity={clamp01(plateIn * 1.5)}>
          {!badge ? (
            <Plate id={id} x={0} y={0} w={PLATE.w} h={PLATE.h} r={48} glow={flash(t, tSoft, 8)} accent={RED}>
              <g transform="translate(100 95)">
                <rect x={-50} y={-50} width={100} height={100} rx={22} fill={RED} /><path d="M-26,-8 L0,-24 L26,-8 L26,22 L0,38 L-26,22 Z M-26,-8 L0,8 L26,-8 M0,8 L0,38" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinejoin="round" />
              </g>
              <text x={176} y={122} fontFamily={FONT} fontWeight={800} fontSize={78} fill="#FFFFFF">The software</text>
              <g transform={`translate(${PLATE.w - 196} 95) scale(${costs}) rotate(${-8 + 8 * costs})`}>
                <rect x={-170} y={-60} width={340} height={120} rx={60} fill="#FFFFFF" /><circle cx={-128} cy={0} r={15} fill={DEEP} />
                <text x={22} y={27} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={76} fill={DEEP}>costs…</text>
              </g>
            </Plate>
          ) : (
            <Plate id={id} x={0} y={0} w={PLATE.w} h={PLATE.h} r={48} glow={0.5 + 0.5 * flash(t, tNothing + 4, 12)} accent={OKG}>
              <rect x={40} y={38} width={210} height={114} rx={57} fill="#FFFFFF" />
              <text x={145} y={122} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={78} fill={DEEP}>MIT</text>
              <rect x={270} y={38} width={282} height={114} rx={57} fill={OKG} />
              <text x={411} y={122} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={78} fill="#062412">FREE</text>
              <text x={584} y={121} fontFamily={FONT} fontWeight={700} fontSize={74} fill="#FFFFFF">no paid tier</text>
            </Plate>
          )}
        </g>
      ) : null}
      <Burst t={t} at={tNothing + 5} x={PLATE.x + PLATE.w / 2} y={PLATE.y + PLATE.h / 2} color={OKG} n={22} r={520} />

      {/* ================= the lobster (real mascot, unaltered) ================= */}
      {lobVisible ? (
        <g>
          <ellipse cx={lx} cy={t < tLob + 4 ? 2656 : 1650} rx={170 * (t >= tLob && t < tLand ? 0.5 : 1)} ry={20} fill="#000" opacity={t >= tLob && t < tLand ? 0.2 : 0.5} />
          <g transform={`translate(${lx} ${ly}) rotate(${lrot}) scale(${lsx} ${lsy})`}>
            <SvgImg src={ASSETS.clawMascot} x={-LOB / 2} y={-LOB * 0.915} w={LOB} h={LOB} />
          </g>
        </g>
      ) : null}
      <Burst t={t} at={tLand} x={1300} y={1650} color={HOT} n={14} r={260} />
      {/* name tag */}
      {(() => {
        const k = sp(t, tClaw + 4, 'bouncy');
        if (k <= 0.01) return null;
        const onLid = inOut(seg(t, tLob, tLand));
        const tx = lerp(1500, 1590, onLid), ty = lerp(2150, 1372, onLid);
        return (
          <g transform={`translate(${tx} ${ty + Math.sin(t * 0.07) * 6}) scale(${0.5 + 0.5 * k})`} opacity={clamp01(k * 1.5)}>
            <Plate id={id} x={0} y={0} w={530} h={196} r={44} glow={flash(t, tClaw + 4, 9) + flash(t, tLob, 9) * 0.6} accent={RED}>
              <rect x={0} y={40} width={12} height={116} rx={6} fill={RED} />
              <text x={44} y={98} fontFamily={FONT} fontWeight={800} fontSize={86} fill="#FFFFFF">OpenClaw</text>
              <text x={46} y={160} fontFamily={MONO} fontWeight={600} fontSize={40} fill={HOT} letterSpacing={1}>OpenClaw Foundation</text>
            </Plate>
          </g>
        );
      })()}

      {/* ================= GitHub proof ================= */}
      <GitProof id={id} src={ASSETS.ghOpenclaw} url="github.com/openclaw/openclaw" x={PAN.x} y={PAN.y} w={PAN.w} t={t} tIn={tPanel} tMark={tGit} tLens={tStars - 2}
        lens={LENS} accent={RED} rim={HOT} out={proofOut} pulse={flash(t, tStars, 8)} />
      {proofIn > 0.01 ? (
        <g opacity={clamp01(sp(t, tThree - 2, 'pop') * 1.5) * (1 - proofOut)} transform={`translate(0 ${-proofOut * 500})`}>
          <g transform={`translate(${drumX} ${DR.y - 70})`}>
            <LogoDot icon={siGithub} cx={32} cy={24} r={30} bg="#FFFFFF" fg="#0D1117" />
            <text x={80} y={44} fontFamily={FONT} fontWeight={700} fontSize={56} fill="#FFFFFF">GitHub stars</text>
            <path d={starPath(26)} transform={`translate(${470} 22) rotate(${t * 3})`} fill={GOLD} />
          </g>
          <Drum id={id} x={drumX} y={DR.y} size={DR.size} t={t} at={tThree} dur={tStars - tThree + 2} to={395174} accent={GOLD} done={flash(t, tStars + 2, 10)} />
          {/* gold stars fly from the counter into the Star box, one volley per spoken number word */}
          {[tThree, tHun, tNin, tThou, tGit, tStars].map((w, wi) => Array.from({length: 3}).map((_, i) => {
            const q = seg(t, w + i * 1.6, w + i * 1.6 + 12);
            if (q <= 0 || q >= 1) return null;
            const e = inOut(q);
            const x0 = drumX + dW * (0.2 + 0.3 * i + 0.1 * rnd(wi * 3 + i)), y0 = DR.y + 30;
            const x = lerp(x0, starX, e) + Math.sin(q * Math.PI) * (140 - i * 90), y = lerp(y0, starY, e) - Math.sin(q * Math.PI) * 120;
            return <path key={`${wi}-${i}`} d={starPath(20 + 16 * Math.sin(q * Math.PI))} transform={`translate(${x} ${y}) rotate(${q * 300 + i * 40})`} fill={GOLD} stroke="#FFFFFF" strokeWidth={3} opacity={Math.min(1, (1 - q) * 4)} />;
          }))}
        </g>
      ) : null}
      <Burst t={t} at={tStars} x={starX} y={starY} color={GOLD} n={18} r={240} />
      <Burst t={t} at={tStars + 2} x={drumX + dW / 2} y={DR.y + 120} color={GOLD} n={16} r={420} />

      {/* ================= chat-app bubbles flying into the laptop ================= */}
      {APPS.map((A, i) => {
        const q = seg(t, appT[i], appT[i] + 13);
        if (q <= 0 || q >= 1) return null;
        const e = inOut(q), T = TILES[i];
        const x = lerp(A.from[0], T.x + 76, e), y = lerp(A.from[1], T.y + T.h / 2, e) - Math.sin(q * Math.PI) * (120 + i * 40);
        const s = lerp(0.6, 1, e) + Math.sin(q * Math.PI) * 1.1;
        const dir = i % 2 ? -1 : 1;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(1 - e) * dir * -14}) scale(${s})`}>
            {[1, 2, 3].map((k) => <circle key={k} cx={-dir * k * 46} cy={k * 10} r={30 - k * 7} fill={'#' + A.icon.hex} opacity={0.5 - k * 0.13} />)}
            <path d={`M-78,-66 H78 Q98,-66 98,-46 V46 Q98,66 78,66 H${dir > 0 ? -30 : 52} L${dir > 0 ? -70 : 70},100 L${dir > 0 ? -52 : 30},66 H-78 Q-98,66 -98,46 V-46 Q-98,-66 -78,-66 Z`} fill="#FFFFFF" opacity={0.96} />
            <LogoDot icon={A.icon} cx={0} cy={0} r={52} />
          </g>
        );
      })}
      {APPS.map((A, i) => <Burst key={i} t={t} at={appT[i] + 12} x={TILES[i].x + 76} y={TILES[i].y + 74} color={'#' + A.icon.hex} n={10} r={130} />)}

      {/* ================= padlock ================= */}
      {(() => {
        const k = sp(t, tLock, 'bouncy');
        if (k <= 0.01) return null;
        const open = 1 - clamp01((t - tDown) / 2.2);
        const cx = 1300, top = 2420;
        const slam = flash(t, tDown + 2, 4);
        return (
          <g transform={`translate(${cx} ${top + 120 - (1 - k) * 340 + slam * 8}) scale(${(0.4 + 0.6 * k) * (1 + 0.1 * slam)}) translate(${-cx} ${-(top + 120)})`} opacity={clamp01(k * 1.6)}>
            <ellipse cx={cx} cy={top + 120} rx={380} ry={300} fill={open > 0.5 ? WARN : OKG} opacity={0.14 + 0.2 * slam} />
            {/* shackle */}
            <g transform={`translate(0 ${-open * 54}) rotate(${open * -16} ${cx + 92} ${top})`}>
              <path d={`M${cx - 92},${top + 40} V${top - 64} A92,92 0 0 1 ${cx + 92},${top - 64} V${top + 40}`} fill="none" stroke="#2A2D33" strokeWidth={56} strokeLinecap="round" />
              <path d={`M${cx - 92},${top + 40} V${top - 64} A92,92 0 0 1 ${cx + 92},${top - 64} V${top + 40}`} fill="none" stroke={`url(#${id}-steel)`} strokeWidth={44} strokeLinecap="round" />
            </g>
            {/* body */}
            <rect x={cx - 170 + 8} y={top + 18} width={340} height={240} rx={46} fill="#000" opacity={0.5} />
            <rect x={cx - 170} y={top} width={340} height={240} rx={46} fill={`url(#${id}-brass)`} />
            <rect x={cx - 170} y={top} width={340} height={240} rx={46} fill="none" stroke="#FFF6D6" strokeOpacity={0.7} strokeWidth={5} />
            <rect x={cx - 150} y={top + 16} width={300} height={70} rx={34} fill="#FFFFFF" opacity={0.22} />
            <circle cx={cx} cy={top + 104} r={34} fill="#3A2408" /><rect x={cx - 13} y={top + 110} width={26} height={76} rx={10} fill="#3A2408" />
            {open < 0.5 ? <circle cx={cx + 120} cy={top + 200} r={16} fill={OKG} stroke="#FFFFFF" strokeWidth={4} /> : null}
          </g>
        );
      })()}
      {t >= tDown + 2 && t < tDown + 20 ? (() => {
        const q = (t - tDown - 2) / 18;
        return <circle cx={1300} cy={2540} r={200 + 620 * outC(q)} fill="none" stroke={OKG} strokeWidth={16 * (1 - q)} opacity={0.9 * (1 - q)} />;
      })() : null}
      <Burst t={t} at={tDown + 2} x={1300} y={2540} color={GOLD} n={20} r={420} />
      {(() => {
        const k = sp(t, tDown + 3, 'bouncy');
        return k > 0.01 ? (
          <g transform={`translate(1300 2668) scale(${(0.5 + 0.5 * k) * 0.86}) rotate(${-4 + 4 * k})`} opacity={clamp01(k * 1.5)}>
            <rect x={-290 + 8} y={-70 + 16} width={580} height={140} rx={70} fill="#000" opacity={0.5} />
            <rect x={-290} y={-70} width={580} height={140} rx={70} fill={OKG} /><rect x={-290} y={-70} width={580} height={140} rx={70} fill="none" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={5} />
            <text x={0} y={28} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={76} fill="#062412">Lock it down</text>
          </g>
        ) : null;
      })()}

      {/* ================= the act turns: light sweep on "free" ================= */}
      {t >= tFree && t < tFree + 18 ? (
        <rect x={-900 + ((t - tFree) / 18) * 4400} y={-1700} width={900} height={5900} fill={`url(#${id}-sweep)`} opacity={Math.sin(((t - tFree) / 18) * Math.PI)} transform="skewX(-14)" style={{mixBlendMode: 'screen'}} />
      ) : null}
      {/* word pulse: thin red rim on the laptop */}
      <rect x={LID.x - 6} y={LID.y - 6} width={LID.w + 12} height={LID.h + 12} rx={38} fill="none" stroke={HOT} strokeWidth={5} opacity={0.4 * pulse * act} />
    </svg>
  );
};

const lerpCol = (k: number) => (k > 0.5 ? '#D9341F' : '#2A2D35');

export const clawWorld: WorldDef = {
  id: 's07-lobster-lab', home: 'desk',
  anchors: {
    desk: {x: 1300, y: 1800, zoom: 0.74},
    stars: {x: 1300, y: 905, zoom: 0.66},
    computer: {x: 1300, y: 1870, zoom: 0.78},
    commands: {x: 1300, y: 1890, zoom: 0.8},
  },
  aliases: {three: 'stars', github: 'stars', runs: 'computer', own: 'computer', run: 'commands'},
  palette: {bg0: '#0A0203', bg1: '#3A0A0C', particles: '#FF9A8A', glow: '#FF4B3E'},
  Draw,
};
