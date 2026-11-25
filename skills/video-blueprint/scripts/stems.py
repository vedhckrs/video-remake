"""Step 8a: stems with Demucs 4.1 (adefossez fork, MIT). Runs first so WhisperX can use the vocal stem.

usage: stems.py <workdir> [--model htdemucs] [--segment 7]
writes: stems/vocals.wav drums.wav bass.wav other.wav music_no_vocals.wav, raw/stems.json
--segment 7 keeps htdemucs inside ~3-4 GB VRAM (8 GB RTX 3050 safe).
"""
import argparse
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--model", default="htdemucs")
    ap.add_argument("--segment", default="7")
    a = ap.parse_args()
    w = Work(a.workdir)
    if not w.audio.exists():
        w.save("stems", {"skipped": "no audio track"})
        return
    import numpy as np
    import soundfile as sf
    import torch
    from demucs.separate import main as demucs_main

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    with tempfile.TemporaryDirectory() as tmp:
        demucs_main(["-n", a.model, "--segment", a.segment, "-d", dev, "-o", tmp, str(w.audio)])
        src = Path(tmp) / a.model / w.audio.stem
        for f in src.glob("*.wav"):
            shutil.move(str(f), w.stems / f.name)
    parts = [w.stems / f"{n}.wav" for n in ("drums", "bass", "other") if (w.stems / f"{n}.wav").exists()]
    if parts:
        mix, sr = None, None
        for p in parts:
            x, sr = sf.read(p, dtype="float32")
            mix = x if mix is None else mix + x
        sf.write(w.stems / "music_no_vocals.wav", np.clip(mix, -1, 1), sr)
    stems = {p.stem: f"stems/{p.name}" for p in sorted(w.stems.glob("*.wav"))}
    # loudness share per stem: tells whether there is a voiceover / music bed at all
    share = {}
    for name in ("vocals", "drums", "bass", "other"):
        p = w.stems / f"{name}.wav"
        if p.exists():
            x, _ = sf.read(p, dtype="float32")
            share[name] = float(np.sqrt(np.mean(x ** 2)))
    tot = sum(share.values()) or 1.0
    w.save("stems", {"tool": f"Demucs {a.model}", "device": dev, "files": stems,
                     "rms_share": {k: round(v / tot, 3) for k, v in share.items()}})
    log(f"stems: {list(stems)} on {dev}")


if __name__ == "__main__":
    main()
