// cine3d phone (26 Nov 2026): the real iPhone 18 Pro (Apple's own AR model, converted to GLB) as one filmed element
// that 2D scene code drops in. Transparent background, one continuous camera move, studio light, depth of field.
//
//   <PhoneShot t={t} W={W} H={H} cam={CAM} pose={POSE} screen={<Feed t={t} />} />
//   const v = phoneView({t, cam: CAM, pose: POSE, W, H});  v.point('chip')  ->  {x, y} px for a 2D callout
//
// LICENCE: the model is Apple's. It lives ONLY in the engine's public/models/ folder. Never copy the GLB / USDZ (or
// the HDRIs) into the git repo, a zip or an upload package.
//
// Model facts (measured from the GLB, after centring and scaling the phone to 10 units tall; 1 unit = 15.0 mm):
//   - 94 meshes, 34 materials, names are hashes -> parts are recognised by where they are and what they are made of.
//   - y is up, the BACK faces +z, the screen faces -z. Body 4.786 wide x 10 tall; frame z -0.446 .. +0.314; lens rings
//     reach z +0.455; the screen glass is the plane z = -0.455, 4.435 x 9.648.
//   - lenses: Main (-1.436, 4.042), second (-1.436, 2.760), third (-0.229, 3.401); flash (1.473, 4.079), microphone
//     (1.473, 3.401), LiDAR (1.473, 2.723); Apple logo (0.007, -1.080); Dynamic Island (0, 4.467) on the front.
//   - the finish in the file is burgundy (Apple's 2026 colour).
import React, {useMemo} from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {ContactShadows, useGLTF} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {DEG, Stage3D, Studio, camAt, clamp, drawTexture, hermite, keepAlpha, makeCamera, projectPoint, quadMatrix3d, type CamKey, type Fx, type OrbitKey, type Px, type StudioProps, type V3} from './core';

export const PHONE_MODEL = 'models/iphone-18-pro.glb';

/** Sizes in model units (phone 10 tall). */
export const PHONE = {
  w: 4.786, h: 10, mmPerUnit: 14.996,
  zScreen: -0.455, screenW: 4.435, screenH: 9.648,
  zBackGlass: 0.129, zPlateau: 0.262, zLens: 0.455,
  /** the plane inside the body that `interior` content is laid on (seen from the back) */
  interior: {x0: -2.26, x1: 2.26, y0: -4.86, y1: 4.86, z: -0.16, pxPerUnit: 300},
};

/** Named points in phone space. `chip` is where the A-series package sits in this kit's inside view
 *  (= innardsPoint('soc') of innards.tsx). */
export const PHONE_POINTS = {
  backCentre: [0, 0, 0.13] as V3,
  logo: [0.007, -1.08, 0.13] as V3,
  lensMain: [-1.436, 4.042, 0.455] as V3,
  lens2: [-1.436, 2.76, 0.455] as V3,
  lens3: [-0.229, 3.401, 0.455] as V3,
  flash: [1.473, 4.079, 0.31] as V3,
  mic: [1.473, 3.401, 0.262] as V3,
  lidar: [1.473, 2.723, 0.29] as V3,
  plateauCentre: [0, 3.4, 0.262] as V3,
  screenCentre: [0, 0, -0.455] as V3,
  screenTL: [2.2175, 4.824, -0.455] as V3,
  screenTR: [-2.2175, 4.824, -0.455] as V3,
  screenBR: [-2.2175, -4.824, -0.455] as V3,
  screenBL: [2.2175, -4.824, -0.455] as V3,
  island: [0, 4.467, -0.455] as V3,
  chip: [-0.159, 0.94, -0.16] as V3,
  top: [0, 5, -0.07] as V3,
  bottom: [0, -5, -0.07] as V3,
  usb: [0, -5, -0.163] as V3,
};
export type PhonePoint = keyof typeof PHONE_POINTS;

// ---------------------------------------------------------------------------------------------------------------
// Pose of the phone itself (the lights stay put, so a turning phone drags real reflections across its faces).

export type PoseKey = {t: number; yaw?: number; pitch?: number; roll?: number; pos?: V3; hold?: boolean};
export type Pose = {yaw: number; pitch: number; roll: number; pos: V3};
export const poseAt = (keys: PoseKey[] | undefined, t: number): Pose => {
  if (!keys || !keys.length) return {yaw: 0, pitch: 0, roll: 0, pos: [0, 0, 0]};
  const o = hermite(keys, t, (k) => [k.yaw ?? 0, k.pitch ?? 0, k.roll ?? 0, ...(k.pos ?? [0, 0, 0])]);
  return {yaw: o[0], pitch: o[1], roll: o[2], pos: [o[3], o[4], o[5]]};
};
export const poseMatrix = (p: Pose) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p.pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(p.pitch * DEG, p.yaw * DEG, p.roll * DEG, 'YXZ')), new THREE.Vector3(1, 1, 1));

// ---------------------------------------------------------------------------------------------------------------
// The view: everything 2D code needs to line up with the 3D phone for one frame. Pure maths, no canvas.

export type PhoneViewArgs = {t: number; cam: (CamKey | OrbitKey)[]; pose?: PoseKey[]; W: number; H: number; left?: number; top?: number};

export const phoneView = ({t, cam: camKeys, pose, W, H, left = 0, top = 0}: PhoneViewArgs) => {
  const cam = camAt(camKeys, t);
  const camera = makeCamera(cam, W / H);
  const M = poseMatrix(poseAt(pose, t));
  const world = (p: V3, lift = 0) => new THREE.Vector3(p[0], p[1], p[2] + lift).applyMatrix4(M);
  const px = (p: V3, lift = 0): Px => {
    const q = projectPoint(camera, world(p, lift), W, H);
    return {...q, x: q.x + left, y: q.y + top};
  };
  const nrm = new THREE.Vector3(0, 0, 1).transformDirection(M);
  const toCam = new THREE.Vector3(...cam.pos).sub(world([0, 0, 0]));
  /** > 0 when the back faces the camera, < 0 when the screen does (cosine of the angle) */
  const backFacing = nrm.dot(toCam.normalize());
  /** matrix3d for a wPx x hPx box laid on the rectangle x0..x1, y0..y1 at depth z, seen from `face` (+1 back, -1 front) */
  const planeMatrix = (r: {x0: number; x1: number; y0: number; y1: number; z: number}, wPx: number, hPx: number, face: 1 | -1 = 1, lift = 0) => {
    const [l, rr] = face > 0 ? [r.x0, r.x1] : [r.x1, r.x0];
    return quadMatrix3d(wPx, hPx, [px([l, r.y1, r.z], lift), px([rr, r.y1, r.z], lift), px([rr, r.y0, r.z], lift), px([l, r.y0, r.z], lift)]);
  };
  const I = PHONE.interior;
  return {
    cam, camera, matrix: M, backFacing,
    /** px of a named point (or any phone-space point); `lift` moves it along the phone's normal with a lifted part */
    point: (p: PhonePoint | V3, lift = 0): Px => px(typeof p === 'string' ? PHONE_POINTS[p] : p, lift),
    world,
    planeMatrix,
    /** the live screen: matrix for a wPx x hPx box (see PhoneShot `screen`) */
    screenMatrix: (wPx: number, hPx: number, lift = 0) =>
      planeMatrix({x0: -PHONE.screenW / 2, x1: PHONE.screenW / 2, y0: -PHONE.screenH / 2, y1: PHONE.screenH / 2, z: PHONE.zScreen}, wPx, hPx, -1, -lift),
    /** the inside plane: its px size, its matrix, and px <-> frame conversion for points drawn on it */
    interior: {
      w: (I.x1 - I.x0) * I.pxPerUnit, h: (I.y1 - I.y0) * I.pxPerUnit,
      matrix: (z = I.z) => planeMatrix({...I, z}, (I.x1 - I.x0) * I.pxPerUnit, (I.y1 - I.y0) * I.pxPerUnit, 1),
      /** frame px of a point given in interior px (0,0 = top-left as seen from the back) */
      point: (ix: number, iy: number, z = I.z): Px => px([I.x0 + ix / I.pxPerUnit, I.y1 - iy / I.pxPerUnit, z]),
      /** interior px of a phone-space x, y */
      at: (x: number, y: number): [number, number] => [(x - I.x0) * I.pxPerUnit, (I.y1 - y) * I.pxPerUnit],
    },
  };
};
export type PhoneView = ReturnType<typeof phoneView>;

// ---------------------------------------------------------------------------------------------------------------
// The model, taken apart into groups.
//
// What the GLB holds (found by measuring every mesh; indices are the order three.js traverses them):
//   display   the screen glass with Apple's wallpaper (emissive texture, z -0.455), the black border under it, the
//             Dynamic Island, the front camera
//   frame     the unibody: sides, plateau and the back around the glass (one 13.6 k vertex mesh), buttons, Camera
//             Control, USB-C port, speaker and microphone grilles, antenna bands
//   backGlass the inset glass panel (4.28 x 6.50, y -4.75 .. 1.75) with its metallic under-layer, and the Apple logo
//   camera    three lens stacks (ring, cover glass, coated elements, black barrels), flash, microphone, LiDAR
//   inner     two black filler blocks inside the body (hidden for an inside view)
export type PartGroup = 'display' | 'frame' | 'backGlass' | 'camera' | 'inner';
export type PartState = {
  /** 0 hides the group, 1 shows it */
  opacity?: number;
  /** 0 = the real material, 1 = ghost glass with bright edges (x-ray) */
  glass?: number;
  /** distance moved along the phone's normal, in model units (back parts move out the back, the display out the front) */
  lift?: number;
};
export type Shell = Partial<Record<PartGroup, PartState>>;

/** The usual x-ray. In Apple's model the unibody has a real window behind the back glass panel, so only the glass
 *  panel (with its coloured under-layer and the logo) needs to change: `x` 0..1 turns it to ghost glass with bright
 *  edges, `open` 0..1 lifts it `lift` units off the body. The burgundy unibody, plateau and lenses stay real. Add
 *  `frame: {glass: 1}` yourself for a whole-body ghost. */
export const xrayShell = (x: number, open = 0, lift = 3): Shell => ({
  backGlass: {glass: clamp(x), lift: open * lift},
  inner: {opacity: 1 - clamp(x * 3)},
});

type Part = {
  idx: number; group: PartGroup; mesh: THREE.Mesh; base: THREE.Matrix4; rim: THREE.Mesh; refl: THREE.Mesh;
  mirror?: THREE.Mesh; c: THREE.Vector3; s: THREE.Vector3; isScreen: boolean; mat: THREE.Material; extra?: boolean;
};

const RIM_VERT = 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }';
const RIM_FRAG = 'uniform vec3 uC; uniform vec3 uT; uniform float uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6); float veil = 0.07 * uO; vec3 c = uT * veil + uC * f * 1.6 * uO; gl_FragColor = vec4(c, veil); }';

const lensDeepTexture = () =>
  drawTexture((g) => {
    const grd = g.createRadialGradient(240, 236, 0, 256, 256, 256);
    grd.addColorStop(0, '#1A1F48');
    grd.addColorStop(0.45, '#0F1230');
    grd.addColorStop(0.8, '#07081A');
    grd.addColorStop(1, '#020204');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 512);
    ([[0.9, '#7A6FB8', 0.16], [0.72, '#4F7FA0', 0.12], [0.55, '#7A6FB8', 0.12], [0.36, '#5C6FA8', 0.1], [0.2, '#8A80C8', 0.08]] as [number, string, number][]).forEach(([q, col, al]) => {
      g.strokeStyle = col;
      g.globalAlpha = al;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(256, 256, 256 * q, 0, Math.PI * 2);
      g.stroke();
    });
    // one soft window reflection, upper left, as an arc (never a round hot spot)
    g.globalAlpha = 0.22;
    g.strokeStyle = '#C8D0F0';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(256, 256, 170, Math.PI * 1.08, Math.PI * 1.42);
    g.stroke();
  }, 512);

const classify = (c: THREE.Vector3, s: THREE.Vector3, m: THREE.MeshStandardMaterial): PartGroup => {
  if (c.z < -0.4) return 'display';
  const black = m.color && m.color.r + m.color.g + m.color.b < 0.001;
  if (black && s.x > 4 && s.y > 5) return 'inner';
  if (s.z < 0.06 && s.x > 1 && c.z > 0.05 && c.y < 0) return 'backGlass';
  if (c.z > 0.2 && Math.max(s.x, s.y) < 1.4 && c.y > 2) return 'camera';
  return 'frame';
};

const usePhoneParts = () => {
  const {scene} = useGLTF(staticFile(PHONE_MODEL));
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const dim = box.getSize(new THREE.Vector3());
    const cen = box.getCenter(new THREE.Vector3());
    const k = 10 / Math.max(dim.x, dim.y, dim.z, 1e-6);
    const N = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-cen.x, -cen.y, -cen.z));
    const parts: Part[] = [];
    const mats = new Map<string, THREE.Material>();
    const rimMat = () =>
      new THREE.ShaderMaterial({
        uniforms: {uC: {value: new THREE.Color('#A9CCFF')}, uT: {value: new THREE.Color('#1B2A44')}, uO: {value: 0}},
        vertexShader: RIM_VERT, fragmentShader: RIM_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      });
    const groupRim: Partial<Record<PartGroup, THREE.ShaderMaterial>> = {};
    const groupRefl: Partial<Record<PartGroup, THREE.MeshBasicMaterial>> = {};
    let idx = 0;
    scene.traverse((o) => {
      const src = o as THREE.Mesh;
      if (!src.isMesh) return;
      const m0 = src.material as THREE.MeshStandardMaterial;
      const base = N.clone().multiply(src.matrixWorld);
      if (!src.geometry.boundingBox) src.geometry.computeBoundingBox();
      const bb = src.geometry.boundingBox!.clone().applyMatrix4(base);
      const c = bb.getCenter(new THREE.Vector3());
      const s = bb.getSize(new THREE.Vector3());
      const group = classify(c, s, m0);
      const lens = group === 'camera' && c.x < 0.6;
      const logo = group === 'backGlass' && s.x < 1.5;
      const key = logo ? `logo:${c.z > 0.12 ? 'top' : 'base'}` : `${group}:${m0.uuid}`;
      let mat = mats.get(key);
      if (!mat) {
        const tr = (m0 as THREE.MeshPhysicalMaterial).transmission ?? 0;
        if (lens && tr > 0.5 && m0.roughness < 0.05 && s.x > 0.8) {
          // lens cover glass: Apple's is black + transmission (three.js draws that as a black disc). Dark see-through
          // glass with a sharp clearcoat, so the coated elements under it show and the studio mirrors in it.
          mat = new THREE.MeshPhysicalMaterial({color: '#05060A', roughness: 0.07, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.42, depthWrite: false});
          mat.userData.envK = 2.2;
        } else if (logo) {
          // the Apple logo: polished metal under clear glass (the file's glass + normal map shades it as facets)
          mat = c.z > 0.12
            ? new THREE.MeshPhysicalMaterial({color: '#0A0406', roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.25, depthWrite: false})
            : new THREE.MeshPhysicalMaterial({color: '#4E2630', roughness: 0.22, metalness: 1});
          mat.userData.envK = 0.9;
        } else if (lens && tr > 0.5) {
          // the glass elements inside a lens: coated, deep blue-violet
          mat = new THREE.MeshPhysicalMaterial({color: '#2A1E66', roughness: 0.08, metalness: 0.7, iridescence: 1, iridescenceIOR: 1.6});
          mat.userData.envK = 1.6;
        } else {
          mat = m0.clone();
          const pm = mat as THREE.MeshPhysicalMaterial;
          if (tr > 0) {
            // other glass (back panel over its coloured layer, flash window, button caps): plain see-through glass
            // instead of three.js's transmission pass (an extra scene render per frame, and wrong over an alpha canvas)
            pm.transmission = 0;
            pm.transparent = true;
            pm.opacity = group === 'backGlass' ? 0.2 : 1 - 0.8 * tr;
            pm.depthWrite = false;
          }
          mat.userData.envK = 1;
        }
        mat.userData.o = {transparent: mat.transparent, opacity: mat.opacity, depthWrite: mat.depthWrite};
        mats.set(key, mat);
      }
      const mesh = new THREE.Mesh(src.geometry, mat);
      mesh.matrixAutoUpdate = false;
      mesh.castShadow = group !== 'inner';
      mesh.receiveShadow = true;
      const rim = new THREE.Mesh(src.geometry, (groupRim[group] ??= rimMat()));
      rim.matrixAutoUpdate = false;
      rim.renderOrder = 3;
      const refl = new THREE.Mesh(
        src.geometry,
        (groupRefl[group] ??= keepAlpha(new THREE.MeshBasicMaterial({color: '#000000', reflectivity: 0, combine: THREE.MixOperation, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}))),
      );
      refl.matrixAutoUpdate = false;
      refl.renderOrder = 4;
      const isScreen = group === 'display' && !!(m0 as THREE.MeshStandardMaterial).emissiveMap && s.x > 4;
      parts.push({idx: idx++, group, mesh, base, rim, refl, c, s, isScreen, mat});
    });
    // under each lens cover: the deep element stack as a disc and one coated dome (not an empty black hole)
    const deep = new THREE.MeshBasicMaterial({map: lensDeepTexture(), toneMapped: false});
    const coat = keepAlpha(new THREE.MeshPhysicalMaterial({color: '#000000', roughness: 0.04, iridescence: 1, iridescenceIOR: 1.85, iridescenceThicknessRange: [240, 640], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}));
    coat.userData.envK = 0.5;
    for (const m of [deep, coat]) m.userData.o = {transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite};
    mats.set('lens:deep', deep);
    mats.set('lens:coat', coat);
    const disc = new THREE.CircleGeometry(1, 72);
    const dome = new THREE.SphereGeometry(1, 64, 12, 0, Math.PI * 2, 0, 0.5);
    dome.rotateX(Math.PI / 2);
    dome.translate(0, 0, -Math.cos(0.5));
    const covers = parts.filter((p) => p.group === 'camera' && p.c.x < 0.6 && p.s.z < 0.002 && p.s.x > 0.8 && p.c.z > 0.44);
    for (const cv of covers) {
      const r = Math.min(cv.s.x, cv.s.y) / 2;
      const add = (geo: THREE.BufferGeometry, mat: THREE.Material, z: number, k: number) => {
        const base = new THREE.Matrix4().compose(new THREE.Vector3(cv.c.x, cv.c.y, cv.c.z + z), new THREE.Quaternion(), new THREE.Vector3(r * k, r * k, r * k));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.matrixAutoUpdate = false;
        const none = new THREE.Mesh(geo, mat);
        none.visible = false;
        parts.push({idx: 1000 + parts.length, group: 'camera', mesh, base, rim: none, refl: new THREE.Mesh(geo, mat), c: cv.c.clone(), s: cv.s.clone(), isScreen: false, mat, extra: true});
      };
      add(disc, deep, -0.05, 0.86);
      add(dome, coat, -0.035, 0.8);
    }
    return {parts, mats: [...mats.values()], groupRim, groupRefl};
  }, [scene]);
};
useGLTF.preload(staticFile(PHONE_MODEL));

const LIFT_DIR: Record<PartGroup, number> = {display: -1, frame: 1, backGlass: 1, camera: 1, inner: 1};

export type PhoneModelProps = {
  pose?: Pose;
  shell?: Shell;
  /** true when live content is laid on the screen: the screen glass becomes a window with real reflections */
  liveScreen?: boolean;
  /** how strongly the studio mirrors in the screen glass (live screen only) */
  screenGloss?: number;
  /** draw the upside-down copy for a floor reflection at this floor height */
  mirrorY?: number;
  /** debug: draw only these mesh indices */
  debugOnly?: number[];
  /** environment reflection strength of the phone's own materials */
  envIntensity?: number;
};

export const PhoneModel: React.FC<PhoneModelProps> = ({pose, shell = {}, liveScreen = false, screenGloss = 1, mirrorY, debugOnly, envIntensity = 1.5}) => {
  const model = usePhoneParts();
  const {scene} = useThree();
  const extra = useMemo(() => {
    const punch = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0, blending: THREE.NoBlending});
    const gloss = keepAlpha(new THREE.MeshBasicMaterial({color: '#000000', reflectivity: 0.07, combine: THREE.MixOperation, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}));
    return {punch, gloss};
  }, []);
  const M = poseMatrix(pose ?? {yaw: 0, pitch: 0, roll: 0, pos: [0, 0, 0]});
  const mirrorM = mirrorY === undefined ? null : new THREE.Matrix4().makeTranslation(0, 2 * mirrorY, 0).multiply(new THREE.Matrix4().makeScale(1, -1, 1)).multiply(M);
  // the screen's mirror of the studio reads the scene environment directly
  (extra.gloss as THREE.MeshBasicMaterial).envMap = scene.environment;
  (extra.gloss as THREE.MeshBasicMaterial).reflectivity = 0.07 * screenGloss;
  // per-group state for this frame
  const st = (g: PartGroup) => ({opacity: clamp(shell[g]?.opacity ?? 1), glass: clamp(shell[g]?.glass ?? 0), lift: shell[g]?.lift ?? 0});
  const groups = {display: st('display'), frame: st('frame'), backGlass: st('backGlass'), camera: st('camera'), inner: st('inner')};
  for (const p of model.parts) {
    const g = groups[p.group];
    const solid = g.opacity * (1 - g.glass);
    const ghost = g.opacity * g.glass;
    const only = debugOnly ? debugOnly.includes(p.idx) : true;
    const m = p.mat;
    const o = m.userData.o as {transparent: boolean; opacity: number; depthWrite: boolean};
    const tr = solid < 0.999 || o.transparent;
    if (m.transparent !== tr) m.needsUpdate = true;
    m.transparent = tr;
    m.opacity = o.opacity * solid;
    m.depthWrite = solid < 0.999 ? solid > 0.6 : o.depthWrite;
    if ('envMapIntensity' in m) (m as THREE.MeshStandardMaterial).envMapIntensity = envIntensity * (m.userData.envK ?? 1);
    const local = new THREE.Matrix4().makeTranslation(0, 0, LIFT_DIR[p.group] * g.lift).multiply(p.base);
    p.mesh.matrix.copy(local);
    p.mesh.visible = only && solid > 0.004;
    p.rim.matrix.copy(local);
    p.rim.visible = only && ghost > 0.004 && !p.extra;
    p.refl.matrix.copy(local);
    p.refl.visible = only && ghost > 0.004 && p.group !== 'inner' && !p.extra;
    if (p.isScreen) {
      p.mesh.material = liveScreen ? extra.punch : p.mat;
      p.mesh.renderOrder = liveScreen ? 1 : 0;
      p.refl.material = liveScreen ? extra.gloss : model.groupRefl.display!;
      p.refl.visible = only && (liveScreen ? solid > 0.5 : ghost > 0.004);
      p.refl.renderOrder = liveScreen ? 2 : 4;
    }
    if (mirrorM) {
      if (!p.mirror) {
        p.mirror = new THREE.Mesh(p.mesh.geometry, p.mat);
        p.mirror.matrixAutoUpdate = false;
        p.mirror.renderOrder = -2;
      }
      p.mirror.matrix.copy(local);
      p.mirror.visible = only && solid > 0.5 && !(p.isScreen && liveScreen);
    }
  }
  for (const g of Object.keys(groups) as PartGroup[]) {
    const r = model.groupRim[g];
    if (r) r.uniforms.uO.value = groups[g].opacity * groups[g].glass;
    const f = model.groupRefl[g];
    if (f) {
      // ghost glass mirrors the studio (no lamp highlights: out of focus they turn into white blobs)
      f.envMap = scene.environment;
      f.reflectivity = 0.045 * groups[g].opacity * groups[g].glass;
    }
  }
  const roots = useMemo(() => {
    const main = new THREE.Group();
    const mirror = new THREE.Group();
    main.matrixAutoUpdate = false;
    mirror.matrixAutoUpdate = false;
    for (const p of model.parts) main.add(p.mesh, p.rim, p.refl);
    return {main, mirror};
  }, [model]);
  roots.main.matrix.copy(M);
  roots.main.matrixWorldNeedsUpdate = true;
  if (mirrorM) {
    for (const p of model.parts) if (p.mirror && p.mirror.parent !== roots.mirror) roots.mirror.add(p.mirror);
    roots.mirror.matrix.copy(mirrorM);
    roots.mirror.matrixWorldNeedsUpdate = true;
  }
  roots.main.traverse((o) => { o.matrixWorldNeedsUpdate = true; });
  roots.mirror.traverse((o) => { o.matrixWorldNeedsUpdate = true; });
  return (
    <>
      <primitive object={roots.main} />
      {mirrorM ? <primitive object={roots.mirror} /> : null}
    </>
  );
};

/** The floor under the phone: a soft contact shadow, and (optionally) a faint mirror image fading with distance. */
export const PhoneFloor: React.FC<{y: number; shadow?: number; reflect?: number; at?: V3; size?: number; blur?: number}> = ({y, shadow = 0.6, reflect = 0, at = [0, 0, 0], size = 26, blur = 2.2}) => {
  const fade = useMemo(
    () =>
      drawTexture((g, w, h) => {
        const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        grd.addColorStop(0, 'rgba(255,255,255,0)');
        grd.addColorStop(0.55, 'rgba(255,255,255,0.75)');
        grd.addColorStop(1, 'rgba(255,255,255,1)');
        g.fillStyle = grd;
        g.fillRect(0, 0, w, h);
      }, 256),
    [],
  );
  const eraser = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {uMap: {value: fade}, uK: {value: 0}},
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        // keeps `uK` of what is under the floor near the phone, nothing far away
        fragmentShader: 'uniform sampler2D uMap; uniform float uK; varying vec2 vUv; void main(){ float far = texture2D(uMap, vUv).a; float keep = uK * (1.0 - far); gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - keep); }',
        transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      }),
    [fade],
  );
  eraser.uniforms.uK.value = reflect;
  return (
    <>
      {reflect > 0 ? (
        <mesh position={[at[0], y, at[2]]} rotation-x={-Math.PI / 2} renderOrder={-1} material={eraser}>
          <planeGeometry args={[size * 8, size * 8]} />
        </mesh>
      ) : null}
      {shadow > 0 ? <ContactShadows position={[at[0], y + 0.002, at[2]]} scale={size} far={11} blur={blur} opacity={shadow} resolution={1024} frames={Infinity} color="#000000" /> : null}
    </>
  );
};

// ---------------------------------------------------------------------------------------------------------------

export type PhoneShotProps = {
  /** design frame of the scene (fractional at 60 fps output) */
  t: number;
  W: number; H: number;
  /** camera keys in design frames (all OrbitKey or all CamKey) and, optionally, keys for the phone's own pose */
  cam: (CamKey | OrbitKey)[];
  pose?: PoseKey[];
  shell?: Shell;
  /** live 2D content for the display, drawn in a `screenPx` box (default 402 x 874, iPhone points) */
  screen?: React.ReactNode;
  screenPx?: [number, number];
  screenGloss?: number;
  /** 2D content laid on the inside plane (PHONE.interior), seen from the back when the shell is glass or open */
  interior?: React.ReactNode;
  light?: StudioProps;
  fx?: Fx | false;
  /** floor under the phone: height in model units (the upright phone's foot is y -5), shadow and mirror strength */
  floor?: false | {y?: number; shadow?: number; reflect?: number; blur?: number; size?: number};
  background?: string;
  debugOnly?: number[];
  /** extra three.js nodes in world space (e.g. a prop) */
  children?: React.ReactNode;
};

const SCREEN_SS = 3;

export const PhoneShot: React.FC<PhoneShotProps> = ({t, W, H, cam, pose, shell, screen, screenPx = [402, 874], screenGloss = 1, interior, light, fx, floor = false, background, debugOnly, children}) => {
  const v = phoneView({t, cam, pose, W, H});
  const p = poseAt(pose, t);
  const dispLift = shell?.display?.lift ?? 0;
  const showScreen = !!screen && v.backFacing < -0.02 && (shell?.display?.opacity ?? 1) > 0.5;
  const showInside = !!interior && v.backFacing > 0.02;
  // an inside view lies under the canvas: what is behind it in the phone (display, filler blocks) must not draw
  const sh: Shell = showInside ? {...shell, display: {...shell?.display, opacity: 0}, inner: {...shell?.inner, opacity: 0}} : shell ?? {};
  const fl = floor === false ? null : {y: -5.02, shadow: 0.6, reflect: 0, ...floor};
  const tgt = v.world([0, 0, 0]);
  return (
    <AbsoluteFill>
      {showInside ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: v.interior.w, height: v.interior.h, transformOrigin: '0 0', transform: v.interior.matrix(), overflow: 'hidden', borderRadius: 150, backfaceVisibility: 'hidden'}}>
          {interior}
        </div>
      ) : null}
      {showScreen ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: screenPx[0] * SCREEN_SS, height: screenPx[1] * SCREEN_SS, transformOrigin: '0 0', transform: v.screenMatrix(screenPx[0] * SCREEN_SS, screenPx[1] * SCREEN_SS, dispLift), overflow: 'hidden', background: '#000', borderRadius: screenPx[0] * SCREEN_SS * 0.135}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: screenPx[0], height: screenPx[1], transformOrigin: '0 0', transform: `scale(${SCREEN_SS})`, overflow: 'hidden'}}>{screen}</div>
        </div>
      ) : null}
      <Stage3D t={t} W={W} H={H} cam={v.cam} fx={fx} background={background}>
        <Studio target={[tgt.x, tgt.y, tgt.z]} radius={7} {...light} />
        <PhoneModel pose={p} shell={sh} liveScreen={!!screen} screenGloss={screenGloss} mirrorY={fl && fl.reflect > 0 ? fl.y : undefined} debugOnly={debugOnly} />
        {fl ? <PhoneFloor y={fl.y} shadow={fl.shadow} reflect={fl.reflect} blur={fl.blur} size={fl.size} at={[tgt.x, 0, tgt.z]} /> : null}
        {children}
      </Stage3D>
    </AbsoluteFill>
  );
};
