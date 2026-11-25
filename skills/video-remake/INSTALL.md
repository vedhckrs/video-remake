# Install: video-remake + video-blueprint (Claude skills)

Two skills that work together:
- **video-blueprint** analyses a finished video (shots, transitions, captions, voice, beats, SFX) into a
  blueprint, a Premiere/Resolve timeline and a report.
- **video-remake** uses that analysis to make a NEW English video that edits like a reference
  (ElevenLabs voice, Remotion render at 1080x1920 / 60 fps, real brand logos and screenshots), then
  re-analyses it and scores it against the reference.

They run locally in **Claude Code** (desktop app Code tab or terminal) on a **Windows PC with an NVIDIA GPU**.
They do not run inside claude.ai's web chat sandbox (no GPU, no local tools).

## 1. Requirements (check / install with winget)
- Windows 10/11, NVIDIA GPU with 8 GB+ VRAM and a current driver, ~45 GB free disk
- Git (`winget install --id Git.Git -e`), Node.js 20+ (`winget install --id OpenJS.NodeJS.LTS -e`),
  FFmpeg on PATH (`winget install --id Gyan.FFmpeg -e`), uv (`winget install --id astral-sh.uv -e`)
- Python from python.org (signed - required when Windows Smart App Control is on):
  `winget install --id Python.Python.3.12 -e --scope user` and `winget install --id Python.Python.3.10 -e --scope user`
  (setup.ps1 installs them if missing)

## 2. Put the skills in place
Unzip so you get:
```
%USERPROFILE%\.claude\skills\video-blueprint\SKILL.md
%USERPROFILE%\.claude\skills\video-remake\SKILL.md
```
Both folders must sit side by side (video-remake calls video-blueprint).

## 3. Choose where the tools live (optional)
Default is `D:\VideoBlueprint`. For another drive/folder set it once:
`setx VB_HOME "E:\VideoBlueprint"` (open a new terminal afterwards).

## 4. Build the tools (one time, ~30-60 min, downloads ~15 GB)
```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\skills\video-blueprint\scripts\setup.ps1"
& "$env:VB_HOME\envs\core\Scripts\python.exe" "$env:USERPROFILE\.claude\skills\video-remake\scripts\new_project.py" setup
```
(if VB_HOME is not set, use `D:\VideoBlueprint` in place of `$env:VB_HOME`)
Check: `& "<VB>\envs\core\Scripts\python.exe" "$env:USERPROFILE\.claude\skills\video-blueprint\scripts\blueprint.py" doctor`

## 4b. earshot (sound design + listening, ~1.5 GB)
video-remake makes every sound effect and the music in code with earshot (github.com/Leonxlnx/earshot, MIT)
and checks the mix with earshot's ears. If you already have an earshot clone with a `.venv`, set
`setx EARSHOT_HOME "<that folder>"`. Otherwise:
```powershell
git clone --depth 1 https://github.com/Leonxlnx/earshot "$env:VB_HOME\tools\earshot"
cd "$env:VB_HOME\tools\earshot"; & "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" -m venv .venv
.venv\Scripts\python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv\Scripts\python -m pip install -e ".[listen,measure,images,mcp]" soundfile scipy
.venv\Scripts\python -m earshot doctor --fetch
```
(use the signed python.org Python for the venv - Smart App Control blocks unsigned ones)

## 5. Keys (never paste them into chat)
- ElevenLabs (voice): save the key in `%USERPROFILE%\.config\elevenlabs\api_key`
- Hugging Face (optional: speaker labels, SAM 3): token in `%USERPROFILE%\.config\huggingface\token`,
  and accept the terms of `pyannote/speaker-diarization-community-1` / request `facebook/sam3` on huggingface.co

## 5b. New Claude account (same PC or a new one) - what does and doesn't move
- **Skills** live in the Windows user's folder (`%USERPROFILE%\.claude\skills`), not in the Claude account. Same
  PC + same Windows user: they are already there after you sign in with the new account; just check that
  `%USERPROFILE%\.claude\skills\video-remake\SKILL.md` exists (unzip this suite over it to update). Other PC or
  Windows user: section 2.
- **Tools, keys and envs** (`D:\VideoBlueprint`, earshot, `%USERPROFILE%\.config\...`) belong to the PC, not the account.
- **Connectors belong to the account**: in the new account connect **Magnific** (claude.ai → Settings →
  Connectors) - used for covers (GPT Image 2.6 Flare) and stock photos in the upload package (step 10). Without
  it, Claude gives you the cover prompt + settings to paste on magnific.com and continues with the saved PNG.
- **Fable subagents** (`model: "fable"`, used to draw explainer worlds in parallel) need a plan that includes
  Claude Fable; otherwise Claude draws the worlds itself.
- **Claude's memory does not move.** Everything a new session needs is inside the skills: `video-remake/README.md`,
  `video-remake/references/ved-preferences.md` (your standing rules and decisions) and the worked examples.
- Phase A style studies (`video-blueprint/scripts/vision_api.py`) use an Anthropic API login made with
  `ant auth login` on the PC - also not tied to the Claude account.

## 6. Use
In Claude Code: "break down this video <path>" (video-blueprint) or
"make a video like <reference video> about <topic / repo / product>" (video-remake).
The script and the voice cost are shown for your OK before anything paid is generated.
After you approve a video: "make the upload package" → final 1080p60 master, GPT Image 2.6 cover (cost shown
first), captions, and separate YouTube / Instagram zips with step-by-step upload guides.

## Licences to know
- All-In-One music-section weights are CC-BY-NC-SA (internal analysis only); SAM 3 uses Meta's SAM License.
- Brand logos come from Simple Icons (CC0 data; the marks belong to their owners - use them only to
  identify products the video talks about).
