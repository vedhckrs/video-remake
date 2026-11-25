"""Music engine (from Ved's meta-ads-video skill, proven on his ads): earshot renders each instrument note and drum hit
(real felt piano and drums learned from public-domain recordings, synth plucks and basses);
this module sequences them and adds a code-made pad, sub, reverb and kick pump.
Use with earshot's venv python.
"""
import math
import os
import re

import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, lfilter

os.environ.setdefault("EARSHOT_THREADS", "4")
from earshot import api  # noqa: E402

ROOT = os.path.dirname(os.path.abspath(__file__))
NOTES = os.environ.get("REMAKE_NOTES_DIR") or os.path.join(ROOT, "music", "notes")  # set per project by sound_design.py
os.makedirs(NOTES, exist_ok=True)
SR = 48000
NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def rnd(n):
    x = math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def nm(m):
    return f"{NAMES[m % 12]}{m // 12 - 1}"


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


_cache = {}


def src(sound, pitch=None, seed=0):
    key = (sound, pitch, seed)
    if key not in _cache:
        fn = os.path.join(NOTES, f"{sound.replace('/', '_')}_{pitch or 'x'}_{seed}.wav".replace("#", "s"))
        if not os.path.exists(fn):
            kw = {"sound": sound, "seed": seed}
            if pitch:
                kw["pitch"] = pitch
            api.make("a note" if pitch else sound, fn, **kw)
        x, _ = sf.read(fn, dtype="float32", always_2d=True)
        if x.shape[1] == 1:
            x = np.repeat(x, 2, axis=1)
        _cache[key] = x
    return _cache[key]


# Played (recorded) pianos only from C3 up: earshot reads a pitch of 127 Hz or lower as a MIDI number.
RANGE = {"felt_piano": (48, 87)}


class Song:
    def __init__(self, dur):
        self.dur = dur
        self.N = int(SR * (dur + 3))
        self.bus = {k: np.zeros((self.N, 2), dtype=np.float32) for k in ("drums", "music", "send")}
        self.kicks = []

    def place(self, bus, x, t, db=0.0, pan=0.0, length=None, send=0.0, fade=0.06):
        if t < 0 or t >= self.dur:
            return
        x = x.copy()
        if length is not None:
            n = min(len(x), int(length * SR))
            x = x[:n]
            f = min(n, int(fade * SR))
            x[-f:] *= np.linspace(1, 0, f)[:, None]
        g = 10 ** (db / 20)
        a = (max(-1, min(1, pan)) + 1) * math.pi / 4
        x[:, 0] *= g * math.cos(a) * math.sqrt(2)
        x[:, 1] *= g * math.sin(a) * math.sqrt(2)
        s = int(t * SR)
        e = min(self.N, s + len(x))
        self.bus[bus][s:e] += x[: e - s]
        if send:
            self.bus["send"][s:e] += x[: e - s] * send

    def note(self, voice, m, t, db, length=None, pan=0.0, send=0.2, seed=0):
        lo, hi = RANGE.get(voice, (0, 127))
        while m < lo:
            m += 12
        while m > hi:
            m -= 12
        try:
            x = src(f"note/{voice}", nm(m), seed)
        except ValueError as e:
            r = re.search(r"plays MIDI (\d+) \.\. (\d+)", str(e))
            if not r or voice in RANGE:
                raise
            RANGE[voice] = (max(48, int(r.group(1))), int(r.group(2)))
            return self.note(voice, m, t, db, length, pan, send, seed)
        hum = (rnd(m * 7 + t * 13) - 0.5) * 0.006
        self.place("music", x, t + hum, db + (rnd(t * 31 + m) - 0.5) * 2, pan, length, send)

    def hit(self, sound, t, db, pan=0.0, seed=0, send=0.0, length=None, kick=False):
        hum = (rnd(t * 17) - 0.5) * 0.004
        self.place("drums", src(sound, None, seed), t + hum, db + (rnd(t * 29) - 0.5) * 2, pan, length, send)
        if kick:
            self.kicks.append(t)

    def pad(self, ms, t0, t1, db, attack=0.5, release=0.9, cutoff=1400.0):
        n = int((t1 - t0 + release) * SR)
        tt = np.arange(n) / SR
        out = np.zeros((n, 2))
        for ch, det in enumerate((-0.07, 0.06)):
            sig = np.zeros(n)
            for m in ms:
                for d in (det, -det * 0.5, 0.0):
                    f = hz(m + d)
                    ph = rnd(m + d * 10 + ch) * 2 * np.pi
                    for k in range(1, int(3500 / f) + 1):
                        sig += np.sin(2 * np.pi * f * k * tt + ph * k) / k
            a = math.exp(-2 * math.pi * cutoff / SR)
            out[:, ch] = lfilter([1 - a], [1, -a], lfilter([1 - a], [1, -a], sig))
        env = np.minimum(1, tt / attack) * np.where(tt > (t1 - t0), np.exp(-(tt - (t1 - t0)) / (release / 3)), 1)
        out *= env[:, None]
        out /= np.max(np.abs(out)) + 1e-9
        self.place("music", out.astype(np.float32), t0, db, 0, None, 0.25)

    def sub(self, m, t0, t1, db):
        n = int((t1 - t0 + 0.3) * SR)
        tt = np.arange(n) / SR
        env = np.minimum(1, tt / 0.02) * np.where(tt > (t1 - t0), np.exp(-(tt - (t1 - t0)) / 0.08), 1)
        x = (np.sin(2 * np.pi * hz(m) * tt) * env).astype(np.float32)
        self.place("music", np.stack([x, x], axis=1), t0, db)

    def render(self, out, pump=0.45):
        env = np.ones(self.N, dtype=np.float32)
        tt = np.arange(int(0.3 * SR)) / SR
        shape = 1 - pump * np.exp(-tt / 0.09)
        for kt in self.kicks:
            s = int(kt * SR)
            e = min(self.N, s + len(shape))
            env[s:e] = np.minimum(env[s:e], shape[: e - s])
        music = self.bus["music"] * env[:, None]
        rng = np.random.default_rng(7)
        it = np.arange(int(2.2 * SR)) / SR
        ir = rng.standard_normal((len(it), 2)) * np.exp(-it / 0.55)[:, None]
        a = math.exp(-2 * math.pi * 5000 / SR)
        ir = lfilter([1 - a], [1, -a], ir, axis=0)
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2, axis=0))
        wet = np.stack([fftconvolve(self.bus["send"][:, c], ir[:, c])[: self.N] for c in range(2)], axis=1) * 0.5
        mix = self.bus["drums"] + music + wet.astype(np.float32)
        mix = np.tanh(mix * 1.2) / 1.2
        mix = mix[: int(self.dur * SR)]
        f = int(0.5 * SR)
        mix[-f:] *= np.linspace(1, 0, f)[:, None]
        mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
        sf.write(out, mix, SR, subtype="PCM_24")
        print("wrote", out)
