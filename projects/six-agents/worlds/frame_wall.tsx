// S01 hook (rebuilt 25 Nov: "a big picture change about every 0.5 s"). TRUE screen px (anchor y = FY).
//  0.0-1.8 s  one FULL-SCREEN hero per word: Six -> Iggy (Dots), AI -> Muse, agents -> Grok Bot, now -> Claude Duet,
//             real -> OpenClaw, work -> Hermes (whip-in from alternating sides, colour flood, name big, 1..6 count)
//  'for you'  all six snap into a BIG 3 x 2 wall, "working" pills on
//  'even while you sleep'  lights out: the wall glows in the dark, a clock spins 11 PM -> 7 AM
//  pause      tasks finish card by card: green flash + "Done" (six events)
//  'Same promise'  every card FLIPS to the same back: "Works for you 24/7" (+ one glint on 'promise')
//  pause      cards flip back, start to shake
//  'Very different deals'  slam into a sorted PRICE LADDER, one tag stamped per beat, Dots last on 'deals'
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, Burst} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {AGENTS, ASSETS, FONT, MONO, SvgImg, bob, usePreload, type AgentId} from './shared';
import {Z, FY, ALL, GREEN, Card, Art, GlowDefs, Spark, Tick, RoomBack, WALL_W, WALL_H, wallSlot,
        clamp01, lerp, smooth, outC, rnd, decay, hop} from './frame_kit';

const p = 's01';
const HERO: {id: AgentId; word: string; d: number; tile: boolean}[] = [
  {id: 'dots', word: 'six', d: -1, tile: true}, {id: 'muse', word: 'ai', d: 9, tile: true}, {id: 'grok', word: 'agents', d: 18, tile: false},
  {id: 'duet', word: 'now', d: 27, tile: false}, {id: 'openclaw', word: 'real', d: 38, tile: false}, {id: 'hermes', word: 'work', d: 45.5, tile: true},
];
// price ladder, cheapest first (facts exactly as in the brief)
const LADDER: {id: AgentId; tag: string; free?: boolean; w: number}[] = [
  {id: 'openclaw', tag: 'FREE', free: true, w: 690}, {id: 'hermes', tag: 'FREE', free: true, w: 690},
  {id: 'muse', tag: 'Free · $20 · $100', w: 800}, {id: 'duet', tag: '$20 (in Claude Pro)', w: 900},
  {id: 'grok', tag: '$30 and up', w: 940}, {id: 'dots', tag: '$100+/mo', w: 980},
];
const ROW_H = 186, rowY = (i: number) => 392 + i * 203;
const CLK = {x: 300, y: 1486, r: 84};

const Hero: React.FC<{k: number; t: number; at: number; out: number}> = ({k, t, at, out}) => {
  const h = HERO[k], a = AGENTS[h.id], dir = k % 2 ? 1 : -1;
  const e = outC((t - at + 3) / 6), o = out;              // in: whip + scale; out: thrown the other way
  const x = 540 + dir * 1100 * (1 - e) - dir * 1300 * o, sc = lerp(1.7, 1, e) * (1 + 0.012 * (t - at)) * (1 - 0.2 * o);
  const b = bob(t * 2.2, k, 1.6), size = h.tile ? 850 : 840;
  const nk = sp(t, at - 2, 'pop');
  return (
    <g opacity={1 - o}>
      <text x={540 - dir * 250} y={1150} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={1250} fill="#FFFFFF" opacity={0.1 + 0.25 * decay(t, at, 4)}
        transform={`translate(${-dir * 60 * (1 - e)} 0)`}>{k + 1}</text>
      <g transform={`translate(${x} ${790 + b.dy}) rotate(${dir * 14 * (1 - e) + b.rot * 0.6}) scale(${sc})`}>
        <circle r={560} fill={`url(#${p}-g-${h.id})`} />
        {h.tile ? (
          <g>
            <rect x={-size / 2 + 14} y={-size / 2 + 24} width={size} height={size} rx={90} fill="#000" opacity={0.45} />
            <SvgImg src={a.art} x={-size / 2} y={-size / 2} w={size} h={size} fit="cover" radius={90} />
            <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={90} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={0.85} />
          </g>
        ) : (
          <g>
            <ellipse cx={0} cy={size * 0.5} rx={size * 0.36} ry={34} fill="#000" opacity={0.4} />
            <g transform={`scale(${b.sx} ${b.sy})`}><SvgImg src={a.art} x={-size / 2} y={-size / 2} w={size} h={size} /></g>
          </g>
        )}
      </g>
      <g transform={`translate(540 1392) scale(${0.5 + 0.5 * nk})`} opacity={Math.min(1, nk * 2)}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={a.name.length > 8 ? 142 : 176} fill="#FFFFFF" letterSpacing={-4}
          stroke={a.deep} strokeWidth={10} paintOrder="stroke">{a.name}</text>
        <text x={0} y={74} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={42} fill="#FFFFFF" opacity={0.9} letterSpacing={6}>{a.maker.toUpperCase()}</text>
      </g>
    </g>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  usePreload(ALL.map((id) => AGENTS[id].art).concat([ASSETS.grokBots[7]]));
  const tH = HERO.map((h, i) => (i === 0 ? 1.5 : wordAt(beats, h.word, h.d)));   // hero 1 is mid-slam on frame 0
  const tWall = 53, tEven = wordAt(beats, 'even', 69), tWhile = wordAt(beats, 'while', 75.5), tSleep = wordAt(beats, 'sleep', 85.5);
  const tSame = wordAt(beats, 'same', 125), tProm = wordAt(beats, 'promise', 133), tBackFlip = 146, tShake = 151, tVery = 165;
  const tDiff = wordAt(beats, 'different', 172.5), tDeals = wordAt(beats, 'deals', 181.5);
  const tDone = (i: number) => 90 + i * 6;
  const tStamp = (i: number) => lerp(tDiff, tDeals, i / 5);

  let hk = 0;
  tH.forEach((x, i) => { if (t >= x - 3) hk = i; });
  const heroOn = t < tWall + 5;
  const wallIn = (i: number) => outC((t - tWall - i * 0.9) / 6);
  const n = 0.35 * smooth((t - tEven) / 5) + 0.2 * smooth((t - tWhile) / 5) + 0.45 * smooth((t - tSleep + 1) / 4) - 0.55 * smooth((t - 116) / 12);
  const dark = smooth((t - tSleep + 1) / 3) * (1 - smooth((t - 116) / 10));
  const hours = 8 * (0.42 * smooth((t - tEven) / (tSleep + 4 - tEven)) + 0.58 * smooth((t - tSleep - 4) / 30));   // 11 PM + hours
  const hr = (23 + Math.floor(hours + 0.02)) % 24, label = `${hr % 12 === 0 ? 12 : hr % 12} ${hr < 12 ? 'AM' : 'PM'}`;
  const clk = sp(t, tEven - 2, 'bouncy') * (1 - smooth((t - 140) / 8));
  const ladder = smooth((t - tVery) / 5);
  const glint = (t - tProm) / 13, glintX = lerp(-360, 1400, clamp01(glint));
  const shake = smooth((t - tShake) / 13) * (1 - ladder);
  const fa = AGENTS[HERO[hk].id];

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <GlowDefs p={p} />
      <defs>
        <linearGradient id={`${p}-flood`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor={fa.accent} /><stop offset="0.6" stopColor={fa.deep} /><stop offset="1" stopColor="#05050A" /></linearGradient>
        <linearGradient id={`${p}-back`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8E6BFF" /><stop offset="0.5" stopColor="#FF6FAE" /><stop offset="1" stopColor="#FFB45C" /></linearGradient>
        <linearGradient id={`${p}-strip`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1B2460" /><stop offset="1" stopColor="#070A22" /></linearGradient>
        <clipPath id={`${p}-cards`}>{ALL.map((_, i) => { const s = wallSlot(i); return <rect key={i} x={s.x - WALL_W / 2} y={s.y - WALL_H / 2} width={WALL_W} height={WALL_H} rx={WALL_W * 0.09} />; })}</clipPath>
      </defs>

      <RoomBack p={p} n={clamp01(n)} t={t} />
      <rect x={-700} y={-700} width={2480} height={3400} fill="#02030C" opacity={0.5 * dark} />
      {dark > 0.02 ? Array.from({length: 40}).map((_, i) => (
        <circle key={i} cx={-30 + rnd(i * 2.7) * 1140} cy={300 + rnd(i * 4.9) * 1350} r={1.8 + rnd(i * 8.1) * 2.8} fill="#FFFFFF" opacity={dark * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.12 + i * 1.7)))} />
      )) : null}

      {/* ---------------- 1. six full-screen heroes, one per word ---------------- */}
      {heroOn ? (
        <g opacity={1 - smooth((t - tWall) / 4)}>
          <rect x={-700} y={-700} width={2480} height={3400} fill={`url(#${p}-flood)`} />
          {/* speed streaks */}
          {Array.from({length: 14}).map((_, i) => {
            const q = ((t * 0.09 + rnd(i * 3.1)) % 1), dir = hk % 2 ? -1 : 1;
            return <rect key={i} x={540 + dir * (900 - q * 1900) - 160} y={300 + rnd(i * 5.3) * 1350} width={320} height={5 + rnd(i) * 7} rx={4} fill="#FFFFFF" opacity={0.16 * Math.sin(q * Math.PI)} />;
          })}
          <rect x={-700} y={-700} width={2480} height={3400} fill="#FFFFFF" opacity={0.4 * decay(t, tH[hk] - 2, 2.2)} />
          {hk > 0 && t < tH[hk] + 4 ? <Hero k={hk - 1} t={t} at={tH[hk - 1]} out={outC((t - tH[hk] + 3) / 4)} /> : null}
          <Hero k={hk} t={t} at={tH[hk]} out={outC((t - tWall + 2) / 4)} />
          {/* 1..6 pips */}
          {HERO.map((_, i) => <rect key={i} x={540 - 177 + i * 62} y={1508} width={44} height={12} rx={6} fill="#FFFFFF" opacity={i <= hk ? 1 : 0.25} />)}
        </g>
      ) : null}

      {/* ---------------- 2-5. the big wall ---------------- */}
      {t >= tWall && ladder < 1 ? (
        <g>
          {ALL.map((id, i) => { const s = wallSlot(i); return <ellipse key={id} cx={s.x} cy={s.y} rx={270} ry={330} fill={`url(#${p}-g-${id})`} opacity={(0.3 + 0.55 * dark + 0.3 * shake + 0.1 * Math.sin(t * 0.12 + i)) * wallIn(i) * (1 - ladder)} />; })}
          {ALL.map((id, i) => {
            const a = AGENTS[id], s = wallSlot(i), e = wallIn(i);
            if (e <= 0.001) return null;
            const done = t >= tDone(i), dk = sp(t, tDone(i), 'bouncy');
            // flip: front -> back on 'same', back -> front in the pause
            const f1 = clamp01((t - tSame - i * 0.7) / 7), f2 = clamp01((t - tBackFlip - i * 0.7) / 7);
            const ang = (f1 - f2) * Math.PI, fx = Math.cos(ang), isBack = fx < 0;
            const sh = shake * (1 + 0.8 * smooth((t - 160) / 5));
            const x = lerp(540, s.x, e) + Math.sin(t * 3.3 + i * 2.1) * 9 * sh, y = lerp(790, s.y, e) - hop(t, tDone(i), 8) * 20 + Math.cos(t * 2.9 + i) * 6 * sh + Math.sin(t * 0.07 + i * 1.7) * 4;
            const pass = glint >= 0 && glint <= 1 ? Math.max(0, 1 - Math.abs(glintX - s.x) / 280) : 0;
            const sc = lerp(2.4, 1, e) * (1 + 0.05 * decay(t, tWall + i * 0.9 + 6, 4)) * (1 + 0.04 * shake) * (1 - 0.5 * ladder);
            const pill = sp(t, tWall + 6 + i, 'bouncy');
            return (
              <g key={id} opacity={1 - ladder} transform={`translate(${x} ${y}) rotate(${Math.sin(t * 2.6 + i * 1.3) * 3.2 * sh}) scale(${Math.max(0.03, Math.abs(fx)) * sc} ${sc}) translate(${-x} ${-y})`}>
                {!isBack ? (
                  <Card id={id} uid={p + id} w={WALL_W} t={t} cx={x} cy={y} glow={Math.max(decay(t, tWall + i * 0.9 + 5, 6), 0.75 * dark, decay(t, tDone(i), 8), shake)}>
                    {done ? <rect x={0} y={0} width={WALL_W} height={WALL_H} rx={WALL_W * 0.09} fill={GREEN} opacity={0.55 * decay(t, tDone(i), 5)} /> : null}
                    <g transform={`translate(${WALL_W / 2} ${WALL_W * 1.3}) scale(${pill * (1 + 0.25 * decay(t, tDone(i), 4))})`}>
                      <rect x={-118} y={-28} width={236} height={56} rx={28} fill={done ? GREEN : '#070A14'} opacity={done ? 1 : 0.88} stroke={GREEN} strokeWidth={3} />
                      {done ? <path d="M-76,0 L-62,14 L-40,-13" fill="none" stroke="#06200F" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                        : <g><circle cx={-82} cy={0} r={9} fill={GREEN} /><circle cx={-82} cy={0} r={17} fill="none" stroke={GREEN} strokeWidth={3.5} strokeDasharray="34 73" strokeLinecap="round" transform={`rotate(${t * 16 + i * 50} -82 0)`} /></g>}
                      <text x={done ? 16 : 18} y={12.5} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={done ? '#06200F' : '#FFFFFF'}>{done ? 'Done' : 'working'}</text>
                    </g>
                    {done ? <g transform={`translate(${WALL_W - 26} 26) scale(${dk})`}><Tick x={0} y={0} r={34} /></g> : null}
                  </Card>
                ) : (
                  <g transform={`translate(${x - WALL_W / 2} ${y - WALL_H / 2})`}>
                    <rect x={0} y={0} width={WALL_W} height={WALL_H} rx={WALL_W * 0.09} fill={`url(#${p}-back)`} />
                    <rect x={10} y={10} width={WALL_W - 20} height={WALL_H - 20} rx={WALL_W * 0.07} fill="#0B0820" opacity={0.88} />
                    <rect x={10} y={10} width={WALL_W - 20} height={WALL_H - 20} rx={WALL_W * 0.07} fill={a.accent} opacity={0.12} />
                    <text x={WALL_W / 2} y={150} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill="#FFFFFF">Works</text>
                    <text x={WALL_W / 2} y={204} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill="#FFFFFF">for you</text>
                    <text x={WALL_W / 2} y={322} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={104} fill="#FFD66B" letterSpacing={-3}>24/7</text>
                    <rect x={60} y={356} width={WALL_W - 120} height={8} rx={4} fill="#FFD66B" />
                    <rect x={0} y={0} width={WALL_W} height={WALL_H} rx={WALL_W * 0.09} fill="#FFFFFF" opacity={0.5 * pass + 0.3 * decay(t, tSame + i * 0.7 + 4, 4)} />
                  </g>
                )}
              </g>
            );
          })}
          {glint > 0 && glint < 1 ? (
            <g clipPath={`url(#${p}-cards)`}>
              <polygon points={`${glintX - 100},380 ${glintX + 60},380 ${glintX - 120},1340 ${glintX - 280},1340`} fill="#FFFFFF" opacity={0.5} />
              <polygon points={`${glintX + 90},380 ${glintX + 124},380 ${glintX - 56},1340 ${glintX - 90},1340`} fill="#FFFFFF" opacity={0.35} />
            </g>
          ) : null}
          {ALL.map((id, i) => <Burst key={id} t={t} at={tDone(i)} x={wallSlot(i).x} y={wallSlot(i).y} color={GREEN} n={16} r={300} />)}
          <Burst t={t} at={tWall + 6} x={540} y={860} color="#FFFFFF" n={24} r={760} />
          {Array.from({length: 12}).map((_, i) => <Spark key={i} x={60 + rnd(i * 3.3) * 960} y={400 + rnd(i * 5.9) * 920} r={40 * decay(t, tProm + i * 0.6, 5)} o={decay(t, tProm + i * 0.6, 5)} />)}

          {/* night clock: 11 PM -> 7 AM */}
          {clk > 0.01 ? (
            <g transform={`translate(540 1486) scale(${clk}) translate(-540 -1486)`} opacity={Math.min(1, clk * 1.5)}>
              <rect x={156} y={1388} width={776} height={204} rx={102} fill="#000" opacity={0.4} />
              <rect x={150} y={1380} width={780} height={204} rx={102} fill={`url(#${p}-strip)`} stroke="#8FA8FF" strokeWidth={3.5} />
              <circle cx={CLK.x} cy={CLK.y} r={CLK.r} fill="#F4F6FF" /><circle cx={CLK.x} cy={CLK.y} r={CLK.r} fill="none" stroke="#8FA8FF" strokeWidth={6} />
              {Array.from({length: 12}).map((_, k) => <rect key={k} x={CLK.x - 3} y={CLK.y - CLK.r + 8} width={6} height={k % 3 ? 10 : 18} fill="#1B2460" transform={`rotate(${k * 30} ${CLK.x} ${CLK.y})`} />)}
              <rect x={CLK.x - 3} y={CLK.y - 64} width={6} height={70} rx={3} fill="#5C7CFF" transform={`rotate(${hours * 360} ${CLK.x} ${CLK.y})`} />
              <rect x={CLK.x - 5.5} y={CLK.y - 44} width={11} height={50} rx={5} fill="#0B1030" transform={`rotate(${330 + hours * 30} ${CLK.x} ${CLK.y})`} />
              <circle cx={CLK.x} cy={CLK.y} r={9} fill="#0B1030" />
              <text x={596} y={1522} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={104} fill="#FFFFFF" letterSpacing={-2}>{label}</text>
              {/* moon -> sun */}
              <g transform="translate(832 1486)">
                <circle r={70} fill={hours > 7.4 ? '#FFC857' : '#8FA8FF'} opacity={0.25} />
                {hours > 7.4 ? <g><circle r={34} fill="#FFD66B" />{Array.from({length: 8}).map((_, k) => <rect key={k} x={-4} y={-58} width={8} height={16} rx={4} fill="#FFD66B" transform={`rotate(${k * 45 + t * 2})`} />)}</g>
                  : <g><circle r={36} fill="#F4F1DE" /><circle cx={16} cy={-10} r={30} fill="#141C55" /></g>}
              </g>
            </g>
          ) : null}
        </g>
      ) : null}

      {/* ---------------- 6. the price ladder ---------------- */}
      {t >= tVery ? LADDER.map((r, i) => {
        const a = AGENTS[r.id], y = rowY(i);
        const e = outC((t - tVery - 1 - i * 0.9) / 6), st = tStamp(i), k = sp(t, st, 'bouncy'), hit = decay(t, st, 4);
        const b = bob(t, i, 0.7);
        if (e <= 0.001) return null;
        return (
          <g key={r.id} transform={`translate(${(1 - e) * (i % 2 ? 1300 : -1300) + Math.sin(t * 2.4) * 10 * hit} ${hit * 8})`}>
            <rect x={58} y={y + 12} width={r.w} height={ROW_H} rx={44} fill="#000" opacity={0.45} />
            <rect x={50} y={y} width={r.w} height={ROW_H} rx={44} fill={a.deep} />
            <rect x={50} y={y} width={r.w} height={ROW_H} rx={44} fill={a.accent} opacity={0.28 + 0.4 * hit} />
            <rect x={50} y={y} width={r.w} height={ROW_H} rx={44} fill="none" stroke={r.free && k > 0.5 ? GREEN : a.glow} strokeWidth={4 + 5 * hit} opacity={0.9} />
            <rect x={62} y={y + 8} width={r.w - 24} height={ROW_H * 0.36} rx={34} fill="#FFFFFF" opacity={0.07} />
            <g transform={`translate(143 ${y + ROW_H / 2 + b.dy * 0.3}) rotate(${b.rot}) scale(${1 + 0.15 * hit})`}><Art id={r.id} cx={0} cy={0} size={150} /></g>
            <text x={242} y={y + 66} fontFamily={FONT} fontWeight={700} fontSize={44} fill="#FFFFFF" opacity={0.92}>{a.name}</text>
            {k > 0.01 ? (
              <g transform={`translate(242 ${y + 142}) scale(${0.5 + 0.5 * k + 0.25 * hit})`} opacity={Math.min(1, k * 2)}>
                <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={r.free ? 78 : r.tag.length > 12 ? 56 : 72} fill={r.free ? GREEN : '#FFFFFF'} letterSpacing={-1}>{r.tag}</text>
              </g>
            ) : <rect x={242} y={y + 96} width={260} height={50} rx={16} fill="#FFFFFF" opacity={0.1} />}
            {/* the rung marker at the end of the bar */}
            <g transform={`translate(${50 + r.w - 62} ${y + ROW_H / 2}) scale(${k})`}>
              <circle r={36} fill={r.free ? GREEN : '#FFFFFF'} />
              {r.free ? <path d="M-15,1 L-4,12 L16,-11" fill="none" stroke="#06200F" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                : <text x={0} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={48} fill={a.deep}>$</text>}
            </g>
          </g>
        );
      }) : null}
      {t >= tVery ? LADDER.map((r, i) => <Burst key={r.id} t={t} at={tStamp(i)} x={420} y={rowY(i) + ROW_H / 2} color={r.free ? GREEN : AGENTS[r.id].glow} n={i === 5 ? 26 : 14} r={i === 5 ? 520 : 300} />) : null}
      {t >= tVery && t < tVery + 6 ? <rect x={-700} y={-700} width={2480} height={3400} fill="#FFFFFF" opacity={0.3 * (1 - (t - tVery) / 6)} /> : null}
    </svg>
  );
};

export const s01World: WorldDef = {
  id: 's01', home: 'wall',
  anchors: {wall: {x: 540, y: FY, zoom: Z}},
  palette: {bg0: '#070616', bg1: '#1E1650', particles: '#C9B8FF', glow: '#8E7BFF'},
  Draw,
};
