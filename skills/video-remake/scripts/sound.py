"""Sound made in code (free, deterministic): the SFX kit and a music bed locked to the recipe's BPM.

usage:
  sound.py <project dir> sfx                       # writes public/<id>/sfx/{whoosh,pop,ding,click,riser,bell,tick,swish}.wav
  sound.py <project dir> music [--bpm 100] [--key "C minor"] [--seconds 45] [--style lofi|pulse]
writes into <engine>/public/<id>/

Why code instead of a library: every hit is exactly as long and as loud as the edit needs, it costs
nothing, and the music bed's tempo and length match the recipe to the frame. For a richer bed,
ElevenLabs music can replace music.wav (see SKILL.md - paid, ask first).
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import project_paths  # noqa: E402

SR = 44100
NOTES = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
         "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
rng = np.random.default_rng(7)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, a=0.005, r=0.2, sus=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    dec = np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
    return e * (sus + (1 - sus) * dec)


def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, n)


def sweep_noise(sec, f0, f1, q=0.35):
    """Noise through a moving band-pass (frame-wise FFT filter)."""
    n = int(sec * SR)
    out = np.zeros(n)
    hop = 512
    x = rng.standard_normal(n + hop * 2)
    win = np.hanning(hop * 2)
    for i in range(0, n, hop):
        p = i / n
        fc = f0 * (f1 / f0) ** p
        seg = x[i:i + hop * 2] * win
        S = np.fft.rfft(seg)
        f = np.fft.rfftfreq(len(seg), 1 / SR)
        S *= np.exp(-((np.log(f + 1) - np.log(fc)) ** 2) / (2 * q ** 2))
        y = np.fft.irfft(S, len(seg))
        out[i:i + hop * 2][:max(0, min(hop * 2, n - i))] += y[:max(0, min(hop * 2, n - i))]
    return out


def norm(x, peak=0.8):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def stereo(x, width=0.0):
    return np.stack([x, x], axis=1) if width == 0 else np.stack([x * (1 - width), x * (1 + width)], axis=1)


def sfx_kit():
    k = {}
    n = int(0.42 * SR)
    w = sweep_noise(0.42, 400, 3500) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
    k["whoosh"] = norm(w, 0.7)
    n = int(0.3 * SR)
    sw = sweep_noise(0.3, 2500, 700) * np.sin(np.linspace(0, np.pi, n)) ** 2
    k["swish"] = norm(sw, 0.6)
    t = t_(0.12)
    f = 880 * np.exp(-t * 18) + 320
    k["pop"] = norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.035), 0.75)
    t = t_(1.1)
    d = sum(a * np.sin(2 * np.pi * 1318.5 * m * t) for a, m in ((1, 1), (0.35, 2.01), (0.15, 3.0)))
    k["ding"] = norm(d * env(len(t), 0.003, 0.32), 0.55)
    t = t_(0.05)
    k["click"] = norm(bandnoise(len(t), 2500, 9000) * env(len(t), 0.0005, 0.008), 0.6)
    t = t_(1.2)
    rz = sweep_noise(1.2, 300, 5000, 0.5) * (t / t[-1]) ** 2 + 0.4 * np.sin(2 * np.pi * np.cumsum(200 + 700 * (t / t[-1]) ** 2) / SR) * (t / t[-1]) ** 2
    k["riser"] = norm(rz * np.minimum(1, (t[-1] - t) / 0.03), 0.6)
    t = t_(0.9)
    b = sum(a * np.sin(2 * np.pi * f0 * t) for a, f0 in ((1, 1046.5), (0.6, 1568), (0.25, 2093)))
    b2 = np.concatenate([np.zeros(int(0.11 * SR)), b[: len(b) - int(0.11 * SR)]])
    k["bell"] = norm((b * env(len(t), 0.002, 0.18) + 0.8 * b2 * env(len(t), 0.002, 0.25)), 0.5)
    t = t_(0.04)
    k["tick"] = norm(np.sin(2 * np.pi * 2200 * t) * env(len(t), 0.0005, 0.01), 0.5)
    return k


def chord_freqs(root_midi, minor, degree):
    scale = [0, 2, 3, 5, 7, 8, 10] if minor else [0, 2, 4, 5, 7, 9, 11]
    idx = [degree, degree + 2, degree + 4]
    semis = [scale[i % 7] + 12 * (i // 7) for i in idx]
    return [440 * 2 ** ((root_midi + s - 69) / 12) for s in semis]


def music(seconds, bpm, key, style):
    name, *mode = key.split()
    minor = bool(mode) and mode[0].lower().startswith("min")
    root = 48 + NOTES.get(name, 0)  # C3 region
    beat = 60 / bpm
    n = int(seconds * SR)
    out = np.zeros((n, 2))
    prog = [0, 5, 3, 4] if minor else [0, 5, 3, 4]  # i-VI-iv-v / I-vi-IV-V
    bar = beat * 4
    t = 0.0
    b = 0
    while t < seconds:
        freqs = chord_freqs(root, minor, prog[b % 4])
        seg = int(min(bar, seconds - t) * SR)
        tt = np.arange(seg) / SR
        pad = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt) for f in freqs)
        pad *= env(seg, 0.25, 2.5, 0.55) * 0.06
        i0 = int(t * SR)
        out[i0:i0 + seg, 0] += pad
        out[i0:i0 + seg, 1] += pad * 0.95
        # pluck arpeggio on 8ths
        for k in range(8):
            tk = t + k * beat / 2
            if tk >= seconds:
                break
            f = freqs[k % 3] * (2 if k % 4 == 3 else 1)
            m = int(0.35 * SR)
            ttt = np.arange(m) / SR
            pl = (np.sin(2 * np.pi * f * 2 * ttt) * 0.6 + np.sin(2 * np.pi * f * 4 * ttt) * 0.2) * env(m, 0.002, 0.12) * 0.05
            j = int(tk * SR)
            pan = 0.3 if k % 2 else -0.3
            e = min(n, j + m) - j
            out[j:j + e, 0] += pl[:e] * (1 - pan)
            out[j:j + e, 1] += pl[:e] * (1 + pan)
        # drums
        for k in range(4):
            tk = t + k * beat
            if tk >= seconds:
                break
            j = int(tk * SR)
            if style == "pulse" or k in (0, 2):
                m = int(0.25 * SR)
                tt2 = np.arange(m) / SR
                kick = np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-tt2 * 30)) / SR) * env(m, 0.001, 0.12) * 0.32
                e = min(n, j + m) - j
                out[j:j + e] += kick[:e, None]
            if k in (1, 3):
                m = int(0.15 * SR)
                sn = bandnoise(m, 1200, 7000) * env(m, 0.001, 0.05) * 0.07
                e = min(n, j + m) - j
                out[j:j + e] += sn[:e, None]
            for hh in (0.5,):
                jh = int((tk + hh * beat) * SR)
                m = int(0.05 * SR)
                if jh + m < n:
                    out[jh:jh + m] += (bandnoise(m, 6000, 14000) * env(m, 0.0005, 0.015) * 0.04)[:, None]
        t += bar
        b += 1
    fade = int(1.5 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    out[:int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))[:, None]
    return norm(out, 0.7)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("what", choices=["sfx", "music"])
    ap.add_argument("--bpm", type=float)
    ap.add_argument("--key")
    ap.add_argument("--seconds", type=float)
    ap.add_argument("--style", default="lofi", choices=["lofi", "pulse"])
    a = ap.parse_args()
    P = project_paths(a.project)
    rec = json.loads((P.proj / "recipe.json").read_text(encoding="utf-8")) if (P.proj / "recipe.json").exists() else {}
    if a.what == "sfx":
        d = P.pub / "sfx"
        d.mkdir(parents=True, exist_ok=True)
        for name, x in sfx_kit().items():
            sf.write(d / f"{name}.wav", stereo(x), SR)
        print(f"[video-remake] sfx kit -> {d}")
    else:
        bpm = a.bpm or (rec.get("music") or {}).get("bpm") or 100
        key = a.key or ((rec.get("music") or {}).get("key") or "C minor").split(" (")[0]
        secs = a.seconds or rec.get("length_s") or 45
        P.pub.mkdir(parents=True, exist_ok=True)
        sf.write(P.pub / "music.wav", music(secs, float(bpm), key, a.style), SR)
        print(f"[video-remake] music bed {secs:.1f} s at {bpm} BPM in {key} ({a.style}) -> {P.pub / 'music.wav'}")


if __name__ == "__main__":
    main()
