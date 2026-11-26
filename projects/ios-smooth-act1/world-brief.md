# World brief - "Why iOS feels so smooth", Act 1 "The feeling" (ios-smooth-act1, 26 Nov 2026)

You draw scenes for a 16:9 long-form tech explainer rendered with Remotion (React + SVG/CSS in headless Chrome,
**1920x1080 @ 60 fps**; scene code works in DESIGN frames @30, fractional at 60). Everything is drawn in code that
reads as 3D (2.5D): no three.js/WebGL, no AI images, no new fonts. Real photographs are allowed only through
`PhotoStage` (below). English. No creator handle or channel name anywhere.

## The client and the bar
Ved is a senior graphic designer. His notes on this series - treat each as a hard requirement:
- No presenter; the world fills the frame. "Each word spoken I want a visual change ... animation and new world design":
  something in the picture must visibly react to MOST spoken words (light up, build, count, move, transform).
- "Camera smoothly, not frame jiggle": the camera moves only to things the voice names, one eased move per phrase.
- He rejected a first hardware frame as "flat and poor, not detailed" and a plain photo card as "looks cheap".
  The bar is a premium tech-channel render: full-bleed, dense micro-detail, real materials (glass, titanium, matte
  mold compound, brushed tin, gold, emissive OLED), real light (pools, sweeps, rim light, bloom, contact shadows),
  depth (foreground/background layers, depth-of-field blur at the edges). Nothing flat, nothing small floating in
  black, no empty half of the frame, no generic placeholder labels.
- Approved look to match: `C:\Users\VED\Documents\Local\Reverse\previews\silicon-demo\01_board_hero.png`,
  `03_soc_exploded.png`, `04_die_floorplan.png`, `09_photo_stage.png` (view them first, max_side 960). Their code:
  `D:\VideoBlueprint\remakes\engine\projects\silicon-demo\worlds\*.tsx` (read the one closest to your scenes).

## Frame layout (landscape)
- Key content (text, numbers, hero objects): x 4-96 %, y 5-77 % of the frame. Art itself is full-bleed.
- The engine draws captions at y 80-88 % (36 px, centred, on a soft fade) and a Source credit bottom-right. Art may
  run under the caption band but nothing readable there. Do not draw captions yourself.
- Sizes on a 1920x1080 frame: labels >= 26 px, body >= 30 px, hero numbers 110 px+. `unit(W, H)` = 1 here.

## How scenes work
- Your file exports one `React.FC<SceneProps>` per scene id (`{t, dur, W, H, spec}`; t = design frames from the scene
  start, `spec.beats`, `spec.cues['w:word']`). Keep the export names; `scenes.tsx` imports them.
- Usual form: a World - `export const S03 = scene(myWorld)` with `scene` from `./_scene`. Read
  `src/kit/explainer/world.tsx`: `WorldDef = {id, home, anchors: {name: {x, y, zoom}}, aliases?, palette?, Draw, Overlay?}`.
  In landscape, world px are 1:1 with a 1920x1080 frame, an anchor lands at the frame centre; draw in one big svg
  (or div) in world px. The camera director flies to an anchor when its name (or an alias) is spoken: give each scene
  2-4 anchors named after the nouns it should frame, with zooms that keep the subject large.
- The per-word change comes from YOUR Draw: `onWord(t, beats, 'word')` (0..1 spring), `wordAt(beats, 'word')`,
  `pulseOn`, `countOn`, `nthBeat`, `step`, `Burst`, `Ripple` (all in world.tsx). Never fake a camera with a
  word-triggered whole-world scale; an inner zoom is ONE smooth eased ramp across a phrase.
- Continuous dives into the small: `NanoZoom` in `src/kit/explainer/nano.tsx` (see silicon-demo `worlds/nano.tsx`).
- `Overlay` draws screen-locked labels, counters and callouts.
- Timeline, voice text and every word's design frame: `projects/ios-smooth-act1/beats.md` (read this; do NOT open
  project.json, it is 100 KB).

## Kit (read what you use; never edit anything under `src/kit`)
- `silicon.tsx` (barrel): `SiScene`, `LogicBoard`, `SiChassis`, `SiChip`, `PackageStack`, `DieFloorplan`, `CellFabric`,
  `NanosheetFET`, `NanosheetField`, `SiLens`, `SiPassives`, `SiConnector` ... API: skill `references/kit.md`, section
  "Silicon kit". Use it for every board, chip, die and transistor - do not draw simpler chips by hand.
- `photostage.tsx`: `PhotoStage` - the ONLY way to show a real photograph (lit glass print + editorial type).
- `premium.tsx` (`DrumCounter`, `HeroNumber`, `GlassCard`, `PhoneFrame`, `Pedestal`, `IsoBarChart`), `stage.tsx`
  (`Callout`, `Stamp`, `Badge`, `Meter`, `FlowPath`, `FONT`, `MONO`), `tokens.ts` (colours, springs), `iso.tsx`.
- Brand marks: the Apple mark only via Simple Icons (`import {siApple} from 'simple-icons'`, as silicon-demo does),
  only to identify the product; no other company logos (Samsung, Intel, Qualcomm, TSMC = plain text labels).
- Missing a helper? Write it inside your own world file.

## Facts - use exactly these; no other numbers, dates or part numbers
- Display: redraws up to 120 times a second (120 Hz) -> a frame deadline of about 8.3 ms; 120 x 60 = 7,200 frames a
  minute. ProMotion: "up to 120 Hz"; Apple publishes NO minimum, so show no low number (the dial just drops).
- Render loop, Apple's own stage names: Event -> Commit (in the app) -> Render prepare -> Render execute (in the
  separate render server process, on the GPU) -> Display. A frame that misses the deadline = a "hitch".
- R&D: $45.77 billion in fiscal 2026 = about $125 million a day ("$125,000,000 / day"; footnote "Apple FY2026 R&D:
  $45.77 billion").
- History: 2008 Apple buys P.A. Semi for $278 million · 2010 A4, the first chip Apple designed itself · 2013 A7, first
  64-bit chip in a phone · 2017 A11 Bionic adds the Neural Engine · 2020 M1, first Apple silicon Macs (replaces Intel) ·
  2025 C1 modem · 2025 N1 wireless chip (Wi-Fi 7, Bluetooth 6, Thread) · 2026 A20 Pro in iPhone 18 Pro, Apple's first
  2 nm chip ("TSMC 2 nm", nanosheet transistors). 2008 -> 2026 = 18 years.
- A20 Pro: 6-core CPU, 7-core GPU, 32-core Neural Engine - only if you label a die. No transistor count, no real
  part numbers (markings other than "A20 Pro" stay generic). The die floorplan is an illustration: if a die is on
  screen for more than a moment, include a small "illustration" tag.
- iPhone 18 Pro look (see `reference_pack.md` drawing notes and the photos under `public/ios-smooth-act1/img/`):
  titanium, camera plateau across the full width of the back with three lenses in a triangle at the left.
- The 8 ms late frame in the hook is one missed 120 Hz refresh (8.3 ms), shown as "8 ms".

## Rules
- Pure functions of `t`: no Math.random (seeded hashes), no CSS animation/transition, no timers, no effects.
- TypeScript strict must pass: `npx.cmd tsc --noEmit -p .` in your sandbox.
- Unique SVG ids (prefix with your scene id). Performance: a frame should render in about a second; memoise static
  layers (`React.useMemo` keyed on constants), few blur filters, never blur huge groups.
- Hook rule (S01 only): in the first ~6 s a BIG picture change every 0.5-0.7 s; one layout holding > 1 s is a fail.
- Seams: `transitionIn` per scene is in beats.md. A `portal` grows the new scene out of `origin` (screen fraction):
  the outgoing scene should end with its key element there. A `dissolve` between two scenes of the same world must
  start on the previous scene's final framing. A `push` slides in.
- Write ONLY your own world file(s) in `projects/ios-smooth-act1/worlds/` (the other files are placeholders owned by
  other agents - leave them) plus scratch files under `out/`.

## Your loop (you pay per request - be efficient)
1. Read: beats.md, world.tsx (skim), the silicon-demo world closest to your scenes, the kit.md section you need.
2. Write the scenes. Type-check.
3. Stills, MANY frames per call (bundling takes ~45 s, each frame < 1 s):
   `node stills.mjs ios-smooth-act1 <f1,f2,...> 0.5 <prefix>` (OUTPUT frames @60 = scene from + 2 x design frame;
   scale 0.5 -> 960x540 in `out/`). Pick frames right after key words and during camera moves.
   Contact sheet: `magick montage out/<prefix>*.png -tile 4x -geometry 480x270+4+4 out/<prefix>_sheet.jpg`, then
   view_image the sheet (max_side 1920) and 2-3 single frames at full detail.
4. Motion check per scene: `node stills.mjs ios-smooth-act1 <from>:<to>:6 0.25 m<id>_` then
   `magick montage out/m<id>_*.png -tile 10x -geometry 240x135+2+2 out/m<id>_strip.jpg` - consecutive tiles must
   flow (no jumps, no popping, something changing in every tile).
5. Critique hard against the bar and the approved previews, fix, re-render. At least two full look-and-fix rounds;
   stop when your scenes would not embarrass a premium tech channel, or when the budget line tells you to wrap up.
6. Final: a contact sheet `out/final_<group>_sheet.jpg` with 4+ frames per scene, and your report: files, anchors per
   scene, what animates on which words, what is still weak.
