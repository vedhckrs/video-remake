// Ready scene templates for the explainer style (style_system 5), built on premium.tsx parts: physical, lit
// objects instead of flat UI. Topic-specific worlds (hook hero, persistent stage, macro zoom, exploded x-ray,
// flow wires, device + meter) are composed from iso.tsx + hardware.tsx + stage.tsx per video - see
// references/styles/keyframes-explainer.md. All take design time t (frames @30) and frame size W, H.
import React from 'react';
import {Easing} from 'remotion';
import {BANDS, C, type Mode, alpha, sp, unit} from './tokens';
import {Badge, FONT, MONO, Marker, Stamp, prog} from './stage';
import {DrumCounter, GlassCard, MetalTitle, Pedestal, PhoneFrame} from './premium';

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const stageY = (H: number, f: number) => H * (BANDS.stageTop + (BANDS.stageBottom - BANDS.stageTop) * f);

/** Mouse cursor / fingertip that travels to points and presses (click scale + ripple). */
export const Cursor: React.FC<{t: number; path: {t: number; x: number; y: number; click?: boolean}[]; u: number; mode?: Mode; finger?: boolean}> = ({
  t, path, u, mode = 'dark', finger = false,
}) => {
  if (!path.length || t < path[0].t) return null;
  let x = path[0].x, y = path[0].y, press = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    if (t >= a.t) {
      const p = prog(t, a.t, Math.max(4, b.t - a.t), Easing.bezier(0.45, 0, 0.2, 1));
      x = lerp(a.x, b.x, p); y = lerp(a.y, b.y, p);
    }
  }
  let ripple = -1;
  for (const k of path) {
    if (k.click && t >= k.t && t < k.t + 6) press = Math.sin(((t - k.t) / 6) * Math.PI);
    if (k.click && t >= k.t && t < k.t + 14) ripple = (t - k.t) / 14;
  }
  if (finger) {
    return (
      <div style={{position: 'absolute', left: x - 22 * u, top: y - 10 * u, zIndex: 50}}>
        {ripple >= 0 ? <div style={{position: 'absolute', left: 22 * u - 40 * u * ripple, top: 10 * u - 40 * u * ripple, width: 80 * u * ripple, height: 80 * u * ripple,
                                    borderRadius: 999, border: `${3 * u}px solid ${alpha(C.info, 1 - ripple)}`}} /> : null}
        <div style={{width: 44 * u, height: 44 * u, borderRadius: 999, background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95), rgba(220,225,232,0.75))',
                     boxShadow: `0 ${8 * u}px ${18 * u}px rgba(0,0,0,0.35)`, transform: `scale(${1 - 0.22 * press})`}} />
      </div>
    );
  }
  const fill = mode === 'dark' ? '#FFFFFF' : '#0E0F11', stroke = mode === 'dark' ? '#0E0F11' : '#FFFFFF';
  return (
    <svg width={60 * u} height={60 * u} viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: y, zIndex: 50, overflow: 'visible',
         transform: `scale(${1 - 0.18 * press})`, transformOrigin: '0 0', filter: `drop-shadow(0 ${4 * u}px ${8 * u}px rgba(0,0,0,0.35))`}}>
      {ripple >= 0 ? <circle cx={2} cy={2} r={4 + 14 * ripple} fill="none" stroke={alpha(C.info, 1 - ripple)} strokeWidth={1.2} /> : null}
      <path d="M2,2 L2,19 L7,14.5 L10.5,21.5 L13.5,20 L10,13 L17,13 Z" fill={fill} stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
};

/** Compare: two objects on lit pedestals, drum counters under each, the winner's pedestal glows + stamp; ratio line. */
export const CompareSplit: React.FC<{
  t: number; at: number; W: number; H: number; mode?: Mode;
  left: {title: string; value: number; unit?: string; color?: string; node?: React.ReactNode};
  right: {title: string; value: number; unit?: string; color?: string; node?: React.ReactNode};
  winner?: 'left' | 'right'; stampText?: string; ratio?: string;
}> = ({t, at, W, H, left, right, winner, stampText = 'Winner', ratio}) => {
  const u = unit(W);
  const r = W * 0.15;
  const cy = stageY(H, 0.5);
  const side = (s: 'left' | 'right', d: typeof left, i: number) => {
    const cx = s === 'left' ? W * 0.27 : W * 0.73;
    const win = winner === s;
    const lose = winner && !win ? prog(t, at + 40, 12) : 0;
    const digits = String(Math.round(Math.max(left.value, right.value))).length;
    const size = Math.min(78 * u, (W * 0.4) / (digits * 0.8 + 1.2));
    return (
      <div key={s} style={{opacity: 1 - 0.45 * lose, filter: lose ? `saturate(${1 - 0.6 * lose})` : undefined}}>
        <div style={{position: 'absolute', left: cx - W * 0.22, width: W * 0.44, top: stageY(H, 0.02), textAlign: 'center', fontFamily: FONT, fontWeight: 700,
                     fontSize: 32 * u, letterSpacing: '0.14em', textTransform: 'uppercase', color: win ? (d.color ?? C.ok) : '#AEB3BA',
                     opacity: prog(t, at + i * 5, 8)}}>{d.title}</div>
        <Pedestal cx={cx} cy={cy} r={r} u={u} t={t} at={at + i * 5} winner={win}>{d.node}</Pedestal>
        <div style={{position: 'absolute', left: cx - W * 0.24, width: W * 0.48, top: cy + r * 0.95, display: 'flex', justifyContent: 'center'}}>
          <DrumCounter t={t} at={at + 10 + i * 5} to={d.value} size={size} unitText={d.unit} housing accent={d.color ?? C.info} digits={digits} />
        </div>
      </div>
    );
  };
  return (
    <>
      {side('left', left, 0)}
      {side('right', right, 1)}
      <div style={{position: 'absolute', left: W / 2 - 44 * u, top: cy - 44 * u - r * 0.6, width: 88 * u, height: 88 * u, borderRadius: 44 * u,
                   background: 'linear-gradient(145deg,#2E3238,#121417)', boxShadow: `0 ${10 * u}px ${24 * u}px rgba(0,0,0,0.6), inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.15)`,
                   display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30 * u, color: '#AEB3BA',
                   opacity: prog(t, at + 8, 8)}}>VS</div>
      {winner ? (
        <div style={{position: 'absolute', left: winner === 'left' ? W * 0.06 : W * 0.54, top: stageY(H, 0.16)}}>
          <Stamp t={t} at={at + 44} text={stampText} u={u} color={(winner === 'left' ? left.color : right.color) ?? C.ok} />
        </div>
      ) : null}
      {ratio ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: stageY(H, 0.92), textAlign: 'center', fontFamily: FONT, fontWeight: 800,
                     fontSize: 64 * u, color: '#FFFFFF', opacity: prog(t, at + 50, 8), transform: `scale(${0.8 + 0.2 * sp(t, at + 50, 'pop')})`}}>{ratio}</div>
      ) : null}
    </>
  );
};

/** Evidence card: a web page in a glass browser frame swinging in; lines appear; the quoted line gets a marker sweep. */
export const EvidenceDoc: React.FC<{
  t: number; at: number; W: number; H: number; source: string; title: string; lines: string[]; markLine?: number; markAt?: number;
  footnote?: string; mode?: Mode; logo?: React.ReactNode;
}> = ({t, at, W, H, source, title, lines, markLine, markAt, footnote, logo}) => {
  const u = unit(W);
  return (
    <GlassCard t={t} at={at} x={W * 0.08} y={stageY(H, 0.04)} w={W * 0.84} u={u} light>
      <div style={{height: 60 * u, background: 'linear-gradient(180deg,#F1F3F6,#E6E9ED)', display: 'flex', alignItems: 'center', gap: 10 * u, padding: `0 ${24 * u}px`,
                   borderBottom: `${1 * u}px solid rgba(0,0,0,0.06)`}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 16 * u, height: 16 * u, borderRadius: 8 * u, background: c, boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.2)'}} />)}
        <div style={{marginLeft: 16 * u, flex: 1, height: 36 * u, borderRadius: 18 * u, background: '#FFFFFF', fontSize: 22 * u, color: '#6B6E73',
                     display: 'flex', alignItems: 'center', gap: 10 * u, padding: `0 ${18 * u}px`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)'}}>
          <span style={{color: C.ok}}>●</span>{source}
        </div>
      </div>
      <div style={{padding: 40 * u}}>
        {logo ? <div style={{marginBottom: 18 * u}}>{logo}</div> : null}
        <div style={{fontSize: 44 * u, fontWeight: 700, marginBottom: 22 * u, lineHeight: 1.18, letterSpacing: '-0.01em'}}>{title}</div>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: 32 * u, lineHeight: 1.5, color: '#3A3D42', opacity: prog(t, at + 8 + i * 3, 6),
                               transform: `translateY(${(1 - prog(t, at + 8 + i * 3, 6)) * 10 * u}px)`}}>
            {i === markLine ? <Marker t={t} at={markAt ?? at + 22}>{l}</Marker> : l}
          </div>
        ))}
        {footnote ? <div style={{marginTop: 24 * u, fontSize: 22 * u, color: '#8E9196'}}>{footnote}</div> : null}
      </div>
    </GlassCard>
  );
};

/** Terminal on dark glass: typed commands (key clicks in bursts), glowing output lines, blinking caret. */
export const Terminal: React.FC<{
  t: number; at: number; W: number; H: number; steps: {type?: string; print?: string; at: number; color?: string}[]; title?: string; cps?: number; y?: number;
}> = ({t, at, W, H, steps, title = 'terminal', cps = 1.1, y}) => {
  const u = unit(W);
  return (
    <GlassCard t={t} at={at} x={W * 0.07} y={y ?? stageY(H, 0.1)} w={W * 0.86} u={u} style={{background: 'linear-gradient(180deg,#121418,#0A0B0D)'}}>
      <div style={{height: 54 * u, background: 'linear-gradient(180deg,#1E2126,#16181C)', display: 'flex', alignItems: 'center', gap: 10 * u, padding: `0 ${22 * u}px`}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 15 * u, height: 15 * u, borderRadius: 8 * u, background: c}} />)}
        <div style={{marginLeft: 12 * u, fontSize: 22 * u, color: '#8E9196', fontFamily: MONO}}>{title}</div>
      </div>
      <div style={{padding: 32 * u, fontFamily: MONO, fontSize: 32 * u, lineHeight: 1.6, minHeight: 280 * u}}>
        {steps.map((s, i) => {
          if (t < s.at) return null;
          if (s.type !== undefined) {
            const n = Math.min(s.type.length, Math.floor((t - s.at) * cps * 2));
            const typing = n < s.type.length;
            return (
              <div key={i} style={{color: '#E6E8EB'}}>
                <span style={{color: C.ok, textShadow: `0 0 ${10 * u}px ${alpha(C.ok, 0.6)}`}}>❯ </span>{s.type.slice(0, n)}
                {typing || Math.floor(t / 8) % 2 === 0 ? <span style={{display: 'inline-block', width: 16 * u, height: 32 * u, verticalAlign: 'middle', background: '#E6E8EB'}} /> : null}
              </div>
            );
          }
          const col = s.color ?? '#9AA0A8';
          return <div key={i} style={{color: col, opacity: prog(t, s.at, 4), textShadow: s.color ? `0 0 ${12 * u}px ${alpha(col, 0.55)}` : undefined}}>{s.print}</div>;
        })}
      </div>
    </GlassCard>
  );
};

/** Recap checklist: glass rows swing in on a stagger and tick green. */
export const RecapList: React.FC<{t: number; at: number; W: number; H: number; items: string[]; every?: number; mode?: Mode; title?: string}> = ({
  t, at, W, H, items, every = 18, title,
}) => {
  const u = unit(W);
  const rowH = 108 * u, gap = 20 * u;
  return (
    <>
      {title ? <div style={{position: 'absolute', left: 0, right: 0, top: stageY(H, 0.02), textAlign: 'center', fontFamily: FONT, fontSize: 34 * u, fontWeight: 700,
                            letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8E9196', opacity: prog(t, at, 6)}}>{title}</div> : null}
      {items.map((it, i) => (
        <GlassCard key={i} t={t} at={at + i * every} x={W * 0.1} y={stageY(H, 0.1) + i * (rowH + gap)} w={W * 0.8} h={rowH} u={u} rest={[0, 0]} radius={22}>
          <div style={{display: 'flex', alignItems: 'center', gap: 24 * u, height: '100%', padding: `0 ${30 * u}px`}}>
            <Badge t={t} at={at + i * every + 6} kind="ok" size={56 * u} />
            <div style={{fontSize: 38 * u, fontWeight: 600}}>{it}</div>
          </div>
        </GlassCard>
      ))}
    </>
  );
};

/** Acted-out CTA on a real phone: profile screen, a fingertip presses Follow (or Send / types a comment), state flips. */
export const SocialCTA: React.FC<{
  t: number; at: number; W: number; H: number; kind?: 'follow' | 'send' | 'comment'; name: string; keyword?: string; avatar?: React.ReactNode; mode?: Mode;
  handle?: string; stats?: [string, string][];
}> = ({t, at, W, H, kind = 'follow', name, keyword = 'SSD', avatar, handle, stats = [['128', 'posts'], ['42K', 'followers'], ['310', 'following']]}) => {
  const u = unit(W);
  const pw = W * 0.4, px = (W - pw) / 2, py = stageY(H, -0.04);
  const sw = pw * 0.93;                       // screen width (inside bezel)
  const k = sw / 500;                         // screen design units (500 wide)
  const pressAt = at + 26;
  const flipped = t >= pressAt + 3;
  const typed = kind === 'comment' ? keyword.slice(0, Math.max(0, Math.floor((t - at - 10) / 2.5))) : '';
  const btn = kind === 'follow' ? (flipped ? 'Following' : 'Follow') : kind === 'send' ? (flipped ? 'Sent ✓' : 'Send') : 'Post';
  const btnX = px + pw * 0.035 + 40 * k, btnY = py + pw * 0.035 + 420 * k, btnW = 420 * k, btnH = 64 * k;
  return (
    <>
      <PhoneFrame x={px} y={py} w={pw} u={u} t={t} at={at}>
        <div style={{position: 'absolute', inset: 0, fontFamily: FONT, color: '#0E0F11', background: '#FFFFFF'}}>
          <div style={{height: 90 * k}} />
          <div style={{display: 'flex', alignItems: 'center', gap: 30 * k, padding: `0 ${40 * k}px`}}>
            <div style={{width: 150 * k, height: 150 * k, borderRadius: 999, padding: 5 * k, background: `conic-gradient(${C.brand}, #FFB648, ${C.brand})`}}>
              <div style={{width: '100%', height: '100%', borderRadius: 999, background: '#fff', padding: 5 * k, boxSizing: 'border-box'}}>
                <div style={{width: '100%', height: '100%', borderRadius: 999, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                             background: `linear-gradient(135deg, ${C.brand}, #FF9A62)`, color: '#fff', fontWeight: 800, fontSize: 64 * k}}>{avatar ?? name.slice(0, 1)}</div>
              </div>
            </div>
            <div style={{display: 'flex', gap: 26 * k}}>
              {stats.map(([n, l]) => (
                <div key={l} style={{textAlign: 'center'}}><div style={{fontSize: 34 * k, fontWeight: 700}}>{n}</div><div style={{fontSize: 22 * k, color: '#6B6E73'}}>{l}</div></div>
              ))}
            </div>
          </div>
          <div style={{padding: `${22 * k}px ${40 * k}px 0`}}>
            <div style={{fontSize: 32 * k, fontWeight: 700}}>{name}</div>
            <div style={{fontSize: 24 * k, color: '#6B6E73', marginTop: 4 * k}}>{handle ?? 'tech, explained in 90 seconds'}</div>
          </div>
          {kind === 'comment' ? (
            <div style={{position: 'absolute', left: 40 * k, right: 40 * k, top: 420 * k, height: 64 * k, borderRadius: 32 * k, background: '#F0F2F5', fontSize: 26 * k,
                         display: 'flex', alignItems: 'center', padding: `0 ${24 * k}px`}}>{typed || <span style={{color: '#9AA0A8'}}>Add a comment…</span>}</div>
          ) : (
            <div style={{position: 'absolute', left: 40 * k, top: 420 * k, width: btnW / 1, height: btnH, borderRadius: 14 * k, fontSize: 28 * k, fontWeight: 700,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', background: flipped ? '#EFEFF1' : C.info, color: flipped ? '#0E0F11' : '#fff',
                         transform: `scale(${flipped ? 0.97 + 0.03 * sp(t, pressAt + 3, 'pop') : 1})`}}>{btn}</div>
          )}
          <div style={{position: 'absolute', left: 0, right: 0, top: 520 * k, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 * k}}>
            {Array.from({length: 9}).map((_, i) => (
              <div key={i} style={{aspectRatio: '1', position: 'relative', overflow: 'hidden',
                                   background: `linear-gradient(${135 + i * 20}deg, ${['#1B2333', '#14261E', '#2A1B2E'][i % 3]}, ${['#2F4A78', '#1F6B48', '#6B2F5A'][i % 3]})`}}>
                <div style={{position: 'absolute', left: '18%', top: '22%', width: '64%', height: '40%', borderRadius: 10 * k, background: 'rgba(255,255,255,0.12)'}} />
                <div style={{position: 'absolute', left: '18%', bottom: '16%', width: '44%', height: '8%', borderRadius: 6 * k, background: 'rgba(255,255,255,0.55)'}} />
              </div>
            ))}
          </div>
        </div>
      </PhoneFrame>
      <Cursor t={t} u={u} finger path={[{t: at + 8, x: btnX + btnW * 0.7, y: btnY + btnH * 3}, {t: pressAt, x: btnX + btnW * 0.5, y: btnY + btnH * 0.5, click: true},
                                         {t: pressAt + 24, x: btnX + btnW * 0.62, y: btnY + btnH * 2.2}]} />
    </>
  );
};

/** Chapter card: metal title with a light sweep landing in the stage band (impact on landing, riser before). */
export const ChapterCard: React.FC<{t: number; at: number; W: number; H: number; n: number; title: string; out?: number; mode?: Mode}> = ({t, at, W, H, n, title, out}) => (
  <MetalTitle t={t} at={at} kicker={`STEP ${n}`} title={title} W={W} y={stageY(H, 0.3)} out={out} />
);
