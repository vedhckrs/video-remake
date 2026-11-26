// PhotoStage - the premium way to show ONE real photograph (Ved, 26 Nov 2026: a plain framed photo over a dark band
// "looks cheap"). An editorial spread: the photo as a lit, slightly turned glass-framed print on one side, big
// typography on the other, on a studio backdrop with a coloured light pool. Nothing is drawn over the photograph and
// it is not recoloured or composited (share-alike photos stay unaltered); the turn is only how the print is displayed.
// Pure function of the design time t. Screen-space HTML: draw it in a World `Overlay` or as the whole scene, and give
// the scene a `credit` in script.json (the engine draws the Source line bottom-right).
import React from 'react';
import {Img, staticFile} from 'remotion';
import {FONT} from './stage';
import {unit} from './tokens';
import type {KenBurns} from './media';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeSine = (q: number) => 0.5 - 0.5 * Math.cos(Math.PI * q);
const easeOut = (q: number) => 1 - Math.pow(1 - q, 3);

export const PhotoStage: React.FC<{
  /** file under public/, e.g. `<id>/img/a4.jpg` */
  src: string; t: number; W: number; H: number;
  /** scene length and the design frame the spread enters (the slow push lasts until `dur`) */
  dur?: number; at?: number;
  /** print height / width (default 1 = square); the image covers the print */
  aspect?: number;
  /** side of the print ('left' default); the text block takes the other side */
  side?: 'left' | 'right';
  /** print height as a fraction of the frame height (default 0.6) and its turn in degrees (default 7) */
  size?: number; tilt?: number;
  /** small tracked line above the title, the subject, and 1-3 fact lines */
  eyebrow?: string; title?: string; lines?: string[];
  /** design frames (relative to `at`) at which eyebrow, title and each line appear - e.g. word cues */
  reveal?: number[];
  accent?: string; bg?: string; from?: KenBurns; to?: KenBurns; position?: string;
}> = ({src, t, W, H, dur = 240, at = 0, aspect = 1, side = 'left', size = 0.6, tilt = 7, eyebrow, title, lines = [], reveal,
       accent = '#F2B56B', bg = '#06080D', from, to, position = 'center'}) => {
  const u = unit(W, H);
  const k = t - at;
  const enter = easeOut(clamp01(k / 22));
  if (k <= 0) return null;
  const left = side === 'left';
  // print box: `size` of the frame height, centred on 43 % of the height, 9 % in from its side
  const ph = H * size, pw = ph / aspect;
  const px = left ? W * 0.09 : W * 0.91 - pw, py = H * 0.43 - ph / 2;
  const drift = Math.sin((k / 30) * 0.5) * 0.6;                       // slow float, +-0.6 deg
  const ry = (left ? 1 : -1) * (tilt * (1.6 - 0.6 * enter) + drift);  // settles from a wider turn
  const a = {scale: 1.02, x: 0.5, y: 0.5, ...(from ?? {})};
  const b = {scale: 1.1, x: a.x, y: a.y, ...(to ?? {})};
  const p = easeSine(clamp01(k / Math.max(1, dur - at)));
  const s = Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * p);
  const fx = a.x + (b.x - a.x) * p, fy = a.y + (b.y - a.y) * p;
  const sweep = clamp01((k - 14) / 34);                                // one glass sweep after it lands
  const r = 16 * u;
  // text block on the other side
  const tx = left ? px + pw + W * 0.07 : W * 0.09;
  const tw = left ? W * 0.93 - tx : px - W * 0.07 - tx;
  const rv = (i: number) => easeOut(clamp01((k - (reveal?.[i] ?? 10 + i * 9)) / 14));
  const row = (i: number): React.CSSProperties => ({opacity: rv(i), transform: `translateY(${(1 - rv(i)) * 18 * u}px)`});
  const g = 18 * u, tl = 24 * u; // gap between the print and its corner ticks, tick length
  const tick = (cx: number, cy: number, dx: number, dy: number) => (
    <path key={`${dx}${dy}`} d={`M${cx + dx * tl} ${cy} L${cx} ${cy} L${cx} ${cy + dy * tl}`} fill="none" stroke={accent}
          strokeWidth={2 * u} strokeLinecap="round" opacity={0.9 * enter} />
  );
  const cxp = ((px + pw / 2) / W) * 100;
  return (
    <div style={{position: 'absolute', inset: 0, background: bg, overflow: 'hidden', opacity: clamp01(k / 8)}}>
      {/* studio backdrop: a coloured light pool behind the print, a cool rim on the text side, a vignette */}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse ${W * 0.46}px ${H * 0.62}px at ${cxp}% 44%, ${accent}30, ${accent}10 45%, transparent 72%)`}} />
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse ${W * 0.5}px ${H * 0.5}px at ${left ? 88 : 12}% 30%, rgba(120,150,255,0.10), transparent 70%)`}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      {/* the print */}
      <div style={{position: 'absolute', left: px, top: py, width: pw, height: ph, perspective: 2200 * u, perspectiveOrigin: left ? '120% 50%' : '-20% 50%'}}>
        <div style={{position: 'absolute', inset: 0,
                     transform: `translateY(${(1 - enter) * 40 * u}px) rotateY(${ry.toFixed(3)}deg) scale(${(0.94 + 0.06 * enter).toFixed(4)})`, opacity: enter}}>
          <div style={{position: 'absolute', left: '6%', right: '6%', bottom: -34 * u, height: 60 * u, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', filter: `blur(${26 * u}px)`}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: r, overflow: 'hidden', background: '#05070B',
                       boxShadow: `0 ${50 * u}px ${120 * u}px rgba(0,0,0,0.65), 0 ${14 * u}px ${36 * u}px rgba(0,0,0,0.45), 0 0 ${90 * u}px ${accent}22`}}>
            <Img src={staticFile(src)}
                 style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', maxWidth: 'none', objectFit: 'cover', objectPosition: position,
                         transformOrigin: `${(fx * 100).toFixed(3)}% ${(fy * 100).toFixed(3)}%`, transform: `scale(${s.toFixed(6)})`}} />
          </div>
          {/* glass over the print: edge light and one travelling sweep (a display effect, the photo pixels are untouched) */}
          <div style={{position: 'absolute', inset: 0, borderRadius: r, pointerEvents: 'none',
                       boxShadow: `inset 0 0 0 ${1.5 * u}px rgba(255,255,255,0.22), inset 0 ${2 * u}px 0 rgba(255,255,255,0.28)`,
                       background: sweep > 0 && sweep < 1
                         ? `linear-gradient(105deg, transparent ${sweep * 130 - 30}%, rgba(255,255,255,0.14) ${sweep * 130 - 12}%, rgba(255,255,255,0.03) ${sweep * 130}%, transparent ${sweep * 130 + 6}%)`
                         : undefined}} />
        </div>
      </div>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {tick(px - g, py - g, 1, 1)}{tick(px + pw + g, py - g, -1, 1)}{tick(px - g, py + ph + g, 1, -1)}{tick(px + pw + g, py + ph + g, -1, -1)}
      </svg>
      {/* editorial text block, vertically centred on the print */}
      <div style={{position: 'absolute', left: tx, width: tw, top: py, height: ph, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: FONT, color: '#F4F6FA'}}>
        {eyebrow ? <div style={{...row(0), fontSize: 22 * u, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 20 * u}}>{eyebrow}</div> : null}
        {title ? <div style={{...row(1), fontSize: 118 * u, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.02em', marginBottom: 26 * u}}>{title}</div> : null}
        <div style={{width: 96 * u * rv(1), height: 3 * u, background: accent, borderRadius: 2 * u, marginBottom: 26 * u}} />
        {lines.map((ln, i) => (
          <div key={i} style={{...row(2 + i), fontSize: 32 * u, fontWeight: 400, lineHeight: 1.35, color: 'rgba(244,246,250,0.82)'}}>{ln}</div>
        ))}
      </div>
    </div>
  );
};
