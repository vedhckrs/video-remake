"""Reference blueprint -> style recipe (recipe.json + recipe.md).

The recipe is everything needed to make a NEW video that edits like the reference, with none of
its content: canvas, pacing, shot-length curve, transition vocabulary (types, lengths, where the
background flips), caption system, palette per act, voice pace, music tempo/level, SFX rules,
narrative section proportions.

usage: recipe.py <reference work folder (video-blueprint output)> <remake project folder>
reads: blueprint.json, raw/vision.json, raw/rhythm.json, raw/palette.json, raw/ocr.json, raw/stems.json
writes: <project>/recipe.json, <project>/recipe.md
"""
import json
import statistics as st
import sys
from collections import Counter
from pathlib import Path


def load(p, default=None):
    p = Path(p)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default


def hex_lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def main(ref, proj):
    ref, proj = Path(ref), Path(proj)
    bp = load(ref / "blueprint.json")
    if not bp:
        sys.exit(f"no blueprint.json in {ref} - run video-blueprint first")
    V = load(ref / "raw" / "vision.json", {}) or {}
    RH = bp.get("rhythm") or {}
    src = bp["source"]
    W, H = map(int, src["resolution"].split("x"))
    fps, dur = src["fps"], src["duration_s"]
    shots, trans = bp["shots"], bp["transitions"]

    # ---- background per shot (dark/light) from the palette's most-covering colour
    def bg_of(s):
        pal = s.get("palette") or []
        if not pal:
            return "dark" if (s.get("grade") or {}).get("mean_luma_ire", 50) < 35 else "light"
        return "dark" if hex_lum(pal[0]["hex"]) < 0.35 else "light"
    bgs = [bg_of(s) for s in shots]
    darks = [s["palette"][0]["hex"] for s, b in zip(shots, bgs) if b == "dark" and s.get("palette")]
    lights = [s["palette"][0]["hex"] for s, b in zip(shots, bgs) if b == "light" and s.get("palette")]

    # ---- transitions
    tmap = {"wipe": "iris", "dissolve": "dissolve", "zoom": "zoom", "cut": "cut", "sudden_jump": "cut",
            "fade": "dissolve", "slide": "slide", "push": "push", "doorway": "iris", "whip_pan": "push",
            "match_cut": "cut", "flash": "cut", "glitch": "cut", "other": "dissolve"}
    seq = []
    for i, t in enumerate(trans):
        a, b = bgs[i], bgs[i + 1] if i + 1 < len(bgs) else bgs[i]
        seq.append({"type": tmap.get(t["type"], "dissolve"), "ref_type": t["type"], "frames": max(0, t.get("duration_frames") or 0),
                    "bg_change": a != b, "pos": round(t["t_start"] / dur, 3),
                    "looks_like": ((t.get("vision") or {}).get("looks_like"))})
    by_type = {}
    for s in seq:
        by_type.setdefault(s["type"], []).append(s["frames"])
    lens = [s["duration_s"] for s in shots]

    # ---- captions
    caps = [tl for s in shots for tl in s.get("text_layers", []) if tl.get("role") == "caption" and tl["frame_in"] >= s["frame_in"]]
    ys = [tl["bbox_norm"][1] for tl in caps if tl.get("bbox_norm")]
    hs = [tl["bbox_norm"][3] - tl["bbox_norm"][1] for tl in caps if tl.get("bbox_norm")]
    top_caps = [y for y in ys if y < 0.25]
    cap_y = round(st.median(top_caps), 3) if top_caps else (round(st.median(ys), 3) if ys else 0.07)
    cap_h = st.median(hs) if hs else 0.03
    lag = [x["lag_ms"] for x in RH.get("text_to_voice") or []]
    reveal = sum(1 for tl in caps if tl.get("reveal") == "word_by_word")

    # ---- audio
    au = bp["audio"]
    vo, mu, sfx = au.get("voiceover") or {}, au.get("music") or {}, au.get("sfx") or []
    share = au.get("stem_rms_share") or {}
    cut_sfx = [c["sfx"]["offset_ms"] for c in RH.get("cut_to_beat_offsets_ms") or [] if c.get("sfx")]
    fam = Counter(e["type"] for e in sfx)

    # ---- narrative proportions
    narr = []
    for n in V.get("narrative") or bp.get("narrative") or []:
        t0 = n.get("t_in") or 0.0
        t1 = n.get("t_out") if n.get("t_out") is not None else dur
        narr.append({"section": n.get("section"), "share": round((t1 - t0) / dur, 3), "purpose": n.get("purpose")})

    recipe = {
        "reference": {"file": src["file"], "duration_s": dur, "blueprint": str(ref / "blueprint.json")},
        "canvas": {"width": W, "height": H, "fps": round(fps)},
        "length_s": round(dur, 2),
        "pacing": {"shots": len(shots), "avg_shot_s": round(st.mean(lens), 2), "median_shot_s": round(st.median(lens), 2),
                   "min_shot_s": round(min(lens), 2), "max_shot_s": round(max(lens), 2),
                   "shot_lengths_s": [round(x, 2) for x in lens],
                   "transitions_follow": "voice" if not any(c.get("on_beat") for c in RH.get("cut_to_beat_offsets_ms") or [])
                   or sum(1 for c in RH.get("cut_to_beat_offsets_ms") or [] if c.get("on_beat")) < len(trans) / 3 else "beat"},
        "transitions": {"sequence": seq, "counts": dict(Counter(s["type"] for s in seq)),
                        "median_frames": {k: int(st.median(v)) if v else 0 for k, v in by_type.items()},
                        "hard_cuts": sum(1 for s in seq if s["type"] == "cut"),
                        "rule": "iris wipes where the background flips dark<->light; dissolves inside an act"
                        if any(s["bg_change"] and s["type"] == "iris" for s in seq) else None},
        "acts": {"bg_sequence": bgs, "dark_bg": Counter(darks).most_common(1)[0][0] if darks else "#08090B",
                 "light_bg": Counter(lights).most_common(1)[0][0] if lights else "#E6E7DD"},
        "captions": {"y": cap_y, "height_frac": round(cap_h, 4), "size_px": int(round(cap_h * H * 0.95)),
                     "lead_ms": int(-st.median(lag)) if lag else 50, "word_by_word": reveal > 0,
                     "style": (V.get("overall_style") or {}).get("typography_system")},
        "voice": {"language": vo.get("language"), "pace_wpm": vo.get("pace_wpm"), "register": vo.get("register"),
                  "pitch_hz": vo.get("pitch_median_hz"), "tone": vo.get("tone"), "words": len(vo.get("words") or [])},
        "music": {"bpm": mu.get("bpm"), "key": mu.get("key"), "level_vs_voice": round(
                      (share.get("drums", 0) + share.get("bass", 0) + share.get("other", 0)) / max(1e-6, share.get("vocals", 1)), 3),
                  "mood": mu.get("mood")},
        "sfx": {"count": len(sfx), "per_10s": round(len(sfx) / dur * 10, 2), "families": dict(fam),
                "transitions_with_sfx": round(len(cut_sfx) / max(1, len(trans)), 2),
                "median_offset_ms_vs_transition": int(st.median(cut_sfx)) if cut_sfx else -250},
        "narrative": narr,
        "look": V.get("overall_style"),
        "video_type": V.get("video_type"),
        "rules_inferred": RH.get("rules_inferred") or [],
    }
    proj.mkdir(parents=True, exist_ok=True)
    (proj / "recipe.json").write_text(json.dumps(recipe, indent=2, ensure_ascii=False), encoding="utf-8")

    md = [f"# Style recipe (from {Path(src['file']).name})", "",
          f"- Canvas {W}x{H} @ {round(fps)} fps, {dur:.1f} s; {len(shots)} shots, avg {recipe['pacing']['avg_shot_s']} s "
          f"(median {recipe['pacing']['median_shot_s']}); transitions follow the {recipe['pacing']['transitions_follow']}.",
          f"- Transitions: {recipe['transitions']['counts']} (median frames {recipe['transitions']['median_frames']}); "
          f"hard cuts: {recipe['transitions']['hard_cuts']}. {recipe['transitions']['rule'] or ''}",
          f"- Acts (background per shot): {' '.join('D' if b == 'dark' else 'L' for b in bgs)}  "
          f"(dark {recipe['acts']['dark_bg']}, light {recipe['acts']['light_bg']})",
          f"- Captions: top at {cap_y:.0%} of height, ~{recipe['captions']['size_px']} px, word by word, "
          f"each word {recipe['captions']['lead_ms']} ms before it is spoken. {recipe['captions']['style'] or ''}",
          f"- Voice: {vo.get('language')} at {vo.get('pace_wpm')} wpm, {vo.get('register')} register. {vo.get('tone') or ''}",
          f"- Music: {mu.get('bpm')} BPM, {mu.get('key')}, bed at {recipe['music']['level_vs_voice']}x the voice level.",
          f"- SFX: {len(sfx)} hits ({recipe['sfx']['per_10s']} per 10 s) {dict(fam)}; "
          f"{recipe['sfx']['transitions_with_sfx']:.0%} of transitions carry one, median {recipe['sfx']['median_offset_ms_vs_transition']} ms vs the transition.",
          "", "## Narrative (share of length)", ""]
    md += [f"- **{n['section']}** {n['share']:.0%}: {n['purpose']}" for n in narr]
    md += ["", "## Look", "", json.dumps(V.get("overall_style") or {}, indent=2, ensure_ascii=False), "",
           "## Measured rules", ""] + [f"- {r}" for r in recipe["rules_inferred"]]
    (proj / "recipe.md").write_text("\n".join(md), encoding="utf-8")
    print(f"[video-remake] recipe: {len(shots)} shots, transitions {recipe['transitions']['counts']}, "
          f"captions y={cap_y}, lead {recipe['captions']['lead_ms']} ms -> {proj / 'recipe.json'}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
