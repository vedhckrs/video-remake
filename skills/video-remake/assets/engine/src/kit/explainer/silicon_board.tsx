// Silicon kit - the logic board (26 Nov 2026). `LogicBoard` draws a phone main board in the iPhone style: near-black
// multi-layer PCB with an L outline and a stacked "sandwich" (upper RF board on an interposer ring), copper edge
// plating, trace bundles and serpentine pairs under the solder mask, vias, ENIG test points, tiny silkscreen, hundreds
// of real-scale passives (01005 / 0201 / 0402 capacitors, resistors, power inductors), soldered shield fences and
// cans, board-to-board connectors with flex cables, standoffs, antenna clips, thermal patches - and the chips, each
// addressable by id (`parts={{soc: {lift, glow, xray, explode, highlight, opacity}}}`).
// Plan mm inside a `SiScene`; the default layout (`iphoneBoard`) is 72 x 40 mm. `SiChassis` adds the phone interior
// around it (battery, camera can, frame rail) for full-bleed shots.
import React, {useMemo} from 'react';
import {SI, SiExtrude, SiPrism, SiText, SiTop, clamp01, dot, rr, siHash, siRng, siView, useSi, type P2} from './silicon_core';
import {SiChip, SiClip, SiConnector, SiPassives, SiPatch, SiStandoff, SiWall, SI_ROLES, type ChipKind, type ChipMark, type ChipRole, type Passive, type PassiveType, type SiChipProps} from './silicon_chips';
import {shade, tint} from './tokens';

const n3 = (v: number) => Math.round(v * 1000) / 1000;

// ---- layout ------------------------------------------------------------------------------------------------------------
/** 0 = main board, 1 = upper (stacked) board, 2 = on the main board UNDER the upper one (seen when `explode` > 0) */
export type BoardLevel = 0 | 1 | 2;
export type BoardPart = {
  id: string; type: 'chip' | 'connector' | 'standoff' | 'clip' | 'patch' | 'wall';
  level: BoardLevel; x: number; y: number; w: number; d: number; h: number;
  role?: ChipRole; kind?: ChipKind; mark?: ChipMark;
  /** extra props for the part component */
  props?: Record<string, unknown>;
};
type Cluster = {id: string; level: BoardLevel; type: PassiveType; h: number; items: Passive[]; x: number; y: number; w: number; d: number};
export type BoardLayout = {
  seed: number; parts: BoardPart[]; clusters: Cluster[];
  /** plan outline of the main board and of the upper board (clockwise) */
  outline: P2[]; upper: {x: number; y: number; w: number; d: number};
  /** thickness of the main board, interposer and upper board (mm) */
  t0: number; ti: number; t1: number;
  order: {key: string; level: BoardLevel; part?: BoardPart; cluster?: Cluster}[];
  art: Record<0 | 1, {traces: string[][]; serp: string; vias: string; viaHi: string; tests: string; testHi: string; pads: string; fid: string; ao: string; silk: {x: number; y: number; s: string; rot: number}[]; pour: string; code: string}>;
};

export const BOARD_T0 = 0.8, BOARD_TI = 1.0, BOARD_T1 = 0.5;
const UP = {x: 45, y: 0, w: 27, d: 26};
const OUTLINE: P2[] = [[0, 0], [72, 0], [72, 26], [22, 26], [22, 40], [0, 40]];
const inMain = (x: number, y: number) => x >= 0 && y >= 0 && x <= 72 && (x <= 22 ? y <= 40 : y <= 26);

type Size = {type: PassiveType; l: number; w: number; h: number; weight: number; maxN: number};
const SIZES: Size[] = [
  {type: 'cap', l: 0.4, w: 0.2, h: 0.2, weight: 0.3, maxN: 10},       // 01005
  {type: 'cap', l: 0.6, w: 0.3, h: 0.3, weight: 0.27, maxN: 8},       // 0201
  {type: 'cap', l: 1.0, w: 0.5, h: 0.5, weight: 0.09, maxN: 5},       // 0402
  {type: 'res', l: 0.6, w: 0.3, h: 0.23, weight: 0.12, maxN: 7},
  {type: 'capDark', l: 1.6, w: 0.8, h: 0.8, weight: 0.04, maxN: 3},
  {type: 'ind', l: 1.6, w: 1.6, h: 1.0, weight: 0.05, maxN: 2},
  {type: 'indTan', l: 1.2, w: 1.0, h: 0.8, weight: 0.05, maxN: 3},
  {type: 'ind', l: 2.0, w: 2.0, h: 1.0, weight: 0.03, maxN: 2},
  {type: 'ic', l: 1.4, w: 1.4, h: 0.5, weight: 0.05, maxN: 1},
  {type: 'ic', l: 2.2, w: 1.8, h: 0.55, weight: 0.03, maxN: 1},
  {type: 'icSi', l: 1.2, w: 1.2, h: 0.35, weight: 0.04, maxN: 1},
  {type: 'icSi', l: 1.9, w: 1.5, h: 0.38, weight: 0.03, maxN: 1},
  {type: 'res', l: 0.4, w: 0.2, h: 0.15, weight: 0.1, maxN: 9},
  {type: 'xtal', l: 2.0, w: 1.6, h: 0.5, weight: 0.012, maxN: 1},
];

const chip = (id: string, level: BoardLevel, role: ChipRole, x: number, y: number, w: number, d: number, extra: Partial<BoardPart> = {}): BoardPart =>
  ({id, type: 'chip', level, role, x, y, w, d, h: SI_ROLES[role].h, ...extra});

/** The default phone logic board. Part ids: soc, modem, wireless, transceiver, rf1, fem1, fem2, can1, can2, pmic,
 *  charger, audio, nfc, enclave, uwb, rf2, nand (under the upper board), pmic2, j1..j6, so1..so5. */
export const iphoneBoard = (seed = 7, density = 1): BoardLayout => {
  const parts: BoardPart[] = [
    // ---- main board, left wing + leg
    {id: 'so1', type: 'standoff', level: 0, x: 1.0, y: 1.0, w: 2.8, d: 2.8, h: 1.1, props: {gold: true}},
    {id: 'so2', type: 'standoff', level: 0, x: 1.0, y: 36.2, w: 2.8, d: 2.8, h: 1.1, props: {screw: true}},
    {id: 'so3', type: 'standoff', level: 0, x: 18.2, y: 36.2, w: 2.8, d: 2.8, h: 1.1, props: {gold: true}},
    {id: 'j1', type: 'connector', level: 0, x: 5.2, y: 1.0, w: 11.5, d: 2.6, h: 1.1, props: {plugged: true, flex: 'y-', flexLen: 14}},
    {id: 'j2', type: 'connector', level: 0, x: 1.0, y: 6.4, w: 2.5, d: 9.6, h: 0.6, props: {gold: true}},
    {id: 'can1', type: 'chip', level: 0, kind: 'shield', x: 5.4, y: 5.4, w: 8.8, d: 8.2, h: 0.95, props: {perf: true, sticker: true}},
    chip('audio', 0, 'audio', 15.6, 5.6, 3.4, 3.2),
    chip('charger', 0, 'charger', 15.4, 10.2, 4.2, 3.6),
    chip('pmic', 0, 'pmic', 5.6, 18.2, 6.4, 6.4),
    chip('nfc', 0, 'nfc', 5.8, 27.0, 3.8, 3.6),
    chip('enclave', 0, 'enclave', 11.2, 27.2, 3.0, 3.0),
    {id: 'j3', type: 'connector', level: 0, x: 5.6, y: 33.6, w: 10.6, d: 2.5, h: 1.1, props: {plugged: true, flex: 'y+', flexLen: 12}},
    {id: 'j4', type: 'connector', level: 0, x: 16.0, y: 27.6, w: 4.6, d: 2.3, h: 0.6, props: {}},
    {id: 'clip1', type: 'clip', level: 0, x: 0.35, y: 19.5, w: 0.9, d: 1.6, h: 0.5},
    {id: 'clip2', type: 'clip', level: 0, x: 0.35, y: 29.5, w: 0.9, d: 1.6, h: 0.5},
    // ---- main board, centre: the SoC inside its fence
    chip('soc', 0, 'soc', 26.4, 7.2, 13.6, 11.0),
    {id: 'j5', type: 'connector', level: 0, x: 23.6, y: 0.9, w: 9.4, d: 2.4, h: 0.6, props: {}},
    chip('uwb', 0, 'uwb', 23.4, 21.6, 3.3, 3.2),
    chip('rf2', 0, 'rf', 28.2, 21.8, 2.8, 2.8),
    {id: 'so4', type: 'standoff', level: 0, x: 40.6, y: 21.9, w: 2.8, d: 2.8, h: 1.1, props: {screw: true}},
    {id: 'clip3', type: 'clip', level: 0, x: 36.0, y: 24.9, w: 1.6, d: 0.9, h: 0.5},
    // ---- upper board (stacked on the interposer)
    chip('modem', 1, 'modem', 47.4, 2.0, 9.6, 8.6),
    chip('transceiver', 1, 'transceiver', 58.6, 2.2, 5.0, 5.0),
    chip('rf1', 1, 'rf', 65.2, 2.4, 3.8, 3.8),
    chip('wireless', 1, 'wireless', 58.6, 9.6, 7.0, 6.2),
    chip('fem1', 1, 'fem', 47.4, 12.4, 4.2, 4.0),
    chip('fem2', 1, 'fem', 52.8, 12.4, 4.2, 4.0, {mark: {title: 'FEM', lines: ['LB  2637']}}),
    {id: 'can2', type: 'chip', level: 1, kind: 'shield', x: 47.2, y: 18.2, w: 10.4, d: 6.6, h: 0.95, props: {sticker: true}},
    {id: 'j6', type: 'connector', level: 1, x: 59.4, y: 21.4, w: 9.8, d: 2.5, h: 1.1, props: {plugged: true, flex: 'y+', flexLen: 13}},
    {id: 'so5', type: 'standoff', level: 1, x: 68.2, y: 16.6, w: 2.8, d: 2.8, h: 1.1, props: {screw: true}},
    {id: 'pad1', type: 'patch', level: 1, x: 66.3, y: 7.8, w: 3.2, d: 7.4, h: 0.05, props: {kind: 'graphite'}},
    {id: 'clip4', type: 'clip', level: 1, x: 70.4, y: 0.5, w: 1.2, d: 1.5, h: 0.5},
    // ---- on the main board under the upper one (visible when the sandwich opens)
    chip('nand', 2, 'nand', 49.4, 5.4, 11.5, 13.0),
    chip('pmic2', 2, 'pmic', 63.0, 5.6, 5.4, 5.4, {mark: {title: 'PMU', lines: ['PM-18B  2635']}}),
    chip('dram2', 2, 'audio', 63.2, 14.0, 3.6, 3.6),
  ];
  // shield fences (four walls each, so the depth sorter can interleave the parts inside)
  const fence = (id: string, level: BoardLevel, x: number, y: number, w: number, d: number) => {
    const t = 0.13, h = 0.55;
    parts.push({id: `${id}n`, type: 'wall', level, x, y, w, d: t, h}, {id: `${id}w`, type: 'wall', level, x, y: y + t, w: t, d: d - 2 * t, h},
               {id: `${id}s`, type: 'wall', level, x, y: y + d - t, w, d: t, h}, {id: `${id}e`, type: 'wall', level, x: x + w - t, y: y + t, w: t, d: d - 2 * t, h});
  };
  fence('fs', 0, 24.4, 4.4, 18.0, 16.2);     // around the SoC
  fence('fp', 0, 4.4, 16.6, 16.4, 15.0);     // power section
  fence('fr', 1, 57.9, 1.4, 12.0, 15.2);     // RF section on the upper board

  // ---- passives ----
  const r = siRng(seed);
  const occ: {x: number; y: number; w: number; d: number; level: BoardLevel}[] = parts.map((p) => {
    const m = p.type === 'chip' ? 0.5 : p.type === 'wall' ? 0.14 : p.type === 'standoff' ? 0.75 : 0.3;
    return {x: p.x - m, y: p.y - m, w: p.w + 2 * m, d: p.d + 2 * m, level: p.level};
  });
  const clusters: Cluster[] = [];
  const free = (level: BoardLevel, x: number, y: number, w: number, d: number) => {
    const inside = (px: number, py: number) => level === 0 ? inMain(px, py) && px > 0.5 && py > 0.5 && px < 44.3 && (px <= 22 ? py < 39.5 && px < 21.5 : py < 25.5)
      : level === 1 ? px > 45.7 && px < 71.3 && py > 0.7 && py < 25.3 : px > 47 && px < 70 && py > 2 && py < 24;
    if (!inside(x, y) || !inside(x + w, y) || !inside(x, y + d) || !inside(x + w, y + d)) return false;
    for (const o of occ) if (o.level === level && x < o.x + o.w && x + w > o.x && y < o.y + o.d && y + d > o.y) return false;
    return true;
  };
  const add = (level: BoardLevel, s: Size, x: number, y: number, cols: number, rows: number, along: 'x' | 'y', force = false) => {
    const gapL = s.l > 1.1 ? 0.22 : 0.16, gapW = s.w > 0.9 ? 0.22 : 0.14;
    const px = (along === 'x' ? s.l + gapL : s.w + gapW), py = (along === 'x' ? s.w + gapW : s.l + gapL);
    const w = cols * px - (along === 'x' ? gapL : gapW), d = rows * py - (along === 'x' ? gapW : gapL);
    if (!force && !free(level, x - 0.12, y - 0.12, w + 0.24, d + 0.24)) return false;
    const items: Passive[] = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) items.push({x: n3(x + i * px), y: n3(y + j * py), l: s.l, w: s.w, along});
    clusters.push({id: `c${clusters.length}`, level, type: s.type, h: s.h, items, x, y, w, d});
    occ.push({x: x - 0.14, y: y - 0.14, w: w + 0.28, d: d + 0.28, level});
    return true;
  };
  const S = (i: number) => SIZES[i];
  // decoupling rings around the SoC (rows hug the package, like the real board)
  add(0, S(1), 26.6, 5.2, 28, 2, 'y');
  add(0, S(1), 25.0, 7.4, 1, 22, 'x');
  add(0, S(2), 26.8, 18.9, 11, 1, 'x');
  add(0, S(0), 40.9, 7.3, 2, 30, 'x');
  // power section: inductor bank + bulk caps beside the PMIC
  add(0, S(7), 13.1, 17.8, 2, 3, 'x');
  add(0, S(4), 17.9, 17.9, 1, 6, 'x');
  add(0, S(4), 5.4, 25.3, 4, 1, 'x');
  add(0, S(2), 13.4, 24.9, 6, 1, 'y');
  add(0, S(5), 32.0, 20.9, 3, 2, 'x');
  // RF section
  add(1, S(1), 58.4, 17.0, 12, 1, 'y');
  // under the upper board
  add(2, S(7), 62.8, 19.0, 3, 2, 'x');
  add(2, S(2), 49.6, 19.4, 9, 2, 'y');
  add(2, S(1), 49.6, 2.6, 22, 3, 'y');
  // random fill
  const total = SIZES.reduce((a, s) => a + s.weight, 0);
  const tries = Math.round(9000 * density);
  for (let i = 0; i < tries; i++) {
    let q = r() * total, si = 0;
    while (si < SIZES.length - 1 && q > SIZES[si].weight) { q -= SIZES[si].weight; si++; }
    const s = SIZES[si];
    const lv = r();
    const level: BoardLevel = lv < 0.62 ? 0 : lv < 0.9 ? 1 : 2;
    const along: 'x' | 'y' = r() > 0.5 ? 'x' : 'y';
    const a = 1 + Math.floor(r() * s.maxN), b = r() > 0.6 ? 1 + Math.floor(r() * Math.min(3, s.maxN)) : 1;
    const x = level === 0 ? r() * 44 : 45 + r() * 27, y = r() * (level === 0 ? 40 : 26);
    add(level, s, n3(Math.round(x * 10) / 10), n3(Math.round(y * 10) / 10), along === 'x' ? b : a, along === 'x' ? a : b, along);
  }

  // ---- depth order (painter): A before B when A is entirely behind B in x or in y ----
  type It = {key: string; level: BoardLevel; x0: number; y0: number; x1: number; y1: number; part?: BoardPart; cluster?: Cluster};
  const items: It[] = [
    ...parts.map((p) => ({key: p.id, level: p.level, x0: p.x, y0: p.y, x1: p.x + p.w, y1: p.y + p.d, part: p})),
    ...clusters.map((c) => ({key: c.id, level: c.level, x0: c.x, y0: c.y, x1: c.x + c.w, y1: c.y + c.d, cluster: c})),
  ];
  const order: BoardLayout['order'] = [];
  ([0, 2, 1] as BoardLevel[]).forEach((lv) => {
    const list = items.filter((i) => i.level === lv).sort((a, b) => (a.x0 + a.x1 + a.y0 + a.y1) - (b.x0 + b.x1 + b.y0 + b.y1));
    const n = list.length;
    const behind = (a: It, b: It) => {   // a must be drawn before b
      const ax = a.x1 <= b.x0 + 0.02, ay = a.y1 <= b.y0 + 0.02, bx = b.x1 <= a.x0 + 0.02, by = b.y1 <= a.y0 + 0.02;
      return (ax || ay) && !(bx || by);
    };
    const indeg = new Array<number>(n).fill(0);
    const out: number[][] = list.map(() => []);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && behind(list[i], list[j])) { out[i].push(j); indeg[j]++; }
    const done = new Array<boolean>(n).fill(false);
    for (let k = 0; k < n; k++) {
      let pick = -1;
      for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0) { pick = i; break; }
      if (pick < 0) for (let i = 0; i < n; i++) if (!done[i]) { pick = i; break; }
      done[pick] = true;
      out[pick].forEach((j) => indeg[j]--);
      const it = list[pick];
      order.push({key: it.key, level: it.level, part: it.part, cluster: it.cluster});
    }
  });

  // ---- board art (plan paths, batched) ----
  const mkArt = (lv: 0 | 1) => {
    const ra = siRng(seed * 3 + lv * 17 + 1);
    const bx0 = lv === 0 ? 0 : UP.x, bx1 = lv === 0 ? 72 : UP.x + UP.w, by1 = lv === 0 ? 40 : 26;
    // trace bundles: polylines with 45-degree jogs; drawn as nested strokes -> parallel lines that follow every bend
    const traces: string[][] = [[], [], [], []];
    const nb = lv === 0 ? 64 : 30;
    for (let i = 0; i < nb; i++) {
      let x = bx0 + ra() * (bx1 - bx0), y = ra() * by1;
      let dir = Math.floor(ra() * 4);
      let dpath = `M${n3(x)} ${n3(y)}`;
      const segs = 2 + Math.floor(ra() * 4);
      for (let s = 0; s < segs; s++) {
        const len = 2 + ra() * 9;
        const dx = [1, 0, -1, 0][dir], dy = [0, 1, 0, -1][dir];
        x += dx * len; y += dy * len;
        dpath += `L${n3(x)} ${n3(y)}`;
        const turn = ra() > 0.5 ? 1 : 3, nd = (dir + turn) % 4, j = 0.6 + ra() * 1.6;
        x += (dx + [1, 0, -1, 0][nd]) * j; y += (dy + [0, 1, 0, -1][nd]) * j;
        dpath += `L${n3(x)} ${n3(y)}`;
        dir = nd;
      }
      traces[Math.floor(ra() * 4)].push(dpath);
    }
    // serpentine (length-matched) pairs
    let serp = '';
    for (let i = 0; i < (lv === 0 ? 9 : 5); i++) {
      const x = bx0 + 2 + ra() * (bx1 - bx0 - 12), y = 1.5 + ra() * (by1 - 4), n = 5 + Math.floor(ra() * 8), amp = 0.5 + ra() * 0.7, pitch = 0.42;
      const horiz = ra() > 0.4;
      serp += horiz ? `M${n3(x - 2)} ${n3(y)}H${n3(x)}` : `M${n3(x)} ${n3(y - 2)}V${n3(y)}`;
      for (let k = 0; k < n; k++) {
        serp += horiz ? `v${n3(k % 2 ? amp : -amp)}h${pitch}v${n3(k % 2 ? -amp : amp)}h${pitch}` : `h${n3(k % 2 ? amp : -amp)}v${pitch}h${n3(k % 2 ? -amp : amp)}v${pitch}`;
      }
      serp += horiz ? 'h2.5' : 'v2.5';
    }
    let vias = '', viaHi = '', tests = '', testHi = '', fid = '';
    const nv = lv === 0 ? 620 : 300;
    for (let i = 0; i < nv; i++) {
      const x = bx0 + 0.5 + ra() * (bx1 - bx0 - 1), y = 0.5 + ra() * (by1 - 1);
      // short via rows / stitching
      const k = ra() > 0.75 ? 3 + Math.floor(ra() * 6) : 1, hz = ra() > 0.5;
      for (let q = 0; q < k; q++) {
        const vx = x + (hz ? q * 0.34 : 0), vy = y + (hz ? 0 : q * 0.34);
        vias += dot(vx, vy, 0.085);
        viaHi += dot(vx, vy, 0.04);
      }
    }
    const tp = lv === 0 ? [[34.6, 1.0, 7, 3], [1.2, 24.0, 2, 5]] : [[59.0, 17.6, 9, 2], [46.6, 25.0 - 0.9, 2, 1]];
    tp.forEach(([x, y, c, w]) => {
      for (let i = 0; i < c; i++) for (let j = 0; j < w; j++) {
        tests += dot(x + i * 0.95, y + j * 0.95, 0.3);
        testHi += dot(x + i * 0.95 - 0.08, y + j * 0.95 - 0.08, 0.1);
      }
    });
    for (let i = 0; i < (lv === 0 ? 26 : 12); i++) fid += dot(bx0 + 1 + ra() * (bx1 - bx0 - 2), 1 + ra() * (by1 - 2), 0.13);
    // copper pours showing faintly under the mask
    let pour = '';
    for (let i = 0; i < (lv === 0 ? 16 : 8); i++) pour += rr(bx0 + ra() * (bx1 - bx0 - 8), ra() * (by1 - 5), 3 + ra() * 9, 2 + ra() * 5, 0.5);
    // pads + contact shadows under every passive
    let pads = '', ao = '';
    clusters.filter((c) => (lv === 0 ? c.level === 0 || c.level === 2 : c.level === 1)).forEach((c) => {
      c.items.forEach((it) => {
        const X = it.along === 'x', bw = X ? it.l : it.w, bd = X ? it.w : it.l;
        if (c.type === 'ind' || c.type === 'indTan' || c.type === 'xtal' || c.type === 'ic' || c.type === 'icSi') pads += rr(it.x - 0.07, it.y - 0.07, bw + 0.14, bd + 0.14, 0.05);
        else if (X) pads += rr(it.x - 0.07, it.y - 0.05, it.l * 0.3 + 0.07, bd + 0.1, 0.04) + rr(it.x + bw - it.l * 0.3, it.y - 0.05, it.l * 0.3 + 0.07, bd + 0.1, 0.04);
        else pads += rr(it.x - 0.05, it.y - 0.07, bw + 0.1, it.l * 0.3 + 0.07, 0.04) + rr(it.x - 0.05, it.y + bd - it.l * 0.3, bw + 0.1, it.l * 0.3 + 0.07, 0.04);
        if (c.level !== 2) ao += rr(it.x - 0.05 + c.h * 0.22, it.y - 0.03 - c.h * 0.06, bw + 0.1, bd + 0.1, 0.05);
      });
    });
    // tiny silkscreen reference designators
    const silk: {x: number; y: number; s: string; rot: number}[] = [];
    clusters.filter((c) => c.level === lv).forEach((c, i) => {
      if (siHash(i * 7.7 + seed) > 0.26) return;
      const pre = c.type === 'res' ? 'R' : c.type.startsWith('ind') ? 'L' : c.type.startsWith('ic') ? 'U' : c.type === 'xtal' ? 'Y' : 'C';
      silk.push({x: c.x, y: c.y - 0.16, s: `${pre}${Math.floor(1000 + siHash(i * 3.1 + seed) * 8000)}`, rot: 0});
    });
    // laser-marked 2D code on the board itself
    let code = '';
    const cx = lv === 0 ? 18.2 : 46.3, cy = lv === 0 ? 1.2 : 0.9, cs = 0.11;
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (i === 0 || j === 11 || ra() > 0.55) code += `M${n3(cx + i * cs)} ${n3(cy + j * cs)}h${cs}v${cs}h${-cs}Z`;
    return {traces, serp, vias, viaHi, tests, testHi, pads, fid, ao, silk, pour, code};
  };
  return {seed, parts, clusters, outline: OUTLINE, upper: UP, t0: BOARD_T0, ti: BOARD_TI, t1: BOARD_T1, order, art: {0: mkArt(0), 1: mkArt(1)}};
};

const LAYOUTS = new Map<string, BoardLayout>();
/** Cached default layout. */
export const boardLayout = (seed = 7, density = 1) => {
  const k = `${seed}|${density}`;
  let l = LAYOUTS.get(k);
  if (!l) { l = iphoneBoard(seed, density); LAYOUTS.set(k, l); }
  return l;
};

/** z (mm) of the surface a part of this level sits on, for a board at z = 0. `explode` lifts the upper board. */
export const boardLevelZ = (level: BoardLevel, explode = 0) => (level === 1 ? BOARD_T0 + BOARD_TI + BOARD_T1 + explode * 7 : BOARD_T0);
/** Plan centre + top z of a part: `[x, y, z]` (feed it to `siPoint` for camera anchors and callouts). */
export const boardPartTop = (id: string, layout: BoardLayout = boardLayout(), explode = 0, lift = 0): [number, number, number] => {
  const p = layout.parts.find((k) => k.id === id) ?? layout.parts[0];
  return [p.x + p.w / 2, p.y + p.d / 2, boardLevelZ(p.level, explode) + p.h + lift];
};
/** Screen px of a part's top centre. */
export const boardPartPoint = (id: string, u: number, tilt: number, origin: P2, layout: BoardLayout = boardLayout(), explode = 0, lift = 0): P2 => {
  const [x, y, z] = boardPartTop(id, layout, explode, lift);
  const p = siView(u, tilt).P(x, y, z);
  return [origin[0] + p[0], origin[1] + p[1]];
};

// ---- board surfaces ----------------------------------------------------------------------------------------------------
const outlinePath = (pts: P2[], r: number) => {
  // rounded polygon
  let d = '';
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
    const a: P2 = [p1[0] + (v1[0] / l1) * r, p1[1] + (v1[1] / l1) * r], b: P2 = [p1[0] + (v2[0] / l2) * r, p1[1] + (v2[1] / l2) * r];
    d += `${i === 0 ? 'M' : 'L'}${n3(a[0])} ${n3(a[1])}Q${n3(p1[0])} ${n3(p1[1])} ${n3(b[0])} ${n3(b[1])}`;
  }
  return d + 'Z';
};

const Surface = React.memo<{layout: BoardLayout; lv: 0 | 1; z: number; skip: string}>(({layout, lv, z, skip}) => {
  const {id, L} = useSi();
  const a = layout.art[lv];
  const pts: P2[] = lv === 0 ? layout.outline : [[UP.x, UP.y], [UP.x + UP.w, UP.y], [UP.x + UP.w, UP.y + UP.d], [UP.x, UP.y + UP.d]];
  const d = outlinePath(pts, lv === 0 ? 1.1 : 0.9);
  const clip = `${id}-bclip${lv}`;
  const skipIds = skip.split(',');
  // cast shadows of the big parts (offset along the light, longer for taller parts)
  let cast = '', seat = '';
  layout.parts.filter((p) => (lv === 0 ? p.level === 0 : p.level === 1) && p.type !== 'patch' && !skipIds.includes(p.id)).forEach((p) => {
    const k = p.type === 'wall' ? 0.5 : 0.85;
    cast += rr(p.x + L[0] * p.h * k + 0.05, p.y + L[1] * p.h * k * 0.5 + 0.1, p.w, p.d, 0.25);
    seat += rr(p.x - 0.1, p.y - 0.1, p.w + 0.2, p.d + 0.2, 0.2);
  });
  const sw = [0.085, 0.07, 0.1, 0.06];
  return (
    <SiTop z={z}>
      <defs>
        <clipPath id={clip}><path d={d} /></clipPath>
        <linearGradient id={`${id}-mask${lv}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={72} y2={40}>
          <stop offset="0" stopColor={SI.maskHi} /><stop offset="0.45" stopColor={SI.mask} /><stop offset="1" stopColor={SI.maskLo} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}-mask${lv})`} />
      <g clipPath={`url(#${clip})`}>
        <path d={a.pour} fill="#fff" opacity={0.022} />
        {/* trace bundles: nested strokes = parallel copper lines under the mask */}
        {a.traces.map((t, i) => {
          const n = 3 + i, pitch = sw[i] * 2.3;
          return (
            <g key={i} fill="none" strokeLinejoin="round">
              {Array.from({length: n}).map((_, k) => {
                const wOut = (n - k) * pitch * 2 - pitch + sw[i];
                return [
                  <path key={`a${k}`} d={t.join('')} stroke={SI.trace} strokeWidth={n3(wOut)} />,
                  <path key={`b${k}`} d={t.join('')} stroke={SI.mask} strokeWidth={n3(wOut - sw[i] * 2)} />,
                ];
              })}
            </g>
          );
        })}
        <path d={a.serp} fill="none" stroke="#2A3545" strokeWidth={0.26} strokeLinejoin="round" />
        <path d={a.serp} fill="none" stroke={SI.mask} strokeWidth={0.1} strokeLinejoin="round" />
        <path d={a.vias} fill="#06070A" />
        <path d={a.vias} fill="none" stroke="#3A4658" strokeWidth={0.035} />
        <path d={a.viaHi} fill="#000" />
        <path d={a.fid} fill={SI.copper} opacity={0.85} />
        <path d={a.tests} fill={`url(#${id}-gold)`} />
        <path d={a.testHi} fill="#FFF6D0" opacity={0.75} />
        <path d={a.code} fill="#8D96A3" opacity={0.6} />
        {a.silk.map((s, i) => <SiText key={i} x={s.x} y={s.y} size={0.26} anchor="start" fill="#C8CED6" opacity={0.42} spacing={2}>{s.s}</SiText>)}
        {/* solder pads / fillets under the passives */}
        <path d={a.pads} fill={SI.solder} opacity={0.82} />
        {/* glossy solder mask: soft environment + the travelling light */}
        <path d={d} fill={`url(#${id}-env)`} opacity={0.15} />
        <path d={d} fill={`url(#${id}-rimenv)`} opacity={0.2} />
        <path d={d} fill={`url(#${id}-sweep)`} opacity={0.2} />
        {/* ambient occlusion + cast shadows */}
        <path d={a.ao} fill="#000" opacity={0.6} filter={`url(#${id}-soft1)`} />
        <path d={seat} fill="#000" opacity={0.6} filter={`url(#${id}-soft1)`} />
        <path d={cast} fill="#000" opacity={0.5} filter={`url(#${id}-soft2)`} />
      </g>
      {/* plated board edge */}
      <path d={d} fill="none" stroke={`url(#${id}-copper)`} strokeWidth={0.13} opacity={0.75} />
      <path d={d} fill="none" stroke="#fff" strokeWidth={0.04} opacity={0.3} />
    </SiTop>
  );
});

// ---- the board ---------------------------------------------------------------------------------------------------------
export type BoardPartState = Partial<Pick<SiChipProps, 'lift' | 'glow' | 'glowColor' | 'xray' | 'dieActive' | 'explode' | 'explodeGap' | 'highlight' | 'highlightColor' | 'opacity' | 'open' | 'mark' | 'gloss' | 'kind'>> & {hide?: boolean};

const EDGE_BANDS = [{at: 0.2, color: SI.copperLo, w: 0.05}, {at: 0.42, color: '#8A5530', w: 0.04}, {at: 0.64, color: SI.copperLo, w: 0.05}, {at: 0.9, color: SI.copper, w: 0.09}];

const PartView: React.FC<{p: BoardPart; z: number; st?: BoardPartState}> = ({p, z, st}) => {
  if (st?.hide) return null;
  if (p.type === 'chip') {
    return <SiChip x={p.x} y={p.y} w={p.w} d={p.d} z={z} h={p.h} role={p.role} seed={p.x * 3.1 + p.y * 7.7}
                   {...(p.props as Partial<SiChipProps>)} {...st} kind={st?.kind ?? p.kind} mark={{...(p.mark ?? {}), ...(st?.mark ?? {})}} />;
  }
  if (p.type === 'connector') return <SiConnector x={p.x} y={p.y} w={p.w} d={p.d} z={z} seed={p.x} opacity={st?.opacity} lift={st?.lift} {...(p.props as object)} />;
  if (p.type === 'standoff') return <SiStandoff x={p.x + p.w / 2} y={p.y + p.d / 2} z={z} r={p.w / 2 - 0.15} h={p.h} opacity={st?.opacity} {...(p.props as object)} />;
  if (p.type === 'clip') return <SiClip x={p.x} y={p.y} w={p.w} d={p.d} z={z} opacity={st?.opacity} />;
  if (p.type === 'wall') return <SiWall x={p.x} y={p.y} w={p.w} d={p.d} z={z} h={p.h} opacity={st?.opacity} />;
  return <SiPatch x={p.x} y={p.y} w={p.w} d={p.d} z={z} opacity={st?.opacity} {...(p.props as object)} />;
};

/**
 * The logic board. Must be inside a `SiScene`. Board origin = plan (0,0), its underside at `z`.
 * `parts` = per-part animation state by id (see `iphoneBoard` for the ids); `explode` 0..1 lifts the upper board off
 * its interposer and shows what is underneath; `focus` + `dim` darken everything except the named part(s);
 * `passives` 0..1 fades all passives (build-up); children are drawn last, in the same plan space.
 */
export const LogicBoard: React.FC<{
  z?: number; seed?: number; density?: number; layout?: BoardLayout; explode?: number;
  parts?: Record<string, BoardPartState>; focus?: string | string[]; dim?: number; passives?: number; children?: React.ReactNode;
}> = ({z = 0, seed = 7, density = 1, layout, explode = 0, parts = {}, focus, dim = 0, passives = 1, children}) => {
  const {id} = useSi();
  const lay = layout ?? boardLayout(seed, density);
  const z0 = z + lay.t0;
  const ex = Math.max(0, explode);
  const zi = z0 + lay.ti;                         // interposer top
  const zu = zi + ex * 7;                         // upper board underside
  const z1 = zu + lay.t1;                         // upper board top
  const skip = useMemo(() => Object.entries(parts).filter(([, s]) => (s.lift ?? 0) > 0.02 || (s.explode ?? 0) > 0.004 || s.hide).map(([k]) => k).sort().join(','), [parts]);
  const U = lay.upper;
  const upPts: P2[] = [[U.x, U.y], [U.x + U.w, U.y], [U.x + U.w, U.y + U.d], [U.x, U.y + U.d]];
  const focusIds = focus ? (Array.isArray(focus) ? focus : [focus]) : [];
  const renderLevel = (lv: BoardLevel, zz: number) => lay.order.filter((o) => o.level === lv).map((o) =>
    o.part ? <PartView key={o.key} p={o.part} z={zz} st={parts[o.key]} />
           : passives > 0.01 ? <SiPassives key={o.key} items={o.cluster!.items} type={o.cluster!.type} h={o.cluster!.h} z={zz} opacity={passives < 1 ? passives : undefined} /> : null);
  // interposer ring: rows of solder dots (the wall between the two boards)
  const ring = useMemo(() => {
    let dots = '';
    for (let k = 0; k < 3; k++) {
      const o = 0.3 + k * 0.38;
      for (let x = U.x + o; x <= U.x + U.w - o; x += 0.42) dots += dot(x, U.y + o, 0.13) + dot(x, U.y + U.d - o, 0.13);
      for (let y = U.y + o + 0.42; y <= U.y + U.d - o - 0.42; y += 0.42) dots += dot(U.x + o, y, 0.13) + dot(U.x + U.w - o, y, 0.13);
    }
    return dots;
  }, [U]);
  return (
    <g>
      {/* main board */}
      <SiExtrude pts={lay.outline} z={z} h={lay.t0} color="#3A2A1C" bands={EDGE_BANDS} />
      <Surface layout={lay} lv={0} z={z0} skip={skip} />
      {renderLevel(0, z0)}
      {/* interposer wall + what sits inside it */}
      <SiPrism x={U.x} y={U.y} w={U.w} d={U.d} z={z0} h={lay.ti} color="#7A4A26" edge={0.3} />
      {ex > 0.01 ? (
        <>
          <SiTop z={z0}><path d={rr(U.x + 1.3, U.y + 1.3, U.w - 2.6, U.d - 2.6, 0.6)} fill="#000" opacity={0.35 * clamp01(1 - ex * 0.5)} /></SiTop>
          {renderLevel(2, z0)}
          <SiTop z={zi}>
            <path fillRule="evenodd" d={rr(U.x, U.y, U.w, U.d, 0.9) + rr(U.x + 1.4, U.y + 1.4, U.w - 2.8, U.d - 2.8, 0.5)} fill="#1A1410" />
            <path d={ring} fill={SI.solder} />
            <path fillRule="evenodd" d={rr(U.x, U.y, U.w, U.d, 0.9) + rr(U.x + 1.4, U.y + 1.4, U.w - 2.8, U.d - 2.8, 0.5)} fill={`url(#${id}-sweep)`} opacity={0.5} />
            <path d={rr(U.x, U.y, U.w, U.d, 0.9)} fill="none" stroke={`url(#${id}-copper)`} strokeWidth={0.16} />
          </SiTop>
          {/* shadow of the lifted board */}
          <SiTop z={zi}><path d={rr(U.x + 0.6 + ex * 1.5, U.y + 0.4 - ex * 0.6, U.w, U.d, 1)} fill="#000" opacity={0.35 * clamp01(ex * 4) / (1 + ex)} filter={`url(#${id}-soft3)`} /></SiTop>
        </>
      ) : null}
      {/* upper board */}
      <SiExtrude pts={upPts} z={zu} h={lay.t1} color="#3A2A1C" bands={EDGE_BANDS.slice(1)} />
      <Surface layout={lay} lv={1} z={z1} skip={skip} />
      {renderLevel(1, z1)}
      {dim > 0.01 && focusIds.length ? (
        <>
          <SiTop z={z1 + 1.2}><rect x={-60} y={-60} width={200} height={170} fill="#020308" opacity={0.72 * dim} /></SiTop>
          {lay.order.filter((o) => o.part && focusIds.includes(o.key)).map((o) => <PartView key={`f${o.key}`} p={o.part!} z={o.level === 1 ? z1 : z0} st={parts[o.key]} />)}
        </>
      ) : null}
      {children}
    </g>
  );
};

// ---- phone interior around the board -------------------------------------------------------------------------------------
/**
 * The inside of the phone around the default board: graphite mid-plate, battery pouch, camera can with three lenses,
 * frame rail, speaker box - simple but lit, so a full-bleed board shot never shows empty black. Draw it BEFORE the
 * `LogicBoard` and pass the same `z`; `front` parts (battery, speaker) are returned by `<SiChassis layer="front">`
 * and must be drawn AFTER the board.
 */
export const SiChassis = React.memo<{z?: number; layer?: 'back' | 'front'}>(({z = 0, layer = 'back'}) => {
  const {id} = useSi();
  if (layer === 'back') {
    const lens = (cx: number, cy: number, r: number, k: number) => (
      <g key={k}>
        <circle cx={cx} cy={cy} r={r * 1.18} fill={`url(#${id}-steel)`} />
        <circle cx={cx} cy={cy} r={r} fill="#040507" />
        <circle cx={cx} cy={cy} r={r * 0.78} fill="#0B1020" stroke="#2A3550" strokeWidth={0.12} />
        <circle cx={cx} cy={cy} r={r * 0.5} fill="#131B3A" stroke="#4B3A7A" strokeWidth={0.1} />
        <circle cx={cx} cy={cy} r={r * 0.24} fill="#05060C" />
        <ellipse cx={cx - r * 0.3} cy={cy - r * 0.34} rx={r * 0.26} ry={r * 0.14} fill="#9FB8FF" opacity={0.35} transform={`rotate(-35 ${cx - r * 0.3} ${cy - r * 0.34})`} />
        <circle cx={cx} cy={cy} r={r * 1.18} fill={`url(#${id}-sweep)`} opacity={0.5} />
      </g>
    );
    return (
      <g>
        <SiTop z={z - 0.6}>
          <rect x={-70} y={-70} width={230} height={200} fill="#090A0D" />
          <rect x={-70} y={-70} width={230} height={200} fill={`url(#${id}-env)`} opacity={0.12} />
          <rect x={-70} y={-70} width={230} height={200} fill={`url(#${id}-brush)`} opacity={0.5} />
          {/* stamped ribs + screw bosses of the mid-plate */}
          <path d={rr(-30, -40, 60, 30, 3) + rr(76, 2, 60, 22, 2) + rr(-40, 46, 56, 40, 3)} fill="none" stroke="#fff" strokeOpacity={0.05} strokeWidth={0.5} />
          <path d={rr(-0.6, -0.6, 73.2, 27.2, 1.4) + rr(-0.6, 25, 23.2, 15.6, 1.4)} fill="#000" opacity={0.75} filter={`url(#${id}-soft3)`} />
        </SiTop>
        {/* frame rail (far left) */}
        <SiPrism x={-9} y={-70} w={5} d={200} z={z - 0.6} h={5.2} color="#6F7379" />
        <SiTop z={z + 4.6}>
          <rect x={-9} y={-70} width={5} height={200} fill={`url(#${id}-tin)`} />
          <rect x={-9} y={-70} width={5} height={200} fill={`url(#${id}-brush)`} />
          <rect x={-9} y={-70} width={5} height={200} fill={`url(#${id}-sweep)`} opacity={0.7} />
        </SiTop>
        {/* rear camera can behind the board */}
        <SiPrism x={30} y={-34} w={44} d={30} z={z - 0.6} h={4.4} color="#23262B" />
        <SiTop z={z + 3.8}>
          <path d={rr(30, -34, 44, 30, 3)} fill="#16181C" />
          <path d={rr(30, -34, 44, 30, 3)} fill={`url(#${id}-env)`} opacity={0.5} />
          {lens(41, -19, 7.4, 1)}{lens(60, -24.5, 6.4, 2)}{lens(60.5, -10.5, 5.2, 3)}
          <path d={rr(30.2, -33.8, 43.6, 29.6, 3)} fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={0.15} />
        </SiTop>
      </g>
    );
  }
  return (
    <g>
      {/* battery pouch in front of the main strip */}
      <SiPrism x={24.5} y={28.5} w={110} d={90} z={z - 0.6} h={3.6} color="#16171A" />
      <SiTop z={z + 3.0}>
        <path d={rr(24.5, 28.5, 110, 90, 2.2)} fill="#0D0E10" />
        <path d={rr(24.5, 28.5, 110, 90, 2.2)} fill={`url(#${id}-env)`} opacity={0.35} />
        <path d={rr(26.5, 30.5, 106, 86, 1.6)} fill="none" stroke="#fff" strokeOpacity={0.05} strokeWidth={0.25} />
        <SiText x={78} y={38} size={1.5} anchor="start" fill="#9AA1AA" opacity={0.42} font="Poppins, sans-serif" weight={600} spacing={6}>Li-ion Polymer Battery</SiText>
        <SiText x={78} y={41} size={0.9} anchor="start" fill="#9AA1AA" opacity={0.34} spacing={5}>RECHARGEABLE  3.9 V</SiText>
        <path d={rr(78, 44, 16, 0.5, 0.1) + rr(78, 45.4, 11, 0.5, 0.1) + rr(78, 46.8, 14, 0.5, 0.1) + rr(100, 36, 5, 5, 0.6) + rr(106.5, 36, 5, 5, 0.6)} fill="#9AA1AA" opacity={0.18} />
        <path d={rr(24.5, 28.5, 110, 90, 2.2)} fill={`url(#${id}-sweep)`} opacity={0.4} />
        <path d={`M26 29.2H132`} stroke="#fff" strokeOpacity={0.12} strokeWidth={0.2} />
      </SiTop>
      {/* speaker / haptics box to the right */}
      <SiPrism x={75} y={-2} w={50} d={27} z={z - 0.6} h={3.4} color={SI.steel} />
      <SiTop z={z + 2.8}>
        <path d={rr(75, -2, 50, 27, 1.5)} fill={`url(#${id}-steel)`} />
        <path d={rr(75, -2, 50, 27, 1.5)} fill={`url(#${id}-brush)`} />
        <rect x={79} y={2} width={Math.floor(20 / 0.62) * 0.62} height={Math.floor(18 / 0.62) * 0.62} fill={`url(#${id}-perf)`} opacity={0.8} />
        <path d={rr(75, -2, 50, 27, 1.5)} fill={`url(#${id}-sweep)`} opacity={0.6} />
      </SiTop>
    </g>
  );
});

export {shade, tint};
