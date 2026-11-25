"""Step 8f: voice delivery - per-word pitch and energy, emphasis candidates, pauses, pace by section.

No prosody/emotion repo was verified, so this uses librosa (ISC) contours on the vocal stem with the
WhisperX word times. "Emphasis" = words whose energy+pitch stand out from the speaker's own average.
Tone words ("confident", "urgent") are for Claude to write after listening cues + transcript, marked
manual/heuristic.

usage: prosody.py <workdir>
reads: stems/vocals.wav (or mix), raw/words.json   writes: raw/prosody.json
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log  # noqa: E402


def main(workdir):
    w = Work(workdir)
    W = w.load("words", {}) or {}
    words = W.get("words") or []
    src = w.stems / "vocals.wav"
    if not src.exists():
        src = w.audio
    if not words or not src.exists():
        w.save("prosody", {"skipped": "no words"})
        return
    import librosa
    y, sr = librosa.load(str(src), sr=16000, mono=True)
    hop = 160  # 10 ms
    f0 = librosa.yin(y, fmin=70, fmax=400, sr=sr, frame_length=1024, hop_length=hop)
    rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
    db = librosa.amplitude_to_db(rms + 1e-9, ref=np.max)
    voiced = rms > np.percentile(rms, 40)

    per = []
    for wd in words:
        a, b = int(wd["t_in"] * 100), max(int(wd["t_in"] * 100) + 1, int(wd["t_out"] * 100))
        v = voiced[a:b]
        pf = f0[a:b][v] if v.any() else np.array([])
        per.append({"w": wd["w"], "t_in": wd["t_in"], "t_out": wd["t_out"],
                    "pitch_hz": round(float(np.median(pf)), 1) if len(pf) else None,
                    "energy_db": round(float(db[a:b].mean()), 2) if b > a else None,
                    "dur_s": round(wd["t_out"] - wd["t_in"], 3)})
    P = np.array([p["pitch_hz"] or np.nan for p in per], float)
    E = np.array([p["energy_db"] if p["energy_db"] is not None else np.nan for p in per], float)
    D = np.array([p["dur_s"] for p in per], float)
    z = lambda x: (x - np.nanmean(x)) / (np.nanstd(x) or 1)  # noqa: E731
    score = np.nan_to_num(z(E)) + np.nan_to_num(z(P)) + 0.5 * np.nan_to_num(z(D))
    emph = []
    for p, s, zp, ze in zip(per, score, np.nan_to_num(z(P)), np.nan_to_num(z(E))):
        p["emphasis_score"] = round(float(s), 2)
        if s > 1.6:
            cue = "+".join(c for c, v in (("pitch", zp > 0.7), ("energy", ze > 0.7)) if v) or "length"
            emph.append({"w": p["w"], "t_in": p["t_in"], "cue": f"{cue} peak", "score": round(float(s), 2)})
    pauses = [{"after": a["w"], "t": a["t_out"], "dur_s": round(b["t_in"] - a["t_out"], 3)}
              for a, b in zip(words[:-1], words[1:]) if b["t_in"] - a["t_out"] >= 0.25]
    pitch_all = P[~np.isnan(P)]
    w.save("prosody", {
        "tool": "librosa yin + rms on vocal stem",
        "speaker_pitch_median_hz": round(float(np.median(pitch_all)), 1) if len(pitch_all) else None,
        "pitch_range_hz": [round(float(np.percentile(pitch_all, 10)), 1), round(float(np.percentile(pitch_all, 90)), 1)]
        if len(pitch_all) else None,
        "emphasis": emph, "pauses": pauses, "words": per,
        "register_guess": ("low" if len(pitch_all) and np.median(pitch_all) < 140 else
                           "mid" if len(pitch_all) and np.median(pitch_all) < 210 else "high"),
    })
    log(f"prosody: {len(emph)} emphasis candidates, {len(pauses)} pauses")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
