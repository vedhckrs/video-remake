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

## PhotoStage (`src/kit/explainer/photostage.tsx`, 26 Nov 2026)
The way to show ONE real photograph (Ved rejected a plain framed photo over a dark band as "cheap"): an editorial
spread - the photo as a lit, slightly turned glass print on one side, big typography on the other, studio backdrop.
`<PhotoStage src="<id>/img/a4.jpg" t W H dur at={0} aspect={1} side="left" eyebrow="Real photo · 2010" title="Apple A4"
lines={[...]} reveal={[cue frames]} accent="#F2B56B" />`. Nothing is drawn over the photo and it is not recoloured
(share-alike photos stay unaltered). Give the scene a `credit` in script.json. Plain `Photo` stays for full-bleed use.
The landscape caption scrim is now a long soft fade (strength 0.5), never a solid band.

## cine3d (real 3D) (`src/kit/cine3d/`, 26 Nov 2026)
**The rule: real 3D (three.js) is ONLY for the real iPhone 18 Pro model and the hero transistor.** Boards, chips,
dies, packages, diagrams and everything else stay 2D code (silicon kit, iso kit). Ved approved this as the one
exception to "no three.js" after rejecting the code-drawn phones and the flat transistor.

Files: `core.tsx` (camera keys, projection, canvas, studio light), `phone.tsx` (PhoneShot, phoneView), `innards.tsx`
(the 2D inside of the phone), `transistor.tsx` (Transistor3D, fetView), `index.ts`. Import from `src/kit/cine3d`.
Everything is a pure function of the design frame `t` (fractional at 60 fps). The GLB / HDRI load is held with
delayRender by `<ThreeCanvas>`. There are no clocks, timers or `Math.random`.

**Apple's model never leaves the engine.** `public/models/iphone-18-pro.glb` (and `public/hdri/*.hdr`) exist only in
`D:\VideoBlueprint\remakes\engine\public\`. Never copy them into this repo, a skill zip or an upload package
(`.gitignore` blocks `*.glb`, `*.usdz`, `*.hdr`, `models/`, `hdri/`). A fresh engine needs the two folders copied in
by hand from `D:\VideoBlueprint\remakes\incoming\iphone-18-pro-3d-model\`, plus the npm packages in `package.json`
(`three`, `@remotion/three`, `@react-three/fiber`, `@react-three/drei`, `postprocessing`).

**Render flag (needed):** a project that uses cine3d sets `"gl": "angle"` in `script.json` (plan_timeline copies it
to `project.json`; `render.py` then passes `--gl=angle` for stills and video). Without it headless Chrome draws
three.js in software: about 22 s per 1080p frame instead of about 1 s. It is NOT set globally in
`remotion.config.ts`, because ANGLE anti-aliases thin 2D lines slightly differently (0.37 % of the pixels of a test
frame changed), so 2D-only projects keep Chrome's default and render bit-identically. In a Node script use
`openBrowser('chrome', {chromiumOptions: {gl: 'angle'}})` and the same `chromiumOptions` on `selectComposition` and
`renderStill` (pattern: `projects/cine3d-demo/stills.mjs`, which also bundles only that one project).

### Camera, effects, light (core.tsx)
- Keys are in design frames and joined by a non-uniform Catmull-Rom curve: the move starts and ends at rest and has no
  corners (`hold: true` = a full stop). Use all `OrbitKey` `{t, yaw, pitch, dist, tgt?, fov?, focus?, roll?}` (yaw 0
  looks at the phone's BACK, 180 at the screen; pitch above 0 looks down) or all `CamKey`
  `{t, pos, tgt, fov?, focus?, roll?}`. `focus` = the point that is sharp (default: the target).
- `<Stage3D clipping>` turns on per-material clipping planes (off by default; the transistor's cut needs it).
- `fx={{dof: {range, blur, taps} | false, bloom: {threshold, intensity, radius} | false, exposure, contrast,
  saturation, tint, msaa}}`. `range` = depth in world units that stays sharp, `blur` = largest blur radius in px of a
  1080-high frame. The depth of field and the grade are our own alpha-aware passes (the stock DepthOfField keeps its
  blur radius in the alpha channel, which turns a transparent canvas opaque).
- `light={{main, lamp, rim, fill, top, env, hdri, hdriLevel, warm, cool, keyFrom, castShadow}}` (`<Studio>`): a warm
  key softbox from the upper left and a cool blue rim from the right, like the 2D kit. **The key light is `main`, not
  `key`** (React keeps `key` for itself, so it never arrives). `lamp` strengthens only the shadow-casting lamp.
  `hdri: HDRI.studioSmall | HDRI.photoStudio` lays a real studio under the softboxes.
- The canvas is transparent, so it sits over any 2D world. `quadMatrix3d(w, h, [tl, tr, br, bl])` gives the CSS
  `matrix3d` that lays a 2D box on four projected points.

### PhoneShot
```tsx
const CAM: OrbitKey[] = [{t: -10, yaw: 144, pitch: 5, dist: 39, fov: 22, tgt: [0, -1.6, 0]},
                         {t: 200, yaw: 161, pitch: 7, dist: 36, fov: 22, tgt: [0, -1.6, 0]}];
<PhoneShot t={t} W={W} H={H} cam={CAM} pose={POSE} shell={xrayShell(x, open)} screen={<Feed t={t} />}
           interior={<PhoneInnards />} floor={{y: -5.02, shadow: 0.7, reflect: 0.3}} light={{}} fx={{}} />
const v = phoneView({t, cam: CAM, pose: POSE, W, H});   // pure maths for the 2D layers, no canvas
v.point('chip')          // {x, y, depth, behind}: px of a named point or of any [x, y, z]; 2nd argument = lift
v.interior.point(ix, iy) // px of a point given in inside-plane px;  v.backFacing > 0 = the back faces the camera
```
- Model space: the phone is 10 units tall (1 unit = 15 mm), y up, **the back faces +z**, the screen is the plane
  z -0.455. Named points (`PHONE_POINTS`): backCentre, logo, lensMain, lens2, lens3, flash, mic, lidar,
  plateauCentre, screenCentre, screenTL / TR / BR / BL, island, chip, top, bottom, usb.
- `pose` = keys for the phone itself `{t, yaw?, pitch?, roll?, pos?}`. The lights stay put, so a turning phone drags
  real reflections across its faces.
- **Screen content** (`screen`): any React / HTML drawn in a `screenPx` box (default 402 x 874). Method: the four
  corners of the display are projected with the shot's camera and the box is mapped onto them with CSS `matrix3d`
  (perspective-correct, exact on every frame, text stays crisp). The layer lies UNDER the canvas: the screen glass is
  drawn as a hole in the canvas alpha plus an additive mirror of the studio, so the real bezel cuts the rounded
  corners, the body hides the screen as the phone turns away, and reflections ride on the glass. The depth of field
  does not blur this layer, so keep the focus near the screen while it shows.
- **Shell** (`shell`): per group `{opacity, glass, lift}`. Groups found in the GLB (94 meshes with hashed names,
  sorted by position, size and material in `classify`):
  `display` (screen glass with Apple's wallpaper, black border, Dynamic Island, front camera),
  `frame` (the burgundy unibody - sides, plateau and the back round the glass are ONE mesh - buttons, Camera Control,
  USB-C, grilles), `backGlass` (the inset glass panel 4.28 x 6.50 with its coloured under-layer, and the Apple logo),
  `camera` (three lens stacks, flash, microphone, LiDAR), `inner` (two black filler blocks).
  The unibody has a real window behind the glass panel, so the x-ray is `xrayShell(x, open, lift)`: the panel turns
  to ghost glass with bright edges (`glass`), and `open` lifts it off along the phone's normal, while the unibody,
  plateau and lenses stay real. Add `frame: {glass: 1}` for a whole-body ghost.
- **Inside view** (`interior`): 2D content on a plane inside the body (`PHONE.interior`, 1356 x 2916 px), mapped the
  same way and seen through the glass. `<PhoneInnards parts focus dim sweep light />` draws the tray, the battery and
  the silicon kit `LogicBoard` from straight above; `innardsPoint('soc' | 'modem' | ...)` gives a part's phone-space
  point and `PHONE_POINTS.chip` is the SoC. While an inside view shows, the display and filler blocks are not drawn.
- Changes to Apple's materials (three.js draws black transmission glass as a black disc): lens covers are dark
  see-through glass, the lens elements a coated violet, a code-drawn deep disc and coated dome sit under each cover,
  the logo is polished metal under clear glass, other transmission glass is plain alpha glass. The finish in the file
  is burgundy; other finishes are not built.

### Transistor3D (v2, 26 Nov 2026: a technical cut model of one device in a row)
```tsx
<Transistor3D t={t} W={W} H={H} cam={CAM} gate={fetSwitch(t, [36, 96])} cut={0.52} sheets={3} metal={1}
              context={{x: 3, back: 1}} haze={0.5} />
<Transistor3D ... field={{cols: 41, rows: 25, activity: 0.5}} background="#04070E" fog={['#04070E', 60, 300]} />
<Transistor3D ... W={470} H={470} lite />                      // small inset; wrap in a round div for a lens
const v = fetView({t, cam: CAM, W, H, cut: 0.52});            // pass the same `cut` (some points sit on the cut face)
v.point('gate')
```
- Axes: x = source to drain, y up, z along the gate. The cut-away opens the +z side, so film it from +z, from a
  three-quarter angle (yaw 12-44, pitch 8-27, distance 10-20 worked in the demo).
- What is built: bulk silicon with a cut front face (layer stack), sub-fin, trench oxide; rounded nanosheets that
  run through the gate into source and drain; the gate stack (high-k sleeve, work-function metal, tungsten fill,
  nitride cap); frosted-glass sidewall spacers with ceramic inner spacers between the sheets; faceted, seeded
  epitaxial source / drain crystals; tapered trench contacts with a liner; vias; two levels of copper lines with a
  barrier liner at right angles; micro-roughness on every face, baked contact shading, a warm kicker light, fog.
- `gate`: 0 off, 1 on. **Use `fetSwitch(t, [frames...], dur = 12)`** for the value: each frame in the list toggles
  the gate, eased over `dur` design frames with a short overshoot of the glow (never a hard pop). On: the sheets glow
  from inside (strongest under the gate), fine carrier streaks run source to drain, the gate metal on the cut face
  warms, the high-k lining brightens and faint rings shimmer round each sheet.
- `cut` 0..1: one slice through the gate stack of the hero AND its neighbours along the fin. The cut face shows the
  layers as a clean cross-section with a thin bright edge. About 0.5 = sheets leaving the cut face (hero frames),
  0.8 = deep cut (macro frames), 0 = closed.
- `context={{x, back}}` (default `{x: 3, back: 1}`, `false` = a lone device): neighbours along the fin and rows
  behind, darker, falling into fog and the depth of field, so the hero reads as one device in a fabric.
  `field` replaces it with a large instanced grid for a pull-back (give it `background` and `fog`; only the hero is
  cut there and there is one metal level). `lite`: no neighbours, one metal level, fewer carriers - reads at 300 px.
- `metal` 0..1 lifts contacts, vias and lines away; `haze` 0..1 is a faint light cone; `fog={false | [colour, near,
  far]}` (default: a dark haze starting just behind the hero).
- Anchors (`fetView(...).point(name)`): centre, gate, gateCap, cutFace, tungsten, workFunction, highK, spacer,
  innerSpacer, sheets, sheet0..n, source, drain, contactSource, contactDrain, via, metal1, metal2, oxide, subFin,
  substrate, and **pitchA / pitchB** = two points exactly one gate pitch apart on the oxide in front of the row:
  draw the scale tick between them in 2D ("one gate pitch", with a number only if the script has a sourced one).
- No labels are drawn in 3D: add `Callout`s at the anchors and always an "illustration" tag.
- A custom shot with `TransistorModel` needs `<Stage3D clipping>` (the cut uses a clipping plane).
- `TransistorModel`, `PhoneModel`, `PhoneFloor`, `Stage3D` and `Studio` are exported for a custom shot.

Proof project: `projects/cine3d-demo` (10 scenes, previews in `previews/cine3d-demo/`). Render cost: see the cine3d
entry in `ved-preferences.md`.
