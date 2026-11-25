"""Step 8c: beats and downbeats with Beat This! (CPJKU, MIT); BPM and meter derived from them.

usage: beats.py <workdir> [--source music|mix] [--checkpoint final0] [--dbn]
reads: stems/music_no_vocals.wav (falls back to the full mix)
writes: raw/beats.json, beats.tsv (time, beat-in-bar)
Beat This! gives no BPM or key: BPM here is 60 / median inter-beat interval, plus a tempo curve.
"""
import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--source", choices=["music", "mix"], default="music")
    ap.add_argument("--checkpoint", default="final0")
    ap.add_argument("--dbn", action="store_true", help="madmom DBN post-processing (needs madmom from git)")
    a = ap.parse_args()
    w = Work(a.workdir)
    src = w.stems / "music_no_vocals.wav"
    if a.source == "mix" or not src.exists():
        src = w.audio
    if not src.exists():
        w.save("beats", {"skipped": "no audio"})
        return
    import torch
    from beat_this.inference import File2Beats

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    beats, downs = File2Beats(checkpoint_path=a.checkpoint, device=dev, dbn=a.dbn)(str(src))
    beats, downs = np.asarray(beats, float), np.asarray(downs, float)
    out = {"tool": f"Beat This! ({a.checkpoint})", "source": str(src.name), "device": dev,
           "beats": [round(float(b), 4) for b in beats], "downbeats": [round(float(d), 4) for d in downs]}
    if len(beats) >= 4:
        ibi = np.diff(beats)
        bpm = 60.0 / float(np.median(ibi))
        # tempo curve: BPM over 8-beat windows
        curve = [{"t": round(float(beats[i]), 3), "bpm": round(60.0 / float(np.median(ibi[i:i + 8])), 2)}
                 for i in range(0, len(ibi) - 1, 8)]
        bars = []
        for d0, d1 in zip(downs[:-1], downs[1:]):
            bars.append(int(((beats >= d0) & (beats < d1)).sum()))
        meter = int(np.bincount(bars).argmax()) if bars else None
        out.update({"bpm": round(bpm, 2), "bpm_stability_pct": round(float(np.std(60 / ibi) / bpm * 100), 2),
                    "tempo_curve": curve, "beats_per_bar": meter,
                    "first_downbeat": round(float(downs[0]), 4) if len(downs) else None})
        # beat number within the bar for the TSV
        rows, k = [], 0
        dset = set(np.round(downs, 4))
        for b in beats:
            k = 1 if round(float(b), 4) in dset else k + 1
            rows.append(f"{b:.4f}\t{k}")
        (w.root / "beats.tsv").write_text("\n".join(rows) + "\n", encoding="utf-8")
    w.save("beats", out)
    log(f"beats: {len(beats)} beats, {len(downs)} downbeats, bpm={out.get('bpm')}")


if __name__ == "__main__":
    main()
