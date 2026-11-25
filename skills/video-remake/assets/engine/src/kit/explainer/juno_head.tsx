// juno_head.tsx — Juno presenter: head + torso artwork (arms/hands live in another file).
// Plan:
//  - DefsHead: all static gradients (ids prefixed "juno-").
//  - Torso: hood back + lining -> headphone band -> neck (+ chin shadow) -> hoodie body (natural sloped
//           shoulders, near-straight sides, few soft folds, pocket) -> high hood collar wrapping the neck ->
//           headphone yokes + cups -> drawstrings with eyelets and aglets.
//  - Head:  loose coils + back clumps -> ears -> face (cel shadow, blush, few freckles) -> nose, eyes, brows,
//           mouth -> soft hairline -> larger front clumps (one curl line each). Everything stays inside the head.
import React from 'react';

export type Brows = 'neutral' | 'up' | 'worried' | 'angry' | 'skeptic' | 'happy';
export type Mouth = 'smile' | 'grin' | 'o' | 'flat' | 'frown' | 'open' | 'smirk';

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const r1 = (v: number): number => Math.round(v * 10) / 10;

// ---------- palette ----------
const SKIN_LINE = '#8A5233';
const SKIN_SHADE = '#A9683F';
const PINK_LINE = '#A81C5C';
const PINK_SHADE = '#C92672';
const HAIR_LINE = '#120A08';
const LIP_LINE = '#5E2A1F';

// =====================================================================
// Defs
// =====================================================================
export const DefsHead: React.FC = () => (
  <defs>
    <radialGradient id="juno-skin" cx="0.4" cy="0.36" r="0.78">
      <stop offset="0" stopColor="#DDA176" />
      <stop offset="0.55" stopColor="#C98B62" />
      <stop offset="1" stopColor="#B37650" />
    </radialGradient>
    <linearGradient id="juno-skin-neck" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#C58860" />
      <stop offset="0.55" stopColor="#BD7F57" />
      <stop offset="1" stopColor="#A86B45" />
    </linearGradient>
    <radialGradient id="juno-blush" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#E0685A" stopOpacity="0.42" />
      <stop offset="1" stopColor="#E0685A" stopOpacity="0" />
    </radialGradient>
    {/* one shared gradient over the whole hair mass so clumps read as one volume, not as bubbles */}
    <radialGradient id="juno-hair" gradientUnits="userSpaceOnUse" cx={170} cy={84} r={108}>
      <stop offset="0" stopColor="#4A342D" />
      <stop offset="0.45" stopColor="#2C1C18" />
      <stop offset="1" stopColor="#1A100D" />
    </radialGradient>
    <radialGradient id="juno-iris" cx="0.5" cy="0.62" r="0.6">
      <stop offset="0" stopColor="#8A5A34" />
      <stop offset="0.6" stopColor="#5A3520" />
      <stop offset="1" stopColor="#331C10" />
    </radialGradient>
    <linearGradient id="juno-lip" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#B45B4E" />
      <stop offset="1" stopColor="#CC7663" />
    </linearGradient>
    <linearGradient id="juno-hoodie" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FF69AA" />
      <stop offset="0.45" stopColor="#FF4F9A" />
      <stop offset="1" stopColor="#EE3D8A" />
    </linearGradient>
    <linearGradient id="juno-hood" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stopColor="#FF7DB6" />
      <stop offset="0.6" stopColor="#FF559E" />
      <stop offset="1" stopColor="#EC3B88" />
    </linearGradient>
    <linearGradient id="juno-hood-lining" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6F1541" />
      <stop offset="1" stopColor="#A02562" />
    </linearGradient>
    <linearGradient id="juno-hp-cup" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#4A5058" />
      <stop offset="0.5" stopColor="#2F3338" />
      <stop offset="1" stopColor="#1E2125" />
    </linearGradient>
    <linearGradient id="juno-metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#F4F6F8" />
      <stop offset="0.5" stopColor="#A9B0B8" />
      <stop offset="1" stopColor="#6F767E" />
    </linearGradient>
  </defs>
);

// =====================================================================
// Torso
// =====================================================================
// Natural sloped shoulders (collar ~y262 -> shoulder point ~(96,286)), outer edge at (88,300),
// sides run almost straight to the bottom corners (80,440)/(320,440).
const BODY_D =
  'M80 440 C81 404 84 356 86 324 C86 313 86 306 88 300 C90 293 93 288 98 285 ' +
  'C118 276 142 268 160 262 C164 257 166 252 168 248 C178 252 190 254 200 254 ' +
  'C210 254 222 252 232 248 C234 252 236 257 240 262 C258 268 282 276 302 285 ' +
  'C307 288 310 293 312 300 C314 306 314 313 314 324 C316 356 319 404 320 440 Z';

// Hood front edge: a thick roll wrapping the neck, rim just under the chin.
const LAPEL_D =
  'M158 223 C170 226 188 232 205 239 C208 245 209 252 207 259 C184 267 152 271 134 265 ' +
  'C122 260 122 242 134 232 C142 225 150 222 158 223 Z';

const MIRROR = 'translate(400 0) scale(-1 1)';

const Lapel: React.FC = () => (
  <g>
    <path d={LAPEL_D} fill="url(#juno-hood)" stroke={PINK_LINE} strokeWidth={2} strokeLinejoin="round" />
    {/* highlight along the rolled rim */}
    <path d="M152 227 C141 230 133 238 131 248 C137 240 146 234 158 231 Z" fill="#FFA3CC" opacity={0.7} />
    {/* shadow on the lower roll */}
    <path d="M127 252 C131 263 152 270 207 259 L208 252 C170 262 142 262 127 252 Z" fill={PINK_SHADE} opacity={0.42} />
    {/* fold + stitched seam */}
    <path d="M146 232 C142 240 144 250 151 258" fill="none" stroke={PINK_SHADE} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
    <path
      d="M158 229 C171 232 187 238 203 245"
      fill="none"
      stroke="#FFB3D4"
      strokeWidth={1.1}
      strokeDasharray="4 3"
      strokeLinecap="round"
      opacity={0.85}
    />
  </g>
);

const Cup: React.FC = () => (
  <g>
    {/* cushion */}
    <ellipse cx={3} cy={2} rx={17} ry={22} fill="#1B1D21" stroke="#0F1113" strokeWidth={1.6} />
    <path d="M14 -12 C19 -4 19 10 13 19" fill="none" stroke="#3A3F46" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
    {/* shell */}
    <ellipse cx={-1} cy={0} rx={15} ry={20} fill="url(#juno-hp-cup)" stroke="#17191C" strokeWidth={1.8} />
    <ellipse cx={-1} cy={0} rx={8.5} ry={11.5} fill="none" stroke="url(#juno-metal)" strokeWidth={1.6} />
    <ellipse cx={-1} cy={0} rx={5} ry={7} fill="#23262A" />
    <circle cx={-1} cy={0} r={2} fill="#FF4F9A" />
    <path d="M-11 -9 C-9 -15 -4 -18 1 -18" fill="none" stroke="#9AA1AA" strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
  </g>
);

const BAND_D = 'M162 240 C162 224 180 220 200 220 C220 220 238 224 238 240';

export const Torso: React.FC = () => (
  <g>
    {/* hood bunched behind the neck */}
    <path
      d="M132 274 C124 236 162 212 200 212 C238 212 276 236 268 274 Z"
      fill="url(#juno-hood)"
      stroke={PINK_LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path d="M144 278 C140 242 170 221 200 221 C230 221 260 242 256 278 Z" fill="url(#juno-hood-lining)" stroke="#5E1037" strokeWidth={1.5} />
    <path d="M137 258 C138 238 154 226 172 221" fill="none" stroke="#FFA3CC" strokeWidth={2} strokeLinecap="round" opacity={0.7} />

    {/* headphone band passing behind the neck, right under the jaw */}
    <path d={BAND_D} fill="none" stroke="#17191C" strokeWidth={11} strokeLinecap="round" />
    <path d={BAND_D} fill="none" stroke="#2F3338" strokeWidth={8} strokeLinecap="round" />
    <path d="M165 231 C167 226 172 223 180 221.500" fill="none" stroke="#6A717A" strokeWidth={1.5} strokeLinecap="round" opacity={0.8} />

    {/* neck (runs up behind the head so a tilt never opens a gap) */}
    <path
      d="M182 200 L182 262 C182 270 176 276 168 280 L168 292 L232 292 L232 280 C224 276 218 270 218 262 L218 200 Z"
      fill="url(#juno-skin-neck)"
      stroke={SKIN_LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    {/* soft chin shadow */}
    <path d="M183 204 L217 204 L217 229 Q200 241 183 229 Z" fill={SKIN_SHADE} opacity={0.3} />
    <path d="M183 204 L217 204 L217 225 Q200 235 183 225 Z" fill={SKIN_SHADE} opacity={0.5} />

    {/* hoodie body */}
    <path d={BODY_D} fill="url(#juno-hoodie)" stroke={PINK_LINE} strokeWidth={2.2} strokeLinejoin="round" />
    {/* cel shadow (light from upper left) */}
    <path d="M304 287 C310 292 313 300 314 324 C316 356 319 404 320 440 L294 440 C300 400 301 340 292 298 Z" fill={PINK_SHADE} opacity={0.34} />
    <path d="M80 440 C81 404 84 356 86 324 C90 366 96 410 101 440 Z" fill={PINK_SHADE} opacity={0.22} />
    {/* highlights */}
    <path d="M100 287 C114 280 130 274 148 269 C132 278 118 289 109 303 Z" fill="#FF94C2" opacity={0.55} />
    <path d="M146 318 C166 326 188 328 204 326 C190 342 160 342 144 330 Z" fill="#FF8DBF" opacity={0.28} />

    {/* folds: few and soft (cotton fleece) */}
    <g fill="none" stroke={PINK_SHADE} strokeWidth={1.6} strokeLinecap="round" opacity={0.55}>
      <path d="M120 302 C125 310 127 320 126 330" />
      <path d="M280 302 C275 310 273 320 274 330" />
      <path d="M170 350 C180 356 194 358 206 355" />
      <path d="M238 372 C229 378 217 379 207 377" />
      <path d="M230 298 C223 304 214 306 205 305" />
    </g>

    {/* kangaroo pocket seam */}
    <path
      d="M132 440 C136 420 142 404 152 396 C182 390 218 390 248 396 C258 404 264 420 268 440"
      fill="none"
      stroke={PINK_LINE}
      strokeWidth={1.8}
      strokeLinecap="round"
      opacity={0.85}
    />
    <path
      d="M139 440 C143 423 148 409 155 402 C184 396 216 396 245 402 C252 409 257 423 261 440"
      fill="none"
      stroke="#FFB3D4"
      strokeWidth={1.1}
      strokeDasharray="4 3"
      opacity={0.8}
    />
    <path d="M154 399 C184 394 216 394 246 399" fill="none" stroke="#FF8DBF" strokeWidth={1.4} opacity={0.6} />

    {/* collar cast shadows on the body */}
    <path d={LAPEL_D} transform="translate(0 7)" fill="#B81F68" opacity={0.4} />
    <path d={LAPEL_D} transform="translate(400 7) scale(-1 1)" fill="#B81F68" opacity={0.4} />
    {/* small V stitch under the collar */}
    <path d="M192 268 L200 282 L208 268" fill="none" stroke={PINK_SHADE} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />

    {/* hood collar wrapping the neck: right first, left overlaps */}
    <g transform={MIRROR}>
      <Lapel />
    </g>
    <Lapel />

    {/* headphone yokes over the collar + cups resting on it */}
    <path d="M165 227 C158 234 155 242 155 252" fill="none" stroke="#17191C" strokeWidth={9} strokeLinecap="round" />
    <path d="M165 227 C158 234 155 242 155 252" fill="none" stroke="#3A3F46" strokeWidth={6} strokeLinecap="round" />
    <path d="M235 227 C242 234 245 242 245 252" fill="none" stroke="#17191C" strokeWidth={9} strokeLinecap="round" />
    <path d="M235 227 C242 234 245 242 245 252" fill="none" stroke="#2F3338" strokeWidth={6} strokeLinecap="round" />
    <ellipse cx={158} cy={294} rx={17} ry={5} fill="#B81F68" opacity={0.35} />
    <ellipse cx={248} cy={294} rx={17} ry={5} fill="#B81F68" opacity={0.35} />
    <g transform="translate(154 270) rotate(-10)">
      <Cup />
    </g>
    <g transform="translate(246 270) rotate(10) scale(-1 1)">
      <Cup />
    </g>

    {/* drawstrings */}
    <g fill="none" strokeLinecap="round">
      <path d="M187 273 C185 293 181 319 183 345" stroke="#B9A9B9" strokeWidth={6.2} />
      <path d="M187 273 C185 293 181 319 183 345" stroke="#FFF7FB" strokeWidth={4} />
      <path d="M213 273 C216 293 220 313 217 337" stroke="#B9A9B9" strokeWidth={6.2} />
      <path d="M213 273 C216 293 220 313 217 337" stroke="#FFF7FB" strokeWidth={4} />
      <path d="M186 283 C184.500 299 182 317 182.500 335" stroke="#E3D6E2" strokeWidth={1} strokeDasharray="2 3" />
      <path d="M214 283 C216.500 297 218.500 313 217 329" stroke="#E3D6E2" strokeWidth={1} strokeDasharray="2 3" />
    </g>
    {/* aglets */}
    <rect x={180} y={342} width={6} height={13} rx={2} fill="url(#juno-metal)" stroke="#5F656C" strokeWidth={0.9} />
    <rect x={214} y={334} width={6} height={13} rx={2} fill="url(#juno-metal)" stroke="#5F656C" strokeWidth={0.9} />
    {/* eyelets */}
    <circle cx={187} cy={273} r={3.8} fill="url(#juno-metal)" stroke="#5F656C" strokeWidth={0.9} />
    <circle cx={187} cy={273} r={1.7} fill="#6F1541" />
    <circle cx={213} cy={273} r={3.8} fill="url(#juno-metal)" stroke="#5F656C" strokeWidth={0.9} />
    <circle cx={213} cy={273} r={1.7} fill="#6F1541" />
  </g>
);

// =====================================================================
// Hair
// =====================================================================
// x, y, radius, lobe angle (deg), highlight flag
type Clump = [number, number, number, number, 0 | 1];

// 27 larger clumps in total (+7 loose coils on the silhouette).
const CLUMPS_BACK: Clump[] = [
  [136, 138, 10, 160, 0], [134, 117, 15, 200, 0], [143, 96, 16, 250, 1], [160, 80, 16, 310, 1],
  [182, 72, 15, 260, 1], [205, 71, 16, 300, 0], [228, 75, 15, 250, 0], [246, 87, 16, 330, 0],
  [259, 106, 15, 10, 0], [265, 126, 13, 20, 0], [263, 141, 9, 40, 0],
];
const CLUMPS_MID: Clump[] = [
  [151, 117, 12, 140, 0], [160, 99, 14, 230, 1], [177, 87, 14, 300, 1], [197, 83, 14, 250, 0],
  [217, 86, 14, 290, 0], [235, 96, 14, 330, 0], [248, 113, 12, 20, 0],
];
const CLUMPS_FRINGE: Clump[] = [
  [148, 131, 6.5, 100, 0], [158, 112, 10, 300, 1], [172, 102, 10, 210, 1], [188, 97, 9, 300, 0],
  [205, 97, 10, 340, 0], [221, 99, 9, 250, 0], [236, 105, 9.5, 330, 0], [247, 116, 8, 30, 0],
  [253, 132, 6, 270, 0],
];
const LOOSE: Clump[] = [
  [126, 104, 5, 30, 1], [141, 74, 5.5, 200, 1], [193, 55, 4.5, 100, 0], [259, 80, 5, 300, 0],
  [274, 110, 5, 60, 0], [271, 142, 4.5, 150, 0], [129, 143, 4.5, 250, 0],
];

const spiralD = (r: number): string =>
  `M${r1(-r * 0.6)} ${r1(r * 0.15)} a${r1(r * 0.6)} ${r1(r * 0.6)} 0 1 1 ${r1(r * 0.75)} ${r1(r * 0.4)} ` +
  `a${r1(r * 0.3)} ${r1(r * 0.3)} 0 0 1 ${r1(-r * 0.35)} ${r1(-r * 0.3)}`;

// A clump = one main coil + two smaller lobes sharing a single merged outline, with ONE inner curl line.
const renderClump = (c: Clump, i: number, k: number, fill: string): React.ReactElement => {
  const [x, y, r, a, hi] = c;
  const rad = (a * Math.PI) / 180;
  const rad2 = rad + 2.2 + ((i * 37 + k * 11) % 50) / 40;
  const ax = r1(x + Math.cos(rad) * r * 0.72);
  const ay = r1(y + Math.sin(rad) * r * 0.72);
  const ar = r1(r * 0.6);
  const bx = r1(x + Math.cos(rad2) * r * 0.6);
  const by = r1(y + Math.sin(rad2) * r * 0.6);
  const br = r1(r * 0.5);
  const rx = i % 2 === 0 ? r : r1(r * 0.9);
  const ry = i % 2 === 0 ? r1(r * 0.9) : r;
  const rot = (i * 67 + k * 131) % 360;
  return (
    <g key={`c${k}-${i}`}>
      <g fill={fill} stroke={HAIR_LINE} strokeWidth={2.6}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} />
        <circle cx={ax} cy={ay} r={ar} />
        <circle cx={bx} cy={by} r={br} />
      </g>
      <g fill={fill}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} />
        <circle cx={ax} cy={ay} r={ar} />
        <circle cx={bx} cy={by} r={br} />
      </g>
      <path
        d={spiralD(r * 0.74)}
        transform={`translate(${x} ${y}) rotate(${rot})`}
        fill="none"
        stroke="#0E0706"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      {hi === 1 ? (
        <path
          d={`M${r1(x - r * 0.66)} ${r1(y - r * 0.34)} a${r1(r * 0.76)} ${r1(r * 0.76)} 0 0 1 ${r1(r * 0.74)} ${r1(-r * 0.34)}`}
          fill="none"
          stroke="#7A5C50"
          strokeWidth={1.7}
          strokeLinecap="round"
          opacity={0.65}
        />
      ) : null}
    </g>
  );
};

const renderLoose = (c: Clump, i: number): React.ReactElement => {
  const [x, y, r, a, hi] = c;
  return (
    <g key={`l${i}`} transform={`translate(${x} ${y}) rotate(${a})`} fill="none" strokeLinecap="round">
      <path d={spiralD(r)} stroke={HAIR_LINE} strokeWidth={3.6} />
      <path d={spiralD(r)} stroke="#2A1A16" strokeWidth={2.2} />
      {hi === 1 ? <path d={spiralD(r)} stroke="#6E5248" strokeWidth={0.8} opacity={0.6} strokeDasharray="5 9" /> : null}
    </g>
  );
};

// =====================================================================
// Eyes
// =====================================================================
const EYE_Y = 152;

const Eye: React.FC<{cx: number; s: 1 | -1; lid: number; wide: boolean; look: [number, number]; id: string}> = ({
  cx, s, lid, wide, look, id,
}) => {
  const cy = EYE_Y;
  const l = clamp(lid, 0.08, 1);
  const hOpen = wide ? 11.5 : 9;
  const h = hOpen * l;
  const drop = (1 - l) * 4.5;
  const upY = r1(cy - 1.25 * h + drop);
  const lowY = r1(cy + Math.max(0.95 * h, drop - 1.25 * h + 0.6));
  const openUpY = r1(cy - 1.25 * hOpen);
  const xo = cx - 13 * s;
  const xi = cx + 13 * s;
  const yo = cy - 0.5;
  const yi = cy + 1.5;
  const c1 = cx - 7 * s;
  const c2 = cx + 6 * s;
  const upper = `M${xo} ${yo} C${c1} ${upY} ${c2} ${upY} ${xi} ${yi}`;
  const shape = `${upper} C${c2} ${lowY} ${c1} ${lowY} ${xo} ${yo} Z`;
  const lidShape = `M${xo} ${yo} C${c1} ${openUpY} ${c2} ${openUpY} ${xi} ${yi} C${c2} ${upY} ${c1} ${upY} ${xo} ${yo} Z`;
  const ir = wide ? 6.3 : 7.6;
  const ix = r1(cx + clamp(look[0], -1, 1) * 5);
  const iy = r1(cy + clamp(look[1], -1, 1) * 4 - (wide ? 0 : 0.6));
  return (
    <g>
      <clipPath id={id}>
        <path d={shape} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={cx - 16} y={cy - 18} width={32} height={34} fill="#FBF5EE" />
        <circle cx={ix} cy={iy} r={ir} fill="url(#juno-iris)" stroke="#24120A" strokeWidth={1.2} />
        <circle cx={ix} cy={iy} r={ir * 0.45} fill="#120806" />
        {/* upper-lid shadow on the eyeball */}
        <path
          d={`M${xo} ${yo} C${c1} ${upY} ${c2} ${upY} ${xi} ${yi} C${c2} ${r1(upY + 4.5)} ${c1} ${r1(upY + 4.5)} ${xo} ${yo} Z`}
          fill="#5B3A2E"
          opacity={0.22}
        />
        <circle cx={ix - 2.6} cy={iy - 3} r={2.2} fill="#FFFFFF" />
        <circle cx={ix + 3} cy={iy + 2.6} r={1.1} fill="#FFFFFF" opacity={0.85} />
      </g>
      {/* eyelid skin when closing */}
      {l < 0.92 ? <path d={lidShape} fill="#B97C54" stroke={SKIN_LINE} strokeWidth={0.8} opacity={1} /> : null}
      {/* crease */}
      <path
        d={`M${cx - 11 * s} ${r1(cy - hOpen - 3.5)} Q${cx} ${r1(cy - hOpen - 8)} ${cx + 10 * s} ${r1(cy - hOpen - 2.5)}`}
        fill="none"
        stroke={SKIN_LINE}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.45 * l}
      />
      {/* lower lid */}
      <path
        d={`M${xi} ${yi} C${c2} ${lowY} ${c1} ${lowY} ${xo} ${yo}`}
        fill="none"
        stroke={SKIN_LINE}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.65}
      />
      {/* lash line + lashes (stay when closed) */}
      <path d={upper} fill="none" stroke="#24130D" strokeWidth={3} strokeLinecap="round" />
      <path
        d={`M${xo} ${yo} l${-4.5 * s} -2.2 M${xo + 1 * s} ${yo + 0.5} l${-4.2 * s} 1`}
        fill="none"
        stroke="#24130D"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </g>
  );
};

// =====================================================================
// Brows
// =====================================================================
type V3 = [number, number, number]; // dy for inner, mid, outer
const BROW_POSES: Record<Brows, {L: V3; R: V3}> = {
  neutral: {L: [0, 0, 0], R: [0, 0, 0]},
  up: {L: [-7, -8, -6], R: [-7, -8, -6]},
  worried: {L: [-6, -3, 2], R: [-6, -3, 2]},
  angry: {L: [5, 1, -3], R: [5, 1, -3]},
  skeptic: {L: [2, 1, 0], R: [-7, -9, -6]},
  happy: {L: [-3, -4, -2], R: [-3, -4, -2]},
};

const browPath = (cx: number, s: number, d: V3): string => {
  const xi = cx + 14 * s;
  const xm = cx - 3 * s;
  const xo = cx - 17 * s;
  const yi = 131 + d[0];
  const ym = 124.5 + d[1];
  const yo = 131.5 + d[2];
  return `M${xi} ${yi - 2.8} Q${xm} ${ym - 3.2} ${xo} ${yo} Q${xm} ${ym + 2.6} ${xi} ${yi + 3} Z`;
};

const browHi = (cx: number, s: number, d: V3): string => {
  const xi = cx + 10 * s;
  const xm = cx - 3 * s;
  const xo = cx - 11 * s;
  return `M${xi} ${130 + d[0]} Q${xm} ${123.5 + d[1]} ${xo} ${129 + d[2]}`;
};

// =====================================================================
// Mouth
// =====================================================================
type Q6 = [number, number, number, number, number, number];
const CLOSED: Record<'smile' | 'flat' | 'frown' | 'smirk', Q6> = {
  smile: [183.5, 196.5, 200, 213, 216.5, 196.5],
  flat: [187, 201, 200, 202.5, 213, 201],
  frown: [187, 205, 200, 196, 213, 205],
  smirk: [187, 202, 202, 207, 216, 196],
};

const ClosedMouth: React.FC<{q: Q6; dimples: boolean}> = ({q, dimples}) => {
  const [x0, y0, cx, cy, x1, y1] = q;
  const pt = (t: number): [number, number] => [
    r1((1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * cx + t * t * x1),
    r1((1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cy + t * t * y1),
  ];
  const a = 0.16;
  const b = 0.84;
  const pa = pt(a);
  const pb = pt(b);
  const mid = pt(0.5);
  const w0 = (1 - a) * (1 - b);
  const w1 = a * (1 - b) + b * (1 - a);
  const w2 = a * b;
  const sx = r1(w0 * x0 + w1 * cx + w2 * x1);
  const sy = r1(w0 * y0 + w1 * cy + w2 * y1);
  const line = `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`;
  return (
    <g>
      {/* upper lip */}
      <path
        d={`M${x0} ${y0} Q${mid[0] - 7} ${r1(mid[1] - 6.5)} ${mid[0]} ${r1(mid[1] - 3.5)} Q${mid[0] + 7} ${r1(mid[1] - 6.5)} ${x1} ${y1} Q${cx} ${cy} ${x0} ${y0} Z`}
        fill="#9E4F42"
        opacity={0.8}
      />
      {/* lower lip */}
      <path
        d={`M${pa[0]} ${pa[1]} Q${mid[0]} ${r1(mid[1] + 13)} ${pb[0]} ${pb[1]} Q${sx} ${sy} ${pa[0]} ${pa[1]} Z`}
        fill="url(#juno-lip)"
        opacity={0.92}
      />
      <ellipse cx={mid[0] - 2} cy={r1(mid[1] + 3.6)} rx={4} ry={1.3} fill="#FFFFFF" opacity={0.28} />
      <path d={line} fill="none" stroke={LIP_LINE} strokeWidth={2.2} strokeLinecap="round" />
      <path
        d={`M${mid[0] - 7} ${r1(mid[1] + 9.5)} Q${mid[0]} ${r1(mid[1] + 12)} ${mid[0] + 7} ${r1(mid[1] + 9.5)}`}
        fill="none"
        stroke={SKIN_SHADE}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.6}
      />
      {dimples ? (
        <g fill="none" stroke={SKIN_LINE} strokeWidth={1.3} strokeLinecap="round" opacity={0.55}>
          <path d={`M${x0 - 3} ${y0 - 4} Q${x0 - 5.5} ${y0} ${x0 - 2.5} ${y0 + 3.5}`} />
          <path d={`M${x1 + 3} ${y1 - 4} Q${x1 + 5.5} ${y1} ${x1 + 2.5} ${y1 + 3.5}`} />
        </g>
      ) : null}
    </g>
  );
};

const OpenMouth: React.FC<{
  d: string; x0: number; x1: number; y0: number; cy: number; bottom: number; teeth: number; ring: boolean; dimples: boolean;
}> = ({d, x0, x1, y0, cy, bottom, teeth, ring, dimples}) => {
  const ymid = (y0 + cy) / 2;
  return (
    <g>
      <clipPath id="juno-mouth-clip">
        <path d={d} />
      </clipPath>
      {ring ? <path d={d} fill="none" stroke="#A85848" strokeWidth={5} strokeLinejoin="round" opacity={0.85} /> : null}
      {!ring ? (
        <path
          d={`M${x0} ${y0} Q193 ${r1(y0 - 3.2)} 200 ${r1(ymid - 2.6)} Q207 ${r1(y0 - 3.2)} ${x1} ${y0} Q200 ${cy} ${x0} ${y0} Z`}
          fill="#9E4F42"
          opacity={0.85}
        />
      ) : null}
      <path d={d} fill="#4A1719" />
      <g clipPath="url(#juno-mouth-clip)">
        <ellipse cx={200} cy={r1(bottom - 1.5)} rx={8} ry={r1(Math.min(5, Math.max(1.5, (bottom - y0) * 0.36)))} fill="#D8616B" />
        <path d={`M196 ${r1(bottom - 3)} Q200 ${r1(bottom - 4.5)} 204 ${r1(bottom - 3)}`} fill="none" stroke="#F08C93" strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
        {teeth > 0 ? (
          <path
            d={`M${x0} ${y0 - 1} Q200 ${cy - 1} ${x1} ${y0 - 1} L${x1 - 1} ${r1(y0 + teeth)} Q200 ${r1(cy + teeth)} ${x0 + 1} ${r1(y0 + teeth)} Z`}
            fill="#FFF8F0"
            stroke="#D9C9BE"
            strokeWidth={0.8}
          />
        ) : null}
      </g>
      <path d={d} fill="none" stroke={LIP_LINE} strokeWidth={2} strokeLinejoin="round" />
      {/* lower lip */}
      <path
        d={`M192 ${r1(bottom + 1.2)} Q200 ${r1(bottom + 4.6)} 208 ${r1(bottom + 1.2)}`}
        fill="none"
        stroke="#C4705C"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />
      {dimples ? (
        <g fill="none" stroke={SKIN_LINE} strokeWidth={1.3} strokeLinecap="round" opacity={0.55}>
          <path d={`M${x0 - 3} ${y0 - 4} Q${x0 - 5.5} ${y0} ${x0 - 2.5} ${y0 + 4}`} />
          <path d={`M${x1 + 3} ${y0 - 4} Q${x1 + 5.5} ${y0} ${x1 + 2.5} ${y0 + 4}`} />
        </g>
      ) : null}
    </g>
  );
};

const MouthArt: React.FC<{mouth: Mouth; talk: number}> = ({mouth, talk}) => {
  if (talk > 0.08) {
    const t = clamp(talk, 0, 1);
    const H = 4 + 12 * t;
    const b = r1(197 + H);
    const d = `M186 197 Q200 200 214 197 C213 ${r1(197 + H * 0.9)} 207 ${b} 200 ${b} C193 ${b} 187 ${r1(197 + H * 0.9)} 186 197 Z`;
    return <OpenMouth d={d} x0={186} x1={214} y0={197} cy={200} bottom={b} teeth={r1(Math.min(4.5, H * 0.42))} ring={false} dimples={false} />;
  }
  if (mouth === 'grin') {
    return (
      <OpenMouth
        d="M183 196 Q200 201 217 196 C216 208 209 214 200 214 C191 214 184 208 183 196 Z"
        x0={183} x1={217} y0={196} cy={201} bottom={214} teeth={5.5} ring={false} dimples
      />
    );
  }
  if (mouth === 'open') {
    return (
      <OpenMouth
        d="M187 196 Q200 199 213 196 C213 208 208 215 200 215 C192 215 187 208 187 196 Z"
        x0={187} x1={213} y0={196} cy={199} bottom={215} teeth={4.5} ring={false} dimples={false}
      />
    );
  }
  if (mouth === 'o') {
    return (
      <OpenMouth
        d="M200 194 C206 194 208 199 208 203 C208 208 205 212 200 212 C195 212 192 208 192 203 C192 199 194 194 200 194 Z"
        x0={192} x1={208} y0={198} cy={198} bottom={212} teeth={0} ring dimples={false}
      />
    );
  }
  return <ClosedMouth q={CLOSED[mouth]} dimples={mouth === 'smile'} />;
};

// =====================================================================
// Head
// =====================================================================
const FACE_D =
  'M146 150 C146 100 170 78 200 78 C230 78 254 100 254 150 C254 176 248 194 236 207 ' +
  'C226 217 213 222 200 222 C187 222 174 217 164 207 C152 194 146 176 146 150 Z';

const FRECKLES: Array<[number, number, number]> = [
  [168, 172, 1.1], [174, 177, 1], [181, 171, 1],
  [193, 166, 0.9], [207, 166, 0.9],
  [219, 171, 1], [226, 177, 1], [232, 172, 1.1],
];

export const Head: React.FC<{
  look: [number, number];
  lidL: number;
  lidR: number;
  wide: boolean;
  brows: Brows;
  mouth: Mouth;
  talk: number;
}> = ({look, lidL, lidR, wide, brows, mouth, talk}) => {
  const bp = BROW_POSES[brows];
  return (
    <g>
      {/* ---- back hair: dark mass, loose coils breaking the silhouette, back clumps ---- */}
      <path d="M132 142 C125 96 158 62 200 62 C242 62 275 96 268 142 Z" fill="#170E0B" />
      {LOOSE.map((c, i) => renderLoose(c, i))}
      {CLUMPS_BACK.map((c, i) => renderClump(c, i, 0, i < 5 ? 'url(#juno-hair)' : '#1D120F'))}

      {/* ---- ears ---- */}
      <g>
        <ellipse cx={145} cy={163} rx={8.5} ry={13} fill="#BD7F57" stroke={SKIN_LINE} strokeWidth={2} />
        <path d="M144 155 C139.500 158 140 167 145 171" fill="none" stroke={SKIN_LINE} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
        <ellipse cx={255} cy={163} rx={8.5} ry={13} fill="#AD6F49" stroke={SKIN_LINE} strokeWidth={2} />
        <path d="M256 155 C260.500 158 260 167 255 171" fill="none" stroke={SKIN_LINE} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
      </g>

      {/* ---- face ---- */}
      <path d={FACE_D} fill="url(#juno-skin)" stroke={SKIN_LINE} strokeWidth={2} strokeLinejoin="round" />
      {/* cel shadow on the far side + jaw */}
      <path
        d="M252 138 C254 176 248 194 236 207 C226 217 213 222 200 222 C221 214 239 197 243 171 C245 159 248 148 252 138 Z"
        fill={SKIN_SHADE}
        opacity={0.42}
      />
      {/* shadow cast by the fringe */}
      <path d="M150 128 C162 112 238 112 250 128 C236 119 164 119 150 128 Z" fill={SKIN_SHADE} opacity={0.45} />
      {/* highlight on lit cheekbone */}
      <path d="M156 164 C158 172 164 178 172 180 C164 182 156 176 154 168 Z" fill="#E8B48C" opacity={0.5} />
      {/* blush */}
      <ellipse cx={164} cy={184} rx={13} ry={8} fill="url(#juno-blush)" />
      <ellipse cx={236} cy={184} rx={13} ry={8} fill="url(#juno-blush)" />
      {/* freckles */}
      {FRECKLES.map((f, i) => (
        <circle key={`f${i}`} cx={f[0]} cy={f[1]} r={f[2]} fill="#8F5636" opacity={0.6} />
      ))}

      {/* ---- nose (small, narrow wings, single highlight) ---- */}
      <path d="M204 155 C205.500 163 207 169 207 175" fill="none" stroke={SKIN_SHADE} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
      <ellipse cx={199} cy={176.500} rx={3} ry={2.2} fill="#E8B48C" opacity={0.6} />
      <path
        d="M193.500 180 C191.800 178 192.600 174.800 195 174.800 M193.500 180 C194.500 183.400 198 184 200 182.800 C202 184 205.500 183.400 206.500 180 C208.200 178 207.400 174.800 205 174.800"
        fill="none"
        stroke={SKIN_LINE}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M195.600 181.500 Q197 182.500 198.200 181.900 M201.800 181.900 Q203 182.500 204.400 181.500" fill="none" stroke="#6E3D24" strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />

      {/* ---- eyes ---- */}
      <Eye cx={178} s={1} lid={lidL} wide={wide} look={look} id="juno-eye-L" />
      <Eye cx={222} s={-1} lid={lidR} wide={wide} look={look} id="juno-eye-R" />

      {/* ---- brows ---- */}
      <g>
        <path d={browPath(178, 1, bp.L)} fill="#24140F" stroke="#24140F" strokeWidth={1.4} strokeLinejoin="round" />
        <path d={browPath(222, -1, bp.R)} fill="#24140F" stroke="#24140F" strokeWidth={1.4} strokeLinejoin="round" />
        <path d={browHi(178, 1, bp.L)} fill="none" stroke="#5A4037" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
        <path d={browHi(222, -1, bp.R)} fill="none" stroke="#5A4037" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
      </g>

      {/* ---- mouth ---- */}
      <MouthArt mouth={mouth} talk={talk} />

      {/* ---- soft hairline: translucent root band + baby hairs at forehead and temples ---- */}
      <path
        d="M148 124 C152 100 176 95 200 95 C224 95 248 100 252 124 C241 110 222 105 200 105 C178 105 159 110 148 124 Z"
        fill="#3A241C"
        opacity={0.38}
      />
      <g fill="none" stroke="#2A1A16" strokeWidth={1.2} strokeLinecap="round" opacity={0.55}>
        <path d="M149 126 c-1.500 5 -0.500 10 2.500 13" />
        <path d="M152 121 c0 4 1.500 7 4 9" />
        <path d="M251 126 c1.500 5 0.500 10 -2.500 13" />
        <path d="M248 121 c0 4 -1.500 7 -4 9" />
        <path d="M169 107 c2 3 5 4 8 3" />
        <path d="M191 104 c2 2.500 5 3 8 2" />
        <path d="M213 104 c3 3 7 3 10 1" />
        <path d="M232 110 c2 2.500 4 3.500 7 3" />
      </g>

      {/* ---- front hair: wavy cap, then larger organic clumps ---- */}
      <path
        d="M150 113 C150 90 172 76 200 76 C228 76 250 90 250 113 C243 103 233 99 223 101 C215 96 207 97 200 99 C192 95 184 97 177 100 C167 98 157 103 150 113 Z"
        fill="#1E1310"
      />
      {CLUMPS_MID.map((c, i) => renderClump(c, i, 1, 'url(#juno-hair)'))}
      {CLUMPS_FRINGE.map((c, i) => renderClump(c, i, 2, 'url(#juno-hair)'))}
      {/* sparse highlight strands on the lit top-left only */}
      <g fill="none" stroke="#8A6A5C" strokeWidth={1.3} strokeLinecap="round" opacity={0.5}>
        <path d="M160 66 C165 62 171 60 177 60" />
        <path d="M141 94 C143 88 147 82 152 78" />
      </g>
    </g>
  );
};
