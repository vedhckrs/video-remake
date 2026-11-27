"""Sound design for remakes with earshot (github.com/Leonxlnx/earshot): sounds made in code, checked by ear.

Run with EARSHOT's python (rmcommon.EARSHOT_PY):
  sound_design.py <project> palette [--roles pop,iris] [--fresh]   # rank candidate designs by ear -> sfx/<role>_<k>.wav
  sound_design.py <project> cues                                 # place sounds from project.json -> sfx_cues.json
  sound_design.py <project> music                                # score a bed with earshot instruments -> music.wav
  sound_design.py <project> mix                                  # VO + SFX + ducked music, mastered -> out/<id>.mp4
  sound_design.py <project> listen                               # earshot sheet/timeline/critique/describe -> out/listen_report.md
  sound_design.py <project> spot                                 # spotting sheet from the cues -> out/sound_spotting.md
  sound_design.py <project> all                                  # palette, cues, music, mix, listen

Ved's rule (meta-ads-video): no AI sound generation for effects and music - earshot renders every sound from
code (designs learned from public-domain recordings) and earshot's ears check them.
Inputs: project.json (from plan_timeline), script.json (scene `hits` with sfx roles), recipe.json, vo.mp3,
out/<id>_raw.mp4 (from `render.py video`). Palette: assets/sfx_palette_ui.json (roles -> candidate designs).

Per-project sound direction (26 Nov 2026, all optional - without it a project behaves exactly as before):
script.json  "sound": {
    "palette": "sfx_palette.json",   # project file, same shape as the shared palette: its roles are added to / override
                                     # the shared ones for THIS project. Role extras: "make" (earshot axes: dur, pitch,
                                     # bright, hard, ring, size, space, width, energy, motion, events), "pick" (force a
                                     # design after listening), "post" (hp / lp Hz, trim / fade_in / fade_out s),
                                     # "wide" (bool); palette-level "real_weight" (prefer designs earshot's realness
                                     # model hears as real recordings)
    "auto_transitions": false,       # no automatic whoosh / riser / sub / accent on scene changes - spot them by hand
    "hit_sub": false,                # no automatic sub under every "hit"
    "jitter_db": 0.6, "jitter_rate": 0.03,   # take-to-take variation (defaults 1.5 dB / 0.1 = the old behaviour)
    "mix": {"music_db": -17, "vo_db": 0, "duck_voice_db": 7, "duck_fx_db": 4, "duck_window_s": 0.08, "duck_smooth_s": 0.12,
            "music_width": 1.7, "music_eq": "<ffmpeg filters, music bus>", "fx_eq": "<ffmpeg filters, effects bus>",
            "vo_eq": "<ffmpeg filters, voice>", "fx_room": 0.0 (short room on the effects bus, 0..1), "fx_db": 0,
            "master_af": "<ffmpeg chain>", "lufs": -14, "tp_db": -1.0 (two-pass trim to an exact loudness + peak ceiling)}}
script.json  "music": {"style": "tech_film", ...}   # a restrained film score (music_tech_film) instead of the default bed
hits: {word|frame, sfx, db?, offset?, at?} as before, plus pan (-1..1, where it happens on screen), rate (pitch/speed),
take (1-based), note (what is on screen - goes to the spotting sheet), and run: {n, dur, ease: "out"|"in"|"lin", db_end,
rate_end} (one hit expanded to n takes over dur seconds: a drum counter ratcheting to its number).
`spot` writes out/sound_spotting.md from the cues (time | on-screen action | sound | level | why).
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import MASTER_AF, SKILL, project_paths  # noqa: E402

SR = 48000
os.environ.setdefault("EARSHOT_THREADS", "8")


def log(m):
    print(f"[sound] {m}", flush=True)


def rnd(n):
    x = math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def decode(path, ch=2):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).copy()
    return x.reshape(-1, ch)


def sound_opts(P):
    """script.json "sound" block (per-project sound direction); {} = the skill-wide defaults."""
    try:
        return json.loads((P.proj / "script.json").read_text(encoding="utf-8")).get("sound") or {}
    except Exception:
        return {}


def load_palette(P=None):
    pal = json.loads((SKILL / "assets" / "sfx_palette_ui.json").read_text(encoding="utf-8"))
    pp = sound_opts(P).get("palette") if P is not None else None
    if pp:                                            # project roles are added to / override the shared ones
        proj = json.loads((P.proj / pp).read_text(encoding="utf-8"))
        pal["roles"] = {**pal["roles"], **proj.get("roles", {})}
        pal["aliases"] = {**pal.get("aliases", {}), **proj.get("aliases", {})}
        pal["project_roles"] = list(proj.get("roles", {}))
        for k in ("real_weight",):
            if k in proj:
                pal[k] = proj[k]
    return pal


def post_process(path, post):
    """Bake a role's "post" into a rendered take: high / low pass (Hz), trim (s), fade_in / fade_out (s)."""
    from scipy.signal import butter, sosfiltfilt
    x, sr_ = sf.read(path, dtype="float32", always_2d=True)
    if post.get("hp"):
        x = sosfiltfilt(butter(2, post["hp"], "hp", fs=sr_, output="sos"), x, axis=0)
    if post.get("lp"):
        x = sosfiltfilt(butter(2, post["lp"], "lp", fs=sr_, output="sos"), x, axis=0)
    if post.get("trim"):
        x = x[: int(post["trim"] * sr_)]
    if post.get("fade_in"):
        f = min(len(x), int(post["fade_in"] * sr_))
        x[:f] *= np.linspace(0, 1, f)[:, None] ** 2
    if post.get("fade_out"):
        f = min(len(x), int(post["fade_out"] * sr_))
        x[-f:] *= np.linspace(1, 0, f)[:, None] ** 2
    sf.write(path, np.asarray(x, dtype=np.float32), sr_, subtype="PCM_24")


def onset_peak(x):
    m = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    env = np.convolve(m, np.ones(240) / 240, mode="same")
    mx = env.max() or 1
    return int(np.argmax(env > 0.05 * mx)), int(np.argmax(env))


# ------------------------------------------------------------------------------------------------ palette
def palette(P, roles=None, fresh=False):
    from earshot import api
    palj = load_palette(P)
    pal = palj["roles"]
    real_w = float(palj.get("real_weight", 0))
    if palj.get("project_roles") and not roles:      # a project palette: render ITS roles (the shared ones only on request)
        pal = {k: v for k, v in pal.items() if k in palj["project_roles"]}
    d = P.pub / "sfx"
    cand = d / "cand"
    cand.mkdir(parents=True, exist_ok=True)
    manp = d / "manifest.json"
    # --fresh alone starts the manifest again; --roles x --fresh re-renders only those roles and keeps the others
    man = json.loads(manp.read_text(encoding="utf-8")) if manp.exists() and (roles or not fresh) else {}
    for role, spec in pal.items():
        if roles and role not in roles:
            continue
        if role in man and not fresh:
            continue
        paths, ids = [], {}
        mk = spec.get("make") or {}                  # earshot axes for this role (dur, pitch, bright, hard, size, ...)
        for sid in ([spec["pick"]] if spec.get("pick") else spec["candidates"]):
            p = cand / f"{role}__{sid.replace('/', '__')}.wav"
            try:
                api.make(spec["want"], str(p), sound=sid, **mk)
                paths.append(str(p))
                ids[os.path.normcase(str(p))] = sid
            except Exception as ex:  # a design id can disappear between earshot versions
                log(f"{role}: {sid} failed ({str(ex)[:80]})")
        if not paths:
            continue
        r = api.rank(paths, spec["want"])
        rows = r.get("ranked") or r.get("results") or r
        idof = lambda q: ids.get(os.path.normcase(str(q)), Path(q).stem)  # noqa: E731
        real = {}
        if real_w:                                   # project option: prefer what earshot's realness model hears as real
            for q in paths:
                try:
                    real[idof(q)] = round(float(api.realness(q).get("p_real", 0.5)), 2)
                except Exception:
                    real[idof(q)] = 0.5
            rows = sorted([x for x in rows if isinstance(x, dict)],
                          key=lambda x: -(float(x.get("z", 0)) + real_w * (real.get(idof(x.get("path", "")), 0.5) - 0.5)))
        best = rows[0]
        bp = best.get("path") if isinstance(best, dict) else best[0]
        win = idof(bp)
        scores = [(idof(x.get("path", "")), round(float(x.get("z", 0)), 2)) for x in rows if isinstance(x, dict)]
        takes = []
        for k in range(1, int(spec.get("takes", 1)) + 1):
            out = d / f"{role}_{k}.wav"
            api.make(spec["want"], str(out), sound=win, seed=k - 1, **mk)
            if spec.get("post"):
                post_process(out, spec["post"])
            x, sr_ = sf.read(out, dtype="float32", always_2d=True)
            on, pk = onset_peak(x)
            takes.append({"file": out.name, "onset_s": round(on / sr_, 4), "peak_s": round(pk / sr_, 4),
                          "dur_s": round(len(x) / sr_, 3)})
        man[role] = {"design": win, "want": spec["want"], "level_db": spec.get("level_db", -10), "takes": takes, "ranking": scores}
        if real:
            man[role]["p_real"] = real
        log(f"{role:10s} -> {win:24s} | " + "  ".join(f"{a} {b:+.2f}" + (f" real {real[a]:.2f}" if a in real else "") for a, b in scores))
        manp.write_text(json.dumps(man, indent=2), encoding="utf-8")
    return man


# ------------------------------------------------------------------------------------------------ cues
def cues(P):
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    script = json.loads((P.proj / "script.json").read_text(encoding="utf-8"))
    man = json.loads((P.pub / "sfx" / "manifest.json").read_text(encoding="utf-8"))
    palj = load_palette(P)
    aliases = palj.get("aliases", {})
    so = sound_opts(P)
    auto_tr, hit_sub = so.get("auto_transitions", True), so.get("hit_sub", True)
    jdb, jrate = float(so.get("jitter_db", 1.5)), float(so.get("jitter_rate", 0.1))
    wide_roles = {"pop", "tap", "click", "tick", "success", "glint", "zip", "accent"} | \
        {r_ for r_, sp_ in palj["roles"].items() if sp_.get("wide")}
    for r_, spec_ in palj["roles"].items():          # levels come from the live palette (tuned after listening)
        if r_ in man:
            man[r_]["level_db"] = spec_.get("level_db", man[r_]["level_db"])
    fps, base = pj["canvas"]["fps"], pj.get("baseFps", pj["canvas"]["fps"])
    used = {}
    out = []

    def add(t, role, db=0.0, at="onset", why="", pan=None, rate=None, take=None, note=None):
        role = aliases.get(role, role)
        if role not in man:
            log(f"no palette sound for role '{role}' ({why}) - skipped")
            return
        n = used.get(role, 0)
        used[role] = n + 1
        tk = man[role]["takes"][((take - 1) if take else n) % len(man[role]["takes"])]
        # stereo: small UI sounds alternate sides widely (earshot critique: "nearly mono, pan SFX with the motion");
        # big transition sounds stay near the centre
        wide = role in wide_roles
        side = 1 if n % 2 == 0 else -1
        if pan is None:                               # no screen position given: the old alternating / centred spread
            pan = side * (0.35 + rnd(n * 7.7 + 1) * 0.3) if wide else (rnd(n * 7.7 + 1) - 0.5) * 0.3
        out.append({"t": round(t, 4), "role": role, "file": tk["file"], "at": at, "why": why,
                    "db": round(man[role]["level_db"] + db + (rnd(n * 3.1 + len(out)) - 0.5) * jdb, 2),
                    "pan": round(pan, 3), "rate": round((rate or 1) * (1 + (rnd(n * 5.3 + 2) - 0.5) * jrate), 3)})
        if note:
            out[-1]["note"] = note

    sc = pj["scenes"]
    for i, s in enumerate(sc):
        t0 = s["from"] / fps
        tr = s["transitionIn"]
        if i and tr["type"] != "cut" and auto_tr:
            if tr["type"] == "iris":
                add(t0, "iris", 0, "peak", f"iris into {s['id']}")
                add(t0 - 0.04, "riser", 0, "end", f"riser into {s['id']}")
                add(t0, "sub", 0, "onset", f"sub under iris {s['id']}")
            elif tr["type"] in ("zoom", "push", "slide"):
                add(t0, "whoosh_in", 0, "peak", f"{tr['type']} into {s['id']}")
            elif tr["type"] == "portal":   # zoom-through into a new world: big whoosh + weight on arrival
                add(t0, "whoosh_in", 1, "peak", f"portal into {s['id']}")
                add(t0 + 0.12, "sub", -1, "onset", f"portal landing {s['id']}")
            else:
                # a swish alone gets masked by the voice (earshot: "visual events with no sound"); add an onset
                add(t0, "swish", 0, "peak", f"dissolve into {s['id']}")
                add(t0, "accent", 0, "onset", f"cut accent {s['id']}")
        sscript = next((x for x in script["scenes"] if x["id"] == s["id"]), {})
        for h in sscript.get("hits") or []:
            if "frame" in h:
                rel = float(h["frame"])
            else:
                key = "w:" + re.sub(r"[^\w%$+#.-]", "", h["word"].lower()).strip(".")
                if key not in (s.get("cues") or {}):
                    log(f"{s['id']}: word '{h['word']}' not found for {h['sfx']}")
                    continue
                rel = s["cues"][key] + h.get("offset", 0)
            why = f"{s['id']} {h.get('word', h.get('frame'))}"
            run = h.get("run")
            if run:   # one hit -> n takes over dur seconds (a drum counter ratcheting to its number); ease "out" = slowing down
                nn, rd = int(run.get("n", 8)), float(run.get("dur", 1.0))
                ez = {"out": lambda q: 1 - (1 - q) ** 2, "in": lambda q: q * q}.get(run.get("ease", "out"), lambda q: q)
                for k in range(nn):
                    q = k / max(1, nn - 1)
                    add(t0 + rel / base + ez(q) * rd, h["sfx"], h.get("db", 0) + q * float(run.get("db_end", 0)), "onset",
                        why + f" (run {k + 1}/{nn})", h.get("pan"), (h.get("rate") or 1) * (1 + q * float(run.get("rate_end", 0))),
                        None, h.get("note") if k == 0 else None)
                continue
            add(t0 + rel / base, h["sfx"], h.get("db", 0), h.get("at", "onset"), why, h.get("pan"), h.get("rate"), h.get("take"),
                h.get("note"))
            if hit_sub and aliases.get(h["sfx"], h["sfx"]) == "hit":   # weight under every hit (earshot: "thin bottom")
                add(t0 + rel / base, "sub", -2, "onset", f"sub under hit {s['id']}")
    pr = pj.get("presenter")
    if pr:   # explainer: the presenter's entrance pops in
        add(pr.get("enter", 0) / base, "pop", -2, "onset", "presenter enters")
    out.sort(key=lambda c: c["t"])
    (P.proj / "sfx_cues.json").write_text(json.dumps({"fps": fps, "cues": out}, indent=2), encoding="utf-8")
    # earshot cue file (frames) for timeline/sheet sync checks: picture events = transitions + hits
    ev = [{"f": int(round(c["t"] * fps)), "kind": c["role"], "id": c["why"]} for c in out
          if c["role"] != "riser" and ("(run " not in c["why"] or "(run 1/" in c["why"])]
    (P.proj / "earshot_cues.json").write_text(json.dumps({"fps": fps, "events": ev}, indent=1), encoding="utf-8")
    log(f"cues: {len(out)} sounds ({', '.join(f'{k} x{v}' for k, v in sorted(used.items()))})")
    return out


# ------------------------------------------------------------------------------------------------ music
def music_tech_film(P):
    """A restrained tech-film score (script.json "music": {"style": "tech_film"}): felt piano motif, muted-pluck pulse,
    dark pad, sub; no claps / hats / major-key pop loop. Built in BLOCKS that follow the script's scene `section`s -
    hook (tension + one motif), promise (lift), basics/mechanism (steady thinking groove), turn (breakdown),
    history (forward motion, a layer every two bars; later history scenes = lift), handoff (resolve, open end).
    Every block starts its downbeat on its scene change: the block keeps a whole (even) number of beats and its own
    tempo within a few % of "bpm", so the score is locked to the picture without a click-track jump.
    Options: "bpm" (93), "key" (root name, mode is always Dorian: minor colour with a raised 6th - curious, not sad),
    "pump" (kick sidechain depth, 0.2)."""
    os.environ["REMAKE_NOTES_DIR"] = str(P.pub / "music_notes")
    import musiclib as ml
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    script = json.loads((P.proj / "script.json").read_text(encoding="utf-8"))
    mo = script.get("music") or {}
    fps = pj["canvas"]["fps"]
    dur = pj["durationInFrames"] / fps
    bpm = float(mo.get("bpm") or 93)
    name = (mo.get("key") or "E").split()[0]
    flat = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
    pc = ml.NAMES.index(flat.get(name, name)) if flat.get(name, name) in ml.NAMES else 4
    R3 = 48 + pc                       # root in octave 3 (E3 = 52): chord tones and piano sit on it
    R1 = 24 + pc if pc >= 4 else 36 + pc   # sub root (E1 = 28 = 41 Hz), kept inside 30-60 Hz
    # chords: (bass semitone, tones above the root in octave 3)
    CH = {"i": (0, [7, 10, 14, 15]), "IV": (5, [9, 12, 14, 19]), "VI": (8, [12, 15, 19, 22]), "VII": (10, [14, 17, 21, 24]),
          "III": (3, [10, 14, 15, 19]), "v": (7, [10, 14, 17, 19]), "isus": (0, [7, 12, 14, 17])}
    MOTIF = [19, 24, 26, 29]           # 5th, octave, 9th, 11th above the root: four rising steps, left open (a question)
    role_of = {"hook": "hook", "promise": "lift", "basics": "groove", "mechanism": "groove", "turn": "break", "caveat": "break",
               "history": "build", "handoff": "resolve", "cta": "resolve"}
    sec = {x["id"]: x.get("section") for x in script["scenes"]}
    blocks = []                         # [role, t0, t1, [scene starts inside]]
    seen_build = False
    for sc_ in pj["scenes"]:
        role = role_of.get(sec.get(sc_["id"]), "groove")
        if role == "build" and seen_build:
            role = "lift2"
        seen_build = seen_build or role == "build"
        t0, t1 = sc_["from"] / fps, sc_["to"] / fps
        if blocks and blocks[-1][0] == role and role == "groove":
            blocks[-1][2] = t1
            blocks[-1][3].append(t0)
        else:
            blocks.append([role, t0, t1, [t0]])
    blocks[-1][2] = dur
    S = ml.Song(dur)
    lv = float(mo.get("level", 0))
    # the band: instruments earshot learned from recordings (its realness model hears the synth plucks and basses as
    # code-made: muted_pluck / glass_pluck / pluck_bass p_real 0.02-0.05, muted_guitar 0.85, marimba 0.94, pizzicato 1.0)
    vo = {"pulse": "muted_guitar", "mallet": "marimba", "pizz": "pizzicato", "bass": "upright_bass", **(mo.get("voices") or {})}
    PULSE, MALLET, PIZZ, BASS = vo["pulse"], vo["mallet"], vo["pizz"], vo["bass"]
    # balance of the layers (dB offsets, tuned by listening with earshot describe: the first pass was all sub and pad -
    # "brightness 223 Hz, heavy bass, sad"; with the synth pad and kick forward earshot realness read 0.61, with them
    # tucked under the recorded instruments 0.8); override any of them in script.json "music": {"balance": {...}}
    bal = {"sub": -13.0, "pad": -10.0, "pad_bright": 2.0, "felt_piano": 3.0, "muted_guitar": 6.5, "marimba": 4.5, "pizzicato": 4.5,
           "upright_bass": 3.5, "kick/soft": -5.0, "shaker/tick": 4.0, **(mo.get("balance") or {})}
    _pad, _sub, _note, _hit = S.pad, S.sub, S.note, S.hit
    S.pad = lambda ms, a0, a1, db, attack=0.5, release=0.9, cutoff=1400.0: _pad(ms, a0, a1, db + bal["pad"], attack, release, cutoff * bal["pad_bright"])
    S.sub = lambda m, a0, a1, db: _sub(m, a0, a1, db + bal["sub"])
    note = lambda voice, m, t, db, **kw: _note(voice, m, t, db + bal.get(voice, 0.0), **kw)   # noqa: E731
    hit = lambda sound, t, db, **kw: _hit(sound, t, db + bal.get(sound, 0.0), **kw)          # noqa: E731

    def bass(t, b, semis, beats, db, hold=0.96):
        m = R1 + semis
        while m > R1 + 8:               # keep the sub between ~40 and 65 Hz
            m -= 12
        while m < 27:
            m += 12
        S.sub(m, t, t + beats * b * hold, db)

    def ost(t, b, tones, div, db, n=None, accent=2.0, pan=0.45, voice=PULSE, octave=12, skip=None):
        order = [0, 2, 1, 2, 3, 2, 1, 2]
        steps = n if n is not None else int(4 * div)
        for k in range(steps):
            tt = t + k * b / div
            if skip and skip[0] <= tt < skip[1]:
                continue
            note(voice, R3 + octave + tones[order[k % 8] % len(tones)] - 12, tt,
                   db + (accent if k % int(div * 2) == 0 else 0) + lv, length=b / div * 0.9,
                   pan=(pan if k % 2 else -pan), send=0.18)

    lead = mo.get("lead", "felt_piano")                  # the motif's voice ("electric_piano", "warm_keys" ... any earshot note/<voice>)

    def piano(m, t, db, length, pan=-0.08, send=0.3):
        note(lead, m, t, db + lv + (bal.get("felt_piano", 0) - bal.get(lead, 0) if lead != "felt_piano" else 0), length=length, pan=pan, send=send)

    log_lines = []
    for role, t0, t1, starts in blocks:
        L = t1 - t0
        N = max(4, int(round(L / (60 / bpm) / 2)) * 2)
        b = L / N                       # this block's beat
        nb = int(math.ceil(N / 4))      # bars (the last may be a half bar)
        log_lines.append(f"{role} {t0:.2f}-{t1:.2f} s: {N} beats at {60 / b:.1f} BPM")
        T = lambda k: t0 + k * b        # noqa: E731  beat k (0-based) of this block
        if role == "hook":
            _, tones = CH["i"]
            S.pad([R3 - 12 + x for x in tones[:3]], t0, T(12), -23 + lv, attack=1.2, release=1.2, cutoff=650)
            S.pad([R3 - 12 + x for x in CH["VI"][1][:3]], T(12), t1, -22 + lv, attack=0.8, release=1.0, cutoff=900)
            bass(t0, b, 0, 12, -17)
            bass(T(12), b, 8, N - 12, -17)
            piano(R3, t0 + 0.02, -15, b * 6)                 # first sound at 0:00: one low felt-piano root and fifth
            piano(R3 + 7, t0 + 0.05, -19, b * 6)
            hitch = (t0 + 3.3, t0 + 3.98)                    # the pulse drops one beat where the frame arrives LATE
            for k in range(2, N * 2):
                tt = t0 + k * b / 2
                if hitch[0] <= tt < hitch[1]:
                    continue
                note(PULSE, R3 + 12, tt, -30 + min(5, k * 0.2) + (1.5 if k % 2 == 0 else 0) + lv, length=b * 0.4,
                       pan=(0.35 if k % 2 else -0.35), send=0.15)
            for k, m, d in ((2, MOTIF[0], -17), (4, MOTIF[1], -16), (7, MOTIF[2], -16), (9.5, MOTIF[3], -15)):
                piano(R3 + m, T(k), d, b * 2.6, send=0.4)
            piano(R3 + 12, T(12), -17, b * 3.5)              # release: the bass steps down, two soft notes lead on
            piano(R3 + 19, T(13), -19, b * 3)
            piano(R3 + 22, T(14.5), -19, b * 2.5)
        elif role == "lift":
            prog = ["i", "IV", "VI", "VII", "i", "VI", "VII"]
            tail = N - 4                                     # the last bar (the dive) thins out to pad + rising piano
            for bar in range(nb):
                tb, beats = T(bar * 4), min(4, N - bar * 4)
                bs, tones = CH[prog[bar % len(prog)]]
                S.pad([R3 - 12 + x for x in tones[:3]], tb, tb + beats * b, -24 + lv, attack=0.35, release=0.8, cutoff=1100)
                bass(tb, b, bs, beats, -17, hold=0.7)
                if bar * 4 >= tail:
                    for j in range(int(beats)):
                        piano(R3 + 12 + tones[j % 4] - (12 if tones[j % 4] > 19 else 0), tb + j * b, -19 + j * 1.2, b * 1.6, send=0.4)
                    continue
                hit("kick/soft", tb, -14 + lv, kick=True)
                if beats > 2:
                    hit("kick/soft", tb + 2 * b, -18 + lv, kick=True)
                note(BASS, R3 - 12 + bs - (12 if bs > 5 else 0), tb, -17 + lv, length=b * 1.3, send=0.0)
                ost(tb, b, tones, 2, -27, n=int(beats * 2))
                if bar == 2:
                    piano(R3 + MOTIF[0], tb + 2 * b, -19, b * 2, send=0.4)
                if bar == 3:
                    piano(R3 + MOTIF[1], tb, -18, b * 2, send=0.4)
        elif role == "groove":
            prog = ["i", "i", "i", "IV", "i", "i", "VI", "IV"]
            cuts = starts[1:] + [t1]                         # phase A (first scene) .. C (last scene)
            for bar in range(nb):
                tb, beats = T(bar * 4), min(4, N - bar * 4)
                ph = sum(1 for c in cuts[:-1] if tb >= c - b)  # 0, 1, 2 ...
                last = bar == nb - 1
                bs, tones = CH[prog[bar % len(prog)]]
                S.pad([R3 - 12 + x for x in tones[:3]], tb, tb + beats * b, -25 + lv, attack=0.4, release=0.8, cutoff=850 + 250 * min(ph, 2))
                bass(tb, b, bs, beats, -18, hold=0.62)   # the sub breathes with the bar instead of droning
                if last:                                     # the machine winds down into the turn
                    for j in range(int(beats)):
                        note(PULSE, R3 + 12 + tones[0] - 12, tb + j * b, -27 - 2.5 * j + lv, length=b * 0.6, pan=(-0.4 if j % 2 else 0.4), send=0.25)
                    piano(R3 + tones[1], tb, -19, b * 3.5, send=0.4)
                    continue
                note(BASS, R3 - 12 + bs - (12 if bs > 5 else 0), tb, -18 + lv, length=b * 1.2, send=0.0)
                note(BASS, R3 - 12 + bs - (12 if bs > 5 else 0), tb + 1.5 * b, -22 + lv, length=b * 0.7, send=0.0)
                hit("kick/soft", tb, -15 + lv, kick=True)
                if ph >= 1:
                    hit("kick/soft", tb + 2 * b, -17 + lv, kick=True)
                    note(BASS, R3 - 12 + bs - (12 if bs > 5 else 0) + 7, tb + 3 * b, -23 + lv, length=b * 0.6, send=0.0)
                    for j in range(4):
                        hit("shaker/tick", tb + (j + 0.5) * b, -31 + (1.5 if j % 2 else 0) + lv, pan=0.3)
                ost(tb, b, tones, 2 if ph == 0 else 4, -29 if ph else -28, accent=2.5)
                if ph >= 2:
                    for j, x in ((1.5, tones[3]), (3.5, tones[2])):
                        note(MALLET, R3 + 12 + x - (12 if x > 19 else 0), tb + j * b, -27 + lv, length=b * 0.8, pan=(0.55 if j < 2 else -0.55), send=0.35)
                if bar % 4 == 3:                             # a rare two-note piano answer (piano chords = corporate bed)
                    piano(R3 + tones[2], tb + 2 * b, -20, b * 1.8)
                    piano(R3 + tones[3] - (12 if tones[3] > 19 else 0), tb + 3.5 * b, -21, b * 1.6)
        elif role == "break":
            prog = ["IV", "VII", "isus", "isus"]
            for bar in range(nb):
                tb, beats = T(bar * 4), min(4, N - bar * 4)
                bs, tones = CH[prog[bar % len(prog)]]
                S.pad([R3 - 12 + x for x in tones[:3]], tb, tb + beats * b, -22 - (2 if bar == nb - 1 else 0) + lv, attack=0.6, release=1.2, cutoff=750)
                bass(tb, b, bs, beats if bar < nb - 1 else beats - 1, -16)
            for k, m, d in ((0, MOTIF[0], -16), (2, MOTIF[1], -16), (4, MOTIF[2], -16), (6, MOTIF[3], -16)):
                piano(R3 + m - 12, T(k), d, b * 3, send=0.45)   # the motif, an octave down and at half speed
            piano(R3, T(8), -16, b * 4, send=0.4)
            piano(R3 + 7, T(8) + 0.03, -19, b * 4, send=0.4)
            piano(R3 + 14, T(N - 2.5), -19, b * 2.2, send=0.5)  # one open note = the question mark; then a breath
        elif role in ("build", "lift2"):
            prog = (["i", "i", "IV", "IV", "III", "III", "IV", "IV", "VI", "VII"] if role == "build" else ["i", "IV", "i", "IV", "VII", "VII"])
            for bar in range(nb):
                tb, beats = T(bar * 4), min(4, N - bar * 4)
                stage = bar // 2 if role == "build" else 5   # build: a new layer every two bars; lift2: everything from bar one
                half = beats < 4                             # a closing half bar: drums out, pad holds
                bs, tones = CH[prog[bar % len(prog)]]
                up = 0.3 * bar if role == "build" else 2.0
                S.pad([R3 - 12 + x for x in tones[:3]], tb, tb + beats * b,
                      -25 + min(3, up) + lv, attack=0.35, release=0.8, cutoff=900 + 150 * min(stage, 5))
                bass(tb, b, bs, beats, -17.5, hold=0.62)
                note(BASS, R3 - 12 + bs - (12 if bs > 5 else 0), tb, -18 + lv, length=b * 1.2, send=0.0)
                if half:
                    piano(R3 + tones[2], tb, -18, b * 2, send=0.4)
                    continue
                note(BASS, R3 - 12 + bs - (12 if bs > 5 else 0), tb + 1.5 * b, -22 + lv, length=b * 0.7, send=0.0)
                ost(tb, b, tones, 4 if stage >= 4 else 2, (-29 if stage >= 4 else -28) + min(2, up * 0.5), accent=2.5)
                if stage >= 1:
                    hit("kick/soft", tb, -15 + lv, kick=True)
                    hit("kick/soft", tb + 2 * b, -17 + lv, kick=True)
                if stage >= 2:
                    ost(tb + b / 4, b, tones, 2, -31, n=8, accent=0, pan=0.6, voice=PIZZ, octave=0)   # a low off-beat answer
                    for j in range(4):
                        hit("shaker/tick", tb + (j + 0.5) * b, -31 + (1.5 if j % 2 else 0) + lv, pan=0.3)
                    note(BASS, R3 - 12 + bs - (12 if bs > 5 else 0) + 7, tb + 3 * b, -23 + lv, length=b * 0.6, send=0.0)
                if stage >= 3:
                    for j, x in ((0.5, tones[2]), (1.5, tones[3]), (2.5, tones[1]), (3.5, tones[2])):
                        note(MALLET, R3 + 12 + x - (12 if x > 19 else 0), tb + j * b, -27 + lv, length=b * 0.8,
                               pan=(0.55 if int(j) % 2 else -0.55), send=0.35)
                if role == "lift2" and bar in (0, 1):        # the motif returns over the full band
                    m1, m2 = (MOTIF[0], MOTIF[1]) if bar == 0 else (MOTIF[2], MOTIF[3])
                    for mm, tt in ((m1, tb), (m2, tb + 2 * b)):    # on the glass pluck, in octaves - no piano over the full band
                        note(MALLET, R3 + mm, tt, -21 + lv, length=b * 1.8, pan=-0.2, send=0.4)
                        note(MALLET, R3 + mm - 12, tt, -23 + lv, length=b * 1.8, pan=0.2, send=0.4)
                if role == "build" and bar == nb - 1:        # the last bar climbs into the lift
                    for j in range(4):
                        piano(R3 + 12 + [2, 3, 7, 10][j], tb + (2 + j * 0.5) * b, -20 + j, b * 0.9, send=0.4)
        else:  # resolve: the hook's pulse and the whole motif come back, then one open note - Act 2 follows, no ending
            prog = ["i", "IV", "i", "VII"]
            for bar in range(nb):
                tb, beats = T(bar * 4), min(4, N - bar * 4)
                bs, tones = CH[prog[bar % len(prog)]]
                S.pad([R3 - 12 + x for x in tones[:3]], tb, tb + beats * b, -22 + lv, attack=0.5, release=1.0, cutoff=1200)
                bass(tb, b, bs, beats, -17)
            for k in range(0, (N - 2) * 2):
                note(PULSE, R3 + 12, t0 + k * b / 2, -27 - (k * 0.12) + (1.5 if k % 2 == 0 else 0) + lv, length=b * 0.4,
                       pan=(0.35 if k % 2 else -0.35), send=0.15)
            for k, m, d in ((0, MOTIF[0], -15), (2, MOTIF[1], -15), (4, MOTIF[2], -15), (6, MOTIF[3], -15)):
                piano(R3 + m, T(k), d, b * 2.6, send=0.45)
            piano(R3 + 26, T(N - 2), -17, b * 2, send=0.5)   # last word: the 9th, unresolved
    out = P.pub / "music.wav"
    S.render(str(out), pump=float(mo.get("pump", 0.2)))
    for ln in log_lines:
        log("music: " + ln)
    log(f"music: tech_film score, {dur:.1f} s around {bpm:g} BPM in {ml.NAMES[pc]} Dorian, {len(blocks)} blocks locked to the scene changes")
    return out


def music(P):
    try:
        if (json.loads((P.proj / "script.json").read_text(encoding="utf-8")).get("music") or {}).get("style") == "tech_film":
            return music_tech_film(P)
    except FileNotFoundError:
        pass
    os.environ["REMAKE_NOTES_DIR"] = str(P.pub / "music_notes")
    import musiclib as ml
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    rec = json.loads((P.proj / "recipe.json").read_text(encoding="utf-8"))
    fps = pj["canvas"]["fps"]
    dur = pj["durationInFrames"] / fps
    bpm = float((rec.get("music") or {}).get("bpm") or 100)
    script = json.loads((P.proj / "script.json").read_text(encoding="utf-8"))
    # script.json "music": {"key": "Eb major"} overrides the reference's key - a minor key read as
    # "sad and melancholic" to earshot on an upbeat product film
    keytxt = ((script.get("music") or {}).get("key") or (rec.get("music") or {}).get("key") or "C minor").split(" (")[0]
    name, *mode = keytxt.split()
    minor = not mode or mode[0].lower().startswith("min")
    flat = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}
    root = ml.NAMES.index(flat.get(name, name)) if flat.get(name, name) in ml.NAMES else 0
    beat, bar = 60 / bpm, 240 / bpm
    sc = pj["scenes"]
    flips = [s["from"] / fps for i, s in enumerate(sc) if i and s["bg"] != sc[i - 1]["bg"]]
    first = flips[0] if flips else 0.0
    g0 = first - math.floor(first / bar) * bar - bar          # bar grid with a downbeat on the first act change
    darks = [(s["from"] / fps, s["to"] / fps) for i, s in enumerate(sc) if s["bg"] == "dark" and i and sc[i - 1]["bg"] != "dark"]
    breakdown = darks[0] if darks and darks[0][0] > first else None   # first dark act after the light middle
    if pj.get("style") == "explainer":
        # explainer: one long dark act - the hook is the first scene, the breakdown sits under the caveat section
        first = sc[1]["from"] / fps if len(sc) > 1 else 0.0
        g0 = first - math.floor(first / bar) * bar - bar
        cav = [x["id"] for x in script["scenes"] if x.get("section") == "caveat"]
        cs = [s for s in sc if s["id"] in cav]
        breakdown = (cs[0]["from"] / fps, cs[0]["to"] / fps) if cs else None
    cta = (sc[-1]["from"] / fps, dur)

    prog = ([(0, 3, 7), (8, 12, 15), (3, 7, 10), (10, 14, 17)] if minor else [(0, 4, 7), (7, 11, 14), (9, 12, 16), (5, 9, 12)])
    S = ml.Song(dur)
    nbar = int((dur - g0) / bar) + 2
    for b in range(nbar):
        t = g0 + b * bar
        if t > dur - 0.4:
            break
        ch = prog[b % 4]
        rootm = 60 + root
        sect = ("hook" if t < first - 0.01 else "break" if breakdown and breakdown[0] - 0.01 <= t < breakdown[1] - 0.01
                else "cta" if t >= cta[0] - bar * 0.5 else "main")
        S.pad([rootm - 12 + x for x in ch], max(0, t), min(dur, t + bar), -26 if sect == "hook" else -24)
        if sect in ("hook", "break", "cta"):
            S.note("felt_piano", rootm + ch[0], t, -13, length=bar * 0.95)
            S.note("felt_piano", rootm + ch[1], t + 0.02, -15, length=bar * 0.9)
            S.note("felt_piano", rootm + ch[2], t + 0.04, -15, length=bar * 0.9)
        if sect == "hook":
            for k in range(8):
                if k % 2 == 0 or b % 2:
                    S.note("glass_pluck", rootm + 12 + ch[k % 3], t + k * beat / 2, -24, length=beat * 0.45, pan=(-0.3 if k % 2 else 0.3))
            if t + bar >= first - 0.01:   # last hook bar: hats build into the act change
                for k in range(8):
                    S.hit("hat/closed", t + k * beat / 2, -26 + k, pan=0.2)
        if sect in ("main", "cta"):
            half = sect == "cta"
            for k in range(4):
                tb = t + k * beat
                if k in ((0,) if half else (0, 2)):
                    S.hit("kick/soft", tb, -9, kick=True)
                if k in (1, 3) and not half:
                    S.hit("clap/electro", tb, -17, pan=0.05, send=0.1)
                for e in (0, 0.5):
                    S.hit("hat/closed", tb + e * beat, -23 + (2 if e == 0 else 0), pan=0.22)
            S.note("pluck_bass", 36 + root + ch[0], t, -11, length=beat * 1.4, send=0.0)
            S.note("pluck_bass", 36 + root + ch[0], t + beat * 1.5, -14, length=beat * 0.8, send=0.0)
            S.note("felt_piano", rootm + ch[1], t, -17, length=beat * 1.8)
            S.note("felt_piano", rootm + ch[2], t + beat * 2.5, -19, length=beat * 1.2)
            for k in range(8):
                S.note("muted_pluck", rootm + 12 + ch[(k * 2) % 3], t + k * beat / 2, -25, length=beat * 0.4, pan=(-0.25 if k % 2 else 0.25))
        if sect == "break":
            S.sub(36 + root + ch[0], t, t + bar, -18)
    # final chord rings out under the last words
    end = dur - 1.6
    for j, x in enumerate(prog[0]):
        S.note("felt_piano", 60 + root + x, end + j * 0.03, -12, length=1.5)
    out = P.pub / "music.wav"
    S.render(str(out))
    log(f"music: {dur:.1f} s at {bpm:g} BPM in {keytxt}; downbeat on the first act change at {first:.2f} s; "
        f"breakdown {breakdown[0]:.1f}-{breakdown[1]:.1f} s" if breakdown else f"music: {dur:.1f} s at {bpm:g} BPM")
    return out


# ------------------------------------------------------------------------------------------------ mix
def ff_filter(x, af):
    """Run a stereo float array through an ffmpeg audio filter chain (bus EQ)."""
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-af", af,
                        "-f", "f32le", "-ar", str(SR), "-ac", "2", "-"], input=np.ascontiguousarray(x, dtype=np.float32).tobytes(),
                       capture_output=True, check=True)
    y = np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2).copy()
    out = np.zeros_like(x)
    out[: min(len(x), len(y))] = y[: len(x)]
    return out


def loudness(path, af=None):
    """(integrated LUFS, true peak dBTP) of a file, optionally through a filter chain first (ffmpeg ebur128)."""
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(path), "-map", "0:a:0", "-af",
                        (af + "," if af else "") + "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    i = re.search(r"I:\s*(-?[\d.]+) LUFS", tail)
    tp = re.search(r"Peak:\s*(-?[\d.]+) dBFS", tail)
    return (float(i.group(1)) if i else float("nan")), (float(tp.group(1)) if tp else float("nan"))


def mix(P, music_db=-13.0, vo_db=0.0, cli_music_db=False, raw=None, out=None):
    mo = sound_opts(P).get("mix") or {}                  # per-project mix direction; {} = the proven defaults below
    if "music_db" in mo and not cli_music_db:
        music_db = float(mo["music_db"])
    vo_db = float(mo.get("vo_db", vo_db))
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    C = json.loads((P.proj / "sfx_cues.json").read_text(encoding="utf-8"))["cues"]
    raw = Path(raw) if raw else P.out / f"{P.id}_raw.mp4"   # --raw: mux onto another picture with the same timings
    out_override = Path(out) if out else None
    if not raw.exists():
        sys.exit(f"render first: {raw} missing (render.py <project> video)")
    dur = pj["durationInFrames"] / pj["canvas"]["fps"]
    n = int(SR * dur)
    vo = np.zeros((n, 2), np.float32)
    v = decode(P.pub / "vo.mp3")[:n]
    vo[: len(v)] = v * 10 ** (vo_db / 20)
    fx = np.zeros((n + SR * 3, 2), np.float32)
    cache = {}
    for c in C:
        if c["file"] not in cache:
            x, r = sf.read(P.pub / "sfx" / c["file"], dtype="float32", always_2d=True)
            if r != SR:
                x = decode(P.pub / "sfx" / c["file"])
            if x.shape[1] == 1:
                x = np.repeat(x, 2, axis=1)
            x = x / (np.abs(x).max() or 1) * 0.7
            on, pk = onset_peak(x)
            cache[c["file"]] = (x, on, pk)
        x, on, pk = cache[c["file"]]
        if c["rate"] != 1:
            idx = np.arange(0, len(x) - 1, c["rate"])
            x = np.stack([np.interp(idx, np.arange(len(x)), x[:, k]) for k in range(2)], axis=1).astype(np.float32)
            on, pk = int(on / c["rate"]), int(pk / c["rate"])
        ref = {"onset": on, "peak": pk, "end": len(x)}[c["at"]]
        s = int(c["t"] * SR) - ref
        if s < 0:
            x, s = x[-s:], 0
        g = 10 ** (c["db"] / 20)
        a = (max(-1, min(1, c["pan"])) + 1) * math.pi / 4
        e = min(len(fx), s + len(x))
        fx[s:e, 0] += x[: e - s, 0] * g * math.cos(a) * math.sqrt(2)
        fx[s:e, 1] += x[: e - s, 1] * g * math.sin(a) * math.sqrt(2)
    fx = fx[:n]
    if mo.get("fx_eq"):
        fx = ff_filter(fx, mo["fx_eq"])
    if mo.get("fx_room"):   # a short dark room on the effects bus: they sit IN the picture's space, not on top of the mix
        from scipy.signal import fftconvolve, lfilter
        rng = np.random.default_rng(11)
        it = np.arange(int(0.6 * SR)) / SR
        ir = rng.standard_normal((len(it), 2)) * np.exp(-it / float(mo.get("fx_room_decay", 0.16)))[:, None]
        a_ = math.exp(-2 * math.pi * 3800 / SR)
        ir = lfilter([1 - a_], [1, -a_], ir, axis=0)
        ir[: int(0.006 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2, axis=0))
        wet = np.stack([fftconvolve(fx[:, c], ir[:, c])[:n] for c in range(2)], axis=1).astype(np.float32)
        fx = fx + wet * float(mo["fx_room"])
    fx *= 10 ** (float(mo.get("fx_db", 0)) / 20)
    if mo.get("vo_eq"):
        vo = ff_filter(vo, mo["vo_eq"])
    mus = np.zeros((n, 2), np.float32)
    mp = P.pub / "music.wav"
    if mp.exists():
        m = decode(mp)[:n]
        mid, side = (m[:, 0] + m[:, 1]) / 2, (m[:, 0] - m[:, 1]) / 2
        side = side * float(mo.get("music_width", 1.7))    # widen the music bed (earshot: "nearly mono")
        m = np.stack([mid + side, mid - side], axis=1)
        mus[: len(m)] = m * 10 ** (music_db / 20)
        if mo.get("music_eq"):
            mus = ff_filter(mus, mo["music_eq"])

    def box(v, k):   # centred moving average = np.convolve(v, ones(k) / k, "same"), by running sum (seconds, not minutes)
        c = np.cumsum(np.concatenate([np.zeros(1), np.pad(np.asarray(v, dtype=np.float64), (k // 2, k - 1 - k // 2))]))
        return (c[k:] - c[:-k]) / k

    def env(x, win):
        return box(np.abs(x).max(axis=1), int(win * SR))
    # sidechain: music ducks up to 7 dB under the voice and 4 dB under effects, smoothed
    dv = np.clip(env(vo, float(mo.get("duck_window_s", 0.08))) / 0.06, 0, 1)
    df = np.clip(env(fx, 0.05) / 0.12, 0, 1)
    gain_db = -float(mo.get("duck_voice_db", 7)) * dv - float(mo.get("duck_fx_db", 4)) * df
    gain = 10 ** (box(gain_db, int(float(mo.get("duck_smooth_s", 0.12)) * SR)) / 20)
    st = vo + fx + mus * gain[:, None].astype(np.float32)
    st = st / max(float(np.abs(st).max()), 1.0)
    f = int(float(mo.get("fade_out_s", 0.35)) * SR)
    st[-f:] *= np.linspace(1, 0, f)[:, None]
    mw = P.out / f"{P.id}_mix.wav"
    sf.write(mw, st, SR, subtype="PCM_24")
    out = out_override or P.out / f"{P.id}.mp4"
    if mo.get("stems"):   # for listening checks: the three buses as they sit in the mix (pre-master)
        sd = P.out / "stems"
        sd.mkdir(exist_ok=True)
        sf.write(sd / "vo.wav", vo, SR, subtype="PCM_16")
        sf.write(sd / "fx.wav", fx, SR, subtype="PCM_16")
        sf.write(sd / "music.wav", mus * gain[:, None].astype(np.float32), SR, subtype="PCM_16")
    if "lufs" in mo or "master_af" in mo:
        # project master: a static chain (no loudnorm riding the level), then a two-pass trim to the exact integrated
        # loudness and a true-peak ceiling; the AAC is measured after encoding and the ceiling lowered if it overshoots
        chain = mo.get("master_af") or "highpass=f=30,lowshelf=f=110:g=-1.5,equalizer=f=2000:t=q:w=1.2:g=-2"
        target, tp = float(mo.get("lufs", -14)), float(mo.get("tp_db", -1.0))
        gain_db_, ceil = 0.0, tp - 0.5
        for _ in range(7):
            af = (f"{chain},volume={gain_db_:.2f}dB,aresample=192000,alimiter=limit={10 ** (ceil / 20):.4f}:attack=2:release=60:level=disabled,"
                  f"aresample=48000")
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(raw), "-i", str(mw), "-filter_complex", f"[1:a]{af}[a]",
                            "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-aac_pns", "0", "-ar", "48000",
                            "-movflags", "+faststart", "-shortest", str(out)], check=True)
            li, ltp = loudness(out)
            log(f"master pass: gain {gain_db_:+.2f} dB, ceiling {ceil:.2f} dBFS -> {li:.2f} LUFS, {ltp:.2f} dBTP")
            if abs(li - target) <= 0.25 and ltp <= tp:   # AAC overshoot moves by up to ~1.5 dB between passes: do not chase 0.1 LU
                break
            if abs(li - target) > 0.25:
                gain_db_ += target - li
            if ltp > tp:
                ceil -= (ltp - tp) + 0.15
        log(f"mix: {len(C)} sfx, music {music_db} dB -> {out} ({li:.1f} LUFS, true peak {ltp:.1f} dBTP after AAC)")
        return out
    # master: the chain proven on Ved's ads (sfxlib.finish): EQ, loudnorm -14, resample BEFORE the limiter, AAC without PNS
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(raw), "-i", str(mw), "-filter_complex",
                    f"[1:a]{MASTER_AF}[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-aac_pns", "0", "-ar", "48000",
                    "-movflags", "+faststart", "-shortest", str(out)], check=True)
    log(f"mix: {len(C)} sfx, music {music_db} dB ducked under voice/effects -> {out}")
    return out


# ------------------------------------------------------------------------------------------------ spotting sheet
def spot(P):
    """out/sound_spotting.md: per scene, time | on-screen action | sound (role / design) | level | why - from sfx_cues.json
    (hit `note` = what is on screen, palette role `why` = why this sound), plus the beats left silent on purpose
    (script.json "sound_silent_beats": [{t, note}])."""
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    script = json.loads((P.proj / "script.json").read_text(encoding="utf-8"))
    C = json.loads((P.proj / "sfx_cues.json").read_text(encoding="utf-8"))["cues"]
    man = json.loads((P.pub / "sfx" / "manifest.json").read_text(encoding="utf-8"))
    roles = load_palette(P)["roles"]
    fps = pj["canvas"]["fps"]
    dur = pj["durationInFrames"] / fps
    rows = []                                    # one row per placed sound; a run (counter ratchet) is one row
    for c in C:
        if "(run " in c["why"]:
            if "(run 1/" not in c["why"]:
                rows[-1]["n"] += 1
                rows[-1]["t1"] = c["t"]
                continue
        rows.append({**c, "n": 1, "t1": c["t"]})
    ev = []                                      # audible events: sounds within 0.12 s are one event (layers)
    for r in rows:
        if not ev or r["t"] - ev[-1] > 0.12:
            ev.append(r["t"])
    silent = script.get("sound_silent_beats") or []
    L = [f"# Sound spotting sheet - {pj.get('title', P.id)}", "",
         f"{len(rows)} placed sounds = {len(ev)} audible events in {dur:.1f} s (**{len(ev) / dur * 10:.1f} per 10 s**); "
         f"{len(silent)} picture beats deliberately left to the music and the voice.",
         "Level = dB below full scale on the effects bus before the master (the voice peaks around -6). "
         "Pan: L/R = where it happens in the frame.", ""]
    cnt = {}
    for r in rows:
        cnt[r["role"]] = cnt.get(r["role"], 0) + 1
    L += ["| role | design (earshot) | uses | what it is |", "|---|---|---|---|"]
    for k, v in sorted(cnt.items(), key=lambda kv: -kv[1]):
        L.append(f"| {k} | {man.get(k, {}).get('design', '?')} | {v} | {roles.get(k, {}).get('want', '')} |")
    L.append("")
    for s_ in pj["scenes"]:
        t0, t1 = s_["from"] / fps, s_["to"] / fps
        sc = next((x for x in script["scenes"] if x["id"] == s_["id"]), {})
        rs = [r for r in rows if t0 <= r["t"] < t1 or (s_ is pj["scenes"][-1] and r["t"] >= t1)]
        ne = len([e for e in ev if t0 <= e < t1])
        L += [f"## {s_['id']} {sc.get('section', '')}  {t0:.1f}-{t1:.1f} s  ({ne} events, {ne / (t1 - t0) * 10:.1f} per 10 s)", "",
              "| time (s) | on-screen action | sound (role / design) | level | why |", "|---|---|---|---|---|"]
        for r in rs:
            pan = "C" if abs(r["pan"]) < 0.12 else (f"L{abs(r['pan']) * 100:.0f}" if r["pan"] < 0 else f"R{r['pan'] * 100:.0f}")
            tt = f"{r['t']:.2f}" + (f"-{r['t1']:.2f}" if r["n"] > 1 else "")
            snd = f"{r['role']} / {man.get(r['role'], {}).get('design', '?')}" + (f" x{r['n']} (run)" if r["n"] > 1 else "")
            L.append(f"| {tt} | {r.get('note') or r['why']} | {snd} | {r['db'] - 3.1:.0f} dB, {pan} | {roles.get(r['role'], {}).get('why', '')} |")
        sl = [x for x in silent if t0 <= x["t"] < t1]
        if sl:
            L += ["", "Left without a sound on purpose:"] + [f"- {x['t']:.1f} s - {x['note']}" for x in sl]
        L.append("")
    L += ["## Rebuild the mix after a new picture render (same timings)", "",
          "Run with earshot's python (`rmcommon.EARSHOT_PY`); `<sd>` = `<skill>/scripts/sound_design.py`, `<p>` = this project folder.", "",
          "```", "<earshot python> <sd> <p> mix      # voice + effects (sfx_cues.json) + music.wav -> out/<id>.mp4 on out/<id>_raw.mp4",
          "<earshot python> <sd> <p> listen   # sheet.png, timeline, critique -> out/listen_report.md", "```", "",
          "Only if the spotting changes (script.json hits / the project palette): `palette` (new or changed roles: `--roles a,b --fresh`), "
          "`cues`, `spot`, then `mix`, `listen`. Only if the score changes: `music` before `mix`. "
          "`mix --raw <other picture> --out <file>` muxes onto another render without touching the project's files.", ""]
    (P.out / "sound_spotting.md").write_text("\n".join(L), encoding="utf-8")
    log(f"spot: {len(rows)} sounds, {len(ev)} events ({len(ev) / dur * 10:.1f} per 10 s) -> {P.out / 'sound_spotting.md'}")


# ------------------------------------------------------------------------------------------------ listen
def listen(P, final=None):
    exe = str(Path(sys.executable).with_name("earshot.exe"))
    final = Path(final) if final else P.out / f"{P.id}.mp4"
    cuesf = P.proj / "earshot_cues.json"
    rep = ["# Listening report (earshot)", ""]

    def run(args, name):
        r = subprocess.run([exe, *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
        (P.out / f"earshot_{name}.txt").write_text(r.stdout + r.stderr, encoding="utf-8")
        return r.stdout
    run(["sheet", str(final), "-o", str(P.out / "sheet.png"), "--video", str(final), "--cues", str(cuesf), "--width", "2000"], "sheet")
    run(["timeline", str(final), "--video", str(final), "--cues", str(cuesf), "--json", "--out", str(P.out / "timeline.json")], "timeline")
    run(["critique", str(final), "--video", str(final), "--json", "--out", str(P.out / "critique.json")], "critique")
    mood = run(["describe", str(P.pub / "music.wav")], "describe_music")
    meas = run(["measure", str(final)], "measure")
    rep += ["## Music (earshot describe)", "```", mood.strip()[:1500], "```", "",
            "## Final loudness (earshot measure)", "```", meas.strip()[:1200], "```", ""]
    try:
        cj = json.loads((P.out / "critique.json").read_text(encoding="utf-8"))
        rep += ["## Critique vs professional launch films", ""]
        for m in (cj.get("metrics") or cj.get("checks") or []):
            if isinstance(m, dict):
                rep.append(f"- **{m.get('name', m.get('metric'))}**: {m.get('status')} - {m.get('value', '')} {m.get('fix', '') or ''}")
        for fx_ in (cj.get("fixes") or [])[:12]:
            rep.append(f"- fix: {fx_ if isinstance(fx_, str) else json.dumps(fx_)[:200]}")
        rep.append("")
    except Exception as ex:
        rep.append(f"(critique not parsed: {ex})")
    rep += ["## Files", "- out/sheet.png (frames, events, spectrogram, loudness, sync) - LOOK at it",
            "- out/timeline.json, out/critique.json, out/earshot_*.txt", "",
            "earshot's ears are models: ask Ved for one human listen on headphones."]
    (P.out / "listen_report.md").write_text("\n".join(rep), encoding="utf-8")
    log(f"listen: report -> {P.out / 'listen_report.md'}, sheet -> {P.out / 'sheet.png'}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("step", choices=["palette", "cues", "music", "mix", "listen", "spot", "all"])
    ap.add_argument("--roles")
    ap.add_argument("--fresh", action="store_true")
    ap.add_argument("--music-db", type=float, default=None, help="music bus gain; default -13 (remake) / -18 (explainer style)")
    ap.add_argument("--raw", help="mix: picture to mux onto instead of out/<id>_raw.mp4 (same timings)")
    ap.add_argument("--out", help="mix: output MP4 instead of out/<id>.mp4; listen: the MP4 to listen to")
    a = ap.parse_args()
    P = project_paths(a.project)
    steps = ["palette", "cues", "music", "mix", "listen"] if a.step == "all" else [a.step]
    for s in steps:
        if s == "palette":
            palette(P, a.roles.split(",") if a.roles else None, a.fresh)
        elif s == "cues":
            cues(P)
        elif s == "music":
            music(P)
        elif s == "mix":
            if a.music_db is None:
                style = json.loads((P.proj / "project.json").read_text(encoding="utf-8")).get("style")
                a.music_db = -18.0 if style == "explainer" else -13.0   # explainer: music ~18 dB under the voice
                mix(P, a.music_db, raw=a.raw, out=a.out)
            else:
                mix(P, a.music_db, cli_music_db=True, raw=a.raw, out=a.out)
        elif s == "listen":
            listen(P, a.out)
        elif s == "spot":
            spot(P)


if __name__ == "__main__":
    main()
