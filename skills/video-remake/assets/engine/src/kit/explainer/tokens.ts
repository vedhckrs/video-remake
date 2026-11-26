// Explainer style tokens (keyframes-explainer style system, D:\VideoBlueprint\jobs\kf_style\style_system.md).
// All pixel values are for a frame whose SHORT side is 1080 (1080x1920 or 1920x1080): multiply by u (see `unit`).
import {spring} from 'remotion';

// Landscape 16:9 (26 Nov 2026): sizes scale from the frame's SHORT side, so text is the same size on a 1920x1080
// frame as on a 1080x1920 one (u = 1 on both). Remake.tsx calls setFrame(W, H) for the composition being drawn;
// unit(W) then returns W / 1080 in portrait (unchanged) and W / 1920 on a 16:9 frame. Pass H to be explicit.
let FRAME_K = 1; // short side / width of the current composition (1 in portrait and square)
export const setFrame = (W: number, H: number) => {
  FRAME_K = Math.min(1, H / W);
};
export const isLandscape = (W: number, H: number) => W > H;
export const unit = (W: number, H?: number) => (H ? Math.min(W, H) : W * FRAME_K) / 1080;

export const C = {
  bgDark: '#0E0F11',
  bgLight: '#F6F7F9',
  gridDark: 'rgba(255,255,255,0.045)',
  gridLight: 'rgba(14,15,17,0.06)',
  cardDark: '#1A1C21',
  cardLight: '#FFFFFF',
  cardBorderDark: 'rgba(255,255,255,0.08)',
  paper: '#E8E2D6',
  hardware: '#2A2E32',
  hardwareLip: '#3A3F44',
  bay: '#101113',
  slate: '#3C3B3E',
  tileTop: '#696665',
  tileSide: '#2F302F',
  silverLit: '#C0C8D6',
  silverMid: '#BFBEBA',
  silverShade: '#747571',
  metalHi: '#D3D6DB',
  metalLo: '#767471',
  pcbGreen: '#334D37',
  pcbGreenLit: '#51634A',
  pcbGreenHi: '#6B8275',
  pcbDark: '#212327',
  substrateGreen: '#24322E',
  substrateBeige: '#81786A',
  chip: '#51463C',
  chipDark: '#2B2622',
  goldLit: '#D3C1A0',
  goldShade: '#A0957D',
  goldRich: '#C9A24A',
  goldDeep: '#7A5E1E',
  copper: '#C08A60',
  copperLight: '#DCBCA7',
  captionGrey: '#8E9196',
  white: '#FFFFFF',
  ink: '#0E0F11',
  ok: '#3FB950',
  warn: '#F5A623',
  error: '#DC1E30',
  info: '#3B8CFF',
  marker: '#FFD84D',
  neutral: '#747571',
  violet: '#A14ED6',
  // presenter garment colour: used by NOTHING else on screen (semantic rule)
  brand: '#FF4F9A',
} as const;

export type Mode = 'dark' | 'light';

export const pal = (mode: Mode) =>
  mode === 'dark'
    ? {bg: C.bgDark, fg: '#FFFFFF', mute: C.captionGrey, grid: C.gridDark, card: C.cardDark, cardBorder: C.cardBorderDark, shadow: 0.5}
    : {bg: C.bgLight, fg: C.ink, mute: '#6B6E73', grid: C.gridLight, card: C.cardLight, cardBorder: 'rgba(14,15,17,0.08)', shadow: 0.28};

// ---- colour maths --------------------------------------------------------------------------------
const hex2rgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb2hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/** Multiply brightness (0.5 = half as bright). */
export const shade = (h: string, k: number) => {
  const [r, g, b] = hex2rgb(h);
  return rgb2hex(r * k, g * k, b * k);
};
/** Mix toward white by amt (0..1). */
export const tint = (h: string, amt: number) => {
  const [r, g, b] = hex2rgb(h);
  return rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
};
export const mix = (a: string, b: string, p: number) => {
  const [r1, g1, b1] = hex2rgb(a);
  const [r2, g2, b2] = hex2rgb(b);
  return rgb2hex(r1 + (r2 - r1) * p, g1 + (g2 - g1) * p, b1 + (b2 - b1) * p);
};
export const alpha = (h: string, a: number) => {
  const [r, g, b] = hex2rgb(h);
  return `rgba(${r},${g},${b},${a})`;
};

/** Face shading, light from the top-left (style_system 3.2). */
export const faces = (base: string, mode: Mode) =>
  mode === 'dark'
    ? {top: base, left: shade(base, 0.7), right: shade(base, 0.5)}
    : {top: tint(base, 0.11), left: base, right: shade(base, 0.8)};

// ---- motion tokens (frames are DESIGN frames at 30 fps; scenes get fractional t at 60 fps) ----------
export const SPRING = {
  pop: {mass: 1, damping: 20, stiffness: 260},
  settle: {mass: 1, damping: 21, stiffness: 200},
  camera: {mass: 1, damping: 26, stiffness: 170, overshootClamping: true},
  pose: {mass: 1, damping: 20, stiffness: 220},
  bouncy: {mass: 1, damping: 14, stiffness: 180},
} as const;
export type SpringName = keyof typeof SPRING;

/** Spring 0->1 that starts at design frame `at`. Works with fractional t (60 fps output). */
export const sp = (t: number, at: number, name: SpringName = 'pop', fps = 30) => {
  if (t <= at) return 0;
  // Remotion's spring takes integer-ish frames; sample at fractional frames by scaling fps
  return spring({frame: (t - at) * 4, fps: fps * 4, config: SPRING[name]});
};

export const DUR = {
  captionIn: 3.5, selectIn: 4.5, pop: 9, slide: 10, leader: 8, labelFade: 4.5, countUp: 30, swap: 6, dim: 8,
  reframe: 12, macroPush: 28, zoomThrough: 6, whip: 6, blurDissolve: 4, pose: 7, hold: 16,
} as const;

export const STAGGER = {grid: 1, row: 3, callout: 7, wire: 6, light: 4.5} as const;

/** Layout bands as fractions of frame height (style_system 2 + 4). */
export const BANDS = {captionTop: 0.15, captionBottom: 0.25, stageTop: 0.25, stageBottom: 0.72, presenterTop: 0.72} as const;
