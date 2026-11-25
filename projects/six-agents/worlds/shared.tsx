// six-agents shared parts (written by the lead session - world agents READ this, never edit it).
// Real assets only: every mascot / logo / screenshot below was captured from the agent's OFFICIAL site on
// 25 Nov 2026 (public/six-agents/img). Use them unaltered - move, scale, rotate, float, peek, fade are fine;
// never recolour, redraw, cut parts off or add accessories to a mascot.
import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';

export {FONT, MONO};

/** public/six-agents/img/<name> */
export const IMG = (name: string) => staticFile(`six-agents/img/${name}`);
/** public/six-agents/img/mascots/<name> */
export const MASCOT = (name: string) => staticFile(`six-agents/img/mascots/${name}`);

/** Available real assets (all PNG; sizes in px). */
export const ASSETS = {
  // Dots (OpenAI) - square card art cropped from OpenAI's official dots slides (pastel panel = official background)
  dotsIggy: MASCOT('card_dots_iggy.png'),     // 720x720 pink Iggy with headphones (THE Dots mascot in Ved's reel)
  dotsAlfred: MASCOT('card_dots_alfred.png'), // 720x720 yellow Alfred, glasses + bow tie, peeking from bottom-right
  dotsTodd: MASCOT('card_dots_todd.png'),     // 720x720 green Todd peeking up from the bottom
  dotsJojo: MASCOT('card_dots_jojo.png'),     // 720x720 pink heart Jojo with sunglasses (whole)
  dotsSlides: ['dots_iggy_slide.png', 'dots_felipe_slide.png', 'dots_todd_slide.png', 'dots_alfred_slide.png', 'dots_jojo_slide.png']
    .map(MASCOT),                             // 1900x1069 official full slides (mascot + real product UI)
  dotsRing: MASCOT('dots_logo.png'),          // 900x900 grey ring "o" (dots logo, transparent)
  openaiLogo: MASCOT('openai_logo.png'),      // 509x136 black "OpenAI" wordmark, transparent (use filter invert(1) on dark)
  // Muse (Meta)
  museCreature: MASCOT('card_muse.png'),      // 720x720 the fluffy Muse creature waving (official art, light background)
  museIcon: MASCOT('muse_icon.png'),          // 600x600 blue "m" app icon (rounded square, transparent corners)
  museChat: MASCOT('muse_feat_chat.png'),     // 1400x1400 official feature image: phone chat + creature
  museTickets: MASCOT('muse_feat_tickets.png'),
  museGoals: MASCOT('muse_feat_goals.png'),
  museSecure: MASCOT('muse_secure.png'),      // 1400x1356 "Secure credentials store" card
  // Grok Bot (xAI) - transparent, 900x900 each
  grokLogo: MASCOT('grokbot_logo.png'),       // black round bot with two white eyes (Grok Bot mark)
  grokBots: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => MASCOT(`grokbot_bot${i}.png`)), // brown, red, orange, amber, green, teal, blue, purple, pink
  xaiLogo: MASCOT('xai_logo.png'),            // 408x155 black xAI mark, transparent (invert on dark)
  // Claude Duet (Anthropic)
  duetIcon: MASCOT('duet_icon.png'),          // 900x900 app icon: orange blob + black squiggle on cream rounded square
  // OpenClaw (OpenClaw Foundation)
  clawMascot: MASCOT('openclaw_mascot.png'),  // 576x576 red lobster mascot "Molty", transparent
  ghOpenclaw: IMG('gh_openclaw.png'),         // 2560x1120 real GitHub repo header (dark): openclaw, Star 395k, MIT
  // Hermes (Nous Research)
  hermesArt: MASCOT('card_hermes.png'),       // 720x720 official hero line-art (silver on black)
  hermesHero: MASCOT('hermes_hero.png'),      // 1392x1500 full hero art (silver on black)
  hermesBust: MASCOT('hermes_memory.png'),    // 960x1200 official feature art (stippled bust, greyscale)
  hermesWing: MASCOT('hermes_wing.png'),      // 661x661 white wing logo on Nous blue (#0000FF-ish), square
  ghHermes: IMG('gh_hermes.png'),             // 2560x1120 real GitHub repo header (dark): hermes-agent, Star 266k, MIT
  // full official page screenshots, 1280 px wide (crop with SvgImg + viewBox maths or Shot-style framing)
  pages: {dots: IMG('dots_page.png'), muse: IMG('muse_page.png'), grok: IMG('grokbot_page.png'), duet: IMG('duet_page.png'),
          openclaw: IMG('openclaw_page.png'), hermes: IMG('hermes_page.png')},
} as const;

export type AgentId = 'dots' | 'muse' | 'grok' | 'duet' | 'openclaw' | 'hermes';
export const ORDER: AgentId[] = ['dots', 'muse', 'grok', 'duet', 'openclaw', 'hermes'];

/** Facts are exactly as spoken / checked on the official pages 25 Nov 2026 - do not add other numbers. */
export const AGENTS: Record<AgentId, {
  name: string; maker: string; kind: 'cloud' | 'local'; role: string; accent: string; deep: string; glow: string;
  art: string; artMode: 'cover' | 'icon' | 'mascot'; price: string; runs: string; asks: string;
}> = {
  dots: {name: 'Dots', maker: 'OpenAI', kind: 'cloud', role: 'Busy pros', accent: '#FF6FAE', deep: '#2B0B1E', glow: '#FF9CCB',
    art: ASSETS.dotsIggy, artMode: 'cover', price: 'ChatGPT Pro · from $100/mo', runs: 'Its own cloud computer', asks: 'Asks before it pays'},
  muse: {name: 'Muse', maker: 'Meta', kind: 'cloud', role: 'Everyday errands', accent: '#2E6BFF', deep: '#081638', glow: '#7FA6FF',
    art: ASSETS.museCreature, artMode: 'cover', price: 'Free · $20 · $100', runs: 'Meta cloud computer', asks: 'Checks before it spends'},
  grok: {name: 'Grok Bot', maker: 'xAI', kind: 'cloud', role: 'Whole teams', accent: '#A78BFA', deep: '#0E0B1A', glow: '#C9B8FF',
    art: ASSETS.grokBots[7], artMode: 'mascot', price: 'X Premium $30 and up', runs: 'Each bot: its own computer', asks: 'Approval when needed'},
  duet: {name: 'Claude Duet', maker: 'Anthropic', kind: 'cloud', role: 'Approval first', accent: '#E07A55', deep: '#26130C', glow: '#FFB08F',
    art: ASSETS.duetIcon, artMode: 'icon', price: 'In Claude Pro · $20', runs: 'Anthropic cloud computer', asks: 'Always: send · pay · sign · delete'},
  openclaw: {name: 'OpenClaw', maker: 'OpenClaw Foundation', kind: 'local', role: 'Free + private', accent: '#FF4B3E', deep: '#260706', glow: '#FF8A7A',
    art: ASSETS.clawMascot, artMode: 'mascot', price: 'Free · MIT', runs: 'Your own computer', asks: 'Your setup decides'},
  hermes: {name: 'Hermes', maker: 'Nous Research', kind: 'local', role: 'Learns new skills', accent: '#3D4BFF', deep: '#070B3D', glow: '#8C95FF',
    art: ASSETS.hermesArt, artMode: 'cover', price: 'Free · MIT · cloud from $20', runs: 'Your computer or cloud', asks: 'Your setup decides'},
};

// Image loading: each file is fetched + decoded ONCE; every frame that uses it waits (delayRender) until it is in the
// browser's memory, so SVG <image> paints synchronously - no blank frames. (A foreignObject + <Img> was tried first:
// Chrome draws foreignObject content at the wrong place under the world camera's transforms.)
const LOADED = new Set<string>();
const PENDING = new Map<string, Promise<void>>();
const ensure = (src: string): Promise<void> => {
  let p = PENDING.get(src);
  if (!p) {
    p = new Promise<void>((resolve) => {
      const im = new Image();
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => undefined).then(() => { LOADED.add(src); resolve(); }); };
      im.onerror = () => { LOADED.add(src); resolve(); };
      im.src = src;
    });
    PENDING.set(src, p);
  }
  return p;
};
const useLoaded = (src: string) => {
  const [handle] = React.useState(() => (LOADED.has(src) ? null : delayRender(`six-agents image ${src}`)));
  React.useEffect(() => {
    if (handle === null) return;
    ensure(src).then(() => continueRender(handle));
  }, [handle, src]);
};
let uidN = 0;

/**
 * A real bitmap inside a world's <svg> (x, y, w, h in world px). fit 'contain' | 'cover'; radius rounds the corners;
 * filter is a CSS filter (e.g. 'invert(1)' for a black logo on a dark world). ALWAYS use this for images.
 */
export const SvgImg: React.FC<{
  src: string; x: number; y: number; w: number; h: number; fit?: 'contain' | 'cover'; radius?: number; opacity?: number;
  position?: string; filter?: string; style?: React.CSSProperties;
}> = ({src, x, y, w, h, fit = 'contain', radius = 0, opacity = 1, filter, style}) => {
  useLoaded(src);
  const [id] = React.useState(() => `sa-img-${++uidN}`);
  const img = (
    <image href={src} x={x} y={y} width={w} height={h} opacity={opacity} preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
      style={{filter, ...style}} />
  );
  if (radius <= 0 && fit !== 'cover') return img;
  return (
    <g>
      <defs><clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={radius} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{img}</g>
    </g>
  );
};

/** Preload images used by a world before its first frame (call once at the top of Draw with every src it uses). */
export const usePreload = (srcs: string[]) => { srcs.forEach((s) => useLoaded(s)); };

/** Gentle life for a mascot (pure function of design-frame t): float, tilt, breathing squash. */
export const bob = (t: number, seed = 0, amp = 1) => ({
  dy: Math.sin(t * 0.085 + seed * 2.1) * 9 * amp,
  rot: Math.sin(t * 0.055 + seed * 1.3) * 2.6 * amp,
  sx: 1 + Math.sin(t * 0.17 + seed) * 0.018 * amp,
  sy: 1 - Math.sin(t * 0.17 + seed) * 0.018 * amp,
});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * The agent card (world px, drawn inside an svg): glass card in the agent's colours, the official art in a rounded
 * window, name + maker, optional price tag. w = card width; height = 1.42 w. (x, y) = top-left.
 *  at:     design frame the card pops in (undefined = already there)
 *  price:  0..1 how far the price tag has flipped down (0 = hidden)
 *  glow:   0..1 extra rim light (e.g. on its word)
 *  life:   mascot float amount (default 1)
 */
export const AgentCard: React.FC<{
  id: AgentId; x: number; y: number; w: number; t: number; at?: number; price?: number; glow?: number; life?: number; uid?: string;
}> = ({id, x, y, w, t, at, price = 0, glow = 0, life = 1, uid}) => {
  const a = AGENTS[id];
  const k = at === undefined ? 1 : sp(t, at, 'pop');
  if (k <= 0.001) return null;
  const h = w * 1.42;
  const pid = `sa-card-${uid ?? id}`;
  const win = w * 0.84, wx = (w - win) / 2, wy = w * 0.08;
  const b = bob(t, ORDER.indexOf(id), life);
  const pr = clamp01(price);
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${0.6 + 0.4 * k}) translate(${-w / 2} ${-h / 2})`} opacity={clamp01(k * 1.4)}>
      <defs>
        <linearGradient id={`${pid}-bg`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={a.accent} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={a.deep} stopOpacity={0.96} />
          <stop offset="1" stopColor="#07070B" stopOpacity={0.98} />
        </linearGradient>
        <linearGradient id={`${pid}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="0.5" stopColor={a.glow} stopOpacity={0.25 + 0.5 * glow} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.12} />
        </linearGradient>
        <radialGradient id={`${pid}-halo`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor={a.glow} stopOpacity={0.35 + 0.4 * glow} />
          <stop offset="1" stopColor={a.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* contact shadow + halo */}
      <ellipse cx={w / 2} cy={h + w * 0.06} rx={w * 0.46} ry={w * 0.06} fill="#000" opacity={0.45} />
      <rect x={-w * 0.12} y={-w * 0.1} width={w * 1.24} height={h * 0.9} fill={`url(#${pid}-halo)`} />
      {/* body */}
      <rect x={0} y={0} width={w} height={h} rx={w * 0.09} fill={`url(#${pid}-bg)`} />
      <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} rx={w * 0.09} fill="none" stroke={`url(#${pid}-rim)`} strokeWidth={Math.max(1.5, w * 0.008)} />
      {/* art window */}
      <rect x={wx - 2} y={wy - 2} width={win + 4} height={win + 4} rx={w * 0.065} fill="#000" opacity={0.35} />
      {a.artMode === 'cover' ? (
        <g transform={`translate(${wx + win / 2} ${wy + win / 2}) scale(${1 + 0.015 * Math.sin(t * 0.04 + 1)}) translate(${-win / 2} ${-win / 2})`}>
          <SvgImg src={a.art} x={0} y={0} w={win} h={win} fit="cover" radius={w * 0.06} />
        </g>
      ) : (
        <g>
          <rect x={wx} y={wy} width={win} height={win} rx={w * 0.06} fill={a.accent} opacity={0.18} />
          <g transform={`translate(${wx + win / 2} ${wy + win / 2 + b.dy * (w / 400)}) rotate(${b.rot}) scale(${b.sx} ${b.sy})`}>
            <SvgImg src={a.art} x={-win * (a.artMode === 'icon' ? 0.36 : 0.42)} y={-win * (a.artMode === 'icon' ? 0.36 : 0.42)}
              w={win * (a.artMode === 'icon' ? 0.72 : 0.84)} h={win * (a.artMode === 'icon' ? 0.72 : 0.84)} />
          </g>
        </g>
      )}
      {/* glass sheen over the window */}
      <rect x={wx} y={wy} width={win} height={win * 0.42} rx={w * 0.06} fill="#FFFFFF" opacity={0.06} />
      {/* name + maker */}
      <text x={w / 2} y={wy + win + w * 0.165} textAnchor="middle" fontFamily={FONT} fontWeight={800}
        fontSize={w * (a.name.length > 9 ? 0.118 : 0.14)} fill="#FFFFFF" letterSpacing={-0.5}>{a.name}</text>
      <text x={w / 2} y={wy + win + w * 0.245} textAnchor="middle" fontFamily={MONO} fontWeight={600}
        fontSize={w * (a.maker.length > 12 ? 0.042 : 0.052)} fill={a.glow} opacity={0.9} letterSpacing={w * 0.006}>{a.maker.toUpperCase()}</text>
      {/* price tag (flips down from the card's bottom edge) */}
      {pr > 0.001 ? (
        <g transform={`translate(${w / 2} ${h - w * 0.02}) scale(1 ${pr})`}>
          <rect x={-w * 0.46} y={0} width={w * 0.92} height={w * 0.17} rx={w * 0.05} fill="#FFFFFF" />
          <rect x={-w * 0.46} y={0} width={w * 0.92} height={w * 0.17} rx={w * 0.05} fill="none" stroke={a.accent} strokeWidth={w * 0.012} />
          <text x={0} y={w * 0.112} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={w * (a.price.length > 22 ? 0.052 : 0.064)} fill="#111216">{a.price}</text>
        </g>
      ) : null}
    </g>
  );
};
