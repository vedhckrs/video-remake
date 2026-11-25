// S06 "Duet desk" - Claude Duet by Anthropic. A warm desk at sunrise (dark sky at the top for the captions, terracotta
// to cream toward the desk). One place, three acts:
//  1 the official app icon rises with the sun; name + maker
//  2 the icon docks into a header; phone 'Morning brief' (3 items) -> invoice stamped UNPAID -> Gusto payroll card
//  3 approval sheet: Send / Pay / Sign / Delete light one per word, 'shows' a preview, 'waits' on Approve?;
//    red stamp 'Never moves money between accounts'; chips 'Included in Claude Pro $20' + 'US waitlist preview'
// END STATE: the approval sheet is centred at screen (0.50, 0.62) - S07 portals out of that point.
import React from 'react';
import {siAnthropic, siClaude, siGusto, siQuickbooks, siStripe} from 'simple-icons';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {Burst, Ripple} from '../../../src/kit/explainer/world';
import {ASSETS, SvgImg, bob} from './shared';
import {IC, Ico, Logo, Person, Pop, Txt, clamp01, lerp, outC, pop, pulse, ramp, rnd, wt} from './grok_duet_kit';

const ID = 's06';
const CX = 1300;
const TERRA = '#D97757', DEEP = '#B4502C', INK = '#2B1A12', MUTE = '#8C6F5E', CREAM = '#FFF7EE', PAPER = '#FFFFFF', SAND = '#F4E6D6', RED = '#C9291E', OK = '#2F9E5B';

const times = (b: WorldDrawProps['beats']) => ({
  anth: wt(b, "anthropic's", 11.5), claude: wt(b, 'claude', 28.5), duet: wt(b, 'duet', 37), careful: wt(b, 'careful', 52.5), one: wt(b, 'one', 62.5),
  briefs: wt(b, 'briefs', 96), every: wt(b, 'every', 107), morning: wt(b, 'morning', 113.5), spots: wt(b, 'spots', 127), unpaid: wt(b, 'unpaid', 137),
  invoices: wt(b, 'invoices', 146.5), even: wt(b, 'even', 168.5), runs: wt(b, 'runs', 176), payroll: wt(b, 'payroll', 183),
  before: wt(b, 'before', 205.5), sends: wt(b, 'sends', 217), pays: wt(b, 'pays', 234), signs: wt(b, 'signs', 247), deletes: wt(b, 'deletes', 262),
  shows: wt(b, 'shows', 292.5), waits: wt(b, 'waits', 306.5), never: wt(b, 'never', 329.5), moves: wt(b, 'moves', 335.5), money: wt(b, 'money', 342),
  between: wt(b, 'between', 348), accounts: wt(b, 'accounts', 356), included: wt(b, 'included', 396), claude2: wt(b, 'claude', 410, 1),
  pro: wt(b, 'pro', 419), twenty: wt(b, 'twenty', 428), dollars: wt(b, 'dollars', 436), us: 462.5, waitlist: wt(b, 'waitlist', 469.5), preview: wt(b, 'preview', 479.5),
});

/** white paper card with a warm shadow */
const Card: React.FC<{x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string; sw?: number}> = ({x, y, w, h, r = 36, fill = PAPER, stroke = '#E9D5C2', sw = 2.5}) => (
  <g>
    <rect x={x + 6} y={y + 20} width={w} height={h} rx={r} fill="#7A3418" opacity={0.2} />
    <rect x={x + 2} y={y + 8} width={w} height={h} rx={r} fill="#7A3418" opacity={0.16} />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={sw} />
  </g>
);
const Bar: React.FC<{x: number; y: number; w: number; h?: number; c?: string; o?: number}> = ({x, y, w, h = 14, c = '#D9C6B6', o = 1}) => <rect x={x} y={y} width={Math.max(0, w)} height={h} rx={h / 2} fill={c} opacity={o} />;

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const T = times(beats);
  const kDock = pop(t, T.briefs - 7, 'settle');
  const act2 = pop(t, T.briefs - 4, 'settle'), act2out = pop(t, T.before - 7, 'settle');
  const act3 = pop(t, T.before - 3, 'settle');
  const heroOut = ramp(t, T.briefs - 9, T.briefs - 3);
  const b = bob(t, 2, 1);
  // sun climbs through the whole scene
  const sunY = lerp(1640, 1040, outC(t / 520) * 0.9 + 0.1 * clamp01(t / 520));
  // icon: hero -> header
  const iconIn = pop(t, -6, 'settle');
  const ix = lerp(CX, 795, kDock), iy = lerp(1085, 752, kDock) + b.dy * (1 - 0.7 * kDock), isz = lerp(470, 142, kDock) * (0.8 + 0.2 * iconIn);
  // act 2
  const phX = 710 - act2out * 620, phY = 860 + (1 - act2) * 420, phOp = clamp01(act2 * 1.5) * (1 - act2out);
  const kInv = pop(t, T.spots - 1, 'settle'), kStamp = pop(t, T.unpaid - 1, 'bouncy'), kFan = pop(t, T.invoices - 1, 'settle');
  const kPay = pop(t, T.even - 1, 'settle'), kRun = pop(t, T.runs - 1, 'settle'), kDone = pop(t, T.payroll - 1, 'bouncy');
  const cardsX = act2out * 680;
  const lens = ramp(t, T.spots, T.unpaid);
  // act 3
  const S0 = 1000, SX = 740, SW = 1120, SH = 950;
  const sheetY = S0 + (1 - act3) * 520;
  const kNever = pop(t, T.never - 1, 'bouncy');
  const acts = [
    {n: 'Send', d: IC.send, at: T.sends}, {n: 'Pay', d: IC.pay, at: T.pays}, {n: 'Sign', d: IC.sign, at: T.signs}, {n: 'Delete', d: IC.trash, at: T.deletes},
  ];
  const kShows = pop(t, T.shows - 1, 'settle'), kWaits = pop(t, T.waits - 1, 'bouncy');
  const waitPulse = t > T.waits ? 0.5 + 0.5 * Math.sin((t - T.waits) * 0.26) : 0;
  const kMoves = pop(t, T.moves - 1, 'settle'), kBlock = pop(t, T.between - 1, 'bouncy'), kAcc = pop(t, T.accounts - 1, 'bouncy');
  const lineOut = pop(t, T.included - 6, 'settle');
  const kInc = pop(t, T.included - 2, 'settle'), kPro = pop(t, T.pro - 1), kTwenty = pop(t, T.twenty - 1, 'bouncy');
  const kWl = pop(t, T.waitlist - 2, 'bouncy'), kPrev = pop(t, T.preview - 1);
  const n20 = Math.round(20 * outC(ramp(t, T.twenty - 1, T.twenty + 7)));

  return (
    <svg width={2600} height={2400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${ID}-sky`} gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="2000">
          <stop offset="0" stopColor="#1B0C0B" /><stop offset="0.24" stopColor="#4A2018" /><stop offset="0.42" stopColor="#A04A2E" />
          <stop offset="0.62" stopColor="#E08D62" /><stop offset="0.82" stopColor="#F5BF94" /><stop offset="1" stopColor="#FBE0BE" />
        </linearGradient>
        <radialGradient id={`${ID}-sun`}><stop offset="0" stopColor="#FFF6DC" /><stop offset="0.3" stopColor="#FFE2AE" stopOpacity={0.9} /><stop offset="0.62" stopColor="#FFB98A" stopOpacity={0.35} /><stop offset="1" stopColor="#FFB98A" stopOpacity={0} /></radialGradient>
        <linearGradient id={`${ID}-desk`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2DCC0" /><stop offset="0.3" stopColor="#D9B58F" /><stop offset="1" stopColor="#7A4A2E" /></linearGradient>
        <linearGradient id={`${ID}-terra`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E88A66" /><stop offset="1" stopColor={DEEP} /></linearGradient>
        <linearGradient id={`${ID}-screen`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9D2" /><stop offset="0.3" stopColor="#FFF8F0" /><stop offset="1" stopColor="#FFFDFA" /></linearGradient>
        <linearGradient id={`${ID}-phone`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5A4036" /><stop offset="0.5" stopColor="#24160F" /><stop offset="1" stopColor="#6B4C3E" /></linearGradient>
        <radialGradient id={`${ID}-halo`}><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient>
      </defs>

      {/* ---- sunrise: sky, sun, hills, window, desk ---- */}
      <rect x={-700} y={-700} width={4000} height={4000} fill={`url(#${ID}-sky)`} />
      <circle cx={CX + 40} cy={sunY} r={900} fill={`url(#${ID}-sun)`} />
      <circle cx={CX + 40} cy={sunY} r={250} fill="#FFF3D6" opacity={0.92} />
      {Array.from({length: 14}).map((_, i) => {
        const a = (i / 14) * Math.PI * 2 + t * 0.004;
        return <line key={i} x1={CX + 40 + Math.cos(a) * 300} y1={sunY + Math.sin(a) * 300} x2={CX + 40 + Math.cos(a) * (520 + 60 * Math.sin(t * 0.05 + i))} y2={sunY + Math.sin(a) * (520 + 60 * Math.sin(t * 0.05 + i))} stroke="#FFF1D2" strokeWidth={10} strokeLinecap="round" opacity={0.2} />;
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = ((rnd(i * 3.3) * 1900 + t * (0.5 + rnd(i) * 0.5)) % 1900) + 350, y = 900 + i * 150 + rnd(i * 7) * 60;
        return <g key={i} opacity={0.34}><ellipse cx={x} cy={y} rx={230 + rnd(i) * 120} ry={26} fill="#FFE8D2" /><ellipse cx={x + 90} cy={y - 18} rx={130} ry={22} fill="#FFE8D2" /></g>;
      })}
      <path d="M-700 1820 C-100 1640 300 1700 700 1770 S1500 1600 1900 1730 S2700 1640 3300 1760 V2100 H-700 Z" fill="#C7694A" opacity={0.75} />
      <path d="M-700 1900 C0 1790 420 1860 900 1880 S1700 1760 2200 1850 S2900 1800 3300 1880 V2100 H-700 Z" fill="#A9502F" opacity={0.85} />
      {[690, 1910].map((x, i) => <rect key={i} x={x - 5} y={-700} width={10} height={2680} fill="#3A1A12" opacity={0.16} />)}
      <rect x={-700} y={640} width={4000} height={9} fill="#3A1A12" opacity={0.2} />
      <rect x={-700} y={1972} width={4000} height={1300} fill={`url(#${ID}-desk)`} />
      <rect x={-700} y={1972} width={4000} height={5} fill="#FFFFFF" opacity={0.6} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-700} y={2040 + i * 90} width={4000} height={2} fill="#7A4A2E" opacity={0.12} />)}
      {/* mug + plant on the desk (decor, low) */}
      <g transform="translate(668 1975)">
        <ellipse cx={60} cy={150} rx={110} ry={16} fill="#5A2E1C" opacity={0.25} />
        <path d="M0 0 H120 L110 140 Q60 156 10 140 Z" fill={`url(#${ID}-terra)`} />
        <path d="M120 30 q52 6 46 46 q-6 34 -52 34" fill="none" stroke={DEEP} strokeWidth={14} />
        <ellipse cx={60} cy={2} rx={60} ry={10} fill="#5A2414" />
        {[0, 1].map((i) => <path key={i} d={`M${40 + i * 36} -14 q-16 -30 0 -56 q16 -28 0 -56`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.3 + 0.2 * Math.sin(t * 0.08 + i * 2)} transform={`translate(${6 * Math.sin(t * 0.05 + i)} 0)`} />)}
      </g>
      <g transform="translate(1880 1975)">
        <path d="M-50 60 H50 L38 170 H-38 Z" fill="#8E4A30" />
        {[-58, -30, 0, 30, 58].map((a, i) => <path key={i} d="M0 60 C-18 -20 -8 -90 0 -150 C8 -90 18 -20 0 60 Z" fill={i % 2 ? '#5E8A5A' : '#4A7550'} transform={`rotate(${a + 2.5 * Math.sin(t * 0.04 + i)} 0 60)`} />)}
      </g>

      {/* ---- act 1: hero name + maker ---- */}
      {heroOut < 0.99 ? (
        <g opacity={1 - heroOut} transform={`translate(0 ${-heroOut * 60})`}>
          <circle cx={CX} cy={1085} r={420} fill={`url(#${ID}-halo)`} opacity={0.7} />
          {[0, 1].map((i) => <circle key={i} cx={CX} cy={1085} r={300 + i * 56 + 8 * Math.sin(t * 0.07 + i)} fill="none" stroke="#FFFFFF" strokeWidth={i ? 2.5 : 4} strokeDasharray={i ? '6 20' : undefined} strokeDashoffset={-t * 1.4} opacity={0.5 - i * 0.1} />)}
          <Pop k={pop(t, T.claude - 1, 'bouncy')} x={CX - 395} y={1462} rot={(1 - pop(t, T.claude - 1, 'settle')) * -90}>
            <Logo path={siClaude.path} x={CX - 395} y={1462} s={112} color={TERRA} />
          </Pop>
          <Txt x={CX - 318} y={1506} s={124} w={800} fill={INK} ls={-3} opacity={clamp01(pop(t, T.claude - 1) * 1.6)}>Claude</Txt>
          <Txt x={CX + 148} y={1506} s={124} w={800} fill={DEEP} ls={-3} opacity={clamp01(pop(t, T.duet - 1) * 1.6)}>Duet</Txt>
          <Pop k={pop(t, T.anth - 1, 'bouncy')} x={CX} y={1608}>
            <rect x={CX - 215} y={1562} width={430} height={92} rx={46} fill={PAPER} stroke="#E9D5C2" strokeWidth={2.5} />
            <Txt x={CX - 168} y={1622} s={40} w={500} fill={MUTE}>by</Txt>
            <Logo path={siAnthropic.path} x={CX - 82} y={1608} s={44} color={'#' + siAnthropic.hex} />
            <Txt x={CX - 46} y={1623} s={44} w={700} fill={INK}>Anthropic</Txt>
          </Pop>
          <Pop k={pop(t, T.careful - 1, 'bouncy')} x={CX} y={1768}>
            <rect x={CX - 290} y={1708} width={580} height={120} rx={60} fill={`url(#${ID}-terra)`} />
            <rect x={CX - 285} y={1713} width={570} height={50} rx={46} fill="#FFFFFF" opacity={0.22} />
            <Ico d={IC.shield} x={CX - 216} y={1768} s={68} color="#FFFFFF" sw={2.2} />
            <Txt x={CX + 40} y={1788} s={56} w={800} fill="#FFFFFF" anchor="middle">Approval first</Txt>
          </Pop>
          <Ripple t={t} at={T.careful} x={CX} y={1085} color="#FFFFFF" r={520} />
          <Ripple t={t} at={T.one} x={CX} y={1768} color={TERRA} r={460} />
        </g>
      ) : null}

      {/* ---- header (acts 2 + 3): icon docks here ---- */}
      {kDock > 0.3 ? (
        <g opacity={ramp(kDock, 0.3, 0.95)}>
          <Logo path={siClaude.path} x={922} y={731} s={56} color="#F0906C" />
          <Txt x={964} y={755} s={68} w={800} fill={CREAM} ls={-1.5}>Claude Duet</Txt>
          <Txt x={894} y={812} s={38} w={600} fill={CREAM}>by Anthropic</Txt>
        </g>
      ) : null}

      {/* ---- act 2: phone 'Morning brief' ---- */}
      {phOp > 0.01 ? (
        <g transform={`translate(${phX} ${phY})`} opacity={phOp}>
          <rect x={10} y={26} width={540} height={1090} rx={84} fill="#5A2414" opacity={0.3} />
          <rect x={0} y={0} width={540} height={1090} rx={84} fill={`url(#${ID}-phone)`} />
          <rect x={14} y={14} width={512} height={1062} rx={72} fill={`url(#${ID}-screen)`} />
          <rect x={190} y={34} width={160} height={40} rx={20} fill="#1D120D" />
          {/* header */}
          <g opacity={0.5 + 0.5 * clamp01(pop(t, T.briefs - 1) * 1.5)}>
            <circle cx={78} cy={150} r={38} fill="#FFD9A0" opacity={0.6 + 0.4 * pulse(t, T.morning, 8)} />
            <Ico d={IC.sun} x={78} y={150} s={52 + 10 * pulse(t, T.morning, 6)} color={DEEP} sw={2.2} />
            <Txt x={132} y={140} s={38} w={500} fill={MUTE}>Good morning</Txt>
            <Txt x={132} y={192} s={48} w={800} fill={INK} ls={-1}>Morning brief</Txt>
            <rect x={132} y={206} width={340 * pop(t, T.morning - 1, 'settle')} height={8} rx={4} fill={TERRA} />
          </g>
          {/* three items */}
          {[
            {n: "Today's calendar", d: IC.calendar, c: '#3F8F8A', at: T.briefs + 2},
            {n: 'Unpaid invoices', d: IC.doc, c: RED, at: T.every},
            {n: 'Payroll to run', d: IC.people, c: TERRA, at: T.morning},
          ].map((it, i) => {
            const k = pop(t, it.at - 1, 'bouncy');
            if (k <= 0.001) return null;
            const y = 250 + i * 252;
            const hot = i === 1 ? Math.max(pulse(t, T.spots, 10), pulse(t, T.unpaid, 10), pulse(t, T.invoices, 10)) : i === 2 ? Math.max(pulse(t, T.runs, 10), pulse(t, T.payroll, 10)) : 0;
            const sel = i === 1 ? pop(t, T.spots - 1) * (1 - pop(t, T.even - 2)) : i === 2 ? pop(t, T.even - 1) : 0;
            return (
              <g key={i} transform={`translate(${(1 - k) * 90} 0) translate(270 ${y + 115}) scale(${1 + 0.04 * hot}) translate(-270 ${-(y + 115)})`} opacity={clamp01(k * 1.6)}>
                <rect x={40} y={y + 10} width={464} height={226} rx={34} fill="#B4502C" opacity={0.12} />
                <rect x={36} y={y} width={468} height={226} rx={34} fill={PAPER} stroke={sel > 0.05 ? it.c : '#EAD7C5'} strokeWidth={2.5 + 4 * sel} />
                <rect x={62} y={y + 28} width={86} height={86} rx={24} fill={it.c} opacity={0.16} />
                <Ico d={it.d} x={105} y={y + 71} s={50} color={it.c} sw={2.2} />
                <Txt x={62} y={y + 168} s={39} w={700} fill={INK}>{it.n}</Txt>
                <Bar x={62} y={y + 190} w={250} />
                <Bar x={170} y={y + 46} w={190} h={12} o={0.8} />
                <Bar x={170} y={y + 72} w={130} h={12} o={0.5} />
                {i === 1 ? <circle cx={460} cy={y + 46} r={15 + 6 * hot} fill={RED} /> : null}
                {i === 0 ? <g><circle cx={460} cy={y + 46} r={17} fill={OK} /><Ico d={IC.check} x={460} y={y + 46} s={22} color="#FFFFFF" sw={3.4} /></g> : null}
                {i === 2 && kDone > 0.01 ? <g transform={`translate(460 ${y + 46}) scale(${kDone})`}><circle r={17} fill={OK} /><Ico d={IC.check} x={0} y={0} s={22} color="#FFFFFF" sw={3.4} /></g> : null}
              </g>
            );
          })}
          <rect x={190} y={1040} width={160} height={9} rx={4.5} fill="#1D120D" opacity={0.5} />
          <path d="M40 30 Q40 16 80 16 H300 L120 420 H14 V90 Q14 40 40 30 Z" fill="#FFFFFF" opacity={0.1} />
        </g>
      ) : null}

      {/* ---- act 2: invoice (QuickBooks / Stripe) ---- */}
      {kInv > 0.01 && act2out < 0.99 ? (
        <g transform={`translate(${cardsX + (1 - kInv) * 200} ${(1 - kInv) * 60})`} opacity={clamp01(kInv * 1.6) * (1 - act2out)}>
          {[1, 0].map((q) => (
            <g key={q} transform={`rotate(${kFan * (q ? -5 : -2.6)} 1590 1380) translate(${-kFan * (q ? 10 : 5)} ${-kFan * (q ? 22 : 11)})`} opacity={kFan}>
              <rect x={1290} y={860} width={600} height={520} rx={30} fill={q ? '#F0DDCB' : '#F8EBDD'} stroke="#DFC7B2" strokeWidth={2.5} />
            </g>
          ))}
          <Card x={1290} y={860} w={600} h={520} r={30} />
          <rect x={1290} y={860} width={600} height={104} rx={30} fill={SAND} />
          <rect x={1290} y={920} width={600} height={44} fill={SAND} />
          <Ico d={IC.doc} x={1344} y={913} s={52} color={DEEP} sw={2.2} />
          <Txt x={1386} y={932} s={50} w={800} fill={INK} ls={-1}>Invoice</Txt>
          <Bar x={1700} y={900} w={150} h={16} c="#CDB5A2" />
          {[0, 1, 2].map((q) => (
            <g key={q}>
              <Bar x={1326} y={1004 + q * 56} w={[300, 240, 270][q]} h={18} />
              <Bar x={1716} y={1004 + q * 56} w={134} h={18} c="#C9B19E" />
              <rect x={1326} y={1038 + q * 56} width={524} height={2} fill="#EFE0D2" />
            </g>
          ))}
          <Bar x={1560} y={1186} w={130} h={22} c="#BDA28E" />
          <Bar x={1716} y={1182} w={134} h={30} c={INK} o={0.8} />
          {/* source logos */}
          <g>
            <rect x={1314} y={1262} width={340} height={88} rx={22} fill="#FFFFFF" stroke="#E3D0BE" strokeWidth={2.5} />
            <Logo path={siQuickbooks.path} x={1358} y={1306} s={52} color={'#' + siQuickbooks.hex} />
            <Txt x={1396} y={1320} s={38} w={700} fill={INK}>QuickBooks</Txt>
            <rect x={1666} y={1262} width={200} height={88} rx={22} fill="#FFFFFF" stroke="#E3D0BE" strokeWidth={2.5} />
            <Logo path={siStripe.path} x={1704} y={1306} s={46} color={'#' + siStripe.hex} />
            <Txt x={1736} y={1320} s={38} w={700} fill={INK}>Stripe</Txt>
          </g>
          {/* 'spots': a lens sweeps the lines */}
          {lens > 0.01 && lens < 0.999 ? (
            <g transform={`translate(${lerp(1380, 1760, lens)} ${lerp(1010, 1180, lens)})`} opacity={Math.sin(Math.PI * lens) * 1.4}>
              <circle r={78} fill="#FFD9A0" opacity={0.35} />
              <circle r={78} fill="none" stroke={DEEP} strokeWidth={9} />
              <line x1={56} y1={56} x2={112} y2={112} stroke={DEEP} strokeWidth={16} strokeLinecap="round" />
            </g>
          ) : null}
          {/* UNPAID stamp */}
          {kStamp > 0.01 ? (
            <g transform={`translate(1600 1108) rotate(-12) scale(${2.3 - 1.3 * kStamp})`} opacity={clamp01(kStamp * 2)}>
              <rect x={-215} y={-68} width={430} height={136} rx={20} fill="#FFFFFF" opacity={0.86} />
              <rect x={-215} y={-68} width={430} height={136} rx={20} fill="none" stroke={RED} strokeWidth={10} />
              <rect x={-199} y={-52} width={398} height={104} rx={12} fill="none" stroke={RED} strokeWidth={3} />
              <Txt x={0} y={32} s={88} w={800} fill={RED} anchor="middle" ls={6}>UNPAID</Txt>
            </g>
          ) : null}
        </g>
      ) : null}
      <Burst t={t} at={T.unpaid + 2} x={1600 + cardsX} y={1108} color={RED} n={12} r={260} />

      {/* ---- act 2: payroll (Gusto) ---- */}
      {kPay > 0.01 && act2out < 0.99 ? (
        <g transform={`translate(${cardsX} ${(1 - kPay) * 320})`} opacity={clamp01(kPay * 1.6) * (1 - act2out)}>
          <Card x={1290} y={1410} w={600} h={540} r={30} stroke={kDone > 0.3 ? OK : '#E9D5C2'} sw={2.5 + 3 * pulse(t, T.payroll, 8)} />
          <rect x={1318} y={1434} width={84} height={84} rx={22} fill={'#' + siGusto.hex} />
          <Logo path={siGusto.path} x={1360} y={1476} s={54} color="#FFFFFF" />
          <Txt x={1424} y={1478} s={50} w={800} fill={INK} ls={-1}>Payroll</Txt>
          <Txt x={1424} y={1520} s={38} w={600} fill={MUTE}>Gusto</Txt>
          {[{c: '#E0935A'}, {c: '#5B8DEF'}, {c: '#58B99A'}].map((p, q) => {
            const y = 1556 + q * 88, ck = pop(t, T.runs + q * 2.2, 'bouncy');
            return (
              <g key={q}>
                <rect x={1318} y={y} width={544} height={76} rx={20} fill={SAND} opacity={0.75} />
                <Person x={1362} y={y + 38} r={28} color={p.c} />
                <Bar x={1408} y={y + 20} w={[190, 150, 170][q]} h={16} c="#C9B19E" />
                <Bar x={1408} y={y + 46} w={110} h={12} />
                <Bar x={1650} y={y + 28} w={110 * (0.3 + 0.7 * kRun)} h={20} c={INK} o={0.75} />
                <circle cx={1822} cy={y + 38} r={22} fill={ck > 0.05 ? OK : '#E3D0BE'} />
                {ck > 0.05 ? <Ico d={IC.check} x={1822} y={y + 38} s={26 * ck} color="#FFFFFF" sw={3.4} /> : null}
              </g>
            );
          })}
          <rect x={1318} y={1832} width={544} height={20} rx={10} fill="#EAD7C5" />
          <rect x={1318} y={1832} width={544 * kRun} height={20} rx={10} fill={kDone > 0.3 ? OK : TERRA} />
          <g transform={`translate(1318 1870) scale(${1 + 0.06 * pulse(t, T.payroll, 5)})`}>
            <rect x={0} y={0} width={450} height={62} rx={31} fill={kDone > 0.3 ? OK : SAND} />
            <Txt x={225} y={44} s={38} w={700} fill={kDone > 0.3 ? '#FFFFFF' : MUTE} anchor="middle">Prepares + runs it</Txt>
          </g>
        </g>
      ) : null}
      <Burst t={t} at={T.payroll} x={1590 + cardsX} y={1842} color={OK} n={12} r={220} />

      {/* ---- act 3: the line above the sheet ---- */}
      {act3 > 0.01 && lineOut < 0.99 ? (
        <g opacity={clamp01(act3 * 1.5) * (1 - lineOut)} transform={`translate(0 ${-lineOut * 30})`}>
          <rect x={SX} y={870} width={432} height={96} rx={48} fill="#3A1A10" opacity={0.42} />
          <Txt x={SX + 216} y={936} s={50} w={800} fill={CREAM} anchor="middle">Before it acts</Txt>
          {[{n: 'Shows you', k: kShows, at: T.shows, x: 1196, w: 348, d: IC.eye}, {n: 'Waits', k: kWaits, at: T.waits, x: 1560, w: 300, d: IC.lock}].map((p, i) => (
            <g key={i} transform={`translate(${p.x + p.w / 2} 918) scale(${1 + 0.1 * pulse(t, p.at, 5)}) translate(${-(p.x + p.w / 2)} -918)`}>
              <rect x={p.x} y={870} width={p.w} height={96} rx={48} fill={p.k > 0.3 ? PAPER : '#000000'} opacity={p.k > 0.3 ? 1 : 0.2} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2.5} />
              <Ico d={p.d} x={p.x + 56} y={918} s={44} color={p.k > 0.3 ? DEEP : '#FFFFFF'} sw={2.2} opacity={p.k > 0.3 ? 1 : 0.7} />
              <Txt x={p.x + 92} y={933} s={42} w={700} fill={p.k > 0.3 ? INK : '#FFFFFF'} opacity={p.k > 0.3 ? 1 : 0.7}>{p.n}</Txt>
            </g>
          ))}
        </g>
      ) : null}

      {/* ---- act 3: price chip (full row) + waitlist chip (header right) ---- */}
      {kInc > 0.01 ? (
        <g opacity={clamp01(kInc * 1.6)} transform={`translate(0 ${(1 - kInc) * 40})`}>
          <rect x={SX + 4} y={870} width={SW} height={112} rx={56} fill="#7A3418" opacity={0.25} />
          <rect x={SX} y={862} width={SW} height={112} rx={56} fill={PAPER} stroke={TERRA} strokeWidth={3 + 3 * pulse(t, T.twenty, 8)} />
          <Pop k={pop(t, T.claude2 - 1, 'bouncy')} x={SX + 62} y={918}><Logo path={siClaude.path} x={SX + 62} y={918} s={60} color={TERRA} /></Pop>
          <Txt x={SX + 110} y={936} s={50} w={500} fill={MUTE}>Included in</Txt>
          <Txt x={SX + 410} y={936} s={50} w={800} fill={INK} opacity={0.3 + 0.7 * clamp01(kPro * 1.6)}>Claude Pro</Txt>
          <g transform={`translate(${SX + 940} 918) scale(${0.6 + 0.4 * kTwenty + 0.12 * pulse(t, T.dollars, 5)})`} opacity={clamp01(kTwenty * 1.6)}>
            <rect x={-150} y={-46} width={300} height={92} rx={46} fill={`url(#${ID}-terra)`} />
            <Txt x={0} y={25} s={70} w={800} fill="#FFFFFF" anchor="middle" ls={-1}>{`$${n20}`}</Txt>
          </g>
        </g>
      ) : null}
      <Burst t={t} at={T.twenty} x={SX + 940} y={918} color={TERRA} n={14} r={200} />
      {kWl > 0.01 ? (
        <Pop k={kWl} x={1650} y={752} rot={(1 - kWl) * 6}>
          <rect x={1424} y={712} width={456} height={96} rx={48} fill="#7A3418" opacity={0.3} />
          <rect x={1420} y={704} width={456} height={96} rx={48} fill={kPrev > 0.3 ? INK : PAPER} stroke={kPrev > 0.3 ? '#FFD9A0' : TERRA} strokeWidth={3 + 3 * pulse(t, T.preview, 8)} />
          <Txt x={1648} y={767} s={41} w={700} fill={kPrev > 0.3 ? '#FFE9CF' : INK} anchor="middle">US waitlist preview</Txt>
        </Pop>
      ) : null}

      {/* ---- act 3: approval sheet ---- */}
      {act3 > 0.01 ? (
        <g transform={`translate(0 ${sheetY - S0})`} opacity={clamp01(act3 * 1.6)}>
          <rect x={SX + 10} y={S0 + 30} width={SW} height={SH} rx={56} fill="#7A3418" opacity={0.22} />
          <rect x={SX} y={S0} width={SW} height={SH} rx={56} fill={PAPER} stroke="#E9D5C2" strokeWidth={3} />
          <rect x={SX} y={S0} width={SW} height={130} rx={56} fill={CREAM} />
          <rect x={CX - 60} y={S0 + 16} width={120} height={9} rx={4.5} fill="#DCC6B2" />
          <circle cx={SX + 78} cy={S0 + 86} r={40} fill={`url(#${ID}-terra)`} />
          <Ico d={IC.shield} x={SX + 78} y={S0 + 86} s={50} color="#FFFFFF" sw={2.2} />
          <Txt x={SX + 136} y={S0 + 104} s={52} w={800} fill={INK} ls={-1}>Needs your approval</Txt>
          <SvgImg src={ASSETS.duetIcon} x={SX + SW - 128} y={S0 + 44 + bob(t, 4, 0.5).dy * 0.4} w={84} h={84} />
          {/* four actions, one per word */}
          {acts.map((a, i) => {
            const x = SX + 40 + (i % 2) * 530, y = S0 + 150 + Math.floor(i / 2) * 203, w = 510, h = 185;
            const lit = pop(t, a.at - 1, 'bouncy'), hot = pulse(t, a.at, 7);
            const dim = 1 - 0.5 * kNever;
            return (
              <g key={i} opacity={dim} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${1 + 0.06 * hot}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
                <rect x={x + 3} y={y + 9} width={w} height={h} rx={34} fill="#7A3418" opacity={0.1 + 0.14 * lit} />
                <rect x={x} y={y} width={w} height={h} rx={34} fill={SAND} stroke="#E3CDB8" strokeWidth={2.5} />
                <rect x={x} y={y} width={w} height={h} rx={34} fill={`url(#${ID}-terra)`} opacity={clamp01(lit)} />
                <rect x={x + 5} y={y + 5} width={w - 10} height={70} rx={30} fill="#FFFFFF" opacity={0.16 * clamp01(lit)} />
                <circle cx={x + 92} cy={y + h / 2} r={56} fill={lit > 0.4 ? '#FFFFFF' : '#EAD7C5'} />
                <circle cx={x + 92} cy={y + h / 2} r={56 + 26 * (1 - hot)} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={hot * (hot < 0.98 ? 1 : 0)} />
                <Ico d={a.d} x={x + 92} y={y + h / 2} s={62} color={lit > 0.4 ? DEEP : MUTE} sw={2.2} />
                <Txt x={x + 174} y={y + h / 2 + 21} s={58} w={800} fill={lit > 0.4 ? '#FFFFFF' : MUTE} ls={-1}>{a.n}</Txt>
                {lit > 0.05 ? <g transform={`translate(${x + w - 62} ${y + 56}) scale(${clamp01(lit)})`}><circle r={30} fill="#FFFFFF" opacity={0.25} /><Ico d={IC.lock} x={0} y={0} s={34} color="#FFFFFF" sw={2.4} /></g> : null}
              </g>
            );
          })}
          {/* preview strip ('shows') -> account transfer that is blocked ('never moves money between accounts') */}
          <rect x={SX + 40} y={S0 + 566} width={SW - 80} height={150} rx={30} fill={CREAM} stroke="#E3CDB8" strokeWidth={2.5} />
          {kMoves < 0.99 ? (
            <g opacity={(0.25 + 0.75 * clamp01(kShows * 1.5)) * (1 - kMoves)}>
              <circle cx={SX + 112} cy={S0 + 641} r={44} fill={TERRA} opacity={0.16 + 0.3 * pulse(t, T.shows, 7)} />
              <Ico d={IC.eye} x={SX + 112} y={S0 + 641} s={54 + 10 * pulse(t, T.shows, 5)} color={DEEP} sw={2.2} />
              <Txt x={SX + 176} y={S0 + 656} s={44} w={700} fill={INK}>Preview</Txt>
              <g transform={`translate(${(1 - kShows) * 240} 0)`} opacity={clamp01(kShows * 1.5)}>
                <rect x={SX + 420} y={S0 + 586} width={420} height={110} rx={18} fill={PAPER} stroke="#E3CDB8" strokeWidth={2.5} />
                <Bar x={SX + 444} y={S0 + 608} w={250} h={16} c="#BDA28E" />
                <Bar x={SX + 444} y={S0 + 636} w={360} />
                <Bar x={SX + 444} y={S0 + 662} w={290} />
                <rect x={SX + 860} y={S0 + 586} width={110} height={110} rx={18} fill={SAND} stroke="#E3CDB8" strokeWidth={2.5} />
                <Ico d={IC.doc} x={SX + 915} y={S0 + 641} s={58} color={MUTE} sw={2} />
              </g>
            </g>
          ) : null}
          {kMoves > 0.01 ? (
            <g opacity={clamp01(kMoves * 1.5)}>
              {[0, 1].map((q) => {
                const x = q ? SX + SW - 60 - 310 : SX + 60;
                return (
                  <g key={q} transform={`translate(${x + 155} ${S0 + 641}) scale(${0.8 + 0.2 * kMoves + 0.06 * pulse(t, T.accounts, 5)}) translate(${-(x + 155)} ${-(S0 + 641)})`}>
                    <rect x={x} y={S0 + 586} width={310} height={110} rx={24} fill={PAPER} stroke={kAcc > 0.3 ? RED : '#E3CDB8'} strokeWidth={2.5 + 3 * kAcc} />
                    <Ico d={IC.bank} x={x + 52} y={S0 + 641} s={54} color={INK} sw={2.1} />
                    <Txt x={x + 96} y={S0 + 656} s={40} w={700} fill={INK}>{q ? 'Account B' : 'Account A'}</Txt>
                  </g>
                );
              })}
              <line x1={SX + 392} y1={S0 + 641} x2={SX + SW - 392} y2={S0 + 641} stroke="#CDB5A2" strokeWidth={6} strokeDasharray="4 18" strokeLinecap="round" />
              {/* a coin tries to cross and is pushed back */}
              {(() => {
                const go = ramp(t, T.money - 1, T.between), back = pop(t, T.between, 'bouncy');
                const cx = lerp(SX + 420, CX - 62, outC(go)) - back * 44;
                return pop(t, T.money - 1) > 0.01 ? (
                  <g transform={`translate(${cx} ${S0 + 641})`} opacity={clamp01(pop(t, T.money - 1) * 1.6)}>
                    <circle r={34} fill="#F2B84B" stroke="#B5791F" strokeWidth={4} />
                    <Txt x={0} y={17} s={46} w={800} fill="#7A4A10" anchor="middle">$</Txt>
                  </g>
                ) : null;
              })()}
              <g transform={`translate(${CX} ${S0 + 641}) scale(${kBlock})`} opacity={clamp01(kBlock * 1.5)}>
                <circle r={46} fill={RED} />
                <path d="M-18 -18 L18 18 M18 -18 L-18 18" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" />
              </g>
            </g>
          ) : null}
          {/* Approve? - waits */}
          <g transform={`translate(${CX} ${S0 + 824}) scale(${1 + 0.035 * waitPulse * kWaits}) translate(${-CX} ${-(S0 + 824)})`}>
            {kWaits > 0.05 ? <rect x={SX + 40 - 14 * waitPulse} y={S0 + 748 - 14 * waitPulse} width={SW - 80 + 28 * waitPulse} height={152 + 28 * waitPulse} rx={76 + 14 * waitPulse} fill="none" stroke={TERRA} strokeWidth={6} opacity={(1 - waitPulse) * 0.8} /> : null}
            <rect x={SX + 43} y={S0 + 760} width={SW - 86} height={152} rx={76} fill="#7A3418" opacity={0.2 * kWaits} />
            <rect x={SX + 40} y={S0 + 748} width={SW - 80} height={152} rx={76} fill={SAND} stroke="#E3CDB8" strokeWidth={2.5} />
            <rect x={SX + 40} y={S0 + 748} width={SW - 80} height={152} rx={76} fill={`url(#${ID}-terra)`} opacity={clamp01(kWaits)} />
            <rect x={SX + 48} y={S0 + 756} width={SW - 96} height={62} rx={56} fill="#FFFFFF" opacity={0.2 * clamp01(kWaits)} />
            <Txt x={CX - 30} y={S0 + 848} s={70} w={800} fill={kWaits > 0.4 ? '#FFFFFF' : '#C4AC98'} anchor="middle" ls={-1}>Approve?</Txt>
            {[0, 1, 2].map((q) => <circle key={q} cx={CX + 178 + q * 34} cy={S0 + 828 - (kWaits > 0.4 ? 10 * Math.max(0, Math.sin(t * 0.35 - q * 0.9)) : 0)} r={10} fill={kWaits > 0.4 ? '#FFFFFF' : '#C4AC98'} opacity={0.9} />)}
          </g>
          {/* the hard line */}
          {kNever > 0.01 ? (
            <g transform={`translate(${CX} ${S0 + 344}) rotate(-5) scale(${2.4 - 1.4 * kNever})`} opacity={clamp01(kNever * 2)}>
              <rect x={-500} y={-150} width={1000} height={300} rx={32} fill="#FFFFFF" opacity={0.95} />
              <rect x={-500} y={-150} width={1000} height={300} rx={32} fill="none" stroke={RED} strokeWidth={13} />
              <rect x={-478} y={-128} width={956} height={256} rx={18} fill="none" stroke={RED} strokeWidth={3.5} />
              <Txt x={0} y={-18} s={78} w={800} fill={RED} anchor="middle" ls={3}>NEVER MOVES MONEY</Txt>
              <Txt x={0} y={82} s={78} w={800} fill={RED} anchor="middle" ls={3}>BETWEEN ACCOUNTS</Txt>
            </g>
          ) : null}
        </g>
      ) : null}
      <Burst t={t} at={T.never + 2} x={CX} y={S0 + 344} color={RED} n={18} r={520} />
      <Ripple t={t} at={T.waits} x={CX} y={S0 + 824} color={TERRA} r={640} />

      {/* ---- the official Claude Duet app icon (unaltered; floats, then docks into the header) ---- */}
      <g transform={`translate(${ix} ${iy}) rotate(${b.rot * (1 - kDock)}) scale(${b.sx} ${b.sy})`}>
        <ellipse cx={0} cy={isz * 0.6} rx={isz * 0.42} ry={isz * 0.06} fill="#5A2414" opacity={0.28 * (1 - kDock)} />
        <SvgImg src={ASSETS.duetIcon} x={-isz / 2} y={-isz / 2} w={isz} h={isz} />
      </g>
    </svg>
  );
};

export const duetDesk: WorldDef = {
  id: 's06',
  home: 'duet',
  anchors: {duet: {x: CX, y: 1200, zoom: 0.96}, morning: {x: CX, y: 1200, zoom: 1}},
  aliases: {briefs: 'morning'},
  palette: {bg0: '#1E0E0B', bg1: '#6B3323', particles: '#FFE2C2', glow: '#FFB07A'},
  Draw,
};
