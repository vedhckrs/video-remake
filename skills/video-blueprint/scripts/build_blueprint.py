"""Step 10a: merge every stage into blueprint.json (VideoBlueprint schema) and validate it.

usage: build_blueprint.py <workdir>
reads: probe.json + raw/*.json   writes: blueprint.json
Every value carries where it came from (`provenance` per shot, `source` per transition/event).
Stages that did not run leave their part empty and add a line to `unresolved`.
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import SCRIPTS, Work, f2t, log, read_json, write_json  # noqa: E402


def overlaps(a0, a1, b0, b1):
    return a0 < b1 and b0 < a1


def main(workdir):
    w = Work(workdir)
    P = w.probe
    fps = P["fps"]
    S = w.load("shots")
    K = w.load("keyframes", {"shots": {}, "transitions": {}}) or {}
    PAL = w.load("palette", {}) or {}
    CF = w.load("camera_flow", {"shots": {}, "transitions": {}}) or {}
    MS = w.load("camera_megasam", {}) or {}
    OCR = (w.load("ocr", {}) or {}).get("tracks") or []
    OBJ = (w.load("objects", {}) or {}).get("shots") or {}
    V = w.load("vision", {}) or {}
    VS = V.get("shots") or {}
    # the vision form is hand-written: accept plain strings where the schema wants objects
    for vs_ in VS.values():
        for key in ("effects", "graphic_layers", "subjects"):
            vs_[key] = [x if isinstance(x, dict) else {"type" if key != "subjects" else "label": str(x)}
                        for x in (vs_.get(key) or [])]
    WD = w.load("words", {}) or {}
    PR = w.load("prosody", {}) or {}
    BT = w.load("beats", {}) or {}
    SE = w.load("sections", {}) or {}
    SX = w.load("sfx", {}) or {}
    ST = w.load("stems", {}) or {}
    RH = w.load("rhythm", {}) or {}
    unresolved = []

    # caption vs UI text: screen recordings carry hundreds of tiny UI labels. A caption is large, or its
    # words are spoken within half a second of it appearing.
    spoken = [(x["t_in"], "".join(c for c in x["w"].lower() if c.isalnum())) for x in (WD.get("words") or [])]
    heights = sorted(t["bbox_norm"][3] - t["bbox_norm"][1] for t in OCR) or [0]
    big = max(0.022, heights[int(len(heights) * 0.9)] * 0.8)
    for tr in OCR:
        h = tr["bbox_norm"][3] - tr["bbox_norm"][1]
        toks = ["".join(c for c in w.lower() if c.isalnum()) for w in tr["text"].split()]
        said = sum(1 for tk in toks if len(tk) > 1 and any(tk == sw and abs(st - tr["t_in"]) < 0.8 for st, sw in spoken))
        tr["role"] = "caption" if (h >= big or (toks and said / len(toks) >= 0.5) or tr.get("reveal")) else "ui_text"

    shots_out = []
    for sh in S["shots"]:
        sid = sh["id"]
        vs = VS.get(sid, {})
        cf = (CF.get("shots") or {}).get(sid, {})
        ms = (MS.get("shots") or {}).get(sid, {})
        pal = PAL.get(sid, {})
        prov = {"cut": next((t["source"] for t in S["transitions"] if t["to"] == sid), "start of video"),
                "palette": "k-means (Lab) on mid frame", "tone": "frame statistics"}
        if str(cf.get("totals_source", "")).startswith("integrated"):
            # registration failed (content changed too much): the flow totals usually include UI/layer animation
            for m in cf.get("movement", []):
                m["confidence"] = "low - may be layer/UI animation, see camera.semantic"
        handheld = any(m.get("type") == "handheld" for m in cf.get("movement", []))
        camera = {"movement": cf.get("movement", []), "shake_rms_px": cf.get("shake_rms_px") if handheld else 0.0}
        if cf:
            prov["camera_2d"] = CF.get("tool")
        if ms:
            camera.update({k: ms[k] for k in ("focal_px", "focal_mm_35eq_est", "path_summary") if k in ms})
            prov["camera_3d"] = "MegaSaM"
        if vs.get("camera_semantic"):
            camera["semantic"] = vs["camera_semantic"]
            prov["camera_semantic"] = "Claude vision (keyframes)"
        if vs.get("dof"):
            camera["dof"] = vs["dof"]
        text_layers = []
        fonts = V.get("text_fonts") or {}
        anims = {x.get("text"): x for x in vs.get("text_animation", []) if isinstance(x, dict)}
        for tr in OCR:
            if overlaps(tr["t_in"], tr["t_out"], sh["t_in"], sh["t_out"]):
                layer = {k: tr[k] for k in ("text", "role", "t_in", "t_out", "frame_in", "frame_out", "bbox_norm", "score")}
                if tr.get("reveal"):
                    layer["reveal"], layer["steps"] = tr["reveal"], tr["steps"]
                layer["font_guess"] = fonts.get(tr["text"])
                layer["font_confirmed"] = False
                if tr["text"] in anims:
                    layer["anim"] = {k: v for k, v in anims[tr["text"]].items() if k != "text"}
                if len(tr.get("bbox_path", [])) > 1:
                    layer["bbox_path"] = tr["bbox_path"]
                text_layers.append(layer)
        if text_layers:
            prov["ocr"] = "PaddleOCR (frame-refined in/out)"
        frames = []
        for k in ("in", "mid", "out"):
            kf = (K.get("shots") or {}).get(sid, {}).get(k)
            if kf:
                fr = {"f": kf["frame"], "t": kf["t"], "image": kf["file"]}
                fr["text"] = [t["text"] for t in text_layers if t["frame_in"] <= kf["frame"] <= t["frame_out"]]
                objs = []
                for o in OBJ.get(sid, []):
                    near = min(o.get("frames", []), key=lambda x: abs(x["f"] - kf["frame"]), default=None)
                    if near and abs(near["f"] - kf["frame"]) <= max(2, round(fps / 10)):
                        objs.append({"id": o["id"], "bbox_norm": near["bbox_norm"]})
                if objs:
                    fr["objects"] = objs
                frames.append(fr)
        subjects = vs.get("subjects") or []
        if OBJ.get(sid):
            prov["objects"] = "SAM 3"
            subjects = subjects + [{"id": o["id"], "label": o["label"], "track": "objects.json",
                                    "bbox_norm_first": (o.get("frames") or [{}])[0].get("bbox_norm")}
                                   for o in OBJ[sid]]
        if vs:
            prov["description"] = "Claude vision (keyframes)"
        grade = dict(pal.get("tone", {}))
        grade["look"] = vs.get("grade_look")
        grade["lut_match"] = "unresolved"
        shots_out.append({
            "id": sid, "t_in": sh["t_in"], "t_out": sh["t_out"], "frame_in": sh["frame_in"],
            "frame_out": sh["frame_out"], "duration_s": sh["duration_s"],
            "shot_scale": vs.get("shot_scale"), "description": vs.get("description"),
            "composition": vs.get("composition") or {}, "subjects": subjects,
            "palette": pal.get("palette", []), "grade": grade, "lighting": vs.get("lighting") or {},
            "camera": camera, "text_layers": text_layers, "graphic_layers": vs.get("graphic_layers") or [],
            "effects": (sh.get("effects") or []) + (vs.get("effects") or []),
            "frames": frames, "sheet": (K.get("shots") or {}).get(sid, {}).get("sheet"),
            "provenance": prov})

    transitions = []
    for i, t in enumerate(S["transitions"]):
        tid = f"T{i + 1:02d}"
        hints = {}
        cft = (CF.get("transitions") or {}).get(tid, {})
        kft = (K.get("transitions") or {}).get(tid, {})
        if cft.get("whip_pan_candidate"):
            hints["whip_pan_candidate"] = True
        if kft.get("match_cut_candidate"):
            hints["match_cut_candidate"] = True
        vt = (V.get("transitions") or {}).get(tid, {})
        row = {"id": tid, "from": t["from"], "to": t["to"], "type": t["type"], "t_start": t["t_start"],
               "t_end": t["t_end"], "frame_start": t["frame_start"], "frame_end": t["frame_end"],
               "duration_frames": t["duration_frames"], "confidence": t["confidence"], "source": t["source"],
               "strip": kft.get("strip")}
        if t.get("relation"):
            row["relation"] = t["relation"]
        if hints:
            row["hints"] = hints
        if vt.get("looks_like") or vt.get("notes"):
            row["vision"] = {k: vt.get(k) for k in ("looks_like", "notes")}
        transitions.append(row)

    beats = BT.get("beats") or []
    music = {"stem": (ST.get("files") or {}).get("music_no_vocals"), "bpm": BT.get("bpm"),
             "bpm_stability_pct": BT.get("bpm_stability_pct"), "beats_per_bar": BT.get("beats_per_bar"),
             "key": (f"{SE['key_estimate']} (estimate, r={SE.get('key_confidence')})" if SE.get("key_estimate") else None),
             "sections": [{"label": s["label"], "role": s.get("role_guess"), "t_in": s["t_in"], "t_out": s["t_out"],
                           "energy_rel": s.get("energy_rel")} for s in SE.get("sections", [])],
             "beats": beats, "downbeats": BT.get("downbeats") or [],
             "sections_source": SE.get("tool"), "sections_licence_note": SE.get("licence_note"),
             "mood": (f"{V['music_mood']} (vision/heuristic, low confidence)" if V.get("music_mood") else None),
             "source": BT.get("tool")}
    voice = {"language": WD.get("language"), "speakers": WD.get("speakers"), "words": WD.get("words") or [],
             "segments": WD.get("segments") or [], "pace_wpm": WD.get("pace_wpm"),
             "aligned": WD.get("aligned"), "diarized": WD.get("diarized"),
             "tone": (f"{V['voice_tone']} (manual/heuristic)" if V.get("voice_tone") else None),
             "pitch_median_hz": PR.get("speaker_pitch_median_hz"), "register": PR.get("register_guess"),
             "emphasis": PR.get("emphasis") or [], "pauses": PR.get("pauses") or [], "source": WD.get("tool")}
    sfx = [{k: e[k] for k in ("t", "type", "dur_s", "strength", "stem", "confidence") if k in e} | {"source": SX.get("tool")}
           for e in SX.get("events", [])]
    for e in sfx:  # what each hit is aligned to
        near_cut = min(transitions, key=lambda t: abs(t["t_start"] - e["t"]), default=None)
        if near_cut and abs(near_cut["t_start"] - e["t"]) < 0.3:
            e["aligned_to"] = f"{near_cut['type']} {near_cut['from']}->{near_cut['to']} ({(e['t'] - near_cut['t_start']) * 1000:+.0f} ms)"
        else:
            txt = min(((abs(tl["t_in"] - e["t"]), tl) for s in shots_out for tl in s["text_layers"]),
                      key=lambda x: x[0], default=(9, None))
            if txt[1] is not None and txt[0] < 0.15:
                e["aligned_to"] = f"text-in '{txt[1]['text'][:30]}' ({(e['t'] - txt[1]['t_in']) * 1000:+.0f} ms)"

    # unresolved: what this toolchain cannot extract, plus what did not run here
    if any(t["text_layers"] for t in shots_out):
        unresolved.append("exact font families (OCR gives strings, not typefaces) - match glyph crops manually")
    unresolved += ["exact LUT / grade recipe (palette + tone stats only)",
                   "keyframe easing curves (bezier handles) - fit from bbox_path/camera series if needed"]
    if sfx:
        unresolved.append("SFX recipes / synth patches (only type + timing)")
    if not S.get("omnishotcut_used"):
        unresolved.append("transition types not classified (OmniShotCut did not run) - all boundaries typed as cut/fade")
    if not V:
        unresolved.append("vision pass not done: shot scale, composition, lighting, mood are empty")
    if not OBJ:
        unresolved.append("object tracks not extracted (SAM 3 not run)")
    if not MS:
        unresolved.append("3D camera path / focal length not extracted (MegaSaM not run) - camera is 2D dominant motion")
    if WD and not WD.get("diarized"):
        unresolved.append("speaker labels not diarized (no Hugging Face token or --diarize not set)")
    if SE.get("licence_note"):
        unresolved.append("licence: music sections come from All-In-One's CC-BY-NC-SA weights - internal analysis only")
    unresolved += [f"review: {r}" for r in S.get("review", [])]

    bp = {
        "source": {"file": P["file"], "duration_s": P["duration_s"], "fps": P["fps"],
                   "fps_fraction": P["fps_fraction"], "vfr": P["vfr"], "resolution": P["resolution"],
                   "frames": P["frames"], "has_audio": P["has_audio"]},
        "timebase": {"clock": "pts_seconds", "frame_rule": P["frame_rule"],
                     "note": "t_out is exclusive (start of the next frame); frame_out is inclusive"},
        "video_type": V.get("video_type"), "overall_style": V.get("overall_style"),
        "narrative": V.get("narrative") or [],
        "shots": shots_out, "transitions": transitions,
        "audio": {"voiceover": voice, "music": music, "sfx": sfx,
                  "stems": ST.get("files"), "stem_rms_share": ST.get("rms_share")},
        "rhythm": {k: RH.get(k) for k in ("cut_to_beat_offsets_ms", "text_to_voice", "shot_length_beats",
                                          "cut_density_per_5s", "avg_shot_len_s", "median_shot_len_s",
                                          "rules_inferred") if k in RH},
        "unresolved": unresolved,
    }
    write_json(w.root / "blueprint.json", bp)
    try:
        import jsonschema
        schema = read_json(SCRIPTS.parent / "references" / "schema.json")
        errs = sorted(jsonschema.Draft202012Validator(schema).iter_errors(bp), key=lambda e: e.path)
        for e in errs[:10]:
            log(f"schema: {'/'.join(map(str, e.path))}: {e.message}")
        log(f"blueprint: {len(shots_out)} shots, {len(transitions)} transitions, {len(sfx)} sfx, "
            f"{len(voice['words'])} words; schema {'OK' if not errs else f'{len(errs)} errors'}")
    except FileNotFoundError:
        log("blueprint written (schema file missing, not validated)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
