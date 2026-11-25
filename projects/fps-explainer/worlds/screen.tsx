// Screen worlds (agent A): S01 'Flipbook' hook here; S02 'Two machines' in screen_factory.tsx; S11 payoff and
// S12 CTA in screen_end.tsx. Shared art (phone, frame cards, gauges, CSS-3D helpers) in screen_kit.tsx.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, Burst} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {clamp01, lerp, smooth, easeIO, outC, rnd, tri, rampInt, decay, CY, MG, RED, INK, FONT, MONO,
        Stage3, L3, t3, rX, rY, rZ, Defs, FrameArt, FrameCard, Phone3D, CW, CH} from './screen_kit';
import {S02} from './screen_factory';
import {S11, S12} from './screen_end';

// =====================================================================================================================
// S01 - Flipbook. A big tilted phone "plays a video"; on 'flipping' the picture stays in the air while the phone
// drops back, fans out into a stack of frame cards and riffles like a flipbook; a counter lands 60 -> 120 -> 144 Hz.
// =====================================================================================================================
const id = 's01';
const WW = 2600, WH = 3200;
const PW = 780, PH = 1600, BZ = 22, SW = PW - 2 * BZ;
const NF = 14;                                   // stills from one side of the bounce to the other
const frameP = (n: number) => tri(n / NF);
const frameDir = (n: number) => ((((n % (2 * NF)) + 2 * NF) % (2 * NF)) < NF ? 1 : -1);
const PAN = {x: (SW - CW) / 2, y: 380};          // the picture panel on the phone screen (CW x CH)
const SPINE_LOCAL = PAN.y + CH + BZ - PH / 2;    // panel bottom, measured from the phone centre
const BOOK = {x: 1300, y: 1890};                 // where the flipbook's spine ends up
const K = 9;

const pose = (t: number, tFlip: number) => {
  const lift = easeIO((t - tFlip) / 20), intro = 1 - outC(t / 46);
  return {
    lift,
    rz: lerp(-6, -2, lift),
    rx: lerp(9 + 2 * Math.sin(t / 41), 64, lift),
    ry: lerp(-21 + 5 * Math.sin(t / 33 + 0.6) - 15 * intro, -5, lift),
    cx: 1300 + 70 * intro, cy: lerp(1650, 2420, lift), sc: lerp(1, 0.9, lift),
  };
};

const S01Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tScr = wordAt(beats, 'screen', 6), tIsnt = wordAt(beats, "isn't", 13.5), tPlay = wordAt(beats, 'playing', 19), tVid = wordAt(beats, 'video', 28.5);
  const tFlip = wordAt(beats, 'flipping', 56.5), tStill = wordAt(beats, 'still', 66.5), tPic = wordAt(beats, 'pictures', 73);
  const t60 = wordAt(beats, '60', 102), t120 = wordAt(beats, '120', 116.5), tEven = wordAt(beats, 'even', 146.5), t144 = wordAt(beats, '144', 155.5);
  const tEvery = wordAt(beats, 'every', 177), tSec = wordAt(beats, 'second', 183.5);
  const lifted = t >= tFlip;
  const ph = pose(t, tFlip), p0 = pose(tFlip, tFlip);
  const phoneTf = `${t3(ph.cx, ph.cy)} ${rZ(ph.rz)} ${rX(ph.rx)} ${rY(ph.ry)} scale(${ph.sc.toFixed(4)}) ${t3(-PW / 2, -PH / 2)}`;

  // the "video": smooth until 'video', then visibly stepped stills (one every 3 frames); index 0 at 'flipping'
  const vidN = (t - tFlip) / 3;
  const stepped = t >= tVid;
  const curN = stepped ? Math.floor(vidN) : vidN;
  const ghosts = stepped ? Math.round(5 * sp(t, tVid, 'pop')) : 0;
  const strike = sp(t, tIsnt, 'pop'), playP = sp(t, tPlay, 'pop'), stills = sp(t, tVid, 'pop');
  const rim = Math.max(decay(t, tScr, 9), decay(t, tVid, 7) * 0.8, decay(t, tFlip, 9));

  // ---- the flipbook -------------------------------------------------------------------------------------------------
  const b = easeIO((t - tFlip) / 20);
  const r0 = (p0.rx * Math.PI) / 180, z0 = (p0.rz * Math.PI) / 180;
  const sx0 = p0.cx - SPINE_LOCAL * Math.cos(r0) * Math.sin(z0), sy0 = p0.cy + SPINE_LOCAL * Math.cos(r0) * Math.cos(z0), sz0 = SPINE_LOCAL * Math.sin(r0);
  const bookTf = `${t3(lerp(sx0, BOOK.x, b), lerp(sy0, BOOK.y, b), lerp(sz0, 0, b))} ${rZ(lerp(p0.rz, 0, b))} ${rX(lerp(p0.rx, -14, b))} ${rY(lerp(p0.ry, -24, b))}`;
  const spread = smooth((t - tFlip - 7) / 10);
  const splay = smooth((t - tStill + 3) / 7) * (1 - smooth((t - tPic + 2) / 9));
  const dz = spread * lerp(96, 56, smooth((t - tPic) / 16));
  const f = 0.1 * rampInt(t, tPic + 2, 10) + 0.07 * rampInt(t, t60, 8) + 0.17 * rampInt(t, t120, 8) + 0.07 * rampInt(t, t144, 8);
  const fi = Math.floor(f), fr = f - fi;
  const cards: React.ReactNode[] = [];
  if (lifted) {
    for (let k = K - 1; k >= -3; k--) {
      const n = fi + k;
      if (n < 0) continue;
      const q = k - fr;
      let depth = 0, phi = -4 * spread, o = 1, zf = 0;
      if (q >= 0) {
        depth = q * dz;
        if (q > 0) o = Math.min(spread, clamp01(K - 1 - q) + (f < 0.01 ? 1 : 0));
      } else {
        const e = -q / 3;
        phi = lerp(-4, 118, Math.pow(e, 1.5));
        zf = 30 * e;
        o = 1 - smooth((e - 0.5) / 0.45);
      }
      if (o < 0.01) continue;
      const sq = q - 4;
      const tf = `${bookTf} ${t3(sq * 112 * splay, -Math.abs(sq) * 14 * splay, -depth + zf)} ${rZ(sq * 4.2 * splay)} ${rX(-phi)} ${t3(-CW / 2, -CH)}`;
      cards.push(
        <L3 key={n} tf={tf} w={CW} h={CH} o={o}>
          <FrameCard id={id} p={frameP(n)} dir={frameDir(n)} pip={n} fog={clamp01(q * 0.075) * (1 - splay * 0.8)} hot={q < 0.5 ? 1 : 0.2} ghosts={q < 1 ? 2 : 0} />
        </L3>,
      );
    }
  }

  // ---- counter ------------------------------------------------------------------------------------------------------
  const nums: [string, number][] = [['60', t60], ['120', t120], ['144', t144]];
  const rail = sp(t, tPic + 10, 'settle');
  const every = sp(t, tEvery, 'pop'), second = sp(t, tSec, 'bouncy');
  const antic = smooth((t - tEven) / 5) * (1 - smooth((t - t144) / 3));
  const beam = smooth((t - tFlip - 6) / 14);
  const CX = 1300, CYN = 930;
  const sweepQ = (((t - tEvery) / 20) % 1 + 1) % 1;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}}>
      <Defs id={id} />
      {/* ---------------- stage ---------------- */}
      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <circle cx={1300} cy={1500} r={1500} fill={`url(#${id}-gv)`} opacity={0.8} />
        <circle cx={1300} cy={lerp(1700, 2380, ph.lift)} r={1000} fill={`url(#${id}-gc)`} opacity={0.3 + 0.2 * ph.lift} />
        <circle cx={1900} cy={900} r={800} fill={`url(#${id}-gm)`} opacity={0.22} />
        {/* floor rings */}
        {[0, 1, 2, 3, 4].map((k) => <ellipse key={k} cx={1300} cy={2560} rx={420 + k * 240} ry={(420 + k * 240) * 0.2} fill="none" stroke={k % 2 ? MG : CY} strokeWidth={3} opacity={0.34 - k * 0.055} />)}
        {/* drifting out-of-focus frame cards */}
        {Array.from({length: 16}).map((_, i) => {
          const x = 150 + rnd(i * 2.1) * 2300, y = 500 + rnd(i * 4.3) * 2300 + Math.sin(t * 0.045 + i * 1.7) * 30 - t * (0.25 + rnd(i) * 0.4);
          const s = 0.5 + rnd(i * 7) * 0.9, pp = frameP(i * 2 + Math.floor(t / 6));
          return (
            <g key={i} transform={`translate(${x},${y}) rotate(${(rnd(i) - 0.5) * 36}) scale(${s})`} opacity={0.2 + rnd(i * 5) * 0.14}>
              <rect width={180} height={216} rx={16} fill="#1A1668" stroke={i % 2 ? MG : CY} strokeWidth={4} />
              <line x1={0} y1={160} x2={180} y2={160} stroke={CY} strokeWidth={2} opacity={0.7} />
              <circle cx={30 + pp * 120} cy={146 - Math.abs(Math.sin(pp * Math.PI * 3)) * 100} r={14} fill={CY} />
            </g>
          );
        })}
        {/* light from the phone up into the flipbook */}
        {beam > 0.01 ? <polygon points={`${1300 - 250},${2400} ${1300 + 250},${2400} ${BOOK.x + 400},${BOOK.y - 30} ${BOOK.x - 330},${BOOK.y - 30}`} fill={`url(#${id}-beam)`} opacity={beam * (0.75 + 0.2 * Math.sin(t * 0.5))} style={{mixBlendMode: 'screen'}} /> : null}
        <ellipse cx={1300} cy={lerp(2560, 2600, ph.lift)} rx={620} ry={110} fill={`url(#${id}-sh)`} opacity={0.9} />
      </svg>

      {/* ---------------- phone + flipbook (CSS 3D) ---------------- */}
      <Stage3 w={WW} h={WH} ox={1300} oy={1500}>
        <Phone3D id={id} tf={phoneTf} w={PW} h={PH} rim={stepped && !lifted ? MG : CY} rimO={rim}>
          {/* header: VIDEO -> struck out -> STILLS */}
          <g transform="translate(46,214)">
            <rect width={stills > 0.5 ? 236 : 214} height={70} rx={35} fill={stills > 0.5 ? 'rgba(43,228,255,0.16)' : 'rgba(255,255,255,0.09)'} stroke={stills > 0.5 ? CY : 'rgba(255,255,255,0.3)'} strokeWidth={3} />
            <circle cx={38} cy={35} r={11} fill={stills > 0.5 ? CY : RED} opacity={stills > 0.5 ? 1 : 0.6 + 0.4 * Math.sin(t * 0.5)} />
            <text x={62} y={48} fontFamily={FONT} fontWeight={800} fontSize={36} fill="#FFFFFF" letterSpacing={2}>{stills > 0.5 ? 'STILLS' : 'VIDEO'}</text>
            {strike > 0.01 && stills <= 0.5 ? <line x1={-10} y1={35} x2={-10 + 236 * strike} y2={35} stroke={RED} strokeWidth={9} strokeLinecap="round" /> : null}
          </g>
          <rect x={300} y={228} width={250} height={16} rx={8} fill="#FFFFFF" opacity={0.3} /><rect x={300} y={258} width={170} height={12} rx={6} fill="#FFFFFF" opacity={0.16} />
          <rect x={46} y={318} width={SW - 92} height={3} fill="#FFFFFF" opacity={0.08} />
          {/* the picture panel */}
          <g transform={`translate(${PAN.x},${PAN.y})`}>
            {lifted ? (
              <>
                <rect width={CW} height={CH} rx={34} fill="#04051A" stroke={CY} strokeWidth={5} strokeDasharray="26 18" strokeDashoffset={-t * 3} />
                <circle cx={CW / 2} cy={CH / 2} r={420} fill={`url(#${id}-gw)`} opacity={Math.min(1, 0.5 + 0.2 * Math.sin(t * 0.6) + decay(t, tFlip, 5))} />
                {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect key={k} x={60 + k * 76} y={CH - 40 - ((t * 9 + k * 97) % (CH - 80))} width={8} height={90} rx={4} fill="#FFFFFF" opacity={0.5} />)}
              </>
            ) : (
              <>
                <rect x={-8} y={-8} width={CW + 16} height={CH + 16} rx={42} fill={`url(#${id}-edge)`} opacity={0.5 + 0.5 * decay(t, tVid, 6)} />
                <g clipPath={`url(#${id}-cclip)`}>
                  <FrameArt id={id} w={CW} h={CH} p={frameP(curN)} dir={frameDir(curN)} ghosts={ghosts} gstep={1 / NF} trail={stepped ? 0 : 9} />
                  <polygon points={`${-260 + (t - tScr) * 62},0 ${-120 + (t - tScr) * 62},0 ${-320 + (t - tScr) * 62},${CH} ${-460 + (t - tScr) * 62},${CH}`} fill="#FFFFFF" opacity={t > tScr ? 0.16 : 0} />
                  <rect width={CW} height={CH} fill={`url(#${id}-refl)`} />
                </g>
              </>
            )}
          </g>
          {/* progress: a smooth bar that turns into separate ticks */}
          <g transform="translate(60,1150)">
            <rect width={SW - 120} height={12} rx={6} fill="#FFFFFF" opacity={0.12} />
            {playP < 0.5
              ? <><rect width={(SW - 120) * frameP(curN)} height={12} rx={6} fill={`url(#${id}-btn)`} /><circle cx={(SW - 120) * frameP(curN)} cy={6} r={15} fill="#FFFFFF" /></>
              : Array.from({length: NF + 1}).map((_, i) => {
                const on = Math.abs(Math.round(frameP(Math.floor(vidN)) * NF) - i) < 0.5;
                return <rect key={i} x={i * ((SW - 120) / (NF + 1)) + 4} y={on ? -12 : -2} width={(SW - 120) / (NF + 1) - 8} height={on ? 36 : 16} rx={5} fill={on ? CY : '#FFFFFF'} opacity={on ? 1 : 0.3} />;
              })}
          </g>
          {/* transport */}
          <g transform={`translate(${SW / 2},1290)`}>
            <circle r={66 * (1 + 0.22 * decay(t, tPlay, 5))} fill={`url(#${id}-btn)`} /><circle r={62} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.4} />
            {playP < 0.5 ? <polygon points="-18,-28 -18,28 30,0" fill="#FFFFFF" /> : <><rect x={-24} y={-26} width={16} height={52} rx={4} fill="#FFFFFF" /><rect x={8} y={-26} width={16} height={52} rx={4} fill="#FFFFFF" /></>}
            {[-1, 1].map((s) => <g key={s} transform={`translate(${s * 190},0) scale(${s},1)`} opacity={0.6}><circle r={40} fill="rgba(255,255,255,0.08)" /><polygon points="-12,-16 -12,16 10,0" fill="#FFFFFF" /><rect x={10} y={-16} width={6} height={32} fill="#FFFFFF" /></g>)}
          </g>
          <rect x={60} y={1410} width={380} height={16} rx={8} fill="#FFFFFF" opacity={0.2} /><rect x={60} y={1442} width={250} height={12} rx={6} fill="#FFFFFF" opacity={0.12} />
          <rect x={SW / 2 - 120} y={1520} width={240} height={9} rx={4.5} fill="#FFFFFF" opacity={0.6} />
        </Phone3D>
        {cards}
      </Stage3>

      {/* ---------------- counter + effects ---------------- */}
      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {lifted && t < tFlip + 8 ? <circle cx={sx0} cy={sy0 - 360} r={260 + (t - tFlip) * 50} fill={`url(#${id}-gw)`} opacity={0.9 * (1 - (t - tFlip) / 8)} /> : null}
        <Burst t={t} at={tFlip} x={sx0} y={sy0 - 360} color="#BFF6FF" n={22} r={760} />
        {rail > 0.01 ? (
          <g>
            <ellipse cx={CX} cy={CYN - 70} rx={560} ry={210} fill={`url(#${id}-gc)`} opacity={0.35 * rail + 0.3 * Math.max(decay(t, t60, 8), decay(t, t120, 8), decay(t, t144, 8))} />
            {nums.map(([n, at], i) => {
              if (t < at) return null;
              const nx = nums[i + 1]?.[1] ?? 1e9, out = smooth((t - nx + 1) / 4);
              if (out >= 1) return null;
              const a = sp(t, at, 'pop'), shake = i === 1 ? antic : 0;
              return (
                <g key={n} transform={`translate(${CX + Math.sin(t * 2.4) * 5 * shake},${CYN - 62 * (1 - a) + 70 * out}) scale(${(1.7 - 0.7 * a) * (1 - 0.07 * shake)})`} opacity={Math.min(1, a * 2.2) * (1 - out)}>
                  <text x={60} y={0} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={212} fill={MG} opacity={0.5} transform="translate(5,6)">{n}</text>
                  <text x={60} y={0} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={212} fill="#FFFFFF">{n}</text>
                  <text x={84} y={0} fontFamily={FONT} fontWeight={800} fontSize={108} fill={CY}>Hz</text>
                </g>
              );
            })}
            {t < t60 ? <text x={CX} y={CYN - 20} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={46} fill="#BFD0FF" opacity={0.75 * rail} letterSpacing={10}>PICTURES / SECOND</text> : null}
            {/* rail: 60 / 120 / 144, then "every second" */}
            <g transform={`translate(${CX},${CYN + 50})`} opacity={rail}>
              {nums.map(([n, at], i) => {
                const on = t >= at, a = sp(t, at, 'pop'), hot = i === 2 ? antic : 0;
                const x = (i - 1) * 196 - every * 150;
                return (
                  <g key={n} transform={`translate(${x},0) scale(${1 + 0.1 * decay(t, at, 6) + 0.08 * hot * Math.sin(t * 1.4)})`}>
                    <rect x={-84} y={-30} width={168} height={60} rx={30} fill={on ? (i === 2 ? MG : CY) : 'rgba(255,255,255,0.07)'} stroke={on ? '#FFFFFF' : 'rgba(255,255,255,0.3)'} strokeWidth={3} opacity={on ? 0.35 + 0.65 * a : 1} />
                    <text y={13} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={36} fill={on ? INK : '#C9D4FF'}>{n}</text>
                  </g>
                );
              })}
              {every > 0.01 ? (
                <g transform={`translate(${310 + 60 * (1 - every)},0)`} opacity={Math.min(1, every * 1.5)}>
                  <circle cx={-60} cy={0} r={27} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.4} />
                  <path d={`M-60,-27 A27,27 0 ${sweepQ > 0.5 ? 1 : 0} 1 ${(-60 + 27 * Math.sin(sweepQ * 2 * Math.PI)).toFixed(2)},${(-27 * Math.cos(sweepQ * 2 * Math.PI)).toFixed(2)}`} fill="none" stroke={CY} strokeWidth={7} strokeLinecap="round" />
                  <text x={-14} y={14} fontFamily={MONO} fontWeight={600} fontSize={40} fill="#FFFFFF" letterSpacing={3}>EVERY</text>
                  <text x={136} y={14} fontFamily={MONO} fontWeight={600} fontSize={40} fill={CY} letterSpacing={3} opacity={second}>SECOND</text>
                </g>
              ) : null}
            </g>
          </g>
        ) : null}
        <Burst t={t} at={t60} x={CX} y={CYN - 80} color={CY} n={18} r={420} />
        <Burst t={t} at={t120} x={CX} y={CYN - 80} color="#FFFFFF" n={20} r={470} />
        <Burst t={t} at={t144} x={CX} y={CYN - 80} color={MG} n={24} r={540} />
        <Burst t={t} at={tSec} x={CX + 380} y={CYN + 50} color={CY} n={12} r={200} />
        {/* speed streaks off the riffling cards */}
        {t > t60 ? Array.from({length: 10}).map((_, i) => {
          const q = (t * (0.05 + 0.02 * rnd(i)) + rnd(i * 3)) % 1, x = BOOK.x - 380 + rnd(i * 5) * 760;
          return <line key={i} x1={x} y1={BOOK.y - CH * 0.9 * q + 60} x2={x} y2={BOOK.y - CH * 0.9 * q - 40} stroke={i % 2 ? CY : '#FFFFFF'} strokeWidth={4} strokeLinecap="round" opacity={0.5 * Math.sin(q * Math.PI) * smooth((t - t60) / 10)} />;
        }) : null}
      </svg>
    </div>
  );
};

const S01: WorldDef = {
  id: 'S01-flipbook', home: 'screen',
  anchors: {
    screen: {x: 1300, y: 1490, zoom: 0.9},
    pictures: {x: 1300, y: 1440, zoom: 0.7},
  },
  palette: {bg0: '#04021A', bg1: '#2A1870', particles: '#C9B8FF', glow: '#8E6BFF'},
  Draw: S01Draw,
};

export const screenWorlds = {S01, S02, S11, S12};
