"""Step 2b: merge PySceneDetect cuts with OmniShotCut shots/transitions into one shot list.

usage: shots.py <workdir> [--tol 2]
reads: raw/scenes.json, raw/transitions.json (optional, normalised by transitions_omnishotcut.py)
writes: raw/shots.json  {shots: [...], transitions: [...], review: [...]}

Rules (from the toolchain review):
- a cut both tools find is kept with high confidence;
- OmniShotCut supplies the transition type and its duration;
- a cut only PySceneDetect finds is kept but listed under `review` (could be a flash);
- a boundary only OmniShotCut finds is kept (gradual transitions PySceneDetect misses).
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--tol", type=int, default=2, help="frames of slack when matching cuts")
    a = ap.parse_args()
    w = Work(a.workdir)
    fps = w.probe["fps"]
    nframes = w.probe["frames"]
    sd = w.load("scenes")
    osc = w.load("transitions")  # may be None

    sd_cuts = [c["frame"] for c in sd["cuts"]]
    fades = [f["frame"] for f in sd.get("fade_events", [])]
    bounds = []  # each: frame, type, t-range, sources, confidence

    osc_tr = []
    if osc:
        for tr in osc.get("transitions", []):
            osc_tr.append(dict(tr))

    used_sd = set()
    review_osc = []
    for tr in osc_tr:
        fs, fe = int(tr["frame_start"]), int(tr["frame_end"])
        b = int(tr.get("boundary_frame", (fs + fe + 1) // 2))
        match = [c for c in sd_cuts if fs - a.tol <= c <= fe + a.tol]
        used_sd.update(match)
        typ = tr.get("type", "cut")
        if match and fe - fs <= 1:
            # a cut both found: PySceneDetect decodes every frame, so its frame wins
            b = fs = fe = match[0]
        if typ == "cut" and tr.get("relation") == "Transition":
            typ = "other"
            review_osc.append(f"OmniShotCut marks a transition at frame {fs} ({f2t(fs, fps)}s) but gives no class - "
                              f"look at its strip")
        elif not match and typ not in ("cut", "sudden_jump"):
            # trained on synthetic transitions: a slow in-shot zoom/pan can read as a long "zoom"/"slide"
            review_osc.append(f"{typ} at frame {fs} ({f2t(fs, fps)}s, {fe - fs} frames) found only by OmniShotCut - "
                              f"confirm on its strip (slow in-shot moves can look like a transition)")
        bounds.append({
            "frame": b,
            "frame_start": fs, "frame_end": fe,
            "type": typ,
            "relation": tr.get("relation"),
            "confidence": round(float(tr.get("confidence", 0.6)) + (0.2 if match else 0.0), 3),
            "source": "PySceneDetect+OmniShotCut" if match else "OmniShotCut",
        })
    review = list(review_osc)
    for c in sd_cuts:
        if c in used_sd:
            continue
        typ = "fade" if any(abs(c - f) <= 3 for f in fades) else "cut"
        bounds.append({"frame": c, "frame_start": c, "frame_end": c, "type": typ,
                       "relation": None, "confidence": 0.75 if not osc else 0.5,
                       "source": "PySceneDetect"})
        if osc:
            review.append(f"cut at frame {c} ({f2t(c, fps)}s) found only by PySceneDetect - check for a flash or false cut")

    bounds = sorted(bounds, key=lambda b: b["frame"])
    # drop duplicates closer than tol
    dedup = []
    for b in bounds:
        if dedup and b["frame"] - dedup[-1]["frame"] <= a.tol:
            if b["confidence"] > dedup[-1]["confidence"]:
                dedup[-1] = b
            continue
        dedup.append(b)

    edges = [0] + [b["frame"] for b in dedup] + [nframes]
    shots, transitions = [], []
    for i in range(len(edges) - 1):
        fi, fo = edges[i], edges[i + 1] - 1
        shots.append({"id": f"S{i + 1:02d}", "frame_in": fi, "frame_out": fo,
                      "t_in": f2t(fi, fps), "t_out": f2t(fo + 1, fps),
                      "duration_s": round((fo + 1 - fi) / fps, 6)})
    for i, b in enumerate(dedup):
        transitions.append({
            "from": shots[i]["id"], "to": shots[i + 1]["id"], "type": b["type"],
            "relation": b["relation"],
            "t_start": f2t(b["frame_start"], fps), "t_end": f2t(b["frame_end"], fps),
            "frame_start": b["frame_start"], "frame_end": b["frame_end"],
            "duration_frames": max(0, b["frame_end"] - b["frame_start"]),
            "confidence": min(b["confidence"], 0.99), "source": b["source"]})

    w.save("shots", {"shots": shots, "transitions": transitions, "review": review,
                     "omnishotcut_used": bool(osc)})
    log(f"shots: {len(shots)} shots, {len(transitions)} transitions "
        f"({'with' if osc else 'without'} OmniShotCut), {len(review)} to review")


if __name__ == "__main__":
    main()
