"""Sound design for remakes with earshot (github.com/Leonxlnx/earshot): sounds made in code, checked by ear.

Run with EARSHOT's python (rmcommon.EARSHOT_PY):
  sound_design.py <project> palette [--roles pop,iris] [--fresh]   # rank candidate designs by ear -> sfx/<role>_<k>.wav
  sound_design.py <project> cues                                 # place sounds from project.json -> sfx_cues.json
  sound_design.py <project> music                                # score a bed with earshot instruments -> music.wav
  sound_design.py <project> mix                                  # VO + SFX + ducked music, mastered -> out/<id>.mp4
  sound_design.py <project> listen                               # earshot sheet/timeline/critique/describe -> out/listen_report.md
  sound_design.py <project> all                                  # palette, cues, music, mix, listen

Ved's rule (meta-ads-video): no AI sound generation for effects and music - earshot renders every sound from
code (designs learned from public-domain recordings) and earshot's ears check them.
Inputs: project.json (from plan_timeline), script.json (scene `hits` with sfx roles), recipe.json, vo.mp3,
out/<id>_raw.mp4 (from `render.py video`). Palette: assets/sfx_palette_ui.json (roles -> candidate designs).
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


def load_palette():
    return json.loads((SKILL / "assets" / "sfx_palette_ui.json").read_text(encoding="utf-8"))


def onset_peak(x):
    m = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    env = np.convolve(m, np.ones(240) / 240, mode="same")
    mx = env.max() or 1
    return int(np.argmax(env > 0.05 * mx)), int(np.argmax(env))


# ------------------------------------------------------------------------------------------------ palette
def palette(P, roles=None, fresh=False):
    from earshot import api
    pal = load_palette()["roles"]
    d = P.pub / "sfx"
    cand = d / "cand"
    cand.mkdir(parents=True, exist_ok=True)
    manp = d / "manifest.json"
    man = json.loads(manp.read_text(encoding="utf-8")) if manp.exists() and not fresh else {}
    for role, spec in pal.items():
        if roles and role not in roles:
            continue
        if role in man and not fresh:
            continue
        paths, ids = [], {}
        for sid in spec["candidates"]:
            p = cand / f"{role}__{sid.replace('/', '__')}.wav"
            try:
                api.make(spec["want"], str(p), sound=sid)
                paths.append(str(p))
                ids[os.path.normcase(str(p))] = sid
            except Exception as ex:  # a design id can disappear between earshot versions
                log(f"{role}: {sid} failed ({str(ex)[:80]})")
        if not paths:
            continue
        r = api.rank(paths, spec["want"])
        rows = r.get("ranked") or r.get("results") or r
        best = rows[0]
        bp = best.get("path") if isinstance(best, dict) else best[0]
        idof = lambda q: ids.get(os.path.normcase(str(q)), Path(q).stem)  # noqa: E731
        win = idof(bp)
        scores = [(idof(x.get("path", "")), round(float(x.get("z", 0)), 2)) for x in rows if isinstance(x, dict)]
        takes = []
        for k in range(1, int(spec.get("takes", 1)) + 1):
            out = d / f"{role}_{k}.wav"
            api.make(spec["want"], str(out), sound=win, seed=k - 1)
            x, sr_ = sf.read(out, dtype="float32", always_2d=True)
            on, pk = onset_peak(x)
            takes.append({"file": out.name, "onset_s": round(on / sr_, 4), "peak_s": round(pk / sr_, 4),
                          "dur_s": round(len(x) / sr_, 3)})
        man[role] = {"design": win, "want": spec["want"], "level_db": spec.get("level_db", -10), "takes": takes, "ranking": scores}
        log(f"{role:10s} -> {win:24s} | " + "  ".join(f"{a} {b:+.2f}" for a, b in scores))
        manp.write_text(json.dumps(man, indent=2), encoding="utf-8")
    return man


# ------------------------------------------------------------------------------------------------ cues
def cues(P):
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    script = json.loads((P.proj / "script.json").read_text(encoding="utf-8"))
    man = json.loads((P.pub / "sfx" / "manifest.json").read_text(encoding="utf-8"))
    palj = load_palette()
    aliases = palj.get("aliases", {})
    for r_, spec_ in palj["roles"].items():          # levels come from the live palette (tuned after listening)
        if r_ in man:
            man[r_]["level_db"] = spec_.get("level_db", man[r_]["level_db"])
    fps, base = pj["canvas"]["fps"], pj.get("baseFps", pj["canvas"]["fps"])
    used = {}
    out = []

    def add(t, role, db=0.0, at="onset", why=""):
        role = aliases.get(role, role)
        if role not in man:
            log(f"no palette sound for role '{role}' ({why}) - skipped")
            return
        n = used.get(role, 0)
        used[role] = n + 1
        tk = man[role]["takes"][n % len(man[role]["takes"])]
        # stereo: small UI sounds alternate sides widely (earshot critique: "nearly mono, pan SFX with the motion");
        # big transition sounds stay near the centre
        wide = role in ("pop", "tap", "click", "tick", "success", "glint", "zip", "accent")
        side = 1 if n % 2 == 0 else -1
        pan = side * (0.35 + rnd(n * 7.7 + 1) * 0.3) if wide else (rnd(n * 7.7 + 1) - 0.5) * 0.3
        out.append({"t": round(t, 4), "role": role, "file": tk["file"], "at": at, "why": why,
                    "db": round(man[role]["level_db"] + db + (rnd(n * 3.1 + len(out)) - 0.5) * 1.5, 2),
                    "pan": round(pan, 3), "rate": round(1 + (rnd(n * 5.3 + 2) - 0.5) * 0.1, 3)})

    sc = pj["scenes"]
    for i, s in enumerate(sc):
        t0 = s["from"] / fps
        tr = s["transitionIn"]
        if i and tr["type"] != "cut":
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
            add(t0 + rel / base, h["sfx"], h.get("db", 0), h.get("at", "onset"), f"{s['id']} {h.get('word', h.get('frame'))}")
            if aliases.get(h["sfx"], h["sfx"]) == "hit":   # weight under every hit (earshot: "thin bottom")
                add(t0 + rel / base, "sub", -2, "onset", f"sub under hit {s['id']}")
    pr = pj.get("presenter")
    if pr:   # explainer: the presenter's entrance pops in
        add(pr.get("enter", 0) / base, "pop", -2, "onset", "presenter enters")
    out.sort(key=lambda c: c["t"])
    (P.proj / "sfx_cues.json").write_text(json.dumps({"fps": fps, "cues": out}, indent=2), encoding="utf-8")
    # earshot cue file (frames) for timeline/sheet sync checks: picture events = transitions + hits
    ev = [{"f": int(round(c["t"] * fps)), "kind": c["role"], "id": c["why"]} for c in out if c["role"] != "riser"]
    (P.proj / "earshot_cues.json").write_text(json.dumps({"fps": fps, "events": ev}, indent=1), encoding="utf-8")
    log(f"cues: {len(out)} sounds ({', '.join(f'{k} x{v}' for k, v in sorted(used.items()))})")
    return out


# ------------------------------------------------------------------------------------------------ music
def music(P):
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
def mix(P, music_db=-13.0, vo_db=0.0):
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    C = json.loads((P.proj / "sfx_cues.json").read_text(encoding="utf-8"))["cues"]
    raw = P.out / f"{P.id}_raw.mp4"
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
    mus = np.zeros((n, 2), np.float32)
    mp = P.pub / "music.wav"
    if mp.exists():
        m = decode(mp)[:n]
        mid, side = (m[:, 0] + m[:, 1]) / 2, (m[:, 0] - m[:, 1]) / 2
        side = side * 1.7                                  # widen the music bed (earshot: "nearly mono")
        m = np.stack([mid + side, mid - side], axis=1)
        mus[: len(m)] = m * 10 ** (music_db / 20)

    def env(x, win):
        k = np.ones(int(win * SR)) / int(win * SR)
        return np.convolve(np.abs(x).max(axis=1), k, mode="same")
    # sidechain: music ducks up to 7 dB under the voice and 4 dB under effects, smoothed
    dv = np.clip(env(vo, 0.08) / 0.06, 0, 1)
    df = np.clip(env(fx, 0.05) / 0.12, 0, 1)
    gain_db = -7 * dv - 4 * df
    sm = np.ones(int(0.12 * SR)) / int(0.12 * SR)
    gain = 10 ** (np.convolve(gain_db, sm, mode="same") / 20)
    st = vo + fx + mus * gain[:, None].astype(np.float32)
    st = st / max(float(np.abs(st).max()), 1.0)
    f = int(0.35 * SR)
    st[-f:] *= np.linspace(1, 0, f)[:, None]
    mw = P.out / f"{P.id}_mix.wav"
    sf.write(mw, st, SR, subtype="PCM_24")
    out = P.out / f"{P.id}.mp4"
    # master: the chain proven on Ved's ads (sfxlib.finish): EQ, loudnorm -14, resample BEFORE the limiter, AAC without PNS
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(raw), "-i", str(mw), "-filter_complex",
                    f"[1:a]{MASTER_AF}[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-aac_pns", "0", "-ar", "48000",
                    "-movflags", "+faststart", "-shortest", str(out)], check=True)
    log(f"mix: {len(C)} sfx, music {music_db} dB ducked under voice/effects -> {out}")
    return out


# ------------------------------------------------------------------------------------------------ listen
def listen(P):
    exe = str(Path(sys.executable).with_name("earshot.exe"))
    final = P.out / f"{P.id}.mp4"
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
    ap.add_argument("step", choices=["palette", "cues", "music", "mix", "listen", "all"])
    ap.add_argument("--roles")
    ap.add_argument("--fresh", action="store_true")
    ap.add_argument("--music-db", type=float, default=None, help="music bus gain; default -13 (remake) / -18 (explainer style)")
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
            mix(P, a.music_db)
        elif s == "listen":
            listen(P)


if __name__ == "__main__":
    main()
