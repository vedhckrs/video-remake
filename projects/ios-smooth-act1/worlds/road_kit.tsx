// road group (S06-S08): shared helpers - maths, drum counter, year tags, period board plate, empty socket.
import React from 'react';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {SI, SiChip, SiPassives, SiPrism, SiTop, dot, siView, tint, useSi, type ChipKind, type ChipMark, type ChipRole, type Passive, type PassiveType} from '../../../src/kit/explainer/silicon';

export const TILT = 0.58;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const sm = (q: number) => { const c = clamp01(q); return c * c * (3 - 2 * c); };
export const ramp = (t: number, a: number, b: number) => sm((t - a) / (b - a));
export const eo = (q: number) => 1 - Math.pow(1 - clamp01(q), 3);
export const hsh = (n: number) => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
/** scene origin that puts plan point (x, y, z) on local px (px, py) */
export const originAt = (u: number, x: number, y: number, z: number, px: number, py: number): [number, number] => {
  const p = siView(u, TILT).P(x, y, z);
  return [px - p[0], py - p[1]];
};
export const planPx = (u: number, o: [number, number], x: number, y: number, z = 0): [number, number] => {
  const p = siView(u, TILT).P(x, y, z);
  return [o[0] + p[0], o[1] + p[1]];
};

// ---- rolling drum counter with thousands separators --------------------------------------------------------------
export const Drum: React.FC<{value: number; digits: number; size: number; prefix?: string; suffix?: string; accent?: string; glow?: number; dimLead?: boolean}> = ({value, digits, size, prefix, suffix, accent = '#62E0FF', glow = 0, dimLead = true}) => {
  const cw = size * 0.66, ch = size * 1.2;
  const pos = (x: number, i: number) => {
    const P = Math.pow(10, i);
    if (i === 0) return x;
    const frac = (x % P) / P;
    return Math.floor(x / P) + sm((frac - (P - 1) / P) * P);
  };
  const cols: React.ReactNode[] = [];
  for (let i = digits - 1; i >= 0; i--) {
    const p = ((pos(value, i) % 10) + 10) % 10;
    const lead = dimLead && i > 0 && value < Math.pow(10, i);
    cols.push(
      <div key={i} style={{position: 'relative', width: cw, height: ch, overflow: 'hidden', borderRadius: size * 0.07, opacity: lead ? 0.22 : 1,
                           background: 'linear-gradient(180deg,#05070A 0%,#1D222B 18%,#343A45 50%,#1D222B 82%,#05070A 100%)', boxShadow: `inset 0 0 ${size * 0.08}px rgba(0,0,0,0.9)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: (ch - size * 1.1) / 2 - p * size * 1.1}}>
          {Array.from({length: 11}).map((_, d) => (
            <div key={d} style={{height: size * 1.1, lineHeight: `${size * 1.1}px`, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: size, color: '#F4F6F8'}}>{d % 10}</div>
          ))}
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.78) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,0.82) 100%)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: ch * 0.12, height: ch * 0.1, background: 'linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0))'}} />
      </div>,
    );
    if (i > 0 && i % 3 === 0) cols.push(<div key={`c${i}`} style={{width: size * 0.2, alignSelf: 'flex-end', fontFamily: FONT, fontWeight: 700, fontSize: size * 0.8, lineHeight: `${size * 0.7}px`, color: '#C9D2E0', opacity: value >= Math.pow(10, i) ? 1 : 0.22}}>,</div>);
  }
  const side: React.CSSProperties = {fontFamily: FONT, fontWeight: 700, fontSize: size * 0.82, color: accent, textShadow: `0 0 ${size * 0.4}px ${accent}${glow > 0.5 ? 'CC' : '55'}`};
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.16, whiteSpace: 'nowrap'}}>
      {prefix ? <div style={side}>{prefix}</div> : null}
      <div style={{display: 'inline-flex', gap: size * 0.05, padding: size * 0.13, borderRadius: size * 0.16, background: 'linear-gradient(180deg,#2A303B,#0B0E14)',
                   border: `${Math.max(1.5, size * 0.016)}px solid rgba(190,215,255,0.28)`,
                   boxShadow: `0 ${size * 0.2}px ${size * 0.5}px rgba(0,0,0,0.7), 0 0 ${size * (0.3 + glow * 0.7)}px ${accent}${glow > 0.3 ? '77' : '2E'}, inset 0 1px 0 rgba(255,255,255,0.25)`}}>{cols}</div>
      {suffix ? <div style={{...side, fontSize: size * 0.5, letterSpacing: size * 0.03}}>{suffix}</div> : null}
    </div>
  );
};

// ---- year tag (world px; drawn in the overlay layer so the lens never blurs it) ------------------------------------
export const Tag: React.FC<{x: number; y: number; year: string; title?: string; line?: string; a: number; b?: number; c?: number; accent?: string; pulse?: number}> = ({x, y, year, title, line, a, b = 0, c = 0, accent = '#62E0FF', pulse = 0}) => (
  a <= 0.01 ? null : (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: FONT, color: '#fff', opacity: clamp01(a * 1.5), transform: `translateX(${(1 - a) * -40}px)`,
                 textShadow: '0 4px 28px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)'}}>
      <div style={{position: 'absolute', left: -60, top: -40, width: 620, height: 330, background: 'radial-gradient(ellipse at 40% 45%, rgba(3,5,9,0.78), rgba(3,5,9,0) 70%)'}} />
      <div style={{position: 'relative', fontSize: 132, fontWeight: 800, lineHeight: '132px', letterSpacing: -3, color: '#fff', textShadow: `0 0 ${30 + pulse * 50}px ${accent}${pulse > 0.3 ? 'AA' : '44'}, 0 4px 28px rgba(0,0,0,0.95)`}}>{year}</div>
      <div style={{position: 'relative', width: 96 + 140 * a + 60 * pulse, height: 6, borderRadius: 3, background: accent, margin: '6px 0 14px 4px', boxShadow: `0 0 18px ${accent}`}} />
      {title ? <div style={{position: 'relative', fontSize: 46, fontWeight: 700, lineHeight: '54px', opacity: b, transform: `translateY(${(1 - b) * 14}px)`}}>{title}</div> : null}
      {line ? <div style={{position: 'relative', fontSize: 30, fontWeight: 500, lineHeight: '40px', color: '#C9D6EA', opacity: c, transform: `translateY(${(1 - c) * 12}px)`, maxWidth: 520}}>{line}</div> : null}
    </div>
  )
);

export const Pill: React.FC<{x: number; y: number; text: string; sub?: string; a: number; color?: string; size?: number}> = ({x, y, text, sub, a, color = '#62E0FF', size = 40}) => (
  a <= 0.01 ? null : (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * a})`, opacity: clamp01(a * 1.4), fontFamily: FONT, whiteSpace: 'nowrap',
                 padding: `${size * 0.22}px ${size * 0.55}px`, borderRadius: size * 0.5, background: 'rgba(6,9,15,0.86)', border: `2px solid ${color}`,
                 boxShadow: `0 10px 40px rgba(0,0,0,0.7), 0 0 26px ${color}55`, display: 'flex', alignItems: 'baseline', gap: size * 0.4}}>
      <span style={{fontSize: size, fontWeight: 700, color: '#fff'}}>{text}</span>
      {sub ? <span style={{fontSize: Math.max(26, size * 0.66), fontWeight: 500, color}}>{sub}</span> : null}
    </div>
  )
);

// ---- period board plate ---------------------------------------------------------------------------------------------
export type PChip = {x: number; y: number; w: number; d: number; role: ChipRole; kind?: ChipKind; mark?: ChipMark};
export type PlateDef = {w: number; d: number; seed: number; mask: string; keep: [number, number, number, number]; chips: PChip[]};
const PT: {type: PassiveType; l: number; w: number; h: number; n: number}[] = [
  {type: 'cap', l: 0.6, w: 0.3, h: 0.3, n: 5}, {type: 'cap', l: 1.0, w: 0.5, h: 0.5, n: 3}, {type: 'res', l: 0.6, w: 0.3, h: 0.23, n: 5},
  {type: 'capDark', l: 1.6, w: 0.8, h: 0.8, n: 1}, {type: 'ind', l: 1.5, w: 1.5, h: 1.0, n: 1}, {type: 'icSi', l: 1.3, w: 1.3, h: 0.36, n: 1}, {type: 'ic', l: 1.5, w: 1.5, h: 0.5, n: 1}, {type: 'cap', l: 0.4, w: 0.2, h: 0.2, n: 6},
];
const hit = (x: number, y: number, w: number, d: number, r: [number, number, number, number], m: number) => x < r[0] + r[2] + m && x + w > r[0] - m && y < r[1] + r[3] + m && y + d > r[1] - m;
const plateArt = (p: PlateDef) => {
  const groups: Passive[][] = PT.map(() => []);
  const C = 2.0;
  for (let gx = 0.9; gx + C <= p.w - 0.6; gx += C) for (let gy = 0.9; gy + C <= p.d - 0.6; gy += C) {
    if (hit(gx, gy, C, C, p.keep, 0.9) || p.chips.some((c) => hit(gx, gy, C, C, [c.x, c.y, c.w, c.d], 0.35))) continue;
    if (hsh(p.seed + gx * 7.13 + gy * 13.7) > 0.7) continue;
    const k = Math.floor(hsh(p.seed * 3 + gx * 3.3 + gy * 5.9) * PT.length), T = PT[k];
    const along: 'x' | 'y' = hsh(gx + gy * 9 + p.seed) > 0.5 ? 'x' : 'y';
    const n = 1 + Math.floor(hsh(gx * 1.7 + gy + p.seed) * T.n);
    for (let i = 0; i < n; i++) {
      const pitch = T.w + 0.16, off = (C - 0.3 - n * pitch) / 2 + i * pitch;
      if (off < 0) break;
      groups[k].push(along === 'x' ? {x: gx + (C - 0.3 - T.l) / 2, y: gy + off, l: T.l, w: T.w, along} : {x: gx + off, y: gy + (C - 0.3 - T.l) / 2, l: T.l, w: T.w, along});
    }
  }
  const [kx, ky, kw, kd] = p.keep;
  let fan = '', tr = '', vias = '';
  for (let i = 0; i < 22; i++) {
    const f = (i + 0.5) / 22, a = 0.8 + hsh(i + p.seed) * 2.2;
    fan += `M${(kx + kw * f).toFixed(2)} ${ky}v${-a}l${(f - 0.5) * 3} -1.2M${(kx + kw * f).toFixed(2)} ${ky + kd}v${a}l${(f - 0.5) * 3} 1.2`;
    fan += `M${kx} ${(ky + kd * f).toFixed(2)}h${-a}l-1.2 ${(f - 0.5) * 3}M${kx + kw} ${(ky + kd * f).toFixed(2)}h${a}l1.2 ${(f - 0.5) * 3}`;
  }
  for (let i = 0; i < 70; i++) {
    const x = 1 + hsh(i * 2.1 + p.seed) * (p.w - 2), y = 1 + hsh(i * 5.3 + p.seed) * (p.d - 2), l = 2 + hsh(i * 9.1) * 7, s = hsh(i * 4.4) > 0.5 ? 1 : -1;
    if (hit(x - 1, y - 1, l + 3, 3, p.keep, 0.2)) continue;
    tr += `M${x.toFixed(2)} ${y.toFixed(2)}h${Math.min(l, p.w - 1 - x).toFixed(2)}l${s} ${s}`;
    vias += dot(x, y, 0.13);
  }
  return {groups, fan, tr, vias};
};
export const Plate = React.memo<{def: PlateDef; ox?: number; oy?: number; lit?: number; accent?: string; flow?: number}>(({def, ox = 0, oy = 0, lit = 0, accent = '#62E0FF', flow = 0}) => {
  const {id} = useSi();
  const art = React.useMemo(() => plateArt(def), [def]);
  const shifted = React.useMemo(() => art.groups.map((g) => g.map((it) => ({...it, x: it.x + ox, y: it.y + oy}))), [art, ox, oy]);
  const chips = React.useMemo(() => [...def.chips].sort((a, b) => a.x + a.y - (b.x + b.y)), [def]);
  return (
    <g>
      <SiPrism x={ox} y={oy} w={def.w} d={def.d} z={0} h={0.8} color="#4A3418" />
      <SiTop z={0.8}>
        <g transform={`translate(${ox} ${oy})`}>
          <rect width={def.w} height={def.d} rx={0.5} fill={def.mask} />
          <rect width={def.w} height={def.d} rx={0.5} fill={`url(#${id}-env)`} opacity={0.55} />
          <path d={art.tr} stroke={tint(def.mask, 0.2)} strokeWidth={0.11} fill="none" />
          <path d={art.fan} stroke={tint(def.mask, 0.26)} strokeWidth={0.09} fill="none" />
          <path d={art.vias} fill={SI.gold} opacity={0.75} />
          <rect x={0.25} y={0.25} width={def.w - 0.5} height={def.d - 0.5} rx={0.4} fill="none" stroke={SI.gold} strokeOpacity={0.5} strokeWidth={0.12} />
          <rect width={def.w} height={def.d} rx={0.5} fill={`url(#${id}-sweep)`} opacity={0.3} />
          {lit > 0.01 ? (
            <g style={{mixBlendMode: 'screen'}}>
              <path d={art.fan} stroke={accent} strokeWidth={0.2} fill="none" opacity={lit} strokeDasharray="1.4 1.2" strokeDashoffset={-flow} />
              <path d={art.tr} stroke={accent} strokeWidth={0.14} fill="none" opacity={lit * 0.6} strokeDasharray="2.4 1.8" strokeDashoffset={-flow * 1.4} />
            </g>
          ) : null}
        </g>
      </SiTop>
      {shifted.map((g, k) => (g.length ? <SiPassives key={k} items={g} type={PT[k].type} h={PT[k].h} z={0.8} /> : null))}
      {chips.map((c, i) => <SiChip key={i} x={c.x + ox} y={c.y + oy} w={c.w} d={c.d} z={0.8} role={c.role} kind={c.kind} mark={c.mark} seed={i + def.seed} />)}
    </g>
  );
});
export const Socket: React.FC<{x: number; y: number; w: number; d: number; t: number; pulse?: number; color?: string; opacity?: number}> = ({x, y, w, d, t, pulse = 0, color = '#FFB347', opacity = 1}) => {
  const pads = React.useMemo(() => {
    let s = '';
    const n = Math.round(w / 0.85);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += dot(x + (i + 0.5) * (w / n), y + (j + 0.5) * (d / n), 0.2);
    return s;
  }, [x, y, w, d]);
  return (
    <SiTop z={0.82} opacity={opacity}>
      <rect x={x - 0.3} y={y - 0.3} width={w + 0.6} height={d + 0.6} rx={0.4} fill="#050607" />
      <path d={pads} fill={SI.gold} opacity={0.8} />
      <rect x={x - 0.6} y={y - 0.6} width={w + 1.2} height={d + 1.2} rx={0.7} fill={color} opacity={0.06 + 0.14 * pulse} />
      <rect x={x - 0.6} y={y - 0.6} width={w + 1.2} height={d + 1.2} rx={0.7} fill="none" stroke={color} strokeWidth={0.22 + 0.2 * pulse} strokeDasharray="1.5 0.9" strokeDashoffset={-t * 0.08} />
    </SiTop>
  );
};
/** design frame of the first beat for `word` at or after frame `after` (words that repeat in a scene) */
export const wordFrom = (beats: {t: number; w: string; word: string}[], word: string, after: number, d: number) => beats.find((b) => b.t >= after && (b.word || b.w || '').toLowerCase().replace(/[^a-z0-9']/g, '') === word)?.t ?? d;
export const rrPts = (x: number, y: number, w: number, d: number, r: number): [number, number][] => {
  const out: [number, number][] = [], cs: [number, number, number][] = [[x + w - r, y + r, -90], [x + w - r, y + d - r, 0], [x + r, y + d - r, 90], [x + r, y + r, 180]];
  cs.forEach(([cx, cy, a0]) => { for (let i = 0; i <= 6; i++) { const a = ((a0 + i * 15) * Math.PI) / 180; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } });
  return out;
};
export const PERIOD: PlateDef = {
  w: 44, d: 30, seed: 11, mask: '#0C3A3A', keep: [15, 8, 14, 14],
  chips: [
    {x: 2, y: 2.4, w: 9, d: 7.5, role: 'nand', mark: {top: ['FLASH'], title: '', lines: ['LOT 21']}},
    {x: 2.4, y: 13, w: 6, d: 6, role: 'pmic', mark: {title: 'PWR', lines: ['LOT 7']}},
    {x: 3, y: 22, w: 8, d: 5.4, role: 'shield', kind: 'shield'}, {x: 32.5, y: 2.4, w: 8.6, d: 7, role: 'shield', kind: 'shield'},
    {x: 33, y: 12, w: 5, d: 5, role: 'wireless', mark: {title: 'WLAN', lines: ['LOT 3']}},
    {x: 33.4, y: 20, w: 4.2, d: 4.2, role: 'audio'}, {x: 16, y: 2.2, w: 3.2, d: 3.2, role: 'rf'}, {x: 24, y: 24.6, w: 4, d: 3.4, role: 'nfc'},
  ],
};
export {FONT, MONO};
