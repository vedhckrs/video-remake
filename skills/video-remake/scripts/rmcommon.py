"""Shared paths for the video-remake scripts."""
import os
from pathlib import Path
from types import SimpleNamespace

VB_HOME = Path(os.environ.get("VB_HOME", r"D:\VideoBlueprint"))
ENGINE = VB_HOME / "remakes" / "engine"          # the one Remotion project every remake renders in
SKILL = Path(__file__).resolve().parent.parent
BLUEPRINT_SKILL = SKILL.parent / "video-blueprint"
CORE_PY = VB_HOME / "envs" / "core" / "Scripts" / "python.exe"


def _earshot_home() -> Path:
    """earshot clone with its .venv (sound design + listening). EARSHOT_HOME wins; then <VB>/tools/earshot;
    then Ved's existing install D:\\Sumit\\tools\\earshot (shared with meta-ads-video - never reinstall it)."""
    for c in (os.environ.get("EARSHOT_HOME"), VB_HOME / "tools" / "earshot", r"D:\Sumit\tools\earshot"):
        if c and (Path(c) / ".venv" / "Scripts" / "python.exe").exists():
            return Path(c)
    return VB_HOME / "tools" / "earshot"


# Master chain proven on Ved's ads (sfxlib.finish): EQ, loudnorm -14, resample BEFORE the limiter. Used by
# sound_design.py mix (AAC 192k for review) and upload_package.py master (AAC 320k for upload) - keep it in one place.
MASTER_AF = ("highpass=f=30,lowshelf=f=110:g=-1.5,equalizer=f=2000:t=q:w=1.2:g=-2,loudnorm=I=-14:TP=-2:LRA=11,"
             "aresample=48000,alimiter=limit=0.8:attack=1:release=40:level=disabled,aresample=48000")

EARSHOT = _earshot_home()
EARSHOT_PY = EARSHOT / ".venv" / "Scripts" / "python.exe"


def project_paths(project_dir) -> SimpleNamespace:
    """A remake project lives in ENGINE/projects/<id>/ ; its audio in ENGINE/public/<id>/."""
    proj = Path(project_dir).resolve()
    pid = proj.name
    return SimpleNamespace(id=pid, proj=proj, pub=ENGINE / "public" / pid, out=proj / "out")
