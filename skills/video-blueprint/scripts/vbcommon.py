"""Shared helpers for the video-blueprint pipeline.

Every stage script imports this. It knows where the per-stage Python
environments live, how the work folder is laid out, and the one time rule
used everywhere: seconds from the container's presentation timestamps (PTS).
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Root that holds envs/, models/, repos/ (override with VB_HOME).
VB_HOME = Path(os.environ.get("VB_HOME", r"D:\VideoBlueprint"))
ENVS = VB_HOME / "envs"
MODELS = VB_HOME / "models"
REPOS = VB_HOME / "repos"
SCRIPTS = Path(__file__).resolve().parent

def stage_environ() -> dict:
    """Environment for every stage subprocess: model caches on D:, UTF-8 output, no symlink nags."""
    env = dict(os.environ)
    env.update({
        "HF_HOME": str(MODELS / "hf"),
        "TORCH_HOME": str(MODELS / "torch"),
        "PADDLE_PDX_CACHE_HOME": str(MODELS / "paddlex"),
        "HF_HUB_DISABLE_SYMLINKS_WARNING": "1",
        "PYTHONIOENCODING": "utf-8",
        "PYTHONUTF8": "1",
    })
    return env


def env_python(env: str) -> Path:
    return ENVS / env / "Scripts" / "python.exe"


def env_exists(env: str) -> bool:
    return env_python(env).exists()


def hf_token() -> str | None:
    """Read the Hugging Face token from Ved's key file at the moment of use.

    Never print or log the value.
    """
    p = Path.home() / ".config" / "huggingface" / "token"
    if p.exists():
        t = p.read_text(encoding="utf-8").strip()
        return t or None
    return os.environ.get("HF_TOKEN") or None


class Work:
    """The output folder for one video."""

    def __init__(self, root: str | Path):
        self.root = Path(root)
        self.raw = self.root / "raw"
        self.keyframes = self.root / "keyframes"
        self.stems = self.root / "stems"
        for d in (self.root, self.raw, self.keyframes, self.stems):
            d.mkdir(parents=True, exist_ok=True)

    @property
    def probe(self) -> dict:
        return read_json(self.root / "probe.json")

    @property
    def video(self) -> Path:
        """The decoded-once proxy every stage reads (CFR copy of the source if VFR)."""
        return Path(self.probe["proxy"])

    @property
    def audio(self) -> Path:
        return self.root / "audio_48k.wav"

    def raw_path(self, name: str) -> Path:
        return self.raw / f"{name}.json"

    def has(self, name: str) -> bool:
        return self.raw_path(name).exists()

    def load(self, name: str, default=None):
        p = self.raw_path(name)
        return read_json(p) if p.exists() else default

    def save(self, name: str, data) -> Path:
        p = self.raw_path(name)
        write_json(p, data)
        return p


def read_json(p: str | Path):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(p: str | Path, data) -> None:
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.replace(p)


def t2f(t: float, fps: float) -> int:
    """Seconds -> frame index (CFR). Floor with a tiny epsilon so 2.7666 at 30 fps is frame 83."""
    return int(t * fps + 1e-6)


def f2t(f: int, fps: float) -> float:
    return round(f / fps, 6)


def ffmpeg_bin(name: str = "ffmpeg") -> str:
    p = shutil.which(name)
    if not p:
        sys.exit(f"{name} not found on PATH")
    return p


def run(cmd: list, **kw) -> subprocess.CompletedProcess:
    return subprocess.run([str(c) for c in cmd], check=True, **kw)


def log(msg: str) -> None:
    print(f"[video-blueprint] {msg}", flush=True)
