// cine3d-demo: the 2D world round the 3D elements (dark studio, light pool, lens layer) and the live feed that is
// mapped onto the phone's screen.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SiLens} from '../../../src/kit/explainer/silicon';

export const smooth = (q: number) => { const c = Math.max(0, Math.min(1, q)); return c * c * (3 - 2 * c); };
export const ease = (q: number) => { const c = Math.max(0, Math.min(1, q)); return 1 - Math.pow(1 - c, 3); };

/** Dark studio: a cool wall glow behind the subject and a pool of light on the floor at `pool` (frame px). The
 *  key comes from the upper left and the rim is cool blue, like cine3d's Studio. */
export const StudioWorld: React.FC<{W: number; H: number; pool?: {x: number; y: number}; glow?: [number, number]; poolW?: number; warm?: number; children?: React.ReactNode}> = ({W, H, pool, glow = [0.5, 0.42], poolW = 0.34, warm = 1, children}) => {
  const hy = pool ? pool.y : H * 0.8;
  return (
    <AbsoluteFill style={{background: '#03050A', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 70% at ${glow[0] * 100}% ${glow[1] * 100}%, #1B2D52 0%, #0C1528 42%, rgba(3,5,10,0) 78%)`}} />
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 40% 46% at 22% 8%, rgba(255,236,214,${0.1 * warm}) 0%, rgba(255,236,214,0) 70%)`}} />
      {pool ? (
        <>
          {/* floor: darker below the horizon, with the pool where the subject stands */}
          <div style={{position: 'absolute', left: 0, right: 0, top: hy - H * 0.06, bottom: 0, background: 'linear-gradient(to bottom, rgba(2,3,6,0) 0%, rgba(2,3,6,0.72) 30%, rgba(2,3,6,0.9) 100%)'}} />
          <div style={{position: 'absolute', left: pool.x - W * poolW, top: hy - H * 0.085, width: W * poolW * 2, height: H * 0.2, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(120,165,255,0.46) 0%, rgba(70,110,210,0.18) 45%, rgba(60,100,200,0) 72%)'}} />
          <div style={{position: 'absolute', left: pool.x - W * poolW * 0.45, top: hy - H * 0.03, width: W * poolW * 0.9, height: H * 0.07, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(214,228,255,0.30) 0%, rgba(214,228,255,0) 70%)'}} />
        </>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

export const Lens: React.FC<{W: number; H: number; t: number; seed?: number; vignette?: number}> = ({W, H, t, seed = 5, vignette = 0.62}) => (
  <SiLens W={W} H={H} t={t} blur={0} vignette={vignette} dust={9} tint="#6FA8FF" seed={seed} grain={0.45} />
);

// ---- the feed on the screen (402 x 874 pt) ----------------------------------------------------------------------
const POSTS = [
  {n: 'Maya Chen', h: '@maya.frames', c: ['#FF7A59', '#FFB86B', '#7A2BFF'], k: 0},
  {n: 'Studio Nord', h: '@studionord', c: ['#27D3A2', '#1F6BFF', '#0A1A4A'], k: 1},
  {n: 'Leo Park', h: '@leopark', c: ['#FF4FA3', '#7A5CFF', '#16123A'], k: 2},
  {n: 'Field Notes', h: '@fieldnotes', c: ['#FFD166', '#EF476F', '#3A0E2A'], k: 3},
  {n: 'Aria Vale', h: '@ariavale', c: ['#4CC9F0', '#4361EE', '#10163A'], k: 4},
  {n: 'Kite and Co', h: '@kiteco', c: ['#B8F35A', '#18A999', '#06302E'], k: 5},
  {n: 'Sol Marin', h: '@solmarin', c: ['#FF9F1C', '#E71D36', '#2B0A14'], k: 6},
];
const CARD = 468;
/** scroll position (px): a flick every 44 frames, eased out, so it reads as a thumb scrolling */
export const feedScroll = (t: number) => {
  const per = 44, step = 392;
  const n = Math.floor(Math.max(0, t) / per), f = (Math.max(0, t) - n * per) / per;
  return n * step + step * (1 - Math.pow(1 - Math.min(1, f / 0.62), 3.2));
};
export const Feed: React.FC<{t: number; strip?: boolean}> = ({t, strip = true}) => {
  const sc = feedScroll(t) % (CARD * POSTS.length);
  const cards: React.ReactNode[] = [];
  for (let i = -1; i < POSTS.length * 2; i++) {
    const y = 104 + i * CARD - sc;
    if (y < -CARD || y > 900) continue;
    const p = POSTS[((i % POSTS.length) + POSTS.length) % POSTS.length];
    cards.push(
      <div key={i} style={{position: 'absolute', left: 0, top: y, width: 402, height: CARD}}>
        <div style={{position: 'absolute', left: 16, top: 12, width: 38, height: 38, borderRadius: 19, background: `linear-gradient(135deg, ${p.c[0]}, ${p.c[1]})`}} />
        <div style={{position: 'absolute', left: 64, top: 11, fontSize: 15, fontWeight: 700, color: '#F4F5F7'}}>{p.n}</div>
        <div style={{position: 'absolute', left: 64, top: 31, fontSize: 12.5, color: '#8C909A'}}>{p.h} · 2h</div>
        <div style={{position: 'absolute', left: 12, top: 62, width: 378, height: 330, borderRadius: 22, overflow: 'hidden', background: `linear-gradient(${140 + p.k * 23}deg, ${p.c[0]} 0%, ${p.c[1]} 45%, ${p.c[2]} 100%)`}}>
          <div style={{position: 'absolute', left: 40 + p.k * 21, top: 150 - p.k * 9, width: 240, height: 240, borderRadius: p.k % 2 ? 120 : 44, background: 'linear-gradient(200deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05))', transform: `rotate(${p.k * 17}deg)`}} />
          <div style={{position: 'absolute', left: -40, top: -60 + p.k * 14, width: 220, height: 220, borderRadius: 110, background: 'rgba(0,0,0,0.22)'}} />
          <div style={{position: 'absolute', right: 26, top: 30, width: 92, height: 92, borderRadius: 46, background: 'rgba(255,255,255,0.82)'}} />
        </div>
        <div style={{position: 'absolute', left: 18, top: 404, display: 'flex', gap: 14, alignItems: 'center', color: '#C9CCD3', fontSize: 13.5, fontWeight: 600}}>
          <div style={{width: 16, height: 16, borderRadius: 8, background: '#FF5C7A'}} /><span>{(12.4 + p.k * 3.1).toFixed(1)}k</span>
          <div style={{width: 16, height: 16, borderRadius: 5, background: 'rgba(255,255,255,0.4)', marginLeft: 12}} /><span>{240 + p.k * 57}</span>
          <div style={{width: 16, height: 16, borderRadius: 3, background: 'rgba(255,255,255,0.4)', marginLeft: 12, transform: 'rotate(45deg)'}} /><span>Share</span>
        </div>
        <div style={{position: 'absolute', left: 16, right: 16, bottom: 6, height: 1, background: 'rgba(255,255,255,0.07)'}} />
      </div>,
    );
  }
  // frame-time strip: one bar per rendered frame, all under the 8.3 ms line
  const bars = Array.from({length: 46}, (_, i) => {
    const k = Math.floor(t * 2) - i;
    const v = 0.45 + 0.3 * Math.abs(Math.sin(k * 1.7) * Math.cos(k * 0.61));
    return <div key={i} style={{position: 'absolute', right: 6 + i * 7.6, bottom: 6, width: 5, height: 30 * v, borderRadius: 2, background: '#3CE281', opacity: 0.95 - i * 0.012}} />;
  });
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 402, height: 874, background: '#0A0B0F', fontFamily: 'Poppins, Inter, sans-serif', overflow: 'hidden'}}>
      {cards}
      <div style={{position: 'absolute', left: 0, top: 0, width: 402, height: 108, background: 'linear-gradient(to bottom, rgba(10,11,15,1) 62%, rgba(10,11,15,0))'}} />
      <div style={{position: 'absolute', left: 30, top: 19, fontSize: 16, fontWeight: 700, color: '#fff'}}>9:41</div>
      <div style={{position: 'absolute', right: 28, top: 22, width: 26, height: 12, borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.7)'}}><div style={{position: 'absolute', left: 1.5, top: 1.5, bottom: 1.5, width: 17, borderRadius: 2, background: '#fff'}} /></div>
      <div style={{position: 'absolute', left: 0, top: 62, width: 402, textAlign: 'center', fontSize: 16.5, fontWeight: 700, color: '#fff'}}>
        <span style={{opacity: 0.45, marginRight: 26}}>Following</span><span style={{borderBottom: '2.5px solid #fff', paddingBottom: 5}}>For you</span>
      </div>
      {strip ? (
        <div style={{position: 'absolute', left: 14, bottom: 96, width: 374, height: 64, borderRadius: 14, background: 'rgba(8,10,14,0.82)', border: '1px solid rgba(255,255,255,0.12)'}}>
          <div style={{position: 'absolute', left: 10, top: 7, fontSize: 9.5, letterSpacing: 1.6, fontWeight: 700, color: '#8FE8B4', fontFamily: 'JetBrains Mono, monospace'}}>FRAME TIME · 120 Hz</div>
          <div style={{position: 'absolute', right: 10, top: 6, fontSize: 10.5, fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace'}}>8.3 ms</div>
          <div style={{position: 'absolute', left: 8, right: 8, top: 23, height: 1, background: 'rgba(255,255,255,0.28)'}} />
          {bars}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: 402, height: 84, background: 'rgba(10,11,15,0.94)', borderTop: '1px solid rgba(255,255,255,0.08)'}}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{position: 'absolute', left: 38 + i * 76, top: 16, width: 26, height: 26, borderRadius: i === 2 ? 9 : 13, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.32)'}} />)}
        <div style={{position: 'absolute', left: 134, bottom: 9, width: 134, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.85)'}} />
      </div>
    </div>
  );
};
