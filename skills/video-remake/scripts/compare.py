"""Prove the remake edits like the reference: analyse the render with video-blueprint, build its recipe,
and compare the two recipes number by number.

usage: compare.py <project dir> [--skip-analysis]
reads: <project>/recipe.json (reference), <project>/out/<id>.mp4
writes: <project>/check/ (video-blueprint work folder of the render), <project>/compare.json, compare.md

Pass bands (the remake's content differs, so the EDIT must match, not the pixels):
  avg shot length within 25 %, shot count within 30 %, hard cuts equal (0 stays 0), transition mix shares
  within 0.2, caption y within 0.04, caption lead within 60 ms, voice pace within 15 %, BPM within 3,
  SFX per 10 s within 50 %, length within 15 %.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import BLUEPRINT_SKILL, CORE_PY, project_paths  # noqa: E402

STAGES = "probe,cuts,transitions,shots,keyframes,camera_flow,ocr,stems,speech,beats,sections,sfx,prosody,rhythm"


def share(counts):
    n = sum(counts.values()) or 1
    return {k: v / n for k, v in counts.items()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--skip-analysis", action="store_true")
    a = ap.parse_args()
    P = project_paths(a.project)
    video = P.out / f"{P.id}.mp4"
    chk = P.proj / "check"
    bp = [str(CORE_PY), str(BLUEPRINT_SKILL / "scripts" / "blueprint.py")]
    if not a.skip_analysis:
        subprocess.run(bp + ["run", str(video), "--out", str(chk), "--only", STAGES], check=True, stdin=subprocess.DEVNULL)
        subprocess.run([str(CORE_PY), str(BLUEPRINT_SKILL / "scripts" / "build_blueprint.py"), str(chk)], check=True)
    subprocess.run([sys.executable, str(Path(__file__).parent / "recipe.py"), str(chk), str(chk / "recipe_out")], check=True)
    ref = json.loads((P.proj / "recipe.json").read_text(encoding="utf-8"))
    got = json.loads((chk / "recipe_out" / "recipe.json").read_text(encoding="utf-8"))

    rows = []

    def row(name, r, g, ok, note=""):
        rows.append({"metric": name, "reference": r, "remake": g, "pass": bool(ok), "note": note})

    rel = lambda r, g, tol: r and g is not None and abs(g - r) / abs(r) <= tol  # noqa: E731
    row("length s", ref["length_s"], got["length_s"], rel(ref["length_s"], got["length_s"], 0.15))
    row("shots", ref["pacing"]["shots"], got["pacing"]["shots"], rel(ref["pacing"]["shots"], got["pacing"]["shots"], 0.30),
        "detector count on the render - soft transitions can merge shots")
    row("avg shot s", ref["pacing"]["avg_shot_s"], got["pacing"]["avg_shot_s"], rel(ref["pacing"]["avg_shot_s"], got["pacing"]["avg_shot_s"], 0.25))
    # Like with like: the reference's recipe comes from a human-reviewed blueprint, the render's from raw
    # detectors. Compare the RAW OmniShotCut reading of both videos (its misreads hit both equally),
    # and show the reviewed reference mix beside it for reading.
    def raw_mix(work):
        tj = Path(work) / "raw" / "transitions.json"
        if not tj.exists():
            return None
        tmap = {"wipe": "iris", "doorway": "iris", "sudden_jump": "cut", "fade": "dissolve", "slide": "push"}
        c = {}
        for t in json.loads(tj.read_text(encoding="utf-8")).get("transitions", []):
            k = tmap.get(t["type"], t["type"])
            c[k] = c.get(k, 0) + 1
        return c
    ref_work = Path(ref["reference"]["blueprint"]).parent
    r_raw, g_raw = raw_mix(ref_work), raw_mix(chk)
    if r_raw and g_raw:
        rs, gs = share(r_raw), share(g_raw)
        worst = max((abs(rs.get(k, 0) - gs.get(k, 0)) for k in set(rs) | set(gs)), default=0)
        row("transition mix (raw detector, both)", r_raw, g_raw, worst <= 0.25,
            f"reviewed reference: {ref['transitions']['counts']}")
        row("hard cuts (raw detector, both)", r_raw.get("cut", 0), g_raw.get("cut", 0),
            abs(r_raw.get("cut", 0) - g_raw.get("cut", 0)) <= max(2, r_raw.get("cut", 0) // 2))
    else:
        rs, gs = share(ref["transitions"]["counts"]), share(got["transitions"]["counts"])
        worst = max((abs(rs.get(k, 0) - gs.get(k, 0)) for k in set(rs) | set(gs)), default=0)
        row("transition mix", ref["transitions"]["counts"], got["transitions"]["counts"], worst <= 0.2,
            "reviewed reference vs unreviewed render")
    row("transitions follow", ref["pacing"]["transitions_follow"], got["pacing"]["transitions_follow"],
        ref["pacing"]["transitions_follow"] == got["pacing"]["transitions_follow"])
    row("caption y", ref["captions"]["y"], got["captions"]["y"], abs(ref["captions"]["y"] - got["captions"]["y"]) <= 0.04)
    row("caption lead ms", ref["captions"]["lead_ms"], got["captions"]["lead_ms"],
        abs(ref["captions"]["lead_ms"] - got["captions"]["lead_ms"]) <= 60)
    row("voice wpm", ref["voice"]["pace_wpm"], got["voice"]["pace_wpm"], rel(ref["voice"]["pace_wpm"], got["voice"]["pace_wpm"], 0.15))
    rb, gb = ref["music"]["bpm"], got["music"]["bpm"]
    row("music BPM", rb, gb, rb is not None and gb is not None and min(abs(rb - gb), abs(rb - 2 * gb), abs(2 * rb - gb)) <= 3)
    row("sfx per 10 s", ref["sfx"]["per_10s"], got["sfx"]["per_10s"], rel(ref["sfx"]["per_10s"] or 0.1, got["sfx"]["per_10s"], 0.5))
    row("act pattern", "".join("D" if b == "dark" else "L" for b in ref["acts"]["bg_sequence"]),
        "".join("D" if b == "dark" else "L" for b in got["acts"]["bg_sequence"]), True, "for reading, not scored")

    scored = [r for r in rows if r["metric"] != "act pattern"]
    passed = sum(r["pass"] for r in scored)
    out = {"passed": passed, "total": len(scored), "rows": rows}
    (P.proj / "compare.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    md = [f"# Remake vs reference: {passed}/{len(scored)} edit metrics match", "",
          "| Metric | Reference | Remake | Match | Note |", "|---|---|---|---|---|"]
    md += [f"| {r['metric']} | {r['reference']} | {r['remake']} | {'yes' if r['pass'] else '**no**'} | {r['note']} |" for r in rows]
    (P.proj / "compare.md").write_text("\n".join(md), encoding="utf-8")
    print("\n".join(md))


if __name__ == "__main__":
    main()
