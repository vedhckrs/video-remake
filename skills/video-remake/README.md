# video-remake — make a new video that edits like a reference

**Owner:** Ved (Vedprakash Vishwakarma, Senior Graphic Designer, OneAlphaMed, Mumbai).
**Built:** 23–24 Nov 2026 in Claude Code. **Works with:** the `video-blueprint` skill (installed beside it).
**Read this, then `references/ved-preferences.md`, then `SKILL.md`.** Together they hold everything a
new Claude session needs — nothing important lives only in a chat or in local memory.

---

## 1. What it does (in one breath)
Give it a **reference video** (a Reel/Short/ad whose editing you like) and a **topic** (a repo, product,
tool, idea). It:
1. analyses the reference with **video-blueprint** (shots, transitions, captions, voice, beats, SFX, rhythm)
   and turns it into a reusable **style recipe** (`recipe.json` / `recipe.md`);
2. researches the topic and writes an **English script** fitted to the recipe (same sections, same scene
   count, same pace) — **stops for Ved's approval** of the script and the voice cost;
3. makes the **voice** with ElevenLabs (exact word timings come back with it);
4. plans every frame (`project.json`): scene cuts in the voice's pauses, transitions in the reference's
   vocabulary (blur dissolves / iris wipes / zoom morphs), word-by-word captions, sound cues;
5. Claude writes the **animated scenes** in Remotion/React with the kit: real **brand logos** (Simple
   Icons), real **screenshots** (Playwright), UI cards, counters, charts, 3D tilt, before/after sliders,
   continuous camera drift — every element enters on its spoken word;
6. checks **stills** and **motion strips**, renders **1080×1920 @ 60 fps**;
7. does full **sound design with earshot**: effects chosen by ear, a scored music bed, ducked mix,
   mastered to −14 LUFS, then earshot **listens** (sheet, sync, critique vs pro launch films);
8. re-analyses the render and **compares** it with the reference metric by metric.

Proven on the first project (`reanimate` repo in the style of a "Comment REPO" GitHub reel):
edit metrics **11/11** match the reference; earshot critique **0.974 "launch-grade"**.

## 2. How to ask for a video
- "Make a video about <topic / repo URL / product> like this reel: <path to reference.mp4>"
- "Use the reanimate example's style for <topic>" (the recipe in `references/example-reanimate/`)
- Hinglish / AlphaTech house-style Shorts → that is **remotion-video-producer**, not this skill.
- Only a breakdown, no new video → **video-blueprint**. Exact rebuild of the same video → **reverse-any-video**.

What Claude will stop and ask: the script (table of scenes: voice line + visual) and the ElevenLabs
cost (≈300–600 characters for 45 s); any re-voice; anything paid. Everything else runs on its own.
Time: ~1–1.5 h per video with Ved checking stills and the final cut.

## 3. Where things live
| What | Path (Ved's PC) | Change on another PC |
|---|---|---|
| Skills | `%USERPROFILE%\.claude\skills\video-remake`, `…\video-blueprint` | unzip there |
| Tools root ("VB") | `D:\VideoBlueprint` (envs, models, repos, jobs, remakes) | `setx VB_HOME <folder>` |
| Remotion engine (one for all remakes) | `<VB>\remakes\engine` (projects/<id>, public/<id>) | created by `new_project.py setup` |
| Python per stage | `<VB>\envs\<core|omnishotcut|ocr|speech|music|allin1|audiosep|sam3>` | `video-blueprint\scripts\setup.ps1` |
| earshot (sound) | `D:\Sumit\tools\earshot\.venv` (shared with meta-ads-video — **never reinstall**) | `setx EARSHOT_HOME <clone>` or INSTALL.md §4b |
| ElevenLabs key | `%USERPROFILE%\.config\elevenlabs\api_key` (read at use, never printed) | create the file |
| Hugging Face token | `%USERPROFILE%\.config\huggingface\token` | create the file |
| Analysis jobs | `<VB>\jobs\<name>` | — |
| Zips for Ved | `C:\Users\VED\Documents\Local\Reverse\skill-zips\` | — |

Quick health check:
```powershell
& "D:\VideoBlueprint\envs\core\Scripts\python.exe" "$env:USERPROFILE\.claude\skills\video-blueprint\scripts\blueprint.py" doctor
& "D:\Sumit\tools\earshot\.venv\Scripts\earshot.exe" --version
```

## 4. Files in this skill
| File | Purpose |
|---|---|
| `SKILL.md` | the workflow Claude follows (steps 1–9 + rules) |
| `README.md` | this overview |
| `INSTALL.md` | setup on a new PC / account |
| `references/ved-preferences.md` | Ved's standing rules + every decision with its date — **read first** |
| `references/kit.md` | scene kit API (ui.tsx, fx.tsx, motion.ts) |
| `references/example-reanimate/` | full worked example: script.json, scenes.tsx, recipe.md, compare.md, listen_report.md |
| `scripts/recipe.py` | reference blueprint → style recipe |
| `scripts/new_project.py` | `setup` engine · `create <id>` project · `register` compositions |
| `scripts/tts.py` | ElevenLabs voice with timestamps (`--estimate` free, `--yes` paid, `--redo` one sentence spliced in) |
| `scripts/plan_timeline.py` | script + voice + recipe → `project.json` (60 fps output, 30 fps design units) |
| `scripts/capture.py` | Playwright screenshots (2x, dark/light, selector/clip) |
| `scripts/render.py` | `stills` sheet · `video` (Remotion, 1.5x scale → 1080p; 1920x1080 landscape designs at scale 1) · `master` fallback |
| `scripts/sound_design.py` | earshot: `palette` · `cues` · `music` · `mix` · `listen` · `all` |
| `scripts/musiclib.py` | music engine (earshot instruments; from meta-ads-video) |
| `scripts/sound.py` | old numpy SFX/music synth — fallback only when earshot is missing |
| `scripts/compare.py` | analyse the render with video-blueprint, compare with the reference recipe |
| `scripts/qa_explainer.py` | explainer quality gates (measured + manual checklist), incl. camera smoothness |
| `scripts/camera_motion.py` | camera jiggle / reversal measurement from a render (used by qa_explainer) |
| `scripts/safe_overlay.py` | draws the YouTube Shorts UI (top icons, right buttons, @name / description) over frames - before/after previews |
| `scripts/safe_check.py` | OCR safe-area gate (run with `<VB>\envs\ocr`): no readable text in the bottom 15 % / top 8 % |
| `scripts/upload_package.py` | step 10: `master` · `frames` · `cover` · `build` → one verified `<Name>_Final_Upload.zip` (video + thumbnail, `YouTube/`, `Instagram/`, README); `--layout split` for two zips |
| `references/upload-package.md` | step 10 guide: cover prompt (GPT 2.6 Flare 9:16), guide checklists, platform facts |
| `references/example-upload/` | the four upload guides + cover prompts/previews from the SSD and reanimate videos |
| `scripts/rmcommon.py` | paths (VB_HOME, engine, earshot, core python) |
| `assets/engine/` | the Remotion 4.0.544 template (kit: Remake, Captions, Backdrop, ui, fx, motion, fonts) |
| `assets/sfx_palette_ui.json` | sound roles → candidate earshot designs + plain-words `want` + level |
| `assets/script.template.json` | script.json starting point |

## 5. The command chain (one project)
```
python = <VB>\envs\core\Scripts\python.exe      ;  E = <earshot>\.venv\Scripts\python.exe
python new_project.py create <id>               ;  python recipe.py <ref work> <project>
(write script.json)                             ;  python tts.py <project> --estimate   → Ved's OK → --yes
python capture.py <project> <name> <url> …      ;  python plan_timeline.py <project>
(write scenes.tsx)                              ;  python render.py <project> stills   (+ motion strips)
E sound_design.py <project> palette             ;  E sound_design.py <project> cues ; … music
python render.py <project> video                ;  E sound_design.py <project> mix ; … listen
python compare.py <project>            (explainer: python qa_explainer.py <project>)
<VB>\envs\ocr\Scripts\python.exe safe_check.py <project>\out\<id>.mp4      (safe-area gate, must PASS)
(after Ved approves)  python upload_package.py <project> master --name <Name> --title "<title>"
(cover: GPT 2.6 Flare 9:16 on Magnific)  python upload_package.py <project> frames ; … cover <png> --frame <s>
(write upload/UPLOAD_YOUTUBE.md + UPLOAD_INSTAGRAM.md)  python upload_package.py <project> build --dest <folder> --note "<version>" --note "<QA>"
```

## 6. Known problems already solved (do not re-debug)
- **Windows Smart App Control is ON** → unsigned DLLs are refused at random (WinError 4551). All envs are
  built on **signed python.org Python** (3.12.10 / 3.10.11) with `python -m venv`; uv only installs packages.
  Never use `uv venv` / `uv python install` for these envs. The orchestrator retries a refused launch.
- Remotion `defaultProps` are JSON-serialised → scene components go through a closure in `Root.tsx`.
- 60 fps: scenes get fractional `t` in 30 fps design units; Remotion springs are smooth at half frames.
- Screenshot camera centres the focus point and clamps to the image edge (`Shot` needs `aspect`).
- Iris wipes grow from an element with ease-in-out (no static dot; no slow ease-in that reads as a cut).
- Whole grids appearing in 1–2 frames read as hard cuts → ripple/stagger 5–8 frames.
- Unmastered Remotion audio is ~7 dB too quiet → earshot mix masters to −14 LUFS; AAC with `-aac_pns 0`.
- A soft swish alone is masked by the voice → each dissolve also gets an `accent` click.
- WhisperX 30 s chunks drop words → `--chunk-size 15`; HF symlink errors → models in plain folders.
- FFmpeg 9 removed `-vsync` (OmniShotCut decodes itself); PaddlePaddle 3.3 CPU crash → paddle-gpu 3.2.0.
- Stages launched from a background shell must get `stdin=DEVNULL` (ffmpeg waited on stdin).

## 7. Open items (Ved's side)
- Hugging Face: accept `pyannote/speaker-diarization-community-1` terms (token already works) →
  speaker labels; Meta approval for `facebook/sam3` → object tracks (env installed, imports OK).
- WSL not installed → MegaSaM 3D camera not built (2D camera analysis works).
- Idea offered, not built yet: a **style library** (save each analysed reference as a named style so
  "make a video about X in <style>" needs no reference file).

## 8. Changelog
- 23 Nov 2026 — skill built: recipe, engine/kit, voice, timeline, render, compare; first reanimate video.
- 24 Nov — signed-Python rebuild (Smart App Control); 1080×1920 60 fps; Simple Icons logos; screenshots;
  fluid-motion kit; no handle; portable paths; re-voice 2.4K stars.
- 24 Nov — Ved's review: cropped cards / sparse frames fixed (Shot camera, Tilt3D, CompareSlider,
  layout rules, iris origins).
- 24 Nov — sound design moved to earshot (ranked palette, scored music, ducked mix, listening);
  critique 0.923 → 0.974 after round-2 fixes (dissolve accents, sub layer, stereo width, EQ, major key).
- 24 Nov — explainer style (Phase B/C), then world mode without presenter (v2), then the cinematic camera
  director + NanoZoom + camera smoothness QA (v3, QA 18/18) - see "Explainer style" below.
- 25 Nov — one-zip upload package (Ved: "in one zip file", then "Yes, add to skill"): `build` now makes ONE
  `<Name>_Final_Upload.zip` (video + thumbnail once, generated README, `YouTube/` and `Instagram/` folders),
  `--note` rows for the README, `--layout split` for the old two zips; it refuses guides that name the other
  layout's files. Tested on the fps video: same files as the hand-made package; split output unchanged.
- 25 Nov (evening) — six-agents video: higher framing is now the DEFAULT (Ved: "Yes, make it default"):
  plan_timeline writes caption y 0.115 and `safe {focusY 0.44, zoom 0.86, fadeTo 0.21}` (visuals ~20-84 %), the
  progress rail is opt-in (`"rail": true`), partial `"safe"` overrides merge over the defaults; engine kit option
  `project.safe.fadeTo` (top caption fade end, fallback 0.30). Hook rule: a big picture change every 0.5-0.7 s in
  the first ~6 s. Tested: defaults reproduce the approved six-agents v2 framing exactly, scene frames unchanged.
- 25 Nov — Shorts/Reels safe area (Ved): engine `project.safe` (focusY 0.50, zoom 0.82 then the default, world +
  nano), captions 54 px, `safe_overlay.py` previews, `safe_check.py` OCR gate; fps video re-rendered with it.
- 25 Nov — fps explainer: `tts.py --redo` (one-sentence re-voice), `plan_timeline.py` fixes (preview SFX use
  earshot takes `<role>_1.wav` - a missing file made Remotion fail with a 404; at most one keyword box per phrase).
- 24 Nov — step 10 upload package: `upload_package.py`, `references/upload-package.md`, examples; covers with
  GPT Image 2.6 Flare 9:16 (Magnific); the master chain moved to `rmcommon.MASTER_AF` (shared with sound_design).
- 26 Nov — landscape 16:9 mode for long-form (`"output": 1920x1080 @ 60`): plan_timeline + engine detect width > height
  (1920x1080 canvas, `unit` from the short side, centred worlds, no Shorts shift / top fade, NanoZoom + atmosphere
  fixed), lower-third captions with scrim, new kit `Photo` + `SourceCredit` and scene `"credit"` in script.json;
  QA / render / camera scripts landscape-aware, safe-area tools skip 16:9. Portrait regression: 15 stills (six-agents,
  fps-explainer) pixel-identical, plan_timeline output byte-identical. Demo project `landscape-demo`.

---

## Explainer style (added 24 Nov 2026, Phase B)
Topic-only 2.5D tech explainers with an original presenter, learned from 12 reference videos (Phase A:
video-blueprint + Claude Fable 5.2 dossiers via Ved's API, merged into a style system).
- Guide: `references/styles/keyframes-explainer.md`; full spec: `references/styles/keyframes-explainer/style_system.md/.json`;
  style recipe: `.../recipe.json` (used automatically when script.json has `"style": "explainer"`).
- Kit: `assets/engine/src/kit/explainer/` - tokens, iso (2.5D SVG objects), stage (camera, callouts,
  counters, cards, flows, grids, rail), presenter (original rig, 37 poses), captions (phrases + travelling
  keyword box), templates (compare, evidence doc, terminal, recap, social CTA, chapter card).
- Pipeline: `plan_timeline.py` explainer mode (caption phrases, presenter track, rail), `sound_design.py`
  (presenter pop, music -18 dB), `qa_explainer.py` (measured quality gates + manual checklist).
- Kit demo project: `references/example-explainer/` (scenes.tsx + project.json) - copy patterns from it.

**Current default (Ved, 24 Nov 2026): world mode, no presenter.** "remove presenter ... each word spoken I want
visual change, camera zoom, animation and new world design", then after v2: "camera jump too much ... camera
smoothly, not frame jiggle". So:
- every scene is a World (`kit/explainer/world.tsx`): named anchors, a palette, Draw + Overlay; word beats come
  from `plan_timeline` (`spec.beats`); the presenter is drawn only with `"presenter": {"enabled": true}`;
- the camera director moves only to named things, one eased move per phrase (30-54 frames), slow dolly between,
  no shake; worlds connect with `portal` zoom-throughs; continuous dives into small things use `NanoZoom`
  (`kit/explainer/nano.tsx`, nested levels, one log-depth curve);
- `qa_explainer.py` gates: a visual change on >= 90 % of spoken words, never still > 1.0 s, camera jiggle rms
  <= 0.9 and reversals <= 6/min (`camera_motion.py`);
- worlds can be drawn by parallel Claude **Fable** subagents (`model: "fable"`) in isolated sandboxes
  (`<VB>\remakes\sbx-a..d`, copied `src`, junctioned `node_modules`/`public`) - NOT Ved's API ("Fable 5.2 no api
  use"). Briefs: `references/example-explainer/world-brief.md`, `nano-brief.md`, `world-template`.
- Worked examples: `references/example-explainer/ssd-video` (v1), `ssd-video-v2`, `ssd-video-v3` (final), and
  `fps-video` (25 Nov 2026, "How 60, 120 & 144 fps actually work", 12 worlds by 4 parallel Fable agents, QA 17/18
  with 0 hard fails, jiggle rms 0.45). **Current world brief: `fps-video/world-brief-v3.md`** (camera rules after
  Ved's v2 review, facts list, sandbox loop) - copy it per project and add the per-agent scene specs.
- Voice fixes: transcribe the take (faster-whisper in `<VB>\envs\speech`, CPU int8) and listen for garbled
  numbers before planning; re-voice ONE sentence with `tts.py --redo "<old>" --new "<new>"` after Ved's OK
  ("fly: 120" was garbled; "up to 120" read clean).
