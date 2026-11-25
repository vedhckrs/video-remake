# Tools, environments, fixes, licences

Checked 23 Nov 2026 against each repo's README, PyPI and Hugging Face. All under `D:\VideoBlueprint`.

## Stage table

| Stage | Tool (rank-1 in the Nov 2026 review) | Env (Python) | Licence | Output |
|---|---|---|---|---|
| cuts | PySceneDetect 0.7.3, AdaptiveDetector + ThresholdDetector (fades) | core (3.12) | BSD-3 | raw/scenes.json |
| transitions | OmniShotCut v1.5 (`uva-cv-lab/OmniShotCut_v1.5`, 211 MB, <1 GB VRAM) | omnishotcut (3.10) | MIT | raw/transitions.json |
| ocr | PaddleOCR 3.7 (PP-OCRv6 medium) on paddlepaddle-gpu 3.2.0 | ocr (3.12) | Apache-2.0 | raw/ocr.json |
| stems | Demucs 4.1.0 `htdemucs`, adefossez fork (facebookresearch repo archived) | music (3.12) | MIT | stems/*.wav |
| speech | WhisperX 3.8 + faster-whisper large-v3 + wav2vec2 alignment; pyannote community-1 | speech (3.12) | BSD-2; weights CC-BY-4.0 | raw/words.json, words.srt |
| beats | Beat This! 1.1 (`final0`) | music | MIT | raw/beats.json, beats.tsv |
| sections/key | librosa (All-In-One replaced, see licences) | music | ISC | raw/sections.json |
| sfx | AudioSep (text-queried separation) + its CLAP for labels | audiosep (3.10) | MIT | raw/sfx.json, stems/sfx_*.wav |
| sfx fallback | librosa onsets on Demucs other/drums | music | ISC | raw/sfx.json |
| camera | OpenCV LK flow + partial affine (2D dominant motion) | core | Apache-2.0 | raw/camera_flow.json |
| objects | SAM 3 video predictor (optional) | sam3 (3.12) | SAM License (custom) | raw/objects.json |
| camera 3D | MegaSaM (optional, not installed) | megasam | Apache-2.0 | - |
| export | OpenTimelineIO 0.18 + cmx3600, fcpx_xml, fcp_xml adapters | core | Apache-2.0 | timeline.* |

## Windows fixes already applied (do not undo)

- **Smart App Control (on since 23 Nov 2026) blocks unsigned DLLs**, at random, with
  `WinError 4551` / "DLL load failed ... An Application Control policy has blocked this file".
  uv's standalone CPython and uv's venv launcher are unsigned and were refused
  (`_multiprocessing.pyd`, `Scripts\python.exe`). All envs are built with the **signed python.org**
  interpreters (`%LOCALAPPDATA%\Programs\Python\Python312` / `Python310`) via `python -m venv`;
  uv only installs packages. Never recreate an env with `uv venv` or `uv python install`.
  Check refusals: `Get-WinEvent -LogName Microsoft-Windows-CodeIntegrity/Operational` (ids 3033/3077).
  The orchestrator retries a refused launch once. Turning Smart App Control off is Ved's call only.

- **FFmpeg 9 removed `-vsync`.** OmniShotCut's `_decode_video` passes it, so the wrapper decodes
  with `-fps_mode passthrough` itself and calls `model.inference(numpy_array)`.
- **paddlepaddle 3.3.x CPU** fails with `ConvertPirAttribute2RuntimeAttribute not support` (oneDNN).
  Use paddlepaddle-gpu 3.2.0 from Paddle's cu126 index (driver 621 is fine). GPU OCR: ~36 s per 15 s of
  60 fps video vs 8 min on CPU.
- **Hugging Face symlinks**: Windows without Developer Mode cannot create the cache's symlinks;
  faster-whisper's download crashed with WinError 1314. speech.py downloads models with
  `snapshot_download(local_dir=...)` into `D:\VideoBlueprint\models\<name>` (plain files).
- **AudioSep's CLAP** needs `transformers==4.30.2` (newer versions drop the `position_ids` buffer and
  strict loading fails) plus torchvision, timm, wget. Its code loads `config/` and `checkpoint/` by
  relative path, so the wrapper chdirs into `D:\VideoBlueprint\repos\AudioSep`.
- **torchcodec warning** in the speech env ("fix torchcodec installation") is harmless: WhisperX loads
  audio with ffmpeg; pyannote only needs torchcodec when given a file path, and we pass arrays.
- **OmniShotCut on 60 fps** video: subsampled to 30 fps (`--max-fps 30`) and mapped back; a cut both
  detectors find takes PySceneDetect's frame (it decodes every frame).

## Not installed - and why

- **SAM 3** needs (a) a Hugging Face token with approved access to `facebook/sam3` (gated) and (b)
  Triton, which `sam3/model/edt.py` imports unconditionally; on Windows try `triton-windows`
  (setup.ps1 -Only sam3). Licence: SAM License - commercial use allowed, but no military/ITAR/
  weapons/espionage uses, redistribution under the same terms, Meta may change terms; terminates if
  you sue Meta over IP. Without SAM 3 the blueprint has no per-object motion paths.
- **MegaSaM** compiles CUDA extensions (DROID-SLAM `droid_backends`, `lietorch_backends`), is tested
  on Linux / CUDA 11.8 / torch 2.0.1 and needs Linux xformers for UniDepth. Realistic only in WSL2.
  Without it: no 3D camera path or focal length; camera_flow.py gives 2D pan/tilt/push/roll/shake.
- **All-In-One (allin1)**: upstream needs NATTEN (no Windows wheels); the maintained fork
  `openmirlab/all-in-one-infer` avoids NATTEN, but its README lists the Harmonix checkpoints as
  **CC-BY-NC-SA-4.0** (the HF card says MIT - conflicting). Treated as non-commercial: not used for
  client work. sections.py does librosa segmentation + Krumhansl key instead.
- **Essentia** (AGPL + CC BY-NC-SA models), **CoTracker3** (CC-BY-NC), **Ultralytics** (AGPL),
  **Video Depth Anything Base/Large** (CC-BY-NC), **VGGT original checkpoint** (non-commercial):
  excluded for licence reasons.
- **Qwen3-VL**: 8B does not fit comfortably in 8 GB next to everything else; Claude reads the
  keyframe sheets instead (same role: description, never timing).

## Speakers (diarization)

Needs the token file `%USERPROFILE%\.config\huggingface\token` (read at use, never printed) and the
`pyannote/speaker-diarization-community-1` terms accepted on Hugging Face. Then `run ... --diarize`.

## Accuracy seen on the test Short (AI bubble, 49 s, 60 fps, Hinglish VO)

- BPM 96.77 measured vs 96.04 in the project's own beat file.
- Cuts: 3 real cuts agreed by both detectors (one classed as jump cut); 2 false candidates (a light
  sweep, a red flash) were correctly flagged for review.
- Text: every caption found, word-by-word reveals grouped, in/out refined to the frame.
- SFX: found the riser under "trillion" and the impact on "gayab" with the right family; missed quieter
  swells under music. Treat SFX as medium confidence.
