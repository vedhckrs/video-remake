// 2.5D object kit: flat SVG drawn to read as 3D (no 3D engine). One projection standard per video.
//   ISO : sx = (x - y) cos30 * u,  sy = (x + y) sin30 * u - z * u      (depth sort: x + y, then z)
//   PLAN: sx = x * u,              sy = y * u                           (top-down)
//   `tilt` 0..1 lerps every point PLAN -> ISO and scales extrusion with it ("plan view tilts into 3D").
// Draw back to front: objects with a smaller x + y first. World units are arbitrary; IsoScene sets px/unit.
import React, {createContext, useContext, useId} from 'react';
import {C, type Mode, alpha, faces, shade, tint} from './tokens';

type Ctx = {u: number; tilt: number; mode: Mode};
const IsoCtx = createContext<Ctx>({u: 10, tilt: 1, mode: 'dark'});
export const useIso = () => useContext(IsoCtx);

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);

export type P3 = [number, number, number];
export type P2 = [number, number];

export const project = (p: P3, c: Ctx): P2 => {
  const [x, y, z] = p;
  const ix = (x - y) * COS, iy = (x + y) * SIN - z;
  const px = x, py = y;
  const t = c.tilt;
  return [(px + (ix - px) * t) * c.u, (py + (iy - py) * t) * c.u];
};

const pts = (ps: P3[], c: Ctx) => ps.map((p) => project(p, c).map((v) => v.toFixed(2)).join(',')).join(' ');

/** SVG root for a 2.5D stage. `origin` = where world (0,0,0) lands, in px of this svg. */
export const IsoScene: React.FC<{
  width: number; height: number; u: number; origin: P2; tilt?: number; mode?: Mode;
  style?: React.CSSProperties; children: React.ReactNode;
}> = ({width, height, u, origin, tilt = 1, mode = 'dark', style, children}) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
    <IsoCtx.Provider value={{u, tilt, mode}}>
      <g transform={`translate(${origin[0]},${origin[1]})`}>{children}</g>
    </IsoCtx.Provider>
  </svg>
);

/** Screen position of a world point (for callouts / HTML overlays). Add IsoScene's origin yourself. */
export const useProject = () => {
  const c = useIso();
  return (p: P3) => project(p, c);
};

/** Maps a flat content box (cw x ch, y down) onto a world parallelogram: origin o, edge a (x dir), edge b (y dir). */
export const faceMatrix = (o: P3, a: P3, b: P3, cw: number, ch: number, c: Ctx) => {
  const O = project(o, c), A = project(a, c), B = project(b, c);
  return `matrix(${(A[0] - O[0]) / cw},${(A[1] - O[1]) / cw},${(B[0] - O[0]) / ch},${(B[1] - O[1]) / ch},${O[0]},${O[1]})`;
};

export const OnFace: React.FC<{o: P3; a: P3; b: P3; cw: number; ch: number; opacity?: number; children: React.ReactNode}> = ({
  o, a, b, cw, ch, opacity = 1, children,
}) => {
  const c = useIso();
  return <g transform={faceMatrix(o, a, b, cw, ch, c)} opacity={opacity}>{children}</g>;
};

// ---- shadows, glow, sheen ----------------------------------------------------------------------------

/** Blurred ellipse under a footprint. `lift` (world units) grows offset+blur and fades it (hovering items). */
export const ContactShadow: React.FC<{x: number; y: number; w: number; d: number; lift?: number; strength?: number}> = ({
  x, y, w, d, lift = 0, strength,
}) => {
  const c = useIso();
  const id = useId().replace(/:/g, '');
  const [cx, cy] = project([x + w / 2, y + d / 2, 0], c);
  const rx = ((w + d) / 2) * COS * c.u * 1.05 * (1 + lift * 0.04);
  const ry = Math.max(rx * (0.25 + 0.33 * c.tilt) * 0.9, 2);
  const base = strength ?? (c.mode === 'dark' ? 0.55 : 0.14);
  const blur = (8 + lift * 1.6) * (c.u / 10);
  return (
    <g>
      <defs>
        <filter id={`cs${id}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={blur} /></filter>
      </defs>
      <ellipse cx={cx + lift * c.u * 0.15} cy={cy + lift * c.u * 0.25} rx={rx} ry={ry} fill={`rgba(0,0,0,${base / (1 + lift * 0.08)})`}
               filter={`url(#cs${id})`} />
    </g>
  );
};

/** Soft screen-blend glow behind emissive parts. */
export const Glow: React.FC<{cx: number; cy: number; r: number; color: string; strength?: number}> = ({cx, cy, r, color, strength = 0.6}) => {
  const id = useId().replace(/:/g, '');
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`gl${id}`}>
          <stop offset="0" stopColor={color} stopOpacity={strength} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#gl${id})`} />
    </g>
  );
};

// ---- IsoBox: the base primitive -------------------------------------------------------------------------

export type BoxProps = {
  x?: number; y?: number; z?: number; w: number; d: number; h: number;
  color: string;
  /** override faces (e.g. metal gradient ids) */
  top?: string; left?: string; right?: string;
  shadow?: boolean | number;   // contact shadow (number = strength)
  ao?: boolean;                // ambient occlusion on the side faces
  edge?: boolean;              // 1.5 px highlight on the top front edges
  opacity?: number;
  glass?: number;              // 0..1 x-ray: faces become glass (12-15 % white + white stroke)
  topContent?: {cw: number; ch: number; node: React.ReactNode};   // drawn on the top face
  frontContent?: {cw: number; ch: number; node: React.ReactNode}; // drawn on the +y (left) face
  sideContent?: {cw: number; ch: number; node: React.ReactNode};  // drawn on the +x (right) face
  emissive?: string;           // glow colour
  /** 0..1 glossy specular band across the top face (epoxy, metal, gold, glass) */
  gloss?: number;
  /** lighting gradients on every face (default on): light from the top-left, darker toward the front/bottom */
  lit?: boolean;
  /** 0..1 strength of the face gradients (metal/gold ~0.9, plastic ~0.5) */
  sheen?: number;
};

export const IsoBox: React.FC<BoxProps> = ({
  x = 0, y = 0, z = 0, w, d, h, color, top, left, right, shadow = false, ao = true, edge = true, opacity = 1, glass = 0,
  topContent, frontContent, sideContent, emissive, gloss = 0, lit = true, sheen = 0.55,
}) => {
  const c = useIso();
  const id = useId().replace(/:/g, '');
  const f = faces(color, c.mode);
  const T: P3[] = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
  const R: P3[] = [[x + w, y, z + h], [x + w, y + d, z + h], [x + w, y + d, z], [x + w, y, z]];
  const L: P3[] = [[x, y + d, z + h], [x + w, y + d, z + h], [x + w, y + d, z], [x, y + d, z]];
  const g = glass;
  const fillOf = (col: string) => (g > 0 ? alpha(col, 1 - g * 0.87) : col);
  const glassStroke = g > 0 ? {stroke: `rgba(255,255,255,${0.6 * g})`, strokeWidth: 2 * (c.u / 10)} : {};
  // AO gradients: from each side face's bottom edge to 15 % up
  const aoGrad = (bot: P3, topP: P3, gid: string) => {
    const [x1, y1] = project(bot, c), [x2, y2] = project(topP, c);
    return (
      <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
        <stop offset="0" stopColor="#000" stopOpacity={c.mode === 'dark' ? 0.45 : 0.22} />
        <stop offset="0.18" stopColor="#000" stopOpacity={0} />
      </linearGradient>
    );
  };
  const showSides = c.tilt > 0.02 && h > 0;
  const center = project([x + w / 2, y + d / 2, z + h], c);
  return (
    <g opacity={opacity}>
      {emissive ? <Glow cx={center[0]} cy={center[1]} r={(w + d) * c.u * 0.9} color={emissive} /> : null}
      {shadow && z <= 0.01 ? <ContactShadow x={x} y={y} w={w} d={d} strength={typeof shadow === 'number' ? shadow : undefined} /> : null}
      {shadow && z > 0.01 ? <ContactShadow x={x} y={y} w={w} d={d} lift={z} strength={typeof shadow === 'number' ? shadow : undefined} /> : null}
      <defs>
        {ao ? aoGrad([x + w / 2, y + d, z], [x + w / 2, y + d, z + h], `aoL${id}`) : null}
        {ao ? aoGrad([x + w, y + d / 2, z], [x + w, y + d / 2, z + h], `aoR${id}`) : null}
        {lit ? (() => {
          const g2 = (gid: string, a: P3, b: P3, c0: string, k0: number, k1: number) => {
            const [x1, y1] = project(a, c), [x2, y2] = project(b, c);
            return (
              <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                <stop offset="0" stopColor={tint(c0, k0 * sheen)} />
                <stop offset="0.55" stopColor={c0} />
                <stop offset="1" stopColor={shade(c0, 1 - k1 * sheen)} />
              </linearGradient>
            );
          };
          return [
            g2(`lt${id}`, T[0], T[2], top ?? f.top, 0.32, 0.22),
            g2(`ll${id}`, L[0], L[3], left ?? f.left, 0.12, 0.35),
            g2(`lr${id}`, R[0], R[3], right ?? f.right, 0.1, 0.4),
          ];
        })() : null}
        {gloss > 0 ? (
          <linearGradient id={`gs${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.18" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.32" stopColor="#fff" stopOpacity={0.22 * gloss} />
            <stop offset="0.38" stopColor="#fff" stopOpacity={0.05 * gloss} />
            <stop offset="0.62" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.7" stopColor="#fff" stopOpacity={0.1 * gloss} />
            <stop offset="0.76" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        ) : null}
      </defs>
      {showSides ? (
        <>
          <polygon points={pts(L, c)} fill={g > 0 || !lit ? fillOf(left ?? f.left) : `url(#ll${id})`} {...glassStroke} />
          {ao && !g ? <polygon points={pts(L, c)} fill={`url(#aoL${id})`} /> : null}
          {frontContent ? (
            <OnFace o={L[0]} a={L[1]} b={L[3]} cw={frontContent.cw} ch={frontContent.ch}>{frontContent.node}</OnFace>
          ) : null}
          <polygon points={pts(R, c)} fill={g > 0 || !lit ? fillOf(right ?? f.right) : `url(#lr${id})`} {...glassStroke} />
          {ao && !g ? <polygon points={pts(R, c)} fill={`url(#aoR${id})`} /> : null}
          {sideContent ? (
            <OnFace o={R[1]} a={R[0]} b={R[2]} cw={sideContent.cw} ch={sideContent.ch}>{sideContent.node}</OnFace>
          ) : null}
        </>
      ) : null}
      <polygon points={pts(T, c)} fill={g > 0 || !lit ? fillOf(top ?? f.top) : `url(#lt${id})`} {...glassStroke} />
      {topContent ? <OnFace o={T[0]} a={T[1]} b={T[3]} cw={topContent.cw} ch={topContent.ch}>{topContent.node}</OnFace> : null}
      {gloss > 0 && !g ? (
        <OnFace o={T[0]} a={T[1]} b={T[3]} cw={100} ch={100}><rect width={100} height={100} fill={`url(#gs${id})`} /></OnFace>
      ) : null}
      {edge && !g ? (
        <>
          <polyline points={pts([T[3], T[2], T[1]], c)} fill="none" stroke={`rgba(255,255,255,${c.mode === 'dark' ? 0.22 : 0.5})`}
                    strokeWidth={1.5 * (c.u / 10)} strokeLinejoin="round" />
          <polyline points={pts([T[0], T[1]], c)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1 * (c.u / 10)} />
          {showSides ? (
            <line x1={project(T[2], c)[0]} y1={project(T[2], c)[1]} x2={project([x + w, y + d, z], c)[0]} y2={project([x + w, y + d, z], c)[1]}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1 * (c.u / 10)} />
          ) : null}
        </>
      ) : null}
    </g>
  );
};

/** Thin slab (boards, plates, desk tops). */
export const IsoSlab: React.FC<Omit<BoxProps, 'h'> & {h?: number}> = ({h = 0.6, ...p}) => <IsoBox h={h} {...p} />;

// ---- composite objects ------------------------------------------------------------------------------------

const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Chip package on a substrate with pins and laser print; `xray` 0..1 fades the lid and reveals the die floorplan. */
export const IsoChip: React.FC<{
  x?: number; y?: number; z?: number; w?: number; d?: number; label?: string; sub?: string;
  substrate?: string; lid?: string; pins?: 'edge' | 'none'; xray?: number; dieColor?: string; shadow?: boolean;
}> = ({x = 0, y = 0, z = 0, w = 10, d = 10, label, sub, substrate = C.substrateGreen, lid = C.chip, pins = 'edge', xray = 0,
  dieColor = '#6E5BD8', shadow = true}) => {
  const c = useIso();
  const m = Math.min(w, d) * 0.14;
  const lw = w - 2 * m, ld = d - 2 * m;
  const pinsN = Math.max(4, Math.round(w / 1.6));
  const pinList: React.ReactNode[] = [];
  if (pins === 'edge') {
    for (let i = 0; i < pinsN; i++) {
      const px = x + m * 0.6 + (i + 0.5) * ((w - m * 1.2) / pinsN) - 0.35;
      pinList.push(<IsoBox key={`py${i}`} x={px} y={y + d - 0.05} z={z} w={0.7} d={m * 0.55} h={0.25} color={C.goldLit} ao={false} edge={false} />);
    }
    for (let i = 0; i < pinsN; i++) {
      const py = y + m * 0.6 + (i + 0.5) * ((d - m * 1.2) / pinsN) - 0.35;
      pinList.push(<IsoBox key={`px${i}`} x={x + w - 0.05} y={py} z={z} w={m * 0.55} d={0.7} h={0.25} color={C.goldLit} ao={false} edge={false} />);
    }
  }
  const sh = 0.5, lh = 1.1;
  const die = (
    <g>
      {Array.from({length: 4}).map((_, r) =>
        Array.from({length: 4}).map((__, k) => (
          <rect key={`${r}-${k}`} x={8 + k * 23} y={8 + r * 23} width={20} height={20} rx={2}
                fill={rnd(r * 7 + k) > 0.5 ? dieColor : tint(dieColor, 0.35)} opacity={0.9} />
        )),
      )}
    </g>
  );
  return (
    <g>
      {shadow ? <ContactShadow x={x} y={y} w={w} d={d} lift={z} /> : null}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={sh} color={substrate} />
      {xray > 0 ? (
        <OnFace o={[x + m, y + m, z + sh]} a={[x + m + lw, y + m, z + sh]} b={[x + m, y + m + ld, z + sh]} cw={100} ch={100} opacity={xray}>
          {die}
        </OnFace>
      ) : null}
      <IsoBox x={x + m} y={y + m} z={z + sh} w={lw} d={ld} h={lh} color={lid} glass={xray}
              topContent={label ? {
                cw: 100, ch: 100, node: (
                  <g opacity={1 - xray}>
                    <text x={50} y={sub ? 46 : 56} textAnchor="middle" fontSize={label.length > 6 ? 16 : 20} fontWeight={700}
                          fill="rgba(255,255,255,0.82)" fontFamily="Inter, sans-serif" letterSpacing={1.5}>{label}</text>
                    {sub ? <text x={50} y={66} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)"
                                 fontFamily="JetBrains Mono, monospace">{sub}</text> : null}
                    <circle cx={12} cy={12} r={3} fill="rgba(255,255,255,0.35)" />
                  </g>
                ),
              } : undefined} />
      {pinList}
    </g>
  );
};

/** Circuit board with traces and an optional list of parts placed on it. */
export const IsoBoard: React.FC<{
  x?: number; y?: number; z?: number; w: number; d: number; color?: string; traces?: number; seed?: number;
  traceColor?: string; children?: React.ReactNode; shadow?: boolean;
}> = ({x = 0, y = 0, z = 0, w, d, color = C.pcbGreen, traces = 26, seed = 3, traceColor, children, shadow = true}) => {
  const tc = traceColor ?? tint(color, 0.22);
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < traces; i++) {
    const sx = rnd(seed + i) * 100, sy = rnd(seed * 3 + i * 1.7) * 100;
    const len = 12 + rnd(seed + i * 2.3) * 30;
    const horiz = rnd(seed + i * 5.1) > 0.5;
    const ex = horiz ? Math.min(98, sx + len) : sx, ey = horiz ? sy : Math.min(98, sy + len);
    const bend = rnd(i + seed * 9) * 8;
    lines.push(
      <g key={i}>
        <polyline points={`${sx},${sy} ${ex - (horiz ? bend : 0)},${ey - (horiz ? 0 : bend)} ${ex},${ey + (horiz ? bend : 0)}`}
                  fill="none" stroke={tc} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={sx} cy={sy} r={1.1} fill={C.goldLit} opacity={0.8} />
      </g>,
    );
  }
  return (
    <g>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={0.5} color={color} shadow={shadow}
              topContent={{cw: 100, ch: 100, node: <g>{lines}</g>}} />
      {children}
    </g>
  );
};

/** Laptop: base with keyboard + hinged lid. `open` in degrees (0 closed, 105 typical). Screen content: 160 x 100 box. */
export const IsoLaptop: React.FC<{
  x?: number; y?: number; z?: number; w?: number; d?: number; open?: number; color?: string; screen?: React.ReactNode;
  screenOn?: number; shadow?: boolean;
}> = ({x = 0, y = 0, z = 0, w = 16, d = 11, open = 105, color = C.silverLit, screen, screenOn = 1, shadow = true}) => {
  const c = useIso();
  const a = (open * Math.PI) / 180;
  const L = d * 0.98, th = 0.35;
  // lid rotates about the back edge (y = y): closed lies along +y over the base, open = up and back
  const dir: P3 = [0, Math.cos(a), Math.sin(a)];
  const tip = (px: number): P3 => [px, y + dir[1] * L, z + 0.7 + dir[2] * L];
  const lidPts: P3[] = [[x, y, z + 0.7], [x + w, y, z + 0.7], tip(x + w), tip(x)];
  const back = (p: P3): P3 => [p[0], p[1] - Math.sin(a) * th, p[2] + Math.cos(a) * th];
  const f = faces(color, c.mode);
  const keys = (
    <g>
      <rect x={4} y={6} width={92} height={52} rx={3} fill={shade(color, 0.32)} />
      {Array.from({length: 5}).map((_, r) =>
        Array.from({length: 12}).map((__, k) => (
          <rect key={`${r}-${k}`} x={6 + k * 7.4} y={8 + r * 9.8} width={6.4} height={8.2} rx={1.2} fill={shade(color, 0.18)} />
        )),
      )}
      <rect x={36} y={66} width={28} height={22} rx={2.5} fill={shade(color, 0.85)} stroke={shade(color, 0.7)} strokeWidth={0.6} />
    </g>
  );
  return (
    <g>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={0.7} color={color} shadow={shadow}
              topContent={open > 80 ? {cw: 100, ch: 100, node: keys} : undefined} />
      {open > 0 ? (
        <g>
          <polygon points={pts(lidPts.map(back), c)} fill={f.right} />
          <polygon points={pts(lidPts, c)} fill={shade(color, 0.35)} />
          {/* screen content: y = 0 at the top edge of the open lid, y = 100 near the hinge */}
          <OnFace o={[x + w * 0.04, y + dir[1] * L * 0.95, z + 0.7 + dir[2] * L * 0.95]}
                  a={[x + w * 0.96, y + dir[1] * L * 0.95, z + 0.7 + dir[2] * L * 0.95]}
                  b={[x + w * 0.04, y + dir[1] * L * 0.06, z + 0.7 + dir[2] * L * 0.06]} cw={160} ch={100}>
            <rect width={160} height={100} rx={2} fill="#06070A" />
            <g opacity={screenOn}>{screen}</g>
          </OnFace>
          <polyline points={pts([lidPts[3], lidPts[2]], c)} stroke="rgba(255,255,255,0.25)" strokeWidth={1.2 * (c.u / 10)} fill="none" />
        </g>
      ) : null}
    </g>
  );
};

/** Standing screen panel facing the viewer's left (+y face): monitors, phones, signs. Content box 100 x (100*h/w). */
export const IsoPanel: React.FC<{
  x?: number; y?: number; z?: number; w: number; h: number; t?: number; color?: string; bezel?: number;
  content?: React.ReactNode; stand?: boolean; screenColor?: string;
}> = ({x = 0, y = 0, z = 0, w, h, t = 0.6, color = C.hardware, bezel = 0.4, content, stand = false, screenColor = '#06070A'}) => {
  const ch = (100 * h) / w;
  return (
    <g>
      {stand ? (
        <>
          <IsoBox x={x + w / 2 - 2} y={y - 1.5} z={0} w={4} d={3.4} h={0.3} color={color} shadow />
          <IsoBox x={x + w / 2 - 0.5} y={y - 0.2} z={0.3} w={1} d={0.5} h={z - 0.3} color={color} />
        </>
      ) : null}
      <IsoBox x={x} y={y} z={z} w={w} d={t} h={h} color={color} shadow={!stand && z < 0.01}
              frontContent={{
                cw: 100, ch, node: (
                  <g>
                    <rect x={(bezel / w) * 100} y={(bezel / w) * 100} width={100 - (2 * bezel / w) * 100} height={ch - (2 * bezel / w) * 100}
                          rx={1.5} fill={screenColor} />
                    <g transform={`translate(${(bezel / w) * 100},${(bezel / w) * 100}) scale(${1 - (2 * bezel) / w})`}>{content}</g>
                  </g>
                ),
              }} />
    </g>
  );
};

/** Layers that spread apart on z (exploded view). `spread` 0..1 (drive with a spring). */
export const ExplodedStack: React.FC<{
  x?: number; y?: number; w: number; d: number; spread: number; gap?: number;
  layers: {h: number; color: string; inset?: number; node?: (z: number) => React.ReactNode}[];
}> = ({x = 0, y = 0, w, d, spread, gap = 5, layers}) => {
  let z = 0;
  const out: React.ReactNode[] = [];
  layers.forEach((L, i) => {
    const ins = L.inset ?? 0;
    out.push(
      L.node ? <g key={i}>{L.node(z)}</g> : (
        <IsoBox key={i} x={x + ins} y={y + ins} z={z} w={w - 2 * ins} d={d - 2 * ins} h={L.h} color={L.color} shadow={i === 0} />
      ),
    );
    z += L.h + gap * spread;
  });
  return <g>{out}</g>;
};

/** Plan-to-ISO tilt around any children: wrap a sub-scene with its own tilt value. */
export const Tilt: React.FC<{tilt: number; children: React.ReactNode}> = ({tilt, children}) => {
  const c = useIso();
  return <IsoCtx.Provider value={{...c, tilt}}>{children}</IsoCtx.Provider>;
};

/** Metal disc / cylinder (fans, coins, platters) drawn as stacked ellipses. */
export const IsoCylinder: React.FC<{cx?: number; cy?: number; z?: number; r: number; h: number; color?: string; top?: React.ReactNode}> = ({
  cx = 0, cy = 0, z = 0, r, h, color = C.metalHi, top,
}) => {
  const c = useIso();
  const [x0, y0] = project([cx, cy, z], c);
  const [x1, y1] = project([cx, cy, z + h], c);
  // a circle of radius r projects to an ellipse rx = r*sqrt2*cos30, ry = r*sqrt2*sin30 in ISO (r, r in PLAN)
  const rx = r * c.u * (1 + (Math.SQRT2 * COS - 1) * c.tilt);
  const ry = r * c.u * (1 + (Math.SQRT2 * SIN - 1) * c.tilt);
  const f = faces(color, c.mode);
  return (
    <g>
      <ContactShadow x={cx - r} y={cy - r} w={2 * r} d={2 * r} lift={z} />
      <path d={`M${x0 - rx},${y0} A${rx},${ry} 0 0 0 ${x0 + rx},${y0} L${x1 + rx},${y1} A${rx},${ry} 0 0 1 ${x1 - rx},${y1} Z`}
            fill={f.left} />
      <ellipse cx={x1} cy={y1} rx={rx} ry={ry} fill={f.top} stroke="rgba(255,255,255,0.18)" strokeWidth={1.2 * (c.u / 10)} />
      {top ? <g transform={`translate(${x1},${y1}) scale(${rx / 50},${ry / 50})`}>{top}</g> : null}
    </g>
  );
};
