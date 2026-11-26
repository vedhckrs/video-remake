// Silicon kit - core (26 Nov 2026). High-detail hardware for macro product shots: a shared projection + lighting
// context (`SiScene`), materials (`SI`), shared SVG defs (specular sweep, environment reflection, grain, brushed
// metal, perforation, solder balls), geometry helpers (`SiPrism`, `SiExtrude`, `SiTop`, `SiText`), the exploded-stack
// helper (`SiStack` / `stackZ`) and the lens layer (`SiLens`: tilt-shift depth of field, vignette, film grain, dust).
//
// Units: PLAN millimetres (x right, y down, z up). `SiScene` wraps the kit's `IsoScene`, so the projection is the
// kit standard (iso.tsx `project`): `tilt` 0 = flat top-down macro, 1 = the kit's 2.5D iso, anything between is a
// 3/4 "product" angle (0.5-0.65 reads best on a 16:9 frame). `u` = px per mm at camera zoom 1.
// Everything is a pure function of its props (seeded - no Math.random, no timers, no CSS animation).
// Performance: static art is batched into a few <path>s / <pattern>s and wrapped in React.memo; only the sweep
// gradient changes when the light moves, so a dense board costs the same on every frame.
import React, {createContext, useContext, useId, useMemo} from 'react';
import {IsoScene, type P2} from './iso';
import {alpha, mix, shade, tint} from './tokens';

// ---- materials ------------------------------------------------------------------------------------------------------
export const SI = {
  mask: '#0A0B0E', maskHi: '#14161B', maskLo: '#050607', trace: '#1D222B', fr4: '#1E1610',
  copper: '#A8643A', copperHi: '#D99A6C', copperLo: '#5A3018',
  gold: '#D6AE52', goldHi: '#FFEBAE', goldLo: '#7A5C1E',
  tin: '#A4ABB3', tinHi: '#EEF1F4', tinLo: '#59616A', solder: '#C5CAD0', solderLo: '#70777F',
  mold: '#16171A', moldHi: '#2A2C31', etch: '#A9AFB6',
  silicon: '#1A2942', siliconHi: '#9DB4D4', siliconLo: '#070B14',
  ceramic: '#B39876', ceramicHi: '#D8C3A3', ceramicLo: '#6F5A40', ferrite: '#74777C', ferriteLo: '#3E4146', resistor: '#131416',
  lcp: '#0D0E10', graphite: '#1C1E23', foam: '#09090A', substrate: '#1D2D27', substrateHi: '#35503F',
  flex: '#0F0E0D', polyimide: '#A85F1F', underfill: '#040405', steel: '#3B4047',
  accent: '#3B8CFF', hot: '#FFB347',
} as const;

// ---- deterministic noise ---------------------------------------------------------------------------------------------
export const siHash = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
/** Seeded generator (mulberry32): `const r = siRng(7); r()` -> 0..1 */
export const siRng = (seed: number) => {
  let a = (Math.floor(seed * 2654435761) >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const n2 = (v: number) => Math.round(v * 100) / 100;
const n3 = (v: number) => Math.round(v * 1000) / 1000;

// ---- projection ------------------------------------------------------------------------------------------------------
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);

/** The kit projection as a matrix: plan mm -> px. Same maths as iso.tsx `project` (PLAN -> ISO lerp by `tilt`). */
export const siView = (u: number, tilt: number) => {
  const a = u * (1 + (COS - 1) * tilt), b = u * SIN * tilt, c = -u * COS * tilt, d = u * (1 + (SIN - 1) * tilt), zk = u * tilt;
  const det = a * d - b * c;
  return {
    u, tilt, a, b, c, d, zk,
    /** screen px (relative to the scene origin) of a plan point */
    P: (x: number, y: number, z = 0): P2 => [a * x + c * y, b * x + d * y - zk * z],
    /** SVG transform that maps plan mm at height z onto the screen: draw top faces inside `<g transform={v.top(z)}>` */
    top: (z = 0) => `matrix(${n3(a)} ${n3(b)} ${n3(c)} ${n3(d)} 0 ${n3(-zk * z)})`,
    /** transform to put INSIDE a top-face group so its content is NOT foreshortened (true circles: balls, glints) */
    round: (x: number, y: number) => `translate(${n3(x)} ${n3(y)}) matrix(${n3((d / det) * u)} ${n3((-b / det) * u)} ${n3((-c / det) * u)} ${n3((a / det) * u)} 0 0)`,
  };
};
export type SiView = ReturnType<typeof siView>;

// ---- light -----------------------------------------------------------------------------------------------------------
export type SiLight = {
  /** plan direction the key light TRAVELS, degrees (0 = +x, 90 = +y). Default -52: from the front-left, so the +y
   *  faces are lit, the +x faces are in shade and shadows fall to the screen right. */
  angle: number;
  /** 0..1 brightness of faces the key light does not reach */
  ambient: number;
  /** position (plan mm, measured along `sweepAngle`) of the travelling specular band; animate it for a light sweep */
  sweep: number;
  /** half-width of the band in mm */
  sweepWidth: number;
  /** direction the band travels, degrees in plan (default -40 = left to right across the screen) */
  sweepAngle: number;
  /** 0..1 strength multiplier of the band */
  sweepGain: number;
  /** centre (plan mm) and radius of the big soft environment reflection (a softbox above the board) */
  envX: number; envY: number; envR: number;
  /** rim-light colour (cool edge light on top-face back edges) and key colour */
  rim: string; key: string;
};
export const SI_LIGHT: SiLight = {angle: -52, ambient: 0.34, sweep: -999, sweepWidth: 7, sweepAngle: -40, sweepGain: 1, envX: 30, envY: 8, envR: 46, rim: '#8FB8FF', key: '#FFF6E8'};

type Ctx = {id: string; v: SiView; light: SiLight; L: [number, number]; px: number; py: number};
const SiCtx = createContext<Ctx | null>(null);
/** Scene context for kit parts: `{id, v (view), light, L (unit light vector), px, py (side-face brightness)}` */
export const useSi = (): Ctx => {
  const c = useContext(SiCtx);
  if (!c) throw new Error('silicon kit parts must be drawn inside <SiScene>');
  return c;
};

/** Sweep position that crosses a plan rectangle while `p` goes 0 -> 1 (use for `SiScene sweep`). */
export const sweepAcross = (p: number, x0: number, y0: number, x1: number, y1: number, light: Partial<SiLight> = {}) => {
  const a = ((light.sweepAngle ?? SI_LIGHT.sweepAngle) * Math.PI) / 180, w = light.sweepWidth ?? SI_LIGHT.sweepWidth;
  const s = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => x * Math.cos(a) + y * Math.sin(a));
  return lerp(Math.min(...s) - w * 1.5, Math.max(...s) + w * 1.5, p);
};

// ---- shared defs -----------------------------------------------------------------------------------------------------
const Sweep: React.FC<{id: string; light: SiLight}> = ({id, light}) => {
  const a = (light.sweepAngle * Math.PI) / 180, cx = Math.cos(a), cy = Math.sin(a), s = light.sweep, w = light.sweepWidth, g = light.sweepGain;
  return (
    <defs>
      <linearGradient id={`${id}-sweep`} gradientUnits="userSpaceOnUse" x1={n2(cx * (s - w))} y1={n2(cy * (s - w))} x2={n2(cx * (s + w))} y2={n2(cy * (s + w))}>
        <stop offset="0" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.36" stopColor="#fff" stopOpacity={0.1 * g} />
        <stop offset="0.5" stopColor="#fff" stopOpacity={0.62 * g} />
        <stop offset="0.58" stopColor="#fff" stopOpacity={0.16 * g} />
        <stop offset="0.8" stopColor="#fff" stopOpacity={0.05 * g} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
};

const Defs = React.memo<{id: string; envX: number; envY: number; envR: number; rim: string}>(({id, envX, envY, envR, rim}) => {
  const r = siRng(41);
  const grain: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const s = 0.018 + r() * 0.04, lightSpeck = r() > 0.42;
    grain.push(<rect key={i} x={n3(r() * 1.6)} y={n3(r() * 1.6)} width={n3(s)} height={n3(s * (0.6 + r()))} fill={lightSpeck ? '#fff' : '#000'} opacity={n2(lightSpeck ? 0.05 + r() * 0.13 : 0.16 + r() * 0.2)} />);
  }
  const brush: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const y = r() * 1.2, len = 1.2 + r() * 3.5, x = r() * 5;
    brush.push(<rect key={i} x={n3(x)} y={n3(y)} width={n3(len)} height={n3(0.03 + r() * 0.035)} fill={r() > 0.5 ? '#fff' : '#000'} opacity={n2(0.05 + r() * 0.09)} />);
  }
  return (
    <defs>
      <radialGradient id={`${id}-env`} gradientUnits="userSpaceOnUse" cx={envX} cy={envY} r={envR}>
        <stop offset="0" stopColor="#fff" stopOpacity={0.5} />
        <stop offset="0.45" stopColor="#fff" stopOpacity={0.16} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-rimenv`} gradientUnits="userSpaceOnUse" cx={envX + envR * 0.9} cy={envY + envR * 0.55} r={envR * 0.9}>
        <stop offset="0" stopColor={rim} stopOpacity={0.4} />
        <stop offset="1" stopColor={rim} stopOpacity={0} />
      </radialGradient>
      {/* side-face ambient occlusion (darker toward the board) */}
      <linearGradient id={`${id}-ao`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity={0} />
        <stop offset="0.55" stopColor="#000" stopOpacity={0.12} />
        <stop offset="1" stopColor="#000" stopOpacity={0.55} />
      </linearGradient>
      <linearGradient id={`${id}-tin`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={SI.tinHi} /><stop offset="0.3" stopColor={SI.tin} /><stop offset="0.62" stopColor={shade(SI.tin, 0.78)} /><stop offset="1" stopColor={SI.tinLo} />
      </linearGradient>
      <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#E6CBAB" /><stop offset="0.4" stopColor="#C9A17B" /><stop offset="1" stopColor="#96704E" />
      </linearGradient>
      <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={tint(SI.steel, 0.3)} /><stop offset="0.5" stopColor={SI.steel} /><stop offset="1" stopColor={shade(SI.steel, 0.55)} />
      </linearGradient>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={SI.goldHi} /><stop offset="0.38" stopColor={SI.gold} /><stop offset="1" stopColor={SI.goldLo} />
      </linearGradient>
      <linearGradient id={`${id}-copper`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={SI.copperHi} /><stop offset="0.45" stopColor={SI.copper} /><stop offset="1" stopColor={SI.copperLo} />
      </linearGradient>
      {/* bare silicon: a mirror - the "sky" gradient is fixed in plan space, so every die reflects a different part */}
      <linearGradient id={`${id}-mirror`} gradientUnits="userSpaceOnUse" x1={envX - envR} y1={envY - envR * 0.6} x2={envX + envR * 1.1} y2={envY + envR}>
        <stop offset="0" stopColor="#8EA3C2" /><stop offset="0.14" stopColor="#5C7499" /><stop offset="0.32" stopColor="#2E4366" />
        <stop offset="0.5" stopColor={SI.silicon} /><stop offset="0.7" stopColor="#101B30" /><stop offset="0.86" stopColor="#2A3F60" /><stop offset="1" stopColor={SI.siliconLo} />
      </linearGradient>
      <radialGradient id={`${id}-ball`} cx="0.36" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.25" stopColor={SI.solder} /><stop offset="0.7" stopColor={SI.solderLo} /><stop offset="1" stopColor="#2A2E33" />
      </radialGradient>
      <radialGradient id={`${id}-goldball`} cx="0.36" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#FFF7D6" /><stop offset="0.3" stopColor={SI.gold} /><stop offset="1" stopColor={SI.goldLo} />
      </radialGradient>
      <pattern id={`${id}-grain`} patternUnits="userSpaceOnUse" width={1.6} height={1.6}>{grain}</pattern>
      <pattern id={`${id}-brush`} patternUnits="userSpaceOnUse" width={5} height={1.2}>{brush}</pattern>
      <pattern id={`${id}-perf`} patternUnits="userSpaceOnUse" width={0.62} height={0.62}>
        <circle cx={0.31} cy={0.31} r={0.17} fill="#050506" />
        <path d="M0.14 0.31 A0.17 0.17 0 0 1 0.48 0.31" fill="none" stroke="#000" strokeWidth={0.05} opacity={0.5} />
        <path d="M0.48 0.33 A0.17 0.17 0 0 1 0.14 0.33" fill="none" stroke="#fff" strokeWidth={0.04} opacity={0.45} />
      </pattern>
      <filter id={`${id}-soft1`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={0.14} /></filter>
      <filter id={`${id}-soft2`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={0.42} /></filter>
      <filter id={`${id}-soft3`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation={1.1} /></filter>
    </defs>
  );
});

// view-dependent defs: solder balls must stay round under the projection
const ViewDefs = React.memo<{id: string; u: number; tilt: number}>(({id, u, tilt}) => {
  const v = siView(u, tilt);
  return (
    <defs>
      {/* BGA balls (0.65 mm pitch), true spheres */}
      <pattern id={`${id}-balls`} patternUnits="userSpaceOnUse" width={0.65} height={0.65}>
        <g transform={v.round(0.325, 0.325)}><circle r={0.21} fill={`url(#${id}-ball)`} /></g>
      </pattern>
      {/* landing pads on the board / substrate (flat ENIG gold) */}
      <pattern id={`${id}-pads`} patternUnits="userSpaceOnUse" width={0.65} height={0.65}>
        <circle cx={0.325} cy={0.325} r={0.17} fill={SI.gold} />
        <circle cx={0.29} cy={0.29} r={0.07} fill={SI.goldHi} opacity={0.8} />
      </pattern>
      {/* micro-bumps (0.3 mm pitch) */}
      <pattern id={`${id}-bumps`} patternUnits="userSpaceOnUse" width={0.3} height={0.3}>
        <circle cx={0.15} cy={0.15} r={0.085} fill={SI.solder} />
        <circle cx={0.13} cy={0.13} r={0.035} fill="#fff" opacity={0.8} />
      </pattern>
    </defs>
  );
});

/** Screen px of a plan point for a scene with this `u`, `tilt` and `origin` (camera anchors, callouts). */
export const siPoint = (u: number, tilt: number, origin: P2, x: number, y: number, z = 0): P2 => {
  const p = siView(u, tilt).P(x, y, z);
  return [origin[0] + p[0], origin[1] + p[1]];
};

/**
 * Root of a silicon-kit drawing: an `IsoScene` (so kit `IsoBox` etc. also work inside) plus the light / material defs.
 * `sweep` (plan mm along the sweep direction) moves the specular band without re-rendering the static art.
 * Give two scenes that are on screen together different `id`s.
 */
export const SiScene: React.FC<{
  width: number; height: number; u: number; origin: P2; tilt?: number; id?: string;
  light?: Partial<SiLight>; sweep?: number; style?: React.CSSProperties; children: React.ReactNode;
}> = ({width, height, u, origin, tilt = 0.58, id, light, sweep, style, children}) => {
  const auto = useId().replace(/[^a-zA-Z0-9]/g, '');
  const sid = id ?? `si${auto}`;
  const key = JSON.stringify(light ?? {});
  const ctx = useMemo<Ctx>(() => {
    const l: SiLight = {...SI_LIGHT, ...(JSON.parse(key) as Partial<SiLight>)};
    const a = (l.angle * Math.PI) / 180, L: [number, number] = [Math.cos(a), Math.sin(a)];
    const face = (nx: number, ny: number) => l.ambient + (1 - l.ambient) * 0.72 * Math.max(0, -(L[0] * nx + L[1] * ny));
    return {id: sid, v: siView(u, tilt), light: l, L, px: face(1, 0), py: face(0, 1)};
  }, [sid, u, tilt, key]);
  const l = ctx.light;
  return (
    <IsoScene width={width} height={height} u={u} origin={origin} tilt={tilt} style={style}>
      <Defs id={sid} envX={l.envX} envY={l.envY} envR={l.envR} rim={l.rim} />
      <ViewDefs id={sid} u={u} tilt={tilt} />
      <Sweep id={sid} light={{...l, sweep: sweep ?? l.sweep}} />
      <SiCtx.Provider value={ctx}>{children}</SiCtx.Provider>
    </IsoScene>
  );
};

// ---- geometry --------------------------------------------------------------------------------------------------------
const poly = (ps: P2[]) => ps.map((p) => `${n2(p[0])},${n2(p[1])}`).join(' ');
export const siPath = (ps: P2[]) => `M${ps.map((p) => `${n2(p[0])} ${n2(p[1])}`).join('L')}Z`;
/** rounded rect as a path (batch many into one `d`) */
export const rr = (x: number, y: number, w: number, h: number, r = 0) => {
  const q = Math.min(r, w / 2, h / 2);
  if (q <= 0.001) return `M${n3(x)} ${n3(y)}h${n3(w)}v${n3(h)}h${n3(-w)}Z`;
  return `M${n3(x + q)} ${n3(y)}h${n3(w - 2 * q)}a${n3(q)} ${n3(q)} 0 0 1 ${n3(q)} ${n3(q)}v${n3(h - 2 * q)}a${n3(q)} ${n3(q)} 0 0 1 ${n3(-q)} ${n3(q)}h${n3(-(w - 2 * q))}a${n3(q)} ${n3(q)} 0 0 1 ${n3(-q)} ${n3(-q)}v${n3(-(h - 2 * q))}a${n3(q)} ${n3(q)} 0 0 1 ${n3(q)} ${n3(-q)}Z`;
};
/** circle as a path (batch many into one `d`) */
export const dot = (cx: number, cy: number, r: number) => `M${n3(cx - r)} ${n3(cy)}a${n3(r)} ${n3(r)} 0 1 0 ${n3(2 * r)} 0a${n3(r)} ${n3(r)} 0 1 0 ${n3(-2 * r)} 0Z`;

/** Group whose children are drawn in plan mm on the plane z (top faces, board art, shadows). */
export const SiTop: React.FC<{z?: number; opacity?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({z = 0, opacity, children, style}) => {
  const {v} = useSi();
  return <g transform={v.top(z)} opacity={opacity} style={style}>{children}</g>;
};

/** The two visible side faces of a box (+y = front-left, +x = front-right), lit by the scene light, with AO. */
export const SiPrism: React.FC<{
  x: number; y: number; w: number; d: number; z?: number; h: number; color: string;
  /** override face colours (already lit) */
  front?: string; side?: string; ao?: boolean; opacity?: number;
  /** thin lighter line where the faces meet the top (0..1) */
  edge?: number;
}> = ({x, y, w, d, z = 0, h, color, front, side, ao = true, opacity, edge = 0.16}) => {
  const {v, id, px, py} = useSi();
  if (v.tilt < 0.02 || h <= 0) return null;
  const F = [v.P(x, y + d, z + h), v.P(x + w, y + d, z + h), v.P(x + w, y + d, z), v.P(x, y + d, z)];
  const S = [v.P(x + w, y, z + h), v.P(x + w, y + d, z + h), v.P(x + w, y + d, z), v.P(x + w, y, z)];
  return (
    <g opacity={opacity}>
      <polygon points={poly(F)} fill={front ?? shade(color, py)} />
      <polygon points={poly(S)} fill={side ?? shade(color, px)} />
      {ao ? <polygon points={poly(F)} fill={`url(#${id}-ao)`} /> : null}
      {ao ? <polygon points={poly(S)} fill={`url(#${id}-ao)`} /> : null}
      {edge > 0 ? <polyline points={poly([F[0], F[1], S[0]])} fill="none" stroke="#fff" strokeOpacity={edge} strokeWidth={Math.max(0.7, v.u * 0.022)} strokeLinejoin="round" /> : null}
    </g>
  );
};

/** Side faces of an extruded plan polygon (clockwise on screen = x right, y down order: outward normal on the left). */
export const SiExtrude: React.FC<{pts: P2[]; z?: number; h: number; color: string; bands?: {at: number; color: string; w: number}[]}> = ({pts, z = 0, h, color, bands}) => {
  const {v, light, L} = useSi();
  if (v.tilt < 0.02) return null;
  const faces: {d: string; k: number}[] = [];
  const lines: string[][] = (bands ?? []).map(() => []);
  // signed area -> orientation
  let area = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    area += p[0] * q[1] - q[0] * p[1];
  });
  const sgn = area > 0 ? 1 : -1;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const ex = q[0] - p[0], ey = q[1] - p[1], len = Math.hypot(ex, ey) || 1;
    const nx = (ey / len) * sgn, ny = (-ex / len) * sgn;   // outward normal
    if (nx + ny <= 0.02) return;                             // faces away from the viewer
    const k = light.ambient + (1 - light.ambient) * 0.72 * Math.max(0, -(L[0] * nx + L[1] * ny));
    faces.push({d: siPath([v.P(p[0], p[1], z + h), v.P(q[0], q[1], z + h), v.P(q[0], q[1], z), v.P(p[0], p[1], z)]), k});
    (bands ?? []).forEach((b, bi) => {
      const a = v.P(p[0], p[1], z + h * b.at), c = v.P(q[0], q[1], z + h * b.at);
      lines[bi].push(`M${n2(a[0])} ${n2(a[1])}L${n2(c[0])} ${n2(c[1])}`);
    });
  });
  // group faces by brightness (few distinct normals)
  const byK = new Map<string, string[]>();
  faces.forEach((f) => {
    const key = f.k.toFixed(2);
    byK.set(key, [...(byK.get(key) ?? []), f.d]);
  });
  return (
    <g>
      {[...byK.entries()].map(([k, ds]) => <path key={k} d={ds.join('')} fill={shade(color, parseFloat(k))} />)}
      {(bands ?? []).map((b, bi) => <path key={bi} d={lines[bi].join('')} fill="none" stroke={b.color} strokeWidth={Math.max(0.6, b.w * v.zk)} strokeLinecap="butt" />)}
    </g>
  );
};

/** Text in plan mm (drawn at font-size 100 and scaled, so tiny sizes stay crisp). `size` = cap/em height in mm. */
export const SiText: React.FC<{
  x: number; y: number; size: number; children: string; fill?: string; opacity?: number; anchor?: 'start' | 'middle' | 'end';
  font?: string; weight?: number; spacing?: number; rot?: number;
}> = ({x, y, size, children, fill = SI.etch, opacity, anchor = 'middle', font = 'JetBrains Mono, monospace', weight = 600, spacing = 4, rot = 0}) => (
  <text transform={`translate(${n3(x)} ${n3(y)}) rotate(${rot}) scale(${n3(size / 100)})`} fontSize={100} fontFamily={font} fontWeight={weight}
        letterSpacing={spacing} textAnchor={anchor} fill={fill} opacity={opacity}>{children}</text>
);

/** Soft emissive halo on the plane z (active parts). Screen-blended. */
export const SiGlow: React.FC<{x: number; y: number; r: number; z?: number; color?: string; strength?: number}> = ({x, y, r, z = 0, color = SI.accent, strength = 0.6}) => {
  const {v} = useSi();
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (strength <= 0.003) return null;
  return (
    <g transform={v.top(z)} style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`gw${gid}`}>
          <stop offset="0" stopColor={color} stopOpacity={0.85 * strength} />
          <stop offset="0.4" stopColor={color} stopOpacity={0.3 * strength} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#gw${gid})`} />
    </g>
  );
};

// ---- exploded stack --------------------------------------------------------------------------------------------------
export type SiLayer = {
  id: string;
  /** thickness in mm */
  h: number;
  /** extra gap ABOVE this layer when fully spread (mm) */
  gap?: number;
};
/** z of every layer's underside for a stack that starts at `z0`: closed at spread 0, separated at 1 (spring-ready:
 *  spread may overshoot). Returns `{[id]: z}` plus `top` (z of the stack's top). */
export const stackZ = (layers: SiLayer[], spread: number, z0 = 0): Record<string, number> & {top: number} => {
  const out: Record<string, number> = {};
  let z = z0;
  for (const l of layers) {
    out[l.id] = z;
    z += l.h + (l.gap ?? 1) * spread;
  }
  return {...out, top: z} as Record<string, number> & {top: number};
};
/**
 * Exploded stack helper: children are drawn bottom-up, each gets its z.
 * `<SiStack layers={[{id:'balls',h:.3,gap:2},{id:'sub',h:.4,gap:2}]} spread={s}>{(z) => <>...use z.balls, z.sub...</>}</SiStack>`
 */
export const SiStack: React.FC<{layers: SiLayer[]; spread: number; z?: number; children: (z: Record<string, number> & {top: number}) => React.ReactNode}> = ({layers, spread, z = 0, children}) => (
  <>{children(stackZ(layers, spread, z))}</>
);

// ---- lens (screen space; put it OVER the art: in a World `Overlay`, or after a NanoZoom) -----------------------------
const GRAIN_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='11' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0.9 0.9 0.9 0 -0.85'/></filter><rect width='256' height='256' filter='url(#n)'/></svg>",
)}")`;

/**
 * Lens layer: fake depth of field (tilt-shift - progressive blur toward the far/top and near/bottom edges), vignette,
 * film grain and out-of-focus dust. All screen space, deterministic in `t` (design frames).
 * `focus` = [top, bottom] of the SHARP band as fractions of the height; `blur` = px at the frame edge (0 = off).
 */
export const SiLens: React.FC<{
  W: number; H: number; t?: number; focus?: [number, number]; blur?: number; near?: number;
  vignette?: number; grain?: number; dust?: number; dustColor?: string; tint?: string; seed?: number;
}> = ({W, H, t = 0, focus = [0.3, 0.72], blur = 7, near, vignette = 0.55, grain = 0.5, dust = 14, dustColor = '#BFD6FF', tint: glow, seed = 3}) => {
  const [f0, f1] = focus;
  const nb = near ?? blur * 0.75;
  const band = (dir: 'up' | 'down', from: number, to: number, px: number, key: string) => {
    // blur grows from `from` (sharp side) to `to` (frame edge)
    const top = Math.min(from, to) * H, h = Math.abs(to - from) * H;
    if (px <= 0.2 || h < 2) return null;
    const m = `linear-gradient(${dir === 'up' ? 'to top' : 'to bottom'}, transparent 0%, black 100%)`;
    return <div key={key} style={{position: 'absolute', left: 0, width: W, top, height: h, backdropFilter: `blur(${px.toFixed(2)}px)`, WebkitBackdropFilter: `blur(${px.toFixed(2)}px)`, WebkitMaskImage: m, maskImage: m}} />;
  };
  const motes: React.ReactNode[] = [];
  for (let i = 0; i < dust; i++) {
    const big = siHash(seed + i * 3.7) > 0.72;
    const r0 = big ? 26 + siHash(seed + i * 1.3) * 60 : 2 + siHash(seed + i * 1.3) * 5;
    const sx = (siHash(seed + i * 5.1) * 1.2 - 0.1) * W + Math.sin(t / (70 + i * 9) + i) * 26 + t * (siHash(i + seed) - 0.5) * 0.25;
    const sy = (siHash(seed + i * 8.3) * 1.2 - 0.1) * H + Math.cos(t / (90 + i * 7) + i * 2) * 18 - t * 0.12 * (0.3 + siHash(i * 2 + seed));
    const o = big ? 0.035 + siHash(seed + i) * 0.05 : 0.16 + siHash(seed + i) * 0.3;
    motes.push(
      <div key={i} style={{position: 'absolute', left: sx - r0, top: sy - r0, width: r0 * 2, height: r0 * 2, borderRadius: '50%', opacity: o,
                           background: big ? `radial-gradient(circle, ${alpha(dustColor, 0.5)} 0%, ${alpha(dustColor, 0.55)} 62%, ${alpha(dustColor, 0.9)} 70%, transparent 74%)`
                                           : `radial-gradient(circle, ${dustColor} 0%, ${alpha(dustColor, 0.3)} 50%, transparent 72%)`}} />,
    );
  }
  const gx = Math.floor(siHash(Math.round(t * 2) * 1.37 + 1) * 256), gy = Math.floor(siHash(Math.round(t * 2) * 2.11 + 5) * 256);
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden'}}>
      {/* far (top) and near (bottom): two stacked passes each = progressive blur */}
      {band('up', f0, 0, blur * 0.45, 'f1')}
      {band('up', f0 * 0.55, 0, blur, 'f2')}
      {band('down', f1, 1, nb * 0.45, 'n1')}
      {band('down', f1 + (1 - f1) * 0.45, 1, nb, 'n2')}
      {glow ? <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', background: `radial-gradient(ellipse 60% 55% at 30% 18%, ${alpha(glow, 0.2)}, transparent 70%)`}} /> : null}
      {motes.length ? <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>{motes}</div> : null}
      {vignette > 0 ? <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 78% 74% at 50% 48%, transparent 48%, rgba(0,0,0,${(0.55 * vignette).toFixed(3)}) 82%, rgba(0,0,0,${(0.9 * vignette).toFixed(3)}) 100%)`}} /> : null}
      {grain > 0 ? <div style={{position: 'absolute', inset: 0, backgroundImage: GRAIN_URL, backgroundPosition: `${gx}px ${gy}px`, opacity: 0.5 * grain, mixBlendMode: 'overlay'}} /> : null}
    </div>
  );
};

export {alpha, mix, shade, tint};
export type {P2};
