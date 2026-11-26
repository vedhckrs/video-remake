// Silicon kit - inside the chip (26 Nov 2026): `DieFloorplan` (decapped SoC die: cores, GPU tiles, neural engine,
// SRAM caches, standard-cell seas, I/O ring, bump grid, scribe lane, thin-film colours), `CellFabric` (standard-cell
// rows + SRAM bit-cell array, the level between a core and one transistor), `NanosheetFET` (gate-all-around nanosheet
// transistor, lit 2.5D cut-away, gate voltage -> glowing channels + electron flow) and `NanosheetField`.
// All are plain SVG fragments (<g>) with their own defs: usable inside a World <svg>, a NanoZoom level or a chip
// top face (`SiChip xray`). Pure functions of their props; seeded.
import React, {useId, useMemo} from 'react';
import {alpha, mix, shade, tint} from './tokens';
import {clamp01, dot, lerp, rr, siHash, siRng} from './silicon_core';

const n2 = (v: number) => Math.round(v * 100) / 100;
const FONT = 'Poppins, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// =====================================================================================================================
// Die floorplan
// =====================================================================================================================
export type DieBlockKind = 'pcore' | 'ecore' | 'gpu' | 'npu' | 'cache' | 'logic' | 'isp' | 'media' | 'phy' | 'analog' | 'secure';
export type DieBlock = {
  id: string; label: string; sub?: string; kind: DieBlockKind;
  /** in die units: the die is 1600 x 1000, the core area is x 70..1530, y 70..930 */
  x: number; y: number; w: number; h: number;
  /** identical tiles inside the block (cols, rows) - the repeated-structure look of GPU / NPU clusters */
  rep?: [number, number];
};

/** A believable phone-SoC floorplan (illustrative - not a trace of any real die). */
export const SOC_FLOORPLAN: DieBlock[] = [
  {id: 'gpu', label: 'GPU', sub: '6-core graphics', kind: 'gpu', x: 70, y: 70, w: 492, h: 500, rep: [3, 2]},
  {id: 'pcore1', label: 'P-CORE', sub: 'performance', kind: 'pcore', x: 574, y: 70, w: 286, h: 330},
  {id: 'pcore2', label: 'P-CORE', sub: 'performance', kind: 'pcore', x: 872, y: 70, w: 286, h: 330},
  {id: 'l2p', label: 'L2 CACHE', kind: 'cache', x: 574, y: 412, w: 584, h: 92},
  {id: 'ecores', label: 'E-CORES', sub: '4 efficiency cores', kind: 'ecore', x: 1170, y: 70, w: 360, h: 292, rep: [2, 2]},
  {id: 'l2e', label: 'L2', kind: 'cache', x: 1170, y: 374, w: 360, h: 74},
  {id: 'slc', label: 'SYSTEM CACHE', sub: 'SRAM', kind: 'cache', x: 574, y: 516, w: 430, h: 170},
  {id: 'npu', label: 'NEURAL ENGINE', sub: '16-core', kind: 'npu', x: 1016, y: 460, w: 514, h: 306, rep: [4, 4]},
  {id: 'isp', label: 'ISP', sub: 'image signal', kind: 'isp', x: 70, y: 582, w: 262, h: 226},
  {id: 'media', label: 'MEDIA', sub: 'display + video', kind: 'media', x: 344, y: 582, w: 218, h: 226},
  {id: 'ddr', label: 'MEMORY I/O', kind: 'phy', x: 574, y: 698, w: 430, h: 110},
  {id: 'aon', label: 'ALWAYS-ON', kind: 'logic', x: 70, y: 820, w: 492, h: 110},
  {id: 'usb', label: 'USB / PCIe', kind: 'phy', x: 574, y: 820, w: 300, h: 110},
  {id: 'sep', label: 'SECURE ENCLAVE', kind: 'secure', x: 886, y: 820, w: 186, h: 110},
  {id: 'pll', label: 'PLL / RF', kind: 'analog', x: 1084, y: 778, w: 446, h: 152},
];

// thin-film interference palette (what a decapped die looks like under white light)
const FILM = ['#1FA7A2', '#2C62CC', '#B13C8E', '#CB993C', '#3FA56D', '#6C4DC8', '#C9726C', '#3ABADB', '#8C9B2E', '#D06A9B'];
const KIND_HUES: Record<DieBlockKind, number[]> = {
  pcore: [1, 5, 0, 7, 2], ecore: [0, 4, 7, 1], gpu: [2, 5, 3, 6, 9], npu: [3, 8, 4, 0], cache: [7, 0], logic: [1, 4, 5],
  isp: [4, 0, 3], media: [5, 2, 7], phy: [6, 3, 1], analog: [3, 6], secure: [9, 5],
};
type Tex = 'sram' | 'logic' | 'data' | 'macro';
const KIND_TEX: Record<DieBlockKind, [Tex, number][]> = {
  pcore: [['logic', 0.5], ['sram', 0.28], ['data', 0.22]], ecore: [['logic', 0.55], ['sram', 0.25], ['data', 0.2]],
  gpu: [['data', 0.4], ['logic', 0.35], ['sram', 0.25]], npu: [['data', 0.5], ['sram', 0.32], ['logic', 0.18]],
  cache: [['sram', 1]], logic: [['logic', 0.8], ['sram', 0.2]], isp: [['data', 0.45], ['logic', 0.35], ['sram', 0.2]],
  media: [['logic', 0.5], ['data', 0.3], ['sram', 0.2]], phy: [['macro', 0.7], ['logic', 0.3]], analog: [['macro', 1]], secure: [['logic', 0.6], ['sram', 0.4]],
};
type Leaf = {x: number; y: number; w: number; h: number; tex: Tex; col: string};

const pickTex = (kind: DieBlockKind, q: number): Tex => {
  let acc = 0;
  for (const [t, p] of KIND_TEX[kind]) {
    acc += p;
    if (q <= acc) return t;
  }
  return KIND_TEX[kind][0][0];
};

/** guillotine subdivision of a block into macro cells */
const subdivide = (x: number, y: number, w: number, h: number, r: () => number, kind: DieBlockKind, min: number, gut: number, out: Leaf[], depth = 0) => {
  const big = Math.max(w, h);
  const stop = big < min * 1.6 || depth > 5 || (depth > 1 && r() < 0.16);
  if (stop) {
    const hues = KIND_HUES[kind];
    const hq = r();
    const hue = FILM[hues[hq < 0.58 ? 0 : hq < 0.84 ? 1 % hues.length : Math.floor(r() * hues.length)]];
    const tex = pickTex(kind, r());
    const dark = tex === 'sram' ? 0.3 + r() * 0.16 : tex === 'data' ? 0.42 + r() * 0.2 : 0.5 + r() * 0.22;
    // quantised so leaves batch into few paths
    const col = mix(hue, '#070B16', Math.round(dark * 8) / 8);
    out.push({x, y, w, h, tex, col});
    return;
  }
  const f = 0.3 + r() * 0.4;
  if (w >= h) {
    const a = Math.round((w - gut) * f);
    subdivide(x, y, a, h, r, kind, min, gut, out, depth + 1);
    subdivide(x + a + gut, y, w - a - gut, h, r, kind, min, gut, out, depth + 1);
  } else {
    const a = Math.round((h - gut) * f);
    subdivide(x, y, w, a, r, kind, min, gut, out, depth + 1);
    subdivide(x, y + a + gut, w, h - a - gut, r, kind, min, gut, out, depth + 1);
  }
};

const blockLeaves = (b: DieBlock, seed: number): Leaf[] => {
  const out: Leaf[] = [];
  const pad = 5;
  if (b.kind === 'cache') {
    // SRAM banks with sense-amp strips between them
    const cols = Math.max(2, Math.round(b.w / 96)), rows = Math.max(1, Math.round(b.h / 80));
    const bw = (b.w - pad * 2 - (cols - 1) * 7) / cols, bh = (b.h - pad * 2 - (rows - 1) * 9) / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const hue = FILM[KIND_HUES.cache[(i + j) % 2]];
      out.push({x: b.x + pad + i * (bw + 7), y: b.y + pad + j * (bh + 9), w: bw, h: bh, tex: 'sram', col: mix(hue, '#070B16', 0.375)});
    }
    return out;
  }
  const [cols, rows] = b.rep ?? [1, 1];
  const tw = (b.w - pad * 2 - (cols - 1) * 6) / cols, th = (b.h - pad * 2 - (rows - 1) * 6) / rows;
  // identical tiles share one subdivision (same seed) - that is what makes GPU / NPU clusters look like clusters
  const proto: Leaf[] = [];
  const min = b.rep ? Math.max(16, Math.min(tw, th) / 3.2) : Math.max(22, Math.min(b.w, b.h) / 5.5);
  subdivide(0, 0, tw, th, siRng(seed + b.id.length * 7.3 + b.x * 0.013 * (b.rep ? 0 : 1) + (b.kind === 'pcore' ? 2 : 0)), b.kind, min, 3, proto);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const ox = b.x + pad + i * (tw + 6), oy = b.y + pad + j * (th + 6);
    // mirrored neighbours, like real placed-and-flipped macros
    const fx = i % 2 === 1, fy = j % 2 === 1;
    proto.forEach((l) => out.push({...l, x: ox + (fx ? tw - l.x - l.w : l.x), y: oy + (fy ? th - l.y - l.h : l.y)}));
  }
  return out;
};

export const dieBlockCentre = (id: string, blocks: DieBlock[] = SOC_FLOORPLAN): [number, number] => {
  const b = blocks.find((k) => k.id === id) ?? blocks[0];
  return [b.x + b.w / 2, b.y + b.h / 2];
};

type DieArtProps = {uid: string; blocks: DieBlock[]; seed: number; detail: 0 | 1 | 2; bumps: number};
const DieArt = React.memo<DieArtProps>(({uid, blocks, seed, detail, bumps}) => {
  const art = useMemo(() => {
    const byCol = new Map<string, string[]>();
    const tex: Record<Tex, string[]> = {sram: [], logic: [], data: [], macro: []};
    const flat: React.ReactNode[] = [];
    blocks.forEach((b, bi) => {
      if (detail === 0) {
        const hue = FILM[KIND_HUES[b.kind][0]];
        flat.push(<rect key={bi} x={b.x + 4} y={b.y + 4} width={b.w - 8} height={b.h - 8} rx={4} fill={mix(hue, '#070B16', 0.45)} />);
        return;
      }
      blockLeaves(b, seed).forEach((l) => {
        const d = rr(l.x, l.y, l.w, l.h, 1.5);
        byCol.set(l.col, [...(byCol.get(l.col) ?? []), d]);
        tex[l.tex].push(d);
      });
    });
    // I/O ring pad cells + bond/bump pads
    const io: string[] = [], pads: string[] = [];
    if (detail > 0) {
      for (let x = 34; x < 1560; x += 21) {
        io.push(rr(x, 30, 17, 32, 1), rr(x, 938, 17, 32, 1));
        if (Math.round(x / 21) % 2 === 0) pads.push(rr(x + 3, 34, 11, 11, 1), rr(x + 3, 955, 11, 11, 1));
      }
      for (let y = 70; y < 925; y += 21) {
        io.push(rr(30, y, 32, 17, 1), rr(1538, y, 32, 17, 1));
        if (Math.round(y / 21) % 2 === 0) pads.push(rr(34, y + 3, 11, 11, 1), rr(1555, y + 3, 11, 11, 1));
      }
    }
    // scribe-lane test keys
    const keys: string[] = [];
    const r = siRng(seed + 99);
    for (let i = 0; i < 46; i++) {
      const along = r() * 1560 + 20, side = Math.floor(r() * 4), s = 4 + r() * 7;
      if (side === 0) keys.push(rr(along, 5, s * 2, 8, 0)); else if (side === 1) keys.push(rr(along, 987, s * 2, 8, 0));
      else if (side === 2) keys.push(rr(5, along * 0.62 + 10, 8, s * 2, 0)); else keys.push(rr(1587, along * 0.62 + 10, 8, s * 2, 0));
    }
    // analog block: spiral inductors + cap arrays
    const spirals: string[] = [], caps: string[] = [];
    blocks.filter((b) => b.kind === 'analog').forEach((b) => {
      const n = Math.max(2, Math.floor(b.w / (b.h * 0.95)));
      for (let i = 0; i < n; i++) {
        const cx = b.x + b.h * 0.5 + i * (b.h * 0.92), cy = b.y + b.h / 2;
        for (let k = 0; k < 5; k++) {
          const q = b.h * 0.4 - k * b.h * 0.07, c = q * 0.42;
          spirals.push(`M${n2(cx - q + c)} ${n2(cy - q)}H${n2(cx + q - c)}L${n2(cx + q)} ${n2(cy - q + c)}V${n2(cy + q - c)}L${n2(cx + q - c)} ${n2(cy + q)}H${n2(cx - q + c)}L${n2(cx - q)} ${n2(cy + q - c)}V${n2(cy - q + c)}Z`);
        }
      }
      for (let i = 0; i < 6; i++) caps.push(rr(b.x + b.w - 70 + (i % 2) * 30, b.y + 12 + Math.floor(i / 2) * ((b.h - 24) / 3), 24, (b.h - 36) / 3, 2));
    });
    return {byCol: [...byCol.entries()], tex, flat, io, pads, keys, spirals, caps};
  }, [blocks, seed, detail]);
  const P = (n: string) => `url(#${uid}-${n})`;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#141C2E" /><stop offset="1" stopColor="#070A12" />
        </linearGradient>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.12} /><stop offset="0.35" stopColor="#fff" stopOpacity={0.02} />
          <stop offset="0.7" stopColor="#000" stopOpacity={0.1} /><stop offset="1" stopColor="#000" stopOpacity={0.32} />
        </linearGradient>
        {/* SRAM: bit-cell grid */}
        <pattern id={`${uid}-sram`} patternUnits="userSpaceOnUse" width={7} height={5}>
          <rect width={7} height={5} fill="#fff" opacity={0.05} />
          <path d="M0 0.4H7M0 2.9H7" stroke="#000" strokeWidth={0.9} opacity={0.42} />
          <path d="M0.5 0V5M4 0V5" stroke="#fff" strokeWidth={0.7} opacity={0.2} />
        </pattern>
        {/* standard-cell sea: rows of ragged cells */}
        <pattern id={`${uid}-logic`} patternUnits="userSpaceOnUse" width={46} height={20}>
          <path d="M0 0.5H46M0 5.5H46M0 10.5H46M0 15.5H46" stroke="#000" strokeWidth={1} opacity={0.4} />
          <path d="M2 2.6h9M14 2.6h4M21 2.6h13M38 2.6h6M5 7.6h5M13 7.6h11M28 7.6h3M34 7.6h9M1 12.6h12M17 12.6h6M26 12.6h9M39 12.6h5M4 17.6h3M10 17.6h14M27 17.6h5M36 17.6h8"
                stroke="#fff" strokeWidth={2.2} opacity={0.2} />
          <path d="M8 2.6h2M30 7.6h2M20 12.6h2M12 17.6h2M41 2.6h2" stroke="#fff" strokeWidth={2.2} opacity={0.42} />
        </pattern>
        {/* datapath: bit slices */}
        <pattern id={`${uid}-data`} patternUnits="userSpaceOnUse" width={24} height={40}>
          <path d="M1.5 0V40M5 0V40M10.5 0V40M13 0V40M19 0V40" stroke="#fff" strokeWidth={1.3} opacity={0.17} />
          <path d="M8 0V40M16 0V40M22 0V40" stroke="#000" strokeWidth={1.6} opacity={0.36} />
          <path d="M0 13H24M0 31H24" stroke="#000" strokeWidth={0.8} opacity={0.3} />
        </pattern>
        <pattern id={`${uid}-macro`} patternUnits="userSpaceOnUse" width={30} height={30}>
          <rect x={3} y={3} width={24} height={24} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.22} />
          <rect x={9} y={9} width={12} height={12} fill="#fff" opacity={0.1} />
        </pattern>
        {/* top-metal power grid */}
        <pattern id={`${uid}-grid`} patternUnits="userSpaceOnUse" width={34} height={34}>
          <path d="M0 6H34M0 23H34" stroke="#fff" strokeWidth={2.4} opacity={0.055} />
          <path d="M9 0V34M26 0V34" stroke="#fff" strokeWidth={1.6} opacity={0.04} />
        </pattern>
        <pattern id={`${uid}-bump`} patternUnits="userSpaceOnUse" width={44} height={44}>
          <circle cx={22} cy={22} r={9} fill="#E9C873" opacity={0.5} />
          <circle cx={19} cy={19} r={3.2} fill="#fff" opacity={0.5} />
        </pattern>
      </defs>
      {/* scribe lane + seal ring */}
      <rect x={0} y={0} width={1600} height={1000} rx={6} fill="#0A0D14" />
      {detail > 0 ? <path d={art.keys.join('')} fill="#8C6A2A" opacity={0.55} /> : null}
      <rect x={17} y={17} width={1566} height={966} rx={5} fill={P('base')} stroke="#6E7F9C" strokeWidth={2.2} />
      <rect x={23} y={23} width={1554} height={954} rx={4} fill="none" stroke="#2F3D55" strokeWidth={2} />
      {detail > 0 ? (
        <>
          <path d={art.io.join('')} fill="#1D2A40" stroke="#3A4C6B" strokeWidth={0.8} />
          <path d={art.pads.join('')} fill="#C9A552" opacity={0.85} />
        </>
      ) : null}
      {/* core area */}
      <rect x={66} y={66} width={1468} height={868} rx={3} fill="#060912" />
      {art.flat}
      {art.byCol.map(([col, ds]) => <path key={col} d={ds.join('')} fill={col} />)}
      {detail === 2 ? (
        <>
          <path d={art.tex.sram.join('')} fill={P('sram')} />
          <path d={art.tex.logic.join('')} fill={P('logic')} />
          <path d={art.tex.data.join('')} fill={P('data')} />
          <path d={art.tex.macro.join('')} fill={P('macro')} />
        </>
      ) : null}
      {detail > 0 ? (
        <>
          <path d={art.spirals.join('')} fill="none" stroke="#E0B45C" strokeWidth={3.2} opacity={0.75} />
          <path d={art.caps.join('')} fill="#B9842F" opacity={0.6} stroke="#F3D48A" strokeWidth={1} />
        </>
      ) : null}
      {detail === 2 ? <rect x={66} y={66} width={1468} height={868} fill={P('grid')} /> : null}
      {bumps > 0 && detail > 0 ? <rect x={78} y={78} width={1444} height={844} fill={P('bump')} opacity={bumps} /> : null}
      <rect x={17} y={17} width={1566} height={966} rx={5} fill={P('sheen')} />
      {detail === 2 ? (
        <>
          <path d="M40 40h14M47 33v14M1546 40h14M1553 33v14M40 960h14M47 953v14M1546 960h14M1553 953v14" stroke="#D9B45A" strokeWidth={2.4} />
          <text x={76} y={11.5} fontFamily={MONO} fontSize={8.5} fontWeight={600} letterSpacing={2} fill="#7C8AA3">SOC DIE  REV B1  M15  2 NM CLASS  GAA NANOSHEET</text>
        </>
      ) : null}
    </g>
  );
});

/**
 * Decapped SoC die, drawn into the box (x, y, w, h) of the current user space (aspect 1.6 : 1 looks right).
 * `active` = `{blockId: 0..1}` highlights blocks (glow outline + lift in brightness); `dim` darkens the rest;
 * `labels` = true or a list of block ids; `shift` 0..1 slides the iridescent thin-film sheen (animate with the light).
 * `detail` 0 = block colours only (1/10 copies inside a NanoZoom parent, tiny x-ray views), 1 = macro cells,
 * 2 = + cell textures, power grid, I/O pads, scribe marks.
 */
export const DieFloorplan: React.FC<{
  x?: number; y?: number; w: number; h?: number; blocks?: DieBlock[]; seed?: number; detail?: 0 | 1 | 2;
  active?: Record<string, number>; dim?: number; labels?: boolean | string[]; labelScale?: number; labelOpacity?: number; shift?: number;
  bumps?: number; accent?: string; id?: string; opacity?: number;
}> = ({x = 0, y = 0, w, h, blocks = SOC_FLOORPLAN, seed = 20, detail = 2, active, dim = 0, labels = false, labelScale = 1, labelOpacity = 1, shift = 0.3, bumps = 0, accent = '#7FD4FF', id, opacity}) => {
  const auto = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = id ?? `die${auto}`;
  const hh = h ?? w / 1.6;
  const act = active ?? {};
  const anyActive = Object.values(act).some((v) => v > 0.01);
  const s0 = -0.6 + shift * 1.2;
  return (
    <g transform={`translate(${x} ${y}) scale(${w / 1600} ${hh / 1000})`} opacity={opacity}>
      <DieArt uid={uid} blocks={blocks} seed={seed} detail={detail} bumps={bumps} />
      {/* thin-film interference: a wide rainbow band that slides with the light */}
      <defs>
        <linearGradient id={`${uid}-film`} x1={s0} y1="0" x2={s0 + 1.5} y2="1">
          <stop offset="0" stopColor="#19D3C5" stopOpacity={0} /><stop offset="0.18" stopColor="#19D3C5" stopOpacity={0.24} />
          <stop offset="0.36" stopColor="#B04CE0" stopOpacity={0.22} /><stop offset="0.52" stopColor="#FF7AB8" stopOpacity={0.18} />
          <stop offset="0.68" stopColor="#FFC857" stopOpacity={0.22} /><stop offset="0.84" stopColor="#4BE08A" stopOpacity={0.16} />
          <stop offset="1" stopColor="#4BE08A" stopOpacity={0} />
        </linearGradient>
      </defs>
      {detail > 0 ? <rect x={17} y={17} width={1566} height={966} rx={5} fill={`url(#${uid}-film)`} style={{mixBlendMode: 'screen'}} /> : null}
      {dim > 0 && anyActive ? (
        <path fillRule="evenodd" fill="#03050A" opacity={0.72 * dim}
              d={rr(17, 17, 1566, 966, 5) + blocks.filter((b) => (act[b.id] ?? 0) > 0.01).map((b) => rr(b.x, b.y, b.w, b.h, 4)).join('')} />
      ) : null}
      {blocks.map((b) => {
        const a = act[b.id] ?? 0;
        if (a <= 0.01) return null;
        return (
          <g key={b.id}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={4} fill={accent} opacity={0.14 * a} style={{mixBlendMode: 'screen'}} />
            <rect x={b.x - 2} y={b.y - 2} width={b.w + 4} height={b.h + 4} rx={6} fill="none" stroke={accent} strokeWidth={10} opacity={0.22 * a} />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={4} fill="none" stroke={tint(accent, 0.5)} strokeWidth={3} opacity={a} />
          </g>
        );
      })}
      {labels && labelOpacity > 0.01 ? <g opacity={labelOpacity}>{blocks.map((b) => {
        if (Array.isArray(labels) && !labels.includes(b.id)) return null;
        const fs = Math.min(34, Math.max(15, Math.min(b.w / (b.label.length * 0.72), b.h * 0.3))) * labelScale;
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const bw = b.label.length * fs * 0.7 + fs * 1.3, bh = fs * (b.sub && b.h > 150 ? 2.5 : 1.7);
        return (
          <g key={`l${b.id}`}>
            <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={fs * 0.35} fill="#050912" opacity={0.74} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} />
            <text x={cx} y={cy + fs * (b.sub && b.h > 150 ? -0.02 : 0.36)} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.08} fill="#F4F7FB">{b.label}</text>
            {b.sub && b.h > 150 ? <text x={cx} y={cy + fs * 0.86} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={fs * 0.52} letterSpacing={fs * 0.05} fill="#A9B8D0">{b.sub}</text> : null}
          </g>
        );
      })}</g> : null}
    </g>
  );
};

// =====================================================================================================================
// Cell fabric: standard-cell rows + an SRAM bit-cell array (top-down, metal-1 view)
// =====================================================================================================================
const FabricArt = React.memo<{uid: string; w: number; h: number; seed: number; rowH: number; sram: number; lite: boolean}>(({uid, w, h, seed, rowH, sram, lite}) => {
  const art = useMemo(() => {
    const r = siRng(seed);
    const cols = ['#143A5C', '#1B4F6E', '#243B7A', '#2F2F78', '#15505A', '#3A2C6E'];
    const cells = new Map<string, string[]>();
    const m1a: string[] = [], m1b: string[] = [], vias: string[] = [], m2: string[] = [];
    const rows = Math.ceil(h / rowH);
    const x1 = w * (1 - sram);
    const pitch = rowH / 6;
    for (let j = 0; j < rows; j++) {
      const y = j * rowH;
      let x = 0;
      while (x < x1 - pitch * 2) {
        const cw = Math.min(x1 - x, pitch * (2 + Math.floor(r() * 7)));
        const col = cols[Math.floor(r() * cols.length)];
        cells.set(col, [...(cells.get(col) ?? []), rr(x + pitch * 0.12, y + rowH * 0.1, cw - pitch * 0.24, rowH * 0.8, pitch * 0.12)]);
        if (!lite) {
          // metal-1 jogs inside the cell + vias
          const k = 1 + Math.floor(r() * 3);
          for (let q = 0; q < k; q++) {
            const mx = x + pitch * (0.5 + Math.floor(r() * Math.max(1, cw / pitch - 1))), my = y + rowH * (0.24 + r() * 0.5), len = pitch * (1 + Math.floor(r() * 3));
            (r() > 0.5 ? m1a : m1b).push(`M${n2(mx)} ${n2(my)}h${n2(Math.min(len, x + cw - mx - pitch * 0.3))}` + (r() > 0.5 ? `v${n2(rowH * (0.12 + r() * 0.18) * (r() > 0.5 ? 1 : -1))}` : ''));
            vias.push(dot(mx, my, pitch * 0.13));
          }
        }
        x += cw;
      }
    }
    if (!lite) for (let i = 0; i < (w * (1 - sram)) / pitch / 2.2; i++) {
      const x = Math.floor(r() * (x1 / pitch)) * pitch + pitch * 0.5, y0 = Math.floor(r() * rows) * rowH + rowH * 0.3, len = rowH * (1 + Math.floor(r() * 5));
      m2.push(`M${n2(x)} ${n2(y0)}v${n2(len)}`);
      vias.push(dot(x, y0, pitch * 0.15), dot(x, y0 + len, pitch * 0.15));
    }
    return {cells: [...cells.entries()], m1a, m1b, vias, m2, x1, pitch};
  }, [w, h, seed, rowH, sram, lite]);
  const {pitch, x1} = art;
  return (
    <g>
      <defs>
        <pattern id={`${uid}-rail`} patternUnits="userSpaceOnUse" width={rowH * 2} height={rowH * 2}>
          <rect x={0} y={-rowH * 0.07} width={rowH * 2} height={rowH * 0.14} fill="#5B8FD9" opacity={0.75} />
          <rect x={0} y={rowH * 0.93} width={rowH * 2} height={rowH * 0.14} fill="#D98A5B" opacity={0.7} />
          <rect x={0} y={rowH * 1.93} width={rowH * 2} height={rowH * 0.14} fill="#5B8FD9" opacity={0.75} />
        </pattern>
        {/* poly gates: the regular vertical lines of every modern layout */}
        <pattern id={`${uid}-poly`} patternUnits="userSpaceOnUse" width={pitch} height={rowH}>
          <rect x={pitch * 0.38} y={rowH * 0.13} width={pitch * 0.24} height={rowH * 0.74} fill="#E26D8F" opacity={0.5} />
        </pattern>
        <pattern id={`${uid}-bit`} patternUnits="userSpaceOnUse" width={pitch * 2} height={rowH * 0.5}>
          <rect width={pitch * 2} height={rowH * 0.5} fill="#0E2F3A" />
          <rect x={pitch * 0.15} y={rowH * 0.06} width={pitch * 0.7} height={rowH * 0.38} rx={pitch * 0.08} fill="#1C7C86" />
          <rect x={pitch * 1.15} y={rowH * 0.06} width={pitch * 0.7} height={rowH * 0.38} rx={pitch * 0.08} fill="#17616F" />
          <rect x={pitch * 0.42} y={0} width={pitch * 0.16} height={rowH * 0.5} fill="#F0A65A" opacity={0.6} />
          <rect x={pitch * 1.42} y={0} width={pitch * 0.16} height={rowH * 0.5} fill="#F0A65A" opacity={0.6} />
          <rect x={0} y={rowH * 0.21} width={pitch * 2} height={rowH * 0.07} fill="#8AB6FF" opacity={0.45} />
        </pattern>
      </defs>
      <rect width={w} height={h} fill="#060B14" />
      {art.cells.map(([col, ds]) => <path key={col} d={ds.join('')} fill={col} />)}
      <rect width={x1} height={h} fill={`url(#${uid}-poly)`} />
      <rect width={x1} height={h} fill={`url(#${uid}-rail)`} />
      {lite ? null : (
        <>
          <path d={art.m1a.join('')} fill="none" stroke="#F2B46A" strokeWidth={pitch * 0.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
          <path d={art.m1b.join('')} fill="none" stroke="#7FD0E8" strokeWidth={pitch * 0.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          <path d={art.m2.join('')} fill="none" stroke="#000" strokeWidth={pitch * 0.34} strokeLinecap="round" opacity={0.35} transform={`translate(${pitch * 0.12} ${pitch * 0.12})`} />
          <path d={art.m2.join('')} fill="none" stroke="#B79CFF" strokeWidth={pitch * 0.26} strokeLinecap="round" opacity={0.9} />
          <path d={art.vias.join('')} fill="#FFF2CC" opacity={0.9} />
        </>
      )}
      {sram > 0 ? (
        <>
          <rect x={x1 + pitch} y={0} width={w - x1 - pitch} height={h} fill={`url(#${uid}-bit)`} />
          <rect x={x1 + pitch * 0.2} y={0} width={pitch * 0.5} height={h} fill="#C9A552" opacity={0.7} />
        </>
      ) : null}
    </g>
  );
});

/**
 * Standard-cell rows (left) and an SRAM bit-cell array (right `sram` fraction), top-down, centred on (0,0).
 * `pulse` 0..1 lights random cells (activity), driven by `t`. `lite` = no metal-1 (for 1/10 copies).
 */
export const CellFabric: React.FC<{w: number; h: number; seed?: number; rowH?: number; sram?: number; lite?: boolean; t?: number; pulse?: number; id?: string; accent?: string}> = ({
  w, h, seed = 5, rowH = 60, sram = 0.34, lite = false, t = 0, pulse = 0, id, accent = '#7FD4FF',
}) => {
  const auto = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = id ?? `fab${auto}`;
  const sparks: React.ReactNode[] = [];
  if (pulse > 0.01) {
    const rows = Math.ceil(h / rowH), pitch = rowH / 6;
    for (let i = 0; i < 46; i++) {
      const phase = siHash(i * 3.3 + seed), on = Math.sin(t / 5 + phase * 40);
      if (on < 0.35) continue;
      const cw = pitch * (2 + Math.floor(siHash(i * 9.1) * 5));
      const x = Math.floor((siHash(i * 1.7 + 2) * w * (1 - sram) - cw) / pitch) * pitch, y = Math.floor(siHash(i * 5.9 + 4) * rows) * rowH;
      sparks.push(<rect key={i} x={x} y={y + rowH * 0.1} width={cw} height={rowH * 0.8} rx={pitch * 0.12} fill={accent} opacity={0.5 * pulse * (on - 0.35) / 0.65} />);
    }
  }
  return (
    <g transform={`translate(${-w / 2} ${-h / 2})`}>
      <FabricArt uid={uid} w={w} h={h} seed={seed} rowH={rowH} sram={sram} lite={lite} />
      {sparks.length ? <g style={{mixBlendMode: 'screen'}}>{sparks}</g> : null}
    </g>
  );
};

// =====================================================================================================================
// Gate-all-around nanosheet transistor (2.5D cut-away)
// =====================================================================================================================
const FX = 0.84, FY = 0.44;   // FET projection: x right-down, y left-down, z up
/** FET model units -> local px (before `scale`). x = source->drain, y = along the gate, z = up. */
export const fetProject = (x: number, y: number, z: number): [number, number] => [(x - y) * FX, (x + y) * FY - z];
/** Named points of the transistor in model units: use `fetPoint('gate', scale, cx, cy)` for callout anchors. */
export const FET_POINTS: Record<string, [number, number, number]> = {
  source: [-112, 44, 46], drain: [112, 44, 46], gate: [14, -60, 104], channel: [-14, 36, 50], sheets: [-14, 36, 50],
  substrate: [150, 100, -20], contact: [-102, 16, 118], spacer: [-46, -30, 104], oxide: [-30, 0, 62], glass: [40, 84, 70],
};
export const fetPoint = (name: keyof typeof FET_POINTS | string, scale = 1, cx = 0, cy = 0): [number, number] => {
  const p = FET_POINTS[name] ?? FET_POINTS.gate;
  const [x, y] = fetProject(p[0], p[1], p[2]);
  return [cx + x * scale, cy + y * scale];
};

type BoxOpt = {a?: number; stroke?: string; sw?: number; top?: string; glow?: number; glowCol?: string; noTop?: boolean; fillA?: number; sh?: string};
const fq = (ps: [number, number, number][]) => ps.map((p) => fetProject(p[0], p[1], p[2]).map(n2).join(',')).join(' ');
const fbox = (key: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: string, o: BoxOpt = {}) => {
  const st = o.stroke ?? 'rgba(255,255,255,0.16)';
  const g = o.glow ?? 0, gc = o.glowCol ?? '#7FE4FF';
  const top = o.top ?? tint(col, 0.14);
  const fa = o.fillA ?? 1;
  const F = fq([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]);
  const S = fq([[x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]]);
  const T = fq([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]);
  const sw = o.sw ?? 0.8;
  return (
    <g key={key} opacity={o.a ?? 1}>
      <polygon points={F} fill={mix(shade(col, 0.76), gc, g * 0.75)} fillOpacity={fa} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={S} fill={mix(shade(col, 0.46), gc, g * 0.6)} fillOpacity={fa} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      {o.sh ? <><polygon points={F} fill={`url(#${o.sh}-fS)`} /><polygon points={S} fill={`url(#${o.sh}-fS)`} /></> : null}
      {o.noTop ? null : <polygon points={T} fill={mix(top, tint(gc, 0.3), g * 0.85)} fillOpacity={fa} stroke={st} strokeWidth={sw} strokeLinejoin="round" />}
      {o.sh && !o.noTop ? <polygon points={T} fill={`url(#${o.sh}-fT)`} /> : null}
    </g>
  );
};

/**
 * One gate-all-around nanosheet transistor, a lit 2.5D cut-away centred on (cx, cy): three stacked silicon sheets
 * bridge the source and drain epitaxy; the gate wraps every sheet on all four sides. The front half of the gate is
 * glass (`cut` 1) so the sheets are seen passing through it with the gate bands around them, and the gate's cut face
 * shows the liner around each sheet. `gate` 0..1 = gate voltage: the gate metal warms, the channels glow and electrons
 * flow source -> drain (`t` drives the flow). `cut` 0 = closed, solid gate. `metal` 0..1 = contact plugs + first-metal
 * stubs. `lite` = three plain boxes (fields). `floor` 0..1 = the substrate slab under it. `labels` 0..1 = part names.
 * At scale 1 the device is about 480 px wide and 330 px tall.
 */
export const NanosheetFET: React.FC<{
  cx?: number; cy?: number; scale?: number; gate?: number; t?: number; cut?: number; metal?: number; lite?: boolean; floor?: number | boolean;
  sheets?: number; accent?: string; hot?: string; id?: string; opacity?: number; labels?: number;
}> = ({cx = 0, cy = 0, scale = 1, gate = 0, t = 0, cut = 1, metal = 1, lite = false, floor = 1, sheets = 3, accent = '#62E0FF', hot = '#FFB347', id, opacity, labels = 0}) => {
  const auto = useId().replace(/[^a-zA-Z0-9]/g, '');
  const uid = id ?? `fet${auto}`;
  const on = clamp01(gate);
  const fl = typeof floor === 'number' ? clamp01(floor) : floor ? 1 : 0;
  const SH = Array.from({length: sheets}).map((_, i) => ({z0: 16 + i * 28, z1: 16 + i * 28 + 12}));
  const zTop = SH[SH.length - 1].z1 + 20;      // gate top
  const epiTop = SH[SH.length - 1].z1 + 6;
  const sheetCol = mix('#B4C6E0', accent, on * 0.7);
  const gateCol = mix('#7C5FD6', hot, on * 0.22);
  const epiCol = '#1FA98C';
  const spacer = '#C3CEE2';
  const parts: React.ReactNode[] = [];
  if (lite) {
    parts.push(fbox('s', -150, -52, -44, 44, 0, epiTop, epiCol, {stroke: 'rgba(190,255,235,0.25)', glow: on * 0.2, glowCol: accent}));
    parts.push(fbox('g', -46, 46, -84, 84, 0, zTop, gateCol, {stroke: 'rgba(255,255,255,0.25)', glow: on * 0.4, glowCol: hot}));
    parts.push(fbox('d', 52, 150, -44, 44, 0, epiTop, epiCol, {stroke: 'rgba(190,255,235,0.25)', glow: on * 0.2, glowCol: accent}));
    return <g transform={`translate(${cx} ${cy}) scale(${scale})`} opacity={opacity}>{parts}</g>;
  }
  const sh = uid;
  const floorParts: React.ReactNode[] = [];
  if (fl > 0.01) {
    floorParts.push(fbox('sub', -196, 196, -130, 130, -50, -9, '#1C2742', {stroke: 'rgba(160,190,255,0.22)', sh}));
    floorParts.push(fbox('sti', -196, 196, -130, 130, -9, 0, '#32405E', {stroke: 'rgba(170,200,255,0.3)', top: '#3A4A6C', sh}));
    // crystal lattice hint on the substrate faces + a faint grid on its top
    const lat: string[] = [], grid: string[] = [];
    for (let i = -180; i <= 180; i += 20) lat.push(`M${fetProject(i, 130, -12).map(n2).join(' ')}L${fetProject(i, 130, -48).map(n2).join(' ')}`);
    for (let j = -120; j <= 120; j += 20) lat.push(`M${fetProject(196, j, -12).map(n2).join(' ')}L${fetProject(196, j, -48).map(n2).join(' ')}`);
    [-30, -12, 31].forEach((z) => lat.push(`M${fetProject(-196, 130, z - 18).map(n2).join(' ')}L${fetProject(196, 130, z - 18).map(n2).join(' ')}L${fetProject(196, -130, z - 18).map(n2).join(' ')}`));
    for (let i = -160; i <= 160; i += 40) grid.push(`M${fetProject(i, -130, 0).map(n2).join(' ')}L${fetProject(i, 130, 0).map(n2).join(' ')}`);
    for (let j = -120; j <= 120; j += 40) grid.push(`M${fetProject(-196, j, 0).map(n2).join(' ')}L${fetProject(196, j, 0).map(n2).join(' ')}`);
    floorParts.push(<path key="lat" d={lat.join('')} stroke="rgba(170,200,255,0.11)" strokeWidth={1} fill="none" />);
    floorParts.push(<path key="grid" d={grid.join('')} stroke="rgba(170,200,255,0.07)" strokeWidth={1} fill="none" />);
  }
  // contact shadow of the device on the floor
  parts.push(<polygon key="shd" points={fq([[-158, -92, 0], [162, -92, 0], [162, 98, 0], [-158, 98, 0]])} fill={`url(#${uid}-shadow)`} />);
  const epi = (key: string, x0: number, x1: number) => {
    const inner = x0 < 0 ? x1 : x0;                      // the end that meets the spacer
    const cx0 = x0 < 0 ? x0 + 10 : x0, cx1 = x0 < 0 ? x1 : x1 - 10;
    return (
      <g key={key}>
        {fbox(`${key}b`, x0, x1, -44, 44, 0, epiTop - 14, epiCol, {stroke: 'rgba(190,255,235,0.4)', top: '#35C4A2', glow: on * 0.2, glowCol: accent, sh})}
        {fbox(`${key}c`, cx0, cx1, -34, 34, epiTop - 14, epiTop, '#27B797', {stroke: 'rgba(190,255,235,0.5)', top: '#4FDDBA', glow: on * 0.2, glowCol: accent, sh})}
        {SH.map((s, i) => {
          // the sheets end inside the epitaxy: their outlines show on its front face
          const xa = inner === x1 ? x1 - 34 : x0, xb = inner === x1 ? x1 : x0 + 34;
          return <polygon key={i} points={fq([[xa, 44, s.z1], [xb, 44, s.z1], [xb, 44, s.z0], [xa, 44, s.z0]])} fill="rgba(210,255,240,0.14)" stroke="rgba(210,255,240,0.3)" strokeWidth={0.8} />;
        })}
      </g>
    );
  };
  const plug = (key: string, x0: number, x1: number, y0: number, y1: number, z0: number, bar: [number, number], g = 0) => (
    <g key={key} opacity={metal}>
      {fbox(`${key}p`, x0, x1, y0, y1, z0, epiTop + 36, '#8E99A8', {stroke: 'rgba(255,255,255,0.4)', top: '#C9D1DB', glow: g, glowCol: hot, sh})}
      {fbox(`${key}m`, x0 - 7, x1 + 7, bar[0], bar[1], epiTop + 36, epiTop + 46, '#C27A40', {stroke: 'rgba(255,225,190,0.55)', top: '#EBAA6C', glow: g, glowCol: hot, sh})}
    </g>
  );
  // source (behind the gate in x) + its contact
  parts.push(epi('src', -150, -52));
  if (metal > 0.01) parts.push(plug('cs', -118, -88, -15, 15, epiTop, [-34, 24]));
  // gate, back half: solid metal between its spacers
  parts.push(fbox('spb1', -52, -40, -84, 0, 0, zTop, spacer, {a: 0.96, sh}));
  parts.push(fbox('gb', -40, 40, -84, 0, 0, zTop, gateCol, {stroke: 'rgba(255,255,255,0.32)', glow: on * 0.3, glowCol: hot, sh}));
  parts.push(fbox('spb2', 40, 52, -84, 0, 0, zTop, spacer, {a: 0.96, sh}));
  if (metal > 0.01) parts.push(plug('cg', -13, 13, -74, -50, zTop, [-84, -40], on * 0.5));
  // the cut face of the gate (plane y = 0): work-function metal + bright high-k liner around every sheet
  SH.forEach((s, i) => {
    const ring = (pad: number) => fq([[-40, 0, s.z1 + pad], [40, 0, s.z1 + pad], [40, 0, s.z0 - pad], [-40, 0, s.z0 - pad]]);
    parts.push(<polygon key={`wf${i}`} points={ring(6)} fill={mix('#3A2C78', hot, on * 0.65)} stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />);
    parts.push(<polygon key={`hk${i}`} points={ring(1.8)} fill="none" stroke={mix('#F4D58A', '#FFFFFF', on * 0.5)} strokeWidth={1.5} />);
  });
  const solid = 1 - clamp01(cut);
  // the sheets: their front halves run free from source to drain where the gate is cut away
  SH.forEach((s, i) => {
    parts.push(fbox(`sh${i}`, -52, 52, 0, 36, s.z0, s.z1, sheetCol, {stroke: 'rgba(255,255,255,0.6)', sw: 1, top: tint(sheetCol, 0.3), glow: on * 0.8, glowCol: accent, sh}));
    // gate bands: the gate metal that goes all the way AROUND each sheet (kept as three straps so the sheet shows)
    [-26, 0, 26].forEach((bx, k) => {
      const c = mix('#8E78E0', hot, on * 0.8);
      parts.push(
        <g key={`bd${i}${k}`} opacity={0.4 + 0.5 * cut}>
          <polygon points={fq([[bx - 4, 0, s.z1 + 0.6], [bx + 4, 0, s.z1 + 0.6], [bx + 4, 36.6, s.z1 + 0.6], [bx - 4, 36.6, s.z1 + 0.6]])} fill={tint(c, 0.2)} opacity={0.9} />
          <polygon points={fq([[bx - 4, 36.6, s.z1 + 0.6], [bx + 4, 36.6, s.z1 + 0.6], [bx + 4, 36.6, s.z0 - 0.6], [bx - 4, 36.6, s.z0 - 0.6]])} fill={shade(c, 0.8)} opacity={0.95} />
        </g>,
      );
    });
  });
  if (on > 0.05) {
    const dots: React.ReactNode[] = [];
    SH.forEach((s, i) => {
      for (let k = 0; k < 9; k++) {
        const q = ((t / 15 + k / 9 + i * 0.13 + siHash(i * 7 + k) * 0.06) % 1 + 1) % 1;
        const x = lerp(-52, 52, q), y = 5 + siHash(k * 3.1 + i) * 26;
        const [px, py] = fetProject(x, y, s.z1 + 0.8);
        const [tx, ty] = fetProject(x - 9, y, s.z1 + 0.8);
        const [fx, fy] = fetProject(x, 36.4, (s.z0 + s.z1) / 2);
        const fade = Math.sin(q * Math.PI);
        dots.push(<line key={`l${i}${k}`} x1={tx} y1={ty} x2={px} y2={py} stroke={accent} strokeWidth={2.2} strokeLinecap="round" opacity={0.55 * on * fade} />);
        dots.push(<circle key={`g${i}${k}`} cx={px} cy={py} r={6} fill={accent} opacity={0.4 * on * fade} />);
        dots.push(<circle key={`t${i}${k}`} cx={px} cy={py} r={2.3} fill="#fff" opacity={0.95 * on * fade} />);
        if (k % 2 === 0) dots.push(<circle key={`f${i}${k}`} cx={fx} cy={fy} r={2.1} fill="#fff" opacity={0.9 * on * fade} />);
      }
    });
    parts.push(<g key="el" style={{mixBlendMode: 'screen'}} opacity={0.3 + 0.7 * cut}>{dots}</g>);
  }
  // gate front half: violet glass when cut away, metal when closed
  const glass = (key: string, x0: number, x1: number, col: string, fa: number) => (
    <g key={key}>
      {solid > 0.01 ? fbox(`${key}s`, x0, x1, 0, 84, 0, zTop, col, {a: solid, stroke: 'rgba(255,255,255,0.3)', sh}) : null}
      {cut > 0.01 ? fbox(`${key}g`, x0, x1, 0, 84, 0, zTop, col, {a: clamp01(cut), fillA: fa + 0.08 * on, stroke: 'rgba(255,255,255,0.62)', sw: 1.1, glow: on * 0.4, glowCol: hot}) : null}
    </g>
  );
  parts.push(glass('gf1', -52, -40, spacer, 0.1));
  parts.push(glass('gf', -40, 40, gateCol, 0.2));
  parts.push(glass('gf2', 40, 52, spacer, 0.1));
  // drain (in front in x) + its contact
  parts.push(epi('drn', 52, 150));
  if (metal > 0.01) parts.push(plug('cd', 88, 118, -15, 15, epiTop, [-34, 24]));
  const lab = (name: string, text: string, sub: string, dx: number, dy: number) => {
    const [x, y] = fetPoint(name);
    const right = dx > 0;
    return (
      <g key={`lb${name}`}>
        <polyline points={`${n2(x)},${n2(y)} ${n2(x + dx * 0.5)},${n2(y + dy)} ${n2(x + dx)},${n2(y + dy)}`} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1} />
        <circle cx={x} cy={y} r={2.4} fill="#fff" />
        <circle cx={x} cy={y} r={5} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={0.8} />
        <text x={x + dx + (right ? 5 : -5)} y={y + dy + 2} textAnchor={right ? 'start' : 'end'} fontFamily={FONT} fontWeight={700} fontSize={14} letterSpacing={1.4} fill="#F4F7FC">{text}</text>
        <text x={x + dx + (right ? 5 : -5)} y={y + dy + 15} textAnchor={right ? 'start' : 'end'} fontFamily={FONT} fontWeight={400} fontSize={9.5} letterSpacing={0.3} fill="#AFC0DA">{sub}</text>
      </g>
    );
  };
  const [gx, gy] = fetProject(0, 20, 50);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`} opacity={opacity}>
      <defs>
        <radialGradient id={`${uid}-halo`}>
          <stop offset="0" stopColor={accent} stopOpacity={0.42} /><stop offset="0.5" stopColor={accent} stopOpacity={0.12} /><stop offset="1" stopColor={accent} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity={0.55} /><stop offset="0.7" stopColor="#000" stopOpacity={0.3} /><stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}-fT`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.3} /><stop offset="0.5" stopColor="#fff" stopOpacity={0.03} /><stop offset="1" stopColor="#000" stopOpacity={0.14} />
        </linearGradient>
        <linearGradient id={`${uid}-fS`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.14} /><stop offset="0.3" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.36} />
        </linearGradient>
      </defs>
      {fl > 0.01 ? <g opacity={fl}>{floorParts}</g> : null}
      {parts}
      {on > 0.02 ? <ellipse cx={gx} cy={gy} rx={210} ry={150} fill={`url(#${uid}-halo)`} opacity={on} style={{mixBlendMode: 'screen'}} /> : null}
      {labels > 0.01 ? (
        <g opacity={labels}>
          {lab('source', 'SOURCE', 'electrons enter here', -58, 44)}
          {lab('drain', 'DRAIN', 'electrons leave here', 64, 34)}
          {lab('gate', 'GATE', 'wraps every sheet on all four sides', 96, -46)}
          {lab('channel', 'NANOSHEETS', 'three stacked silicon channels', -112, 96)}
        </g>
      ) : null}
    </g>
  );
};

/**
 * A field of (simplified) nanosheet transistors on one floor, for the pull-back. Centred on (0,0); the middle device
 * is left out when `children` (the hero `NanosheetFET`, same `scale`) are given - they are drawn at the right depth.
 * `activity` 0..1 = share of gates switching, driven by `t`; `dim` = opacity of the devices, `floor` of the floor.
 */
export const NanosheetField: React.FC<{
  cols: number; rows: number; scale?: number; t?: number; activity?: number; accent?: string; hot?: string; seed?: number;
  /** device pitch in model units along the channel (x) and along the gate (y) */
  pitchX?: number; pitchY?: number; dim?: number; floor?: number; children?: React.ReactNode;
}> = ({cols, rows, scale = 0.3, t = 0, activity = 0.5, accent, hot, seed = 3, pitchX = 470, pitchY = 330, dim = 0.55, floor = 1, children}) => {
  const out: React.ReactNode[] = [];
  const hx = ((cols + 0.4) / 2) * pitchX * scale, hy = ((rows + 0.4) / 2) * pitchY * scale;
  const P = (x: number, y: number) => fetProject(x, y, 0).map(n2).join(',');
  // fin tracks on the floor
  const tracks: string[] = [];
  for (let j = 0; j < rows; j++) {
    const y = (j - (rows - 1) / 2) * pitchY * scale;
    [-36, 36].forEach((o) => {
      const a = fetProject(-hx, y + o * scale, 0), b = fetProject(hx, y + o * scale, 0);
      tracks.push(`M${n2(a[0])} ${n2(a[1])}L${n2(b[0])} ${n2(b[1])}`);
    });
  }
  // draw back to front (x + y ascending)
  for (let s = 0; s < cols + rows - 1; s++) {
    for (let i = 0; i < cols; i++) {
      const j = s - i;
      if (j < 0 || j >= rows) continue;
      const a = i - (cols - 1) / 2, b = j - (rows - 1) / 2;
      if (children && Math.abs(a) < 0.6 && Math.abs(b) < 0.6) {
        out.push(<g key="hero">{children}</g>);
        continue;
      }
      if (dim <= 0.01) continue;
      const [x, y] = fetProject(a * pitchX * scale, b * pitchY * scale, 0);
      const ph = siHash(i * 13.7 + j * 5.3 + seed);
      const g = activity > 0 ? clamp01((Math.sin(t / (5 + ph * 6) + ph * 30) - (1 - activity * 1.4)) * 3) : 0;
      out.push(<NanosheetFET key={`${i}-${j}`} cx={x} cy={y} scale={scale} gate={g} lite accent={accent} hot={hot} opacity={dim} />);
    }
  }
  return (
    <g>
      {floor > 0.01 ? (
        <g opacity={floor}>
          <polygon points={`${P(-hx, -hy)} ${P(hx, -hy)} ${P(hx, hy)} ${P(-hx, hy)}`} fill="#141C32" stroke="rgba(160,190,255,0.25)" strokeWidth={1.5} />
          <path d={tracks.join('')} stroke="rgba(150,185,255,0.12)" strokeWidth={Math.max(1, 3 * scale)} fill="none" />
        </g>
      ) : null}
      {out}
    </g>
  );
};

export {alpha};
