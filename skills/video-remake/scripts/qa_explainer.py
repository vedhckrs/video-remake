"""Quality gates for explainer-style videos (references/styles/keyframes-explainer/style_system.json quality_gates).

usage: qa_explainer.py <project dir> [--video out/<id>.mp4]
Measures what can be measured on project.json + vo_words.json + sfx_cues.json + the rendered MP4:
  format (1080x1920 @ 60), pace (wpm), caption phrase size / keyword boxes / lead, presenter entry + coverage +
  pose cadence, SFX density + longest silence, static spans (frame-difference, > 1.5 s fails), motion on frame 0
  and >= 3 visual states in the first 3 s, loudness (-14 LUFS integrated, true peak <= -1 dBTP).
  World mode (24 Nov 2026) adds: a visible change on >= 90 % of spoken words (spec.beats), never still > 1.0 s
  at 15 fps, and camera smoothness from camera_motion.py (jiggle rms <= 0.9, direction reversals <= 6/min).
Writes <project>/qa_report.json and qa_report.md; exit code 1 when a hard gate fails.
The remaining gates (one ISO angle, no strokes on solids, colour meanings, honesty element, hook callback...)
are design rules: check them by eye on the contact sheet and list them in the report as 'manual'.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import project_paths  # noqa: E402

MANUAL = [
    "One ISO angle for every 3D object; flat modes only PLAN / ELEVATION / CARD",
    "No outline strokes on solid objects (strokes only on annotations, wires, x-ray shells)",
    "Every 3D box uses the theme's three face tones, light from the top-left",
    "Each accent colour has one meaning (accentMap); state = colour + icon + motion",
    "The presenter's pink is not used for any state or data element",
    "Every spoken number has an animated readout landing on the word, with a unit (and a footnote if sourced)",
    "Labels >= 30 px, footnotes >= 22 px held >= 1.5 s; never more than caption + two labels at once",
    "The hook's claim is shown visually before 7 s; the payoff reuses the hook object or composition",
    "At least one honesty element (illustration disclaimer, stated limit or caveat)",
    "Every zoom-through swaps artwork at the blur peak; no L0 art scaled above 1.5x",
    "Every scene change keeps at least 2 of the 3 bands continuous",
]


def ffprobe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                        "-show_entries", "format=duration", "-of", "json", str(path)], capture_output=True, text=True, stdin=subprocess.DEVNULL)
    j = json.loads(r.stdout)
    st = j["streams"][0]
    n, d = st["r_frame_rate"].split("/")
    return int(st["width"]), int(st["height"]), float(n) / float(d), float(j["format"]["duration"])


def frames_small(path, fps=8, w=135):
    h = int(w * 16 / 9)
    r = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", str(path), "-vf", f"fps={fps},scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                       capture_output=True, stdin=subprocess.DEVNULL)
    a = np.frombuffer(r.stdout, dtype=np.uint8)
    return a.reshape(-1, h, w).astype(np.float32)


def loudness(path):
    r = subprocess.run(["ffmpeg", "-v", "info", "-nostdin", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True, stdin=subprocess.DEVNULL)
    txt = r.stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", txt)
    tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", txt)
    return (float(i[-1]) if i else None), (float(tp[-1]) if tp else None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--video")
    a = ap.parse_args()
    P = project_paths(a.project)
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    fps = pj["canvas"]["fps"]
    base = pj.get("baseFps", fps)
    k = fps / base
    dur = pj["durationInFrames"] / fps
    vw = json.loads((P.proj / "vo_words.json").read_text(encoding="utf-8"))["words"]
    rows = []

    def gate(name, ok, value, target, hard=True):
        rows.append({"gate": name, "pass": bool(ok), "value": value, "target": target, "hard": hard})

    # ---- pace
    speech = vw[-1]["end"] - vw[0]["start"]
    wpm = len(vw) / speech * 60
    gate("Narration pace", 185 <= wpm <= 215, f"{wpm:.0f} wpm", "195-205 wpm (185-215 ok)", hard=False)

    # ---- captions
    pages = pj["captions"]["pages"]
    big = [p for p in pages if len(p["words"]) > 4]
    gate("Caption phrases <= 4 words", not big, f"{len(big)} over", "0")
    multi = [p for p in pages if sum(w["style"] == "select" for w in p["words"]) > 1]
    gate("At most one keyword box per phrase", not multi, f"{len(multi)} over", "0")
    boxes = sum(any(w["style"] == "select" for w in p["words"]) for p in pages)
    sentences = sum(1 for w in vw if re.search(r"[.?!]$", w["w"]))
    gate("Keyword boxes ~ one per sentence", boxes >= 0.5 * sentences, f"{boxes} boxes / {sentences} sentences", ">= 0.5 per sentence", hard=False)
    leads = []
    for p in pages:
        for w in p["words"]:
            st = min(vw, key=lambda x: abs(x["start"] - w["frame"] / fps))
            leads.append((st["start"] - w["frame"] / fps) * 1000)
    med = float(np.median(leads)) if leads else 0
    gate("Caption lead before the voice", 15 <= med <= 100, f"{med:.0f} ms median", "2-5 frames @60 (33-83 ms)", hard=False)

    # ---- presenter
    pr = pj.get("presenter")
    if pr:
        enter = pr.get("enter", 0) / base
        gate("Presenter absent in the hook, enters by 7 s", 2.5 <= enter <= 7.0, f"{enter:.1f} s", "3-7 s")
        hidden = sum(max(0, b - a) for a, b in pr.get("hide", [])) / base
        cov = (dur - enter - hidden) / dur
        gate("Presenter visible >= 80 % of runtime", cov >= 0.8, f"{cov * 100:.0f} %", ">= 80 %")
        ts = [c["t"] / base for c in pr["cues"] if c["t"] / base >= enter]
        gaps = np.diff(ts + [dur]) if ts else np.array([dur])
        gate("Pose change at least every 4 s", gaps.max() <= 4.05, f"max hold {gaps.max():.1f} s", "<= 4 s")
        gate("Pose cadence 1-2 s on average", 0.9 <= gaps.mean() <= 2.3, f"mean {gaps.mean():.2f} s", "1-2 s", hard=False)
    # (no presenter = Ved's default since 24 Nov 2026: nothing to check)

    # ---- sound
    sc = P.proj / "sfx_cues.json"
    if sc.exists():
        raw = sorted(c["t"] for c in json.loads(sc.read_text(encoding="utf-8"))["cues"])
        cues = []                      # layered sounds within 100 ms are one audible event (hit + sub, swish + accent)
        for x in raw:
            if not cues or x - cues[-1] > 0.1:
                cues.append(x)
        dens = len(cues) / dur * 10
        gate("SFX density", 3.5 <= dens <= 7, f"{dens:.1f} per 10 s", "4-6 per 10 s")
        edges = [0.0] + cues + [dur]
        gap = max(np.diff(edges))
        gate("No silent stretch (SFX) > 8 s", gap <= 8.0, f"longest {gap:.1f} s", "<= 8 s")
    else:
        gate("SFX cue sheet present", False, "missing", "run sound_design.py")

    # ---- picture
    vid = Path(a.video) if a.video else P.out / f"{P.id}.mp4"
    if vid.exists():
        w, h, vfps, vdur = ffprobe(vid)
        gate("Render 1080x1920 @ 60", (w, h) == (1080, 1920) and abs(vfps - 60) < 0.5, f"{w}x{h} @ {vfps:.0f}", "1080x1920 @ 60")
        fr = frames_small(vid)
        diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))   # per 1/8 s
        moving = diff > 0.35
        # longest static run (seconds)
        run, best, best_at = 0, 0, 0
        for i, m in enumerate(moving):
            run = 0 if m else run + 1
            if run > best:
                best, best_at = run, i
        static_s = best / 8
        gate("No span > 1.5 s without visible change", static_s <= 1.5, f"longest {static_s:.2f} s at {max(0, best_at - best) / 8:.1f} s", "<= 1.5 s")
        gate("Something moves on frame 0", diff[0] > 0.35 if len(diff) else False, f"{diff[0]:.2f}" if len(diff) else "n/a", "> 0.35")
        first3 = diff[:24]
        states = int((first3 > 2.0).sum())
        gate(">= 3 visual states in the first 3 s", states >= 3, f"{states} big changes", ">= 3")
        beats = (diff > 2.0).sum() / vdur
        if pj.get("presenter"):
            gate("Visual beat rate", 0.5 <= beats <= 2.5, f"{beats:.2f} big changes / s", "0.7-1.2 / s", hard=False)
        else:   # world mode: a change on every word is the point - report only
            rows.append({"gate": "Visual beat rate (info)", "pass": True, "value": f"{beats:.2f} big changes / s", "target": "world mode: every word", "hard": False})
        # word beats: a visible change within ~0.2 s of every content word (Ved: "each word spoken a visual change")
        fr15 = frames_small(vid, fps=15)
        bts = [b for sc in pj["scenes"] for b in (sc.get("beats") or []) if b.get("kind") != "drift"]
        hit = 0
        for sc in pj["scenes"]:
            for b in sc.get("beats") or []:
                if b.get("kind") == "drift":
                    continue
                tb = (sc["from"] / fps) + b["t"] / base
                i0, i1 = int(round((tb - 0.07) * 15)), int(round((tb + 0.27) * 15))
                if 0 <= i0 < i1 < len(fr15) and np.abs(fr15[i1] - fr15[i0]).mean() > 0.6:
                    hit += 1
        if bts:
            gate("Visual change on every spoken word", hit / len(bts) >= 0.9, f"{hit}/{len(bts)} words ({hit / len(bts) * 100:.0f} %)", ">= 90 %")
        d15 = np.abs(np.diff(fr15, axis=0)).mean(axis=(1, 2))
        run, best = 0, 0
        for m in d15 > 0.35:
            run = 0 if m else run + 1
            best = max(best, run)
        # calm camera (Ved, v2 review) leaves short natural holds; the world must still move within ~1 s
        gate("Never still > 1.0 s (15 fps)", best / 15 <= 1.05, f"longest {best / 15:.2f} s", "<= 1.0 s")
        # camera smoothness (Ved: no frame jiggle / hand-held jumps): optical-flow global motion
        from camera_motion import metrics as cam_metrics
        cm = cam_metrics(vid, cuts=[sc["from"] / fps for sc in pj["scenes"][1:]])
        gate("Camera smooth: jiggle", cm["jiggle_rms"] <= 0.9, f"rms {cm['jiggle_rms']} ({cm['jiggle_per_min']} frames/min)", "rms <= 0.9")
        gate("Camera smooth: direction reversals", cm["reversals_per_min"] <= 6, f"{cm['reversals_per_min']} / min", "<= 6 / min (v2 was 43)")
        lufs, tp = loudness(vid)
        if lufs is not None:
            gate("Loudness -14 LUFS integrated", -15.2 <= lufs <= -12.8, f"{lufs:.1f} LUFS", "-14 +- 1")
        if tp is not None:
            gate("True peak <= -1 dBTP", tp <= -0.8, f"{tp:.1f} dBTP", "<= -1")
    else:
        gate("Rendered video present", False, str(vid), "render first")

    hard_fail = [r for r in rows if r["hard"] and not r["pass"]]
    rep = {"project": P.id, "passed": sum(r["pass"] for r in rows), "total": len(rows), "hard_failures": len(hard_fail),
           "gates": rows, "manual": MANUAL}
    (P.proj / "qa_report.json").write_text(json.dumps(rep, indent=1), encoding="utf-8")
    md = [f"# QA - {P.id}", "", f"{rep['passed']}/{rep['total']} measured gates pass, {len(hard_fail)} hard failures.", "",
          "| Gate | Result | Value | Target |", "|---|---|---|---|"]
    md += [f"| {r['gate']} | {'PASS' if r['pass'] else ('FAIL' if r['hard'] else 'warn')} | {r['value']} | {r['target']} |" for r in rows]
    md += ["", "## Check by eye (contact sheet)", ""] + [f"- [ ] {m}" for m in MANUAL]
    (P.proj / "qa_report.md").write_text("\n".join(md), encoding="utf-8")
    for r in rows:
        print(f"{'PASS' if r['pass'] else ('FAIL' if r['hard'] else 'warn')}  {r['gate']}: {r['value']} (target {r['target']})")
    print(f"[video-remake] QA: {rep['passed']}/{rep['total']} pass, {len(hard_fail)} hard failures -> {P.proj / 'qa_report.md'}")
    sys.exit(1 if hard_fail else 0)


if __name__ == "__main__":
    main()
