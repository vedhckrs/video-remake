// Act 1 "phone" group - shared 2D art: scrolling feed (drawn on the real phone's screen through cine3d PhoneShot), touch point, drum counter, studio.
// Everything is a pure function of its props (no timers, no random). Sizes in px on the 1920x1080 design frame.
import React from 'react';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

export const cl = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const sm = (q: number) => { const c = cl(q); return c * c * (3 - 2 * c); };
export const io = (q: number) => { const c = cl(q); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
/** quintic ease-in-out: zero velocity AND zero acceleration at both ends (camera moves: no kink where a move starts or stops) */
export const q5 = (q: number) => { const c = cl(q); return c * c * c * (c * (6 * c - 15) + 10); };
export const bellV = (t: number, t0: number, V: number, tau: number) => { const x = (t - t0) / tau; return x <= 0 ? 0 : V * x * Math.exp(1 - x); };
export const bellS = (t: number, t0: number, V: number, tau: number) => { const x = (t - t0) / tau; return x <= 0 ? 0 : V * tau * Math.E * (1 - (1 + x) * Math.exp(-x)); };
export const out3 = (q: number) => 1 - Math.pow(1 - cl(q), 3);
export const seg = (t: number, a: number, b: number) => cl((t - a) / (b - a));
export const hash = (s: number) => { const v = Math.sin(s * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
/** keyframes [t, v] joined with ease-in-out segments (one eased move per phrase, rests on every key) */
export const kf = (t: number, keys: [number, number][], ease: (q: number) => number = io) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], ease(seg(t, keys[i - 1][0], keys[i][0])));
  return keys[keys.length - 1][1];
};
/** shot envelope: zoom-through in (from `a`) and out (to `b`): opacity + scale for the wrapper */
export const shotEnv = (t: number, a: number, b: number, inD = 5, outD = 5) => {
  const i = a <= -900 ? 1 : sm(seg(t, a - 1, a + inD)), o = b >= 9000 ? 0 : sm(seg(t, b - outD, b + 1));
  return {on: t >= a - 1 && t <= b + 1, opacity: Math.min(i, 1 - o), scale: (0.86 + 0.14 * i) * (1 + 0.42 * o * o)};
};
export const Shot: React.FC<{env: {on: boolean; opacity: number; scale: number}; children: React.ReactNode; origin?: string}> = ({env, children, origin = '50% 50%'}) =>
  env.on && env.opacity > 0.002 ? (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden', opacity: env.opacity, transform: `scale(${env.scale})`, transformOrigin: origin}}>{children}</div>
  ) : null;

export const GREEN = '#35E08A', RED = '#FF3B4E', GOLD = '#F2C25B', TI = '#9E988D';

// ---- studio backdrop ----------------------------------------------------------------------------------------------
export const Studio: React.FC<{glow?: string; glowA?: number; gx?: number; gy?: number; floor?: number; t?: number}> = ({glow = '#3B8CFF', glowA = 0.3, gx = 50, gy = 46, floor = 0.78, t = 0}) => (
  <div style={{position: 'absolute', inset: 0, background: '#03050A'}}>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 60% at ${gx}% ${gy}%, ${glow}${Math.round(glowA * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`}} />
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 90% at 20% -10%, rgba(120,160,255,0.16) 0%, transparent 55%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: `${floor * 100}%`, bottom: 0, background: 'linear-gradient(180deg, rgba(110,150,230,0.10) 0%, rgba(8,12,22,0.0) 60%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: `${floor * 100}%`, height: 2, background: 'linear-gradient(90deg, transparent, rgba(160,195,255,0.35) 30%, rgba(160,195,255,0.35) 70%, transparent)'}} />
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: 26}).map((_, i) => {
        const x = (hash(i * 3.3) * 2100 + t * (0.5 + hash(i) * 1.2)) % 2100 - 90, y = hash(i * 7.9) * 1080, r = 2 + hash(i * 5.1) * 9;
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? '#9CC3FF' : glow} opacity={0.05 + hash(i * 2.7) * 0.1} />;
      })}
    </svg>
  </div>
);

// ---- the feed on the screen ---------------------------------------------------------------------------------------
const CARDS: {title: string; sub: string; who: string; art: number; c: [string, string, string]}[] = [
  {title: 'First light on the ridge', sub: 'Shot at dawn, no filter', who: 'Maya', art: 0, c: ['#FF7A3D', '#FFD36B', '#3A1D5C']},
  {title: 'Night ride through the city', sub: 'Long exposure', who: 'Jonas', art: 1, c: ['#1B2B7A', '#37C8FF', '#0A0F2E']},
  {title: 'Tide pools at low water', sub: 'Colours are real', who: 'Aiko', art: 2, c: ['#0FB6A8', '#B8FFEA', '#04384F']},
  {title: 'Studio day', sub: 'New prints drying', who: 'Lena', art: 3, c: ['#FF4F8B', '#FFC2A8', '#5B1040']},
  {title: 'Above the clouds', sub: 'Window seat wins', who: 'Omar', art: 4, c: ['#6C5BFF', '#C8D4FF', '#1B1648']},
  {title: 'Market colours', sub: 'Saturday morning', who: 'Ines', art: 5, c: ['#FFB020', '#FFF0A8', '#7A2E00']},
];
const Art: React.FC<{k: number; c: [string, string, string]}> = React.memo(({k, c}) => {
  const [a, b, d] = c;
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      {k === 0 ? <g><circle cx={285} cy={120} r={52} fill="#FFF3C4" /><circle cx={285} cy={120} r={90} fill="#FFE08A" opacity={0.25} /><path d="M0 220L70 130L130 190L210 90L300 200L360 150L400 190V300H0Z" fill={d} /><path d="M0 250L90 190L170 240L260 170L400 250V300H0Z" fill="#1A0D2E" /><path d="M210 90L238 126L212 118L196 134Z" fill="#fff" opacity={0.5} /></g> : null}
      {k === 1 ? <g>{Array.from({length: 13}).map((_, i) => <rect key={i} x={i * 32 - 6} y={300 - 90 - hash(i * 2.2) * 150} width={26} height={260} fill={i % 2 ? '#0D1440' : '#141E5C'} />)}{Array.from({length: 60}).map((_, i) => <rect key={i} x={(i % 13) * 32 + 2 + (hash(i) > 0.5 ? 10 : 0)} y={90 + hash(i * 3.1) * 180} width={6} height={8} fill={hash(i * 9) > 0.4 ? '#FFD36B' : b} opacity={0.9} />)}<path d="M0 262C120 240 250 282 400 250" stroke="#FF4F6D" strokeWidth={5} fill="none" /><path d="M0 276C140 255 260 296 400 268" stroke="#fff" strokeWidth={3} fill="none" opacity={0.8} /></g> : null}
      {k === 2 ? <g>{Array.from({length: 7}).map((_, i) => <path key={i} d={`M0 ${70 + i * 36}C100 ${40 + i * 36} 180 ${110 + i * 36} 280 ${72 + i * 36}S400 ${60 + i * 36} 400 ${80 + i * 36}V300H0Z`} fill={i % 2 ? d : a} opacity={0.5} />)}<circle cx={110} cy={210} r={40} fill="#FF8A5B" /><circle cx={110} cy={210} r={22} fill="#FFD0B0" /><circle cx={290} cy={150} r={26} fill="#FFE08A" /></g> : null}
      {k === 3 ? <g><rect x={50} y={50} width={130} height={170} rx={8} fill="#fff" opacity={0.9} transform="rotate(-8 115 135)" /><rect x={66} y={68} width={98} height={98} fill={d} transform="rotate(-8 115 135)" /><rect x={210} y={70} width={140} height={180} rx={8} fill="#FFE9DC" transform="rotate(6 280 160)" /><circle cx={280} cy={150} r={46} fill={a} transform="rotate(6 280 160)" /><circle cx={300} cy={136} r={46} fill="#FFB020" opacity={0.8} /></g> : null}
      {k === 4 ? <g><circle cx={90} cy={90} r={40} fill="#fff" opacity={0.9} />{Array.from({length: 9}).map((_, i) => <ellipse key={i} cx={hash(i * 4.4) * 400} cy={190 + hash(i * 2.1) * 80} rx={90 + hash(i) * 60} ry={34} fill="#fff" opacity={0.55 + 0.4 * hash(i * 7)} />)}<path d="M230 110L330 90L318 104L360 100L330 116L250 122Z" fill={d} /></g> : null}
      {k === 5 ? <g>{Array.from({length: 24}).map((_, i) => <circle key={i} cx={30 + (i % 8) * 50 + (Math.floor(i / 8) % 2) * 20} cy={120 + Math.floor(i / 8) * 62} r={26} fill={['#FF5A36', '#FFD21F', '#7BC043', '#FF8FB1'][Math.floor(hash(i * 3.7) * 4)]} stroke="#00000030" strokeWidth={2} />)}<rect x={0} y={0} width={400} height={78} fill={d} /><path d="M0 78L25 60L50 78L75 60L100 78L125 60L150 78L175 60L200 78L225 60L250 78L275 60L300 78L325 60L350 78L375 60L400 78V40H0Z" fill="#fff" opacity={0.9} /></g> : null}
    </svg>
  );
});
const Card: React.FC<{i: number; w: number; ch: number}> = React.memo(({i, w, ch}) => {
  const k = CARDS[i], m = w * 0.035;
  return (
    <div style={{position: 'absolute', left: m, top: m * 0.5, width: w - 2 * m, height: ch - m, borderRadius: w * 0.055, background: '#14161B', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: '68%', background: `linear-gradient(160deg, ${k.c[0]} 0%, ${k.c[1]} 55%, ${k.c[0]} 100%)`}}><Art k={k.art} c={k.c} /></div>
      <div style={{position: 'absolute', left: w * 0.04, top: '71.5%', width: w * 0.105, height: w * 0.105, borderRadius: '50%', background: `linear-gradient(140deg, ${k.c[1]}, ${k.c[0]})`}} />
      <div style={{position: 'absolute', left: w * 0.17, top: '70.5%', fontFamily: FONT, fontWeight: 600, fontSize: w * 0.05, color: '#F2F4F8', whiteSpace: 'nowrap'}}>{k.title}</div>
      <div style={{position: 'absolute', left: w * 0.17, top: '78.5%', fontFamily: FONT, fontWeight: 400, fontSize: w * 0.038, color: '#8E95A3', whiteSpace: 'nowrap'}}>{k.who} · {k.sub}</div>
      <svg viewBox="0 0 400 40" style={{position: 'absolute', left: 0, right: 0, bottom: '2.5%', width: '100%'}}>
        <path d="M34 12c-5-8-18-3-14 8c2 6 14 14 14 14s12-8 14-14c4-11-9-16-14-8Z" fill={i % 2 ? '#FF4F6D' : 'none'} stroke={i % 2 ? '#FF4F6D' : '#C9CFDA'} strokeWidth={2.4} />
        <path d="M92 8h26a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-14l-8 7v-7h-4a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6Z" fill="none" stroke="#C9CFDA" strokeWidth={2.4} />
        <path d="M168 30l10-22l10 22l-10-6Z" fill="none" stroke="#C9CFDA" strokeWidth={2.4} strokeLinejoin="round" />
        <rect x={300} y={11} width={74} height={20} rx={10} fill="#232733" /><rect x={300} y={11} width={74 * (0.35 + 0.5 * hash(i * 3.3))} height={20} rx={10} fill={k.c[0]} opacity={0.85} />
      </svg>
    </div>
  );
});
/** The scrolling feed. `scroll` px (any value, loops), `vblur` px of vertical motion blur. The blur is an equal-weight
 *  stack of offset copies, NOT an SVG filter: a filter inside the perspective-mapped screen layer of the 3D phone crashed
 *  the GPU process on some frames. */
export const Feed: React.FC<{w: number; h: number; scroll: number; vblur?: number; id: string; chrome?: boolean; tint?: string; tintA?: number}> = ({w, h, scroll, vblur = 0, chrome = true, tint, tintA = 0}) => {
  const ch = w * 1.16, n = CARDS.length, top = chrome ? w * 0.27 : 0;
  const layer = (sc: number) => {
    const k0 = Math.floor((sc - top) / ch);
    const cards: React.ReactNode[] = [];
    for (let k = k0; k * ch - sc + top < h; k++) cards.push(<div key={k} style={{position: 'absolute', left: 0, top: k * ch - sc + top, width: w, height: ch}}><Card i={((k % n) + n) % n} w={w} ch={ch} /></div>);
    return cards;
  };
  const N = vblur > 1 ? Math.min(12, 5 + Math.round(vblur / 4)) : 1;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: '#000'}}>
      {Array.from({length: N}).map((_, i) => <div key={i} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, opacity: 1 / (i + 1)}}>{layer(scroll + (N > 1 ? (i / (N - 1) - 0.5) * 2.6 * vblur : 0))}</div>)}
      {chrome ? (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: w * 0.27, background: 'linear-gradient(180deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0) 100%)'}} />
          <div style={{position: 'absolute', left: w * 0.06, top: w * 0.135, fontFamily: FONT, fontWeight: 700, fontSize: w * 0.082, color: '#fff', letterSpacing: '-0.01em'}}>For you</div>
          <div style={{position: 'absolute', right: w * 0.06, top: w * 0.15, width: w * 0.095, height: w * 0.095, borderRadius: '50%', background: 'linear-gradient(140deg,#7FD4FF,#5B6CFF)'}} />
          <div style={{position: 'absolute', left: w * 0.33, right: w * 0.33, bottom: w * 0.022, height: w * 0.012, borderRadius: w, background: 'rgba(255,255,255,0.85)'}} />
        </>
      ) : null}
      {tint && tintA > 0 ? <div style={{position: 'absolute', inset: 0, background: tint, opacity: tintA, mixBlendMode: 'multiply'}} /> : null}
    </div>
  );
};

// ---- the real phone (cine3d PhoneShot): what goes on its screen, and a touch without a hand ---------------------------
export const SCR_W = 402, SCR_H = 874;
/** phone-space point of a screen px (402 x 874 box, origin top-left as seen from the front) */
export const scrPt = (sx: number, sy: number): [number, number, number] => [2.2175 - (sx / SCR_W) * 4.435, 4.824 - (sy / SCR_H) * 9.648, -0.455];
export type Ripple = {age: number; color?: string; speed?: number; life?: number; w?: number; r0?: number};
/** A touch shown WITHOUT a hand: a soft glowing contact point with ripples, drawn in screen px so it lies on the real
 *  glass in perspective (PhoneShot maps the screen box onto the display). */
export const TouchFx: React.FC<{x: number; y: number; a?: number; color?: string; r?: number; ripples?: Ripple[]}> = ({x, y, a = 1, color = '#CFE6FF', r = 30, ripples = []}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0}}>
    {ripples.map((p, i) => {
      const life = p.life ?? 16, q = p.age / life;
      if (!(p.age > 0 && q < 1)) return null;
      const R = (p.r0 ?? r) + p.age * (p.speed ?? 9), c = p.color ?? color, w = (p.w ?? 7) * (1 - q) + 1.2;
      return <div key={i} style={{position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: '50%', boxSizing: 'border-box', border: `${w.toFixed(1)}px solid ${c}`, opacity: (1 - q) * (1 - q * 0.4), boxShadow: `0 0 ${14 * (1 - q)}px ${c}, inset 0 0 ${14 * (1 - q)}px ${c}`}} />;
    })}
    {a > 0.01 ? (
      <>
        <div style={{position: 'absolute', left: x - r * 2.8, top: y - r * 2.8, width: r * 5.6, height: r * 5.6, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, ${color}88 22%, ${color}22 50%, transparent 70%)`, opacity: 0.7 * a}} />
        <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.18) 100%)', boxShadow: `0 0 0 2px rgba(255,255,255,0.9), 0 0 22px ${color}`, opacity: a}} />
      </>
    ) : null}
  </div>
);
/** The feed as the phone's screen content (402 x 874 pt): status bar + feed + touch layer. */
export const ScreenFeed: React.FC<{id: string; scroll: number; vblur?: number; tint?: string; tintA?: number; children?: React.ReactNode}> = ({id, scroll, vblur, tint, tintA, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: SCR_W, height: SCR_H, overflow: 'hidden', background: '#000'}}>
    <Feed id={id} w={SCR_W} h={SCR_H} scroll={scroll} vblur={vblur} tint={tint} tintA={tintA} />
    <div style={{position: 'absolute', left: 34, top: 20, fontFamily: FONT, fontWeight: 700, fontSize: 16, color: '#fff'}}>9:41</div>
    <div style={{position: 'absolute', right: 30, top: 24, width: 26, height: 12, borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.7)'}}><div style={{position: 'absolute', left: 1.5, top: 1.5, bottom: 1.5, width: 17, borderRadius: 2, background: '#fff'}} /></div>
    {children}
  </div>
);
/** the studio floor under the real phone: horizon haze + a pool of light at the phone's foot (frame px) */
export const FloorPool: React.FC<{x: number; y: number; w?: number; a?: number; color?: string}> = ({x, y, w = 640, a = 1, color = '120,165,255'}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: y - 60, bottom: 0, background: 'linear-gradient(to bottom, rgba(2,3,6,0) 0%, rgba(2,3,6,0.7) 30%, rgba(2,3,6,0.9) 100%)', opacity: a}} />
    <div style={{position: 'absolute', left: x - w, top: y - 90, width: 2 * w, height: 220, background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${color},0.46) 0%, rgba(${color},0.16) 45%, rgba(${color},0) 72%)`, opacity: a}} />
    <div style={{position: 'absolute', left: x - w * 0.45, top: y - 32, width: w * 0.9, height: 76, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(214,228,255,0.3) 0%, rgba(214,228,255,0) 70%)', opacity: a}} />
  </>
);

export const Persp: React.FC<{x: number; y: number; s?: number; p?: number; children: React.ReactNode}> = ({x, y, s = 1, p = 2600, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${s})`}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, perspective: p, perspectiveOrigin: '0px 0px'}}>{children}</div>
  </div>
);

// ---- mechanical drum counter (own version: prefix, comma groups, per-drum positions) --------------------------------
export const Drums: React.FC<{
  pos: number[]; prev?: number[]; dim?: boolean[]; size: number; prefix?: string; group?: boolean; accent?: string; lit?: number; suffix?: string;
}> = ({pos, prev, dim, size, prefix, group = false, accent = GREEN, lit = 0, suffix}) => {
  const cw = size * 0.7, ch = size * 1.24, n = pos.length, pad = size * 0.17;
  const hex = (a: number) => Math.round(255 * cl(a)).toString(16).padStart(2, '0');
  const cols: React.ReactNode[] = [];
  if (prefix) cols.push(<div key="pre" style={{alignSelf: 'center', fontFamily: FONT, fontWeight: 700, fontSize: size * 0.86, color: accent, margin: `0 ${size * 0.08}px 0 ${size * 0.04}px`, textShadow: `0 0 ${size * 0.3 * lit}px ${accent}`}}>{prefix}</div>);
  pos.forEach((raw, i) => {
    const p = ((raw % 10) + 10) % 10, speed = prev ? Math.abs(raw - prev[i]) : 0, blur = Math.min(size * 0.07, speed * size * 0.06);
    cols.push(
      <div key={i} style={{position: 'relative', width: cw, height: ch, overflow: 'hidden', borderRadius: size * 0.07, opacity: dim?.[i] ? 0.3 : 1,
                           background: 'linear-gradient(180deg,#050608 0%,#22252B 16%,#3C4049 50%,#22252B 84%,#050608 100%)', boxShadow: `inset 0 0 ${size * 0.08}px rgba(0,0,0,0.95)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: (ch - size * 1.1) / 2 - p * size * 1.1, filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
          {Array.from({length: 11}).map((_, d) => <div key={d} style={{height: size * 1.1, lineHeight: `${size * 1.1}px`, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: size, color: '#F6F7F9', fontVariantNumeric: 'tabular-nums'}}>{d % 10}</div>)}
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,0.85) 100%)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: ch * 0.12, height: ch * 0.13, background: 'linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0))'}} />
      </div>,
    );
    if (group && (n - 1 - i) % 3 === 0 && i < n - 1) cols.push(<div key={`c${i}`} style={{alignSelf: 'flex-end', width: size * 0.13, height: size * 0.26, marginBottom: size * 0.02, borderRadius: `${size * 0.07}px ${size * 0.07}px ${size * 0.1}px ${size * 0.02}px`, background: dim?.[i + 1] ? '#3A3E46' : '#E9ECF0', transform: 'skewX(-12deg)'}} />);
  });
  return (
    <div style={{display: 'inline-flex', alignItems: 'flex-end', gap: size * 0.2, fontFamily: FONT}}>
      <div style={{display: 'inline-flex', gap: size * 0.055, padding: pad, borderRadius: size * 0.17, position: 'relative',
                   background: 'linear-gradient(145deg,#6A6F7A 0%,#2C2F36 30%,#131518 68%,#41454D 100%)',
                   boxShadow: `0 ${size * 0.22}px ${size * 0.55}px rgba(0,0,0,0.7), 0 0 ${size * 0.6}px ${accent}${hex(0.3 * lit)}, inset 0 ${size * 0.02}px 0 rgba(255,255,255,0.3), inset 0 -${size * 0.03}px ${size * 0.05}px rgba(0,0,0,0.6)`}}>
        {cols}
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], k) => (
          <div key={k} style={{position: 'absolute', width: size * 0.07, height: size * 0.07, borderRadius: size, left: x ? undefined : pad * 0.28, right: x ? pad * 0.28 : undefined, top: y ? undefined : pad * 0.28, bottom: y ? pad * 0.28 : undefined, background: 'radial-gradient(circle at 35% 35%,#D5DAE2,#4A4F57)'}} />
        ))}
        <div style={{position: 'absolute', top: pad * 0.3, left: '50%', width: size * 0.26, height: size * 0.055, borderRadius: size, transform: 'translateX(-50%)', background: lit > 0.05 ? accent : '#30343A', boxShadow: lit > 0.05 ? `0 0 ${size * 0.25}px ${accent}` : undefined}} />
      </div>
      {suffix ? <div style={{fontSize: size * 0.5, fontWeight: 700, color: '#E6E9EE', marginBottom: size * 0.2}}>{suffix}</div> : null}
    </div>
  );
};
/** digits of an integer value rolling with mechanical carry: fractional position per drum (most significant first) */
export const rollPos = (v: number, n: number) => Array.from({length: n}).map((_, k) => {
  const i = n - 1 - k, P = Math.pow(10, i);
  if (i === 0) return v;
  const frac = (v % P) / P, a = (P - 1) / P;
  return Math.floor(v / P) + sm((frac - a) / (1 - a));
});
export const Tag: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = '#C9D3E4', size = 26, style}) => (
  <div style={{fontFamily: MONO, fontWeight: 600, fontSize: size, letterSpacing: '0.14em', textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style}}>{children}</div>
);

// ---- "every frame on time": a row of frame-time bars with a steady tick (no line) ---------------------------------------
/** Frame-time bars as solid little blocks. `h` = heights, `tick` = float index of the slot that is being delivered right
 *  now (bars pulse as it passes, the dot above each slot lights and stays lit for a while), `redI`/`redK` tint one bar red. */
export const OnTimeBars: React.FC<{id: string; h: number[]; base: number; x0?: number; pitch?: number; bw?: number; tick?: number; redI?: number; redK?: number; a?: number; dots?: number}> = ({id, h, base, x0 = 52, pitch = 41.4, bw = 27, tick = -99, redI = -1, redK = 0, a = 1, dots = 1}) => {
  const dx = 10, dy = 8, n = h.length;
  const lit = (i: number) => { const d = (((tick - i) % n) + n) % n; return d < 1 ? d : Math.exp(-(d - 1) / 1.6); };
  const done = (i: number) => { const d = (((tick - i) % n) + n) % n; return cl(1 - d / (n * 0.8)); };
  return a > 0.004 ? (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8CFFC4" /><stop offset="0.25" stopColor={GREEN} /><stop offset="1" stopColor="#0C6B3F" /></linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB0B8" /><stop offset="0.2" stopColor={RED} /><stop offset="1" stopColor="#7A0A1A" /></linearGradient>
        <linearGradient id={`${id}-rf`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={0.3} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></linearGradient>
        <filter id={`${id}-bl`} x="-0.1" y="-0.6" width="1.2" height="2.2"><feGaussianBlur stdDeviation={16} /></filter>
        <mask id={`${id}-mk`}><rect x={0} y={base} width={1920} height={240} fill={`url(#${id}-rf)`} /></mask>
      </defs>
      <g filter={`url(#${id}-bl)`} opacity={0.55}>{h.map((v, i) => (v > 2 ? <rect key={i} x={x0 + i * pitch - 4} y={base - v - 4} width={bw + 8} height={v + 8} fill={i === redI && redK > 0.5 ? RED : GREEN} /> : null))}</g>
      <g mask={`url(#${id}-mk)`}>{h.map((v, i) => <rect key={i} x={x0 + i * pitch} y={base + 3} width={bw} height={v * 0.55} fill={i === redI && redK > 0.5 ? RED : GREEN} />)}</g>
      {h.map((v0, i) => {
        const l = lit(i), v = v0 + 16 * l, x = x0 + i * pitch, y = base - v, r = i === redI ? redK : 0;
        return v > 1 ? (
          <g key={i}>
            <path d={`M${x + bw} ${y}l${dx} ${-dy}V${base - dy}l${-dx} ${dy}Z`} fill={r > 0.5 ? '#8E1224' : '#0B5A36'} />
            <path d={`M${x} ${y}l${dx} ${-dy}h${bw}l${-dx} ${dy}Z`} fill={r > 0.5 ? '#FFD0D5' : '#C9FFE3'} />
            <rect x={x} y={y} width={bw} height={v} fill={`url(#${id}-g)`} />
            {r > 0.01 ? <rect x={x} y={y} width={bw} height={v} fill={`url(#${id}-r)`} opacity={r} /> : null}
            <rect x={x} y={y} width={bw} height={v} fill="#fff" opacity={0.45 * l} />
            <rect x={x} y={y} width={3} height={v} fill="#fff" opacity={0.35} />
            {dots > 0.01 ? <circle cx={x + bw / 2 + 4} cy={base - v0 - 44} r={6 + 3 * l} fill={l > 0.3 ? '#E6FFF2' : GREEN} opacity={dots * (0.16 + 0.84 * Math.max(l, done(i)))} /> : null}
          </g>
        ) : null;
      })}
    </svg>
  ) : null;
};
