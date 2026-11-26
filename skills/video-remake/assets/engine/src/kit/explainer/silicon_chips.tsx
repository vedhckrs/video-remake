// Silicon kit - parts (26 Nov 2026): chip packages (`SiChip`: PoP SoC, molded BGA, NAND/DRAM, PMIC, bare-silicon
// WLCSP, shielded module, shield can, secure-enclave block), the exploded package (`PackageStack`), passives batched
// per cluster (`SiPassives`), board-to-board connectors + flex (`SiConnector`), shield fence walls, standoffs / screws,
// antenna clips, graphite / foam patches. Every part is drawn in plan mm inside a `SiScene` and is separately
// animatable: `lift`, `glow`, `xray`, `explode`, `highlight`, `opacity`, `open` (0..1 unless noted).
import React from 'react';
import {siApple} from 'simple-icons';
import {SI, SiGlow, SiPrism, SiText, SiTop, clamp01, dot, lerp, rr, siHash, siRng, stackZ, useSi, type SiLayer} from './silicon_core';
import {DieFloorplan} from './silicon_die';
import {mix, shade, tint} from './tokens';

const n2 = (v: number) => Math.round(v * 100) / 100;
const n3 = (v: number) => Math.round(v * 1000) / 1000;

// ---- roles + markings ------------------------------------------------------------------------------------------------
export type ChipKind = 'pop' | 'mold' | 'nand' | 'pmic' | 'wlcsp' | 'module' | 'shield' | 'enclave' | 'lid';
export type ChipRole = 'soc' | 'modem' | 'wireless' | 'pmic' | 'nand' | 'dram' | 'rf' | 'transceiver' | 'uwb' | 'nfc' | 'audio' | 'charger' | 'enclave' | 'fem' | 'shield';
export type ChipMark = {
  /** 'apple' draws the Simple Icons mark (only on parts the video is about); null = no logo */
  logo?: 'apple' | null;
  /** the big line, e.g. "A20 Pro" */
  title?: string;
  /** small code lines above the logo / title */
  top?: string[];
  /** small code lines below */
  lines?: string[];
  /** 'center' (logo chips) or 'left' (three left-aligned lines, the usual vendor layout) */
  layout?: 'center' | 'left';
  /** rotate the marking a quarter turn (chips mounted sideways) */
  rot?: 0 | 90 | 180 | 270;
};
/** Defaults per role. The codes are GENERIC placeholders (small laser-etched lines like a real part: type code, lot,
 *  date) - pass the real marking through `mark` when it is sourced. Say what a chip IS with a callout, not a big word. */
export const SI_ROLES: Record<ChipRole, {kind: ChipKind; h: number; label: string; mark: ChipMark}> = {
  soc: {kind: 'pop', h: 1.0, label: 'System on a chip', mark: {logo: 'apple', title: 'A20 Pro', top: ['K7N2Q4TA  2638'], lines: ['SOC-20P  N2  TW'], layout: 'center'}},
  modem: {kind: 'module', h: 0.95, label: '5G modem', mark: {top: ['5G MODEM-RF'], title: 'MD20X', lines: ['A7K4 2636', '001 TW'], layout: 'left'}},
  wireless: {kind: 'mold', h: 0.8, label: 'Wi-Fi + Bluetooth', mark: {top: ['WLAN/BT/TH'], title: 'WL7B1', lines: ['K2M9 2637', 'E4'], layout: 'left'}},
  pmic: {kind: 'pmic', h: 0.7, label: 'Power management', mark: {title: 'PM18A', lines: ['R2Q7 2635', 'F7'], layout: 'left'}},
  nand: {kind: 'nand', h: 0.9, label: 'Flash storage', mark: {top: ['256G TLC'], title: 'FL256T', lines: ['H9XK21 2634', 'JP'], layout: 'left'}},
  dram: {kind: 'nand', h: 0.85, label: 'Memory', mark: {top: ['LP5X 12G'], title: 'DR12X', lines: ['M4T1 2636'], layout: 'left'}},
  rf: {kind: 'wlcsp', h: 0.4, label: 'RF front end', mark: {title: 'FE41', lines: ['2636'], layout: 'left'}},
  transceiver: {kind: 'wlcsp', h: 0.42, label: 'RF transceiver', mark: {title: 'TR735', lines: ['HK41 2636', '001'], layout: 'left'}},
  uwb: {kind: 'wlcsp', h: 0.4, label: 'Ultra wideband', mark: {title: 'U2W', lines: ['2635'], layout: 'left'}},
  nfc: {kind: 'mold', h: 0.6, label: 'NFC', mark: {title: 'NF11', lines: ['2633 B'], layout: 'left'}},
  audio: {kind: 'wlcsp', h: 0.4, label: 'Audio codec', mark: {title: 'AU3C', lines: ['2636'], layout: 'left'}},
  charger: {kind: 'pmic', h: 0.65, label: 'Charging', mark: {title: 'CH9P', lines: ['2635 K'], layout: 'left'}},
  enclave: {kind: 'enclave', h: 0.55, label: 'Secure element', mark: {title: 'SE4', lines: ['2634'], layout: 'left'}},
  fem: {kind: 'module', h: 0.75, label: 'RF module', mark: {title: 'FM23', lines: ['MB/HB', '2636 K'], layout: 'left'}},
  shield: {kind: 'shield', h: 0.95, label: 'Shield can', mark: {}},
};
const KIND_H: Record<ChipKind, number> = {pop: 1.0, mold: 0.8, nand: 0.9, pmic: 0.7, wlcsp: 0.4, module: 0.9, shield: 0.95, enclave: 0.55, lid: 0.9};

/** Laser marking laid out for a w x d (mm) top face. */
const Marking: React.FC<{w: number; d: number; mark: ChipMark; color?: string; opacity?: number; ox?: number; oy?: number}> = ({w, d, mark, color = SI.etch, opacity = 0.56, ox = 0, oy = 0}) => {
  const rot = mark.rot ?? 0;
  const side = rot === 90 || rot === 270;
  const mw = side ? d : w, md = side ? w : d;
  const m = Math.min(mw, md);
  const small = Math.max(0.2, Math.min(0.52, m * 0.062));
  const out: React.ReactNode[] = [];
  const layout = mark.layout ?? (mark.logo ? 'center' : 'left');
  if (layout === 'center') {
    const cx = mw / 2;
    (mark.top ?? []).forEach((s, i) => out.push(<SiText key={`t${i}`} x={cx} y={md * 0.13 + small * 0.4 + i * small * 1.5} size={small} fill={color}>{s}</SiText>));
    const lg = m * 0.3;
    const title = mark.title ?? '';
    const ts = Math.min(m * 0.13, (mw * 0.72) / Math.max(1, title.length * 0.62));
    const cy = md * 0.47;
    if (mark.logo === 'apple') {
      out.push(<path key="logo" d={siApple.path} transform={`translate(${n3(cx - lg / 2)} ${n3(cy - lg * 0.62)}) scale(${n3(lg / 24)})`} fill={color} />);
      if (title) out.push(<SiText key="ti" x={cx} y={cy + lg * 0.5 + ts * 1.25} size={ts} fill={color} font="Poppins, sans-serif" weight={600} spacing={6}>{title}</SiText>);
    } else if (title) {
      out.push(<SiText key="ti" x={cx} y={cy + ts * 0.36} size={ts * 1.5} fill={color} font="Poppins, sans-serif" weight={600} spacing={6}>{title}</SiText>);
    }
    (mark.lines ?? []).forEach((s, i) => out.push(<SiText key={`l${i}`} x={cx} y={md * 0.88 - ((mark.lines ?? []).length - 1 - i) * small * 1.5} size={small} fill={color}>{s}</SiText>));
  } else {
    const x0 = mw * 0.1;
    const title = mark.title ?? '';
    const all = [...(mark.top ?? []), ...(mark.lines ?? [])];
    const longest = Math.max(1, ...all.map((q) => q.length), title.length * 1.4);
    const ls = Math.max(0.2, Math.min(m * 0.085, 0.58, (mw * 0.78) / (longest * 0.64)));
    const ts = ls * 1.4;
    const total = (title ? ts * 1.25 : 0) + all.length * ls * 1.5;
    let y = (md - total) / 2 + ls * 0.9;
    (mark.top ?? []).forEach((q, i) => {
      out.push(<SiText key={`t${i}`} x={x0} y={y} size={ls} anchor="start" fill={color} spacing={3}>{q}</SiText>);
      y += ls * 1.5;
    });
    if (title) {
      out.push(<SiText key="ti" x={x0} y={y + ts * 0.3} size={ts} anchor="start" fill={color} weight={600} spacing={3}>{title}</SiText>);
      y += ts * 1.25 + ls * 0.25;
    }
    (mark.lines ?? []).forEach((q, i) => {
      out.push(<SiText key={`l${i}`} x={x0} y={y} size={ls} anchor="start" fill={color} spacing={3}>{q}</SiText>);
      y += ls * 1.5;
    });
  }
  const tr = rot === 0 ? `translate(${n3(ox)} ${n3(oy)})` : rot === 90 ? `translate(${n3(ox + w)} ${n3(oy)}) rotate(90)` : rot === 180 ? `translate(${n3(ox + w)} ${n3(oy + d)}) rotate(180)` : `translate(${n3(ox)} ${n3(oy + d)}) rotate(-90)`;
  return <g transform={tr} opacity={opacity}>{out}</g>;
};

/** tiny 2D matrix code (sticker / laser) */
const matrixCode = (x: number, y: number, s: number, n: number, seed: number) => {
  const r = siRng(seed), c = s / n;
  let d = `M${n3(x)} ${n3(y)}h${n3(c)}v${n3(s)}h${n3(-c)}Z` + `M${n3(x)} ${n3(y + s - c)}h${n3(s)}v${n3(c)}h${n3(-s)}Z`;
  for (let i = 1; i < n; i++) for (let j = 0; j < n - 1; j++) if (r() > 0.5 || (j === 0 && i % 2 === 0)) d += `M${n3(x + i * c)} ${n3(y + j * c)}h${n3(c)}v${n3(c)}h${n3(-c)}Z`;
  return d;
};

// ---- chip ------------------------------------------------------------------------------------------------------------
export type SiChipProps = {
  /** footprint in plan mm; z = the plane it sits on (board top) */
  x: number; y: number; w: number; d: number; z?: number; h?: number;
  kind?: ChipKind; role?: ChipRole; mark?: ChipMark; seed?: number;
  /** mm above its seat (shows the solder balls underneath + the pad field on the board) */
  lift?: number;
  /** 0..1 emissive halo + edge light (`glowColor`) */
  glow?: number; glowColor?: string;
  /** 0..1 mold turns to glass, the die floorplan shows inside (`dieActive` highlights blocks in it) */
  xray?: number; dieActive?: Record<string, number>;
  /** 0..1 package explodes into balls / substrate / die / RDL / memory / lid (PoP only), `explodeGap` scales the gaps */
  explode?: number; explodeGap?: number;
  /** 0..1 accent outline */
  highlight?: number; highlightColor?: string;
  opacity?: number;
  /** shield / module: 0..1 lid lifted off */
  open?: number;
  /** shield: perforated lid, black label sticker */
  perf?: boolean; sticker?: boolean;
  /** 0..1 strength of the travelling specular band on this part (default per material) */
  gloss?: number;
  /** skip the underfill fillet (parts standing on other parts) */
  bare?: boolean;
};

const moldTone = (seed: number) => {
  const q = siHash(seed * 3.17 + 1), k = siHash(seed * 7.7 + 4);
  const base = q < 0.34 ? '#191715' : q < 0.67 ? '#14161B' : '#17181A';
  return k > 0.5 ? tint(base, (k - 0.5) * 0.09) : shade(base, 0.86 + k * 0.28);
};

/** top face of a molded package (plan mm, origin at the part's x,y) */
const MoldTop: React.FC<{x: number; y: number; w: number; d: number; col: string; mark: ChipMark; gloss: number; id: string; pin1?: boolean; markOpacity?: number}> = ({x, y, w, d, col, mark, gloss, id, pin1 = true, markOpacity}) => {
  const r = Math.min(0.28, Math.min(w, d) * 0.06);
  const pr = Math.max(0.1, Math.min(w, d) * 0.028);
  return (
    <g>
      <path d={rr(x, y, w, d, r)} fill={col} />
      <path d={rr(x, y, w, d, r)} fill={`url(#${id}-grain)`} />
      <Marking w={w} d={d} mark={mark} ox={x} oy={y} opacity={markOpacity} />
      <path d={rr(x, y, w, d, r)} fill={`url(#${id}-env)`} opacity={0.2} />
      <path d={rr(x, y, w, d, r)} fill={`url(#${id}-rimenv)`} opacity={0.22} />
      <path d={rr(x, y, w, d, r)} fill={`url(#${id}-sweep)`} opacity={gloss} />
      {/* bevel: light catches the top edges */}
      <path d={rr(x + 0.035, y + 0.035, w - 0.07, d - 0.07, r)} fill="none" stroke="#fff" strokeOpacity={0.13} strokeWidth={0.05} />
      <path d={`M${n3(x + r)} ${n3(y + d - 0.03)}H${n3(x + w - r)}`} stroke="#fff" strokeOpacity={0.28} strokeWidth={0.045} />
      {pin1 ? (
        <>
          <circle cx={x + pr * 3.2} cy={y + d - pr * 3.2} r={pr} fill="#000" opacity={0.45} />
          <path d={`M${n3(x + pr * 2.25)} ${n3(y + d - pr * 3.0)}a${n3(pr)} ${n3(pr)} 0 0 0 ${n3(pr * 1.9)} 0`} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={0.035} />
        </>
      ) : null}
    </g>
  );
};

const Highlight: React.FC<{x: number; y: number; w: number; d: number; z: number; a: number; color: string}> = ({x, y, w, d, z, a, color}) =>
  a > 0.01 ? (
    <SiTop z={z}>
      <path d={rr(x - 0.15, y - 0.15, w + 0.3, d + 0.3, 0.4)} fill="none" stroke={color} strokeWidth={0.7} opacity={0.22 * a} />
      <path d={rr(x - 0.06, y - 0.06, w + 0.12, d + 0.12, 0.32)} fill="none" stroke={tint(color, 0.45)} strokeWidth={0.13} opacity={a} />
    </SiTop>
  ) : null;

/** shadow + landing pads left on the board when a part lifts */
const Seat: React.FC<{x: number; y: number; w: number; d: number; z: number; lift: number; id: string; pads?: boolean}> = ({x, y, w, d, z, lift, id, pads = true}) => {
  const {L} = useSi();
  const q = clamp01(lift / 0.6);
  return (
    <SiTop z={z}>
      {pads ? (
        <g opacity={q}>
          <path d={rr(x - 0.05, y - 0.05, w + 0.1, d + 0.1, 0.2)} fill="#07080A" />
          <rect x={x + 0.35} y={y + 0.35} width={w - 0.7} height={d - 0.7} fill={`url(#${id}-pads)`} />
        </g>
      ) : null}
      <path d={rr(x + L[0] * lift * 0.55, y + L[1] * lift * 0.55 + lift * 0.12, w, d, 0.4)} fill="#000" opacity={0.55 / (1 + lift * 0.22)} filter={`url(#${id}-soft${lift > 1.4 ? 3 : 2})`} />
    </SiTop>
  );
};

const ChipImpl: React.FC<SiChipProps> = (p) => {
  const {id, v} = useSi();
  const role = p.role ? SI_ROLES[p.role] : undefined;
  const kind = p.kind ?? role?.kind ?? 'mold';
  const mark: ChipMark = {...(role?.mark ?? {}), ...(p.mark ?? {})};
  const {x, y, w, d} = p;
  const z = p.z ?? 0, h = p.h ?? role?.h ?? KIND_H[kind], seed = p.seed ?? x * 3.1 + y * 7.7;
  const lift = Math.max(0, p.lift ?? 0), glow = p.glow ?? 0, xray = clamp01(p.xray ?? 0), explode = p.explode ?? 0, open = clamp01(p.open ?? 0);
  const gc = p.glowColor ?? SI.accent;
  const z0 = z + lift;
  const halo = glow > 0.01 ? <SiGlow x={x + w / 2} y={y + d / 2} z={z} r={Math.max(w, d) * 1.25} color={gc} strength={0.55 * glow} /> : null;
  const edgeGlow = glow > 0.01 ? (
    <SiTop z={z0 + h} style={{mixBlendMode: 'screen'}}>
      <path d={rr(x, y, w, d, 0.25)} fill={gc} opacity={0.1 * glow} />
      <path d={rr(x + 0.04, y + 0.04, w - 0.08, d - 0.08, 0.25)} fill="none" stroke={tint(gc, 0.4)} strokeWidth={0.09} opacity={0.75 * glow} />
    </SiTop>
  ) : null;
  const hl = <Highlight x={x} y={y} w={w} d={d} z={z0 + h} a={p.highlight ?? 0} color={p.highlightColor ?? SI.accent} />;

  // ---- bare silicon (wafer-level CSP): a mirror ----
  if (kind === 'wlcsp') {
    const g = p.gloss ?? 1;
    return (
      <g opacity={p.opacity}>
        {halo}
        {lift > 0.02 ? <Seat x={x} y={y} w={w} d={d} z={z} lift={lift} id={id} /> : null}
        {lift > 0.05 ? <SiTop z={z0 - 0.02}><rect x={x + 0.1} y={y + 0.1} width={w - 0.2} height={d - 0.2} fill={`url(#${id}-bumps)`} /></SiTop> : null}
        <SiPrism x={x + 0.04} y={y + 0.04} w={w - 0.08} d={d - 0.08} z={z0} h={0.07} color={SI.solderLo} ao={false} edge={0} />
        <SiPrism x={x} y={y} w={w} d={d} z={z0 + 0.07} h={h - 0.07} color="#141D2E" front="#1B2942" side="#0A101C" edge={0.4} />
        <SiTop z={z0 + h}>
          <rect x={x} y={y} width={w} height={d} rx={0.04} fill={`url(#${id}-mirror)`} />
          <Marking w={w} d={d} mark={mark} ox={x} oy={y} color="#D5E2F5" opacity={0.3} />
          <rect x={x} y={y} width={w} height={d} fill={`url(#${id}-env)`} opacity={0.5} />
          <rect x={x} y={y} width={w} height={d} fill={`url(#${id}-sweep)`} opacity={g} />
          <rect x={x + 0.025} y={y + 0.025} width={w - 0.05} height={d - 0.05} fill="none" stroke="#DCE9FF" strokeOpacity={0.5} strokeWidth={0.035} />
          <circle cx={x + 0.22} cy={y + d - 0.22} r={0.07} fill="#DCE9FF" opacity={0.5} />
        </SiTop>
        {edgeGlow}{hl}
      </g>
    );
  }

  // ---- shield can / shielded module: brushed tin lid on a soldered fence ----
  // 'lid' = a package under a satin copper-toned metal lid with an outlined logo and one edge line of text (the look
  // of the SoC on the iPhone 18 Pro board in iFixit's teardown photos)
  if (kind === 'shield' || kind === 'module' || kind === 'lid') {
    const isLid = kind === 'lid';
    const g = p.gloss ?? 0.85;
    const lz = z0 + open * 4.5;
    const lidA = 1 - clamp01((open - 0.55) / 0.45);
    const r = 0.3;
    return (
      <g opacity={p.opacity}>
        {halo}
        {lift > 0.02 ? <Seat x={x} y={y} w={w} d={d} z={z} lift={lift} id={id} pads={false} /> : null}
        {open > 0.01 ? <SiPrism x={x} y={y} w={w} d={d} z={z0} h={h * 0.72} color={SI.tin} opacity={0.9} /> : null}
        {open > 0.01 ? (
          <SiTop z={z0 + h * 0.72}>
            <path fillRule="evenodd" d={rr(x, y, w, d, r) + rr(x + 0.16, y + 0.16, w - 0.32, d - 0.32, r * 0.6)} fill={`url(#${id}-tin)`} />
          </SiTop>
        ) : null}
        <g opacity={lidA}>
          <SiPrism x={x} y={y} w={w} d={d} z={lz} h={h} color={isLid ? '#B48C68' : SI.tin} edge={0.5} />
          <SiTop z={lz + h}>
            <path d={rr(x, y, w, d, r)} fill={`url(#${id}-${isLid ? 'lid' : 'tin'})`} />
            <path d={rr(x, y, w, d, r)} fill={`url(#${id}-brush)`} opacity={isLid ? 0.45 : 1} />
            {isLid ? (
              <g>
                <path d={siApple.path} transform={`translate(${n3(x + w / 2 - Math.min(w, d) * 0.13)} ${n3(y + d * 0.3 - Math.min(w, d) * 0.13)}) scale(${n3((Math.min(w, d) * 0.26) / 24)})`} fill="none" stroke="#2B221B" strokeWidth={0.9} strokeOpacity={0.8} />
                <SiText x={x + w * 0.1} y={y + d * 0.92} size={Math.min(0.5, d * 0.045)} anchor="start" rot={-90} fill="#2B221B" opacity={0.75} spacing={5}>{(mark.lines ?? [])[0] ?? 'K7N2Q4TA2638'}</SiText>
                <circle cx={x + w * 0.9} cy={y + d * 0.08} r={0.1} fill="#2B221B" opacity={0.6} />
              </g>
            ) : null}
            {/* embossed frame */}
            {isLid ? null : <path d={rr(x + 0.36, y + 0.36, w - 0.72, d - 0.72, r)} fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={0.07} />}
            {isLid ? null : <path d={rr(x + 0.42, y + 0.42, w - 0.84, d - 0.84, r)} fill="none" stroke="#fff" strokeOpacity={0.42} strokeWidth={0.05} />}
            {p.perf ? <rect x={x + 0.9} y={y + 0.9} width={Math.floor((w - 1.8) / 0.62) * 0.62} height={Math.floor((d - 1.8) / 0.62) * 0.62} fill={`url(#${id}-perf)`} /> : null}
            {kind === 'module' ? <Marking w={w - 1.2} d={d - 1.2} mark={mark} ox={x + 0.6} oy={y + 0.6} color="#2B3138" opacity={0.72} /> : null}
            {p.sticker ? (
              <g>
                <rect x={x + w * 0.5} y={y + d * 0.52} width={w * 0.38} height={d * 0.3} rx={0.08} fill="#0C0D0F" />
                <path d={matrixCode(x + w * 0.52, y + d * 0.55, Math.min(w * 0.14, d * 0.24), 10, seed)} fill="#D9DDE2" opacity={0.85} />
                <SiText x={x + w * 0.69} y={y + d * 0.63} size={Math.min(0.34, d * 0.06)} anchor="start" fill="#C9CED3" opacity={0.8}>{`SH-${Math.floor(siHash(seed) * 90 + 10)}`}</SiText>
                <SiText x={x + w * 0.69} y={y + d * 0.72} size={Math.min(0.26, d * 0.045)} anchor="start" fill="#C9CED3" opacity={0.6}>2638 C</SiText>
              </g>
            ) : null}
            <path d={rr(x, y, w, d, r)} fill={`url(#${id}-env)`} opacity={0.55} />
            <path d={rr(x, y, w, d, r)} fill={`url(#${id}-rimenv)`} opacity={0.5} />
            <path d={rr(x, y, w, d, r)} fill={`url(#${id}-sweep)`} opacity={g} />
            {isLid ? null : <path d={dot(x + 0.5, y + 0.5, 0.09) + dot(x + w - 0.5, y + 0.5, 0.09) + dot(x + 0.5, y + d - 0.5, 0.09) + dot(x + w - 0.5, y + d - 0.5, 0.09)} fill="#000" opacity={0.35} />}
            <path d={rr(x + 0.03, y + 0.03, w - 0.06, d - 0.06, r)} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={0.05} />
          </SiTop>
        </g>
        {edgeGlow}{hl}
      </g>
    );
  }

  // ---- molded packages ----
  const col = kind === 'enclave' ? '#1B1D22' : moldTone(seed);
  const gloss = p.gloss ?? (kind === 'pop' ? 0.34 : 0.26);
  const sub = kind === 'pop' ? 0.16 : kind === 'nand' ? 0.1 : 0;       // visible substrate step
  const sm = kind === 'pop' ? 0.22 : 0.1;
  if (kind === 'pop' && explode > 0.004) {
    return (
      <g opacity={p.opacity}>
        {halo}
        <Seat x={x} y={y} w={w} d={d} z={z} lift={lift + explode * 0.8} id={id} />
        <PackageStack x={x} y={y} w={w} d={d} z={z0} h={h} spread={explode} gap={p.explodeGap ?? 1} mark={mark} seed={seed} glow={glow} glowColor={gc} dieActive={p.dieActive} />
        {hl}
      </g>
    );
  }
  const dw = w * 0.76, dh = Math.min(d * 0.78, dw / 1.5);
  return (
    <g opacity={p.opacity}>
      {halo}
      {lift > 0.02 ? <Seat x={x - sm} y={y - sm} w={w + sm * 2} d={d + sm * 2} z={z} lift={lift} id={id} /> : null}
      {lift <= 0.02 && !p.bare ? (
        <SiTop z={z}>
          {/* underfill fillet: glossy black meniscus */}
          <path d={rr(x - sm - 0.2, y - sm - 0.2, w + sm * 2 + 0.4, d + sm * 2 + 0.4, 0.42)} fill={SI.underfill} opacity={0.92} />
          <path d={rr(x - sm - 0.16, y - sm - 0.16, w + sm * 2 + 0.32, d + sm * 2 + 0.32, 0.4)} fill="none" stroke="#fff" strokeOpacity={0.1} strokeWidth={0.05} />
        </SiTop>
      ) : null}
      {lift > 0.05 ? <SiTop z={z0 - 0.04}><rect x={x - sm + 0.3} y={y - sm + 0.3} width={w + sm * 2 - 0.6} height={d + sm * 2 - 0.6} fill={`url(#${id}-balls)`} /></SiTop> : null}
      {sub > 0 ? (
        <>
          <SiPrism x={x - sm} y={y - sm} w={w + sm * 2} d={d + sm * 2} z={z0} h={sub} color={SI.substrateHi} edge={0.3} />
          <SiTop z={z0 + sub}>
            <path d={rr(x - sm, y - sm, w + sm * 2, d + sm * 2, 0.16)} fill={kind === 'pop' ? '#5C6468' : SI.substrate} />
            <path d={rr(x - sm, y - sm, w + sm * 2, d + sm * 2, 0.16)} fill={`url(#${id}-env)`} opacity={0.4} />
            <path d={rr(x - sm + 0.03, y - sm + 0.03, w + sm * 2 - 0.06, d + sm * 2 - 0.06, 0.16)} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={0.04} />
          </SiTop>
        </>
      ) : null}
      <SiPrism x={x} y={y} w={w} d={d} z={z0 + sub} h={h - sub} color={tint(col, 0.1)} opacity={1 - xray * 0.78} edge={0.2} />
      {xray > 0.01 ? (
        <SiTop z={z0 + sub + 0.02} opacity={clamp01(xray * 1.4)}>
          <path d={rr(x + 0.05, y + 0.05, w - 0.1, d - 0.1, 0.2)} fill="#0B1513" />
          <rect x={x + 0.3} y={y + 0.3} width={w - 0.6} height={d - 0.6} fill={`url(#${id}-pads)`} opacity={0.5} />
          <rect x={x + (w - dw) / 2 - 0.08} y={y + (d - dh) / 2 - 0.08} width={dw + 0.16} height={dh + 0.16} fill="#000" opacity={0.6} />
          <DieFloorplan x={x + (w - dw) / 2} y={y + (d - dh) / 2} w={dw} h={dh} detail={dw * v.u > 420 ? 2 : 1} active={p.dieActive} dim={p.dieActive ? 0.7 : 0} id={`${id}-xd`} />
        </SiTop>
      ) : null}
      <SiTop z={z0 + h} opacity={1 - xray * 0.9}>
        <MoldTop x={x} y={y} w={w} d={d} col={col} mark={mark} gloss={gloss} id={id} />
      </SiTop>
      {xray > 0.01 ? (
        <SiTop z={z0 + h} opacity={xray}>
          <path d={rr(x, y, w, d, 0.25)} fill="#9CC8FF" opacity={0.07} />
          <path d={rr(x + 0.03, y + 0.03, w - 0.06, d - 0.06, 0.25)} fill="none" stroke="#CFE4FF" strokeOpacity={0.6} strokeWidth={0.05} />
          <path d={rr(x, y, w, d, 0.25)} fill={`url(#${id}-sweep)`} opacity={0.5} />
        </SiTop>
      ) : null}
      {edgeGlow}{hl}
    </g>
  );
};
/** A chip package. `role` picks kind + default marking (`SI_ROLES`); `kind` / `mark` override. */
export const SiChip = React.memo(ChipImpl);

// ---- exploded package ------------------------------------------------------------------------------------------------
export const PACKAGE_LAYERS: SiLayer[] = [
  {id: 'balls', h: 0.12, gap: 1.0}, {id: 'rdl', h: 0.14, gap: 0.9}, {id: 'die', h: 0.14, gap: 2.6},
  {id: 'memory', h: 0.2, gap: 1.6}, {id: 'lid', h: 0.4, gap: 0},
];
/** z of every package layer (mm) for `spread`: `packageZ(0.8).die` - use for callout anchors. */
export const packageZ = (spread: number, z = 0, h = 1, gap = 1) => {
  const k = h / PACKAGE_LAYERS.reduce((a, l) => a + l.h, 0);
  return stackZ(PACKAGE_LAYERS.map((l) => ({...l, h: l.h * k, gap: (l.gap ?? 1) * gap})), spread, z);
};

/**
 * Package-on-package SoC as an exploded stack (fan-out style): solder balls / redistribution layer with its copper
 * fan-out and through-vias / the silicon die / memory (two DRAM dies on their substrate) / molded lid with the marking. `spread` 0 = closed .. 1 = fully apart (spring-ready).
 * `only` limits the layers drawn (ids of PACKAGE_LAYERS); `layerOpacity` fades single layers.
 */
export const PackageStack: React.FC<{
  x: number; y: number; w: number; d: number; z?: number; h?: number; spread: number; gap?: number; mark?: ChipMark; seed?: number;
  glow?: number; glowColor?: string; dieActive?: Record<string, number>; layerOpacity?: Record<string, number>; dieDetail?: 0 | 1 | 2;
}> = ({x, y, w, d, z = 0, h = 1, spread, gap = 1, mark = SI_ROLES.soc.mark, seed = 1, glow = 0, glowColor = SI.accent, dieActive, layerOpacity = {}, dieDetail}) => {
  const {id, v} = useSi();
  const k = h / PACKAGE_LAYERS.reduce((a, l) => a + l.h, 0);
  const H = (n: string) => (PACKAGE_LAYERS.find((l) => l.id === n)?.h ?? 0.1) * k;
  const Z = packageZ(spread, z, h, gap);
  const sp = clamp01(spread);
  const sm = 0.22;
  const dw = w * 0.76, dh = Math.min(d * 0.78, dw / 1.5), dx = x + (w - dw) / 2, dy = y + (d - dh) / 2;
  const op = (n: string) => layerOpacity[n] ?? 1;
  const drop = (zz: number, a: number, x0 = x, y0 = y, w0 = w, d0 = d) =>
    sp > 0.02 ? <SiTop z={zz}><path d={rr(x0 + 0.25, y0 + 0.3, w0, d0, 0.3)} fill="#000" opacity={0.42 * sp * a} filter={`url(#${id}-soft2)`} /></SiTop> : null;
  const col = moldTone(seed);
  // fan-out traces on the RDL
  const fan: string[] = [];
  const r = siRng(seed + 5);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2, r0 = Math.min(dw, dh) * 0.42, r1 = Math.min(w, d) * (0.44 + r() * 0.05);
    const cx = x + w / 2, cy = y + d / 2;
    fan.push(`M${n3(cx + Math.cos(a) * r0 * (dw / dh > 1 ? 1.2 : 1))} ${n3(cy + Math.sin(a) * r0)}L${n3(cx + Math.cos(a) * r1 * (w / d))} ${n3(cy + Math.sin(a) * r1)}`);
  }
  const wires: string[] = [];
  for (let i = 0; i < 26; i++) {
    const yy = y + d * 0.14 + (i / 25) * d * 0.72;
    wires.push(`M${n3(x + w * 0.07)} ${n3(yy)}h${n3(w * 0.05)}M${n3(x + w * 0.93)} ${n3(yy)}h${n3(-w * 0.05)}M${n3(x + w * 0.475)} ${n3(yy)}h${n3(w * 0.05)}`);
  }
  // through-package vias around the die (copper pillars that carry the memory's signals down)
  let tiv = '';
  for (let k = 0; k < 2; k++) {
    const o = 0.45 + k * 0.5;
    for (let xx = x + o; xx <= x + w - o + 0.01; xx += 0.5) tiv += dot(xx, y + o, 0.14) + dot(xx, y + d - o, 0.14);
    for (let yy = y + o + 0.5; yy <= y + d - o - 0.49; yy += 0.5) tiv += dot(x + o, yy, 0.14) + dot(x + w - o, yy, 0.14);
  }
  const open = clamp01(sp * 3);
  return (
    <g>
      {/* solder balls */}
      <g opacity={op('balls')}>
        <SiTop z={Z.balls + H('balls') * 0.5}><rect x={x - sm + 0.3} y={y - sm + 0.3} width={Math.floor((w + sm * 2 - 0.6) / 0.65) * 0.65} height={Math.floor((d + sm * 2 - 0.6) / 0.65) * 0.65} fill={`url(#${id}-balls)`} /></SiTop>
      </g>
      {/* redistribution layer: copper fan-out in amber polyimide, through-vias around the die site */}
      <g opacity={op('rdl')}>
        <SiPrism x={x - sm} y={y - sm} w={w + sm * 2} d={d + sm * 2} z={Z.rdl} h={H('rdl')} color="#9A5A22" edge={0.5} />
        <SiTop z={Z.rdl + H('rdl')}>
          <path d={rr(x - sm, y - sm, w + sm * 2, d + sm * 2, 0.16)} fill="#5E3513" />
          <g opacity={open}>
            <path d={fan.join('')} stroke={SI.copperHi} strokeWidth={0.06} opacity={0.7} fill="none" />
            <path d={tiv} fill={`url(#${id}-copper)`} />
            <path d={rr(dx - 0.15, dy - 0.15, dw + 0.3, dh + 0.3, 0.06)} fill="#2E1A08" />
            <rect x={dx} y={dy} width={Math.floor(dw / 0.3) * 0.3} height={Math.floor(dh / 0.3) * 0.3} fill={`url(#${id}-bumps)`} opacity={0.85} />
          </g>
          <path d={rr(x - sm, y - sm, w + sm * 2, d + sm * 2, 0.16)} fill={`url(#${id}-env)`} opacity={0.4} />
          <path d={rr(x - sm, y - sm, w + sm * 2, d + sm * 2, 0.16)} fill={`url(#${id}-sweep)`} opacity={0.55} />
          <path d={rr(x - sm + 0.03, y - sm + 0.03, w + sm * 2 - 0.06, d + sm * 2 - 0.06, 0.16)} fill="none" stroke={SI.copperHi} strokeOpacity={0.65} strokeWidth={0.05} />
        </SiTop>
      </g>
      {/* the silicon die */}
      {drop(Z.rdl + H('rdl') + 0.01, 1, dx, dy, dw, dh)}
      <g opacity={op('die')}>
        {glow > 0.01 ? <SiGlow x={x + w / 2} y={y + d / 2} z={Z.die} r={Math.max(w, d) * 0.9} color={glowColor} strength={0.5 * glow * sp} /> : null}
        <SiPrism x={dx} y={dy} w={dw} d={dh} z={Z.die} h={H('die')} color="#3A4660" front="#55668A" side="#1C2436" edge={0.6} />
        <SiTop z={Z.die + H('die')}>
          <DieFloorplan x={dx} y={dy} w={dw} h={dh} detail={dieDetail ?? (dw * v.u > 420 ? 2 : 1)} active={dieActive} dim={dieActive ? 0.35 : 0} id={`${id}-pd`} shift={0.2 + sp * 0.3} />
          <rect x={dx} y={dy} width={dw} height={dh} fill={`url(#${id}-sweep)`} opacity={0.6} />
        </SiTop>
      </g>
      {/* memory: two DRAM dies wire-bonded on their own substrate */}
      {drop(Z.die + H('die') + 0.01, 0.75)}
      <g opacity={op('memory')}>
        <SiPrism x={x} y={y} w={w} d={d} z={Z.memory} h={H('memory')} color={SI.substrateHi} edge={0.35} />
        <SiTop z={Z.memory + H('memory')}>
          <path d={rr(x, y, w, d, 0.2)} fill={SI.substrate} />
          <g opacity={open}>
            <path d={wires.join('')} stroke={SI.goldHi} strokeWidth={0.035} opacity={0.8} fill="none" />
            <rect x={x + w * 0.12} y={y + d * 0.1} width={w * 0.355} height={d * 0.8} rx={0.05} fill={`url(#${id}-mirror)`} />
            <rect x={x + w * 0.525} y={y + d * 0.1} width={w * 0.355} height={d * 0.8} rx={0.05} fill={`url(#${id}-mirror)`} />
            <path d={[0.12, 0.525].map((fx) => [0, 1, 2, 3].map((j) => rr(x + w * fx + w * 0.02, y + d * 0.13 + j * d * 0.19, w * 0.315, d * 0.16, 0.03)).join('')).join('')} fill="#243A66" opacity={0.6} stroke="#A9C2EE" strokeOpacity={0.35} strokeWidth={0.025} />
            <SiText x={x + w * 0.3} y={y + d * 0.965} size={Math.min(0.3, d * 0.035)} fill="#8FB7A3" opacity={0.8}>DRAM A</SiText>
            <SiText x={x + w * 0.7} y={y + d * 0.965} size={Math.min(0.3, d * 0.035)} fill="#8FB7A3" opacity={0.8}>DRAM B</SiText>
          </g>
          <path d={rr(x, y, w, d, 0.2)} fill={`url(#${id}-env)`} opacity={0.3} />
          <path d={rr(x, y, w, d, 0.2)} fill={`url(#${id}-sweep)`} opacity={0.7} />
          <path d={rr(x + 0.03, y + 0.03, w - 0.06, d - 0.06, 0.2)} fill="none" stroke="#9FE0C0" strokeOpacity={0.35} strokeWidth={0.04} />
        </SiTop>
      </g>
      {/* molded lid with the marking */}
      {drop(Z.memory + H('memory') + 0.01, 0.9)}
      <g opacity={op('lid')}>
        <SiPrism x={x} y={y} w={w} d={d} z={Z.lid} h={H('lid')} color={tint(col, 0.1)} edge={0.22} />
        <SiTop z={Z.lid + H('lid')}><MoldTop x={x} y={y} w={w} d={d} col={col} mark={mark} gloss={0.34} id={id} /></SiTop>
      </g>
    </g>
  );
};

// ---- passives (one batched group per cluster) --------------------------------------------------------------------------
export type PassiveType = 'cap' | 'capDark' | 'res' | 'ind' | 'indTan' | 'xtal' | 'ic' | 'icSi';
export type Passive = {x: number; y: number; l: number; w: number; along: 'x' | 'y'};
const PASSIVE_MAT: Record<PassiveType, {body: string; term: string | null; mark: 'none' | 'center' | 'corner'; env: number}> = {
  cap: {body: SI.ceramic, term: SI.solder, mark: 'none', env: 0}, capDark: {body: '#5E4A38', term: SI.solder, mark: 'none', env: 0},
  res: {body: SI.resistor, term: SI.solder, mark: 'none', env: 0}, ind: {body: '#4E5156', term: null, mark: 'center', env: 0.4},
  indTan: {body: '#6E5C4C', term: null, mark: 'center', env: 0.4}, xtal: {body: SI.tin, term: null, mark: 'none', env: 0.6},
  ic: {body: '#191A1D', term: null, mark: 'corner', env: 0.3}, icSi: {body: '#2B3F60', term: null, mark: 'corner', env: 0.9},
};
const PassivesImpl: React.FC<{items: Passive[]; type: PassiveType; h: number; z?: number; opacity?: number}> = ({items, type, h, z = 0, opacity}) => {
  const {v, px, py, id} = useSi();
  const mat = PASSIVE_MAT[type];
  const q = (ps: [number, number, number][]) => `M${ps.map((p) => v.P(p[0], p[1], p[2]).map(n2).join(' ')).join('L')}Z`;
  const fBody: string[] = [], sBody: string[] = [], fTerm: string[] = [], sTerm: string[] = [], tBody: string[] = [], tTerm: string[] = [], marks: string[] = [], hi: string[] = [];
  const sides = v.tilt > 0.02;
  for (const it of items) {
    const X = it.along === 'x', bw = X ? it.l : it.w, bd = X ? it.w : it.l;
    const tl = mat.term ? Math.min(it.l * 0.27, 0.22) : 0;
    tBody.push(rr(it.x + (X ? tl : 0), it.y + (X ? 0 : tl), bw - (X ? tl * 2 : 0), bd - (X ? 0 : tl * 2), mat.term ? 0 : 0.06));
    hi.push(`M${n3(it.x + 0.03)} ${n3(it.y + bd - 0.03)}h${n3(bw - 0.06)}`);
    if (mat.term) {
      if (X) tTerm.push(rr(it.x, it.y, tl, bd, 0.03), rr(it.x + bw - tl, it.y, tl, bd, 0.03));
      else tTerm.push(rr(it.x, it.y, bw, tl, 0.03), rr(it.x, it.y + bd - tl, bw, tl, 0.03));
    }
    if (mat.mark === 'center') marks.push(dot(it.x + bw * 0.5, it.y + bd * 0.5, Math.min(bw, bd) * 0.075));
    else if (mat.mark === 'corner') marks.push(dot(it.x + 0.2, it.y + bd - 0.2, 0.07));
    if (!sides) continue;
    const x1 = it.x + bw, y1 = it.y + bd;
    const front = (xa: number, xb: number) => q([[xa, y1, z + h], [xb, y1, z + h], [xb, y1, z], [xa, y1, z]]);
    const side = (ya: number, yb: number) => q([[x1, ya, z + h], [x1, yb, z + h], [x1, yb, z], [x1, ya, z]]);
    if (!mat.term) {
      fBody.push(front(it.x, x1));
      sBody.push(side(it.y, y1));
    } else if (X) {
      fTerm.push(front(it.x, it.x + tl), front(x1 - tl, x1));
      fBody.push(front(it.x + tl, x1 - tl));
      sTerm.push(side(it.y, y1));
    } else {
      sTerm.push(side(it.y, it.y + tl), side(y1 - tl, y1));
      sBody.push(side(it.y + tl, y1 - tl));
      fTerm.push(front(it.x, x1));
    }
  }
  const term = mat.term ?? '#000';
  return (
    <g opacity={opacity}>
      {sides ? (
        <>
          {fBody.length ? <path d={fBody.join('')} fill={shade(mat.body, py * 0.92)} /> : null}
          {sBody.length ? <path d={sBody.join('')} fill={shade(mat.body, px * 0.9)} /> : null}
          {fTerm.length ? <path d={fTerm.join('')} fill={shade(term, py * 0.95)} /> : null}
          {sTerm.length ? <path d={sTerm.join('')} fill={shade(term, px)} /> : null}
        </>
      ) : null}
      <g transform={v.top(z + h)}>
        <path d={tBody.join('')} fill={mat.body} />
        {mat.env > 0 ? <path d={tBody.join('')} fill={`url(#${id}-env)`} opacity={mat.env} /> : null}
        {type === 'ic' ? <path d={tBody.join('')} fill={`url(#${id}-grain)`} /> : null}
        {tTerm.length ? <path d={tTerm.join('')} fill={tint(term, 0.25)} /> : null}
        {marks.length ? <path d={marks.join('')} fill="#F4F6F8" opacity={mat.mark === 'corner' ? 0.5 : 0.88} /> : null}
        <path d={hi.join('')} stroke="#fff" strokeOpacity={0.3} strokeWidth={0.03} fill="none" />
        <path d={tBody.join('')} fill={`url(#${id}-sweep)`} opacity={type === 'xtal' || type === 'icSi' ? 0.8 : 0.3} />
      </g>
    </g>
  );
};
/** A cluster of same-type passives as ~8 paths. `h` in mm (01005 0.2, 0201 0.3, 0402 0.5, inductor 1.0). */
export const SiPassives = React.memo(PassivesImpl);

// ---- connector ---------------------------------------------------------------------------------------------------------
const ConnectorImpl: React.FC<{
  x: number; y: number; w: number; d: number; z?: number;
  /** a flex cable is plugged in: draws the plug + its steel cowling and the flex tail leaving toward `flex` */
  plugged?: boolean; flex?: 'x-' | 'x+' | 'y-' | 'y+'; flexLen?: number; gold?: boolean; seed?: number; opacity?: number; lift?: number;
}> = ({x, y, w, d, z = 0, plugged = false, flex, flexLen = 9, gold = false, seed = 1, opacity, lift = 0}) => {
  const {id} = useSi();
  const longX = w >= d;
  const L = longX ? w : d, S = longX ? d : w;
  const n = Math.max(4, Math.floor((L - 1.0) / 0.36));
  const pins: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = 0.5 + i * ((L - 1.0) / (n - 1));
    if (longX) pins.push(rr(x + a - 0.09, y + 0.2, 0.18, S * 0.24, 0.03), rr(x + a - 0.09, y + d - 0.2 - S * 0.24, 0.18, S * 0.24, 0.03));
    else pins.push(rr(x + 0.2, y + a - 0.09, S * 0.24, 0.18, 0.03), rr(x + w - 0.2 - S * 0.24, y + a - 0.09, S * 0.24, 0.18, 0.03));
  }
  const shell = gold ? `url(#${id}-gold)` : `url(#${id}-tin)`;
  const h = 0.6;
  const fw = S * 1.5;
  // flex tail geometry in plan
  let tail: {x: number; y: number; w: number; d: number} | null = null;
  if (plugged && flex) {
    const cx = x + w / 2, cy = y + d / 2;
    if (flex === 'y-') tail = {x: cx - fw / 2, y: y - flexLen, w: fw, d: flexLen + d * 0.5};
    else if (flex === 'y+') tail = {x: cx - fw / 2, y: cy, w: fw, d: flexLen + d * 0.5};
    else if (flex === 'x-') tail = {x: x - flexLen, y: cy - fw / 2, w: flexLen + w * 0.5, d: fw};
    else tail = {x: cx, y: cy - fw / 2, w: flexLen + w * 0.5, d: fw};
  }
  const zp = z + lift;
  return (
    <g opacity={opacity}>
      <SiPrism x={x} y={y} w={w} d={d} z={z} h={h} color={gold ? SI.gold : SI.tin} edge={0.45} />
      <SiTop z={z + h}>
        <path d={rr(x, y, w, d, 0.16)} fill={shell} />
        <path d={rr(x + 0.14, y + 0.14, w - 0.28, d - 0.28, 0.1)} fill="#08090A" />
        <path d={pins.join('')} fill={`url(#${id}-gold)`} />
        <path d={longX ? rr(x + 0.5, y + d / 2 - S * 0.13, w - 1.0, S * 0.26, 0.06) : rr(x + w / 2 - S * 0.13, y + 0.5, S * 0.26, d - 1.0, 0.06)} fill="#23262B" stroke="#3E434A" strokeWidth={0.03} />
        <path d={rr(x, y, w, d, 0.16)} fill={`url(#${id}-sweep)`} opacity={0.6} />
        <path d={rr(x + 0.02, y + 0.02, w - 0.04, d - 0.04, 0.16)} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={0.04} />
      </SiTop>
      {plugged ? (
        <>
          {tail ? (
            <SiTop z={zp + h + 0.12}>
              <path d={rr(tail.x + 0.2, tail.y + 0.25, tail.w, tail.d, 0.3)} fill="#000" opacity={0.5} filter={`url(#${id}-soft1)`} />
              <path d={rr(tail.x, tail.y, tail.w, tail.d, 0.3)} fill={SI.flex} />
              {/* copper traces showing through the black coverlay */}
              <path d={Array.from({length: 7}).map((_, i) => (flex === 'y-' || flex === 'y+'
                ? `M${n3(tail!.x + tail!.w * (0.14 + i * 0.12))} ${n3(tail!.y + 0.3)}v${n3(tail!.d - 0.6)}`
                : `M${n3(tail!.x + 0.3)} ${n3(tail!.y + tail!.d * (0.14 + i * 0.12))}h${n3(tail!.w - 0.6)}`)).join('')} stroke="#5B3A1C" strokeWidth={0.07} opacity={0.75} fill="none" />
              <path d={rr(tail.x, tail.y, tail.w, tail.d, 0.3)} fill={`url(#${id}-env)`} opacity={0.35} />
              <path d={rr(tail.x, tail.y, tail.w, tail.d, 0.3)} fill={`url(#${id}-sweep)`} opacity={0.55} />
              <path d={rr(tail.x + 0.03, tail.y + 0.03, tail.w - 0.06, tail.d - 0.06, 0.3)} fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={0.04} />
            </SiTop>
          ) : null}
          <SiPrism x={x - 0.1} y={y - 0.1} w={w + 0.2} d={d + 0.2} z={zp + h} h={0.42} color={SI.steel} edge={0.4} />
          <SiTop z={zp + h + 0.42}>
            <path d={rr(x - 0.1, y - 0.1, w + 0.2, d + 0.2, 0.2)} fill={`url(#${id}-steel)`} />
            <path d={rr(x - 0.1, y - 0.1, w + 0.2, d + 0.2, 0.2)} fill={`url(#${id}-brush)`} opacity={0.8} />
            <path d={rr(x + 0.25, y + 0.25, w - 0.5, d - 0.5, 0.1)} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={0.05} />
            <SiText x={x + w / 2} y={y + d / 2 + 0.1} size={Math.min(0.32, S * 0.2)} rot={longX ? 0 : 90} fill="#AEB6BF" opacity={0.6}>{`J${Math.floor(siHash(seed * 3.3) * 80 + 10)}00`}</SiText>
            <path d={rr(x - 0.1, y - 0.1, w + 0.2, d + 0.2, 0.2)} fill={`url(#${id}-sweep)`} opacity={0.75} />
            <path d={rr(x - 0.07, y - 0.07, w + 0.14, d + 0.14, 0.2)} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={0.04} />
          </SiTop>
        </>
      ) : null}
    </g>
  );
};
/** Board-to-board connector: metal shell, black LCP body, two rows of gold contacts. */
export const SiConnector = React.memo(ConnectorImpl);

// ---- small hardware ----------------------------------------------------------------------------------------------------
/** One wall of a soldered shield fence (the frame left when a can is removed). Give four of them to the sorter. */
export const SiWall = React.memo<{x: number; y: number; w: number; d: number; z?: number; h?: number; opacity?: number}>(({x, y, w, d, z = 0, h = 0.55, opacity}) => {
  const {id} = useSi();
  return (
    <g opacity={opacity}>
      <SiPrism x={x} y={y} w={w} d={d} z={z} h={h} color={SI.tin} ao={false} edge={0} />
      <SiTop z={z + h}>
        <rect x={x} y={y} width={w} height={d} fill="#B9BFC6" />
        <rect x={x} y={y} width={w} height={d} fill={`url(#${id}-env)`} opacity={0.7} />
        <rect x={x} y={y} width={w} height={d} fill={`url(#${id}-sweep)`} opacity={0.9} />
      </SiTop>
    </g>
  );
});

/** Threaded standoff (knurled boss, ENIG ring) with an optional screw. */
export const SiStandoff = React.memo<{x: number; y: number; z?: number; r?: number; h?: number; screw?: boolean; gold?: boolean; opacity?: number}>(({x, y, z = 0, r = 1.25, h = 1.1, screw = false, gold = true, opacity}) => {
  const {id, v} = useSi();
  const steps = v.tilt > 0.02 ? 7 : 1;
  const knurl: string[] = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    knurl.push(`M${n3(x + Math.cos(a) * r * 0.74)} ${n3(y + Math.sin(a) * r * 0.74)}L${n3(x + Math.cos(a) * r * 0.99)} ${n3(y + Math.sin(a) * r * 0.99)}`);
  }
  return (
    <g opacity={opacity}>
      <SiTop z={z}>
        <circle cx={x + 0.3} cy={y + 0.2} r={r * 1.5} fill="#000" opacity={0.5} filter={`url(#${id}-soft1)`} />
        <circle cx={x} cy={y} r={r * 1.42} fill={`url(#${id}-${gold ? 'gold' : 'copper'})`} />
        <circle cx={x} cy={y} r={r * 1.42} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={0.04} />
      </SiTop>
      {Array.from({length: steps}).map((_, i) => (
        <g key={i} transform={v.top(z + (h * i) / steps)}><circle cx={x} cy={y} r={r} fill={shade(SI.tin, 0.42 + 0.3 * (i / steps))} /></g>
      ))}
      <SiTop z={z + h}>
        <circle cx={x} cy={y} r={r} fill={`url(#${id}-tin)`} />
        <path d={knurl.join('')} stroke="#000" strokeOpacity={0.4} strokeWidth={0.06} />
        <circle cx={x} cy={y} r={r * 0.7} fill={shade(SI.tin, 0.55)} />
        {screw ? (
          <>
            <circle cx={x} cy={y} r={r * 0.66} fill={`url(#${id}-tin)`} />
            <path d={`M${n3(x)} ${n3(y)}L${n3(x)} ${n3(y - r * 0.4)}M${n3(x)} ${n3(y)}L${n3(x + r * 0.35)} ${n3(y + r * 0.2)}M${n3(x)} ${n3(y)}L${n3(x - r * 0.35)} ${n3(y + r * 0.2)}`} stroke="#1A1C1F" strokeWidth={0.13} strokeLinecap="round" />
            <circle cx={x} cy={y} r={r * 0.66} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={0.04} />
          </>
        ) : (
          <>
            <circle cx={x} cy={y} r={r * 0.52} fill="#060607" />
            <path d={dot(x, y, r * 0.44) + dot(x, y, r * 0.34)} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={0.04} />
          </>
        )}
        <circle cx={x} cy={y} r={r} fill={`url(#${id}-sweep)`} opacity={0.9} />
      </SiTop>
    </g>
  );
});

/** Gold-plated antenna / ground spring clip. */
export const SiClip = React.memo<{x: number; y: number; w?: number; d?: number; z?: number; opacity?: number}>(({x, y, w = 1.5, d = 0.9, z = 0, opacity}) => {
  const {id} = useSi();
  return (
    <g opacity={opacity}>
      <SiPrism x={x} y={y} w={w} d={d} z={z} h={0.5} color={SI.gold} edge={0.5} />
      <SiTop z={z + 0.5}>
        <path d={rr(x, y, w, d, 0.1)} fill={`url(#${id}-gold)`} />
        <path d={rr(x + w * 0.18, y + d * 0.2, w * 0.64, d * 0.6, 0.08)} fill="#000" opacity={0.28} />
        <path d={rr(x + w * 0.26, y + d * 0.3, w * 0.48, d * 0.4, 0.06)} fill={`url(#${id}-gold)`} />
        <path d={rr(x, y, w, d, 0.1)} fill={`url(#${id}-sweep)`} opacity={0.9} />
      </SiTop>
    </g>
  );
});

/** Flat patch: 'graphite' thermal sheet (satin grey), 'foam' pad (matte black, 0.3 mm), 'tape' (amber polyimide). */
export const SiPatch = React.memo<{x: number; y: number; w: number; d: number; z?: number; kind?: 'graphite' | 'foam' | 'tape'; opacity?: number}>(({x, y, w, d, z = 0, kind = 'graphite', opacity}) => {
  const {id} = useSi();
  const h = kind === 'foam' ? 0.3 : 0.04;
  const col = kind === 'graphite' ? SI.graphite : kind === 'foam' ? SI.foam : SI.polyimide;
  return (
    <g opacity={opacity}>
      {kind === 'foam' ? <SiPrism x={x} y={y} w={w} d={d} z={z} h={h} color="#141415" edge={0.05} /> : null}
      <SiTop z={z + h}>
        <path d={rr(x, y, w, d, kind === 'foam' ? 0.15 : 0.35)} fill={col} opacity={kind === 'tape' ? 0.82 : 1} />
        {kind === 'foam' ? <path d={rr(x, y, w, d, 0.15)} fill={`url(#${id}-grain)`} /> : null}
        <path d={rr(x, y, w, d, 0.35)} fill={`url(#${id}-env)`} opacity={kind === 'graphite' ? 0.55 : 0.25} />
        <path d={rr(x, y, w, d, 0.35)} fill={`url(#${id}-sweep)`} opacity={kind === 'foam' ? 0.08 : 0.5} />
        {kind !== 'foam' ? <path d={rr(x + 0.03, y + 0.03, w - 0.06, d - 0.06, 0.35)} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={0.04} /> : null}
      </SiTop>
    </g>
  );
});

export {lerp, mix};
