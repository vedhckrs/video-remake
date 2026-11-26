// cine3d macbook (26 Nov 2026): the Apple MacBook Air M1 (2020) built entirely in code from Ved's reference photos
// (public/ios-smooth-act1/ref/macbook) - no downloaded model, no Apple bitmap. One filmed element like PhoneShot:
// transparent background, camera keys, studio light, a lid on a real hinge, live 2D content on the display and a 2D
// board plane inside the body.
//
//   <MacShot t={t} W={W} H={H} cam={CAM} lid={112} screen={<MyDesktop />} shell={macXray(x)} interior={<MacInnards />} />
//   const v = macView({t, cam: CAM, lid: 112, W, H});  v.point('chip')  ->  {x, y} px for a 2D callout
//
// Model facts (all geometry is written in MILLIMETRES in "base space"; the scene is scaled 1 unit = 15 mm, the same
// scale as the phone, so the two sit side by side at their true relative size):
//   - base space: x to the user's right, y up out of the keyboard deck (deck plane y = 0), z toward the user. Footprint
//     304.1 x 212.4 mm, corner radius 11. Wedge: the body is 11.0 mm thick at the hinge and 2.2 mm at the front lip
//     (plus 3.0 mm of lid and 0.7 mm feet = 16.1 mm closed at the back); the model rests on its four feet, so the
//     deck leans 2.6 degrees toward the user.
//   - lid space: origin on the hinge axis (base y -0.6, z -102.25), z along the lid toward its free edge, y out of
//     the lid's BACK. `lid` degrees: 0 closed, 90 upright, about 110 in use, 135 fully open.
//   - display 13.3 inch 16:10 = 286.5 x 179.1 mm, uniform black bezel, no notch; keyboard well 276.4 x 104.4 mm,
//     keys on a 19.05 mm pitch, HALF-height function row with a small square Touch ID key (that is what the 2020
//     model and the reference photos have); trackpad 120.2 x 80.8 mm.
import React, {use, useMemo} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {useThree} from '@react-three/fiber';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {siApple} from 'simple-icons';
import * as THREE from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {DEG, Stage3D, Studio, camAt, clamp, drawTexture, keepAlpha, makeCamera, projectPoint, quadMatrix3d, seeded, type CamKey, type Fx, type OrbitKey, type Px, type StudioProps, type V3} from './core';
import {PhoneFloor, poseAt, poseMatrix, type Pose, type PoseKey} from './phone';

// ---------------------------------------------------------------------------------------------------------------
// Dimensions (mm)

const U = 1 / 15;
const BW = 304.1, BD = 212.4, HW = BW / 2, HD = BD / 2, RC = 11;
const CH = 0.45, WALL = 1.3, TH_F = 2.2, TH_R = 11.0, RB = 22, FOOT = 0.7;
const LID_T = 3.0, LID_GAP = 0.25;
const AY = -0.6, AZ = -HD + 3.95, RBAR = 3.85;
const LZ0 = 3.6, LZ1 = HD - AZ, LY0 = LID_GAP - AY, LY1 = LY0 + LID_T;
const SCR_W = 286.5, SCR_H = 179.1, SCR_Z1 = LZ1 - 8.8, SCR_Z0 = SCR_Z1 - SCR_H;
const WELL = {w: 276.4, d: 104.4, z0: -HD + 17.2, depth: 1.3, r: 3.2};
const KB = {x0: -136.8, z0: WELL.z0 + 1.275, w: 273.6, d: 101.85};
const KEY = {w: 16.6, d: 16.05, g: 2.45, row: 18.5, fnD: 9.4, h: 1.22, r: 1.6};
const TP = {w: 120.2, d: 80.8, z0: -HD + 126.7, r: 3.2};
const TROUGH = {hw: 119.2, z0: -HD + 0.5, z1: -HD + 8.2, depth: 4.9};
const SCOOP = {hw: 31, len: 3.6, drop: 0.8};
const GRILLE = {w: 9.4, d: 98, x: (WELL.w / 2 + HW) / 2 + 0.2};
const FEET_X = HW - 27, FEET_Z = HD - 24;
const INT = {x0: -145, x1: 145, z0: -HD + 10.5, z1: HD - 5, y: -1.5, pxPerMm: 6};
const CHIP: V3 = [-14, INT.y, -HD + 50];

/** thickness of the body under the deck at depth z (the wedge) */
const thick = (z: number) => TH_F + (TH_R - TH_F) * (1 - Math.pow(clamp((z + HD) / BD), 1.7));
const belly = (d: number) => Math.pow(1 - Math.pow(1 - clamp(d / RB), 2.6), 1 / 2.6);
const bottomY = (d: number, z: number) => -(WALL + (thick(z) - WALL) * belly(d));

/** rest pose: the body stands on its four feet on the floor y = 0 */
const REST = (() => {
  const tr = thick(-FEET_Z) + FOOT, tf = thick(FEET_Z) + FOOT;
  const a = Math.atan2(tr - tf, 2 * FEET_Z);
  const lift = tr * Math.cos(a) - FEET_Z * Math.sin(a);
  return {a, lift, m: new THREE.Matrix4().makeTranslation(0, lift, 0).multiply(new THREE.Matrix4().makeRotationX(a))};
})();

/** Sizes for scene code. Lengths in mm unless they say units (1 unit = 15 mm). */
export const MAC = {
  mmPerUnit: 15, w: BW, d: BD, unitsW: BW * U, unitsD: BD * U, restAngle: REST.a / DEG, deckY: REST.lift * U,
  screenW: SCR_W, screenH: SCR_H, hinge: [0, AY, AZ] as V3,
  /** the plane inside the body, just under the keyboard, that `interior` content is laid on (seen from above) */
  interior: {...INT, w: (INT.x1 - INT.x0) * INT.pxPerMm, h: (INT.z1 - INT.z0) * INT.pxPerMm},
  keyboard: {x0: KB.x0, z0: KB.z0, w: KB.w, d: KB.d},
  trackpad: {x0: -TP.w / 2, z0: TP.z0, w: TP.w, d: TP.d},
};

/** Named points: `p` in base space (mm), or in lid space when `lid` is set. `chip` = where the M1 sits on the board
 *  of MacInnards (upper middle, under the keyboard). */
export const MAC_POINTS = {
  screenTL: {p: [-SCR_W / 2, LY0, SCR_Z1] as V3, lid: true},
  screenTR: {p: [SCR_W / 2, LY0, SCR_Z1] as V3, lid: true},
  screenBR: {p: [SCR_W / 2, LY0, SCR_Z0] as V3, lid: true},
  screenBL: {p: [-SCR_W / 2, LY0, SCR_Z0] as V3, lid: true},
  screenCentre: {p: [0, LY0, (SCR_Z0 + SCR_Z1) / 2] as V3, lid: true},
  camera: {p: [0, LY0, SCR_Z1 + 4.2] as V3, lid: true},
  wordmark: {p: [0, LY0, SCR_Z0 - 7.4] as V3, lid: true},
  lidLogo: {p: [0, LY1, HD - AZ - HD] as V3, lid: true},
  lidTop: {p: [0, (LY0 + LY1) / 2, LZ1] as V3, lid: true},
  hinge: {p: [0, AY, AZ] as V3, lid: false},
  keyboard: {p: [0, 0, KB.z0 + KB.d / 2] as V3, lid: false},
  trackpad: {p: [0, 0, TP.z0 + TP.d / 2] as V3, lid: false},
  touchId: {p: [KB.x0 + KB.w - 4.85, 0, KB.z0 + 4.7] as V3, lid: false},
  speakerL: {p: [-GRILLE.x, 0, WELL.z0 + WELL.d / 2] as V3, lid: false},
  speakerR: {p: [GRILLE.x, 0, WELL.z0 + WELL.d / 2] as V3, lid: false},
  usbC1: {p: [-HW, -3.4, -HD + 30] as V3, lid: false},
  usbC2: {p: [-HW, -3.4, -HD + 46] as V3, lid: false},
  jack: {p: [HW, -3.4, -HD + 30] as V3, lid: false},
  front: {p: [0, 0, HD] as V3, lid: false},
  centre: {p: [0, 0, 0] as V3, lid: false},
  chip: {p: CHIP, lid: false},
};
export type MacPoint = keyof typeof MAC_POINTS;

// ---------------------------------------------------------------------------------------------------------------
// Pose and view (pure maths, no canvas)

const NOPOSE: Pose = {yaw: 0, pitch: 0, roll: 0, pos: [0, 0, 0]};
/** base space (mm) -> world, and lid space (mm) -> world, for a pose and a lid angle in degrees */
export const macMatrices = (pose: Pose = NOPOSE, lidDeg = 110) => {
  const base = poseMatrix(pose).multiply(new THREE.Matrix4().makeScale(U, U, U)).multiply(REST.m);
  const lid = base.clone().multiply(new THREE.Matrix4().makeTranslation(0, AY, AZ)).multiply(new THREE.Matrix4().makeRotationX(-lidDeg * DEG));
  return {base, lid};
};

export type MacViewArgs = {t: number; cam: (CamKey | OrbitKey)[]; pose?: PoseKey[]; lid?: number; W: number; H: number; left?: number; top?: number};

export const macView = ({t, cam: camKeys, pose, lid = 110, W, H, left = 0, top = 0}: MacViewArgs) => {
  const cam = camAt(camKeys, t);
  const camera = makeCamera(cam, W / H);
  const M = macMatrices(poseAt(pose, t), lid);
  const world = (p: V3, inLid = false) => new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(inLid ? M.lid : M.base);
  const px = (p: V3, inLid = false): Px => {
    const q = projectPoint(camera, world(p, inLid), W, H);
    return {...q, x: q.x + left, y: q.y + top};
  };
  const eye = new THREE.Vector3(...cam.pos);
  /** > 0 when the display faces the camera (cosine) */
  const screenFacing = new THREE.Vector3(0, -1, 0).transformDirection(M.lid).dot(eye.clone().sub(world(MAC_POINTS.screenCentre.p, true)).normalize());
  /** > 0 when the camera looks down on the keyboard deck, < 0 from underneath */
  const above = new THREE.Vector3(0, 1, 0).transformDirection(M.base).dot(eye.clone().sub(world([0, 0, 0])).normalize());
  const I = MAC.interior;
  const quad = (wPx: number, hPx: number, c: V3[], inLid: boolean) => quadMatrix3d(wPx, hPx, c.map((p) => px(p, inLid)));
  return {
    cam, camera, matrix: M.base, lidMatrix: M.lid, screenFacing, above, lid,
    /** px of a named point; or of any point in base space (mm) - pass `true` for lid space */
    point: (p: MacPoint | V3, inLid = false): Px => (typeof p === 'string' ? px(MAC_POINTS[p].p, MAC_POINTS[p].lid) : px(p, inLid)),
    world,
    /** the display: matrix3d for a wPx x hPx box */
    screenMatrix: (wPx: number, hPx: number) => quad(wPx, hPx, [MAC_POINTS.screenTL.p, MAC_POINTS.screenTR.p, MAC_POINTS.screenBR.p, MAC_POINTS.screenBL.p], true),
    /** the plane under the keyboard: px size, matrix, and px <-> base-space conversion (0,0 = rear left, seen from above) */
    interior: {
      w: I.w, h: I.h,
      matrix: (y = I.y) => {
        const [l, r] = above >= 0 ? [I.x0, I.x1] : [I.x1, I.x0];
        return quad(I.w, I.h, [[l, y, I.z0], [r, y, I.z0], [r, y, I.z1], [l, y, I.z1]], false);
      },
      point: (ix: number, iy: number, y = I.y): Px => px([I.x0 + ix / I.pxPerMm, y, I.z0 + iy / I.pxPerMm]),
      at: (x: number, z: number): [number, number] => [(x - I.x0) * I.pxPerMm, (z - I.z0) * I.pxPerMm],
    },
  };
};
export type MacView = ReturnType<typeof macView>;

// ---------------------------------------------------------------------------------------------------------------
// Shell states

export type MacGroup = 'deck' | 'body' | 'bottom' | 'lid';
export type MacPartState = {
  /** 0 hides the group, 1 shows it */
  opacity?: number;
  /** 0 = the real material, 1 = ghost glass with bright edges (x-ray) */
  glass?: number;
};
/** `deck` = the top case: deck surface, keyboard, trackpad, speaker grilles. `bottom` = the underside. `body` = the
 *  machined rim (edge chamfer, sides, hinge trough, ports). `lid` = display housing, glass, hinge barrel, logo.
 *  `backlight` 0..1 lights the key legends and the glow round the keys. */
export type MacShell = Partial<Record<MacGroup, MacPartState>> & {backlight?: number};
/** The usual x-ray: the keyboard deck turns to ghost glass (`x` 0..1) so the `interior` plane shows from above.
 *  `bottom: true` ghosts the underside instead (for a camera below the machine). */
export const macXray = (x: number, o: {bottom?: boolean; backlight?: number} = {}): MacShell =>
  o.bottom ? {bottom: {glass: clamp(x)}, backlight: o.backlight} : {deck: {glass: clamp(x)}, backlight: o.backlight};

export type MacFinish = 'spaceGrey' | 'silver' | 'gold';
const FINISH: Record<MacFinish, {alu: string; well: string; pad: string; logo: string; barrel: string; word: string}> = {
  spaceGrey: {alu: '#77787C', well: '#56575C', pad: '#86878C', logo: '#D9DADF', barrel: '#232427', word: '#B4B5BA'},
  silver: {alu: '#CDCED2', well: '#8C8D92', pad: '#D6D7DB', logo: '#FFFFFF', barrel: '#2A2B2E', word: '#C4C5C9'},
  gold: {alu: '#E2C3AE', well: '#9C8474', pad: '#EACDBA', logo: '#FFF1E6', barrel: '#2B2826', word: '#C8BCB4'},
};

// ---------------------------------------------------------------------------------------------------------------
// Geometry helpers

type P2 = [number, number];
/** Rounded rectangle in the x-z plane as a closed ring of points with a fixed count (so rings can be lofted).
 *  Order: along the front edge toward +x, then round by the right, the rear and the left. r = [frontL, frontR, rearR, rearL]. */
const rrRing = (w: number, h: number, r: number | [number, number, number, number], cs: number, ex: number, ez: number, cx = 0, cz = 0): P2[] => {
  const ww = Math.max(w, 1e-4), hh = Math.max(h, 1e-4);
  const [rFL, rFR, rRR, rRL] = (typeof r === 'number' ? [r, r, r, r] : r).map((v) => Math.max(1e-4, Math.min(v, ww / 2, hh / 2)));
  const x0 = cx - ww / 2, x1 = cx + ww / 2, z0 = cz - hh / 2, z1 = cz + hh / 2;
  const out: P2[] = [];
  const edge = (ax: number, az: number, bx: number, bz: number, n: number) => { for (let i = 1; i <= n; i++) { const q = i / (n + 1); out.push([ax + (bx - ax) * q, az + (bz - az) * q]); } };
  const arc = (ox: number, oz: number, rad: number, a0: number, a1: number) => { for (let i = 0; i <= cs; i++) { const a = a0 + (a1 - a0) * (i / cs); out.push([ox + rad * Math.cos(a), oz + rad * Math.sin(a)]); } };
  edge(x0 + rFL, z1, x1 - rFR, z1, ex);
  arc(x1 - rFR, z1 - rFR, rFR, Math.PI / 2, 0);
  edge(x1, z1 - rFR, x1, z0 + rRR, ez);
  arc(x1 - rRR, z0 + rRR, rRR, 0, -Math.PI / 2);
  edge(x1 - rRR, z0, x0 + rRL, z0, ex);
  arc(x0 + rRL, z0 + rRL, rRL, -Math.PI / 2, -Math.PI);
  edge(x0, z0 + rRL, x0, z1 - rFL, ez);
  arc(x0 + rFL, z1 - rFL, rFL, Math.PI, Math.PI / 2);
  return out;
};
const R4 = (r: number | [number, number, number, number], d: number): [number, number, number, number] => (typeof r === 'number' ? [r - d, r - d, r - d, r - d] : [r[0] - d, r[1] - d, r[2] - d, r[3] - d]);

/** Skin over rings (each the same point count). Rings run from the top of a surface outward / downward: with the
 *  ring order of `rrRing` the normals then point out of the solid. `flip` for surfaces that face into a recess. */
const loft = (rings: THREE.Vector3[][], flip = false) => {
  const n = rings[0].length;
  const pos: number[] = [], idx: number[] = [];
  rings.forEach((r) => r.forEach((p) => pos.push(p.x, p.y, p.z)));
  for (let i = 0; i + 1 < rings.length; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = (i + 1) * n + j, c = i * n + ((j + 1) % n), d = (i + 1) * n + ((j + 1) % n);
    if (flip) idx.push(a, c, b, c, d, b);
    else idx.push(a, b, c, c, b, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};
const ringY = (pts: P2[], y: number | ((x: number, z: number) => number)) => pts.map(([x, z]) => new THREE.Vector3(x, typeof y === 'number' ? y : y(x, z), z));

const shapeOf = (pts: P2[], sign: 1 | -1) => {
  const s = new THREE.Shape();
  pts.forEach(([x, z], i) => (i ? s.lineTo(x, sign * z) : s.moveTo(x, sign * z)));
  s.closePath();
  return s;
};
/** Flat face in the x-z plane at height y from an outline (and holes); `up` = its normal is +y, else -y. */
const flat = (outline: P2[], y: number, up = true, holes: P2[][] = []) => {
  const sign = up ? -1 : 1;
  const s = shapeOf(outline, sign);
  holes.forEach((h) => s.holes.push(shapeOf(h, sign)));
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
  g.translate(0, y, 0);
  return g;
};
const quad = (a: V3, b: V3, c: V3, d: V3) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  g.setIndex([0, 3, 1, 1, 3, 2]);
  g.computeVertexNormals();
  return g;
};
/** planar texture coordinates from x and z (mm / tile), for the bead-blast grain */
const TILE = 16;
const planarUV = (g: THREE.BufferGeometry) => {
  const p = g.getAttribute('position'), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / TILE; uv[i * 2 + 1] = p.getZ(i) / TILE; }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
};
const merged = (gs: THREE.BufferGeometry[]) => planarUV(mergeGeometries(gs.map((g) => (g.index ? g : g.toNonIndexed())), false)!);
/** A plane w x h whose picture reads upright for a viewer who sees `u` to the right and `v` up; it faces u x v. */
const card = (w: number, h: number, u: V3, v: V3, at: V3) => {
  const g = new THREE.PlaneGeometry(w, h);
  const U3 = new THREE.Vector3(...u), V3v = new THREE.Vector3(...v);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(U3, V3v, U3.clone().cross(V3v)).setPosition(...at));
  return g;
};

// ---------------------------------------------------------------------------------------------------------------
// Keyboard layout (US), in mm from the rear-left corner of the key block

type Legend = {c?: string; top?: string; bot?: string; word?: string; al?: 'l' | 'r' | 'm'; sym?: 'cmd' | 'opt' | 'ctl' | 'globe'; symAt?: 'l' | 'r'; fn?: string; icon?: number; arrow?: 'l' | 'r' | 'u' | 'd'; led?: boolean; fnTop?: boolean};
type KeyDef = {x: number; z: number; w: number; d: number; lg: Legend; touch?: boolean};
const KEYS: KeyDef[] = (() => {
  const out: KeyDef[] = [];
  const row = (z: number, d: number, items: [number, Legend][], g = KEY.g) => {
    let x = 0;
    items.forEach(([w, lg]) => { out.push({x, z, w, d, lg}); x += w + g; });
  };
  const k = KEY.w, pair = (s: string): [number, Legend] => [k, {top: s[0], bot: s[1]}], ch = (s: string): [number, Legend] => [k, {c: s}];
  const fw = 18.1, fg = (KB.w - 13 * fw - 9.7) / 13;
  row(0, KEY.fnD, [[fw, {word: 'esc', al: 'm'}], ...Array.from({length: 12}, (_, i): [number, Legend] => [fw, {fn: `F${i + 1}`, icon: i}]), [9.7, {}]], fg);
  out[out.length - 1].touch = true;
  const z1 = KEY.fnD + 2.4;
  row(z1, KEY.d, [...['~`', '!1', '@2', '#3', '$4', '%5', '^6', '&7', '*8', '(9', ')0', '—-', '+='].map(pair), [KB.w - 13 * (k + KEY.g), {word: 'delete', al: 'r'}]]);
  row(z1 + KEY.row, KEY.d, [[25.95, {word: 'tab', al: 'l'}], ...'QWERTYUIOP'.split('').map(ch), pair('{['), pair('}]'), pair('|\\')]);
  row(z1 + 2 * KEY.row, KEY.d, [[30.9, {word: 'caps lock', al: 'l', led: true}], ...'ASDFGHJKL'.split('').map(ch), pair(':;'), pair('"\''), [KB.w - 33.35 - 11 * (k + KEY.g), {word: 'return', al: 'r'}]]);
  row(z1 + 3 * KEY.row, KEY.d, [[40.4, {word: 'shift', al: 'l'}], ...'ZXCVBNM'.split('').map(ch), pair('<,'), pair('>.'), pair('?/'), [KB.w - 42.85 - 10 * (k + KEY.g), {word: 'shift', al: 'r'}]]);
  const z5 = z1 + 4 * KEY.row, half = (KEY.d - 0.85) / 2;
  row(z5, KEY.d, [[k, {sym: 'globe', symAt: 'l', word: 'fn', fnTop: true}], [k, {word: 'control', al: 'r', sym: 'ctl', symAt: 'r'}], [k, {word: 'option', al: 'r', sym: 'opt', symAt: 'r'}], [21.35, {word: 'command', al: 'r', sym: 'cmd', symAt: 'r'}],
    [92.65, {}], [21.35, {word: 'command', al: 'l', sym: 'cmd', symAt: 'l'}], [k, {word: 'option', al: 'l', sym: 'opt', symAt: 'l'}]]);
  const ax = KB.w - 3 * k - 2 * KEY.g;
  out.push({x: ax, z: z5 + half + 0.85, w: k, d: half, lg: {arrow: 'l'}}, {x: ax + k + KEY.g, z: z5, w: k, d: half, lg: {arrow: 'u'}},
    {x: ax + k + KEY.g, z: z5 + half + 0.85, w: k, d: half, lg: {arrow: 'd'}}, {x: ax + 2 * (k + KEY.g), z: z5 + half + 0.85, w: k, d: half, lg: {arrow: 'r'}});
  return out;
})();

/** One keycap: rounded plan, rounded top edge, slightly dished top. Origin: centre of its foot. */
const keyGeo = (w: number, d: number) => {
  const bev = 0.42, dish = 0.1, h = KEY.h, cs = 5, dmax = Math.min(w, d) / 2;
  const ring = (ins: number) => rrRing(w - 2 * ins, d - 2 * ins, KEY.r - ins, cs, 3, 3);
  const rings: THREE.Vector3[][] = [];
  // the dish is a smooth function of the place on the key (not of the distance to its edge: that gives a roof with creases)
  const a = w / 2 - bev, b = d / 2 - bev, top = (x: number, z: number) => h - dish * Math.max(0, 1 - (x / a) ** 2) * Math.max(0, 1 - (z / b) ** 2);
  [1, 0.72, 0.45, 0.22, 0.08, 0].forEach((q) => rings.push(ringY(ring(bev + (dmax - bev) * q), top)));
  for (let i = 1; i <= 4; i++) { const a = (i / 4) * (Math.PI / 2); rings.push(ringY(ring(bev * (1 - Math.sin(a))), h - bev * (1 - Math.cos(a)))); }
  rings.push(ringY(ring(0), 0));
  return loft(rings);
};

// ---------------------------------------------------------------------------------------------------------------
// Textures drawn in code

/** fine bead-blast grain as a tangent-space normal map (seeded noise, tiles) */
const beadNormal = () =>
  drawTexture((g, N) => {
    const rnd = seeded(7717), h = new Float32Array(N * N), b = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) h[i] = rnd();
    const at = (a: Float32Array, x: number, y: number) => a[((y + N) % N) * N + ((x + N) % N)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) b[y * N + x] = (at(h, x, y) * 2 + at(h, x + 1, y) + at(h, x - 1, y) + at(h, x, y + 1) + at(h, x, y - 1)) / 6;
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (at(b, x + 1, y) - at(b, x - 1, y)) * 2.2, dy = (at(b, x, y + 1) - at(b, x, y - 1)) * 2.2, l = Math.hypot(dx, dy, 1), o = (y * N + x) * 4;
      img.data[o] = (-dx / l * 0.5 + 0.5) * 255; img.data[o + 1] = (-dy / l * 0.5 + 0.5) * 255; img.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, 256, 256, false);

const KPX = 4096 / KB.w;
const icon = (g: CanvasRenderingContext2D, i: number, cx: number, cy: number, u: number) => {
  const L = (...p: number[]) => { g.beginPath(); for (let k = 0; k < p.length; k += 2) (k ? g.lineTo(cx + p[k] * u, cy + p[k + 1] * u) : g.moveTo(cx + p[k] * u, cy + p[k + 1] * u)); };
  const tri = (x: number, dir: number, s = 0.85) => { L(x - dir * s * 0.55, -s, x + dir * s * 0.75, 0, x - dir * s * 0.55, s); g.closePath(); g.fill(); };
  const circ = (x: number, y: number, r: number, fill = false) => { g.beginPath(); g.arc(cx + x * u, cy + y * u, r * u, 0, Math.PI * 2); if (fill) g.fill(); else g.stroke(); };
  const rays = (r0: number, r1: number) => { for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; L(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1); g.stroke(); } };
  const speaker = (x: number) => { L(x - 0.95, -0.42, x - 0.45, -0.42, x + 0.2, -1.0, x + 0.2, 1.0, x - 0.45, 0.42, x - 0.95, 0.42); g.closePath(); g.fill(); };
  const wave = (x: number, r: number) => { g.beginPath(); g.arc(cx + x * u, cy, r * u, -0.9, 0.9); g.stroke(); };
  g.lineWidth = 0.24 * u; g.lineCap = 'round'; g.lineJoin = 'round';
  if (i === 0) { circ(0, 0, 0.5); rays(0.9, 1.15); }
  else if (i === 1) { circ(0, 0, 0.66); rays(1.1, 1.5); }
  else if (i === 2) { g.strokeRect(cx - 1.7 * u, cy - 0.35 * u, 3.4 * u, 1.5 * u); g.fillRect(cx - 1.7 * u, cy - 1.15 * u, 1.0 * u, 0.5 * u); g.fillRect(cx - 0.5 * u, cy - 1.15 * u, 1.0 * u, 0.5 * u); g.fillRect(cx + 0.7 * u, cy - 1.15 * u, 1.0 * u, 0.5 * u); }
  else if (i === 3) { circ(-0.25, -0.25, 0.85); L(0.4, 0.4, 1.15, 1.15); g.stroke(); }
  else if (i === 4) { g.beginPath(); g.roundRect(cx - 0.42 * u, cy - 1.25 * u, 0.84 * u, 1.6 * u, 0.42 * u); g.fill(); g.beginPath(); g.arc(cx, cy - 0.1 * u, 0.85 * u, 0.15, Math.PI - 0.15); g.stroke(); L(0, 0.78, 0, 1.25); g.stroke(); }
  else if (i === 5) { g.beginPath(); g.arc(cx, cy, 1.05 * u, 0.55, Math.PI * 1.55); g.arc(cx + 0.62 * u, cy - 0.45 * u, 0.82 * u, Math.PI * 1.32, 0.86 * Math.PI, true); g.closePath(); g.fill(); }
  else if (i === 6) { tri(-0.75, -1); tri(0.65, -1); }
  else if (i === 7) { tri(-0.75, 1); g.fillRect(cx + 0.45 * u, cy - 0.85 * u, 0.34 * u, 1.7 * u); g.fillRect(cx + 1.1 * u, cy - 0.85 * u, 0.34 * u, 1.7 * u); }
  else if (i === 8) { tri(-0.65, 1); tri(0.75, 1); }
  else if (i === 9) { speaker(0); }
  else if (i === 10) { speaker(-0.5); wave(-0.2, 0.75); }
  else { speaker(-0.9); wave(-0.6, 0.7); wave(-0.6, 1.25); wave(-0.6, 1.8); }
};
const symbol = (g: CanvasRenderingContext2D, s: 'cmd' | 'opt' | 'ctl' | 'globe', cx: number, cy: number, u: number) => {
  g.lineWidth = 0.27 * u; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  if (s === 'cmd') {
    const h = 0.62, q = 0.52;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { g.moveTo(cx + sx * (h + q) * u + q * u, cy + sy * (h + q) * u); g.arc(cx + sx * (h + q) * u, cy + sy * (h + q) * u, q * u, 0, Math.PI * 2); });
    [-h, h].forEach((v) => { g.moveTo(cx + v * u, cy - (h + q) * u); g.lineTo(cx + v * u, cy + (h + q) * u); g.moveTo(cx - (h + q) * u, cy + v * u); g.lineTo(cx + (h + q) * u, cy + v * u); });
  } else if (s === 'opt') {
    g.moveTo(cx - 1.55 * u, cy - 0.95 * u); g.lineTo(cx - 0.55 * u, cy - 0.95 * u); g.lineTo(cx + 0.55 * u, cy + 0.95 * u); g.lineTo(cx + 1.55 * u, cy + 0.95 * u);
    g.moveTo(cx + 0.35 * u, cy - 0.95 * u); g.lineTo(cx + 1.55 * u, cy - 0.95 * u);
  } else if (s === 'ctl') {
    g.moveTo(cx - 1.1 * u, cy + 0.45 * u); g.lineTo(cx, cy - 0.6 * u); g.lineTo(cx + 1.1 * u, cy + 0.45 * u);
  } else {
    g.arc(cx, cy, 1.35 * u, 0, Math.PI * 2); g.moveTo(cx - 1.35 * u, cy); g.lineTo(cx + 1.35 * u, cy);
    g.moveTo(cx + 0.6 * u, cy); g.ellipse(cx, cy, 0.6 * u, 1.35 * u, 0, 0, Math.PI * 2);
  }
  g.stroke();
};
const rrPath = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

/** every key legend in one atlas laid over the whole key block (white on clear) */
const legendAtlas = (font: string) => {
  const t = drawTexture((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.textBaseline = 'alphabetic';
    const u = KPX, text = (s: string, x: number, y: number, size: number, weight: number, align: CanvasTextAlign, track = 0) => {
      g.font = `${weight} ${size * u}px ${font}`; g.textAlign = align;
      (g as unknown as {letterSpacing: string}).letterSpacing = `${track * size * u}px`;
      g.fillText(s, x * u + (align === 'center' ? track * size * u * 0.5 : 0), y * u);
    };
    for (const k of KEYS) {
      const cx = k.x + k.w / 2, cz = k.z + k.d / 2, lg = k.lg, x0 = k.x + 2.7, x1 = k.x + k.w - 2.7, yb = k.z + k.d - 2.9;
      if (lg.c) text(lg.c, cx, cz + 2.05, 5.6, 400, 'center');
      if (lg.top && lg.bot) {
        const small = '{}[]|\\:;"\'<>,.?/'.includes(lg.bot);
        text(lg.top, cx, cz - (small ? 1.5 : 1.7) + (lg.top === '^' || lg.top === '*' || lg.top === '"' ? 0.9 : lg.top === '~' ? -0.7 : 0) + (lg.top === '—' ? -0.2 : 0), lg.top === '—' ? 3.4 : 4.4, 400, 'center');
        text(lg.bot, cx, cz + 5.0 + (lg.bot === ',' || lg.bot === ';' ? -0.7 : 0) + (lg.bot === "'" || lg.bot === '`' ? 1.0 : 0), 4.4, 400, 'center');
      }
      if (lg.word && lg.fnTop) text(lg.word, x1, k.z + 5.2, 3.15, 400, 'right', 0.03);
      else if (lg.word) text(lg.word, lg.al === 'r' ? x1 : lg.al === 'l' ? x0 : x0 - 0.2, lg.al === 'm' ? cz + 0.95 : yb, lg.al === 'm' ? 2.6 : 3.15, 400, lg.al === 'r' ? 'right' : 'left', 0.035);
      if (lg.sym) symbol(g, lg.sym, (lg.sym === 'globe' ? k.x + 4.3 : lg.symAt === 'l' ? k.x + 4.4 : k.x + k.w - 4.4) * u, (lg.sym === 'globe' ? k.z + k.d - 4.3 : k.z + 4.6) * u, u * (lg.sym === 'cmd' ? 1.05 : 1));
      if (lg.fn) { text(lg.fn, cx, k.z + k.d - 1.55, 1.9, 500, 'center', 0.04); icon(g, lg.icon ?? 0, cx * u, (k.z + 3.35) * u, u * 0.92); }
      if (lg.arrow) {
        const s = 1.05 * u, X = cx * u, Y = cz * u, d = lg.arrow;
        g.beginPath();
        if (d === 'l') { g.moveTo(X - s, Y); g.lineTo(X + s * 0.8, Y - s); g.lineTo(X + s * 0.8, Y + s); }
        else if (d === 'r') { g.moveTo(X + s, Y); g.lineTo(X - s * 0.8, Y - s); g.lineTo(X - s * 0.8, Y + s); }
        else if (d === 'u') { g.moveTo(X, Y - s); g.lineTo(X + s, Y + s * 0.8); g.lineTo(X - s, Y + s * 0.8); }
        else { g.moveTo(X, Y + s); g.lineTo(X + s, Y - s * 0.8); g.lineTo(X - s, Y - s * 0.8); }
        g.closePath(); g.fill();
      }
      if (lg.led) { g.globalAlpha = 0.35; g.beginPath(); g.arc((k.x + 3.4) * u, (k.z + 3.6) * u, 0.55 * u, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    }
  }, 4096, Math.round(KB.d * KPX));
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 16;
  return t;
};
/** the light that leaks round every key when the backlight is on */
const haloAtlas = () => {
  const s = 2048 / (KB.w + 6);
  const t = drawTexture((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 1.5 * s; g.shadowColor = '#fff'; g.shadowBlur = 1.3 * s;
    for (const k of KEYS) { rrPath(g, (k.x + 3) * s, (k.z + 3) * s, k.w * s, k.d * s, KEY.r * s); g.stroke(); }
  }, 2048, Math.round((KB.d + 6) * s));
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
};
/** speaker perforations: one drilled hole per tile */
const grilleTile = () =>
  drawTexture((g, n) => {
    g.clearRect(0, 0, n, n);
    const grd = g.createRadialGradient(n * 0.5, n * 0.46, 0, n * 0.5, n * 0.5, n * 0.3);
    grd.addColorStop(0, 'rgba(4,4,5,1)'); grd.addColorStop(0.78, 'rgba(8,8,10,1)'); grd.addColorStop(1, 'rgba(10,10,12,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(n / 2, n / 2, n * 0.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.20)'; g.lineWidth = n * 0.035; g.beginPath(); g.arc(n / 2, n / 2, n * 0.29, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  }, 64);
const wordmark = (font: string, color: string) => {
  const t = drawTexture((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `500 ${h * 0.74}px ${font}`;
    (g as unknown as {letterSpacing: string}).letterSpacing = `${h * 0.02}px`;
    g.fillText('MacBook Air', w / 2, h * 0.54);
  }, 1024, 128);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
};
/** What the display glass mirrors: the studio's softboxes drawn soft (an equirectangular map). The scene's own
 *  environment has hard-edged lights, and a flat mirror stretches a few of its texels into stair steps. */
const glossEnv = () => {
  const t = drawTexture((g, w, h) => {
    g.fillStyle = '#05070C'; g.fillRect(0, 0, w, h);
    g.filter = `blur(${h * 0.045}px)`;
    const box = (u: number, v: number, bw: number, bh: number, c: string) => { g.fillStyle = c; g.fillRect((u - bw / 2) * w, (v - bh / 2) * h, bw * w, bh * h); };
    box(0.36, 0.2, 0.2, 0.2, '#FFF3E6'); box(0.86, 0.42, 0.035, 0.5, '#9CC3FF'); box(0.12, 0.45, 0.025, 0.42, '#C4D4F2'); box(0.6, 0.3, 0.3, 0.16, '#3A4C6E'); box(0.5, 0.02, 1, 0.06, '#56688C');
    g.filter = 'none';
  }, 1024, 512);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
};
/** the lid's Apple mark as flat geometry (Simple Icons path), `h` mm tall, centred, facing +z, reading upright */
const logoGeo = (h: number) => {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${siApple.path}"/></svg>`);
  const g = new THREE.ShapeGeometry(data.paths.flatMap((p) => SVGLoader.createShapes(p)), 28);
  g.computeBoundingBox();
  const bb = g.boundingBox!, k = h / (bb.max.y - bb.min.y);
  g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
  g.scale(k, -k, 1);
  const ix = g.getIndex()!;
  for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); }
  return g;
};

/** fonts for the legends are loaded once; the render waits for them */
let assets: Promise<string> | null = null;
const macAssets = () => {
  if (!assets) {
    const h = delayRender('cine3d macbook: legend font');
    const f = loadInter('normal', {weights: ['400', '500'], subsets: ['latin']});
    assets = f.waitUntilDone().then(() => f.fontFamily, () => 'Arial, sans-serif').then((v) => { continueRender(h); return v; });
  }
  return assets;
};

// ---------------------------------------------------------------------------------------------------------------
// The model

const RIM_VERT = 'varying vec3 vN; varying vec3 vV; void main(){ vec4 p = vec4(position, 1.0);\n#ifdef USE_INSTANCING\np = instanceMatrix * p;\n#endif\nvec4 mv = modelViewMatrix * p; vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }';
const RIM_FRAG = 'uniform vec3 uC; uniform vec3 uT; uniform float uO; uniform float uP; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); float veil = 0.05 * uO; vec3 c = uT * veil + uC * f * 1.5 * uO; gl_FragColor = vec4(c, veil); }';

type Part = {group: MacGroup; mesh: THREE.Mesh; mat: THREE.Material; rim?: THREE.Mesh; refl?: THREE.Mesh};

const buildMac = (finish: MacFinish, font: string) => {
  const F = FINISH[finish];
  const parts: Part[] = [];
  const baseG = new THREE.Group(), lidG = new THREE.Group(), root = new THREE.Group();
  for (const g of [baseG, lidG, root]) g.matrixAutoUpdate = false;
  root.add(baseG, lidG);
  const mats = new Map<string, THREE.Material>();
  const mat = <M extends THREE.Material>(key: string, make: () => M, envK = 1): M => {
    let m = mats.get(key) as M | undefined;
    if (!m) { m = make(); m.userData.o = {transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite}; m.userData.envK = envK; mats.set(key, m); }
    return m;
  };
  const rimMat = () =>
    new THREE.ShaderMaterial({
      uniforms: {uC: {value: new THREE.Color('#A9CCFF')}, uT: {value: new THREE.Color('#1B2A44')}, uO: {value: 0}, uP: {value: 2.4}},
      vertexShader: RIM_VERT, fragmentShader: RIM_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
  const groupRim: Partial<Record<MacGroup, THREE.ShaderMaterial>> = {};
  const groupRefl: Partial<Record<MacGroup, THREE.MeshBasicMaterial>> = {};
  const add = (group: MacGroup, geo: THREE.BufferGeometry, m: THREE.Material, o: {ghost?: boolean; refl?: boolean; shadow?: boolean; receive?: boolean; order?: number; at?: THREE.Matrix4[]} = {}) => {
    const parent = group === 'lid' ? lidG : baseG;
    const make = (mm: THREE.Material) => {
      let mesh: THREE.Mesh;
      if (o.at) { const im = new THREE.InstancedMesh(geo, mm, o.at.length); o.at.forEach((x, i) => im.setMatrixAt(i, x)); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); mesh = im; }
      else mesh = new THREE.Mesh(geo, mm);
      mesh.matrixAutoUpdate = false;
      parent.add(mesh);
      return mesh;
    };
    const mesh = make(m);
    mesh.castShadow = o.shadow ?? true;
    mesh.receiveShadow = o.receive ?? true;
    mesh.renderOrder = o.order ?? 0;
    const p: Part = {group, mesh, mat: m};
    if (o.ghost) { p.rim = make((groupRim[group] ??= rimMat())); p.rim.renderOrder = 3; }
    if (o.refl) {
      p.refl = make((groupRefl[group] ??= keepAlpha(new THREE.MeshBasicMaterial({color: '#000000', reflectivity: 0, combine: THREE.MixOperation, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}))));
      p.refl.renderOrder = 4;
    }
    parts.push(p);
    return mesh;
  };

  // ---- materials --------------------------------------------------------------------------------------------------
  const bead = beadNormal();
  const alu = (g: MacGroup, flatFace = false) =>
    mat(`${g}:alu${flatFace ? 'F' : ''}`, () => new THREE.MeshPhysicalMaterial({
      color: F.alu, metalness: 0.92, roughness: 0.42, normalMap: bead, normalScale: new THREE.Vector2(0.18, 0.18),
      ...(flatFace ? {anisotropy: 0.3, anisotropyRotation: 0} : {}),
    }), 0.6);
  const wellMat = mat('deck:well', () => new THREE.MeshStandardMaterial({color: F.well, metalness: 0.8, roughness: 0.5}), 0.75);
  const keyMat = mat('deck:key', () => new THREE.MeshStandardMaterial({color: '#0D0E10', metalness: 0, roughness: 0.5}), 0.8);
  const touchMat = mat('deck:touch', () => new THREE.MeshPhysicalMaterial({color: '#0B0C0E', metalness: 0.1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2}), 1.2);
  const padMat = mat('deck:pad', () => new THREE.MeshPhysicalMaterial({color: F.pad, metalness: 0.75, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.28}), 1.1);
  const darkMat = (g: MacGroup) => mat(`${g}:dark`, () => new THREE.MeshStandardMaterial({color: '#050506', metalness: 0.2, roughness: 0.6}), 0.5);
  const rubber = mat('bottom:rubber', () => new THREE.MeshStandardMaterial({color: '#17181A', metalness: 0, roughness: 0.85}), 0.6);

  // ---- body: edge chamfer, sides and underside as one skin ---------------------------------------------------------
  const CS = 10, EX = 96, EZ = 40;
  const ring = (ins: number) => rrRing(BW - 2 * ins, BD - 2 * ins, RC - ins, CS, EX, EZ);
  const scoop = (x: number, z: number) => (z > HD - 7 ? SCOOP.drop * clamp((SCOOP.hw - Math.abs(x)) / 3) : 0);
  const chamfer = loft([ringY(ring(CH), (x, z) => -scoop(x, z)), ringY(ring(0), (x, z) => -CH - scoop(x, z))]);
  const SPLIT = 9;
  const skinRings: THREE.Vector3[][] = [ringY(ring(0), (x, z) => -CH - scoop(x, z)), ringY(ring(0), (x, z) => -WALL - 0.35 * scoop(x, z))];
  const insets: number[] = [];
  for (let k = 1; k <= 12; k++) insets.push(RB * Math.pow(k / 12, 2.1));
  insets.push(30, 42, 56, 70, 84, 96, HD);
  insets.forEach((d) => skinRings.push(ring(d).map(([x, z]) => new THREE.Vector3(x, bottomY(d, z), z))));
  const skin = loft(skinRings);
  const n0 = skinRings[0].length, cut = (SPLIT + 1) * n0 * 6, allIdx = Array.from(skin.getIndex()!.array as ArrayLike<number>);
  const sub = (idx: number[]) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', skin.getAttribute('position')); g.setAttribute('normal', skin.getAttribute('normal')); g.setAttribute('uv', skin.getAttribute('uv')); g.setIndex(idx); return g; };
  planarUV(skin);
  const sideGeo = sub(allIdx.slice(0, cut)), bellyGeo = sub(allIdx.slice(cut));
  // hinge trough at the rear, where the lid's barrel turns
  const troughRing = rrRing(2 * TROUGH.hw, TROUGH.z1 - TROUGH.z0, 1.0, 4, 2, 2, 0, (TROUGH.z0 + TROUGH.z1) / 2);
  const trough = [loft([ringY(troughRing, 0), ringY(troughRing, -TROUGH.depth)], true), flat(troughRing, -TROUGH.depth)];
  add('body', merged([chamfer]), alu('body'), {ghost: true});
  add('body', sideGeo, alu('body'), {ghost: true});
  add('body', merged(trough), mat('body:trough', () => new THREE.MeshStandardMaterial({color: F.well, metalness: 0.6, roughness: 0.6}), 0.4), {shadow: false});
  add('bottom', bellyGeo, alu('bottom'), {ghost: true, refl: true});
  // feet
  const foot = new THREE.CylinderGeometry(7, 6.5, FOOT + 0.3, 40);
  add('bottom', foot, rubber, {at: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => new THREE.Matrix4().makeTranslation(sx * FEET_X, -thick(sz * FEET_Z) - FOOT / 2 + 0.15, sz * FEET_Z))});
  // ports: two USB-C on the left, the headphone jack on the right
  const slot = new THREE.Shape();
  slot.absarc(-2.85, 0, 1.35, Math.PI / 2, Math.PI * 1.5, false); slot.absarc(2.85, 0, 1.35, -Math.PI / 2, Math.PI / 2, false);
  const usb = (z: number) => { const g = new THREE.ExtrudeGeometry(slot, {depth: 1.0, bevelEnabled: false, curveSegments: 10}); g.rotateY(-Math.PI / 2); g.rotateZ(0.2); g.translate(-HW + 1.15, -3.4, z); return g; };
  const tongue = (z: number) => { const g = new THREE.BoxGeometry(0.1, 0.6, 5.4); g.rotateZ(0.2); g.translate(-HW + 0.11, -3.4, z); return g; };
  const jack = new THREE.CylinderGeometry(1.85, 1.85, 1.0, 28); jack.rotateZ(Math.PI / 2); jack.rotateZ(-0.2); jack.translate(HW - 0.62, -3.4, -HD + 30);
  add('body', mergeGeometries([usb(-HD + 30), usb(-HD + 46), jack].map((g) => { const n = g.toNonIndexed(); n.deleteAttribute('uv'); return n; }))!, darkMat('body'), {shadow: false});
  add('body', mergeGeometries([tongue(-HD + 30), tongue(-HD + 46)])!, mat('body:tongue', () => new THREE.MeshStandardMaterial({color: '#3A3B3F', metalness: 0.6, roughness: 0.5}), 0.6), {shadow: false});

  // ---- deck: top face with its openings, keyboard well, trackpad, grilles, thumb scoop ----------------------------------
  const wz = WELL.z0 + WELL.d / 2;
  const wellRing = (ins: number, cs = 8) => rrRing(WELL.w - 2 * ins, WELL.d - 2 * ins, WELL.r - ins, cs, 8, 4, 0, wz);
  const tz = TP.z0 + TP.d / 2, padGap = 0.28;
  const padRing = (ins: number) => rrRing(TP.w - 2 * ins, TP.d - 2 * ins, TP.r - ins, 8, 4, 4, 0, tz);
  const zs = HD - CH - 0.05, scoopRing = rrRing(2 * SCOOP.hw, SCOOP.len, [0.2, 0.2, 1.4, 1.4], 4, 2, 2, 0, zs - SCOOP.len / 2);
  const top = flat(ring(CH), 0, true, [wellRing(0), padRing(-padGap), troughRing, scoopRing]);
  const ramp = quad([-SCOOP.hw, 0, zs - SCOOP.len], [SCOOP.hw, 0, zs - SCOOP.len], [SCOOP.hw, -SCOOP.drop, zs + 0.05], [-SCOOP.hw, -SCOOP.drop, zs + 0.05]);
  add('deck', merged([top, ramp]), alu('deck', true), {ghost: true, refl: true});
  const wellWall = loft([ringY(wellRing(0), 0), ringY(wellRing(0.32), -0.32), ringY(wellRing(0.32), -WELL.depth)], true);
  add('deck', merged([wellWall]), alu('deck'), {ghost: true});
  add('deck', flat(wellRing(0.32), -WELL.depth), wellMat, {});
  // trackpad: a glass plate in a hairline groove
  const padEdge = loft([ringY(padRing(0.12), 0.0), ringY(padRing(0), -0.12), ringY(padRing(0), -0.7)]);
  add('deck', merged([flat(padRing(0.12), 0.0), padEdge]), padMat, {ghost: true});
  add('deck', flat(padRing(-padGap), -0.7), darkMat('deck'), {shadow: false});
  // speaker grilles
  const gt = grilleTile();
  const grille = (sx: number) => { const g = card(GRILLE.w, GRILLE.d, [1, 0, 0], [0, 0, -1], [sx * GRILLE.x, 0.012, wz]); const uv = g.getAttribute('uv'); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.round(GRILLE.w / 1.02), uv.getY(i) * Math.round(GRILLE.d / 1.02)); return g; };
  add('deck', mergeGeometries([grille(-1), grille(1)])!, mat('deck:grille', () => new THREE.MeshStandardMaterial({map: gt, transparent: true, roughness: 0.8, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}), 0.2), {shadow: false, order: 1});
  // keys: one instanced mesh per keycap size
  const classes = new Map<string, {w: number; d: number; touch: boolean; at: THREE.Matrix4[]}>();
  for (const k of KEYS) {
    const id = `${k.w.toFixed(2)}x${k.d.toFixed(2)}${k.touch ? 't' : ''}`;
    if (!classes.has(id)) classes.set(id, {w: k.w, d: k.d, touch: !!k.touch, at: []});
    classes.get(id)!.at.push(new THREE.Matrix4().makeTranslation(KB.x0 + k.x + k.w / 2, -WELL.depth, KB.z0 + k.z + k.d / 2));
  }
  classes.forEach((c) => add('deck', keyGeo(c.w, c.d), c.touch ? touchMat : keyMat, {ghost: true, at: c.at}));
  const keyTop = -WELL.depth + KEY.h;
  const legends = legendAtlas(font);
  const legendMat = mat('deck:legend', () => new THREE.MeshStandardMaterial({map: legends, color: '#D2D3D6', roughness: 0.7, metalness: 0, emissive: '#DDE6FF', emissiveMap: legends, emissiveIntensity: 0, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}), 0.5);
  add('deck', card(KB.w, KB.d, [1, 0, 0], [0, 0, -1], [KB.x0 + KB.w / 2, keyTop + 0.012, KB.z0 + KB.d / 2]), legendMat, {shadow: false, receive: false, order: 2});
  const halo = haloAtlas();
  const haloMat = mat('deck:halo', () => keepAlpha(new THREE.MeshBasicMaterial({map: halo, color: '#C9D8FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2})));
  add('deck', card(KB.w + 6, KB.d + 6, [1, 0, 0], [0, 0, -1], [KB.x0 + KB.w / 2, -WELL.depth + 0.05, KB.z0 + KB.d / 2]), haloMat, {shadow: false, receive: false, order: 1});

  // ---- lid: housing, hinge barrel, glass, camera, wordmark, logo -------------------------------------------------------
  const lz = (LZ0 + LZ1) / 2, PL = LZ1 - LZ0, LR: [number, number, number, number] = [10.5, 10.5, 2.4, 2.4], FIL = 2.1;
  const lring = (ins: number) => rrRing(BW - 2 * ins, PL - 2 * ins, R4(LR, ins), 10, 48, 32, 0, lz);
  const lidRings: THREE.Vector3[][] = [ringY(lring(PL / 2), LY1), ringY(lring(40), LY1), ringY(lring(FIL), LY1)];
  for (let i = 1; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); lidRings.push(ringY(lring(FIL * (1 - Math.sin(a))), LY1 - FIL * (1 - Math.cos(a)))); }
  lidRings.push(ringY(lring(0), LY0 + 0.3), ringY(lring(0.3), LY0), ringY(lring(1.2), LY0));
  add('lid', planarUV(loft(lidRings)), alu('lid'), {ghost: true});
  const cyl = (len: number, x: number) => { const g = new THREE.CylinderGeometry(RBAR, RBAR, len, 48, 1, false); g.rotateZ(Math.PI / 2); g.translate(x, 0, 0); return g; };
  add('lid', mergeGeometries([cyl(17.4, -109.8), cyl(17.4, 109.8)])!, mat('lid:aluPlain', () => new THREE.MeshStandardMaterial({color: F.alu, metalness: 0.92, roughness: 0.42}), 0.6), {});
  add('lid', cyl(202.2, 0), mat('lid:barrel', () => new THREE.MeshStandardMaterial({color: F.barrel, metalness: 0.3, roughness: 0.5}), 0.7), {});
  const glassRing = rrRing(BW - 2.0, PL - 2.0, R4(LR, 1.0), 10, 4, 4, 0, lz);
  // the glass has a real opening for the display, so the display plane never fights the glass for depth; the decals on
  // the glass (camera, wordmark) and on the lid (logo) lie in the surface and win by polygon offset
  const GY = LY0 - 0.03, decal = {polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, depthWrite: false};
  const scrRing = rrRing(SCR_W, SCR_H, 0.01, 1, 0, 0, 0, (SCR_Z0 + SCR_Z1) / 2);
  add('lid', flat(glassRing, GY, false, [scrRing]), mat('lid:glass', () => new THREE.MeshPhysicalMaterial({color: '#020203', metalness: 0, roughness: 0.08}), 1.0), {shadow: false});
  const scrGeo = card(SCR_W, SCR_H, [1, 0, 0], [0, 0, 1], [0, GY, (SCR_Z0 + SCR_Z1) / 2]);
  const punch = add('lid', scrGeo, mat('lid:punch', () => new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0, blending: THREE.NoBlending})), {shadow: false, receive: false, order: 1});
  const gloss = add('lid', scrGeo, mat('lid:gloss', () => keepAlpha(new THREE.MeshBasicMaterial({color: '#000000', envMap: glossEnv(), reflectivity: 0.07, combine: THREE.MixOperation, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}))), {shadow: false, receive: false, order: 2});
  const camZ = MAC_POINTS.camera.p[2];
  const disc = (r: number, dy: number) => { const g = new THREE.CircleGeometry(r, 32); g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)).setPosition(0, GY - dy, camZ)); return g; };
  add('lid', disc(1.25, 0.004), mat('lid:camRing', () => new THREE.MeshPhysicalMaterial({color: '#15171C', metalness: 0.6, roughness: 0.25, clearcoat: 1, ...decal, polygonOffsetFactor: -3, polygonOffsetUnits: -3}), 1.5), {shadow: false, receive: false, order: 1});
  add('lid', disc(0.62, 0.008), mat('lid:camLens', () => new THREE.MeshPhysicalMaterial({color: '#1B2A5C', metalness: 0.8, roughness: 0.1, iridescence: 1, iridescenceIOR: 1.6, ...decal, polygonOffsetFactor: -6, polygonOffsetUnits: -6}), 1.8), {shadow: false, receive: false, order: 2});
  const wm = wordmark(font, F.word);
  add('lid', card(40, 5, [1, 0, 0], [0, 0, 1], [0, GY - 0.004, MAC_POINTS.wordmark.p[2]]), mat('lid:word', () => new THREE.MeshBasicMaterial({map: wm, transparent: true, toneMapped: false, ...decal})), {shadow: false, receive: false, order: 2});
  const logo = logoGeo(44);
  logo.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)).setPosition(0, LY1 + 0.02, MAC_POINTS.lidLogo.p[2]));
  add('lid', logo, mat('lid:logo', () => new THREE.MeshPhysicalMaterial({color: F.logo, metalness: 1, roughness: 0.035, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}), 2.1), {shadow: false, receive: false, order: 1});

  // the inside plane as a depth-only mask: while an inside view shows, nothing behind it is drawn (underside, floor)
  const I = MAC.interior;
  const blocker = new THREE.Mesh(flat(rrRing(I.x1 - I.x0, I.z1 - I.z0, 7, 8, 2, 2, (I.x0 + I.x1) / 2, (I.z0 + I.z1) / 2), I.y), new THREE.MeshBasicMaterial({colorWrite: false, side: THREE.DoubleSide}));
  blocker.matrixAutoUpdate = false;
  blocker.renderOrder = -5;
  baseG.add(blocker);
  return {root, baseG, lidG, parts, mats: [...mats.values()], groupRim, groupRefl, punch, gloss, blocker, legendMat, haloMat};
};

export type MacModelProps = {
  pose?: Pose;
  /** lid angle in degrees: 0 closed, about 110 in use, 135 fully open */
  lid?: number;
  finish?: MacFinish;
  shell?: MacShell;
  /** the display is a window onto live 2D content under the canvas (MacShot sets it) */
  liveScreen?: boolean;
  screenGloss?: number;
  /** an inside view is showing under the canvas: mask everything behind the inside plane */
  inside?: boolean;
  envIntensity?: number;
};

export const MacModel: React.FC<MacModelProps> = ({pose, lid = 110, finish = 'spaceGrey', shell = {}, liveScreen = false, screenGloss = 1, inside = false, envIntensity = 1.5}) => {
  const font = use(macAssets());
  const model = useMemo(() => buildMac(finish, font), [finish, font]);
  const {scene} = useThree();
  const M = macMatrices(pose ?? NOPOSE, lid);
  model.root.matrix.copy(M.base);
  model.lidG.matrix.copy(new THREE.Matrix4().makeTranslation(0, AY, AZ).multiply(new THREE.Matrix4().makeRotationX(-lid * DEG)));
  const backlight = clamp(shell.backlight ?? 0);
  model.legendMat.emissiveIntensity = 1.5 * backlight;
  model.haloMat.userData.o.opacity = 0.55 * backlight;
  const st = (g: MacGroup) => ({opacity: clamp(shell[g]?.opacity ?? 1), glass: clamp(shell[g]?.glass ?? 0)});
  const groups: Record<MacGroup, {opacity: number; glass: number}> = {deck: st('deck'), body: st('body'), bottom: st('bottom'), lid: st('lid')};
  const seen = new Set<THREE.Material>();
  for (const p of model.parts) {
    const g = groups[p.group], solid = g.opacity * (1 - g.glass), ghost = g.opacity * g.glass, m = p.mat;
    if (!seen.has(m)) {
      seen.add(m);
      const o = m.userData.o as {transparent: boolean; opacity: number; depthWrite: boolean};
      const tr = solid < 0.999 || o.transparent;
      if (m.transparent !== tr) m.needsUpdate = true;
      m.transparent = tr;
      m.opacity = o.opacity * solid;
      m.depthWrite = solid < 0.999 ? o.depthWrite && solid > 0.6 : o.depthWrite;
      if ('envMapIntensity' in m) (m as THREE.MeshStandardMaterial).envMapIntensity = envIntensity * (m.userData.envK ?? 1);
    }
    p.mesh.visible = solid > 0.004;
    if (p.rim) p.rim.visible = ghost > 0.004;
    if (p.refl) p.refl.visible = ghost > 0.004;
  }
  for (const g of Object.keys(groups) as MacGroup[]) {
    const r = model.groupRim[g];
    if (r) r.uniforms.uO.value = groups[g].opacity * groups[g].glass;
    const f = model.groupRefl[g];
    if (f) { f.envMap = scene.environment; f.reflectivity = 0.04 * groups[g].opacity * groups[g].glass; }
  }
  const lidSolid = groups.lid.opacity * (1 - groups.lid.glass);
  model.punch.visible = liveScreen && lidSolid > 0.5;
  const gm = model.gloss.material as THREE.MeshBasicMaterial;
  gm.reflectivity = 0.085 * screenGloss;
  model.gloss.visible = liveScreen && lidSolid > 0.5;
  model.blocker.visible = inside;
  model.root.traverse((o) => { o.matrixWorldNeedsUpdate = true; });
  return <primitive object={model.root} />;
};

// ---------------------------------------------------------------------------------------------------------------
// Default screen content: an abstract wallpaper drawn in code (our own colour ribbons) with a quiet menu bar and dock

export const MacWallpaper: React.FC<{w?: number; h?: number; t?: number; id?: string}> = ({w = 1440, h = 900, t = 0, id = 'mwp'}) => {
  const bands = useMemo(() => {
    const rnd = seeded(2020);
    return Array.from({length: 7}, (_, i) => ({y: 0.2 + i * 0.105, a: 0.05 + rnd() * 0.05, f: 0.7 + rnd() * 0.9, p: rnd() * 6.28, a2: 0.015 + rnd() * 0.02, f2: 2.1 + rnd() * 1.6, p2: rnd() * 6.28}));
  }, []);
  const cols: [string, string][] = [['#123B8C', '#0E6FC2'], ['#1557C8', '#18B6D9'], ['#16A6C9', '#35E0B6'], ['#5E5BE6', '#B45CF0'], ['#C24BD6', '#FF5FA2'], ['#FF6B8A', '#FFA65C'], ['#FFB25C', '#FFE08A']];
  const path = (b: (typeof bands)[number], k: number) => {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const x = i / 48, y = b.y + 0.34 * (0.5 - x) + b.a * Math.sin(x * b.f * 3.2 + b.p + t * 0.004 * (k + 1)) + b.a2 * Math.sin(x * b.f2 * 4.1 + b.p2);
      d += `${i ? 'L' : 'M'}${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`;
    }
    return `${d}L${w} ${h}L0 ${h}Z`;
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#081A4A" /><stop offset="0.6" stopColor="#0B2C78" /><stop offset="1" stopColor="#123B8C" /></linearGradient>
        {cols.map((c, i) => <linearGradient key={i} id={`${id}-b${i}`} x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={c[1]} /></linearGradient>)}
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.22" /><stop offset="0.12" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <filter id={`${id}-soft`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2" /></filter>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-sky)`} />
      <g filter={`url(#${id}-soft)`}>
        {bands.map((b, i) => <g key={i}><path d={path(b, i)} fill={`url(#${id}-b${i})`} /><path d={path(b, i)} fill={`url(#${id}-sh)`} /></g>)}
      </g>
    </svg>
  );
};

export const MacDesktop: React.FC<{t?: number; w?: number; h?: number}> = ({t = 0, w = 1440, h = 900}) => {
  const dock = ['#3B8CFF', '#35E0B6', '#FFB25C', '#FF5FA2', '#B45CF0', '#F4F5F7', '#18B6D9', '#FF6B6B', '#8E96A3'];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: '#081A4A'}}>
      <MacWallpaper w={w} h={h} t={t} />
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: 26, background: 'rgba(255,255,255,0.16)'}}>
        {[18, 52, 96, 132, 170, 204, 250].map((x, i) => <div key={i} style={{position: 'absolute', left: x, top: 9, width: i === 0 ? 14 : [0, 30, 22, 26, 22, 34, 24][i], height: 8, borderRadius: 4, background: '#fff', opacity: i === 0 ? 0.95 : i === 1 ? 0.9 : 0.7}} />)}
        {[0, 1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', right: 18 + i * 30, top: 8, width: i === 0 ? 46 : 16, height: 10, borderRadius: 5, background: '#fff', opacity: 0.75}} />)}
      </div>
      <div style={{position: 'absolute', left: (w - (dock.length * 58 + 18)) / 2, bottom: 10, width: dock.length * 58 + 18, height: 68, borderRadius: 20, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.28)'}}>
        {dock.map((c, i) => <div key={i} style={{position: 'absolute', left: 13 + i * 58, top: 9, width: 50, height: 50, borderRadius: 13, background: `linear-gradient(160deg, ${c}, ${c}BB)`, boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.45)'}} />)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------

export type MacShotProps = {
  /** design frame of the scene (fractional at 60 fps output) */
  t: number;
  W: number; H: number;
  /** camera keys in design frames (all OrbitKey or all CamKey). World units: 1 = 15 mm, the floor is y = 0, the Mac
   *  stands at the origin facing +z (yaw 0 = the user's seat, yaw 180 = behind the lid). */
  cam: (CamKey | OrbitKey)[];
  pose?: PoseKey[];
  /** lid angle in degrees (animate it in the scene): 0 closed, about 110 in use, 135 fully open */
  lid?: number;
  finish?: MacFinish;
  shell?: MacShell;
  /** live 2D content for the display, drawn in a `screenPx` box (default 1440 x 900); default: MacDesktop */
  screen?: React.ReactNode;
  screenPx?: [number, number];
  /** 0 = the display is off (black glass), 1 = on */
  screenOn?: number;
  screenGloss?: number;
  /** 2D content laid on the plane under the keyboard (MAC.interior, 1740 x 1181 px), seen when the deck is ghosted */
  interior?: React.ReactNode;
  light?: StudioProps;
  fx?: Fx | false;
  /** contact shadow on the floor y = 0 */
  floor?: false | {shadow?: number; blur?: number; size?: number};
  background?: string;
  children?: React.ReactNode;
};

export const MacShot: React.FC<MacShotProps> = ({t, W, H, cam, pose, lid = 110, finish = 'spaceGrey', shell, screen, screenPx = [1440, 900], screenOn = 1, screenGloss = 1, interior, light, fx, floor = {}, background, children}) => {
  const v = macView({t, cam, pose, lid, W, H});
  const p = poseAt(pose, t);
  const st = (g: MacGroup) => clamp(shell?.[g]?.opacity ?? 1) * (1 - clamp(shell?.[g]?.glass ?? 0));
  const showScreen = v.screenFacing > 0.03 && lid > 2 && st('lid') > 0.5;
  const showInside = !!interior && (v.above > 0.02 ? st('deck') < 0.995 : v.above < -0.02 && st('bottom') < 0.995);
  const fl = floor === false ? null : {shadow: 0.6, blur: 2.4, size: 44, ...floor};
  const tgt = v.world([0, 0, 0]);
  const [sw, sh] = screenPx;
  return (
    <AbsoluteFill>
      {showInside ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: v.interior.w, height: v.interior.h, transformOrigin: '0 0', transform: v.interior.matrix(), overflow: 'hidden', borderRadius: 42, backfaceVisibility: 'hidden'}}>
          {interior}
        </div>
      ) : null}
      {showScreen ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: sw, height: sh, transformOrigin: '0 0', transform: v.screenMatrix(sw, sh), overflow: 'hidden', background: '#000'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: sw, height: sh, opacity: clamp(screenOn), overflow: 'hidden'}}>{screen ?? <MacDesktop t={t} w={sw} h={sh} />}</div>
        </div>
      ) : null}
      <Stage3D t={t} W={W} H={H} cam={v.cam} fx={fx} background={background}>
        <Studio target={[tgt.x, tgt.y, tgt.z]} radius={17} {...light} />
        <MacModel pose={p} lid={lid} finish={finish} shell={shell} liveScreen={showScreen} screenGloss={screenGloss} inside={showInside} />
        {fl && fl.shadow > 0 ? <PhoneFloor y={0} shadow={fl.shadow} blur={fl.blur} size={fl.size} at={[tgt.x, 0, tgt.z]} /> : null}
        {children}
      </Stage3D>
    </AbsoluteFill>
  );
};
