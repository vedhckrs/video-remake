# World brief - "How does an SSD store your files?" v2 (no presenter, a visual change on every word)

You are designing one or more WORLDS for a 9:16 tech explainer rendered with Remotion (React + SVG, headless
Chrome, 1080x1920 @ 60 fps; scene code works in DESIGN frames @30, fractional at 60). Everything is drawn in code:
flat SVG/CSS that reads as 3D (2.5D). No 3D engine, no three.js/WebGL, no images, no fonts beyond the kit's.

## What the client (Ved, a senior graphic designer) asked for
- "remove presenter, I don't want it anymore" - the world fills the whole frame (captions sit on top, y 15-25 %).
- "each word spoken I want a visual change - camera zoom and animation and new world design".
- Earlier review: our first demo "looks cheap" because objects floated small in black with flat colours.
  The quality bar is the reference channel: full-bleed rich hardware illustration, real materials (gold, glossy
  epoxy, metal, glass), dense micro-detail (pins, pads, traces, capacitors, silkscreen), real lighting (glows,
  light pools, beams, bloom), depth of field, nothing flat or empty.

## How a world works (read the code: src/kit/explainer/world.tsx)
- A scene renders `<World def={myWorld} t={t} dur={dur} beats={spec.beats} W={W} H={H} />`.
- `spec.beats` = one beat per spoken content word, from project.json: `{t, w, word, kind: number|action|state|object|drift, s: 1..3}`
  (t in design frames from the scene start). Read your scenes' beats in `projects/ssd-explainer/project.json`.
- The camera DIRECTOR (`direct` in world.tsx) moves the camera on EVERY beat: a word whose cleaned text equals an
  anchor name (or its plural, or an `aliases` entry) makes the camera fly there and frame it at the anchor's `zoom`;
  other words get a micro-push / punch-in / drift. So: **name anchors after the words** (`chip`, `gate`, `electrons`...)
  and add aliases for the other nouns in your sentences. Anchor zoom 1 = 1 world px per screen px on the 1080 frame;
  the anchor point lands at screen (540, 0.53*1920).
- Your `Draw` gets `{t, dur, beats, cam, W, H, u, step}` and draws in WORLD px inside one big `<svg>` (any size,
  e.g. 2600x3200). It must ALSO animate on the words: use the helpers `onWord(t, beats, 'word')` (spring 0..1),
  `wordAt(beats, 'word')` (frame), `pulseOn`, `countOn`, `nthBeat`, `step` (index of the last fired word beat) to
  build / reveal / transform elements word by word (e.g. each noun lights its object, each number counts, each
  verb performs its action). Camera movement alone is not enough - something in the world must react to most words.
- `Overlay` (optional) draws screen-locked things (labels, counters) with `toScreen(x, y)` to follow world points.
- The engine adds atmosphere (palette gradient, parallax particles, blurred foreground bokeh), a light pulse on each
  beat, impact shake on strong beats, caption gradient and vignette. Set a `palette` per world so each world has
  its own colour mood (`bg0`, `bg1`, `particles`, `glow`).
- Helpers to draw with (read them, do not edit kit files): `src/kit/explainer/iso.tsx` (IsoScene, IsoBox with
  lit/gloss/glass/emissive/topContent/frontContent, IsoChip, IsoBoard, IsoLaptop, IsoPanel, ExplodedStack, IsoCylinder,
  project), `hardware.tsx` (MAT materials, EpoxyChip, SmdArray, GoldFingers, TracePattern, Silk, MountHole, CellField,
  Beam, StageLight), `premium.tsx` (DrumCounter, HeroNumber, GlassCard, IsoTileField, IsoBarChart, MacroDie, Pedestal),
  `stage.tsx` (Callout, Stamp, Badge, Meter, FlowPath, Footnote, FONT, MONO), `tokens.ts` (C colours, sp springs,
  shade/tint/mix/alpha). v1 art you may reuse or improve: `projects/ssd-explainer/scenes_v1.tsx` (SsdBoard, Bucket,
  PhotoThumb, Electron). Engine smoke test: `projects/world-test/scenes.tsx` (if present).
- If a helper is missing, write it INSIDE your world file. Do not edit anything under src/kit.

## Rules
- Pure functions of `t`: no Math.random (seed with sin-hash), no hooks with side effects, no CSS animation, no timers.
- Valid TSX for TypeScript strict. Unique ids for SVG gradients/filters (prefix with your world id).
- Keep the main subject in the middle 80 % of the width and between y 24 % and 92 % of the height at the
  anchor framings; captions own the top band.
- Each world must feel like a DIFFERENT PLACE (colour mood, environment, scale), yet the same art direction.
- Performance: a frame should render in well under a second - prefer a few hundred SVG elements, avoid huge
  blur filters on large groups (one or two small blurs are fine).

## Your sandbox (only yours)
- Folder: `D:\VideoBlueprint\remakes\<sandbox>\` - a full engine copy (node_modules/public are shared junctions).
- Write your world(s) to `projects/ssd-explainer/worlds/<world>.tsx` exporting `export const <name>World: WorldDef`.
  `projects/ssd-explainer/scenes.tsx` already wires your scenes to your world names - keep the export names.
- Type-check: run `npx.cmd tsc --noEmit -p .` in the sandbox folder (PowerShell or Bash).
- Render a still: `npx.cmd remotion still src/index.ts ssd-explainer out/<name>.png --frame=<F> --scale=0.5`
  where F is an OUTPUT frame @60 = (scene.from) + 2 * design_frame. Scene `from` values are in project.json.
  Render 6-10 stills spread over your scenes (including right after key words), LOOK at them (Read the png),
  fix what is weak, and repeat at least twice. Make a contact sheet with ImageMagick if useful:
  `magick montage out/*.png -tile 5x -geometry 270x480+4+4 out/sheet.jpg`.
- Do not run full video renders. Do not touch other sandboxes or D:\VideoBlueprint\remakes\engine.

## Report back (short)
Which files you wrote, the anchors/aliases per world, what animates on which words, the still frames you checked
(paths to your final contact sheet), and anything you could not get right.
