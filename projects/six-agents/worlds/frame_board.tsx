// S09 - 'Pick board'. The six real agent cards on a board (3 x 2) under a moving spotlight, and a glass "match" panel.
// "So which one?" -> a scanner hops over the cards. Each need is typed word by word into the panel ("Busy pro with
// budget"); the spoken pick ("Dots.") lights that card, pops its mascot forward into the panel and flips in three clean
// rows from AGENTS (price - runs on - asks first). Picked cards keep a tick. END STATE: everything lit, centred.
import React from 'react';
import type {WorldDef, WorldDrawProps, Beat} from '../../../src/kit/explainer/world';
import {wordAt, Burst} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {AGENTS, FONT, MONO, bob, usePreload, type AgentId} from './shared';
import {Z, ALL, GREEN, Card, Art, GlowDefs, Tick, clamp01, lerp, smooth, outC, easeIO, rnd, decay, hop} from './frame_kit';

const p = 's09';
const CW = 220, CH = CW * 1.42;
const slot = (i: number) => ({x: 540 + ((i % 3) - 1) * 270, top: [505, 860][Math.floor(i / 3)]});
const PX = 50, PY = 1225, PW = 980, PH = 385;
const AV = {x: 150, y: 1318, size: 150};

type Seg = {id: AgentId; words: [string, string, number][]; pick: string; pickD: number; pulse?: [string, number]; keep?: boolean};
const LOCAL_WORDS: [string, string, number][] = [['Free,', 'free', 327], ['on your own', 'own', 347.5], ['machine', 'machine', 352]];
const SEGS: Seg[] = [
  {id: 'dots', words: [['Busy', 'busy', 40.5], ['pro', 'pro', 49.5], ['with budget', 'budget', 60]], pick: 'dots', pickD: 90.5},
  {id: 'muse', words: [['Everyday', 'everyday', 115.5], ['errands', 'errands', 126]], pick: 'muse', pickD: 138.5},
  {id: 'grok', words: [['A whole', 'whole', 165.5], ['team', 'team', 171]], pick: 'grok', pickD: 184.5, pulse: ['bot', 192.5]},
  {id: 'duet', words: [['Approval', 'approval', 221], ['on every', 'every', 242], ['risky', 'risky', 250], ['step', 'step', 259]], pick: 'claude', pickD: 287.5, pulse: ['duet', 296]},
  {id: 'openclaw', words: LOCAL_WORDS, pick: 'openclaw', pickD: 369.5},
  {id: 'hermes', words: LOCAL_WORDS, pick: 'hermes', pickD: 395, keep: true},
];
const resolve = (beats: Beat[]) => SEGS.map((s) => {
  const tw = s.words.map(([, w, d]) => wordAt(beats, w, d));
  const tPick = wordAt(beats, s.pick, s.pickD);
  return {tw, tPick, t0: s.keep ? tPick : tw[0], tPulse: s.pulse ? wordAt(beats, s.pulse[0], s.pulse[1]) : -999};
});

const ROWS: {key: string; get: (id: AgentId) => string; icon: string}[] = [
  {key: 'Price', get: (id) => AGENTS[id].price, icon: 'M3,3 H14 L25,14 L14,25 L3,14 Z M9,9 m-2.6,0 a2.6,2.6 0 1 0 5.2,0 a2.6,2.6 0 1 0 -5.2,0'},
  {key: 'Runs on', get: (id) => AGENTS[id].runs, icon: 'M2,4 H26 V20 H2 Z M9,25 H19 M14,20 V25'},
  {key: 'Asks first', get: (id) => AGENTS[id].asks, icon: 'M14,2 L25,6 V14 C25,20 20,24 14,26 C8,24 3,20 3,14 V6 Z M9,14 L13,18 L20,10'},
];

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  usePreload(ALL.map((id) => AGENTS[id].art));
  const R = resolve(beats);
  const tWhich = wordAt(beats, 'which', 16.5), tOne = wordAt(beats, 'one', 23);
  let cur = -1;
  R.forEach((r, i) => { if (t >= r.t0) cur = i; });
  const seg = cur >= 0 ? SEGS[cur] : null, rs = cur >= 0 ? R[cur] : null;
  const picked = !!rs && t >= rs.tPick;
  const a = seg ? AGENTS[seg.id] : null;
  const started = smooth((t - R[0].t0 + 3) / 8);
  const tAll = R[5].tPick + 12, all = smooth((t - tAll) / 8);
  const scanOn = t >= tWhich && t < R[0].t0;
  const scanI = scanOn ? Math.floor((t - tWhich) / 3.4) % 6 : -1;
  // spotlight: eases from the previous pick to the newest one
  let last = -1;
  R.forEach((r, i) => { if (t >= r.tPick) last = i; });
  const cPos = (i: number) => ({x: slot(i).x, y: slot(i).top + CH / 2});
  let beam = {x: 540, y: 850}, beamId: AgentId | null = null, beamK = 0.35;
  if (scanI >= 0) { beam = cPos(scanI); beamK = 0.6; }
  if (last >= 0) {
    const from = last > 0 ? cPos(last - 1) : {x: 540, y: 850}, to = cPos(last), q = easeIO((t - R[last].tPick) / 10);
    beam = {x: lerp(from.x, to.x, q), y: lerp(from.y, to.y, q)}; beamId = SEGS[last].id; beamK = 1 - 0.5 * all;
  }
  const beamCol = beamId ? AGENTS[beamId].glow : '#DFFFF6';
  const accent = picked && a ? a.glow : '#9DB8B4';
  const glint = (t - tAll - 2) / 16, glintX = lerp(-300, 1380, clamp01(glint));

  const cardEl = (i: number, front: boolean) => {
    const id = SEGS[i].id, s = slot(i), r = R[i];
    const lit = sp(t, r.tPick, 'pop');
    const nextT0 = i < 5 ? R[i + 1].t0 : 99999;
    const act = sp(t, r.tPick, 'bouncy') * (1 - smooth((t - nextT0 + 2) / 6)) * (1 - all);
    if ((act > 0.02) !== front) return null;
    const scan = scanI === i ? 1 : 0;
    const pass = glint >= 0 && glint <= 1 ? Math.max(0, 1 - Math.abs(glintX - s.x) / 240) : 0;
    const o = lerp(1, 0.5, started * (1 - lit));
    const hp = hop(t, r.tPick, 9) * 26 + hop(t, r.tPulse, 8) * 16 + scan * 10 + hop(t, tOne + i * 1.1, 8) * 0;
    return (
      <g key={id}>
        {lit > 0.01 ? <ellipse cx={s.x} cy={s.top + CH / 2} rx={210 + 40 * act} ry={260 + 40 * act} fill={`url(#${p}-g-${id})`} opacity={0.35 * lit + 0.5 * act + 0.25 * all} /> : null}
        <Card id={id} uid={p + id} w={CW} t={t} cx={s.x} cy={s.top + CH / 2 - hp - 10 * act} s={(1 + 0.1 * act) * (1 + 0.04 * scan)} o={o}
          glow={Math.max(0.4 * lit, act, scan, pass, 0.6 * all)} life={0.6 + 0.8 * lit} />
        {scan ? <rect x={s.x - CW / 2 - 8} y={s.top - 18} width={CW + 16} height={CH + 16} rx={26} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.9} /> : null}
        {lit > 0.01 ? <g transform={`translate(${s.x + CW / 2 - 16} ${s.top + 14 - hp - 10 * act}) scale(${sp(t, r.tPick + 3, 'bouncy')})`}><Tick x={0} y={0} r={24} /></g> : null}
      </g>
    );
  };

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <GlowDefs p={p} />
      <defs>
        <linearGradient id={`${p}-bg`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1920"><stop offset="0" stopColor="#06201F" /><stop offset="0.5" stopColor="#0E3A38" /><stop offset="1" stopColor="#030B0C" /></linearGradient>
        <pattern id={`${p}-dots`} width={54} height={54} patternUnits="userSpaceOnUse"><circle cx={27} cy={27} r={3.2} fill="#FFFFFF" opacity={0.09} /></pattern>
        <linearGradient id={`${p}-beam`} gradientUnits="userSpaceOnUse" x1="0" y1="430" x2="0" y2={beam.y + 220}><stop offset="0" stopColor={beamCol} stopOpacity={0.55} /><stop offset="1" stopColor={beamCol} stopOpacity={0.04} /></linearGradient>
        <linearGradient id={`${p}-panel`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#12302F" /><stop offset="1" stopColor="#060F11" /></linearGradient>
        <linearGradient id={`${p}-board`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.09} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.02} /></linearGradient>
        <radialGradient id={`${p}-spot`}><stop offset="0" stopColor={beamCol} stopOpacity={0.55} /><stop offset="1" stopColor={beamCol} stopOpacity={0} /></radialGradient>
        <clipPath id={`${p}-cards`}>{ALL.map((_, i) => <rect key={i} x={slot(i).x - CW / 2} y={slot(i).top} width={CW} height={CH} rx={CW * 0.09} />)}</clipPath>
      </defs>
      <rect x={-700} y={-700} width={2480} height={3300} fill={`url(#${p}-bg)`} />
      <rect x={-700} y={-700} width={2480} height={3300} fill={`url(#${p}-dots)`} />
      <ellipse cx={540} cy={1640} rx={900} ry={160} fill={`url(#${p}-spot)`} opacity={0.35} />
      {/* the board */}
      <rect x={104} y={470} width={872} height={734} rx={44} fill={`url(#${p}-board)`} />
      <rect x={104} y={470} width={872} height={734} rx={44} fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.18} />
      {[[124, 490], [956, 490], [124, 1184], [956, 1184]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={8} fill="#C9D6D4" opacity={0.55} /><circle cx={x - 2} cy={y - 2} r={3} fill="#FFFFFF" opacity={0.7} /></g>)}
      {/* spotlight */}
      <circle cx={beam.x} cy={beam.y} r={330} fill={`url(#${p}-spot)`} opacity={0.5 * beamK} />
      <polygon points={`505,430 575,430 ${beam.x + 175},${beam.y + 200} ${beam.x - 175},${beam.y + 200}`} fill={`url(#${p}-beam)`} opacity={0.45 * beamK} style={{mixBlendMode: 'screen'}} />

      {ALL.map((_, i) => cardEl(i, false))}
      {ALL.map((_, i) => cardEl(i, true))}
      {glint > 0 && glint < 1 ? (
        <g clipPath={`url(#${p}-cards)`}><polygon points={`${glintX - 90},480 ${glintX + 50},480 ${glintX - 110},1200 ${glintX - 250},1200`} fill="#FFFFFF" opacity={0.4} /></g>
      ) : null}
      {R.map((r, i) => <Burst key={i} t={t} at={r.tPick} x={slot(i).x} y={slot(i).top + CH / 2} color={AGENTS[SEGS[i].id].glow} n={18} r={300} />)}

      {/* ------------------------------ match panel ------------------------------ */}
      <rect x={PX + 6} y={PY + 12} width={PW} height={PH} rx={40} fill="#000" opacity={0.45} />
      <rect x={PX} y={PY} width={PW} height={PH} rx={40} fill={`url(#${p}-panel)`} />
      {a && picked ? <rect x={PX} y={PY} width={PW} height={PH} rx={40} fill={a.accent} opacity={0.1 + 0.18 * decay(t, rs!.tPick, 10)} /> : null}
      <rect x={PX} y={PY} width={PW} height={PH} rx={40} fill="none" stroke={accent} strokeWidth={3.5} opacity={0.85} />
      <rect x={PX + 14} y={PY + 10} width={PW - 28} height={90} rx={32} fill="#FFFFFF" opacity={0.045} />

      {!seg ? (
        <g opacity={1 - smooth((t - R[0].t0 + 5) / 5)}>
          <text x={540} y={1370} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={76} fill="#FFFFFF">
            <tspan fillOpacity={0.25 + 0.75 * sp(t, tWhich, 'pop')}>Which </tspan><tspan fillOpacity={0.25 + 0.75 * sp(t, tOne, 'pop')} fill="#FFD66B">one</tspan>
            <tspan fillOpacity={0.25 + 0.75 * sp(t, tOne + 4, 'pop')}> is yours?</tspan>
          </text>
          {ALL.map((id, i) => {
            const b = bob(t, i), k = sp(t, 4 + i * 2, 'bouncy');
            return <g key={id} transform={`translate(${540 + (i - 2.5) * 118} ${1500 + b.dy * 0.5 - (scanI === i ? 14 : 0)}) scale(${k * (scanI === i ? 1.18 : 1)})`}><Art id={id} cx={0} cy={0} size={88} round ring={scanI === i ? 1 : 0} /></g>;
          })}
        </g>
      ) : null}

      {seg && rs && a ? (
        <g>
          {/* the need, word by word */}
          <text x={252} y={1296} fontFamily={FONT} fontWeight={700} fontSize={42} fill="#FFFFFF">
            {seg.words.map(([txt, w], j) => {
              const on = seg.keep ? 1 : sp(t, rs.tw[j], 'pop');
              const hot = w === 'risky' ? '#FFB84D' : w === 'free' ? GREEN : '#FFFFFF';
              return <tspan key={j} fill={on > 0.5 ? hot : '#FFFFFF'} fillOpacity={0.16 + 0.84 * on}>{txt + ' '}</tspan>;
            })}
          </text>
          {/* the pick */}
          {picked ? (
            <g>
              <g transform={`translate(252 1388) scale(${(0.6 + 0.4 * sp(t, rs.tPick, 'bouncy')) * (1 + 0.06 * decay(t, rs.tPulse, 5))})`}>
                <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={a.name.length > 7 ? 66 : 80} fill={a.glow} letterSpacing={-1.5}>{a.name}</text>
              </g>
              <text x={1000} y={1388} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={30} fill="#FFFFFF" opacity={0.75 * sp(t, rs.tPick + 4, 'pop')} letterSpacing={2}>{a.maker.toUpperCase()}</text>
            </g>
          ) : (
            <g>
              <rect x={252} y={1326} width={330} height={62} rx={16} fill="#FFFFFF" opacity={0.07 + 0.04 * Math.sin(t * 0.3)} />
              {[0, 1, 2].map((k) => <circle key={k} cx={290 + k * 40} cy={1357} r={9} fill="#FFFFFF" opacity={0.25 + 0.6 * Math.max(0, Math.sin(t * 0.35 - k * 0.9))} />)}
            </g>
          )}
          <rect x={80} y={1412} width={920} height={2} fill="#FFFFFF" opacity={0.12} />
          {ROWS.map((row, r) => {
            const k = picked ? sp(t, rs.tPick + 2 + r * 3, 'pop') : 0, y = 1458 + r * 56;
            return (
              <g key={row.key}>
                <g transform={`translate(84 ${y - 26})`} fill="none" stroke={picked ? a.glow : '#7E9793'} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round"><path d={row.icon} /></g>
                <text x={130} y={y} fontFamily={MONO} fontWeight={600} fontSize={30} fill={picked ? a.glow : '#7E9793'}>{row.key}</text>
                {picked ? (
                  <text x={340 + (1 - k) * 46} y={y} fontFamily={FONT} fontWeight={700} fontSize={32} fill="#FFFFFF" opacity={k}>{row.get(seg.id)}</text>
                ) : <rect x={340} y={y - 22} width={[330, 400, 280][r]} height={22} rx={11} fill="#FFFFFF" opacity={0.08 + 0.04 * Math.sin(t * 0.3 + r)} />}
              </g>
            );
          })}
          {/* avatar slot: the mascot pops forward out of its card */}
          <circle cx={AV.x} cy={AV.y} r={88} fill="#000" opacity={0.3} />
          {!picked ? (
            <g>
              <circle cx={AV.x} cy={AV.y} r={72} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="14 12" opacity={0.5} transform={`rotate(${t * 3} ${AV.x} ${AV.y})`} />
              <text x={AV.x} y={AV.y + 30} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={84} fill="#FFFFFF" opacity={0.6}>?</text>
            </g>
          ) : (() => {
            const q = outC((t - rs.tPick) / 12), s = slot(cur), b = bob(t, cur, 1.2);
            const x = lerp(s.x, AV.x, q), y = lerp(s.top + CW * 0.5, AV.y, q) - Math.sin(q * Math.PI) * 70 + (q >= 1 ? b.dy * 0.6 : 0);
            const size = lerp(CW * 0.84, AV.size, q) * (1 + 0.35 * Math.sin(q * Math.PI)) * (1 + 0.05 * decay(t, rs.tPulse, 5));
            return (
              <g>
                <circle cx={AV.x} cy={AV.y} r={130} fill={`url(#${p}-g-${seg.id})`} opacity={q} />
                <g transform={`rotate(${q >= 1 ? b.rot : (1 - q) * -10} ${x} ${y})`}><Art id={seg.id} cx={x} cy={y} size={size} ring={decay(t, rs.tPick + 10, 6)} /></g>
              </g>
            );
          })()}
        </g>
      ) : null}
      {seg && picked ? <Burst t={t} at={rs!.tPick + 9} x={AV.x} y={AV.y} color={a!.glow} n={14} r={200} /> : null}
      {/* drifting motes */}
      {Array.from({length: 16}).map((_, i) => <circle key={i} cx={(rnd(i * 3.1) * 1100 + t * (rnd(i) - 0.5)) % 1100} cy={(rnd(i * 5.7) * 1200 + 440 - t * 0.3 * (0.4 + rnd(i * 2)) + 2400) % 1200 + 440} r={2 + rnd(i * 7) * 2} fill="#DFFFF6" opacity={0.18} />)}
    </svg>
  );
};

export const s09World: WorldDef = {
  id: 's09', home: 'board',
  anchors: {board: {x: 540, y: 940, zoom: Z}},
  palette: {bg0: '#03100F', bg1: '#0E3B3A', particles: '#B8FFF0', glow: '#7FFFE0'},
  Draw,
};
