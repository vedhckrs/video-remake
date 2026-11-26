// S06 THE TURN: tunnel of deadline gates + 7,200 / MIN -> glass iOS layers lock onto a chip -> 2008: first iPhone, empty socket.
import React from 'react';
import {siApple} from 'simple-icons';
import {LogicBoard, SiChassis, SiChip, SiExtrude, SiLens, SiPrism, SiScene, SiTop, boardLayout, rr, sweepAcross, useSi, type P2} from '../../../src/kit/explainer/silicon';
import {Burst, onWord, pulseOn, wordAt, type Beat, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {PhotoStage} from '../../../src/kit/explainer/photostage';
import {Drum, FONT, PERIOD, Plate, Socket, TILT, clamp01, eo, hsh, lerp, originAt, planPx, ramp, sm} from './road_kit';

const LAYOUT = boardLayout(7);
const SOC = LAYOUT.parts.find((p) => p.id === 'soc')!;
const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1920, height: 1080};

// ---- A: the tunnel --------------------------------------------------------------------------------------------------
const VX = 960, VY = 430, GW = 1720, GH = 960, FT = 92, DZ = 0.6, NG = 15, ZC = 1.6, CY = 612, CS = 1.5;
const gy = (s: number, f: number) => VY + GH * f * s;   // f: -0.46 = ceiling line, 0.54 = floor line
const Tunnel: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const tRace = wordAt(beats, 'race', 62), tCannot = wordAt(beats, 'cannot', 35), t72 = wordAt(beats, '7200', 70), tMin = wordAt(beats, 'minute', 115);
  const a = tRace - 16, dur = 46, q = clamp01((t - a) / dur);
  const I = t < a ? 0 : q < 1 ? (q * q * q - (q * q * q * q) / 2) * dur : 0.5 * dur + (t - a - dur);
  const dist = 0.034 * (t + 40) + 0.12 * I, k = Math.floor(dist / DZ), f = dist - k * DZ;
  const redFrom = Math.floor((0.034 * (tCannot + 40)) / DZ) + 3;
  const soft = onWord(t, beats, 'software', 'settle'), alone = onWord(t, beats, 'alone'), cannot = onWord(t, beats, 'cannot'), win = onWord(t, beats, 'win'), times = onWord(t, beats, 'times'), min = onWord(t, beats, 'minute');
  const pulse = pulseOn(t, beats);
  const isRed = (id: number) => id >= redFrom && hsh(id * 3.7) < 0.45;
  let flash = 0, missed = 0;
  const gates: React.ReactNode[] = [];
  for (let i = NG - 1; i >= 0; i--) {
    const z = 0.3 + (i + 1) * DZ - f, id = k + i, s = 1 / z, s2 = 1 / (z + 0.11);
    const red = isRed(id);
    if (red && Math.abs(z - ZC) < 0.3) flash = Math.max(flash, 1 - Math.abs(z - ZC) / 0.3);
    const o = sm((z - 0.34) / 0.4) * clamp01((NG * DZ + 0.3 - z) / 3.2);
    if (o <= 0.01) continue;
    const col = red ? '#FF4D5E' : min > 0.5 ? '#9CF0FF' : '#62E0FF', T = FT * s;
    const x = VX - (GW / 2) * s, y = gy(s, -0.46), w = GW * s, h = GH * s, R = 54 * s;
    const xb = VX - (GW / 2) * s2, yb = gy(s2, -0.46), wb = GW * s2, hb = GH * s2;
    const near = clamp01((z - 0.5) / 1.2);   // 0 = at the lens
    gates.push(
      <g key={id} opacity={o}>
        <ellipse cx={VX} cy={y + h} rx={w * 0.52} ry={34 * s} fill={col} opacity={0.16 + 0.1 * pulse} />
        {/* inner wall of the gate (its real thickness) */}
        <path d={rr(x, y, w, h, R) + rr(xb, yb, wb, hb, 54 * s2)} fillRule="evenodd" fill="#0A1222" />
        <path d={rr(x, y, w, h, R) + rr(xb, yb, wb, hb, 54 * s2)} fillRule="evenodd" fill={col} opacity={0.3} />
        <path d={rr(xb, yb, wb, hb, 54 * s2)} fill="none" stroke={col} strokeOpacity={0.55} strokeWidth={2.5 * s2} />
        {/* front face: brushed dark metal frame */}
        <path d={rr(x - T, y - T, w + 2 * T, h + 2 * T, R + T) + rr(x, y, w, h, R)} fillRule="evenodd" fill="url(#s6-metal)" />
        <path d={rr(x - T, y - T, w + 2 * T, h + 2 * T, R + T)} fill="none" stroke="#7C9BD6" strokeOpacity={0.55} strokeWidth={2.2 * s} />
        <path d={rr(x - T * 0.5, y - T * 0.5, w + T, h + T, R + T * 0.5)} fill="none" stroke="#02040A" strokeOpacity={0.7} strokeWidth={5 * s} />
        <path d={rr(x - T * 0.5, y - T * 0.5, w + T, h + T, R + T * 0.5)} fill="none" stroke={col} strokeOpacity={0.5} strokeWidth={1.6 * s} strokeDasharray={`${40 * s} ${26 * s}`} />
        {/* emissive strip + bloom */}
        <path d={rr(x, y, w, h, R)} fill="none" stroke={col} strokeOpacity={0.07 + 0.05 * pulse} strokeWidth={90 * s} />
        <path d={rr(x, y, w, h, R)} fill="none" stroke={col} strokeOpacity={0.2 + 0.14 * pulse} strokeWidth={30 * s} />
        <path d={rr(x, y, w, h, R)} fill="none" stroke={col} strokeWidth={9 * s} />
        <path d={rr(x, y, w, h, R)} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={2.4 * s} />
        {[-1, 1].map((m) => <rect key={m} x={VX + m * (w / 2 + T * 0.5) - 9 * s} y={y + h * 0.3} width={18 * s} height={h * 0.4} rx={9 * s} fill={col} opacity={0.75 * near} />)}
        {s > 0.24 && s < 1.25 ? (
          <g transform={`translate(${VX} ${y - T * 0.5}) scale(${s})`}>
            <rect x={-150} y={-36} width={300} height={72} rx={14} fill="#04070D" stroke={col} strokeWidth={3} />
            <text y={13} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={38} fill={red ? '#FF8A95' : '#DDF6FF'}>{red ? 'HITCH' : '8.3 ms'}</text>
          </g>
        ) : null}
      </g>,
    );
  }
  for (let id = redFrom; id < k + Math.ceil((ZC - 0.3) / DZ) - 1; id++) if (isRed(id)) missed++;
  // floor + ceiling: lane lines, moving sleepers, wall pillars (parallax between the gates)
  const env: React.ReactNode[] = [];
  for (let j = 0; j < 44; j++) {
    const z = 0.36 + j * 0.2 - (dist % 0.2), s = 1 / z, o = clamp01((z - 0.36) / 0.3) * clamp01((9 - z) / 4);
    const yf = gy(s, 0.54), yc = gy(s, -0.46), hw = (GW / 2) * s;
    env.push(<g key={j} opacity={o}>
      <line x1={VX - hw} y1={yf} x2={VX + hw} y2={yf} stroke="#5E8CE0" strokeOpacity={0.3} strokeWidth={1.6 * s + 0.4} />
      <line x1={VX - 26 * s} y1={yf} x2={VX + 26 * s} y2={yf} stroke="#DDF6FF" strokeOpacity={0.85} strokeWidth={5 * s + 0.5} />
      {[-1, 1].map((m) => <line key={m} x1={VX + m * hw} y1={yc} x2={VX + m * hw} y2={yf} stroke="#3F66B8" strokeOpacity={0.45} strokeWidth={3 * s + 0.5} />)}
      {[-1, 1].map((m) => <rect key={m} x={VX + m * hw * 0.62 - 40 * s} y={yc - 4 * s} width={80 * s} height={8 * s} rx={4 * s} fill="#9CC8FF" opacity={0.7} />)}
    </g>);
  }
  const streaks = Array.from({length: 80}).map((_, j) => {
    const an = hsh(j) * Math.PI * 2, zz = 0.3 + ((((hsh(j * 5.1) * 8 - dist * 1.5) % 8) + 8) % 8), r1 = 700 / zz, r2 = 700 / (zz + 0.16 + 0.75 * q);
    return <line key={j} x1={VX + Math.cos(an) * r1} y1={VY + Math.sin(an) * r1 * 0.58} x2={VX + Math.cos(an) * r2} y2={VY + Math.sin(an) * r2 * 0.58}
                 stroke={j % 5 ? '#7FB4FF' : '#FFFFFF'} strokeWidth={2.8 / zz + 0.6} opacity={clamp01(zz / 1.0) * clamp01((8 - zz) / 3) * (0.4 + 0.4 * q)} strokeLinecap="round" />;
  });
  const val = t < t72 ? 0 : 7200 * eo((t - t72) / 32);
  const scrollPos = t * 4.4, row0 = Math.floor(scrollPos / 30), scroll = scrollPos % 30, rate = 0.42 * cannot, B0 = Math.floor(t / 2.5), bf = (t / 2.5) % 1;
  const bob = Math.sin(t / 9) * 5, rise = (1 - soft) * 560;
  return (
    <div style={full}>
      <svg width={1920} height={1080} style={full}>
        <defs>
          <radialGradient id="s6-vp" cx="0.5" cy="0.4" r="0.62"><stop offset="0" stopColor="#3D74E0" stopOpacity={0.75} /><stop offset="0.18" stopColor="#1B3F8E" stopOpacity={0.62} /><stop offset="0.5" stopColor="#0C1A3C" stopOpacity={0.7} /><stop offset="1" stopColor="#02040A" stopOpacity={0.97} /></radialGradient>
          <radialGradient id="s6-core" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#EAF6FF" stopOpacity={0.95} /><stop offset="0.25" stopColor="#7FC4FF" stopOpacity={0.5} /><stop offset="1" stopColor="#3B8CFF" stopOpacity={0} /></radialGradient>
          <linearGradient id="s6-metal" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stopColor="#3A4A6C" /><stop offset="0.12" stopColor="#1A2236" /><stop offset="0.5" stopColor="#0D1220" /><stop offset="0.88" stopColor="#161D30" /><stop offset="1" stopColor="#05070D" /></linearGradient>
          <linearGradient id="s6-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B8CFF" stopOpacity={0.5} /><stop offset="0.35" stopColor="#12264F" stopOpacity={0.6} /><stop offset="1" stopColor="#040812" stopOpacity={0.9} /></linearGradient>
          <linearGradient id="s6-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#DCEBFF" stopOpacity={0.34} /><stop offset="0.5" stopColor="#8FB0E8" stopOpacity={0.08} /><stop offset="1" stopColor="#6C8FD0" stopOpacity={0.16} /></linearGradient>
          <linearGradient id="s6-gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="0.5" stopColor="#fff" stopOpacity={0.16} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></linearGradient>
          <clipPath id="s6-cc"><rect x={-178} y={-74} width={356} height={104} rx={8} /></clipPath>
          <clipPath id="s6-cb"><rect x={-200} y={-130} width={400} height={260} rx={24} /></clipPath>
          <clipPath id="s6-cs"><rect x={-176} y={66} width={352} height={46} /></clipPath>
        </defs>
        <rect width={1920} height={1080} fill="url(#s6-vp)" />
        <polygon points={`${VX},${VY} ${VX + 2600},1100 ${VX - 2600},1100`} fill="url(#s6-floor)" />
        <polygon points={`${VX},${VY} ${VX + 2600},-140 ${VX - 2600},-140`} fill="#050A16" opacity={0.75} />
        {[-1, 1].map((m) => <g key={m}>
          <line x1={VX} y1={VY} x2={VX + m * (GW / 2) * 3} y2={gy(3, 0.54)} stroke="#62E0FF" strokeOpacity={0.6} strokeWidth={5} />
          <line x1={VX} y1={VY} x2={VX + m * (GW / 2) * 3} y2={gy(3, 0.54)} stroke="#62E0FF" strokeOpacity={0.14} strokeWidth={26} />
          <line x1={VX} y1={VY} x2={VX + m * (GW / 2) * 3} y2={gy(3, -0.46)} stroke="#8FB8FF" strokeOpacity={0.4} strokeWidth={3} />
        </g>)}
        {env}
        <ellipse cx={VX} cy={VY} rx={150 + 30 * pulse} ry={96 + 20 * pulse} fill="url(#s6-core)" opacity={0.85} />
        {streaks}
        {gates}
        {/* the runner: software, alone */}
        <g transform={`translate(${VX} ${CY + rise + bob}) scale(${CS})`} opacity={clamp01(soft * 3)}>
          <ellipse cx={0} cy={160 - bob / CS} rx={250} ry={24} fill="#000" opacity={0.55} />
          <ellipse cx={0} cy={160 - bob / CS} rx={262 * alone} ry={27 * alone} fill="none" stroke="#FFB347" strokeWidth={3} opacity={alone * 0.95} strokeDasharray="13 9" strokeDashoffset={-t * 2} />
          <ellipse cx={0} cy={160 - bob / CS} rx={200} ry={16} fill={flash > 0.05 ? '#FF4D5E' : '#62E0FF'} opacity={0.22 + 0.3 * flash} />
          <rect x={-200} y={-130} width={400} height={260} rx={24} fill="#081120" opacity={0.93} />
          <rect x={-200} y={-130} width={400} height={260} rx={24} fill="url(#s6-card)" />
          <g clipPath="url(#s6-cb)">
            <rect x={-200} y={-130} width={400} height={44} fill="#0E1A30" opacity={0.9} />
            <rect x={-260 + ((t * 7) % 700)} y={-130} width={120} height={260} fill="url(#s6-gl)" transform="skewX(-18)" />
            <rect x={-200} y={-130} width={400} height={260} fill="#FF4D5E" opacity={0.2 * flash} />
          </g>
          <circle cx={-176} cy={-108} r={6} fill="#FF5F57" /><circle cx={-157} cy={-108} r={6} fill="#FEBC2E" /><circle cx={-138} cy={-108} r={6} fill="#28C840" />
          <text x={182} y={-100} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={21} fill="#fff" letterSpacing={1.5}>SOFTWARE<tspan fill="#FFB347" opacity={alone}> · ALONE</tspan></text>
          <g clipPath="url(#s6-cc)">
            {Array.from({length: 6}).map((_, r) => (
              <g key={r} transform={`translate(0 ${r * 30 - scroll})`}>
                <rect x={-176} y={-72} width={20} height={20} rx={6} fill={['#62E0FF', '#FFB347', '#B58CFF', '#5BE49B'][(r + row0) % 4]} />
                <rect x={-146} y={-69} width={130 + hsh(r + row0) * 150} height={7} rx={3.5} fill="#E8F1FF" opacity={0.85} />
                <rect x={-146} y={-57} width={70 + hsh((r + row0) * 3.1) * 120} height={5} rx={2.5} fill="#8FA8D0" opacity={0.7} />
              </g>
            ))}
          </g>
          {/* frame-time strip: every bar is one frame, red = it missed the deadline */}
          <rect x={-182} y={40} width={364} height={76} rx={10} fill="#040810" stroke="#2A3A58" strokeWidth={1.5} />
          <text x={-170} y={61} fontFamily={FONT} fontWeight={600} fontSize={18} fill="#9CC3FF" letterSpacing={1}>FRAME TIME</text>
          <text x={170} y={61} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={18} fill={missed ? '#FF8A95' : '#5BE49B'} opacity={win}>{missed ? `MISSED ${missed}` : 'ON TIME'}</text>
          <g clipPath="url(#s6-cs)">
            {Array.from({length: 32}).map((_, i) => {
              const id = B0 + i, late = hsh(id * 1.31) < rate, hh = late ? 34 + 8 * hsh(id) : 9 + 12 * hsh(id * 2.2);
              return <rect key={i} x={-176 + (i - bf) * 11.5} y={110 - hh} width={7.5} height={hh} rx={2} fill={late ? '#FF4D5E' : '#62E0FF'} opacity={0.92} />;
            })}
          </g>
          <line x1={-176} x2={176} y1={84} y2={84} stroke="#FFB347" strokeWidth={1.5} strokeDasharray="6 5" opacity={0.9} />
          <rect x={-200} y={-130} width={400} height={260} rx={24} fill="none" stroke={flash > 0.05 ? '#FF4D5E' : '#CFE4FF'} strokeWidth={2.2 + 4 * flash} />
          <rect x={-206} y={-136} width={412} height={272} rx={29} fill="none" stroke={flash > 0.05 ? '#FF4D5E' : '#62E0FF'} strokeOpacity={0.25 + 0.4 * flash} strokeWidth={8} />
        </g>
        <Burst t={t} at={tMin} x={VX} y={230} color="#9CF0FF" n={28} r={460} />
      </svg>
      <div style={{position: 'absolute', left: 0, width: 1920, top: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: ramp(t, tRace - 4, tRace + 6), transform: `scale(${0.9 + 0.1 * eo((t - tRace) / 12) + 0.04 * min})`}}>
        <Drum value={val} digits={4} size={150} suffix="/ MIN" glow={min} accent={min > 0.5 ? '#9CF0FF' : '#62E0FF'} />
        <div style={{marginTop: 14, padding: '6px 26px', borderRadius: 24, background: 'rgba(4,8,16,0.72)', fontFamily: FONT, fontWeight: 600, fontSize: 34, color: '#DDF6FF', opacity: times, letterSpacing: 2}}>120 Hz × 60 s · every gate 8.3 ms</div>
      </div>
    </div>
  );
};

// ---- B: glass iOS layers lock onto the chip ---------------------------------------------------------------------------
const UB = 40, OB = originAt(UB, SOC.x + SOC.w / 2, SOC.y + SOC.d / 2, 1.8, 960, 670);
const NAMES = ['iOS', 'RENDER SERVER', 'FRAMEWORKS', 'APPS'], COLS = ['#62E0FF', '#B58CFF', '#FFB347', '#5BE49B'];
const Stack: React.FC<{t: number; drop: number; gap: number; contact: number; show: number}> = ({t, drop, gap, contact, show}) => {
  const {v} = useSi();
  const x = SOC.x, y = SOC.y, w = SOC.w, d = SOC.d, z0 = 1.8 + 0.3 + drop;
  const pins: P2[] = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) pins.push([x + 1.4 + (i * (w - 2.8)) / 6, y + 1.4 + (j * (d - 2.8)) / 4]);
  return (
    <g opacity={show}>
      <SiTop z={1.81}>
        {pins.map((p, i) => { const on = clamp01(contact * 3 - hsh(i) * 2); return <g key={i}><circle cx={p[0]} cy={p[1]} r={0.28 + 0.5 * on} fill="#62E0FF" opacity={0.25 * on} /><circle cx={p[0]} cy={p[1]} r={0.2} fill={on > 0.3 ? '#DDF6FF' : '#D6AE52'} /></g>; })}
      </SiTop>
      {pins.map((p, i) => {
        const len = 1.0 + hsh(i * 3.3) * 1.6, a = v.P(p[0], p[1], z0), b = v.P(p[0], p[1], Math.max(1.82, z0 - len)), on = clamp01(contact * 3 - hsh(i) * 2);
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={on > 0.3 ? '#9CF0FF' : '#C9D6EA'} strokeWidth={3} strokeLinecap="round" opacity={0.75} />;
      })}
      {NAMES.map((nm, i) => {
        const z = z0 + i * gap, lit = clamp01(contact * 4 - i), c = COLS[i], pr = v.P(x + w, y + d * 0.2, z);
        return (
          <g key={i}>
            <SiTop z={z - 0.2}><path d={rr(x, y, w, d, 1)} fill="#061022" opacity={0.5} /></SiTop>
            <SiTop z={z}>
              <path d={rr(x, y, w, d, 1)} fill={c} opacity={0.1 + 0.16 * lit} />
              <path d={rr(x, y, w, d, 1)} fill="none" stroke={lit > 0.3 ? '#fff' : c} strokeWidth={0.12 + 0.1 * lit} />
              {Array.from({length: i === 3 ? 20 : 6}).map((_, k) => (i === 3
                ? <rect key={k} x={x + 1.2 + (k % 5) * 2.35} y={y + 1 + Math.floor(k / 5) * 2.4} width={1.7} height={1.7} rx={0.45} fill={COLS[(k * 7) % 4]} opacity={0.6 + 0.3 * lit} />
                : <rect key={k} x={x + 1.2} y={y + 1.2 + k * 1.5} width={(w - 2.4) * (0.45 + 0.5 * hsh(k + i * 9))} height={0.7} rx={0.35} fill={c} opacity={0.45 + 0.4 * lit} />))}
            </SiTop>
            <line x1={pr[0]} y1={pr[1]} x2={pr[0] + 150} y2={pr[1] - 30 - i * 26 + 40} stroke={c} strokeWidth={2.5} />
            <text x={pr[0] + 162} y={pr[1] - 22 - i * 26 + 40} fontFamily={FONT} fontWeight={700} fontSize={30} fill="#fff" style={{paintOrder: 'stroke'}} stroke="#04070D" strokeWidth={6}>{nm}</text>
          </g>
        );
      })}
    </g>
  );
};
const KeyLock: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const tChip = wordAt(beats, 'chip', 152), tBuilt = wordAt(beats, 'built', 160);
  const tLand = [...beats].reverse().find((x) => x.word === 'software' || x.w === 'software')?.t ?? 195;
  const dq = ramp(t, tBuilt, tLand), contact = clamp01((t - tLand + 2) / 14), chip = sm((t - tChip) / 8);
  return (
    <SiScene id="s6b" width={1920} height={1080} u={UB} tilt={TILT} origin={OB} style={full}
             sweep={sweepAcross(sm((t - tChip + 6) / 46), SOC.x - 6, SOC.y - 6, SOC.x + 20, SOC.y + 17)}>
      <SiChassis layer="back" />
      <LogicBoard layout={LAYOUT} focus="soc" dim={0.5} parts={{soc: {mark: {logo: 'apple', title: '', top: ['K7N2Q4TA  2638'], lines: []}, glow: 0.3 * chip + 0.6 * contact, highlight: chip * (1 - contact), glowColor: '#62E0FF'}}}>
        <Stack t={t} drop={15 * (1 - dq)} gap={lerp(2.5, 1.35, dq)} contact={contact} show={ramp(t, tChip - 14, tChip - 2)} />
      </LogicBoard>
      <SiChassis layer="front" />
    </SiScene>
  );
};

// ---- C: 2008, the first iPhone opens on an empty socket ---------------------------------------------------------------
const UP = 11.5, OP = originAt(UP, 57.5, 30.5, 0, 960, 560), BX = 63, BY = 6;
const rrPts = (x: number, y: number, w: number, d: number, r: number): P2[] => {
  const out: P2[] = [], cs: [number, number, number][] = [[x + w - r, y + r, -90], [x + w - r, y + d - r, 0], [x + r, y + d - r, 90], [x + r, y + r, 180]];
  cs.forEach(([cx, cy, a0]) => { for (let i = 0; i <= 6; i++) { const a = ((a0 + i * 15) * Math.PI) / 180; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } });
  return out;
};
const BODY = rrPts(0, 0, 115, 61, 11);
export const SOCKET_PX = planPx(UP, OP, BX + 22, BY + 15, 0.8);
/** the REAL first iPhone (PhotoStage, unaltered) is on screen for these design frames, before the drawn opened phone */
export const PHOTO_IN = 214, PHOTO_OUT = 270;
const Phone2007: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const open = ramp(t, PHOTO_OUT - 8, wordAt(beats, 'design', 276) + 6), single = onWord(t, beats, 'single', 'bouncy'), one = pulseOn(t, beats, (b) => b.word === 'one' || b.w === 'one', 9);
  const lift = 0.3 + 34 * open;
  return (
    <SiScene id="s6c" width={1920} height={1080} u={UP} tilt={TILT} origin={OP} style={full} sweep={sweepAcross(sm((t - 226) / 40), 0, 0, 115, 61)}>
      <defs><linearGradient id="s6c-al" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9ECEF" /><stop offset="0.45" stopColor="#AEB4BC" /><stop offset="0.6" stopColor="#D9DDE2" /><stop offset="1" stopColor="#8D949D" /></linearGradient></defs>
      <SiExtrude pts={BODY} z={-11} h={11} color="#AEB4BC" />
      <SiTop z={0}><path d={rr(0, 0, 115, 61, 11)} fill="#07090C" stroke="#D9DDE2" strokeWidth={1.3} /></SiTop>
      <SiPrism x={25} y={6} w={35} d={49} z={0} h={3.4} color="#2A2D33" />
      <SiTop z={3.4}><rect x={25} y={6} width={35} height={49} rx={1} fill="#15171B" /><rect x={28} y={10} width={12} height={41} rx={0.6} fill="#D8DADC" opacity={0.85} /><rect x={25} y={6} width={35} height={49} fill="url(#s6c-sweep)" opacity={0.5} /></SiTop>
      <SiChip x={4} y={8} w={17} d={12} z={0} kind="shield" role="shield" /><SiChip x={5} y={26} w={15} d={26} z={0} kind="shield" role="shield" perf />
      <Plate def={PERIOD} ox={BX} oy={BY} />
      <SiChip x={66} y={39} w={36} d={15} z={0} kind="shield" role="shield" sticker />
      <Socket x={BX + 15} y={BY + 8} w={14} d={14} t={t} pulse={one + 0.4 * single} />
      {open < 0.995 ? (
        <SiTop z={lift} opacity={1 - ramp(open, 0.45, 1)}>
          <g transform={`translate(${-18 * open} ${-26 * open})`}>
            <path d={rr(0, 0, 115, 61, 11)} fill="url(#s6c-al)" /><path d={rr(0, 0, 115, 61, 11)} fill="url(#s6c-brush)" opacity={0.5} />
            <path d="M11 0H23V61H11A11 11 0 0 1 0 50V11A11 11 0 0 1 11 0Z" fill="#101114" /><path d="M11 0H23V61H11A11 11 0 0 1 0 50V11A11 11 0 0 1 11 0Z" fill="url(#s6c-env)" opacity={0.5} />
            <circle cx={105} cy={9.5} r={3.1} fill="#5A6068" /><circle cx={105} cy={9.5} r={2.2} fill="#05070A" /><circle cx={104.4} cy={8.9} r={0.6} fill="#5B7BD0" />
            <path d={siApple.path} transform="translate(80 22.5) rotate(90) scale(0.66)" fill="#6F757D" />
            <text transform="translate(36 30.5) rotate(90)" textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={4.4} fill="#6F757D">iPhone</text>
            <path d={rr(0, 0, 115, 61, 11)} fill="url(#s6c-sweep)" opacity={0.9} />
          </g>
        </SiTop>
      ) : null}
      <text x={SOCKET_PX[0] - OP[0]} y={SOCKET_PX[1] - OP[1] + 34 - 10 * single} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={104 * single} fill="#FFB347" opacity={single * open} style={{filter: 'drop-shadow(0 0 14px #FFB347)'}}>?</text>
    </SiScene>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tCut = PHOTO_IN + 9, tB = wordAt(beats, 'needs', 140) - 6, g = eo((t - tB) / 16), hw = lerp(40, 1100, g * g), hh = hw * 0.56;
  if (t >= tCut) return <div style={full}><Phone2007 t={t} beats={beats} /></div>;
  return (
    <div style={full}>
      {t < tB + 17 ? <Tunnel t={t} beats={beats} /> : null}
      {t >= tB ? <div style={{...full, clipPath: `inset(${Math.max(0, 440 - hh)}px ${Math.max(0, 960 - hw)}px ${Math.max(0, 640 - hh)}px ${Math.max(0, 960 - hw)}px round ${60 * (1 - g)}px)`}}><KeyLock t={t} beats={beats} /></div> : null}
      {t >= tB && g < 1 ? <div style={{position: 'absolute', left: 960 - hw, top: 440 - hh, width: hw * 2, height: hh * 2, borderRadius: 60 * (1 - g), border: '8px solid #9CF0FF', boxShadow: '0 0 60px #62E0FF, inset 0 0 60px #62E0FF', opacity: 1 - g, boxSizing: 'border-box'}} /> : null}
    </div>
  );
};
const Overlay: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}> = ({t, beats, W, H, toScreen}) => {
  const tCut = PHOTO_OUT - 3, k = eo((t - tCut) / 12), [x, y] = toScreen(SOCKET_PX[0] - 640, SOCKET_PX[1] - 330), s = toScreen(1, 0)[0] - toScreen(0, 0)[0];
  return (
    <>
      {t > wordAt(beats, 'needs', 140) + 8 ? <SiLens W={W} H={H} t={t} focus={[0.16, 0.8]} blur={5} dust={12} tint="#6FA8FF" seed={6} /> : null}
      {t >= tCut ? <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s * (1.25 - 0.25 * k)})`, transformOrigin: '0 0', opacity: k, fontFamily: FONT, fontWeight: 800, fontSize: 150, lineHeight: '150px', color: '#fff', letterSpacing: -3, textShadow: '0 0 40px #FFB34799, 0 6px 30px #000'}}>2008<div style={{width: 250, height: 7, borderRadius: 4, background: '#FFB347', boxShadow: '0 0 20px #FFB347'}} /></div> : null}
      {t > PHOTO_IN && t < PHOTO_OUT ? (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - ramp(t, PHOTO_OUT - 8, PHOTO_OUT)}}>
          <PhotoStage src="ios-smooth-act1/img/s6_iphone2007_b_commons.jpg" t={t} W={W} H={H} dur={PHOTO_OUT + 30} at={PHOTO_IN} aspect={1206 / 1920} size={0.56} eyebrow="Real photo · 2007-2008" title="The first iPhone" lines={['Its main chip was not designed by Apple.']} reveal={[3, 8, 20]} />
        </div>
      ) : null}
    </>
  );
};
export const s06World: WorldDef = {
  id: 'road06', home: 'home',
  anchors: {home: {x: 960, y: 540, zoom: 1}, chip: {x: 960, y: 520, zoom: 1.1}, iphone: {x: 960, y: 540, zoom: 1}, socket: {x: SOCKET_PX[0] - 150, y: SOCKET_PX[1] - 40, zoom: 1.7}},
  aliases: {'2008': 'iphone', design: 'socket'},
  palette: {bg0: '#030509', bg1: '#0B111C', glow: '#3B8CFF', particles: '#9CC3FF'},
  Draw, Overlay,
};
