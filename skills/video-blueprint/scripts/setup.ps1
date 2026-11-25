# video-blueprint: (re)create the per-stage Python environments under D:\VideoBlueprint.
# Safe to re-run: existing envs are reused, packages are only added. Uses uv (winget id astral-sh.uv).
# Usage:  powershell -ExecutionPolicy Bypass -File setup.ps1 [-Only core,ocr,...]
param([string[]]$Only = @())

$ErrorActionPreference = "Stop"
# `powershell -File setup.ps1 -Only a,b` delivers ONE string "a,b" - split it
$Only = @($Only | ForEach-Object { $_ -split ',' } | Where-Object { $_ })
$VB = if ($env:VB_HOME) { $env:VB_HOME } else { "D:\VideoBlueprint" }
$uv = (Get-Command uv -ErrorAction SilentlyContinue).Source
if (-not $uv) { $uv = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter uv.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }
if (-not $uv) { throw "uv not found - winget install --id astral-sh.uv -e" }
$env:UV_CACHE_DIR = "$VB\uv-cache"; $env:HF_HUB_DISABLE_SYMLINKS_WARNING = "1"
New-Item -ItemType Directory -Force "$VB\envs", "$VB\models", "$VB\repos" | Out-Null

# SIGNED python.org interpreters only. Windows Smart App Control blocks unsigned DLLs (WinError 4551):
# uv's standalone Python and uv's venv launcher are unsigned and get refused at random. `python -m venv`
# from a signed base gives a signed launcher; uv is used only as the (fast) package installer.
$PY = @{
  '3.12' = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
  '3.10' = "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe"
}
if (-not (Test-Path $PY['3.12'])) { winget install --id Python.Python.3.12 -e --scope user --silent --accept-package-agreements --accept-source-agreements }
if (-not (Test-Path $PY['3.10'])) { winget install --id Python.Python.3.10 -e --scope user --silent --accept-package-agreements --accept-source-agreements --override "/quiet InstallAllUsers=0 PrependPath=0 Include_launcher=0 Include_test=0 Shortcuts=0" }

function Want($n) { return ($Only.Count -eq 0) -or ($Only -contains $n) }
function Venv($n, $ver) { $p = "$VB\envs\$n\Scripts\python.exe"; if (-not (Test-Path $p)) { & $PY[$ver] -m venv "$VB\envs\$n" }; return $p }

if (Want "core") {   # PySceneDetect, OpenTimelineIO (+EDL, FCPXML, FCP7 XML adapters), OpenCV, librosa
  $p = Venv core '3.12'
  & $uv pip install --python $p "scenedetect>=0.7.3" av opentimelineio otio-cmx3600-adapter otio-fcpx-xml-adapter otio-fcp-adapter librosa soundfile scikit-learn numpy pillow jsonschema opencv-python requests playwright
  & $p -m playwright install chromium   # video-remake/capture.py screenshots
}
if (Want "omnishotcut") {   # MIT; reported working recipe: py3.10 + torch 2.5.1 cu124 + transformers 4.57.3
  $p = Venv omnishotcut '3.10'
  & $uv pip install --python $p torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu124
  & $uv pip install --python $p "git+https://github.com/UVA-Computer-Vision-Lab/OmniShotCut.git" transformers==4.57.3 ffmpeg-python huggingface_hub "numpy<2.3" opencv-python
}
if (Want "ocr") {   # PaddleOCR 3.x on PaddlePaddle-GPU 3.2.0 (3.3.x CPU breaks on oneDNN; docs pin 3.2.0)
  $p = Venv ocr '3.12'
  & $uv pip install --python $p paddlepaddle-gpu==3.2.0 --index-url https://www.paddlepaddle.org.cn/packages/stable/cu126/ --extra-index-url https://pypi.org/simple --index-strategy unsafe-best-match  # 3.3.x CPU crashes on oneDNN
  & $uv pip install --python $p paddleocr
}
if (Want "speech") {   # WhisperX (pins torch 2.8) + pyannote 4
  $p = Venv speech '3.12'
  & $uv pip install --python $p --torch-backend auto whisperx
}
if (Want "music") {   # Demucs 4.1 (adefossez fork), Beat This!, librosa
  $p = Venv music '3.12'
  & $uv pip install --python $p --torch-backend auto "git+https://github.com/adefossez/demucs" beat-this librosa soundfile
}
if (Want "audiosep") {   # AudioSep (MIT) - old code: py3.10, torch 2.5.1, transformers 4.30.2 for its CLAP
  if (-not (Test-Path "$VB\repos\AudioSep")) { git clone --depth 1 https://github.com/Audio-AGI/AudioSep.git "$VB\repos\AudioSep" }
  $p = Venv audiosep '3.10'
  & $uv pip install --python $p torch==2.5.1 torchaudio==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cu124
  & $uv pip install --python $p torchlibrosa lightning "transformers==4.30.2" librosa soundfile h5py ftfy braceexpand webdataset pyyaml "numpy<2" huggingface_hub regex tqdm timm scikit-learn pandas wget pillow
  & $p -c "from huggingface_hub import hf_hub_download as d;[d('Audio-AGI/AudioSep', f, repo_type='space', local_dir=r'$VB\repos\AudioSep') for f in ['checkpoint/audiosep_base_4M_steps.ckpt','checkpoint/music_speech_audioset_epoch_15_esc_89.98.pt']]"
}
if (Want "allin1") {   # All-In-One via the NATTEN-free fork (code MIT; Harmonix weights listed CC-BY-NC-SA: internal use)
  $p = Venv allin1 '3.12'
  & $uv pip install --python $p --torch-backend auto torch torchaudio
  & $uv pip install --python $p --torch-backend auto "all-in-one-infer @ git+https://github.com/openmirlab/all-in-one-infer.git"
}
if (Want "sam3") {   # SAM 3 - needs HF token with access to facebook/sam3; triton-windows for its triton imports
  $p = Venv sam3 '3.12'
  & $uv pip install --python $p torch==2.10.0 torchvision --index-url https://download.pytorch.org/whl/cu128
  & $uv pip install --python $p sam3 "triton-windows>=3.6,<3.7" psutil opencv-python huggingface_hub
}
Write-Host "done. check with: $VB\envs\core\Scripts\python.exe $PSScriptRoot\blueprint.py doctor"
