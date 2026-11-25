# Style: keyframes-explainer (2.5D code-drawn tech explainer with a presenter)

Learned from 12 reference explainers (Phase A, 24 Nov 2026): every video blueprinted with video-blueprint,
reviewed by Claude Fable 5.2 through Ved's API, 12 style dossiers merged into one system.
Sources: `D:\VideoBlueprint\jobs\kf01..kf12\style_dossier.md`, merged `keyframes-explainer/style_system.md`
(this folder - the full spec: drawing, presenter, 18 templates, camera grammar, captions, colour, motion
tokens, sound, script formula) and `style_system.json` (scene_templates, motion_tokens, sound_profile,
37 quality_gates). Read the .md once per session before scripting.
Everything is drawn in code: flat SVG/CSS that reads as 3D. No 3D engine, no three.js, no WebGL, no
footage, no AI images. Our video uses its own original presenter ("Juno") and never the reference
creator's name, handle, mascot or look.

## The formula (why it works)
1. Show the answer before explaining it: motion on frame 0, the hero object transforms within 3 s,
   >= 3 picture changes in the first 3 s. No logo, no greeting.
2. Open on a gap (question, paradox, contradicted belief); close the loop before the CTA.
3. One world, one stage: a single object/metaphor carries 15-65 s; re-colour and re-state it, never throw it away.
4. Long scenes, fast picture: scenes average ~19 s, but something changes every 1.0-1.5 s
   (callout, swap, camera step, pose, caption).
5. Locked three bands: captions y 15-25 %, stage y 25-72 % (the only part with a camera), presenter y 72-100 %.
6. The voice is the clock: ~200 wpm, caption words 50 ms early, visual events land on stressed words; nothing cut to the beat.
7. Name, show, lock: caption names it, one animation shows it, a number/stamp/badge locks it (3-6 s per step).
8. Numbers are objects: every spoken figure gets a rolling readout with unit (and a source footnote).
9. Colour is logic: one meaning per hue; state = colour + icon + motion; honesty (limits, 'illustration') on screen.
10. Call back, then act out the CTA (Follow / Send / comment keyword pressed by a cursor). No outro card.

## Making one (topic -> MP4)
No reference video is needed: the style library replaces steps 1-2 of the main loop.
1. `rm/new_project create <id>`; write `script.json` with `"style": "explainer"`,
   `"output": {"width": 1080, "height": 1920, "fps": 60}`, `"handle": null`.
   Script formula (style_system 11): hook 3-7 s / promise 3-8 % / basics via ONE analogy 15-25 % /
   3-5 mechanism steps 35-45 % / caveat 8-15 % / proof 5-10 % / payoff (hook object returns) 5-8 % / CTA.
   75-100 s at 195-205 wpm = 250-330 words. Sentences 4-14 words, second person, present tense;
   jargon only after the picture ("X - plain-words gloss"). Few scenes (4-8 stages), each 8-25 s;
   `chapter` labels on scenes for the rail (> 60 s). `keywords`: one `select` per sentence on a number,
   proper noun or the contrast word. `poses`: optional `[{"word": "...", "pose": "..."}]` overrides.
   `presenter`: optional `{"enter_s", "anchor", "width_frac", "hide": [[a, b]] (design frames), "enter_pose", "outro_pose"}`.
   `hits`: sounds on the words/frames where things land (see the sound map). Facts true and sourced.
   Show Ved the script table + voice cost; wait for his yes.
2. Voice (`rm/tts`), sound palette (`sound_design.py palette`), `rm/plan_timeline` - in explainer
   mode it copies this folder's `recipe.json`, makes 2-4-word caption phrases, the presenter track
   (entry 3-7 s at the end of the first sentence, keyword poses, explain-pose cycle, max hold 3.7 s,
   lip timing from the words) and the rail.
3. Scenes (`scenes.tsx`): compose each stage from the kit (below). Design frames are @30; the engine
   samples at 60. Draw everything for 1080x1920 (`u = unit(W)` = 1).
4. `rm/render <id> stills` -> LOOK; motion strips of every scene; fix.
5. Render, `sound_design.py cues/music/mix/listen` (music defaults to -18 dB under the voice here), then
   `rm/qa_explainer <id>` - all hard gates must pass; tick the manual list on the contact sheet.
6. Hand over: MP4, QA report, earshot listen report, cost.

## The kit (`src/kit/explainer/`)
| File | What |
|---|---|
| `tokens.ts` | colours (bg, materials, semantic ok/warn/error/info/marker, presenter `brand` pink - used by nothing else), `faces()` shading, springs `pop/settle/camera/pose/bouncy` (`sp(t, at, name)`), durations, staggers, `BANDS`, `unit(W)` |
| `iso.tsx` | `IsoScene` (u px per world unit, origin, `tilt` 0..1 plan->iso), `IsoBox` (3 face tones, AO, edge highlight, contact shadow, `glass` x-ray, content on top/front/side faces), `IsoSlab`, `IsoChip` (pins, laser print, `xray` die reveal), `IsoBoard` (traces + children), `IsoLaptop` (`open` deg, screen content 160x100), `IsoPanel` (monitor/phone/sign with screen content), `ExplodedStack` (`spread`), `IsoCylinder`, `Tilt`, `OnFace`, `ContactShadow`, `Glow`, `project()`/`useProject()` (world -> screen for callouts) |
| `stage.tsx` | `GridBackdrop`, `StageCamera` + `camAt`/`camPoint` (keys: spring reframe, `push` macro, `zoomThrough`, `whip`; drift on holds), `zoomThrough()` helper (swap art at the blur peak), `Callout` (dot pop, leader draw, label fade; auto flip/clamp), `Label`, `Odometer`, `BigNumber`, `Meter`, `Card`, `Marker`, `Stamp`, `Badge`, `FlowPath` (wire + packets), `UnitGrid`, `Bars`, `Footnote`, `ProgressRail`, `focusStyle` (dim the rest), `blurIn` |
| `hardware.tsx` | detail layer for reference-level hardware: `MAT` materials (epoxy, pcb, gold, metal, ceramic, tin), `SmdCap`/`SmdArray`, `GoldFingers`, `EpoxyChip` (glossy, laser-etched, `xray` + `xrayNode`), `Silk`, `TracePattern`, `MountHole`, `CellField` (glowing flash cells), `Beam`, `StageLight`, `DepthBands` (fake depth of field), `StageBand` (crop full-bleed art to the stage band) |
| `premium.tsx` | physical versions of the templates: `DrumCounter` (mechanical odometer with carry + motion blur), `HeroNumber`, `GlassCard` (3D swing-in, layered shadows, glass sweep), `IsoTileField` (quantity as rising/glowing tiles), `IsoBarChart` (3D glossy bars), `Pedestal` (lit stand for compare), `PhoneFrame` (titanium phone, screen = children), `MacroDie` (extreme close-up chip package), `MetalTitle` |
| `presenter.tsx` + `juno_art.tsx` (`juno_head.tsx`, `juno_arms.tsx`) | `Presenter` rig (IK arms, 37 poses in 14 groups, sprung changes with anticipation, blink, breath, lip motion, eye-line, pop entrance, re-anchor `shift`), `POSES`, `autoPose(word)`. The artwork is code drawn by Claude Fable 5.2 against `references/example-explainer/juno_art_brief.md` (geometry contract + API); to restyle, re-run that brief and keep the API |
| `captions.tsx` | `ExplainerCaptions`: phrases, bold active / grey spoken words, corner-bracket keyword box that springs between keywords |
| `templates.tsx` | `CompareSplit` (pedestals + drum counters), `EvidenceDoc` (glass browser card), `Terminal` (dark glass), `RecapList` (glass rows), `SocialCTA` (phone + fingertip press), `ChapterCard` (metal title), `Cursor` (`finger` option) |
The engine adds backdrop, presenter, rail and captions automatically for `"style": "explainer"` projects;
scenes draw only the stage. Callouts, numbers and labels live OUTSIDE `StageCamera` (screen-locked) and
take their anchors through `camPoint(...)`, so they never scale off-screen.

## Quality bar (Ved's review, 24 Nov: the first kit demo "looks cheap")
What made it cheap, and the rule that fixes each - check every still against these before rendering:
1. **Full-bleed stage.** The hero art fills the stage band edge to edge (cropped by the frame, `StageBand`),
   never a small object floating in black. Use `DepthBands` for blurred top/bottom edges.
2. **Materials, not flat fills.** Every `IsoBox` is lit (default), chips/metal/gold get `gloss`; use `MAT`.
3. **Micro-detail density.** Boards carry `TracePattern`, `SmdArray`s, `Silk`, pads, holes; dies carry
   cores, cache arrays, I/O strips. Hundreds of small parts, seeded so they are stable.
4. **Light.** `StageLight` pool under the hero, glow/bloom on active parts (`emissive`, `CellField`), light sweeps.
5. **Physical numbers and cards.** Numbers are `DrumCounter`/`HeroNumber`; cards are `GlassCard`; charts and
   grids are `IsoBarChart`/`IsoTileField`; CTAs happen on `PhoneFrame`. Avoid flat placeholder rectangles.
6. **Labels on glass plates** (`Callout` plate default on), leader lines ending at the label edge.
7. **Presenter at reference scale** (`widthFrac` 0.56 default): hair top at ~70 % of the frame height.
Reference examples: `references/example-explainer/ssd_hero_scenes.tsx` (full-bleed board) and
`showcase_scenes.tsx` (every premium template), sheets `showcase_sheet.jpg`, `juno_poses.jpg`.

## Scene recipes for the topic-specific templates (compose from the kit)
- **hook_hero** (2-6 s): the topic's hero object (IsoChip/IsoLaptop/...) already moving on frame 0; it
  transforms by 3 s (tilt plan->iso, x-ray, explode, counter jump). Sound: ding at 0.3-0.6 s, whoosh on the change.
- **hero_callouts** (1-5 s each): hero centred in the stage band, 2-3 `Callout`s 7 frames apart, leader
  to the part, label TITLE / spec / gloss. Pop per label.
- **persistent_stage** (5-25 s): one IsoScene kept for several sentences; parts change state (colour +
  `Badge` + motion), `focusStyle` dims the rest, `StageCamera` reframes between parts.
- **macro_zoom** (1-4 s): `StageCamera` `push` (s 2-4) or `zoomThrough` to an L2 drawing of the part
  (pads, cells, microtext) swapped at the blur peak - `MacroDie` for processors, `CellField` for flash;
  whoosh + click on landing.
- **big_number** (1-2.5 s): `HeroNumber` (drum counter lands on the spoken word), unit, source line.
- **compare**: `CompareSplit` (or two IsoScenes) + stamp/ratio.
- **evidence_card**: `EvidenceDoc` / `Card` with `Marker` on the quote.
- **device_meter**: `IsoLaptop`/`IsoPanel` with live screen content + `Meter` stepping green/amber/red.
- **exploded_xray**: `ExplodedStack` spread on a spring, `IsoChip xray`, callouts per layer.
- **flow_wires**: nodes (IsoBox/Card) + `FlowPath` with packets; ding per arrival.
- **chart_build**: `IsoBarChart` (stagger 4 f, `highlight` the answer) or an SVG line drawn with dash offset; impact on the peak.
- **unit_grid**: `IsoTileField` (quantity as a picture, lit tiles rise and glow), `lit` count animates; rapid ticks.
- **focus_overlay**: `Card` popped over the dimmed stage (`focusStyle`).
- **chapter_rail**: `ChapterCard` + the persistent `ProgressRail`; riser before, impact on landing.
- **terminal_type** `Terminal`; **recap_list** `RecapList`; **social_cta** `SocialCTA`.
- **thumbnail_callback**: shrink the previous stage to a 0.2-0.25x corner card (Card + scale) to call it back later.

## Camera & transition grammar
Element swap is the default. Zoom-through when the story changes scale; whip push when it changes
place/chapter; blur-dissolve (4-10 f @60) for an unrelated reset with one anchor carried across; hard
cut only in a fast montage (caption + presenter run through, 3-frame blur-in). Never change all three
bands at once. Move sizes: drift 1.02-1.05, detail push 1.14-1.37, macro 2.8-8, thumbnail 0.2-0.25.
Hold 0.6-1.5 s after each move (with drift).

## Sound map (palette roles)
first hook object -> `success` (ding) at 0.3-0.6 s · label/badge -> `pop` · item lands -> `click`/`pop`
(pitch rises as the stage fills) · camera move/slide -> `swish` · zoom-through -> `whoosh_in` + `hit` low
on landing · count-up -> `zip`/`tick` · big number lands -> `hit` · good state -> `success` · bad state ->
`hit` -2 dB + `sub` · chapter -> `riser` before + `hit` · stamp -> `hit` + `glint` · typing -> `type_run` ·
cursor press -> `click` then `pop`. Density 4-6 per 10 s, no gap > 8 s. Music ~92 BPM, C# major (major =
bright), 18 dB under the voice, lift at chapters and CTA. Master -14 LUFS, TP -1 dBTP.

## Where we beat the reference (keep doing these)
Animated presenter (springs, blinks, breathing, eye-line) instead of still swaps · one ISO standard
with true side faces, AO and contact shadows · vector art with two detail tiers for real macro zooms ·
travelling keyword box · labels >= 30 px, footnotes >= 22 px held 1.5 s · 195-205 wpm with payoff holds ·
a real zoom-through per act and drift on every hold · designed sound 4-6 events / 10 s · progress rail
on videos > 60 s · count-ups with units on every figure · grid parallax + grain · 60 fps motion · loop ending.

## World mode - Ved's current default (24 Nov 2026)
Ved: "remove presenter, I don't want anymore" and "each word spoken I want a visual change - camera zoom and
animation and new world design". So, unless a script says `"presenter": {"enabled": true}`:
- **No presenter.** The world fills the whole frame; captions sit on a top gradient (y 15-25 %).
- **Word beats.** `plan_timeline.py` gives every scene `beats`: one per content word at its spoken frame
  (kind number | action | state | object, strength 1-3; drift fillers keep the picture moving every <= 0.6 s).
  Override per word in script.json: `"beats": [{"word": "towers", "camera": "punch|pull|<anchor>", "target": "<anchor>"}]`.
- **Every scene is a World** (`src/kit/explainer/world.tsx`): `{id, home, anchors, aliases, palette, Draw, Overlay?}`.
  Name anchors after the words: the camera DIRECTOR flies to an anchor when its word is spoken (`whip` on strong
  beats), and gives every other word a micro-push / punch-in / drift; impact shake on strong number/action beats,
  light pulse on every beat, motion blur at speed, parallax particles + foreground bokeh, per-world palette.
  `Draw` must ALSO react to the words (`onWord`, `wordAt`, `pulseOn`, `countOn`, `nthBeat`, `step`, `Burst`,
  `Ripple`, `SpeedLines`) - camera alone is not enough.
- **Worlds connect** with the `portal` transition (zoom-through: the old world flies into `origin`, the new one grows
  out of it); push for chapter jumps, iris into a light act, short dissolves inside one world.
- **Scenes file** = wiring only: `S03: scene(cellsWorld)`; worlds live in `projects/<id>/worlds/*.tsx`.
- **World art with Fable 5.2 agents** (Claude Code subagents, `model: fable` - NOT Ved's API): one isolated engine
  sandbox per agent (`D:\VideoBlueprint
emakes\sbx-<x>`: copied src, junctioned node_modules/public, registry with
  only the project) so one agent's broken code never breaks another's render; shared brief
  `references/example-explainer/world-brief.md`; each agent renders stills, looks, iterates, reports.
- **QA** (`qa_explainer.py`): "Visual change on every spoken word" >= 90 % (frame difference across each word),
  "Never still > 0.5 s", plus the format / captions / sound / loudness gates. Presenter gates only run when enabled.
- Worked example: the SSD video v2 (`references/example-explainer/ssd-video-v2/`).

### Camera rules after Ved's v2 review (24 Nov 2026) - these override the world-mode camera notes above
Ved: "camera jump too much ... only where required ... camera smoothly, not frame jiggle and hand-like camera jump
every frame" and "I want nanoscopic zoom continue inside the chip world and make visual more powerful".
- **The camera does NOT move on every word.** The director (world.tsx) moves only to anchors the voice NAMES, at most
  one move per phrase (anchor words < 1.2 s apart = one move, to the phrase's final subject), each a 1-1.8 s
  ease-in-out (log-space zoom), never starting before the previous move has settled; between moves a slow dolly
  (+3 % over ~5 s). No shake, no jitter, no spring overshoot; blur only on big zooms.
- **The per-word change comes from the WORLD's animation** (onWord/pulseOn/countOn...), and must never be a hidden
  whole-world zoom/scale tied to words - if a world needs an inner zoom, use one smooth eased (log) ramp across the
  phrase, not stacked springs (the v2 hook stacked 5 springy inner zooms = jiggle).
- **Continuous scenes into the small** use `nano.tsx` `NanoZoom`: nested levels (portal at [0,0] for a pure zoom
  with no pan), one depth curve (monotone cubic through keys - it does not stop at levels), each level draws a
  low-detail copy of the next inside its portal so the cross-fade matches. Example: S03 package -> die -> plane ->
  array -> 3D NAND string -> one cell (`ssd-video-v3/worlds/nano.tsx`). Pull back only INSIDE the last level.
- **Seams between scenes of one world**: the next scene starts on the previous scene's final framing (e.g. a `deep`
  home anchor) and moves out smoothly - never restart at a different zoom.
- **Grade**: worlds get contrast/saturation lift and slow volumetric light shafts from the engine.
- **QA** (`camera_motion.py`, tracked features + RANSAC camera fit, transitions excluded): "Camera smooth: jiggle"
  rms <= 0.9 and "direction reversals" <= 6/min. v2 measured 5.2 rms / 45 reversals per min.

### Shorts/Reels safe area (Ved, 25 Nov 2026) - applies to every video
Ved: "bottom part ... YouTube username and description come - safe area - shift entire video above 15 %; also
caption make 20 % decrease size so top area also safe". The apps draw over three zones of a 9:16 frame:
top 0-8 % (back / search / menu icons), bottom 85-100 % (avatar, @name, Subscribe, title/description, music) and a
right action column (x 86-98 %, y 50-86 %: like, comment, share, remix).
- **Engine default (explainer style):** `project.safe = {focusY: 0.50, zoom: 0.82}` (plan_timeline writes it; override
  with `"safe"` in script.json). World cameras land their anchor at 50 % of the height (was 53 %) and the whole world
  layer is drawn 0.82x; NanoZoom dives centre at focusY - 0.03 and zoom the same. Worlds keep their own coordinates.
- **Captions 54 px** (was 68; `"caption_size"` overrides): two lines end at ~23.5 % of the height. The progress rail
  sits at 10.5 % (below the top icons) - leave it there.
- **Result checked on all 12 fps-explainer scenes:** key content between ~26 % and ~84 % of the height.
- **Design rule for world artists** (the stills they render already include the safe transform): keep text, numbers
  and hero objects between 26 % and 84 % of the frame; nothing readable in the bottom 15 % or the top 8 %; prefer
  no key text in the right 14 % below the middle (the like/comment/share column) - fixing that globally would need
  zoom ~0.75.
- **Checks:** `safe_overlay.py` draws the YouTube UI over frames for a visual check (before/after previews for Ved);
  `safe_check.py` (OCR env) fails on readable text (>= 1.6 % of the frame tall) in the bottom 15 % or top 8 % and
  lists text under the right buttons. Calibration: the pre-safe-area fps video failed with 75 sightings.
