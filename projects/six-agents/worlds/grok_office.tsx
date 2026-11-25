// S05 "Bot office" - Grok Bot by xAI. Dark graphite office lit by the nine official bot colours.
// One place, three acts (the camera barely moves, the WORLD changes on the words):
//  1 the nine bots bounce into a row -> gather as a team -> each hops onto its own computer -> logins fill -> work apps
//  2 the bots line up as a team strip; a 'Slack' thread and a 'Zoom' call open, a bot joins each
//  3 price card (X Premium $30 / Super $100 / Ultra $200) and the weekly usage pool that overflows into a top-up
import React from 'react';
import {siX} from 'simple-icons';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {Burst, Ripple} from '../../../src/kit/explainer/world';
import {ASSETS, FONT, MONO, SvgImg, bob} from './shared';
import {IC, Ico, Logo, Person, Pop, Txt, clamp01, lerp, outC, pop, pulse, ramp, rnd, wt} from './grok_duet_kit';

const ID = 's05';
const CX = 1300, L = 710, R = 1890;
const BOTC = ['#9A6A3E', '#EF4146', '#EE722E', '#F1A038', '#5DC77B', '#55B8A8', '#3F86F6', '#8E5CF5', '#EC4699'];
const ACC = '#A78BFA', INK = '#0C0D12', ICE = '#EDEBFF', MUTE = '#9A9DB0', AMB = '#FFB238', OK = '#4ADE80';
const ROWTOP = [878, 1235, 1592];
const CHAT_BOT = 6, CALL_BOT = 7;

type Times = Record<string, number>;
const times = (b: WorldDrawProps['beats']): Times => ({
  xai: wt(b, "xai's", 8), grok: wt(b, 'grok', 22), bot: wt(b, 'bot', 30.5), team: wt(b, 'team', 43.5), player: wt(b, 'player', 49.5),
  every: wt(b, 'every', 78), bot2: wt(b, 'bot', 86, 1), gets: wt(b, 'gets', 92.5), own: wt(b, 'own', 102), comp: wt(b, 'computer', 106),
  signs: wt(b, 'signs', 126.5), work: wt(b, 'work', 146), apps: wt(b, 'apps', 152.5), joins: wt(b, 'joins', 169.5), slack: wt(b, 'slack', 181),
  even: wt(b, 'even', 198), zoom: wt(b, 'zoom', 208.5), calls: wt(b, 'calls', 214.5), comes: wt(b, 'comes', 248), x: wt(b, 'x', 261),
  prem: wt(b, 'premium', 267.5), thirty: wt(b, 'thirty', 284.5), dollars: wt(b, 'dollars', 291.5), up: 305.5,
  heavy: wt(b, 'heavy', 322.5), use: wt(b, 'use', 329.5), costs: wt(b, 'costs', 335.5), extra: wt(b, 'extra', 344.5),
});

// ---- where each bot is ------------------------------------------------------------------------------------------
const seat = (i: number) => ({x: CX + ((i % 3) - 1) * 395, top: ROWTOP[Math.floor(i / 3)]});
const stripX = (i: number) => CX + (i - 4) * 128;
const CHAT_SLOT = {x: L + 82, y: 1245, s: 96};
const CALL_SLOT = {x: L + 150, y: 1838, s: 150};

const botPose = (i: number, t: number, T: Times) => {
  // 1 drop into the row (already falling on frame 0)
  const d = -6 + i * 2.5;
  const fall = clamp01((t - d) / 13);
  const rowY = 1290 + (i % 2 ? 34 : -34);
  const landed = t - d - 13;
  let y = rowY - 1000 * (1 - fall) * (1 - fall);
  let squash = 0;
  if (landed > 0) {
    y = rowY - 70 * Math.abs(Math.sin(landed * 0.33)) * Math.exp(-landed / 7);
    squash = 0.16 * Math.exp(-landed / 3);
  }
  let x = CX + (i - 4) * 134, s = 172;
  // 2 gather as a team (two rows, bigger)
  const kT = pop(t, T.team - 2 + i * 0.4, 'settle');
  const back = i % 2 === 0, j = Math.floor(i / 2);
  const tx = back ? CX + (j - 2) * 232 : CX + (j - 1.5) * 250, ty = back ? 1150 : 1400, ts = back ? 232 : 256;
  x = lerp(x, tx, kT); y = lerp(y, ty, kT); s = lerp(s, ts, kT);
  y -= 26 * pulse(t, T.player + i * 0.5, 5) * kT;
  // 3 spread out: each floats above its own spot
  const kG = pop(t, T.every - 1 + i * 0.8, 'settle');
  const st = seat(i), seatY = st.top + 72;
  x = lerp(x, st.x, kG); y = lerp(y, seatY - 40, kG); s = lerp(s, 160, kG);
  // 4 hop onto the computer
  const th = T.comp - 3 + i * 1.2;
  const h = clamp01((t - th) / 10);
  if (h > 0) {
    y = lerp(seatY - 40, seatY, h) - 62 * Math.sin(Math.PI * h);
    if (h >= 1) squash = Math.max(squash, 0.2 * Math.exp(-(t - th - 10) / 3));
  }
  y -= 16 * (pulse(t, T.signs + i * 0.7, 4) + pulse(t, T.apps + i * 0.5, 4));
  // 5 line up as the team strip under the header
  const kS = pop(t, T.joins - 7 + i * 0.6, 'settle');
  x = lerp(x, stripX(i), kS); y = lerp(y, 890, kS); s = lerp(s, 112, kS);
  // strip life: hop on price words, work faster on "heavy use"
  const hop = pulse(t, T.thirty + i * 0.5, 4) + pulse(t, T.up + i * 0.5, 4) + pulse(t, T.extra + i * 0.4, 5) + pulse(t, T.prem + i * 0.5, 4);
  const busy = ramp(t, T.heavy, T.heavy + 4) * (1 - ramp(t, T.extra + 4, T.extra + 12));
  y -= kS * (15 * hop + 20 * busy * Math.abs(Math.sin((t - T.heavy) * 0.62 + i * 1.7)));
  // 6 one bot joins the chat, one joins the call (then both go back to the strip)
  const leave = pop(t, T.comes - 6, 'settle');
  if (i === CHAT_BOT) {
    const k = pop(t, T.slack - 1, 'settle') * (1 - leave);
    x = lerp(x, CHAT_SLOT.x, k); y = lerp(y, CHAT_SLOT.y, k) - 70 * Math.sin(Math.PI * clamp01(k)) * (1 - leave); s = lerp(s, CHAT_SLOT.s, k);
  }
  if (i === CALL_BOT) {
    const k = pop(t, T.zoom - 1, 'settle') * (1 - leave);
    x = lerp(x, CALL_SLOT.x, k); y = lerp(y, CALL_SLOT.y, k) - 60 * Math.sin(Math.PI * clamp01(k)) * (1 - leave); s = lerp(s, CALL_SLOT.s, k);
  }
  const b = bob(t, i, 0.55);
  const op = clamp01((t - d) / 2 + 1);
  return {x, y: y + b.dy * 0.5, s, rot: b.rot, sx: b.sx * (1 + squash), sy: b.sy * (1 - squash), op, kS, kG, kT, landed};
};

// ---- a little computer ---------------------------------------------------------------------------------------------
const APPC = ['#5B8DEF', '#F2B84B', '#58C99A', '#EE6F6F', '#9D8CF2', '#5CC8D8'];
const Computer: React.FC<{i: number; t: number; T: Times}> = ({i, t, T}) => {
  const st = seat(i), c = BOTC[i];
  const rise = pop(t, T.bot2 - 2 + i * 1.6, 'settle');
  const gone = pop(t, T.joins - 8 + (8 - i) * 0.4, 'settle');
  if (rise <= 0.001 || gone > 0.995) return null;
  const on = ramp(t, T.comp + 6 + i * 1.2, T.comp + 12 + i * 1.2);
  const kLogin = pop(t, T.signs - 1 + i * 0.7);
  const nDots = Math.max(0, Math.min(6, Math.floor((t - (T.signs + 4 + i * 0.7)) / 1.7)));
  const typed = ramp(t, T.signs + i * 0.7, T.signs + 5 + i * 0.7);
  const kOk = pop(t, T.work - 1 + i * 0.6, 'bouncy');
  const kApps = pop(t, T.apps - 1 + i * 0.5);
  const own = pulse(t, T.own + i * 0.3, 6);
  const top = st.top + 135 + (1 - rise) * 160 + gone * 140;
  return (
    <g transform={`translate(${st.x} ${top})`} opacity={clamp01(rise * 1.5) * (1 - gone)}>
      {/* light pool + shelf */}
      <ellipse cx={0} cy={226} rx={210} ry={34} fill={`url(#${ID}-pool${i})`} opacity={0.35 + 0.65 * on} />
      <rect x={-182} y={217} width={364} height={13} rx={6.5} fill="#2B2E3A" />
      <rect x={-182} y={217} width={364} height={3.5} rx={1.7} fill="#FFFFFF" opacity={0.22} />
      <rect x={-182} y={227} width={364} height={3} rx={1.5} fill={c} opacity={0.5 * on} />
      {/* stand */}
      <rect x={-17} y={182} width={34} height={30} fill="#3A3D4A" />
      <rect x={-66} y={206} width={132} height={12} rx={6} fill="#4A4E5C" />
      {/* body */}
      <rect x={-150} y={0} width={300} height={186} rx={20} fill={`url(#${ID}-mon)`} />
      <rect x={-149} y={1} width={298} height={184} rx={19} fill="none" stroke={c} strokeOpacity={0.3 + 0.6 * on + 0.4 * own} strokeWidth={3 + 3 * own} />
      {/* screen */}
      <rect x={-138} y={12} width={276} height={162} rx={11} fill="#07080C" />
      <rect x={-138} y={12} width={276} height={162} rx={11} fill={c} opacity={0.1 + 0.22 * on} />
      <rect x={-138} y={12} width={276} height={70} rx={11} fill="#FFFFFF" opacity={0.07 * on} />
      {on > 0.01 && kLogin < 0.99 ? (
        <g opacity={on * (1 - kLogin)}>
          <rect x={-118} y={34} width={132} height={86} rx={8} fill="#FFFFFF" opacity={0.2} />
          <rect x={-106} y={48} width={84} height={9} rx={4.5} fill="#FFFFFF" opacity={0.7} />
          <rect x={-106} y={68} width={104} height={8} rx={4} fill="#FFFFFF" opacity={0.4} />
          <rect x={-106} y={86} width={66} height={8} rx={4} fill="#FFFFFF" opacity={0.4} />
          <rect x={28} y={34} width={92} height={52} rx={8} fill="#FFFFFF" opacity={0.14} />
          <rect x={-118} y={136} width={236} height={22} rx={11} fill="#FFFFFF" opacity={0.16} />
          {[0, 1, 2, 3].map((q) => <circle key={q} cx={-100 + q * 26} cy={147} r={6.5} fill={q === 0 ? '#FFFFFF' : c} opacity={0.9} />)}
        </g>
      ) : null}
      {/* login card: user line types, password dots fill, then a tick */}
      {kLogin > 0.01 && kApps < 0.99 ? (
        <g opacity={clamp01(kLogin * 1.5) * (1 - kApps)} transform={`translate(0 ${(1 - kLogin) * 18})`}>
          <rect x={-112} y={26} width={224} height={134} rx={14} fill="#10121A" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={2} />
          <rect x={-94} y={40} width={188} height={30} rx={15} fill="#FFFFFF" opacity={0.1} />
          <circle cx={-78} cy={55} r={8} fill={c} />
          <rect x={-62} y={50} width={130 * typed} height={10} rx={5} fill="#FFFFFF" opacity={0.85} />
          <rect x={-94} y={78} width={188} height={30} rx={15} fill="#FFFFFF" opacity={0.1} stroke={c} strokeOpacity={nDots > 0 && nDots < 6 ? 0.9 : 0} strokeWidth={2.5} />
          {[0, 1, 2, 3, 4, 5].map((q) => <circle key={q} cx={-70 + q * 28} cy={93} r={q < nDots ? 7 : 4} fill={q < nDots ? '#FFFFFF' : '#FFFFFF'} opacity={q < nDots ? 1 : 0.18} />)}
          <rect x={-94} y={118} width={188} height={32} rx={16} fill={kOk > 0.3 ? OK : c} opacity={0.55 + 0.45 * clamp01(nDots / 6)} />
          {kOk > 0.01 ? <Ico d={IC.check} x={0} y={134} s={30 * (0.5 + 0.5 * kOk)} color={INK} sw={3.6} /> : <rect x={-34} y={130} width={68} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />}
        </g>
      ) : null}
      {/* work apps */}
      {kApps > 0.01 ? (
        <g>
          {APPC.map((ac, q) => {
            const k = pop(t, T.apps - 1 + i * 0.5 + q * 1.1, 'bouncy');
            if (k <= 0.001) return null;
            const ax = -88 + (q % 3) * 88, ay = 55 + Math.floor(q / 3) * 74;
            return (
              <g key={q} transform={`translate(${ax} ${ay}) scale(${0.4 + 0.6 * k})`} opacity={clamp01(k * 1.6)}>
                <rect x={-36} y={-30} width={72} height={60} rx={14} fill={ac} />
                <rect x={-36} y={-30} width={72} height={26} rx={14} fill="#FFFFFF" opacity={0.22} />
                {q % 3 === 0 ? <rect x={-18} y={-10} width={36} height={24} rx={4} fill="none" stroke="#FFFFFF" strokeWidth={4} /> : q % 3 === 1
                  ? <circle cx={0} cy={2} r={13} fill="none" stroke="#FFFFFF" strokeWidth={4} />
                  : <path d="M-18 12 L-6 -2 L4 6 L18 -12" fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />}
              </g>
            );
          })}
        </g>
      ) : null}
      {/* signed-in tick badge on the corner */}
      {kOk > 0.01 ? (
        <g transform={`translate(128 12) scale(${0.4 + 0.6 * kOk})`} opacity={clamp01(kOk * 1.5)}>
          <circle r={24} fill={OK} stroke={INK} strokeWidth={4} />
          <Ico d={IC.check} x={0} y={0} s={28} color={INK} sw={3.6} />
        </g>
      ) : null}
    </g>
  );
};

// ---- glass panel ---------------------------------------------------------------------------------------------------
const Glass: React.FC<{x: number; y: number; w: number; h: number; accent?: string; lit?: number}> = ({x, y, w, h, accent = ACC, lit = 0}) => (
  <g>
    <rect x={x + 8} y={y + 18} width={w} height={h} rx={40} fill="#000" opacity={0.5} />
    <rect x={x} y={y} width={w} height={h} rx={40} fill={`url(#${ID}-glass)`} />
    <rect x={x + 3} y={y + 3} width={w - 6} height={Math.min(120, h * 0.4)} rx={37} fill={`url(#${ID}-gloss)`} />
    <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx={39} fill="none" stroke={accent} strokeOpacity={0.35 + 0.6 * lit} strokeWidth={3 + 2 * lit} />
  </g>
);
const BotTag: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x} y={y - 31} width={86} height={40} rx={10} fill={ACC} />
    <Txt x={x + 43} y={y} s={30} w={800} fill={INK} anchor="middle" ls={1} font={MONO}>BOT</Txt>
  </g>
);

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const T = times(beats);
  const poses = BOTC.map((_, i) => botPose(i, t, T));
  const act2 = pop(t, T.joins - 4, 'settle'), act2out = pop(t, T.comes - 6, 'settle');
  const act3 = pop(t, T.comes - 3, 'settle');
  const kXai = pop(t, T.xai - 1), kLogo = pop(t, T.grok - 1, 'bouncy'), kTitle = pop(t, T.bot - 1);
  const kTeamChip = pop(t, T.player - 1, 'bouncy') * (1 - pop(t, T.every - 3));
  const shelf = ramp(t, 0, 6) * (1 - pop(t, T.team - 3));
  const ringK = pop(t, T.team - 2, 'settle') * (1 - pop(t, T.every - 2));
  // chat
  const chatY = 960 + (1 - act2) * 240 + act2out * 260, chatOp = clamp01(act2 * 1.5) * (1 - act2out);
  const kRow2 = pop(t, T.slack - 1), kFile = pop(t, T.slack + 10, 'bouncy'), kRow3 = pop(t, T.slack + 14);
  // call
  const kCall = pop(t, T.even - 2, 'settle');
  const callY = 1470 + (1 - kCall) * 260 + act2out * 300, callOp = clamp01(kCall * 1.5) * (1 - act2out);
  const kJoin = pop(t, T.zoom - 1, 'settle') , kCtl = pop(t, T.calls - 1, 'bouncy');
  // price + meter
  const priceY = 960 + (1 - act3) * 260;
  const kM = pop(t, T.comes + 3, 'settle');
  const meterY = 1460 + (1 - kM) * 300;
  const LIM = 0.76;
  const fill = 0.1 * kM + 0.34 * pop(t, T.heavy - 1, 'settle') + 0.32 * pop(t, T.use - 1, 'settle') + 0.24 * pop(t, T.costs - 1, 'settle');
  const kTop = pop(t, T.extra - 1, 'bouncy');
  const TW = 1100, TX = L + 40;
  const tiers = [{n: 'Premium', p: 30, at: T.thirty - 1}, {n: 'Super', p: 100, at: T.up - 1}, {n: 'Ultra', p: 200, at: T.up + 5}];

  return (
    <svg width={2600} height={2400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${ID}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0C0D13" /><stop offset="0.5" stopColor="#1B1D29" /><stop offset="1" stopColor="#0B0C11" /></linearGradient>
        <linearGradient id={`${ID}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#20222C" /><stop offset="1" stopColor="#050608" /></linearGradient>
        <linearGradient id={`${ID}-glass`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#262936" /><stop offset="0.5" stopColor="#171922" /><stop offset="1" stopColor="#0D0E14" /></linearGradient>
        <linearGradient id={`${ID}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.13} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${ID}-mon`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A4E5E" /><stop offset="1" stopColor="#23252F" /></linearGradient>
        <linearGradient id={`${ID}-fill`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3F86F6" /><stop offset="0.5" stopColor="#8E5CF5" /><stop offset="1" stopColor="#EC4699" /></linearGradient>
        <pattern id={`${ID}-hot`} width="36" height="36" patternUnits="userSpaceOnUse" patternTransform={`translate(${-t * 2.4} 0) rotate(30)`}>
          <rect width="36" height="36" fill={AMB} /><rect width="16" height="36" fill="#FF7A2E" />
        </pattern>
        {BOTC.map((c, i) => (
          <React.Fragment key={i}>
            <radialGradient id={`${ID}-pool${i}`}><stop offset="0" stopColor={c} stopOpacity={0.75} /><stop offset="1" stopColor={c} stopOpacity={0} /></radialGradient>
            <linearGradient id={`${ID}-cone${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} stopOpacity={0.75} /><stop offset="0.6" stopColor={c} stopOpacity={0.22} /><stop offset="1" stopColor={c} stopOpacity={0.04} /></linearGradient>
          </React.Fragment>
        ))}
      </defs>

      {/* ---- the room: graphite wall, ceiling light rail, coloured light cones, glossy floor ---- */}
      <rect x={-600} y={-500} width={3800} height={3600} fill={`url(#${ID}-wall)`} />
      {Array.from({length: 9}).map((_, i) => <rect key={i} x={230 + i * 268} y={-500} width={3} height={2560} fill="#FFFFFF" opacity={0.035} />)}
      {[1010, 1500].map((y, i) => <rect key={i} x={-600} y={y} width={3800} height={2} fill="#FFFFFF" opacity={0.03} />)}
      <g style={{mixBlendMode: 'screen'}}>
        {BOTC.map((_, i) => {
          const x = CX + (i - 4) * 140;
          const live = clamp01(poses[i].landed / 6 + 0.25);
          const a = (0.8 + 0.2 * Math.sin(t * 0.05 + i * 1.9)) * live * (1 - 0.4 * act2);
          return <polygon key={i} points={`${x - 20},600 ${x + 20},600 ${x + 170},2060 ${x - 170},2060`} fill={`url(#${ID}-cone${i})`} opacity={a} />;
        })}
      </g>
      {BOTC.map((_, i) => <ellipse key={i} cx={700 + ((i * 5) % 9) * 150} cy={900 + ((i * 7) % 5) * 240} rx={520} ry={420} fill={`url(#${ID}-pool${i})`} opacity={0.11 + 0.04 * Math.sin(t * 0.03 + i * 2)} />)}
      {Array.from({length: 34}).map((_, i) => {
        const x = 650 + rnd(i * 1.7) * 1300, y = 660 + rnd(i * 3.1) * 1320, tw = 0.5 + 0.5 * Math.sin(t * 0.09 + i * 2.3);
        return <circle key={i} cx={x} cy={y} r={5 + rnd(i * 5.5) * 9} fill={BOTC[i % 9]} opacity={0.1 + 0.16 * tw} />;
      })}
      {BOTC.map((c, i) => {
        const x = CX + (i - 4) * 140, live = clamp01(poses[i].landed / 6 + 0.25);
        return (
          <g key={i}>
            <rect x={x - 2} y={540} width={4} height={48} fill="#3A3D4A" />
            <path d={`M${x - 30} 618 L${x - 16} 586 H${x + 16} L${x + 30} 618 Z`} fill="#30333F" />
            <ellipse cx={x} cy={619} rx={30} ry={7} fill={c} opacity={live} />
            <circle cx={x} cy={624} r={46} fill={`url(#${ID}-pool${i})`} opacity={0.9 * live} />
          </g>
        );
      })}
      <rect x={-600} y={532} width={3800} height={10} fill="#2A2D3A" />
      <rect x={-600} y={2010} width={3800} height={1100} fill={`url(#${ID}-floor)`} />
      <rect x={-600} y={2010} width={3800} height={3} fill="#FFFFFF" opacity={0.2} />
      {BOTC.map((_, i) => <ellipse key={i} cx={CX + (i - 4) * 150} cy={2070} rx={130} ry={46} fill={`url(#${ID}-pool${i})`} opacity={0.75 + 0.2 * Math.sin(t * 0.06 + i)} />)}
      {BOTC.map((c, i) => <rect key={i} x={CX + (i - 4) * 150 - 46} y={2016} width={92} height={420} fill={`url(#${ID}-cone${i})`} opacity={0.3} />)}
      {Array.from({length: 7}).map((_, i) => <line key={i} x1={CX + (i - 3) * 120} y1={2012} x2={CX + (i - 3) * 520} y2={2800} stroke="#FFFFFF" strokeWidth={2} opacity={0.05} />)}

      {/* ---- header: Grok Bot mark + name + xAI ---- */}
      <g>
        <g transform={`translate(${CX - 365} 735) scale(${0.85 + 0.15 * kLogo}) rotate(${(1 - kLogo) * -14})`} opacity={0.5 + 0.5 * clamp01(kLogo * 1.5)}>
          <rect x={-62} y={-62} width={124} height={124} rx={32} fill="#F4F4F6" />
          <rect x={-62} y={-62} width={124} height={124} rx={32} fill="none" stroke={ACC} strokeWidth={4} opacity={0.5 + 0.5 * pulse(t, T.grok, 8)} />
          <SvgImg src={ASSETS.grokLogo} x={-52} y={-52 + bob(t, 3, 0.4).dy * 0.3} w={104} h={104} />
        </g>
        <Txt x={CX - 278} y={768} s={92} w={800} fill="#FFFFFF" opacity={0.5 + 0.5 * clamp01(kTitle * 1.5)} ls={-1.5}>Grok Bot</Txt>
        <g opacity={0.5 + 0.5 * clamp01(kXai * 1.5)} transform={`translate(${CX + 270} 735) scale(${0.9 + 0.1 * kXai + 0.06 * pulse(t, T.xai, 5)}) translate(${-(CX + 270)} -735)`}>
          <Txt x={CX + 172} y={762} s={40} w={500} fill={MUTE}>by</Txt>
          <SvgImg src={ASSETS.xaiLogo} x={CX + 228} y={700} w={168} h={64} filter="invert(1)" />
        </g>
      </g>

      {/* ---- act 1: row shelf, team ring, computers ---- */}
      {shelf > 0.01 ? (
        <g opacity={shelf}>
          {[770, 1830].map((x, i) => <rect key={i} x={x - 14} y={1500} width={28} height={512} fill="#23252F" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={2} />)}
          <rect x={700} y={1410} width={1200} height={128} rx={16} fill={`url(#${ID}-glass)`} stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={2} />
          {BOTC.map((c, i) => <rect key={i} x={CX + (i - 4) * 128 - 54} y={1508} width={108} height={10} rx={5} fill={c} opacity={0.35 + 0.65 * clamp01(poses[i].landed / 4)} />)}
          <rect x={680} y={1392} width={1240} height={22} rx={11} fill="#3A3E4D" />
          <rect x={680} y={1392} width={1240} height={5} rx={2.5} fill="#FFFFFF" opacity={0.35} />
          {BOTC.map((_, i) => <ellipse key={i} cx={CX + (i - 4) * 134} cy={1412} rx={84} ry={22} fill={`url(#${ID}-pool${i})`} opacity={clamp01(poses[i].landed / 4)} />)}
        </g>
      ) : null}
      {ringK > 0.01 ? (
        <g opacity={ringK}>
          <ellipse cx={CX} cy={1590} rx={560 * ringK} ry={84 * ringK} fill={ACC} opacity={0.1} />
          <ellipse cx={CX} cy={1590} rx={560 * ringK} ry={84 * ringK} fill="none" stroke={ACC} strokeWidth={5} opacity={0.75} />
          <ellipse cx={CX} cy={1590} rx={430 * ringK} ry={62 * ringK} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="14 22" strokeDashoffset={-t * 2} opacity={0.5} />
          {BOTC.map((_, i) => <ellipse key={i} cx={CX + (i - 4) * 112} cy={1590} rx={70} ry={20} fill={`url(#${ID}-pool${i})`} opacity={0.8} />)}
        </g>
      ) : null}
      <Ripple t={t} at={T.team} x={CX} y={1590} color={ACC} r={700} />
      {kTeamChip > 0.01 ? (
        <Pop k={kTeamChip} x={CX} y={1775}>
          <rect x={CX - 330} y={1712} width={660} height={126} rx={63} fill={ACC} />
          <rect x={CX - 326} y={1716} width={652} height={54} rx={50} fill="#FFFFFF" opacity={0.25} />
          <Ico d={IC.people} x={CX - 258} y={1775} s={66} color={INK} sw={2.4} />
          <Txt x={CX + 40} y={1796} s={60} w={800} fill={INK} anchor="middle">Built for teams</Txt>
        </Pop>
      ) : null}
      {BOTC.map((_, i) => <Computer key={i} i={i} t={t} T={T} />)}
      {BOTC.map((c, i) => <Burst key={i} t={t} at={T.comp + 7 + i * 1.2} x={seat(i).x} y={seat(i).top + 140} color={c} n={8} r={110} />)}

      {/* ---- team strip plate (acts 2 + 3) ---- */}
      {act2 > 0.01 ? (
        <g opacity={clamp01(act2 * 1.4)}>
          <rect x={L} y={832} width={R - L} height={112} rx={56} fill="#12141B" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2.5} />
          {BOTC.map((_, i) => <ellipse key={i} cx={stripX(i)} cy={930} rx={50} ry={11} fill={`url(#${ID}-pool${i})`} />)}
        </g>
      ) : null}

      {/* ---- act 2: team chat ('Slack') ---- */}
      {chatOp > 0.01 ? (
        <g transform={`translate(0 ${chatY - 960})`} opacity={chatOp}>
          <Glass x={L} y={960} w={R - L} h={480} lit={pulse(t, T.slack, 8)} />
          <rect x={L + 26} y={978} width={64} height={64} rx={18} fill={ACC} opacity={0.22} />
          <Ico d={IC.chat} x={L + 58} y={1011} s={42} color={ICE} sw={2.2} />
          <Txt x={L + 108} y={1028} s={50} w={800} fill="#FFFFFF">Slack</Txt>
          <rect x={L + 108} y={1040} width={136 * pop(t, T.slack - 1, 'settle')} height={6} rx={3} fill={ACC} />
          <rect x={L + 276} y={985} width={206} height={54} rx={27} fill="#FFFFFF" opacity={0.08} />
          <Txt x={L + 379} y={1025} s={38} w={600} fill={MUTE} anchor="middle"># team</Txt>
          {[0, 1, 2].map((q) => <circle key={q} cx={R - 150 + q * 44} cy={1012} r={9} fill="#FFFFFF" opacity={0.25} />)}
          <rect x={L + 24} y={1056} width={R - L - 48} height={2} fill="#FFFFFF" opacity={0.1} />
          {/* row 1: a person asks */}
          <g>
            <Person x={L + 82} y={1120} r={46} color="#E0935A" />
            <Txt x={L + 150} y={1106} s={38} w={700} fill="#FFFFFF">Maya</Txt>
            <Txt x={L + 150} y={1156} s={41} w={500} fill={ICE}>Who can pull the launch notes?</Txt>
          </g>
          {/* row 2: the bot joins and delivers (no words - a file) */}
          {kRow2 > 0.01 ? (
            <g opacity={clamp01(kRow2 * 1.6)}>
              <rect x={L + 16} y={1180} width={R - L - 32} height={130} rx={26} fill="#FFFFFF" opacity={0.06 + 0.12 * pulse(t, T.slack, 7)} />
              <circle cx={CHAT_SLOT.x} cy={CHAT_SLOT.y} r={58} fill="#EDEBFF" opacity={0.14} />
              <circle cx={CHAT_SLOT.x} cy={CHAT_SLOT.y} r={58} fill="none" stroke={BOTC[CHAT_BOT]} strokeWidth={4} />
              <Txt x={L + 150} y={1231} s={38} w={700} fill="#FFFFFF">Grok Bot</Txt>
              <BotTag x={L + 336} y={1229} />
              <Txt x={L + 440} y={1231} s={38} w={500} fill={MUTE}>joined</Txt>
              {kFile < 0.5 ? (
                <g>{[0, 1, 2].map((q) => <circle key={q} cx={L + 168 + q * 30} cy={1272 - 9 * Math.max(0, Math.sin(t * 0.7 - q * 0.9))} r={9} fill={ICE} opacity={0.8} />)}</g>
              ) : (
                <g transform={`translate(${L + 150} 1249) scale(${0.7 + 0.3 * kFile})`}>
                  <rect x={0} y={0} width={440} height={52} rx={14} fill="#FFFFFF" opacity={0.12} stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={2} />
                  <Ico d={IC.doc} x={30} y={26} s={36} color={ICE} sw={2} />
                  <rect x={60} y={14} width={210} height={10} rx={5} fill="#FFFFFF" opacity={0.85} />
                  <rect x={60} y={31} width={140} height={8} rx={4} fill="#FFFFFF" opacity={0.4} />
                  <circle cx={404} cy={26} r={18} fill={OK} />
                  <Ico d={IC.check} x={404} y={26} s={24} color={INK} sw={3.4} />
                </g>
              )}
            </g>
          ) : null}
          {/* row 3: thanks */}
          {kRow3 > 0.01 ? (
            <g opacity={clamp01(kRow3 * 1.6)} transform={`translate(0 ${(1 - kRow3) * 24})`}>
              <Person x={L + 82} y={1372} r={46} color="#5B8DEF" />
              <Txt x={L + 150} y={1358} s={38} w={700} fill="#FFFFFF">Leo</Txt>
              <Txt x={L + 150} y={1408} s={41} w={500} fill={ICE}>Perfect, thanks team</Txt>
              <g transform={`translate(${L + 640} 1392) scale(${pop(t, T.slack + 17, 'bouncy')})`}>
                <rect x={-50} y={-27} width={100} height={54} rx={27} fill={OK} opacity={0.22} stroke={OK} strokeWidth={2.5} />
                <Ico d={IC.check} x={0} y={0} s={32} color={OK} sw={3.4} />
              </g>
            </g>
          ) : null}
        </g>
      ) : null}
      <Ripple t={t} at={T.slack + 3} x={CHAT_SLOT.x} y={CHAT_SLOT.y} color={BOTC[CHAT_BOT]} r={150} />

      {/* ---- act 2: video call ('Zoom') ---- */}
      {callOp > 0.01 ? (
        <g transform={`translate(0 ${callY - 1470})`} opacity={callOp}>
          <Glass x={L} y={1470} w={R - L} h={480} accent="#5B8DEF" lit={pulse(t, T.zoom, 8)} />
          <rect x={L + 26} y={1486} width={64} height={64} rx={18} fill="#5B8DEF" opacity={0.3} />
          <Ico d={IC.video} x={L + 58} y={1518} s={42} color={ICE} sw={2.2} />
          <Txt x={L + 108} y={1536} s={50} w={800} fill="#FFFFFF">Zoom</Txt>
          <Txt x={L + 274} y={1536} s={44} w={500} fill={MUTE}>call</Txt>
          <circle cx={L + 384} cy={1520} r={9} fill="#FF5A5A" opacity={0.55 + 0.45 * Math.sin(t * 0.3)} />
          {kCtl > 0.01 ? (
            <g transform={`translate(${R - 250} 1518) scale(${0.5 + 0.5 * kCtl})`} opacity={clamp01(kCtl * 1.5)}>
              {[0, 1, 2].map((q) => (
                <g key={q} transform={`translate(${q * 84} 0)`}>
                  <circle r={32} fill={q === 2 ? '#F0484E' : '#FFFFFF'} opacity={q === 2 ? 1 : 0.14} />
                  <Ico d={q === 0 ? IC.mic : q === 1 ? IC.video : IC.phone} x={0} y={q === 2 ? 3 : 0} s={32} color="#FFFFFF" sw={2.2} fill={q === 2 ? '#FFFFFF' : 'none'} />
                </g>
              ))}
            </g>
          ) : null}
          {[{n: 'Maya', c: '#E0935A'}, {n: 'Leo', c: '#5B8DEF'}, null, {n: 'Ana', c: '#58B99A'}].map((p, q) => {
            const x = L + 20 + (q % 2) * 580, y = 1562 + Math.floor(q / 2) * 190, w = 560, h = 178;
            const speak = kCtl > 0.5 && Math.floor((t - T.calls) / 16) % 3 === (q === 3 ? 2 : q);
            if (p) {
              const k = pop(t, T.even + q * 2, 'settle');
              return (
                <g key={q} opacity={clamp01(k * 1.5)} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${0.85 + 0.15 * k}) translate(${-x - w / 2} ${-y - h / 2})`}>
                  <rect x={x} y={y} width={w} height={h} rx={24} fill="#1D202B" />
                  <rect x={x} y={y} width={w} height={h} rx={24} fill={p.c} opacity={0.2} />
                  <Person x={x + w / 2} y={y + 76} r={56} color={p.c} />
                  <Txt x={x + 22} y={y + h - 20} s={38} w={600} fill="#FFFFFF">{p.n}</Txt>
                  {speak ? <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={22} fill="none" stroke={OK} strokeWidth={5} /> : null}
                  {speak ? [0, 1, 2, 3].map((m) => <rect key={m} x={x + w - 92 + m * 16} y={y + h - 34 - 16 * Math.abs(Math.sin(t * 0.8 + m * 1.3))} width={9} height={8 + 32 * Math.abs(Math.sin(t * 0.8 + m * 1.3))} rx={4.5} fill={OK} />) : null}
                </g>
              );
            }
            const c = BOTC[CALL_BOT];
            return (
              <g key={q}>
                <rect x={x} y={y} width={w} height={h} rx={24} fill="#12141B" stroke="#FFFFFF" strokeOpacity={0.28 * (1 - kJoin)} strokeWidth={3} strokeDasharray="14 12" />
                {kJoin < 0.5 ? [0, 1, 2].map((m) => <circle key={m} cx={x + w / 2 - 30 + m * 30} cy={y + h / 2} r={8} fill="#FFFFFF" opacity={0.2 + 0.3 * Math.max(0, Math.sin(t * 0.5 - m))} />) : null}
                <g opacity={clamp01(kJoin * 1.4)}>
                  <rect x={x} y={y} width={w} height={h} rx={24} fill={c} opacity={0.34} />
                  <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={22} fill="none" stroke={c} strokeWidth={5 + 4 * pulse(t, T.zoom, 6)} />
                  <ellipse cx={CALL_SLOT.x} cy={y + h - 22} rx={86} ry={15} fill="#000" opacity={0.35} />
                  <Txt x={x + 250} y={y + 84} s={42} w={700} fill="#FFFFFF">Grok Bot</Txt>
                  <BotTag x={x + 250} y={y + 140} />
                  <Txt x={x + 350} y={y + 140} s={38} w={500} fill={ICE}>joined</Txt>
                </g>
              </g>
            );
          })}
        </g>
      ) : null}
      <Ripple t={t} at={T.zoom + 4} x={CALL_SLOT.x} y={CALL_SLOT.y} color={BOTC[CALL_BOT]} r={260} />
      <Burst t={t} at={T.zoom + 5} x={CALL_SLOT.x} y={CALL_SLOT.y} color={BOTC[CALL_BOT]} n={12} r={170} />

      {/* ---- act 3: price card ---- */}
      {act3 > 0.01 ? (
        <g transform={`translate(0 ${priceY - 960})`} opacity={clamp01(act3 * 1.5)}>
          <Glass x={L} y={960} w={R - L} h={470} lit={pulse(t, T.prem, 8)} />
          <Pop k={pop(t, T.x - 1, 'bouncy')} x={L + 66} y={1016}>
            <rect x={L + 28} y={978} width={76} height={76} rx={20} fill="#000" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={2.5} />
            <Logo path={siX.path} x={L + 66} y={1016} s={42} color="#FFFFFF" />
          </Pop>
          <text x={L + 126} y={1033} fontFamily={FONT} fontSize={47} fontWeight={500} fill={ICE}>Comes with{' '}
            <tspan fontWeight={800} fill="#FFFFFF" dx={6} fillOpacity={0.4 + 0.6 * clamp01(pop(t, T.prem - 1) * 1.5)}>X Premium</tspan>
          </text>
          <Pop k={pop(t, T.up - 1, 'bouncy')} x={R - 150} y={1016}>
            <rect x={R - 262} y={982} width={226} height={68} rx={34} fill={ACC} />
            <Txt x={R - 149} y={1031} s={42} w={800} fill={INK} anchor="middle">and up</Txt>
          </Pop>
          {tiers.map((tr, j) => {
            const x = L + 20 + j * 387, y = 1076, w = 366, h = 334;
            const kIn = pop(t, T.prem - 1 + j * 2, 'settle'), lit = pop(t, tr.at, 'bouncy');
            const n = Math.round(tr.p * outC(ramp(t, tr.at - 1, tr.at + 5)));
            return (
              <g key={j} opacity={clamp01(kIn * 1.5)} transform={`translate(0 ${(1 - kIn) * 40 - 14 * pulse(t, tr.at + 1, 5)})`}>
                <rect x={x} y={y} width={w} height={h} rx={30} fill="#0E1016" stroke={ACC} strokeOpacity={0.25 + 0.75 * lit} strokeWidth={3 + 2 * lit} />
                <rect x={x} y={y} width={w} height={h} rx={30} fill={ACC} opacity={0.2 * lit} />
                <rect x={x + 4} y={y + 4} width={w - 8} height={84} rx={26} fill="#FFFFFF" opacity={0.05 + 0.07 * lit} />
                <Txt x={x + w / 2} y={y + 64} s={42} w={700} fill={lit > 0.3 ? '#FFFFFF' : MUTE} anchor="middle">{tr.n}</Txt>
                <Txt x={x + w / 2} y={y + 206} s={j === 0 ? 124 : 112} w={800} fill="#FFFFFF" anchor="middle" opacity={0.18 + 0.82 * clamp01(lit * 1.5)} ls={-2}>{`$${lit > 0.01 ? n : tr.p}`}</Txt>
                {[0, 1, 2].map((q) => <rect key={q} x={x + w / 2 - 78 + q * 56} y={y + 262 - (q <= j ? 6 * lit : 0)} width={44} height={q <= j ? 30 + 6 * lit : 30} rx={10} fill={q <= j ? ACC : '#FFFFFF'} opacity={q <= j ? 0.3 + 0.7 * lit : 0.1} />)}
              </g>
            );
          })}
        </g>
      ) : null}
      <Burst t={t} at={T.thirty} x={L + 203} y={1250} color={ACC} n={14} r={200} />

      {/* ---- act 3: weekly usage pool ---- */}
      {kM > 0.01 ? (
        <g transform={`translate(0 ${meterY - 1460})`} opacity={clamp01(kM * 1.5)}>
          <Glass x={L} y={1460} w={R - L} h={490} accent={fill > LIM + 0.01 ? AMB : ACC} lit={pulse(t, T.heavy, 8) + pulse(t, T.costs, 8)} />
          <Txt x={TX} y={1538} s={48} w={700} fill="#FFFFFF">Weekly usage pool</Txt>
          {/* track */}
          <rect x={TX} y={1576} width={TW} height={92} rx={46} fill="#07080C" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={2.5} />
          <clipPath id={`${ID}-trk`}><rect x={TX + 7} y={1583} width={TW - 14} height={78} rx={39} /></clipPath>
          <g clipPath={`url(#${ID}-trk)`}>
            <rect x={TX} y={1583} width={TW * Math.min(fill, LIM)} height={78} fill={`url(#${ID}-fill)`} />
            {fill > LIM ? <rect x={TX + TW * LIM} y={1583} width={TW * (fill - LIM)} height={78} fill={`url(#${ID}-hot)`} /> : null}
            <rect x={TX} y={1583} width={TW * fill} height={30} fill="#FFFFFF" opacity={0.2} />
            {Array.from({length: 21}).map((_, q) => <rect key={q} x={TX + (q + 1) * (TW / 22) - 1.5} y={1583} width={3} height={78} fill="#07080C" opacity={0.35} />)}
          </g>
          <circle cx={TX + TW * fill - 6} cy={1622} r={52 + 10 * Math.sin(t * 0.4)} fill={fill > LIM ? AMB : '#EC4699'} opacity={0.16 * clamp01((fill - 0.12) * 8)} />
          {/* pool limit marker */}
          <rect x={TX + TW * LIM - 3} y={1560} width={6} height={124} rx={3} fill="#FFFFFF" />
          <g transform={`translate(${TX + TW * LIM} 1722)`}>
            <path d="M0 -26 L14 -8 H-14 Z" fill="#FFFFFF" />
            <rect x={-150} y={-10} width={300} height={62} rx={31} fill="#FFFFFF" />
            <Txt x={0} y={35} s={38} w={700} fill={INK} anchor="middle">Weekly pool</Txt>
          </g>
          {/* extra use */}
          {fill > LIM + 0.02 ? <Txt x={R - 60} y={1538} s={40} w={700} fill={AMB} anchor="end" opacity={clamp01((fill - LIM) * 12)}>Over the pool</Txt> : null}
          <rect x={TX} y={1800} width={400} height={124} rx={62} fill="none" stroke="#FFFFFF" strokeOpacity={0.3 * (1 - kTop)} strokeWidth={3} strokeDasharray="14 12" />
          <Txt x={TX + 122} y={1882} s={58} w={800} fill="#FFFFFF" opacity={0.16 * (1 - clamp01(kTop * 2))}>Top-up</Txt>
          <Pop k={kTop} x={TX + 200} y={1862} rot={(1 - kTop) * -8}>
            <rect x={TX} y={1800} width={400} height={124} rx={62} fill={AMB} />
            <rect x={TX + 5} y={1805} width={390} height={52} rx={46} fill="#FFFFFF" opacity={0.3} />
            <circle cx={TX + 64} cy={1862} r={40} fill={INK} />
            <Ico d={IC.plus} x={TX + 64} y={1862} s={46} color={AMB} sw={3.4} />
            <Txt x={TX + 122} y={1882} s={58} w={800} fill={INK}>Top-up</Txt>
          </Pop>
          <Txt x={TX + 432} y={1850} s={40} w={700} fill={AMB} opacity={clamp01(pop(t, T.costs - 1) * 1.5)}>Extra use</Txt>
          <Txt x={TX + 432} y={1902} s={40} w={500} fill={ICE} opacity={clamp01(pop(t, T.extra + 2) * 1.5)}>billed on top</Txt>
          {/* the week: seven day bars fill with the pool, the last ones run hot */}
          {[0.34, 0.52, 0.45, 0.7, 0.62, 0.9, 1].map((v, q) => {
            const g = clamp01(fill * 7.6 - q), hot = q >= 5;
            return (
              <g key={q}>
                <rect x={TX + 742 + q * 52} y={1800} width={40} height={124} rx={12} fill="#FFFFFF" opacity={0.07} />
                <rect x={TX + 742 + q * 52} y={1924 - 124 * v * g} width={40} height={124 * v * g} rx={12} fill={hot ? AMB : BOTC[(q + 6) % 9]} opacity={0.95} />
              </g>
            );
          })}
        </g>
      ) : null}
      <Burst t={t} at={T.extra} x={TX + 200} y={1862} color={AMB} n={16} r={230} />

      {/* ---- the nine official bots (drawn last, always whole and unaltered) ---- */}
      {poses.map((p, i) => (p.op <= 0.01 ? null : (
        <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.sx} ${p.sy})`} opacity={p.op}>
          <SvgImg src={ASSETS.grokBots[i]} x={-p.s / 2} y={-p.s / 2} w={p.s} h={p.s} />
        </g>
      )))}
    </svg>
  );
};

export const grokOffice: WorldDef = {
  id: 's05',
  home: 'office',
  anchors: {office: {x: CX, y: 1200, zoom: 0.97}, computer: {x: CX, y: 1200, zoom: 1.02}},
  palette: {bg0: '#07080B', bg1: '#191B24', particles: '#B9A8FF', glow: '#8E5CF5'},
  Draw,
};
