// S10 - CTA that loops back to the hook. A phone in the middle plays the six-agent wall, the six real cards flank it.
// 'Save' -> a fingertip presses the bookmark (it fills, "Saved" toast); 'before you pay' -> second toast; 'agent' -> the
// cards hop; 'Which one would you trust' -> the comment sheet slides up, the question types in, the six mascots pop in
// as reaction chips; 'inbox' -> mail badge; 'Tell me below' -> the comment field wakes up and arrows point down.
// Then the phone steps back and the cards fly into the S01 wall layout (the opening picture). No handle, no channel.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, Burst} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {AGENTS, FONT, bob, usePreload} from './shared';
import {Z, FY, ALL, Card, Art, GlowDefs, Finger, RoomBack, WALL_W, WALL_H, wallSlot, lerp, smooth, outC, easeIO, rnd, decay, hop} from './frame_kit';

const p = 's10';
const PHX = 310, PHY = 520, PHW = 460, PHH = 960, BZ = 14, SW = PHW - 2 * BZ, SH = PHH - 2 * BZ;
const SX = PHX + BZ, SY = PHY + BZ;
const BM = {x: 378, y: 742};                                  // bookmark button, screen-local
const FLANK_W = 175;
const flank = (i: number) => ({x: i < 3 ? 160 : 920, y: 560 + (i % 3) * 290 + FLANK_W * 0.71});
const OFF = 960 - FY;                                          // this world's y - true screen y (the S01 wall is in screen px)
const PINK = '#FF6FCF', VIO = '#8B5CF6', AM = '#FFD66B';
const HEART = 'M0,18 C-40,-10 -22,-46 0,-22 C22,-46 40,-10 0,18 Z';
const BOOK = 'M-15,-20 H15 V22 L0,10 L-15,22 Z';

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  usePreload(ALL.map((id) => AGENTS[id].art));
  const tSave = wordAt(beats, 'save', 6.5), tBefore = wordAt(beats, 'before', 19), tPay = wordAt(beats, 'pay', 29.5), tAgent = wordAt(beats, 'agent', 41);
  const tWhich = wordAt(beats, 'which', 70.5), tOne = wordAt(beats, 'one', 77.5), tTrust = wordAt(beats, 'trust', 88), tInbox = wordAt(beats, 'inbox', 102.5);
  const tTell = wordAt(beats, 'tell', 129), tBelow = wordAt(beats, 'below', 138), tBack = 154;
  const wall = (i: number) => ({x: wallSlot(i).x, y: wallSlot(i).y + OFF});

  const saved = t >= tSave;
  const press = smooth((t - tSave + 4) / 4) * (1 - smooth((t - tSave - 2) / 5));
  const fIn = smooth((t + 12) / 11), fOut = smooth((t - tSave - 6) / 9);
  const stamp = sp(t, tSave, 'bouncy'), stampGo = easeIO((t - tSave - 12) / 10);
  const sheet = sp(t, tWhich - 2, 'settle');
  const back = smooth((t - tBack + 4) / 16);                    // phone steps back
  const room = smooth((t - tBack + 4) / 26);
  const scanI = t >= tOne && t < tTrust + 12 ? Math.floor((t - tOne) / 3.6) % 6 : -1;
  const tell = sp(t, tTell, 'pop');

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <GlowDefs p={p} />
      <defs>
        <linearGradient id={`${p}-bg`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1920"><stop offset="0" stopColor="#12062E" /><stop offset="0.55" stopColor="#3D1470" /><stop offset="1" stopColor="#12051F" /></linearGradient>
        <radialGradient id={`${p}-gv`}><stop offset="0" stopColor={PINK} stopOpacity={0.55} /><stop offset="1" stopColor={VIO} stopOpacity={0} /></radialGradient>
        <linearGradient id={`${p}-ti`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9CED8" /><stop offset="0.3" stopColor="#5A5F6B" /><stop offset="0.55" stopColor="#2A2C34" /><stop offset="0.8" stopColor="#8A909C" /><stop offset="1" stopColor="#3A3D46" /></linearGradient>
        <linearGradient id={`${p}-scr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A1658" /><stop offset="0.5" stopColor="#170C36" /><stop offset="1" stopColor="#0B0718" /></linearGradient>
        <linearGradient id={`${p}-bub`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF6FAE" /><stop offset="1" stopColor="#7C4DFF" /></linearGradient>
        <linearGradient id={`${p}-refl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} /><stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${p}-six`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#B49BFF" /></linearGradient>
        <clipPath id={`${p}-clip`}><rect width={SW} height={SH} rx={52} /></clipPath>
      </defs>

      {/* stage */}
      <rect x={-700} y={-700} width={2480} height={3300} fill={`url(#${p}-bg)`} />
      <circle cx={540} cy={1000} r={900} fill={`url(#${p}-gv)`} opacity={0.6} />
      {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={540} cy={1570} rx={330 + k * 190} ry={(330 + k * 190) * 0.17} fill="none" stroke={k % 2 ? PINK : VIO} strokeWidth={3} opacity={(0.45 - k * 0.09) * (1 - back)} />)}
      {Array.from({length: 16}).map((_, i) => {
        const x = -40 + rnd(i * 2.1) * 1160, y = 430 + ((rnd(i * 4.3) * 1250 - t * (0.5 + rnd(i * 6)) + 2500) % 1250), s = 0.5 + rnd(i * 7) * 0.7, kind = i % 3;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${(rnd(i) - 0.5) * 30})`} opacity={0.2 * (1 - back)}>
            {kind === 0 ? <path d={HEART} fill={PINK} /> : kind === 1 ? <path d={BOOK} fill={AM} transform="scale(1.4)" />
              : <g><rect x={-34} y={-24} width={68} height={48} rx={14} fill={VIO} /><polygon points="-8,22 8,22 -14,40" fill={VIO} /></g>}
          </g>
        );
      })}
      {/* ... and back to the opening room */}
      {room > 0.01 ? <g transform={`translate(0 ${OFF})`}><RoomBack p={p} n={0} t={t} o={room} /></g> : null}
      {ALL.map((id, i) => { const s = wall(i); return <ellipse key={id} cx={s.x} cy={s.y} rx={270} ry={330} fill={`url(#${p}-g-${id})`} opacity={0.35 * room} />; })}

      {/* the six cards: flank the phone, then fly back into the wall */}
      {ALL.map((id, i) => {
        const f = flank(i), w = wall(i), e = outC((t + 9 - i * 2) / 18), q = easeIO((t - tBack - i * 2) / 22);
        const side = i < 3 ? -1 : 1;
        const x = lerp(f.x + side * 520 * (1 - e), w.x, q), y = lerp(f.y, w.y, q) - hop(t, tAgent + i * 1.6, 9) * 22 - Math.sin(q * Math.PI) * 60 + Math.sin(t * 0.06 + i * 1.7) * 4;
        const scan = scanI === i ? 1 : 0;
        return (
          <g key={id}>
            <ellipse cx={x} cy={y} rx={170} ry={210} fill={`url(#${p}-g-${id})`} opacity={(0.35 + 0.4 * scan) * (1 - q)} />
            <Card id={id} uid={p + id} w={WALL_W} t={t} cx={x} cy={y} s={lerp(FLANK_W / WALL_W, 1, q) * (1 + 0.06 * scan)} rot={(1 - e) * side * 18 + Math.sin(q * Math.PI) * side * -6}
              glow={Math.max(decay(t, tAgent + i * 1.6, 7), scan, decay(t, tBack + i * 2 + 22, 8), 0.25)} />
          </g>
        );
      })}

      {/* ------------------------------ the phone ------------------------------ */}
      {back < 0.995 ? (
        <g transform={`translate(540 ${1000 + 130 * back}) scale(${1 - 0.4 * back}) translate(-540 -1000)`} opacity={1 - back}>
          <ellipse cx={540} cy={PHY + PHH + 46} rx={300} ry={40} fill={`url(#${p}-sh)`} />
          <g transform={`translate(${PHX} ${PHY})`}>
            <rect x={10} y={10} width={PHW} height={PHH} rx={66} fill="#0B0C12" />
            <rect x={PHW - 2} y={230} width={10} height={130} rx={5} fill="#4A4E5A" /><rect x={-8} y={200} width={9} height={74} rx={4} fill="#6A6F7C" /><rect x={-8} y={292} width={9} height={120} rx={4} fill="#6A6F7C" />
            <rect width={PHW} height={PHH} rx={66} fill={`url(#${p}-ti)`} />
            <rect x={3} y={3} width={PHW - 6} height={PHH - 6} rx={63} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.35} />
            <rect x={6} y={6} width={PHW - 12} height={PHH - 12} rx={60} fill="#040408" />
          </g>
          <g transform={`translate(${SX} ${SY})`} clipPath={`url(#${p}-clip)`}>
            <rect width={SW} height={SH} fill={`url(#${p}-scr)`} />
            {/* the video: the six-agent wall */}
            {ALL.map((id, i) => {
              const b = bob(t, i), k = 1 + 0.08 * hop(t, tAgent + i * 1.6, 9);
              return <g key={id} transform={`translate(${90 + (i % 3) * 126} ${152 + Math.floor(i / 3) * 126 + b.dy * 0.25}) scale(${k})`}><Art id={id} cx={0} cy={0} size={112} /></g>;
            })}
            <text x={34} y={398} fontFamily={FONT} fontWeight={800} fontSize={36} fill="#FFFFFF">6 AI agents</text>
            <rect x={34} y={416} width={210} height={10} rx={5} fill="#FFFFFF" opacity={0.3} />
            {/* action buttons */}
            <g transform="translate(378 486)"><path d={HEART} fill="none" stroke="#FFFFFF" strokeWidth={5} transform="translate(0 6) scale(0.75)" /></g>
            <g transform="translate(378 572)"><rect x={-22} y={-18} width={44} height={34} rx={11} fill="none" stroke="#FFFFFF" strokeWidth={4.5} /><polygon points="-6,16 6,16 -10,28" fill="#FFFFFF" /></g>
            <g transform="translate(378 656)"><path d="M-20,14 L22,-16 L8,20 L0,4 Z" fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinejoin="round" /></g>
            <g transform={`translate(${BM.x} ${BM.y}) scale(${1 + 0.35 * decay(t, tSave, 5) - 0.12 * press})`}>
              <circle r={40} fill={AM} opacity={0.25 * (saved ? 1 : 0)} />
              <path d={BOOK} fill={saved ? AM : 'none'} stroke={saved ? AM : '#FFFFFF'} strokeWidth={4.5} strokeLinejoin="round" transform="scale(1.15)" />
            </g>
            <circle cx={50} cy={846} r={24} fill="#FFFFFF" opacity={0.25} /><rect x={86} y={832} width={150} height={12} rx={6} fill="#FFFFFF" opacity={0.4} /><rect x={86} y={854} width={230} height={10} rx={5} fill="#FFFFFF" opacity={0.22} />
            <rect x={24} y={900} width={SW - 48} height={5} rx={2.5} fill="#FFFFFF" opacity={0.2} /><rect x={24} y={900} width={(SW - 48) * (0.72 + 0.28 * Math.min(1, t / 150))} height={5} rx={2.5} fill="#FFFFFF" opacity={0.85} />
            {/* toasts */}
            {stamp > 0.01 ? (
              <g transform={`translate(176 ${492}) scale(${stamp})`}>
                <rect x={-104} y={-28} width={208} height={56} rx={28} fill="#0C0A14" stroke={AM} strokeWidth={3} />
                <path d={BOOK} fill={AM} transform="translate(-66 0) scale(0.8)" />
                <text x={20} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={31} fill="#FFFFFF">Saved</text>
              </g>
            ) : null}
            {t > tPay ? (
              <g transform={`translate(176 ${562}) scale(${sp(t, tPay, 'bouncy')})`}>
                <rect x={-148} y={-28} width={296} height={56} rx={28} fill="#FFFFFF" />
                <circle cx={-114} cy={0} r={19} fill={AM} stroke="#B8860B" strokeWidth={3} /><text x={-114} y={9} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill="#5A3E00">$</text>
                <text x={22} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#1A1030" opacity={0.3 + 0.7 * sp(t, tPay, 'pop')}>before you pay</text>
              </g>
            ) : null}
            {t > tBefore && t <= tPay ? <rect x={28} y={534} width={296 * smooth((t - tBefore) / 6)} height={56} rx={28} fill="#FFFFFF" opacity={0.2} /> : null}
            {/* big bookmark: fills, then drops into the button */}
            {stamp > 0.01 && stampGo < 1 ? (
              <g transform={`translate(${lerp(176, BM.x, stampGo)} ${lerp(690, BM.y, stampGo)}) scale(${stamp * lerp(4.2, 1.1, stampGo)})`} opacity={1 - stampGo * 0.4}>
                <path d={BOOK} fill={AM} stroke="#FFFFFF" strokeWidth={1.4} strokeLinejoin="round" />
              </g>
            ) : null}

            {/* comment sheet */}
            {sheet > 0.01 ? (
              <g transform={`translate(0 ${(1 - sheet) * 540})`}>
                <rect x={0} y={420} width={SW} height={560} rx={38} fill="#140E22" /><rect x={0} y={420} width={SW} height={560} rx={38} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.14} />
                <rect x={SW / 2 - 34} y={434} width={68} height={7} rx={3.5} fill="#FFFFFF" opacity={0.35} />
                <polygon points="44,628 80,628 40,662" fill="#B45CE0" />
                <rect x={22} y={462} width={388} height={172} rx={36} fill={`url(#${p}-bub)`} />
                <rect x={30} y={468} width={372} height={70} rx={30} fill="#FFFFFF" opacity={0.12} />
                <text x={44} y={534} fontFamily={FONT} fontWeight={800} fontSize={39} fill="#FFFFFF">
                  <tspan fillOpacity={0.25 + 0.75 * sp(t, tWhich, 'pop')}>Which </tspan><tspan fill={AM} fillOpacity={0.25 + 0.75 * sp(t, tOne, 'pop')}>one </tspan>
                  <tspan fillOpacity={0.25 + 0.75 * sp(t, tOne + 3.5, 'pop')}>would</tspan>
                </text>
                <text x={44} y={594} fontFamily={FONT} fontWeight={800} fontSize={39} fill="#FFFFFF">
                  <tspan fillOpacity={0.25 + 0.75 * sp(t, tOne + 7.5, 'pop')}>you </tspan><tspan fillOpacity={0.25 + 0.75 * sp(t, tTrust, 'pop')}>trust?</tspan>
                </text>
                <rect x={124} y={604} width={134 * sp(t, tTrust, 'pop')} height={7} rx={3.5} fill={AM} />
                {/* the six mascots as reaction chips */}
                {ALL.map((id, i) => {
                  const k = sp(t, tTrust + 1 + i * 1.6, 'bouncy'), b = bob(t, i, 1.2), on = Math.floor((t - tTrust) / 7) % 6 === i && t > tTrust + 12 ? 1 : 0;
                  if (k <= 0.01) return null;
                  return (
                    <g key={id} transform={`translate(${96 + (i % 3) * 120} ${712 + Math.floor(i / 3) * 106 + b.dy * 0.4}) scale(${k * (1 + 0.1 * on)}) rotate(${b.rot})`}>
                      <circle r={54} fill={AGENTS[id].glow} opacity={0.25 + 0.4 * on} />
                      <Art id={id} cx={0} cy={0} size={92} round ring={on} />
                    </g>
                  );
                })}
                {/* inbox badge */}
                <g transform={`translate(384 470) scale(${sp(t, tInbox, 'bouncy')})`}>
                  <circle r={36} fill="#FFFFFF" /><rect x={-20} y={-13} width={40} height={27} rx={5} fill="none" stroke="#2A1658" strokeWidth={4} /><path d="M-19,-11 L0,4 L19,-11" fill="none" stroke="#2A1658" strokeWidth={4} strokeLinejoin="round" />
                  <circle cx={24} cy={-24} r={11} fill="#FF4D5E" stroke="#FFFFFF" strokeWidth={3} />
                </g>
                {/* comment field */}
                <rect x={18} y={866} width={396} height={54} rx={27} fill="#241A38" stroke={tell > 0.5 ? PINK : '#FFFFFF'} strokeWidth={2 + 2 * tell} opacity={1} strokeOpacity={0.3 + 0.7 * tell} />
                <text x={46} y={903} fontFamily={FONT} fontWeight={500} fontSize={30} fill="#FFFFFF" opacity={0.5 + 0.4 * tell}>Add a comment…</text>
                {tell > 0.5 && Math.floor(t / 8) % 2 === 0 ? <rect x={36} y={878} width={3.5} height={30} fill={PINK} /> : null}
                <circle cx={384} cy={893} r={19} fill={PINK} opacity={0.3 + 0.7 * tell} /><path d="M378,893 H390 M385,887 L391,893 L385,899" fill="none" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : null}
            <rect x={SW / 2 - 62} y={18} width={124} height={34} rx={17} fill="#040408" />
            <rect width={SW} height={SH} fill={`url(#${p}-refl)`} />
          </g>
          {/* 'below' */}
          {t > tBelow ? [0, 1, 2].map((k) => {
            const bnc = Math.sin(t * 0.3 - k * 0.8) * 8, o = sp(t, tBelow + k * 2, 'pop');
            return <path key={k} d={`M${540 - 46},${1512 + k * 30 + bnc} L540,${1540 + k * 30 + bnc} L${540 + 46},${1512 + k * 30 + bnc}`} fill="none" stroke={k === 2 ? '#FFFFFF' : PINK} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={o * (0.5 + 0.25 * k)} />;
          }) : null}
        </g>
      ) : null}
      <Burst t={t} at={tSave} x={SX + BM.x} y={SY + BM.y} color={AM} n={18} r={260} />
      <Burst t={t} at={tInbox} x={SX + 384} y={SY + 470} color="#FFFFFF" n={12} r={150} />
      {t > tSave && t < tSave + 18 ? Array.from({length: 8}).map((_, i) => {
        const q = (t - tSave) / 18, a = -Math.PI / 2 + (rnd(i * 2.3) - 0.5) * 2.4, d = (90 + rnd(i * 3.7) * 220) * outC(q);
        return <path key={i} d={BOOK} fill={i % 2 ? AM : '#FFFFFF'} opacity={1 - q} transform={`translate(${SX + BM.x + Math.cos(a) * d} ${SY + BM.y + Math.sin(a) * d}) scale(${0.5 + rnd(i) * 0.5})`} />;
      }) : null}
      <Finger p={p} x={SX + BM.x + 10 + (1 - fIn) * 260 + fOut * 300} y={SY + BM.y + 14 + (1 - fIn) * 420 + fOut * 520 - press * 10} s={0.36} press={press} o={(1 - fOut) * (1 - back)} />
      {ALL.map((id, i) => <Burst key={id} t={t} at={tBack + i * 2 + 22} x={wall(i).x} y={wall(i).y + WALL_H / 2} color={AGENTS[id].glow} n={8} r={130} />)}
      {t > tTrust && t < tTrust + 30 ? Array.from({length: 6}).map((_, i) => {
        const q = (t - tTrust - i * 2) / 18;
        return q > 0 && q < 1 ? <path key={i} d={HEART} fill={PINK} opacity={1 - q} transform={`translate(${SX + 96 + (i % 3) * 120 + 34} ${SY + 690 + Math.floor(i / 3) * 106 - q * 70}) scale(${0.5 + 0.3 * q})`} /> : null;
      }) : null}
    </svg>
  );
};

export const s10World: WorldDef = {
  id: 's10', home: 'phone',
  anchors: {phone: {x: 540, y: 960, zoom: Z}},
  palette: {bg0: '#0D0518', bg1: '#3A1260', particles: '#FFC6F0', glow: '#FF6FCF'},
  Draw,
};
