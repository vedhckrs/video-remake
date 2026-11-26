# Scene kit (engine/src/kit) - read before writing scenes.tsx

> Explainer-style projects (`"style": "explainer"`) use `src/kit/explainer/` instead - see
> `references/styles/keyframes-explainer.md` (kit table + recipes) and `references/example-explainer/`.
> That kit also has `media.tsx`: `Photo` (real photograph, full-bleed or framed, Ken-Burns) and `SourceCredit`
> ("Source: ..." line; or scene `"credit"` in script.json) - usable in any project, portrait or landscape 16:9.

## A scene file

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../src/kit/types';
import {Card, Counter, Glyph, LineChart, Pill, Tick, Window, TypeOn, Terminal, IconGrid, Stepper,
        Notification, Cursor, Strike} from '../../src/kit/ui';
import {enter, exit, pop, prog, springAt, map, EASE, rand} from '../../src/kit/motion';
import {SANS, SERIF, MONO} from '../../src/kit/fonts';

const S01: React.FC<SceneProps> = ({t, dur, fps, spec, theme, pal, W, H}) => {
  const c = spec.cues ?? {};               // c['w:stars'] = frame of the word "stars" (relative to scene start)
  return (
    <AbsoluteFill>
      <Card t={t} at={0} pal={pal} x={W * 0.12} y={H * 0.3} w={W * 0.76} h={H * 0.22}>...</Card>
      <Pill text="FREE" t={t} at={c['w:free'] ?? 6} fps={fps} bg={theme.accent} fg="#fff" />
    </AbsoluteFill>
  );
};
export const SCENES = {S01 /*, S02, ... one per scene id in project.json */};
```

- `t` = frames since the scene's nominal start (negative while the transition into it plays; it is
  already drawn then, so put entrances at `at >= 0`, or at a word cue).
- `pal` = the scene's palette (dark or light act): `bg fg mute grid card cardBorder`.
  `theme.accent` (green), `theme.accent2` (red), `theme.select` (caption box colours).
- Layout safe area for 9:16: keep content between 18 % and 82 % of the height - the caption line
  sits at the recipe's `y` (about 7 % from the top) and the handle at 86 %.
- Units are pixels of the composition (720x1280 for the reference reel); size relative to `W`/`H`.

## Motion (motion.ts)
`enter(t, at, dur=10, rise=24, blur=10)` blur+rise+fade · `exit(t, at)` · `pop(t, at, fps)` spring
scale with overshoot · `prog(t, at, dur, ease)` 0→1 · `springAt(t, at, fps, cfg)` · `map(t, [a,b], [x,y])`
· `countUp` · `rand(seed)` deterministic noise · `EASE.out/inOut/in/back`.

## Components (ui.tsx) - all take `t` and an `at` frame
| Component | Use |
|---|---|
| `Card` | rounded surface; `enterAs` rise / pop / none |
| `Window` | app/browser window with traffic lights + title/URL |
| `Pill` | badge/chip/tag that pops (`icon` optional) |
| `Tick` | round check (or `kind="x"`) badge that pops |
| `Counter` | rolling number (`from`,`to`,`dur`, prefix/suffix, decimals) |
| `TypeOn` | typed text with cursor (`cps`) |
| `Terminal` | dark terminal with lines typing at their `at` frames |
| `LineChart` | area/line drawing left→right with glowing end dot (`points` 0..1) |
| `IconGrid` | cols×rows tiles rippling in from the centre |
| `Stepper` | horizontal steps completing at `doneAt` frames |
| `Notification` | banner dropping from the top (title, body, icon) |
| `Cursor` | pointer moving through `{at,x,y}` keys, ripple on `clicks` |
| `Strike` | line drawing across its parent (relative position) |
| `Glyph` | brand-free icons: star check x doc folder user users search bolt bell link code chat layers play film eye sparkle repo download arrow |

## Real media + fluid motion (fx.tsx)
| Component | Use |
|---|---|
| `Logo icon={siX} size color` | real brand SVG from Simple Icons (`color="brand"` = official hex, or white/black) |
| `LogoTile icon t at fps size bg` | logo on a rounded app-icon tile, spring pop with a small rotation |
| `Shot src aspect t x y w h url dark at focus` | captured screenshot in a browser frame. `aspect` = image h/w (required). `focus=[{at,x,y,scale}]` = a virtual camera: the image point (x,y in 0..1) is CENTRED at that zoom, keys ease into each other, and the view is clamped so the image edge never shows. Use a key with `at: -30` to start already zoomed |
| `Tilt3D t fps path max` | perspective hover-tilt + glare following a pointer path `[{at,x,y}]` (-1..1); give two elements the same path to show identical motion |
| `CompareSlider t a b w h keys labelA labelB` | before/after wipe between two same-size images; divider eases through `keys=[{at,pos}]` |
| `Camera t dur push drift origin` | wrap every scene: continuous slow push-in + drift |
| `Float t amp period phase` | gentle sine bob for hero elements (vary `phase` per item) |
| `Shine t at` | diagonal light sweep across a card (card needs overflow hidden) |
| `MaskReveal t at dir` | wipe-reveal text/element left->right or bottom->top |
| `Underline t at color` | marker line sweeping under text |
| `Particles t n w h color seed` | deterministic drifting dust/sparkles |
| `springTo(t, at, fps, from, to)` | spring a number (position/scale) for layout morphs |

Imports in a scene: `import {Camera, Float, Logo, LogoTile, Shot, Shine} from '../../src/kit/fx';`
and `import {siGithub} from 'simple-icons';`. Images: `IMG = n => '<id>/img/' + n + '.png'`.
60 fps output: keep writing frames in design units (30 fps) - `t` arrives fractional; never assume integer `t`.

## Patterns that match UI-mockup reels
- Every beat = one hero element that enters on its word; secondary bits pop 4-8 frames later.
- Numbers count up (`Counter`) and land on the spoken number.
- In-scene morphs (a card shrinking to make room) are `map(t, [a, b], [1, 0.7])` on scale/position.
- Dark acts: light cards (`#15171B` on `#08090B`); light acts: white cards with soft shadow.
- Do not draw captions, transitions, backdrop or the handle - the engine does.

## Silicon kit (`src/kit/explainer/silicon.tsx`, 26 Nov 2026) - detailed chips, boards, dies, transistors
Ved rejected the first hardware look ("flat and poor, not detailed"). Every chip / board shot now uses this kit: real-scale
parts in plan **millimetres**, one shared light, materials that read differently (mold, bare silicon, tin, gold, copper,
ceramic, solder mask), fake depth of field. Pure SVG, seeded, every frame a function of props; a dense board frame renders
in about 1 s at 1920x1080. One import: `import {...} from '../../../src/kit/explainer/silicon'`. Worked example:
engine project `silicon-demo` (`worlds/common.tsx` `BoardShot`, `board.tsx`, `package.tsx`, `nano.tsx`, `rf.tsx`);
previews in `previews/silicon-demo/`.

**Scene** - `<SiScene id width height u origin tilt light sweep>`: wraps `IsoScene` (kit `IsoBox` works inside). `u` = px per
mm, `tilt` 0 = flat top-down, 1 = kit iso, **0.55-0.6 = the 3/4 product angle for 16:9** (0.96 for exploded stacks).
`light` = partial `SiLight` (`angle`, `ambient`, `sweepAngle`, `sweepWidth`, `envX/envY/envR`, `rim`). `sweep` = position of
the travelling specular band: `sweepAcross(p 0..1, x0, y0, x1, y1)`; only one gradient changes, the art stays memoised.
Two scenes on screen together need different `id`s. Anchors: `siPoint(u, tilt, origin, x, y, z)` -> px;
`boardPartPoint(id, u, tilt, origin)`; `boardPartTop(id)` -> `[x, y, z]`. Animating `u` / `tilt` is allowed (one eased
ramp, never per word) but re-renders all the art on those frames.

**Board** - `<LogicBoard layout? seed? density? explode parts focus dim passives>` (children drawn last, same plan space).
Default layout `boardLayout(7)` = 72 x 40 mm L-shaped phone board with a stacked upper board on an interposer.
Part ids: `soc modem wireless transceiver rf1 fem1 fem2 can1 can2 pmic charger audio nfc enclave uwb rf2`, connectors
`j1..j6`, standoffs `so1..so5`, under the upper board `nand pmic2 dram2`. `parts={{soc: {lift (mm), glow, glowColor, xray,
dieActive, explode, explodeGap, highlight, highlightColor, opacity, open, mark, kind, hide}}}`; `explode` 0..1 lifts the
upper board off its interposer; `focus="soc" dim={0.5}` darkens the rest. `<SiChassis layer="back" />` before and
`layer="front"` after the board = phone interior (frame rail, camera can, battery, speaker) so full-bleed shots have no
empty black. Own layouts: build a `BoardLayout` the way `iphoneBoard` does (parts + `add()` passive clusters).

**Chips** - `<SiChip x y w d z role|kind mark lift glow xray explode highlight opacity open perf sticker>`.
Kinds: `pop` (SoC, memory on top; `explode` -> `PackageStack`), `mold`, `nand`, `pmic`, `enclave`, `wlcsp` (bare silicon
mirror), `module` (shielded, etched lid), `shield` (can: `perf`, `sticker`, `open`), `lid` (copper-toned metal lid with an
outlined Apple mark + one edge line - the iPhone 18 Pro SoC as photographed). Roles (`SI_ROLES`): soc modem wireless pmic
nand dram rf transceiver uwb nfc audio charger enclave fem shield. **Markings are small etched code lines**, never big role
words; the defaults are generic placeholders - pass sourced text with `mark={{logo: 'apple'|null, title, top: [], lines: [],
layout: 'center'|'left', rot}}` and name the chip with a `Callout`. The Apple mark is Simple Icons `siApple`.
`<PackageStack x y w d z h spread gap mark dieActive layerOpacity>`: balls / rdl / die / memory / lid, `spread` 0..1
(spring-ready); `packageZ(spread, z, h, gap)` -> z per layer for callouts. Generic stacks: `stackZ(layers, spread, z0)` /
`<SiStack>`. Small parts: `SiPassives` (batched cluster: cap capDark res ind indTan xtal ic icSi), `SiConnector` (`plugged`,
`flex`, `gold`), `SiWall` (fence), `SiStandoff`, `SiClip`, `SiPatch` (graphite / foam / tape). Primitives: `SiPrism`,
`SiExtrude`, `SiTop` (plan-space group at height z), `SiText`, `SiGlow`, `rr` / `dot` path helpers, `SI` palette.

**Inside the chip** (plain `<g>` fragments, usable in a World svg, a NanoZoom level or on a chip top):
- `<DieFloorplan x y w h detail={0|1|2} active={{pcore1: 1}} dim labels labelScale labelOpacity shift bumps id>` - decapped
  SoC (aspect 1.5-1.6). Blocks (`SOC_FLOORPLAN`): gpu pcore1 pcore2 l2p ecores l2e slc npu isp media ddr aon usb sep pll;
  `dieBlockCentre(id)` in die units (1600 x 1000). `labels` takes a list of ids - show 6-9, not all 15. Illustrative
  floorplan, not a trace of a real die.
- `<CellFabric w h rowH sram t pulse lite>` - standard-cell rows + SRAM bit cells (the level between a core and one
  transistor), centred on (0,0).
- `<NanosheetFET cx cy scale gate t cut metal floor labels lite>` - gate-all-around nanosheet transistor cut-away;
  `gate` 0..1 switches it (channels glow, electrons flow with `t`), `cut` 0 = closed gate. `fetPoint(name, scale, cx, cy)`
  for callouts (source drain gate channel contact substrate). `<NanosheetField cols rows scale dim floor>` with the hero
  as its child = the pull-back.

**Lens** - `<SiLens W H t focus={[0.3, 0.72]} blur={7} vignette grain dust tint />` in screen space (World `Overlay`, or
after a NanoZoom): tilt-shift blur toward the top / bottom edges, vignette, film grain, bokeh dust.

**Rules learnt on the demo**
- Macro shots: `u` 30 (whole board) to 66 (one package); sweep the light once as the shot opens and once on the named part.
- Exploded stack: ease `tilt` to ~0.96 and `u` down in ONE ramp, `explodeGap` ~2.7, so every layer shows its face.
- NanoZoom: size each level so the next lands exactly (`depth = log10(next px / this px)`); the package level is a
  `SiScene tilt={0}` with `soc.xray` driven by the level `scale`; the die level draws its own surroundings.
- Fine patterns shimmer when their pitch drops under ~2 px: use `detail={1}` for small dies and keep `SiLens` blur on the far band.
