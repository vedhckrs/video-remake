"""Step 9: edit rhythm - how cuts, text, words, beats and SFX line up, and the rules that follow.

No maintained library does this; it is plain arithmetic on the other stages' outputs.
usage: rhythm.py <workdir>
reads: raw/shots.json beats.json words.json sfx.json ocr.json sections.json   writes: raw/rhythm.json
Offsets are signed: negative = the cut/text comes BEFORE the beat/word.
"""
import difflib
import sys
from collections import Counter
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log  # noqa: E402


def nearest(arr, t):
    if not len(arr):
        return None, None
    i = int(np.argmin(np.abs(arr - t)))
    return float(arr[i]), i


def clean(s):
    return "".join(ch for ch in s.lower() if ch.isalnum())


def main(workdir):
    w = Work(workdir)
    fps = w.probe["fps"]
    tol = max(1.0 / fps, 0.04)
    S = w.load("shots")
    B = w.load("beats", {}) or {}
    beats = np.array(B.get("beats") or [])
    downs = np.array(B.get("downbeats") or [])
    words = (w.load("words", {}) or {}).get("words") or []
    sfx = (w.load("sfx", {}) or {}).get("events") or []
    ocr = (w.load("ocr", {}) or {}).get("tracks") or []
    w_on = np.array([x["t_in"] for x in words])
    w_bounds = np.array(sorted([x["t_in"] for x in words] + [x["t_out"] for x in words]))
    s_on = np.array([e["t"] for e in sfx])

    cuts = []
    for tr in S["transitions"]:
        t = tr["t_start"]
        row = {"from": tr["from"], "to": tr["to"], "cut": t, "type": tr["type"]}
        b, bi = nearest(beats, t)
        if b is not None:
            row.update({"nearest_beat": round(b, 3), "beat_index": bi, "offset_ms": round((t - b) * 1000),
                        "on_beat": abs(t - b) <= tol})
        d, _ = nearest(downs, t)
        if d is not None:
            row.update({"nearest_downbeat": round(d, 3), "downbeat_offset_ms": round((t - d) * 1000),
                        "on_downbeat": abs(t - d) <= tol})
        wb, _ = nearest(w_bounds, t)
        if wb is not None:
            row["nearest_word_boundary_offset_ms"] = round((t - wb) * 1000)
        so, si = nearest(s_on, t)
        if so is not None and abs(so - t) < 0.5:
            row["sfx"] = {"type": sfx[si]["type"], "offset_ms": round((so - t) * 1000)}
        cuts.append(row)

    rules = []
    if cuts and len(beats):
        on = [c for c in cuts if c.get("on_beat")]
        rules.append(f"{len(on)}/{len(cuts)} cuts land within ±{round(tol * 1000)} ms of a beat")
        ond = [c for c in cuts if c.get("on_downbeat")]
        if ond:
            rules.append(f"{len(ond)}/{len(cuts)} cuts land on a downbeat (bar start)")
        idx = [c["beat_index"] for c in cuts if c.get("on_beat")]
        gaps = np.diff(idx)
        if len(gaps) >= 2:
            g, n = Counter(gaps.tolist()).most_common(1)[0]
            if n / len(gaps) >= 0.5:
                bpm = B.get("bpm") or 0
                rules.append(f"on-beat cuts are mostly {g} beats apart ({n}/{len(gaps)})"
                             + (f" = {g * 60 / bpm:.2f} s at {bpm:.0f} BPM" if bpm else ""))
        med = float(np.median([abs(c["offset_ms"]) for c in cuts if "offset_ms" in c]))
        rules.append(f"median |cut - nearest beat| = {med:.0f} ms")
    with_sfx = [c for c in cuts if "sfx" in c]
    if with_sfx:
        pre = float(np.median([c["sfx"]["offset_ms"] for c in with_sfx]))
        rules.append(f"{len(with_sfx)}/{len(cuts)} cuts carry an SFX hit; median SFX offset {pre:+.0f} ms vs the cut")

    # text vs voice: match each caption (or each reveal step) to the spoken word it shows
    text_sync = []
    for tr in ocr:
        steps = tr.get("steps") or [{"text": tr["text"], "t_in": tr["t_in"]}]
        prev = ""
        for st in steps:
            new = st["text"][len(prev):].strip() if st["text"].startswith(prev) else st["text"]
            prev = st["text"]
            first = clean(new.split()[0]) if new.split() else ""
            if len(first) < 2 or not len(w_on):
                continue
            cand = [(abs(x["t_in"] - st["t_in"]), x) for x in words
                    if abs(x["t_in"] - st["t_in"]) < 0.6 and
                    difflib.SequenceMatcher(None, clean(x["w"]), first).ratio() > 0.6]
            if cand:
                _, x = min(cand, key=lambda c: c[0])
                text_sync.append({"text": new, "t_text": st["t_in"], "word": x["w"], "t_word": x["t_in"],
                                  "lag_ms": round((st["t_in"] - x["t_in"]) * 1000)})
    if text_sync:
        lag = float(np.median([t["lag_ms"] for t in text_sync]))
        rules.append(f"on-screen words appear {abs(lag):.0f} ms {'after' if lag > 0 else 'before'} the spoken word "
                     f"(median of {len(text_sync)} matches)")

    lens = np.array([s["duration_s"] for s in S["shots"]])
    bpm = B.get("bpm")
    shot_beats = {s["id"]: round(s["duration_s"] * bpm / 60, 2) for s in S["shots"]} if bpm else {}
    dur = w.probe["duration_s"]
    density = [{"t": t, "cuts": sum(1 for c in cuts if t <= c["cut"] < t + 5)} for t in range(0, int(dur) + 1, 5)]
    rules.append(f"average shot {lens.mean():.2f} s (median {np.median(lens):.2f}, min {lens.min():.2f}, "
                 f"max {lens.max():.2f}) over {len(lens)} shots")

    w.save("rhythm", {"cut_to_beat_offsets_ms": cuts, "text_to_voice": text_sync,
                      "shot_length_beats": shot_beats, "cut_density_per_5s": density,
                      "avg_shot_len_s": round(float(lens.mean()), 3),
                      "median_shot_len_s": round(float(np.median(lens)), 3),
                      "rules_inferred": rules})
    log("rhythm: " + " | ".join(rules))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
