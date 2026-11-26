// cine3d core (26 Nov 2026): real 3D (three.js inside Remotion) for the two things Ved approved it for - the real
// iPhone 18 Pro model and the hero transistor. Everything here is a pure function of the design frame `t` that the
// scene passes in: no useFrame clocks, no Math.random, no timers. Boards, chips, dies and diagrams stay 2D code.
//
// What is in this file: camera keys (one continuous Catmull-Rom move), the projection helpers the 2D layers use
// (anchors, CSS matrix3d for a plane), the canvas (`Stage3D`: alpha out, depth of field, bloom, filmic grade) and
// the studio lights.
import React, {useEffect, useMemo, useRef} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import {Environment, Lightformer} from '@react-three/drei';
import {BlendFunction, BloomEffect, Effect, EffectAttribute, EffectComposer, EffectPass, RenderPass} from 'postprocessing';
import * as THREE from 'three';

export type V3 = [number, number, number];
export const DEG = Math.PI / 180;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (q: number) => { const c = clamp(q); return c * c * (3 - 2 * c); };
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** Deterministic random stream (never Math.random). */
export const seeded = (s: number) => () => {
  s = (s * 16807) % 2147483647;
  return s / 2147483647;
};

// ---------------------------------------------------------------------------------------------------------------
// Keys. Values between keys follow a non-uniform Catmull-Rom (Hermite) curve: the move starts and ends at rest and
// passes through every key without a corner. `hold: true` makes a key a full stop (arrive and leave at rest).

export const hermite = <K extends {t: number; hold?: boolean}>(keys: K[], t: number, get: (k: K) => number[]): number[] => {
  const n = keys.length;
  if (n === 1 || t <= keys[0].t) return get(keys[0]);
  if (t >= keys[n - 1].t) return get(keys[n - 1]);
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  const dt = k1.t - k0.t;
  const u = (t - k0.t) / dt;
  const p0 = get(k0), p1 = get(k1);
  const prev = i > 0 ? keys[i - 1] : null;
  const next = i + 2 < n ? keys[i + 2] : null;
  const m0 = p0.map((_, c) => (prev && !k0.hold ? ((p1[c] - get(prev)[c]) / (k1.t - prev.t)) * dt : 0));
  const m1 = p1.map((_, c) => (next && !k1.hold ? ((get(next)[c] - p0[c]) / (next.t - k0.t)) * dt : 0));
  const u2 = u * u, u3 = u2 * u;
  return p0.map((v, c) => (2 * u3 - 3 * u2 + 1) * v + (u3 - 2 * u2 + u) * m0[c] + (-2 * u3 + 3 * u2) * p1[c] + (u3 - u2) * m1[c]);
};

/** A camera key in world units. `focus` is the point that is sharp (default: the target). */
export type CamKey = {t: number; pos: V3; tgt: V3; fov?: number; focus?: V3; roll?: number; hold?: boolean};
/** A camera key as an orbit round `tgt`: yaw 0 looks at the +z side (the phone's BACK), yaw 180 at the screen;
 *  pitch > 0 looks down from above. Orbit keys are interpolated as angles, so a turn keeps its distance. */
export type OrbitKey = {t: number; yaw: number; pitch: number; dist: number; tgt?: V3; fov?: number; focus?: V3; roll?: number; hold?: boolean};
export type Cam = {pos: V3; tgt: V3; fov: number; focus: V3; roll: number; focusDist: number};

export const orbitPos = (yaw: number, pitch: number, dist: number, tgt: V3 = [0, 0, 0]): V3 => [
  tgt[0] + dist * Math.sin(yaw * DEG) * Math.cos(pitch * DEG),
  tgt[1] + dist * Math.sin(pitch * DEG),
  tgt[2] + dist * Math.cos(yaw * DEG) * Math.cos(pitch * DEG),
];
const isOrbit = (k: CamKey | OrbitKey): k is OrbitKey => (k as OrbitKey).yaw !== undefined;

/** The camera at design frame `t` (fractional frames welcome). Accepts all-orbit keys or all-position keys. */
export const camAt = (keys: (CamKey | OrbitKey)[], t: number): Cam => {
  let pos: V3, tgt: V3, focus: V3, fov: number, roll: number;
  if (isOrbit(keys[0])) {
    const ks = keys as OrbitKey[];
    const o = hermite(ks, t, (k) => [k.yaw, k.pitch, k.dist, ...(k.tgt ?? [0, 0, 0]), k.fov ?? 30, k.roll ?? 0, ...(k.focus ?? k.tgt ?? [0, 0, 0])]);
    tgt = [o[3], o[4], o[5]];
    pos = orbitPos(o[0], o[1], o[2], tgt);
    fov = o[6]; roll = o[7]; focus = [o[8], o[9], o[10]];
  } else {
    const ks = keys as CamKey[];
    const o = hermite(ks, t, (k) => [...k.pos, ...k.tgt, k.fov ?? 30, k.roll ?? 0, ...(k.focus ?? k.tgt)]);
    pos = [o[0], o[1], o[2]]; tgt = [o[3], o[4], o[5]]; fov = o[6]; roll = o[7]; focus = [o[8], o[9], o[10]];
  }
  return {pos, tgt, fov, focus, roll, focusDist: Math.hypot(focus[0] - pos[0], focus[1] - pos[1], focus[2] - pos[2])};
};

const applyCam = (c: THREE.PerspectiveCamera, cam: Cam, aspect: number) => {
  c.position.set(...cam.pos);
  c.fov = cam.fov;
  c.aspect = aspect;
  c.near = 0.05;
  c.far = 600;
  c.up.set(0, 1, 0);
  c.lookAt(...cam.tgt);
  if (cam.roll) c.rotateZ(cam.roll * DEG);
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
  return c;
};
/** A three camera for the same pose the canvas uses (for projecting anchors in 2D code). */
export const makeCamera = (cam: Cam, aspect: number) => applyCam(new THREE.PerspectiveCamera(), cam, aspect);

export type Px = {x: number; y: number; depth: number; behind: boolean};
/** World point -> px inside a W x H canvas (top-left origin). `behind` = behind the camera. */
export const projectPoint = (camera: THREE.PerspectiveCamera, p: V3 | THREE.Vector3, W: number, H: number): Px => {
  const w = Array.isArray(p) ? new THREE.Vector3(...p) : p.clone();
  const view = w.clone().applyMatrix4(camera.matrixWorldInverse);
  const v = w.project(camera);
  return {x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, depth: -view.z, behind: view.z > 0};
};

/** CSS `matrix3d(...)` that maps a w x h px box (transform-origin 0 0, at left 0 top 0) onto four screen points
 *  given in the order top-left, top-right, bottom-right, bottom-left. This is how live 2D content (a phone screen, a
 *  logic board) is laid on a plane of the 3D scene: perspective-correct, crisp, and exact for every frame. */
export const quadMatrix3d = (w: number, h: number, q: {x: number; y: number}[]): string => {
  const src = [[0, 0], [w, 0], [w, h], [0, h]];
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const {x: X, y: Y} = q[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X, X]);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y, Y]);
  }
  // Gauss-Jordan on the 8 x 9 system
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c] || 1e-12;
    for (let k = c; k < 9; k++) A[c][k] /= d;
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c];
      if (f) for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  const m = A.map((r) => r[8]);
  const f = (v: number) => (Math.abs(v) < 1e-12 ? '0' : v.toPrecision(12));
  return `matrix3d(${[m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, 1, 0, m[2], m[5], 0, 1].map(f).join(',')})`;
};

// ---------------------------------------------------------------------------------------------------------------
// Materials and textures

/** See-through materials must not lower the canvas alpha (the 2D world would show through a solid part behind
 *  them, and the effects pass brightens lowered alpha). Colour blends as usual, the alpha already written is kept. */
export const keepAlpha = <M extends THREE.Material>(m: M): M => {
  const additive = m.blending === THREE.AdditiveBlending || m.userData.additive === true;
  m.userData.additive = additive;
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.SrcAlphaFactor;
  m.blendDst = additive ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor;
  m.blendEquationAlpha = THREE.AddEquation;
  m.blendSrcAlpha = THREE.ZeroFactor;
  m.blendDstAlpha = THREE.OneFactor;
  return m;
};

/** A canvas texture drawn once in code. */
export const drawTexture = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = w, srgb = true) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};

// ---------------------------------------------------------------------------------------------------------------
// The grade: filmic tone curve, exposure, contrast, saturation - done last, and alpha-aware. The canvas holds
// premultiplied linear light; soft edges and glows over the transparent background are converted so that the
// browser's composite over the 2D world gives the right colour (no bright fringe round the object, glows stay
// additive).

const GRADE_FRAG = `
uniform float exposure; uniform float contrast; uniform float saturation; uniform vec3 tint; uniform float dither;
vec3 c3aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
vec3 c3enc(vec3 c){ return mix(c*12.92, 1.055*pow(max(c, vec3(0.0)), vec3(1.0/2.4))-0.055, step(vec3(0.0031308), c)); }
vec3 c3dec(vec3 c){ return mix(c/12.92, pow((max(c, vec3(0.0))+0.055)/1.055, vec3(2.4)), step(vec3(0.04045), c)); }
vec3 c3grade(vec3 c){
  c = c3aces(c*exposure*0.72);
  c = c3enc(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, saturation);
  c = (c-0.5)*contrast+0.5;
  return clamp(c*tint, 0.0, 1.0);
}
float c3hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)))*43758.5453); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  float a = clamp(inputColor.a, 0.0, 1.0);
  vec3 c = max(inputColor.rgb, vec3(0.0));
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // how much of this pixel is a surface covering the background (rest: light added on top of it)
  float k = clamp(a/(lum+1e-4), 0.0, 1.0);
  vec3 cover = c3grade(c/max(a, 1e-4))*a;
  vec3 addl = c3grade(c);
  vec3 o = mix(addl, cover, k);
  o += (c3hash(uv*resolution)-0.5)*dither/255.0;
  outputColor = vec4(c3dec(clamp(o, 0.0, 1.0)), a);
}`;

class GradeEffectImpl extends Effect {
  constructor({exposure = 1, contrast = 1, saturation = 1, tint = '#FFFFFF', dither = 1}: {exposure?: number; contrast?: number; saturation?: number; tint?: string; dither?: number} = {}) {
    super('Cine3dGrade', GRADE_FRAG, {
      blendFunction: BlendFunction.SET,
      uniforms: new Map<string, THREE.Uniform>([
        ['exposure', new THREE.Uniform(exposure)],
        ['contrast', new THREE.Uniform(contrast)],
        ['saturation', new THREE.Uniform(saturation)],
        ['tint', new THREE.Uniform(new THREE.Color(tint))],
        ['dither', new THREE.Uniform(dither)],
      ]),
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Depth of field that respects alpha. (The stock effect keeps its blur radius in the alpha channel, so a canvas with
// a transparent background comes out opaque.) One gather pass over a golden-angle spiral: every tap is a
// premultiplied RGBA sample, a tap counts when its own blur disc reaches this pixel, and the empty background takes
// the blur of whatever is in front of it - so an out-of-focus edge fades softly into the 2D world behind.

const DOF_FRAG = `
uniform float focus; uniform float range; uniform float maxBlur; uniform float refH;
float c3coc(float d){
  if (d >= 0.99999) return maxBlur;
  float z = -getViewZ(d);
  return maxBlur * clamp((abs(z - focus) - range * 0.5) / (range * 1.25 + 1e-4), 0.0, 1.0);
}
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor){
  float px = resolution.y / refH;
  float centerSize = c3coc(depth) * px;
  bool centerBg = depth >= 0.99999;
  vec4 color = inputColor;
  float tot = 1.0;
  float radius = 0.6 * px;
  float maxR = maxBlur * px;
  float ang = 0.0;
  for (int i = 0; i < C3_TAPS; i++) {
    if (radius >= maxR) break;
    vec2 tc = uv + vec2(cos(ang), sin(ang)) * texelSize * radius;
    float sd = readDepth(tc);
    float sampleSize = c3coc(sd) * px;
    bool sampleBg = sd >= 0.99999;
    if (sampleBg) sampleSize = centerBg ? 0.0 : centerSize;
    else if (!centerBg && sd > depth) sampleSize = min(sampleSize, centerSize * 2.0);
    float m = smoothstep(radius - 0.5 * px, radius + 0.5 * px, sampleSize);
    color += mix(color / tot, texture2D(inputBuffer, tc), m);
    tot += 1.0;
    radius += C3_STEP * px * px / radius;
    ang += 2.39996323;
  }
  outputColor = color / tot;
}`;

class DofEffectImpl extends Effect {
  constructor({focus = 10, range = 3, maxBlur = 14, taps = 160}: {focus?: number; range?: number; maxBlur?: number; taps?: number} = {}) {
    super('Cine3dDof', DOF_FRAG, {
      blendFunction: BlendFunction.SET,
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      defines: new Map<string, string>([['C3_TAPS', String(Math.round(taps))], ['C3_STEP', (((maxBlur * maxBlur) / 2 / Math.max(8, taps)) * 1.05).toFixed(4)]]),
      uniforms: new Map<string, THREE.Uniform>([
        ['focus', new THREE.Uniform(focus)],
        ['range', new THREE.Uniform(range)],
        ['maxBlur', new THREE.Uniform(maxBlur)],
        ['refH', new THREE.Uniform(1080)],
      ]),
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The canvas

export type Fx = {
  /** depth of field: `range` = depth (world units) that stays sharp round the focus point; `blur` = largest blur
   *  radius in px of a 1080-high frame, reached about 1.75 x range away from the focus; `taps` = quality */
  dof?: false | {range?: number; blur?: number; taps?: number};
  bloom?: false | {threshold?: number; intensity?: number; radius?: number};
  exposure?: number; contrast?: number; saturation?: number; tint?: string;
  /** anti-aliasing samples of the effects buffer (4 default, 0 in lite insets) */
  msaa?: number;
};

const Rig: React.FC<{cam: Cam; aspect: number}> = ({cam, aspect}) => {
  const {camera} = useThree();
  applyCam(camera as THREE.PerspectiveCamera, cam, aspect);
  return null;
};

/** The effects chain, built with the canvas (so the very first frame already has it): scene -> depth of field ->
 *  bloom -> grade. `useFrame` here is only the render hook (it draws when Remotion advances the frame), not a clock. */
const Pipeline: React.FC<{fx: Fx; focusDist: number}> = ({fx, focusDist}) => {
  const {gl, scene, camera} = useThree();
  const dof = fx.dof === false ? null : {range: 3, blur: 12, taps: 160, ...(fx.dof ?? {})};
  const bloom = fx.bloom === false ? null : {threshold: 0.9, intensity: 0.35, radius: 0.72, ...(fx.bloom ?? {})};
  const msaa = fx.msaa ?? 4;
  const P = useMemo(() => {
    const composer = new EffectComposer(gl, {multisampling: msaa, frameBufferType: THREE.HalfFloatType});
    composer.addPass(new RenderPass(scene, camera));
    const d = dof ? new DofEffectImpl({maxBlur: dof.blur, taps: dof.taps}) : null;
    if (d) composer.addPass(new EffectPass(camera, d));
    const b = bloom ? new BloomEffect({mipmapBlur: true, luminanceThreshold: bloom.threshold, luminanceSmoothing: 0.2, intensity: bloom.intensity, radius: bloom.radius}) : null;
    const g = new GradeEffectImpl();
    composer.addPass(new EffectPass(camera, ...(b ? [b, g] : [g])));
    return {composer, d, b, g, size: new THREE.Vector2(-1, -1)};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, msaa, !!dof, dof?.blur, dof?.taps, !!bloom]);
  useEffect(() => () => P.composer.dispose(), [P]);
  if (P.d && dof) {
    P.d.uniforms.get('focus')!.value = focusDist;
    P.d.uniforms.get('range')!.value = dof.range;
  }
  if (P.b && bloom) {
    P.b.intensity = bloom.intensity;
    P.b.luminanceMaterial.threshold = bloom.threshold;
  }
  P.g.uniforms.get('exposure')!.value = fx.exposure ?? 1;
  P.g.uniforms.get('contrast')!.value = fx.contrast ?? 1.04;
  P.g.uniforms.get('saturation')!.value = fx.saturation ?? 1;
  (P.g.uniforms.get('tint')!.value as THREE.Color).set(fx.tint ?? '#FFFFFF');
  useFrame(() => {
    const s = gl.getSize(new THREE.Vector2());
    const key = s.x * 100000 + s.y + gl.getPixelRatio() * 0.001;
    if (P.size.x !== key) {
      P.size.x = key;
      P.composer.setSize(s.x, s.y, false);
    }
    P.composer.render();
  }, 1);
  return null;
};

/** The studio's reflection map is drawn on the first rendered frame and only reaches the materials on the next:
 *  render twice more after a mount and hold the frame until then (otherwise a still can come back unlit). */
const FirstFrameKick: React.FC = () => {
  const {advance} = useThree();
  useEffect(() => {
    const h = delayRender('cine3d: first frames');
    let id2 = 0;
    let id3 = 0;
    const id = requestAnimationFrame(() => {
      advance(performance.now());
      id2 = requestAnimationFrame(() => {
        advance(performance.now());
        id3 = requestAnimationFrame(() => {
          advance(performance.now());
          continueRender(h);
        });
      });
    });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(id2);
      cancelAnimationFrame(id3);
      continueRender(h);
    };
  }, [advance]);
  return null;
};

export type Stage3DProps = {
  /** design frame (only used to re-arm the first-frame guard; the scene's own props carry the motion) */
  t: number;
  /** canvas size in px, and where it sits (default: the whole frame at 0,0) */
  W: number; H: number; left?: number; top?: number;
  cam: Cam;
  /** transparent background (default) so the 2D world shows behind; or a solid colour */
  background?: string;
  fx?: Fx | false;
  shadows?: boolean;
  /** allow per-material clipping planes (the transistor's cut-away); off by default */
  clipping?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const Stage3D: React.FC<Stage3DProps> = ({W, H, left = 0, top = 0, cam, background, fx = {}, shadows = true, clipping = false, style, children}) => {
  const f: Fx = fx === false ? {dof: false, bloom: false, msaa: 0} : fx;
  return (
    <ThreeCanvas
      width={W} height={H} shadows={shadows} style={{position: 'absolute', left, top, ...style}}
      camera={{fov: cam.fov, position: cam.pos, near: 0.05, far: 600}}
      gl={{antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'}}
      onCreated={({gl}) => {
        gl.toneMapping = THREE.NoToneMapping; // the grade does it once, at the end
        gl.setClearColor(0x000000, 0);
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.localClippingEnabled = clipping;
      }}
    >
      {background ? <color attach="background" args={[background]} /> : null}
      <Rig cam={cam} aspect={W / H} />
      {children}
      <Pipeline fx={f} focusDist={cam.focusDist} />
      <FirstFrameKick />
    </ThreeCanvas>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Studio light. The look matches the 2D kit: a warm-white key from the upper left, a cool blue rim from the right
// and behind, a low fill. Reflections come from soft rectangles (never round hot spots); an HDRI can be laid under
// them for real-world variation in metal and glass.

export const HDRI = {
  studioSmall: 'hdri/studio_small_09_2k.hdr',
  photoStudio: 'hdri/brown_photostudio_02_2k.hdr',
};

export type StudioProps = {
  /** file under public/, e.g. HDRI.studioSmall (optional; loaded once, guarded by the canvas) */
  hdri?: string;
  hdriLevel?: number;
  /** overall strengths (1 = default) */
  /** `main` = the key light (softbox + shadow-casting lamp); not named `key` because React keeps that prop */
  main?: number;
  /** extra strength of the shadow-casting lamp alone (deeper shadows and glints without a brighter softbox) */
  lamp?: number;
  rim?: number; fill?: number; top?: number; env?: number;
  warm?: string; cool?: string;
  /** what the shadow-casting key aims at, and how big an area its shadow covers */
  target?: V3; radius?: number;
  /** direction the key comes from (unit-ish vector from the target) */
  keyFrom?: V3;
  castShadow?: boolean;
};

export const Studio: React.FC<StudioProps> = ({hdri, hdriLevel = 0.3, main = 1, lamp = 1, rim = 1, fill = 1, top = 1, env = 1, warm = '#FFF3E6', cool = '#9CC3FF', target = [0, 0, 0], radius = 7, keyFrom = [-0.55, 0.75, 0.6], castShadow = true}) => {
  const light = useMemo(() => {
    const l = new THREE.DirectionalLight(warm, 1);
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0005;
    l.shadow.normalBias = 0.01;
    l.shadow.radius = 4;
    return l;
  }, [warm]);
  const c = light.shadow.camera as THREE.OrthographicCamera;
  c.left = -radius; c.right = radius; c.top = radius; c.bottom = -radius; c.near = 0.1; c.far = radius * 8;
  c.updateProjectionMatrix();
  light.castShadow = castShadow;
  light.intensity = 1.6 * main * lamp;
  const n = Math.hypot(...keyFrom) || 1;
  light.position.set(target[0] + (keyFrom[0] / n) * radius * 3, target[1] + (keyFrom[1] / n) * radius * 3, target[2] + (keyFrom[2] / n) * radius * 3);
  light.target.position.set(...target);
  light.target.updateMatrixWorld();
  return (
    <>
      <Environment resolution={1024} frames={1} environmentIntensity={env} {...(hdri ? {files: staticFile(hdri), backgroundIntensity: hdriLevel, backgroundBlurriness: 0.3} : {})}>
        {/* key softbox, upper left */}
        <Lightformer form="rect" intensity={7 * main} position={[-7, 8, 7]} rotation={[-0.7, -0.75, 0]} scale={[13, 8, 1]} color={warm} />
        {/* long cool strip on the right, a thinner one behind on the left: the rim lines on every edge */}
        <Lightformer form="rect" intensity={4.2 * rim} position={[11, 1.5, -2]} rotation-y={-Math.PI / 2.2} scale={[2.2, 16, 1]} color={cool} />
        <Lightformer form="rect" intensity={2.6 * rim} position={[-11, 0, -4]} rotation-y={Math.PI / 2.4} scale={[1.4, 14, 1]} color="#DCE8FF" />
        {/* a wide low fill from the front and a faint floor bounce */}
        <Lightformer form="rect" intensity={1.7 * fill} position={[3, 1, 13]} scale={[20, 12, 1]} color="#C9D8F2" />
        <Lightformer form="rect" intensity={1.3 * top} position={[0, 13, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} color="#E6EEFF" />
        <Lightformer form="rect" intensity={0.5 * fill} position={[0, -9, 2]} rotation-x={Math.PI / 2} scale={[14, 8, 1]} color="#35507E" />
      </Environment>
      <ambientLight intensity={0.1 * fill} color="#AFC6EE" />
      <primitive object={light} />
      <primitive object={light.target} />
      <directionalLight position={[target[0] + 9, target[1] + 3, target[2] - 7]} intensity={1.5 * rim} color={cool} />
      <directionalLight position={[target[0] - 3, target[1] - 2, target[2] + 9]} intensity={0.35 * fill} color="#DDE6F5" />
    </>
  );
};
