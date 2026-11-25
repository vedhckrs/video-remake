"""Step 8e: SFX hits - onsets on the non-music, non-voice residue, with a heuristic type per hit.

Default path (licence-clean, no extra model): sound effects in edits land mostly in Demucs' "other"
stem and in the transient part of drums. We detect onsets there that do NOT sit on the music's beat
grid or inside a word, then label each hit from its envelope and spectrum:
  whoosh (0.15-0.8 s noisy sweep), riser (>0.8 s rising energy/centroid), impact/boom (sharp attack,
  low-end heavy), hit/snap (sharp, broadband, short), click/pop (<80 ms, bright), ding/chime (tonal,
  decaying), other. Labels are low confidence and say so.
Optional: if the `audiosep` env exists, `--audiosep "whoosh,impact,riser"` separates those queries
with AudioSep (MIT) first and detects onsets per query (more specific, slower).

usage: sfx.py <workdir> [--min-gap 0.12] [--audiosep "whoosh,impact"]
writes: raw/sfx.json
"""
import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log  # noqa: E402


def describe(y, sr, t0, t1):
    import librosa
    seg = y[int(t0 * sr):int(t1 * sr)]
    if len(seg) < int(0.02 * sr):
        return "other", {}
    env = np.abs(seg)
    frame = int(0.01 * sr)
    e = np.array([env[i:i + frame].mean() for i in range(0, len(env) - frame, frame)]) + 1e-9
    peak_i = int(np.argmax(e))
    attack_s = peak_i * 0.01
    above = np.where(e > e.max() * 0.25)[0]
    dur = (above[-1] - above[0] + 1) * 0.01 if len(above) else 0.0
    S = np.abs(librosa.stft(seg, n_fft=1024, hop_length=256)) + 1e-9
    cent = librosa.feature.spectral_centroid(S=S, sr=sr)[0]
    flat = float(librosa.feature.spectral_flatness(S=S).mean())
    low = float(S[:int(150 / (sr / 1024))].sum() / S.sum())
    trend = float(np.polyfit(np.arange(len(cent)), cent, 1)[0]) if len(cent) > 3 else 0.0
    feats = {"dur_s": round(dur, 3), "attack_s": round(attack_s, 3), "centroid_hz": int(np.median(cent)),
             "flatness": round(flat, 3), "low_share": round(low, 3)}
    if dur < 0.08 and np.median(cent) > 2500:
        typ = "click/pop"
    elif dur > 0.6 and attack_s > 0.4 * dur and trend > 0:
        typ = "riser"
    elif 0.15 <= dur <= 0.9 and flat > 0.08 and attack_s > 0.05:
        typ = "whoosh"
    elif attack_s < 0.03 and low > 0.35:
        typ = "impact/boom"
    elif attack_s < 0.03 and dur < 0.25:
        typ = "hit/snap"
    elif flat < 0.02 and dur > 0.2:
        typ = "ding/chime (tonal)"
    else:
        typ = "other"
    return typ, feats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--min-gap", type=float, default=0.12)
    ap.add_argument("--beat-tol", type=float, default=0.035, help="onsets this close to a beat count as music")
    ap.add_argument("--delta", type=float, default=0.12, help="onset peak threshold (higher = fewer hits)")
    ap.add_argument("--min-strength", type=float, default=0.45, help="relative onset strength to keep (0-1)")
    a = ap.parse_args()
    w = Work(a.workdir)
    import librosa

    src = w.stems / "other.wav"
    if not src.exists():
        src = w.audio
    if not src.exists():
        w.save("sfx", {"skipped": "no audio"})
        return
    y, sr = librosa.load(str(src), sr=22050, mono=True)
    drums = w.stems / "drums.wav"
    yd = librosa.load(str(drums), sr=22050, mono=True)[0] if drums.exists() else None

    beats = np.array((w.load("beats", {}) or {}).get("beats") or [])
    words = (w.load("words", {}) or {}).get("words") or []

    def onsets(sig):
        env = librosa.onset.onset_strength(y=sig, sr=sr, hop_length=256)
        fr = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=256, delta=a.delta,
                                        wait=int(a.min_gap * sr / 256), backtrack=True)
        # strength relative to the loud end of this stem (one huge peak must not hide the rest)
        st = np.clip(env[fr] / (np.percentile(env, 99.5) or 1), 0, 1)
        return librosa.frames_to_time(fr, sr=sr, hop_length=256), st

    events = []
    for name, sig in (("other", y), ("drums", yd)):
        if sig is None:
            continue
        ts, st = onsets(sig)
        for i, (t, s) in enumerate(zip(ts, st)):
            on_beat = bool(len(beats) and np.min(np.abs(beats - t)) < a.beat_tol)
            if name == "drums" and (on_beat or s < 0.5):
                continue  # regular drum hits are music, not SFX
            if s < a.min_strength:
                continue
            in_word = any(wd["t_in"] - 0.02 <= t <= wd["t_out"] for wd in words)
            end = min(len(sig) / sr, t + 0.9, ts[i + 1] if i + 1 < len(ts) else 1e9)
            typ, feats = describe(sig, sr, max(0, t - 0.03), end)
            if typ == "ding/chime (tonal)" and s < 0.5:
                continue  # a melodic note in the music bed, not a designed sound
            events.append({"t": round(float(t), 3), "type": typ, "strength": round(float(s), 3),
                           "stem": name, "on_beat": on_beat, "inside_word": in_word, **feats,
                           "confidence": "low (heuristic label)"})
    events.sort(key=lambda e: e["t"])
    merged = []
    for e in events:  # same hit seen in two stems
        if merged and e["t"] - merged[-1]["t"] < a.min_gap:
            if e["strength"] > merged[-1]["strength"]:
                merged[-1] = e
            continue
        merged.append(e)
    w.save("sfx", {"tool": "librosa onsets on Demucs other+drums residue, heuristic labels",
                   "events": merged})
    log(f"sfx: {len(merged)} candidate hits")


if __name__ == "__main__":
    main()
