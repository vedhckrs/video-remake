---
name: video-remake
description: Makes a NEW English video (1080x1920, 60 fps) that edits like a reference video - same pacing, shot lengths, transitions, captions, voice pace, music tempo and SFX - on Ved's topic - script, ElevenLabs voice, code-drawn Remotion scenes with real logos and screenshots, earshot sound, render, then a metric-by-metric compare with the reference (via video-blueprint). Also makes 2.5D code-drawn tech explainers from a topic alone (a visual change on every spoken word, smooth cinematic camera, nanoscopic zoom dives), and after approval builds the upload package - 1080p60 master, GPT Image 2.6 cover, captions, separate YouTube and Instagram zips with guides. Use whenever Ved says "make a video like this", "remake this format", "make an explainer on" a topic, "final render", "upload package", or gives a reel plus a new topic, repo or product - even without naming the skill. Not for a breakdown only (video-blueprint), an exact rebuild (reverse-any-video) or Hinglish AlphaTech Shorts (remotion-video-producer).
---

# Video remake

**First, every session:** read `README.md` (what this skill is, paths, files, solved problems, open
items) and `references/ved-preferences.md` (Ved's standing rules - English, 1080x1920 60 fps, no handle,
real logos/screenshots, earshot sound, approvals). They carry everything earlier sessions learned; a new
Claude account or PC knows nothing else. Then check the tools: `blueprint.py doctor` (video-blueprint)
and earshot's python (`rmcommon.EARSHOT_PY`); if missing, follow `INSTALL.md`.

Make a new video on Ved's topic that **edits like** a reference: the structure, rhythm and design
system transfer; the content never does (new script, new visuals, own voice - no footage, fonts,
logos or assets lifted from the reference). English only.

Works in `<VB>\remakes\engine` (one shared Remotion 4.0.544 project; VB = `%VB_HOME%` or
`D:\VideoBlueprint`) - never in Ved's Remotion repo. Run every script here with the core env:
`<VB>\envs\core\Scripts\python.exe <skill>\scripts\<script>.py ...` where `<skill>` is this folder
(normally `%USERPROFILE%\.claude\skills\video-remake`) - below: `rm/<script>`. Analysis uses the
**video-blueprint** skill (installed beside this one) and its toolchain; read its SKILL.md when you
run it. First time on a PC: `INSTALL.md` at the zip root, then `rm/new_project setup`.

**Output** (Ved's standard): 1080x1920 at 60 fps, mastered to −14 LUFS. Scenes are designed at the
reference's size and fps (e.g. 720x1280 @ 30): set `"output": {"width": 1080, "height": 1920, "fps": 60}`
in script.json - the engine samples the same motion at 60 fps (fractional `t`) and renders at 1.5x
device scale, so vectors, text and 2x screenshots stay sharp.
**No creator handle or channel name** unless Ved gives one (`"handle": null`).

## Explainer style (topic only, no reference video)
When Ved gives a tech topic and wants "an explainer", "a 2.5D video", "like the keyframes videos", "like
those 12 explainers" or does not name a reference video: use the **keyframes-explainer** style library -
read `references/styles/keyframes-explainer.md` (workflow, kit, recipes, sound map) and its
`style_system.md`. It skips steps 1-2 below (`"style": "explainer"` in script.json makes plan_timeline use
the library recipe, presenter, explainer captions and rail), draws scenes with `src/kit/explainer/`, and
ends with `rm/qa_explainer <id>` (37 gates: measured ones must pass, manual ones ticked on the contact sheet).
**Default since 24 Nov 2026 (Ved): no presenter, world mode** - every scene is a World with named anchors; the
camera director changes the picture on every spoken word (`spec.beats`); worlds connect with portal zoom-throughs.
See "World mode" in the style guide. **Camera:** smooth cinematic moves only to named things (one per phrase), never per-word
jumps or shake; continuous dives into small things use `NanoZoom` (style guide: "Camera rules after Ved's v2 review").
**Safe area (25 Nov 2026):** the YouTube/Instagram UI covers the bottom 15 % (username, description) and the top 8 %:
the engine lifts and zooms worlds out (`project.safe`, default focusY 0.50 / zoom 0.82) and captions are 54 px;
check previews with `rm/safe_overlay` and pass `safe_check.py` (OCR env) before delivery (style guide: "Shorts/Reels safe area").

## The loop

**1. Analyse the reference** (skip if a checked blueprint exists). Run video-blueprint fully -
including its boundary review and vision pass, because the recipe is only as good as the checked
transitions and the narrative it reads.

**2. Recipe.** `rm/new_project create <id>` (prints the project folder), then
`rm/recipe <reference work folder> <project folder>`. Read `recipe.md`: it is the brief -
shot count and length curve, transition vocabulary and where the background flips, caption
position/size/lead, voice pace, BPM, SFX density and offset, narrative section shares, look notes.

**3. Script** (`script.json`, template in `assets/script.template.json`). Write it to the recipe:
- the same sections in the same proportions (hook / proof / reveal / example / advice / CTA ...);
- the same number of scenes (± 2) - one scene per spoken sentence or clause, sized so the voice
  at the recipe's pace gives the recipe's shot lengths (words per scene ≈ shot_s × wpm / 60);
- `bg` per scene following the recipe's act pattern (e.g. `D D D D D D L L L ... D` - dark hook,
  light middle, dark CTA);
- `keywords` 1 per caption page (`select` = italic serif in the selection box, `bold`), `hits`
  for SFX on the words where something appears (pop on cards, ding on numbers, click on UI);
- facts about the topic researched and true today (repo stars, prices, versions...), with the
  source noted in `visual` or a comment line; nothing invented;
- `visual`: one line per scene saying what it draws, in the recipe's look (UI mock-ups, cards,
  counters, terminals ...), never a copy of a reference frame.
Total words ≈ recipe length × wpm / 60. **Show Ved the script table (scene, text, visual) and the
voice cost, and wait for his yes** before anything paid.

**4. Voice.** `rm/tts <project> --estimate` (free: characters + balance), then after Ved's yes
`rm/tts <project> --yes` → `vo.mp3` + exact word times.

**4b. Sound design with earshot** (Ved: "for listening sound use always this repo" -
github.com/Leonxlnx/earshot; effects and music are made in code, never AI-generated). Run
`sound_design.py` with **earshot's python** (`rmcommon.EARSHOT_PY`; on Ved's PC
`D:\Sumit\tools\earshot\.venv\Scripts\python.exe` - shared with meta-ads-video, never reinstall):
- `palette` - for each role in `assets/sfx_palette_ui.json` (pop, tap, click, tick, type_run, swish,
  whoosh_in, iris, riser, hit, success, notify, glint, zip, shutter) render the candidate designs, let
  earshot RANK them against the role's plain-words `want`, render the winner as several takes.
  New role or a weak winner: add candidates (`earshot sounds --search "<words>"`), rerun `--roles x --fresh`.
- In script.json give every visible action a sound: scene `hits: [{word|frame, sfx: role, db?, offset?, at?}]`
  (card appears → pop, logo tile → tap, input lights → click, typed text → type_run, counter → zip,
  number/X lands → hit, check/match → success, banner → notify, light sweep → glint, REC → shutter).
- `cues` (after plan_timeline) - transitions get sounds automatically (iris → big whoosh + a riser ending on
  it, zoom → whoosh_in, dissolve → swish), whooshes aligned by PEAK, hits by ONSET, takes/pitch/pan varied.
- `music` - a score from earshot instruments (felt piano, glass/muted plucks, pluck bass, kick/clap/hats +
  pad/sub) at the recipe BPM/key: sparse hook, downbeat on the first act change, groove in the light act,
  breakdown in the dark "advice" act, half-time CTA, ring-out chord.
- `mix` (after `render.py video`) - voice + effects + music ducked up to 7 dB under the voice and 4 dB under
  effects; master chain proven on Ved's ads (EQ, loudnorm −14, resample before limiter, AAC `-aac_pns 0`)
  → `out/<id>.mp4`.
- `listen` - earshot `sheet` (PNG: frames, events, spectrogram, loudness, sync - LOOK at it), `timeline`
  with the picture cues, `critique` vs 7 professional launch films (fixes with timestamps), `describe`
  on the music (mood), `measure` → `out/listen_report.md`. Fix what it flags, re-mix, listen again; then
  ask Ved for one human listen on headphones (earshot's ears are models).
Default voice: Liam (young US male, social-media creator) - match the reference's voice
(gender, age, energy) from `recipe.voice`; list others with the ElevenLabs voices API.

**5. Timeline.** `rm/plan_timeline <project>` → `project.json`: scene frames cut in the voice's
pauses, transition per scene (iris on background flips, the reference's in-act type otherwise,
the reference's median length), caption pages with each word `lead_ms` early, SFX placed,
per-scene `cues` (frame of every word, relative to the scene start: `cues["w:animation"]`).

**5b. Real media** - make it look like the real product, not a mock-up:
- *Brand logos*: real SVG marks from **Simple Icons** (in the engine; `import {siGithub, siVercel} from 'simple-icons'`,
  draw with `<Logo icon={siGithub} color="brand|#fff"/>` or `<LogoTile …/>`). Check a slug exists first:
  `node -e "console.log(!!require('simple-icons').siStripe)"` (run in the engine). Use marks only to
  identify products the video talks about, unaltered.
- *Screenshots*: `rm/capture <project> <name> <url> [--dark] [--selector CSS | --full] [--hide …]`
  (Playwright, 2x) → `public/<id>/img/<name>.png`; crop regions with PIL for each scene (repo header,
  README sections, demo images, tables). Show them with `<Shot src=… url=… focus=[{at,x,y,scale}]/>` -
  a browser-framed screenshot whose camera eases between regions on word cues. Capture public pages
  about the topic only, today's state (re-check numbers like stars on the capture).

**6. Scenes** (`projects/<id>/scenes.tsx`): one React component per scene id, exported as
`SCENES`. A complete worked example that scored 11/11 against its reference is in
`references/example-reanimate/` (script.json, scenes.tsx, recipe.md, compare.md) - start from it.
Read `references/kit.md` first - the kit (`src/kit/ui.tsx`, `motion.ts`) has cards,
windows, counters, type-on, terminal, line chart, icon grid, stepper, notification, cursor,
strike, glyphs, and entrance/exit/pop helpers; `src/kit/fx.tsx` adds the fluid layer -
`Camera` (wrap EVERY scene: slow push + drift, so no frame is static), `Float`, `Shine` (light sweep
on a hero card when its word lands), `MaskReveal`, `Underline`, `Particles`, `springTo`, plus
`Logo`/`LogoTile`/`Shot`. Grids and lists build with a 5-8 frame ripple/stagger, never all at once
(a whole layout appearing in 1-2 frames reads as a hard cut to the compare step). Each element enters on a word cue
(`spec.cues['w:stars']`) so visuals land on the voice like the reference's do. The kit draws
transitions, backdrop, captions, handle and audio - scenes only draw their content.
**Layout and image rules** (Ved's review, 24 Nov 2026: cropped cards and sparse frames looked off):
- Fill the frame: the hero element spans 80-90 % of the width; the content block sits between ~25 % and
  ~82 % of the height (below the caption line); no big empty half. Design-px minimums (720 wide):
  body text 22, labels 19, hero numbers/titles 48+.
- Never show a subject cut by its frame: crop each image to ONE whole subject (a card, a panel, a table
  row) and show it complete (`Img` at its own aspect), or use `Shot` whose camera centres + clamps.
  No fixed small panes over a big screenshot.
- A comparison = two whole subjects side by side moving identically (`Tilt3D` with one path) or a
  `CompareSlider`; prove it with the real measured number from the source (e.g. "Δ 0.4 px").
- Iris wipes start from an element of the outgoing scene (`origin` in script.json at that element's
  position), never from empty middle or on top of text.
- After stills, render motion strips of 2-3 scenes (`ffmpeg select … tile`) and look at the motion
  frame by frame, not only single frames.

Then `rm/render <project> stills` and LOOK at `out/stills_sheet.jpg` (and individual stills)
before the full render: layout inside the safe area, nothing under the caption line or handle,
text readable, every scene matching its `visual`. Fix and re-still.

**7. Render.** `rm/render <project> video` → `out/<id>_raw.mp4` (picture; Remotion's own audio is only a
preview), then `sound_design.py <project> mix` builds the real soundtrack and writes `out/<id>.mp4`, then
`sound_design.py <project> listen`. (Without earshot, `rm/render <project> master` loudness-masters the
Remotion preview mix to −14 LUFS as a fallback.)

**8. Compare.** `rm/compare <project>` runs video-blueprint on the render and writes
`compare.md`: length, shot count, avg shot, hard cuts, transition mix, cut-follows-voice,
caption y and lead, voice wpm, BPM, SFX density - each with a pass band. Fix what fails
(usually: scene lengths → script/word split; transition mix → `transition` overrides;
captions → `caption_y`/`caption_size`), re-plan, re-render, compare again (max 3 rounds).
Transition mix and hard cuts are compared **raw detector vs raw detector** (OmniShotCut on both
videos, before any human review), because the reference recipe was hand-corrected and the detector
misreads fast iris wipes as cuts on both. Still check the strips in `check/keyframes/` before
"fixing" a mismatch.

Gotchas already fixed in the engine (do not reintroduce): scene components reach the composition
through a closure in `Root.tsx`, never `defaultProps` (Remotion serialises props to JSON and drops
functions - every scene renders "missing scene component"); iris wipes grow steadily from a visible
dot (an ease-in reads as a hard cut); the caption selection box uses dark text on its light fill.

**9. Hand over.** The MP4 path, a side-by-side note (`compare.md` numbers), what is
approximate (fonts are Inter + Instrument Serif, not the reference's; code-made music), cost
spent, and the project folder for edits. Offer the upload package (step 10) when Ved wants to post.

**10. Upload package** (after Ved approves the final cut - "good to go", "final render", "upload package").
Read `references/upload-package.md` first; worked examples are in `references/example-upload/`. Per video,
two verified zips - `<Name>_YouTube.zip` and `<Name>_Instagram.zip` - each with the same master MP4
(1080x1920 60 fps, picture stream-copied, audio re-mastered at AAC 320k), the cover in that platform's sizes,
its own detailed `UPLOAD_*.md` guide, and `captions_en.srt` for YouTube:
`rm/upload_package <project> master --name <Name> --title "<title>"` → cover with **GPT Image 2.6 Flare, 9:16**
on Magnific (`simulate_cost` first - 175 credits each at 2K High - tell Ved, note the balance before/after) →
`frames` (pick a fallback frame) → `cover <png> --frame <sec>` → write the two guides into `<project>/upload/`
→ `build --dest "<Ved's folder>"` (checks specs, loudness, faststart, captions, zip CRC + byte-identical round trip).

## Rules
- English only; Ved approves the script and the voice cost before generation; one voice take,
  re-voice only on his request.
- A frame is a pure function of the frame number: no `Math.random` (use `rand(seed)`), no CSS
  transitions/animations, no timers or effects in scenes.
- Keys: ElevenLabs key read from `%USERPROFILE%\.config\elevenlabs\api_key` at use, never printed.
- Never write into `D:\AlphaTech Youtube` or touch vedhckrs; everything lives under `<VB>`.
- Logos/brand marks: real marks from Simple Icons for the products the video is about or names;
  generic glyphs for everything else; never imply a brand endorses the video.
