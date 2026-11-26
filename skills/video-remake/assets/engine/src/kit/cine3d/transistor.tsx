// cine3d transistor v2 (26 Nov 2026): a hero gate-all-around nanosheet transistor in real 3D, built and lit like a
// macro product shot of a technical cut model. It is an ILLUSTRATION of the structure (proportions are stretched so
// every part reads; the scene adds the "illustration" tag). No labels are drawn here: the scene adds them in 2D at
// `fetView(...).point(name)`.
//
//   <Transistor3D t={t} W={W} H={H} cam={CAM} gate={fetSwitch(t, [40, 110])} cut={0.5} />
//   const v = fetView({t, cam: CAM, W, H, cut: 0.5});  v.point('gate')  ->  {x, y}
//
// Axes: x = source -> drain (the way carriers flow), y = up, z = along the gate line. The cut-away removes the +z
// side of the gate stack, so film it from +z. Units are arbitrary (gate pitch FET_CPP = 3.67).
// What is modelled, bottom to top:
//   bulk silicon with a cut front face (layer stack), the sub-fin ridge, shallow-trench-isolation oxide round it
//   nanosheets: thin rounded silicon ribbons that run source -> drain THROUGH the gate
//   gate stack round every sheet: high-k sleeve (thin bright lining), work-function metal, tungsten fill, nitride cap
//   sidewall spacers (frosted glass) with small ceramic inner spacers between the sheets
//   source / drain: faceted epitaxial crystals (seeded, slightly irregular) grown from the sheet ends
//   tapered trench contacts with a liner, vias, and two levels of damascene copper lines at right angles
//   the same device repeated along the fin and in the rows behind (darker, into the depth of field)
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {Stage3D, Studio, camAt, clamp, drawTexture, keepAlpha, makeCamera, mixN, projectPoint, seeded, smooth, type CamKey, type Fx, type OrbitKey, type Px, type StudioProps, type V3} from './core';

// ---- dimensions ------------------------------------------------------------------------------------------------
const TS = 0.17, WS = 2.7, PITCH = 0.56, Y0 = 0.7;        // sheet thickness, width (z), vertical pitch, lowest centre
const LG = 1.35, SP = 0.26, LE = 1.8;                      // gate length, spacer, source/drain length
const TK = 0.035, TWF = 0.08, CAPH = 0.18;                 // high-k sleeve, work-function metal, gate cap
const GZ = 2.4;                                            // gate half-length along z
const STI = 0.3, FIN = 0.36;                               // top of the trench oxide, top of the sub-fin
const XS = LG / 2 + SP;                                    // where source / drain begin
const HW = WS / 2 + TK;                                    // half-width of the sheet tunnel through the gate
export const FET_CPP = LG + 2 * SP + LE;                  // gate-to-gate pitch along x
export const FET_ROW = 6.4;                               // row pitch along z
const sheetY = (i: number) => Y0 + i * PITCH;
const topY = (n: number) => sheetY(n - 1) + TS / 2 + 0.5;
const contactY = (n: number) => topY(n) + 0.38;
const m1Y = (n: number) => contactY(n) + 0.5;
const m2Y = (n: number) => m1Y(n) + 0.72;
const M1Z = [-0.35, -1.2, -2.05];                          // first-metal lines (source, drain, gate), along x
const cutZ = (cut: number) => mixN(GZ, -0.55, clamp(cut)); // everything of the gate stack beyond this z is removed
const ZF = WS / 2 + 0.95;                                   // a line on the oxide in front of the row (scale bar)

/** A gate value for an on / off rhythm: `edges` = design frames where it toggles (it starts off). Each change is
 *  eased over `dur` frames; turning on overshoots briefly (about 1.12) so the glow blooms and settles - never a pop. */
export const fetSwitch = (t: number, edges: number[], dur = 12): number => {
  let v = 0;
  for (let i = 0; i < edges.length; i++) {
    const u = (t - edges[i]) / dur;
    if (u <= 0) break;
    const c = clamp(u);
    v = i % 2 === 0 ? smooth(c) + 0.22 * Math.sin(Math.PI * c) * c : 1 - smooth(c);
  }
  return v;
};

/** Named points (world units) for 2D labels and the scale bar. `cut` places the points that sit on the cut face. */
export const fetPoints = (sheets = 3, cut = 0.5): Record<string, V3> => {
  const yT = topY(sheets), ym = (STI + yT) / 2, zc = cutZ(cut), zf = Math.min(zc, WS / 2);
  const gap = (i: number) => (sheetY(i) + TS / 2 + sheetY(i + 1) - TS / 2) / 2;
  const top = sheetY(sheets - 1) + TS / 2;
  const o: Record<string, V3> = {
    centre: [0, ym, 0],
    gate: [0, yT, -GZ * 0.5],
    gateCap: [0, yT - CAPH / 2, zc],
    cutFace: [0, ym, zc],
    tungsten: [0, sheets > 1 ? gap(0) : top + 0.3, zc],
    workFunction: [LG * 0.2, top + TK + TWF / 2, zc],
    highK: [-LG * 0.22, top + TK / 2, zc],
    spacer: [LG / 2 + SP / 2, yT - 0.3, -GZ * 0.4],
    innerSpacer: [LG / 2 + SP / 2, sheets > 1 ? gap(0) : STI + 0.1, zf],
    sheets: [0, sheetY(Math.floor(sheets / 2)), WS / 2],
    source: [-(XS + LE * 0.5), sheetY(sheets - 1), WS / 2 + 0.3],
    drain: [XS + LE * 0.5, sheetY(sheets - 1), WS / 2 + 0.3],
    contactSource: [-(XS + LE / 2), contactY(sheets), 0.3],
    contactDrain: [XS + LE / 2, contactY(sheets), 0.3],
    via: [-(XS + LE / 2), contactY(sheets) + 0.2, M1Z[0]],
    metal1: [-(XS + LE + 0.5), m1Y(sheets) + 0.13, M1Z[0]],
    metal2: [FET_CPP / 2, m2Y(sheets) + 0.15, -1.6],
    metal: [-(XS + LE + 0.5), m1Y(sheets) + 0.13, M1Z[0]],
    oxide: [XS + LE * 0.5, STI, WS / 2 + 1.1],
    subFin: [-(XS + LE + 0.4), FIN, WS * 0.3],
    substrate: [0, -1.0, 4.0],
    /** two points one gate pitch apart on the oxide in front of the row: draw the scale tick between them */
    pitchA: [0, STI, ZF],
    pitchB: [FET_CPP, STI, ZF],
  };
  for (let i = 0; i < sheets; i++) o[`sheet${i}`] = [0, sheetY(i), WS / 2];
  return o;
};

export type FetViewArgs = {t: number; cam: (CamKey | OrbitKey)[]; W: number; H: number; left?: number; top?: number; sheets?: number; cut?: number};
/** Projection of the transistor's named points (or any world point) for one frame. Pure maths, no canvas. */
export const fetView = ({t, cam: keys, W, H, left = 0, top = 0, sheets = 3, cut = 0.5}: FetViewArgs) => {
  const cam = camAt(keys, t);
  const camera = makeCamera(cam, W / H);
  const pts = fetPoints(sheets, cut);
  return {
    cam, camera,
    point: (p: string | V3): Px => {
      const q = projectPoint(camera, typeof p === 'string' ? pts[p] ?? pts.centre : p, W, H);
      return {...q, x: q.x + left, y: q.y + top};
    },
  };
};

// ---- geometry helpers ------------------------------------------------------------------------------------------
/** Box-projected UVs in world units (so one noise texture has the same grain on every part, whatever its size). */
const worldUV = <G extends THREE.BufferGeometry>(g: G, k = 0.42): G => {
  const p = g.attributes.position as THREE.BufferAttribute, n = g.attributes.normal as THREE.BufferAttribute;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ax >= ay && ax >= az ? [p.getZ(i), p.getY(i)] : ay >= az ? [p.getX(i), p.getZ(i)] : [p.getX(i), p.getY(i)];
    uv[i * 2] = u * k + 0.37;
    uv[i * 2 + 1] = v * k + 0.21;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
};
/** Baked ambient occlusion as vertex colour: darker toward the foot of a part (`lo`..`hi` in the part's own y). */
const bakeAO = <G extends THREE.BufferGeometry>(g: G, lo = -1e9, hi = -1e9, min = 0.5): G => {
  const p = g.attributes.position as THREE.BufferAttribute;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const k = hi > lo ? mixN(min, 1, smooth((p.getY(i) - lo) / (hi - lo))) : 1;
    c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
};
const rbox = (w: number, h: number, d: number, r: number, seg = 3, ao = 0) => {
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d) * 0.45));
  worldUV(g);
  return bakeAO(g, -h / 2, ao > 0 ? -h / 2 + ao : -1e9);
};

/** A faceted epitaxial crystal: a diamond grows from every sheet end and they merge into one column with zig-zag
 *  {111}-like facets. Lofted through a few slightly irregular (seeded) cross-sections, flat-shaded so every facet
 *  takes the light on its own. Runs along +x from 0 to LE, centred on z = 0. */
const epiGeometry = (sheets: number, seed = 5) => {
  const rnd = seeded(seed * 977 + 13);
  const half: [number, number][] = [[WS * 0.36, FIN - 0.04], [WS / 2 + 0.02, FIN + 0.14]];
  for (let i = 0; i < sheets; i++) {
    if (i > 0) half.push([WS / 2 + 0.16, sheetY(i) - PITCH / 2]);
    half.push([WS / 2 + 0.34, sheetY(i)]);
  }
  const yt = sheetY(sheets - 1);
  half.push([WS / 2 + 0.1, yt + 0.24], [WS * 0.2, yt + 0.44]);
  const ring: [number, number][] = [...half, ...half.slice().reverse().map(([z, y]) => [-z, y] as [number, number])];
  const cy = (FIN + yt + 0.44) / 2;
  const secs = [[0, 0.9], [0.12, 1], [0.36, 1.05], [0.64, 1.04], [0.88, 1], [1, 0.8]].map(([s, k]) =>
    ring.map(([z, y]) => new THREE.Vector3(s * LE + (s > 0 && s < 1 ? (rnd() - 0.5) * 0.13 : 0), cy + (y - cy) * (0.94 + 0.06 * k) + (rnd() - 0.5) * 0.05, z * k + (rnd() - 0.5) * 0.1)),
  );
  const tri: number[] = [];
  const push = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => tri.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  const n = ring.length;
  for (let s = 0; s < secs.length - 1; s++) {
    for (let i = 0; i < n; i++) {
      const a = secs[s][i], b = secs[s][(i + 1) % n], c = secs[s + 1][(i + 1) % n], d = secs[s + 1][i];
      push(a, d, c);
      push(a, c, b);
    }
  }
  for (const [s, flip] of [[0, false], [secs.length - 1, true]] as [number, boolean][]) {
    const o = new THREE.Vector3(secs[s][0].x, cy, 0);
    for (let i = 0; i < n; i++) {
      if (flip) push(o, secs[s][i], secs[s][(i + 1) % n]);
      else push(o, secs[s][(i + 1) % n], secs[s][i]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tri), 3));
  g.computeVertexNormals();
  worldUV(g, 0.5);
  return bakeAO(g, FIN - 0.1, FIN + 0.8, 0.45);
};

/** A tapered trench contact (wider at the top), running along z; `grow` makes the slightly larger liner shell. */
const contactGeometry = (h: number, len: number, grow = 0) => {
  const wt = 0.66 + grow * 2, wb = 0.4 + grow * 2;
  const s = new THREE.Shape();
  s.moveTo(-wb / 2, 0); s.lineTo(wb / 2, 0); s.lineTo(wt / 2, h); s.lineTo(-wt / 2, h); s.closePath();
  const bevel = 0.035;
  const g = new THREE.ExtrudeGeometry(s, {depth: len + grow * 2 - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 1});
  g.translate(0, 0, -(len + grow * 2) / 2 + bevel);
  worldUV(g);
  return bakeAO(g, 0, 0.5, 0.55);
};

// ---- textures and materials (made once) -----------------------------------------------------------------------
const useFetLook = (lite: boolean, sheets: number) =>
  useMemo(() => {
    const rnd = seeded(7);
    // fine machining lines: roughness variation on every metal
    const scratch = drawTexture((g, w) => {
      g.fillStyle = '#7C7C7C';
      g.fillRect(0, 0, w, w);
      for (let i = 0; i < 3400; i++) {
        const y = rnd() * w, x = rnd() * w, v = Math.round(70 + rnd() * 120);
        g.strokeStyle = `rgba(${v},${v},${v},${0.14 + rnd() * 0.3})`;
        g.lineWidth = 0.5 + rnd() * 1.2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 40 + rnd() * 240, y + (rnd() - 0.5) * 3);
        g.stroke();
      }
      for (let i = 0; i < 500; i++) {
        const v = Math.round(60 + rnd() * 150);
        g.fillStyle = `rgba(${v},${v},${v},0.35)`;
        g.fillRect(rnd() * w, rnd() * w, 1 + rnd() * 2, 1 + rnd() * 2);
      }
    }, 512, 512, false);
    // micro surface noise: a height map (grain + soft blotches) used as a small bump on every large face
    const micro = drawTexture((g, w) => {
      const im = g.createImageData(w, w);
      for (let i = 0; i < w * w; i++) {
        const v = 128 + (rnd() - 0.5) * 90;
        im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
        im.data[i * 4 + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      for (let i = 0; i < 260; i++) {
        const x = rnd() * w, y = rnd() * w, r = 6 + rnd() * 26, v = rnd() > 0.5 ? 255 : 0;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, `rgba(${v},${v},${v},${0.1 + rnd() * 0.12})`);
        grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
        g.fillStyle = grd;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }, 256, 256, false);
    micro.repeat.set(3, 3);
    // the cut face of the wafer: the layer stack (device layer, wells, bulk) with fine strata
    const strata = drawTexture((g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#4A6088');
      grd.addColorStop(0.1, '#35486B');
      grd.addColorStop(0.105, '#22304D');
      grd.addColorStop(0.34, '#1A2740');
      grd.addColorStop(0.345, '#111A2B');
      grd.addColorStop(1, '#0A101C');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      for (const [y, a] of [[0.012, 0.5], [0.103, 0.34], [0.343, 0.22], [0.62, 0.1]] as [number, number][]) {
        g.fillStyle = `rgba(170,200,255,${a})`;
        g.fillRect(0, y * h, w, 2);
      }
      for (let i = 0; i < 2600; i++) {
        g.fillStyle = `rgba(${rnd() > 0.5 ? '190,215,255' : '0,0,0'},${0.02 + rnd() * 0.05})`;
        g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 26, 1);
      }
    }, 512, 512);
    strata.wrapT = THREE.ClampToEdgeWrapping;
    // glow along a sheet: strongest under the gate, fading into source and drain
    const emis = drawTexture((g, w, h) => {
      const grd = g.createLinearGradient(0, 0, w, 0);
      const k = LG / ((XS + 0.3) * 2);
      grd.addColorStop(0, '#000000');
      grd.addColorStop(0.5 - k * 0.72, '#0A1830');
      grd.addColorStop(0.5 - k * 0.42, '#7FB6F0');
      grd.addColorStop(0.5, '#FFFFFF');
      grd.addColorStop(0.5 + k * 0.42, '#7FB6F0');
      grd.addColorStop(0.5 + k * 0.72, '#0A1830');
      grd.addColorStop(1, '#000000');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    }, 256, 8);
    emis.wrapS = emis.wrapT = THREE.ClampToEdgeWrapping;
    const glow = drawTexture((g) => {
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.28, 'rgba(190,225,255,0.55)');
      grd.addColorStop(1, 'rgba(120,180,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
    }, 128);
    const halo = drawTexture((g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        g.strokeStyle = `rgba(150,215,255,${0.5 - i * 0.09})`;
        g.lineWidth = 3;
        g.beginPath();
        g.roundRect(w * 0.1 - i * 5, h * 0.36 - i * 9, w * 0.8 + i * 10, h * 0.28 + i * 18, 10 + i * 8);
        g.stroke();
      }
    }, 256, 128);
    const aoStrip = drawTexture((g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.3, 'rgba(0,0,0,0.6)');
      grd.addColorStop(0.5, 'rgba(0,0,0,0.85)');
      grd.addColorStop(0.7, 'rgba(0,0,0,0.6)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    }, 8, 128);
    aoStrip.wrapS = aoStrip.wrapT = THREE.ClampToEdgeWrapping;

    const P = THREE.MeshPhysicalMaterial;
    const bump = {bumpMap: micro, bumpScale: 0.018, vertexColors: true};
    const m = {
      silicon: new P({color: '#46546A', metalness: 0.6, roughness: 0.3, roughnessMap: scratch, anisotropy: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 1.25, emissive: new THREE.Color('#4FA3FF'), emissiveMap: emis, emissiveIntensity: 0, vertexColors: true}),
      gate: new P({color: '#A8854F', metalness: 1, roughness: 0.4, roughnessMap: scratch, envMapIntensity: 1.2, emissive: new THREE.Color('#FF8A2C'), emissiveIntensity: 0, ...bump}),
      cap: new P({color: '#1C2434', metalness: 0.25, roughness: 0.42, roughnessMap: scratch, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 1.1, ...bump}),
      spacerGlass: keepAlpha(new P({color: '#8FA9C8', metalness: 0, roughness: 0.3, transparent: true, opacity: 0.3, depthWrite: false, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.12, vertexColors: true})),
      spacerInner: new P({color: '#93A6C0', metalness: 0.05, roughness: 0.5, clearcoat: 0.3, envMapIntensity: 0.9, ...bump}),
      epi: new P({color: '#0F7A6C', metalness: 0.62, roughness: 0.36, roughnessMap: scratch, clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 1.15, ...bump, bumpScale: 0.03}),
      tungsten: new P({color: '#8B94A2', metalness: 1, roughness: 0.5, roughnessMap: scratch, envMapIntensity: 1.1, ...bump}),
      liner: new P({color: '#9A7C48', metalness: 1, roughness: 0.36, roughnessMap: scratch, envMapIntensity: 1.2, ...bump}),
      copper: new P({color: '#CC7A49', metalness: 1, roughness: 0.3, roughnessMap: scratch, envMapIntensity: 1.25, ...bump, bumpScale: 0.012}),
      barrier: new P({color: '#4C4138', metalness: 0.8, roughness: 0.5, envMapIntensity: 0.9, vertexColors: true}),
      oxide: new P({color: '#141E2E', metalness: 0, roughness: 0.2, roughnessMap: scratch, clearcoat: 0.9, clearcoatRoughness: 0.1, envMapIntensity: 1.2, ...bump, bumpScale: 0.01}),
      bulk: new P({color: '#FFFFFF', map: strata, metalness: 0.2, roughness: 0.45, clearcoat: 0.3, envMapIntensity: 0.9}),
      bulkDark: new P({color: '#0A101C', metalness: 0.2, roughness: 0.5}),
      subFin: new P({color: '#4B5B74', metalness: 0.55, roughness: 0.34, envMapIntensity: 1, ...bump}),
      // cut-face materials: polished, each layer its own colour
      csW: new P({color: '#59626F', metalness: 0.85, roughness: 0.45, roughnessMap: scratch, envMapIntensity: 1.1, emissive: new THREE.Color('#39414D'), emissiveIntensity: 0.3}),
      csWF: new P({color: '#D9B062', metalness: 0.8, roughness: 0.4, envMapIntensity: 1.3, emissive: new THREE.Color('#B8862E'), emissiveIntensity: 0.35}),
      csHK: new THREE.MeshBasicMaterial({color: new THREE.Color(0.35, 0.8, 0.95), toneMapped: false}),
      csCap: new P({color: '#2A3447', metalness: 0.2, roughness: 0.4, clearcoat: 0.6, emissive: new THREE.Color('#1A2233'), emissiveIntensity: 0.4}),
      csSpacer: new P({color: '#B4C4D8', metalness: 0, roughness: 0.5, clearcoat: 0.5, envMapIntensity: 1, emissive: new THREE.Color('#5E6C80'), emissiveIntensity: 0.3}),
      csInner: new P({color: '#6F86A6', metalness: 0.05, roughness: 0.5, clearcoat: 0.4, emissive: new THREE.Color('#33445C'), emissiveIntensity: 0.3}),
      csEdge: new THREE.MeshBasicMaterial({color: new THREE.Color(1.5, 1.75, 2.1), toneMapped: false}),
      carrier: keepAlpha(new THREE.MeshBasicMaterial({color: new THREE.Color(2.4, 4.4, 8), map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide})),
      halo: keepAlpha(new THREE.MeshBasicMaterial({color: new THREE.Color(0.6, 1.4, 2.4), map: halo, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide})),
      ao: keepAlpha(new THREE.MeshBasicMaterial({color: '#000000', alphaMap: aoStrip, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2})),
      fieldGlow: new THREE.MeshBasicMaterial({color: '#FFFFFF', toneMapped: false}),
      beam: keepAlpha(new THREE.ShaderMaterial({
        uniforms: {uI: {value: 0}, uC: {value: new THREE.Color('#BFD4FF')}},
        vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz / max(length(mv.xyz), 1e-4); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform float uI; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 1.6); float a = clamp(uI * e * smoothstep(0.0, 0.25, vUv.y) * pow(vUv.y, 0.7), 0.0, 1.0); gl_FragColor = vec4(uC * a, a); }',
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
      })),
    };
    // the neighbours: the same materials, darker, never cut
    const dark = <M extends THREE.MeshPhysicalMaterial>(src: M, k = 0.62): M => {
      const c = src.clone() as M;
      c.color.multiplyScalar(k);
      c.envMapIntensity = src.envMapIntensity * 0.8;
      c.emissiveIntensity = 0;
      return c;
    };
    const n = {
      gate: dark(m.gate), cap: dark(m.cap, 0.8), epi: dark(m.epi), tungsten: dark(m.tungsten, 0.75), liner: dark(m.liner), copper: dark(m.copper, 0.8), barrier: dark(m.barrier),
      spacer: new P({color: '#2E3848', metalness: 0.05, roughness: 0.42, clearcoat: 0.5, envMapIntensity: 0.9, ...bump}),
    };
    // the hero's own row is cut with it (one slice through the whole row); its neighbours are a little darker
    const dim = <M extends THREE.Material & {color: THREE.Color}>(src: M, k = 0.6): M => {
      const c = src.clone() as M;
      c.color.multiplyScalar(k);
      const e = c as unknown as {emissiveIntensity?: number};
      if (e.emissiveIntensity !== undefined) e.emissiveIntensity *= k;
      return c;
    };
    const r = {
      gate: dark(m.gate, 0.6), cap: dark(m.cap, 0.8), silicon: dark(m.silicon, 0.7),
      spacer: new P({color: '#3A4658', metalness: 0.05, roughness: 0.42, clearcoat: 0.5, envMapIntensity: 0.9, ...bump}),
      csW: dim(m.csW, 0.55), csWF: dim(m.csWF, 0.5), csHK: dim(m.csHK, 0.4), csCap: dim(m.csCap), csSpacer: dim(m.csSpacer), csInner: dim(m.csInner), csEdge: dim(m.csEdge, 0.35),
    };

    const seg = lite ? 2 : 4;
    const yT = topY(sheets), yC = contactY(sheets);
    const gateH = yT - CAPH - STI;
    const epiTop = sheetY(sheets - 1) + 0.38;
    const sheet = rbox((XS + 0.3) * 2, TS, WS, TS * 0.44, seg);
    {
      // u runs along the sheet (for the glow gradient), v across it
      const p = sheet.attributes.position as THREE.BufferAttribute, uv = sheet.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / ((XS + 0.3) * 2) + 0.5, p.getZ(i) / WS + 0.5);
      uv.needsUpdate = true;
    }
    const g = {
      sheet,
      gate: rbox(LG, gateH, GZ * 2, 0.05, seg, 0.5),
      cap: rbox(LG + 0.02, CAPH, GZ * 2 + 0.02, 0.05, seg),
      spacer: rbox(SP, yT - STI - 0.05, GZ * 2 - 0.12, 0.05, seg, 0.5),
      inner: rbox(SP - 0.05, PITCH - TS - 0.03, WS + 0.06, 0.04, 2),
      innerLow: rbox(SP - 0.05, Y0 - TS / 2 - STI - 0.02, WS + 0.06, 0.04, 2),
      epi: epiGeometry(sheets),
      contact: contactGeometry(yC - epiTop + 0.14, 1.9),
      contactLiner: contactGeometry(yC - epiTop + 0.1, 1.9, 0.035),
      gateContact: rbox(0.46, yC - yT + 0.54, 0.46, 0.08, seg, 0.3),
      via: rbox(0.3, m1Y(sheets) - yC + 0.05, 0.3, 0.06, 2),
      via2: rbox(0.28, m2Y(sheets) - m1Y(sheets), 0.28, 0.06, 2),
      unit: bakeAO(worldUV(new RoundedBoxGeometry(1, 1, 1, 2, 0.02))),
      plain: new RoundedBoxGeometry(1, 1, 1, 1, 0.004) as THREE.BufferGeometry,
      plane: new THREE.PlaneGeometry(1, 1),
      pill: rbox(0.5, 0.1, 0.5, 0.05, 2),
    };
    return {m, n, r, g, micro, epiTop, gateH};
  }, [lite, sheets]);

type Rect = {x0: number; x1: number; y0: number; y1: number; mat: THREE.Material; o: number};

/** The cross-section drawn on the cut plane: every layer of the gate stack and the spacers as a clean flat face. */
type SectionMats = Record<'csW' | 'csWF' | 'csHK' | 'csCap' | 'csSpacer' | 'csInner' | 'csEdge', THREE.Material>;
const cutSection = (m: SectionMats, sheets: number, through: boolean): Rect[] => {
  const R: Rect[] = [];
  const yT = topY(sheets), yCap = yT - CAPH;
  const add = (x0: number, x1: number, y0: number, y1: number, mat: THREE.Material, o = 0) => {
    if (x1 - x0 > 0.002 && y1 - y0 > 0.002) R.push({x0, x1, y0, y1, mat, o});
  };
  const g0 = -LG / 2, g1 = LG / 2;
  const regions: [number, number, boolean][] = [];
  if (through) {
    let y = STI;
    for (let i = 0; i < sheets; i++) {
      regions.push([y, sheetY(i) - TS / 2, true]);
      y = sheetY(i) + TS / 2;
    }
    regions.push([y, yCap, false]);
  } else regions.push([STI, yCap, false]);
  regions.forEach(([a, b, lined]) => {
    add(g0, g1, a, b, m.csW, 0);
    // the lining of this pocket: high-k against silicon / oxide, work-function metal next to it
    add(g0, g1, a + TK, a + TK + TWF, m.csWF, 1);
    add(g0, g1, a, a + TK, m.csHK, 2);
    if (lined) {
      add(g0, g1, b - TK - TWF, b - TK, m.csWF, 1);
      add(g0, g1, b - TK, b, m.csHK, 2);
    }
    // the same two layers run up the gate's side walls
    add(g0 + TK, g0 + TK + TWF, a, b, m.csWF, 1);
    add(g1 - TK - TWF, g1 - TK, a, b, m.csWF, 1);
    add(g0, g0 + TK, a, b, m.csHK, 2);
    add(g1 - TK, g1, a, b, m.csHK, 2);
  });
  add(g0, g1, yCap, yT, m.csCap, 3);
  for (const sgn of [-1, 1]) {
    const x0 = sgn < 0 ? -XS : LG / 2, x1 = sgn < 0 ? -LG / 2 : XS;
    if (through) {
      let y = STI;
      for (let i = 0; i < sheets; i++) {
        add(x0, x1, y, sheetY(i) - TS / 2, m.csInner, 0);
        y = sheetY(i) + TS / 2;
      }
      add(x0, x1, y, yT - 0.05, m.csSpacer, 0);
    } else add(x0, x1, STI, yT - 0.05, m.csSpacer, 0);
  }
  // a thin bright edge round the whole cut
  const e = 0.016;
  add(-XS, XS, yT - e, yT, m.csEdge, 4);
  add(-XS, -XS + e, STI, yT, m.csEdge, 4);
  add(XS - e, XS, STI, yT, m.csEdge, 4);
  return R;
};

export type FetField = {
  /** cells along x (gates) and along z (rows); odd numbers keep the hero in the middle */
  cols: number; rows: number;
  /** 0..1 how many neighbours are switching (their gate contacts pulse) */
  activity?: number;
  seed?: number;
};

export type TransistorProps = {
  /** design frame: drives the carriers and the field's activity */
  t: number;
  /** 0 = off, 1 = on (use `fetSwitch` for an eased change; values up to about 1.2 are a brief overshoot of the glow) */
  gate?: number;
  /** 0..1 cut-away of the gate stack from the +z side: 0.5 shows the sheets leaving the cut face, 1 is a deep cut */
  cut?: number;
  sheets?: number;
  /** 0..1: contacts, vias and the metal lines (0 hides them for a clear view of the device) */
  metal?: number;
  /** neighbours round the hero so it reads as one device in a fabric: `x` more gates on each side along the fin,
   *  `back` rows behind (default {x: 3, back: 1}; false = a lone device) */
  context?: false | {x?: number; back?: number};
  /** many neighbours for a pull-back (replaces `context`) */
  field?: FetField;
  /** 0..1 faint light cone over the hero */
  haze?: number;
  /** cheaper, simpler build for a small inset: no neighbours, one metal level, fewer carriers */
  lite?: boolean;
};

/** The transistor as three.js nodes (use inside your own Stage3D with `clipping`), or use <Transistor3D>. */
export const TransistorModel: React.FC<TransistorProps> = ({t, gate = 0, cut = 0.5, sheets = 3, metal = 1, context, field, haze = 0.5, lite = false}) => {
  const L = useFetLook(lite, sheets);
  const {m, n, r, g} = L;
  const on = clamp(gate), glowK = clamp(gate, 0, 1.3);
  const yT = topY(sheets), yC = contactY(sheets), yM1 = m1Y(sheets), yM2 = m2Y(sheets);
  const zc = cutZ(cut);
  const cutOn = cut > 0.02 && zc < GZ - 0.03;
  const through = zc < HW;

  // the cut: one plane, on the hero's gate stack only
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  plane.constant = zc;
  const heroMats: THREE.Material[] = [m.gate, m.cap, m.spacerGlass, m.spacerInner];
  const rowMats: THREE.Material[] = [r.gate, r.cap, r.spacer];
  for (const mat of [...heroMats, ...rowMats]) {
    // in a field only the hero is cut (the slice through its whole row would be thousands of tiny faces)
    const want = cutOn && !(field && rowMats.includes(mat)) ? 1 : 0;
    if ((mat.clippingPlanes?.length ?? 0) !== want) mat.needsUpdate = true;
    mat.clippingPlanes = want ? [plane] : null;
    mat.clipShadows = true;
  }
  // the on state: glow in the sheets, the gate metal warm from within, the high-k lining brighter
  m.silicon.emissiveIntensity = 3.4 * glowK;
  m.gate.emissiveIntensity = 0.22 * glowK;
  m.csW.emissive.set('#39414D').lerp(new THREE.Color('#FF8A2C'), 0.5 * clamp(glowK));
  m.csW.emissiveIntensity = 0.3 + 0.5 * glowK;
  m.csWF.emissive.set('#B8862E').lerp(new THREE.Color('#FFB050'), 0.6 * clamp(glowK));
  m.csWF.emissiveIntensity = 0.35 + 0.8 * glowK;
  m.csHK.color.setRGB(0.35 + 1.0 * glowK, 0.8 + 1.6 * glowK, 0.95 + 2.3 * glowK);
  m.halo.opacity = 0.75 * on;
  (m.beam.uniforms.uI as {value: number}).value = 0.05 * haze;

  const section = useMemo(() => cutSection(m, sheets, through), [m, sheets, through]);
  const sectionRow = useMemo(() => cutSection(r, sheets, through), [r, sheets, through]);

  // carriers: fine streaks running source -> drain on the faces of every sheet the cut exposes
  const perSheet = lite ? 16 : 54;
  const carriers = useMemo(() => {
    const im = new THREE.InstancedMesh(g.plane, m.carrier, sheets * perSheet);
    im.frustumCulled = false;
    return im;
  }, [g, m, sheets, perSheet]);
  const halos = useMemo(() => {
    const im = new THREE.InstancedMesh(g.plane, m.halo, sheets);
    im.frustumCulled = false;
    return im;
  }, [g, m, sheets]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  {
    const rnd = seeded(31);
    const x0 = -(XS + 0.25), x1 = XS + 0.25;
    const zOpen = Math.max(-WS / 2 + 0.12, Math.min(zc + 0.1, WS / 2 - 0.12));
    const hasTop = zc < WS / 2 - 0.2;
    let k = 0;
    for (let i = 0; i < sheets; i++) {
      for (let j = 0; j < perSheet; j++) {
        const ph = rnd(), sp = 0.6 + rnd() * 0.5, lane = rnd(), side = !hasTop || rnd() > 0.7, sz = (lite ? 0.085 : 0.05) + rnd() * 0.05, len = 2.2 + rnd() * 3;
        const u = ((((t / 26) * sp + ph) % 1) + 1) % 1;
        const x = mixN(x0, x1, u);
        // brightest under the gate, fading into source and drain
        const under = 0.35 + 0.65 * Math.exp(-Math.pow(x / (LG * 0.75), 2));
        const edge = Math.min(1, u / 0.08, (1 - u) / 0.08);
        if (side) {
          dummy.position.set(x, sheetY(i) + (lane - 0.5) * TS * 0.5, WS / 2 + 0.02);
          dummy.rotation.set(0, 0, 0);
        } else {
          dummy.position.set(x, sheetY(i) + TS / 2 + 0.02, mixN(zOpen, WS / 2 - 0.08, lane));
          dummy.rotation.set(-Math.PI / 2, 0, 0);
        }
        const s = sz * on * edge * under;
        dummy.scale.set(s * len, s * (side ? 0.8 : 1), s);
        dummy.updateMatrix();
        carriers.setMatrixAt(k++, dummy.matrix);
      }
      // field-effect shimmer: faint rings round the sheet where it leaves the cut face
      const sh = 1 + 0.07 * Math.sin(t * 0.55 + i * 2.1);
      dummy.position.set(0, sheetY(i), zc + 0.012);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set((LG + 0.5) * sh, (TS + 0.62) * (2 - sh), 1);
      dummy.updateMatrix();
      halos.setMatrixAt(i, dummy.matrix);
    }
    carriers.instanceMatrix.needsUpdate = true;
    carriers.visible = on > 0.01;
    halos.instanceMatrix.needsUpdate = true;
    halos.visible = on > 0.01 && cutOn && through;
  }

  // ---- the neighbours (instanced; simplified: no cut, no carriers) ----
  const ctx = lite || context === false ? null : {x: 3, back: 1, ...(context ?? {})};
  const range = field
    ? {c0: -(field.cols - 1) / 2, c1: (field.cols - 1) / 2, r0: -(field.rows - 1) / 2, r1: (field.rows - 1) / 2}
    : ctx ? {c0: -ctx.x, c1: ctx.x, r0: -ctx.back, r1: 0} : {c0: 0, c1: 0, r0: 0, r1: 0};
  const levels = lite || field ? 1 : 2;
  const seedF = field?.seed ?? 11;
  const F = useMemo(() => {
    const {c0, c1, r0, r1} = range;
    const cells: [number, number][] = [];
    const epis: [number, number][] = [];
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) if (!(c === 0 && r === 0)) cells.push([c * FET_CPP, r * FET_ROW]);
      for (let b = c0 - 0.5; b <= c1 + 0.5; b++) if (!(r === 0 && Math.abs(b) === 0.5)) epis.push([b * FET_CPP, r * FET_ROW]);
    }
    const mk = (geo: THREE.BufferGeometry, mat: THREE.Material, count: number) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
      im.count = count;
      im.frustumCulled = false;
      im.receiveShadow = true;
      return im;
    };
    const d = new THREE.Object3D();
    const set = (im: THREE.InstancedMesh, i: number, x: number, y: number, z: number) => {
      d.position.set(x, y, z);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
    };
    const rowX = cells.filter(([, z]) => z === 0).map(([x]) => x);
    const off = cells.filter(([, z]) => z !== 0);
    const gates = mk(g.gate, n.gate, off.length);
    const caps = mk(g.cap, n.cap, off.length);
    const spacers = mk(g.spacer, n.spacer, off.length * 2);
    const gatesR = mk(g.gate, r.gate, rowX.length);
    const capsR = mk(g.cap, r.cap, rowX.length);
    const spacersR = mk(g.spacer, r.spacer, rowX.length * 2);
    const sheetsR = mk(g.sheet, r.silicon, rowX.length * sheets);
    rowX.forEach((x, i) => {
      set(gatesR, i, x, STI + L.gateH / 2, 0);
      set(capsR, i, x, yT - CAPH / 2, 0);
      set(spacersR, i * 2, x - LG / 2 - SP / 2, STI + (yT - STI - 0.05) / 2, 0);
      set(spacersR, i * 2 + 1, x + LG / 2 + SP / 2, STI + (yT - STI - 0.05) / 2, 0);
      for (let k = 0; k < sheets; k++) set(sheetsR, i * sheets + k, x, sheetY(k), 0);
    });
    const gContacts = mk(g.gateContact, n.tungsten, cells.length);
    const pulse = mk(g.pill, m.fieldGlow, cells.length);
    off.forEach(([x, z], i) => {
      set(gates, i, x, STI + L.gateH / 2, z);
      set(caps, i, x, yT - CAPH / 2, z);
      set(spacers, i * 2, x - LG / 2 - SP / 2, STI + (yT - STI - 0.05) / 2, z);
      set(spacers, i * 2 + 1, x + LG / 2 + SP / 2, STI + (yT - STI - 0.05) / 2, z);
    });
    cells.forEach(([x, z], i) => {
      set(gContacts, i, x, yT + (yC - yT + 0.54) / 2 - 0.02, z + M1Z[2]);
      set(pulse, i, x, yT + 0.03, z + GZ * 0.45);
    });
    const epiI = mk(g.epi, n.epi, epis.length);
    const contacts = mk(g.contact, n.tungsten, epis.length);
    const liners = mk(g.contactLiner, n.liner, epis.length);
    const vias = mk(g.via, n.tungsten, epis.length);
    epis.forEach(([x, z], i) => {
      set(epiI, i, x - LE / 2, 0, z);
      set(contacts, i, x, L.epiTop - 0.14, z - 0.3);
      set(liners, i, x, L.epiTop - 0.14, z - 0.3);
      set(vias, i, x, (yC + yM1) / 2, z + M1Z[Math.abs(Math.round(x / FET_CPP - 0.5)) % 2]);
    });
    const phases = cells.map((_, i) => seeded(seedF + i * 7919)());
    const xEnd = (c1 + 0.5) * FET_CPP + LE / 2 + 0.5;
    return {
      cells, rowX, gates, caps, spacers, gatesR, capsR, spacersR, sheetsR, gContacts, pulse, epiI, contacts, liners, vias, phases, xEnd,
      rows: Array.from({length: r1 - r0 + 1}, (_, k) => (r0 + k) * FET_ROW),
      cols: Array.from({length: c1 - c0 + 2}, (_, k) => (c0 - 0.5 + k) * FET_CPP),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.c0, range.c1, range.r0, range.r1, seedF, L, sheets]);
  if (field) {
    const col = new THREE.Color();
    const act = clamp(field.activity ?? 0.35);
    F.phases.forEach((ph, i) => {
      const p = ph < act ? Math.pow(Math.max(0, Math.sin((t / 22) * (0.6 + ph * 2.2) + ph * 40)), 3) : 0;
      col.setRGB(0.04 + 2.2 * p, 0.07 + 4.2 * p, 0.12 + 7.2 * p);
      F.pulse.setColorAt(i, col);
    });
    if (F.pulse.instanceColor) F.pulse.instanceColor.needsUpdate = true;
  }

  // the block of wafer everything stands on
  const big = !!field;
  const xEnd = big ? F.xEnd + 130 : F.xEnd;
  const zBack = big ? F.rows[0] - 130 : F.rows[0] - 3.6, zFront = big ? F.rows[F.rows.length - 1] + 130 : 4.0;
  const subW = xEnd * 2, subD = zFront - zBack, subZ = (zFront + zBack) / 2;
  const sh = !lite;
  const lineW = F.xEnd * 2 - 0.3;
  const m2z0 = big ? F.rows[0] - 3 : F.rows[0] - 2.9, m2z1 = big ? F.rows[F.rows.length - 1] + 3 : 0.25;
  const mk = clamp(metal);
  const oxideGeo = useMemo(() => rbox(subW, STI, subD, 0.02, 1), [subW, subD]);
  return (
    <group>
      {/* bulk silicon (cut faces show the layer stack) and the trench oxide on top */}
      <mesh position={[0, -1.3, subZ]} scale={[subW, 2.6, subD]} geometry={g.plain} material={big ? m.bulkDark : [m.bulk, m.bulk, m.bulkDark, m.bulkDark, m.bulk, m.bulk]} receiveShadow />
      <mesh position={[0, STI / 2, subZ]} geometry={oxideGeo} material={m.oxide} receiveShadow />
      {F.rows.map((z) => (
        <React.Fragment key={`row${z}`}>
          {/* sub-fin ridge, and the soft contact shadow of the row on the oxide */}
          <mesh position={[0, FIN / 2, z]} scale={[big ? F.xEnd * 2 : subW - 0.02, FIN, WS * 0.84]} geometry={g.unit} material={m.subFin} receiveShadow />
          <mesh position={[0, STI + 0.004, z]} rotation-x={-Math.PI / 2} scale={[big ? F.xEnd * 2 : subW, GZ * 2 + 2.6, 1]} geometry={g.plane} material={m.ao} renderOrder={1} />
        </React.Fragment>
      ))}
      {/* nanosheets: one ribbon each, through the gate and into source and drain */}
      {Array.from({length: sheets}, (_, i) => (
        <mesh key={`s${i}`} position={[0, sheetY(i), 0]} geometry={g.sheet} material={m.silicon} castShadow={sh} receiveShadow={sh} />
      ))}
      {/* gate stack: metal body, cap, sidewall spacers with the inner spacers between the sheets */}
      <mesh position={[0, STI + L.gateH / 2, 0]} geometry={g.gate} material={m.gate} castShadow={sh} receiveShadow={sh} />
      <mesh position={[0, yT - CAPH / 2, 0]} geometry={g.cap} material={m.cap} castShadow={sh} receiveShadow={sh} />
      {[-1, 1].map((sgn) => (
        <React.Fragment key={`sp${sgn}`}>
          {Array.from({length: sheets}, (_, i) => (
            <mesh key={i} position={[sgn * (LG / 2 + SP / 2), i === 0 ? (STI + Y0 - TS / 2) / 2 : sheetY(i) - PITCH / 2, 0]} geometry={i === 0 ? g.innerLow : g.inner} material={m.spacerInner} castShadow={sh} receiveShadow={sh} />
          ))}
          <mesh position={[sgn * (LG / 2 + SP / 2), STI + (yT - STI - 0.05) / 2, 0]} geometry={g.spacer} material={m.spacerGlass} renderOrder={3} />
        </React.Fragment>
      ))}
      {/* the cut face: the layers of the stack as a clean cross-section with a bright edge */}
      {cutOn ? (
        <group position={[0, 0, zc]}>
          {section.map((r, i) => (
            <mesh key={i} position={[(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0.001 + r.o * 0.0012]} scale={[r.x1 - r.x0, r.y1 - r.y0, 1]} geometry={g.plane} material={r.mat} />
          ))}
        </group>
      ) : null}
      <primitive object={halos} renderOrder={4} />
      {/* source and drain */}
      <mesh position={[-XS - LE, 0, 0]} geometry={g.epi} material={m.epi} castShadow={sh} receiveShadow={sh} />
      <mesh position={[XS, 0, 0]} geometry={g.epi} material={m.epi} castShadow={sh} receiveShadow={sh} />
      <primitive object={carriers} renderOrder={5} />
      {/* contacts, vias and two levels of copper */}
      {mk > 0.01 ? (
        <group position={[0, (1 - mk) * 2.4, 0]}>
          {[-1, 1].map((sgn) => (
            <React.Fragment key={`c${sgn}`}>
              <mesh position={[sgn * (XS + LE / 2), L.epiTop - 0.14, -0.3]} geometry={g.contactLiner} material={m.liner} castShadow={sh} receiveShadow={sh} />
              <mesh position={[sgn * (XS + LE / 2), L.epiTop - 0.14, -0.3]} geometry={g.contact} material={m.tungsten} castShadow={sh} />
              <mesh position={[sgn * (XS + LE / 2), (yC + yM1) / 2, M1Z[sgn < 0 ? 0 : 1]]} geometry={g.via} material={m.tungsten} castShadow={sh} />
            </React.Fragment>
          ))}
          <mesh position={[0, yT + (yC - yT + 0.54) / 2 - 0.02, M1Z[2]]} geometry={g.gateContact} material={m.tungsten} castShadow={sh} />
          {F.rows.map((z) => M1Z.map((dz, k) => (
            <React.Fragment key={`m1-${z}-${k}`}>
              <mesh position={[0, yM1 + 0.13 - 0.03, z + dz]} scale={[lineW, 0.26, 0.44]} geometry={g.unit} material={z === 0 ? m.barrier : n.barrier} />
              <mesh position={[0, yM1 + 0.13, z + dz]} scale={[lineW + 0.01, 0.26, 0.34]} geometry={g.unit} material={z === 0 ? m.copper : n.copper} castShadow={sh && z === 0} receiveShadow={sh} />
            </React.Fragment>
          )))}
          {levels > 1 ? F.cols.map((x, k) => (
            <React.Fragment key={`m2-${k}`}>
              <mesh position={[x, yM2 + 0.15 - 0.03, (m2z0 + m2z1) / 2]} scale={[0.52, 0.3, m2z1 - m2z0]} geometry={g.unit} material={n.barrier} />
              <mesh position={[x, yM2 + 0.15, (m2z0 + m2z1) / 2]} scale={[0.42, 0.3, m2z1 - m2z0 + 0.01]} geometry={g.unit} material={Math.abs(x) < FET_CPP ? m.copper : n.copper} castShadow={sh} />
              {big ? null : F.rows.map((z) => <mesh key={z} position={[x, (yM1 + 0.26 + yM2) / 2, z + M1Z[k % 3]]} geometry={g.via2} material={n.tungsten} />)}
            </React.Fragment>
          )) : null}
        </group>
      ) : null}
      <primitive object={F.gates} />
      <primitive object={F.caps} />
      <primitive object={F.spacers} />
      <primitive object={F.gatesR} />
      <primitive object={F.capsR} />
      <primitive object={F.spacersR} />
      <primitive object={F.sheetsR} />
      {/* the same slice through the hero's neighbours along the fin (not in a field: too many, too small) */}
      {cutOn && !field ? F.rowX.map((x) => (
        <group key={`cs${x}`} position={[x, 0, zc]}>
          {sectionRow.map((q, i) => (
            <mesh key={i} position={[(q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2, 0.001 + q.o * 0.0012]} scale={[q.x1 - q.x0, q.y1 - q.y0, 1]} geometry={g.plane} material={q.mat} />
          ))}
        </group>
      )) : null}
      <primitive object={F.epiI} />
      {mk > 0.01 ? (
        <group position={[0, (1 - mk) * 2.4, 0]}>
          <primitive object={F.liners} />
          <primitive object={F.contacts} />
          <primitive object={F.vias} />
          <primitive object={F.gContacts} />
        </group>
      ) : null}
      {field ? <primitive object={F.pulse} /> : null}
      {/* a faint cone of light from the key side */}
      {haze > 0.01 && !lite && !field ? (
        <mesh position={[-3.2, 6.2, 2.4]} rotation={[0.32, 0, -0.42]} material={m.beam} renderOrder={6}>
          <cylinderGeometry args={[0.5, 6.5, 13, 48, 1, true]} />
        </mesh>
      ) : null}
    </group>
  );
};

export type Transistor3DProps = TransistorProps & {
  /** canvas size and position (a lite inset is a small canvas placed with left / top) */
  W: number; H: number; left?: number; top?: number;
  cam: (CamKey | OrbitKey)[];
  light?: StudioProps;
  fx?: Fx | false;
  /** solid background colour (default transparent) */
  background?: string;
  /** distance fog [colour, near, far]; default: a dark haze that starts just behind the hero so the row recedes
   *  (false = none) */
  fog?: false | [string, number, number];
  style?: React.CSSProperties;
};

export const Transistor3D: React.FC<Transistor3DProps> = ({W, H, left, top, cam, light, fx, background, fog, style, ...model}) => {
  const c = camAt(cam, model.t);
  const lite = !!model.lite;
  const dist = Math.hypot(c.pos[0], c.pos[1] - 1.2, c.pos[2]);
  const fg = fog === false || lite ? null : fog ?? (['#050A14', dist + 3, dist + 30] as [string, number, number]);
  const f: Fx | false = fx === false ? false : {dof: lite ? false : {range: 2.6, blur: 15}, bloom: {threshold: 1.2, intensity: lite ? 0.5 : 0.65, radius: 0.78}, msaa: lite ? 2 : 4, exposure: 1.2, ...fx};
  return (
    <Stage3D t={model.t} W={W} H={H} left={left} top={top} cam={c} fx={f} background={background} shadows={!lite} clipping style={style}>
      {fg ? <fog attach="fog" args={fg} /> : null}
      <Studio target={[0, 1.2, 0]} radius={model.field ? 16 : 10} keyFrom={[-0.55, 0.8, 0.5]} castShadow={!lite} main={0.3} lamp={4} top={0.7} fill={0.6} rim={1.8} {...light} />
      {/* warm kicker from behind on the left: a copper-coloured edge on the far sides */}
      <directionalLight position={[-9, 3.5, -7]} intensity={0.9} color="#FFB070" />
      <TransistorModel {...model} />
    </Stage3D>
  );
};
