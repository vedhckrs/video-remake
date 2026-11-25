---
name: video-blueprint
description: Reverse-engineers a finished video (Reel, Short, ad, trailer, explainer) into a production blueprint - every shot with exact frames, transition types, on-screen text, camera moves, palette, voiceover words with timings, music stems, BPM and beats, SFX hits, and how cuts and captions sync to beat and voice - as blueprint.json, a Premiere/Resolve timeline (FCP7 XML, FCPXML, EDL, OTIO) and an HTML storyboard report, using open-source tools installed under D:\VideoBlueprint (PySceneDetect, OmniShotCut, PaddleOCR, WhisperX, Demucs, Beat This!). Use whenever Ved wants to break down, analyse, decode or "reverse" a video into its edit, shot list, EDL or recipe, asks "how was this edited" or "what transitions / SFX / BPM does this use", wants a reference turned into a plan to recreate, or drops an .mp4 and asks what is in it shot by shot - even without saying "blueprint". Not for an editable HyperFrames rebuild (reverse-any-video) or making a new video (video-remake).
---

# Video blueprint

**First, every session:** read `README.md` (pipeline, paths, files, results, solved problems) and, for
anything Ved-specific, `..\video-remake\references\ved-preferences.md`. Run `blueprint.py doctor`; if
envs are missing, follow `INSTALL.md`.

Turn a finished video into the plan that made it. Scripts measure everything that can be measured
(frames, timings, beats, text, words, colour, motion); you add what needs eyes (shot scale,
composition, lighting, look, what a transition or graphic is) by looking at keyframe sheets. Timing
always comes from the scripts - vision models, you included, are not frame-accurate.

Analyse videos Ved has the right to study. Keep a competitor's video and its blueprint internal.

## Setup facts

- Everything lives in **VB** = `%VB_HOME%` if set, else `D:\VideoBlueprint` (envs, models, repos).
  One env per stage because the tools' pins conflict (WhisperX torch 2.8, OmniShotCut transformers
  4.57.3, AudioSep transformers 4.30.2...). Not installed yet on this PC? Follow `INSTALL.md`
  (the zip's root) / run `scripts\setup.ps1` once.
- Orchestrator and `resolve.py` (always run with the core env; below, `blueprint.py` / `resolve.py`
  mean this full form, with `<skill>` = this skill's folder, normally `%USERPROFILE%\.claude\skills\video-blueprint`):
  `<VB>\envs\core\Scripts\python.exe <skill>\scripts\blueprint.py <cmd>`
- `blueprint.py doctor` shows which envs, models, GPU and HF token are present. Missing envs are
  skipped and listed under `unresolved` - the run still completes. `scripts/setup.ps1 -Only <env>`
  rebuilds one env. Tool details, known Windows fixes and licences: `references/tools.md`.
- RTX 3050 8 GB: stages run one at a time; each frees the GPU before the next.

## 1. Run the automatic stages

```
blueprint.py run "<video>" --out "<VB>\jobs\<short-name>" [--language hi] [--diarize]
```
- Put `--out` under `<VB>\jobs\` when the video sits inside a git repo (the Remotion
  repo especially) so nothing lands in a repo. Otherwise the default `<video>_blueprint` folder is fine.
- `--language hi` for Hinglish voiceover (WhisperX then writes Hindi words in Devanagari and English
  words in Latin - expected). Leave it off for English or unknown.
- `--diarize` only when there are several speakers and the HF token exists.
- A 50 s 1080x1920 Short takes about 5-8 minutes (first run longer: model downloads).

Stages, in order: probe → cuts (PySceneDetect) → transitions (OmniShotCut) → shots (merge) →
keyframes + palette → camera_flow → ocr → stems (Demucs) → speech (WhisperX) → beats (Beat This!)
→ sections → sfx (AudioSep) → prosody → rhythm → vision form. Logs: `<work>\logs\<stage>.log`.

## 2. Review the doubtful boundaries

The run prints `review` items: places where only one detector saw a cut, or OmniShotCut saw a
transition it could not name. For each, look at `keyframes\T##_strip.jpg` (frames across the
boundary) and decide:

- real cut / transition → `resolve.py <work> --confirm T02` (or `--retype T02 --type whip_pan`)
- not a cut (flash, light sweep, glitch, counter changing, caption swap) →
  `resolve.py <work> --merge T01 --as light_sweep` - it becomes an in-shot effect
- a cut both missed → `resolve.py <work> --add-cut <frame>`

Apply right-to-left T numbers in one call when merging several. Then `blueprint.py redo <work>`.
Also glance at the `hints` (whip_pan_candidate, match_cut_candidate) - OmniShotCut has no whip-pan
or match-cut class, so these come from optical-flow spikes and frame similarity and need your eye.

## 3. Vision pass (you)

Read `references/vision-pass.md`, then fill `raw\vision.todo.json` by looking at
`keyframes\storyboard.jpg`, every `keyframes\S##_sheet.jpg` (start / mid / end of the shot) and the
transition strips. Save the filled form as `raw\vision.json`. It holds: video type, narrative
sections, per-shot scale, subjects, composition, lighting, grade look, graphic layers, text
animation, in-shot effects, what the camera move reads as, font guesses per text, voice tone and
music mood, and `object_prompts` for SAM 3. Leave a field null rather than guess.

Ground descriptions in the measured data: open `raw\camera_flow.json` (pan/tilt/push amounts, ease),
`raw\palette.json`, `raw\ocr.json` (exact text and frames), `raw\prosody.json` (pitch, emphasis) and
`raw\words.json` before writing tone or motion words.

### Batches: steps 2-3 through the Claude API
For many videos (style studies), `scripts/vision_api.py` does the boundary review, the vision pass (with
one-frame-per-second motion sheets for long shots) and a style dossier with **Claude Fable 5.2** on Ved's
own Anthropic account (`ant auth login`; never handle a key): `estimate` (free token count -> $) first and
show Ved the cost, then `all <work> --brief <brief.md>` per video and `synth <out> --brief <b> <works...>`
to merge dossiers. Every call is logged with $ in `raw/api_usage.json`. Example run: 12 videos, $36.28
(`D:\VideoBlueprint\jobs\kf_*`, briefs `kf_brief.md` / `kf_synth_brief.md`).

## 4. Finish

```
blueprint.py finish <work>
```
Runs SAM 3 object tracks (when its env, the token and `object_prompts` exist), builds and validates
`blueprint.json` against `references/schema.json`, writes `timeline_fcp7.xml` (Premiere: File →
Import), `timeline.fcpxml` (Resolve / FCP), `timeline.edl`, `timeline.otio`, and `report.html`.

Open `report.html` and check: shot blocks line up with the transitions, text bars with captions you
saw, the edit rules make sense. Fix with resolve/vision edits and `finish` again.

## 5. Hand over

Tell Ved, in plain words: where the folder is (link `report.html` and the timeline file), shot count
and average shot length, transition types, BPM and whether cuts follow the beat or the voice, the
caption timing rule, the SFX pattern, and the `unresolved` list - fonts, LUT, easing curves and synth
patches are never extracted, only described. Say which numbers are measured and which are your
descriptions. If he wants to recreate it, the blueprint is the brief for remotion-video-producer,
meta-ads-video or After Effects; `rhythm.rules_inferred` and the text/SFX timings are the parts to
copy.

## What to trust

| Measured (trust to the frame) | Measured, check | Described (low confidence) |
|---|---|---|
| shot frames, hard cuts, text in/out frames, word times, beats/BPM, palette, tone stats | transition class, SFX hits and family, camera direction/amount, music sections, key | shot scale, lighting, look, mood, fonts, voice tone, effect names |

SFX: AudioSep finds the clear designed hits and names their family (whoosh / impact / riser / click /
ding); quiet or music-masked cues can be missed - say so. Sections and key come from librosa because
All-In-One's weights are non-commercial (see tools.md).
