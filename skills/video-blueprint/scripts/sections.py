"""Step 8d: music sections (intro / build / drop-chorus / outro guesses) and key estimate - licence-clean.

The top-ranked structure model (All-In-One) ships Harmonix checkpoints that its own maintained fork
lists as CC-BY-NC-SA-4.0, so it is NOT used by default for client work. This script instead uses
librosa (ISC): beat-synchronous chroma + MFCC, agglomerative segmentation snapped to downbeats,
segments clustered into A/B/C, and role guesses from energy. Key: Krumhansl-Schmuckler on chroma.
All labels here are low-confidence descriptions, not ground truth.

usage: sections.py <workdir> [--per-seconds 8]
reads: stems/music_no_vocals.wav (or mix), raw/beats.json   writes: raw/sections.json
"""
import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log  # noqa: E402

MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def key_of(chroma):
    prof = chroma.mean(axis=1)
    best = (-2, None)
    for i in range(12):
        for mode, tpl in (("major", MAJOR), ("minor", MINOR)):
            r = np.corrcoef(prof, np.roll(tpl, i))[0, 1]
            if r > best[0]:
                best = (r, f"{NAMES[i]} {mode}")
    return best[1], round(float(best[0]), 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--per-seconds", type=float, default=8.0, help="about one section per N seconds")
    a = ap.parse_args()
    w = Work(a.workdir)
    src = w.stems / "music_no_vocals.wav"
    if not src.exists():
        src = w.audio
    if not src.exists():
        w.save("sections", {"skipped": "no audio"})
        return
    import librosa

    y, sr = librosa.load(str(src), sr=22050, mono=True)
    dur = len(y) / sr
    hop = 512
    B = w.load("beats", {}) or {}
    beats = np.array(B.get("beats") or [])
    downs = np.array(B.get("downbeats") or [])
    if len(beats) < 8:
        _, bf = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
        beats = librosa.frames_to_time(bf, sr=sr, hop_length=hop)
    bframes = librosa.time_to_frames(beats, sr=sr, hop_length=hop)

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=hop)
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    key, key_r = key_of(chroma)

    out = {"tool": "librosa segmentation (licence-clean fallback for All-In-One)", "key_estimate": key,
           "key_confidence": key_r, "sections": [], "energy_curve": []}
    # energy curve, 4 points per second, for the report
    t_rms = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    for t in np.arange(0, dur, 0.25):
        out["energy_curve"].append(round(float(rms[min(len(rms) - 1, np.searchsorted(t_rms, t))]), 4))

    if len(bframes) >= 8 and dur > 6:
        feat = np.vstack([librosa.util.normalize(librosa.util.sync(chroma, bframes), axis=0),
                          librosa.util.normalize(librosa.util.sync(mfcc, bframes), axis=1)])
        k = int(np.clip(round(dur / a.per_seconds), 2, 12))
        k = min(k, feat.shape[1] - 1)
        bounds = librosa.segment.agglomerative(feat, k)
        bt = librosa.frames_to_time(librosa.util.fix_frames(bframes)[bounds], sr=sr, hop_length=hop)
        bt = sorted(set([0.0] + [float(x) for x in bt if x > 0.5]))
        if len(downs):  # snap boundaries to the nearest downbeat
            bt = sorted(set([0.0] + [float(downs[np.argmin(np.abs(downs - x))]) for x in bt[1:]]))
        edges = bt + [dur]
        segs = []
        for t0, t1 in zip(edges[:-1], edges[1:]):
            if t1 - t0 < 0.5:
                continue
            f0, f1 = librosa.time_to_frames([t0, t1], sr=sr, hop_length=hop)
            segs.append({"t_in": round(t0, 3), "t_out": round(t1, 3),
                         "energy": float(rms[f0:f1].mean()) if f1 > f0 else 0.0,
                         "_v": np.concatenate([chroma[:, f0:f1].mean(1), mfcc[1:, f0:f1].mean(1) / 50])})
        # cluster similar sections into letters
        letters, protos = [], []
        for s in segs:
            d = [np.linalg.norm(s["_v"] - p) for p in protos]
            if d and min(d) < 0.35:
                letters.append(int(np.argmin(d)))
            else:
                protos.append(s["_v"])
                letters.append(len(protos) - 1)
        e = np.array([s["energy"] for s in segs])
        hi = e.max() or 1
        for i, (s, L) in enumerate(zip(segs, letters)):
            rel = s["energy"] / hi
            role = "section"
            if rel > 0.8:
                role = "drop/chorus (high energy)"
            elif i == 0 and rel < 0.6:
                role = "intro"
            elif i == len(segs) - 1 and rel < 0.6:
                role = "outro"
            elif i + 1 < len(segs) and e[i + 1] / hi > 0.8 and rel < 0.7:
                role = "build"
            out["sections"].append({"label": chr(65 + L), "role_guess": role, "t_in": s["t_in"],
                                    "t_out": s["t_out"], "energy_rel": round(rel, 3)})
    else:
        out["sections"].append({"label": "A", "role_guess": "single section", "t_in": 0.0,
                                "t_out": round(dur, 3), "energy_rel": 1.0})
    w.save("sections", out)
    log(f"sections: {len(out['sections'])} sections, key~{key} (r={key_r})")


if __name__ == "__main__":
    main()
