# video-blueprint — reverse-engineer a finished video into its production blueprint

**Owner:** Ved (OneAlphaMed, Mumbai). **Built:** 23–24 Nov 2026 from Ved's report "Reverse-Engineering
Finished Videos into Production Blueprints: Open-Source Toolchain Review (November 2026)", using the
top-ranked repo per job. **Used by:** `video-remake` (its analysis + compare steps).
**Read this, then `SKILL.md`, then `references/tools.md`.** Ved's standing rules for the video pipeline are
in `..\video-remake\references\ved-preferences.md`.

## What you get for one video
`blueprint.json` (schema-validated: shots with exact frames, transitions with type/length, captions with
frame-exact in/out, voice words with times + emphasis, music stems/BPM/beats/sections/key, SFX hits,
camera moves, palette/grade, edit-rhythm rules), timelines for **Premiere** (`timeline_fcp7.xml`),
**Resolve/FCP** (`timeline.fcpxml`), `timeline.edl`, `timeline.otio`, `words.srt`, `beats.tsv`, stems,
keyframe sheets and an HTML report.

## How to ask
"Break down this video <path>", "how was this reel edited", "what transitions/SFX/BPM does it use",
"give me a timeline of this ad". Hinglish voice-over: Claude adds `--language hi`.

## Pipeline (scripts/blueprint.py orchestrates; one Python env per stage)
probe → cuts (PySceneDetect 0.7.3) → transitions (OmniShotCut v1.5) → shots merge → **review of doubtful
boundaries by eye** (`resolve.py`) → keyframes/palette → camera_flow (OpenCV) → OCR (PaddleOCR 3.7 GPU)
→ stems (Demucs 4.1) → speech (WhisperX large-v3, chunk 15 s) → beats (Beat This!) → sections (librosa;
All-In-One if installed, NC weights) → SFX (AudioSep + CLAP) → prosody → rhythm → **vision pass by Claude**
(`raw/vision.json`) → build blueprint → export timelines → report. Optional: SAM 3 objects, MegaSaM 3D camera.

## Where things live
- Tools root VB = `%VB_HOME%` or `D:\VideoBlueprint` (`envs\`, `models\`, `repos\AudioSep`, `jobs\`).
- Envs (signed python.org Python): core, omnishotcut (3.10), ocr, speech, music, allin1, audiosep (3.10), sam3.
- Check: `<VB>\envs\core\Scripts\python.exe <skill>\scripts\blueprint.py doctor`.
- Build/repair: `powershell -ExecutionPolicy Bypass -File <skill>\scripts\setup.ps1 [-Only env1,env2]`.

## Files
| File | Purpose |
|---|---|
| `SKILL.md` | workflow: run → review boundaries → vision pass → finish → hand over |
| `INSTALL.md` | setup on a new PC/account (same as the suite's) |
| `references/tools.md` | every tool, licence, version, and the Windows fixes |
| `references/vision-pass.md` | how Claude fills `raw/vision.json` |
| `references/gaps.md` | what no tool extracts (fonts, LUTs, easing, synth patches) + workarounds |
| `references/schema.json` | blueprint JSON schema |
| `scripts/blueprint.py` | orchestrator: `doctor`, `run`, `redo`, `finish`, `status` |
| `scripts/vision_api.py` | review + vision + style dossier via the Claude API (Fable 5.2, Ved's account); `estimate` first |
| `scripts/resolve.py` | fix boundaries: `--merge/--retype/--confirm/--add-cut F[:S-E]/--range T=S,E/--clear-review` |
| other `scripts/*.py` | one per stage (names match the pipeline) |
| `evals/` | 3 test cases (skill-creator format) from Ved's own videos |

## Results so far
- Test round 1 (2 cases × with/without skill): **94 % vs 61 %** pass rate; reel case 9/9 vs 3/9.
- Detectors misread stylised transitions (OmniShotCut called blur dissolves "wipes", in-shot UI motion
  "zoom"): **always review boundaries by eye** — that is why the reviewed reference is trustworthy.

## Known problems already solved
Smart App Control (signed Python only) · HF symlinks (plain-folder models) · FFmpeg 9 `-vsync` · Paddle
3.3 CPU oneDNN crash · WhisperX chunk drops · AudioSep needs transformers 4.30.2 · stdin hangs from
background shells · PowerShell `-File -Only a,b` arrives as one string. Details: `references/tools.md`.

## Open items
HF gated access (pyannote community-1 terms, SAM 3 approval), WSL for MegaSaM.
