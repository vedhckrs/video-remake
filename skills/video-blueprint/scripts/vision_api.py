"""Boundary review + vision pass + style dossier through the Claude API (Ved's own Anthropic account).

Replaces the by-eye steps 2-3 of SKILL.md with Claude Fable 5.2 calls, for batches of reference videos.
Auth: the SDK's default chain - `ant auth login` profile (preferred) or ANTHROPIC_API_KEY. This script
never reads, prints or stores a key.

usage (core env python):
  vision_api.py estimate <work> [<work> ...]           # count_tokens (free) -> estimated $ per video
  vision_api.py review   <work>                         # judge every T##_strip -> resolve.py -> blueprint.py redo
  vision_api.py vision   <work>                         # fill raw/vision.json from sheets/strips (chunked)
  vision_api.py dossier  <work> --brief <brief.md>      # globals into vision.json + style_dossier.md
  vision_api.py all      <work> --brief <brief.md>      # review, vision, finish, dossier
  vision_api.py synth    <out_dir> --brief <brief.md> <work> [<work> ...]   # merge dossiers into one style system
Every call is logged with tokens and $ in <work>/raw/api_usage.json.
"""
import argparse
import base64
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

MODEL = "claude-fable-5-2"
# $ per token (Fable 5.2: $8 in / $40 out per MTok, cache write 1.25x, cache read $0.20)
P_IN, P_OUT, P_CW, P_CR = 8e-6, 40e-6, 10e-6, 0.2e-6
CHUNK_SHOTS = 28
CHUNK_STRIPS = 40
TRANSITION_TYPES = ["cut", "sudden_jump", "dissolve", "fade", "wipe", "push", "slide", "zoom", "doorway",
                    "whip_pan", "match_cut", "glitch", "flash", "light_leak", "other"]

SYSTEM = (
    "You are a senior motion designer and video editor reverse-engineering finished videos into production "
    "blueprints. Measured data (frames, times, OCR text, words, camera flow, palette) comes from tools and is "
    "exact - never contradict it; you add what needs eyes. Be concrete enough that a motion designer could "
    "rebuild each shot in code. When you cannot tell, write null or 'unsure' rather than guess. "
    "Reply with one JSON object only, no prose, no code fence."
)

_client = None


def client():
    global _client
    if _client is None:
        import anthropic
        _client = anthropic.Anthropic(max_retries=4)
    return _client


def jload(p, default=None):
    p = Path(p)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default


def jsave(p, obj):
    Path(p).write_text(json.dumps(obj, indent=1, ensure_ascii=False), encoding="utf-8")


def img(path):
    data = base64.standard_b64encode(Path(path).read_bytes()).decode("ascii")
    return {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": data}}


def txt(s, cache=False):
    b = {"type": "text", "text": s}
    if cache:
        b["cache_control"] = {"type": "ephemeral"}
    return b


def parse_json(text):
    s = text.strip()
    a, b = s.find("{"), s.rfind("}")
    if a < 0 or b < 0:
        raise ValueError("no JSON object in reply")
    return json.loads(s[a:b + 1])


def cost_of(u):
    return (u.get("input_tokens", 0) * P_IN + u.get("output_tokens", 0) * P_OUT
            + u.get("cache_creation_input_tokens", 0) * P_CW + u.get("cache_read_input_tokens", 0) * P_CR)


def log_usage(work, label, usage, model):
    p = Path(work) / "raw" / "api_usage.json"
    d = jload(p, {"calls": []})
    row = {"label": label, "model": model, "t": time.strftime("%Y-%m-%d %H:%M:%S"), **usage}
    row["usd"] = round(cost_of(usage), 4)
    d["calls"].append(row)
    d["total_usd"] = round(sum(c["usd"] for c in d["calls"]), 4)
    jsave(p, d)
    print(f"  [{label}] in {usage.get('input_tokens', 0)} (+cache r{usage.get('cache_read_input_tokens', 0)}"
          f"/w{usage.get('cache_creation_input_tokens', 0)}) out {usage.get('output_tokens', 0)}  ${row['usd']:.3f}"
          f"  (video total ${d['total_usd']:.2f})", flush=True)


def ask(work, label, content, max_tokens=64000, effort="high"):
    """One streamed Fable call; returns parsed JSON. Retries once on unparseable output."""
    for attempt in (1, 2):
        with client().beta.messages.stream(
            model=MODEL, max_tokens=max_tokens, system=SYSTEM,
            messages=[{"role": "user", "content": content}],
            output_config={"effort": effort},
            betas=["server-side-fallback-2026-07-01"], fallbacks="default",
        ) as stream:
            msg = stream.get_final_message()
        u = msg.usage
        usage = {k: getattr(u, k, 0) or 0 for k in
                 ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")}
        log_usage(work, label + ("" if attempt == 1 else "-retry"), usage, msg.model)
        if msg.stop_reason == "refusal":
            raise RuntimeError(f"{label}: refused ({getattr(msg.stop_details, 'category', None)})")
        text = "".join(b.text for b in msg.content if b.type == "text")
        if msg.stop_reason == "max_tokens":
            print(f"  [{label}] hit max_tokens", flush=True)
        try:
            return parse_json(text)
        except (ValueError, json.JSONDecodeError) as e:
            print(f"  [{label}] reply not JSON ({e}); retrying" if attempt == 1 else f"  [{label}] still not JSON",
                  flush=True)
            (Path(work) / "raw" / f"api_{label}_raw.txt").write_text(text, encoding="utf-8")
    raise RuntimeError(f"{label}: no valid JSON after retry")


# ---------- measured context ----------

class W:
    def __init__(self, root):
        self.root = Path(root)
        self.raw = self.root / "raw"
        self.kf = self.root / "keyframes"
        self.probe = jload(self.root / "probe.json", {})

    def j(self, name, default=None):
        return jload(self.raw / f"{name}.json", default)


def r(x, n=2):
    return round(float(x), n) if isinstance(x, (int, float)) else x


def shot_context(w, sid, shot, cam, pal, ocr, words):
    t0, t1 = shot["t_in"], shot["t_out"]
    c = cam.get(sid, {})
    p = pal.get(sid, {})
    texts = sorted({o["text"] for o in ocr if o["t_in"] < t1 and o["t_out"] > t0})
    said = " ".join(x["w"] for x in words if x["t_in"] < t1 and x["t_out"] > t0)
    return {
        "t": [r(t0), r(t1)], "dur_s": r(t1 - t0),
        "camera": {"totals": c.get("totals"), "movement": c.get("movement"), "tracking_quality": r(c.get("tracking_quality", 0))},
        "palette": [x["hex"] for x in p.get("palette", [])[:5]],
        "tone": {k: r(v, 1) for k, v in (p.get("tone") or {}).items()},
        "ocr_text": texts[:12], "voice": said,
    }


def global_context(w):
    words = w.j("words", {})
    beats = w.j("beats", {})
    sec = w.j("sections", {})
    pro = w.j("prosody", {})
    rhy = w.j("rhythm", {})
    sfx = w.j("sfx", {})
    return {
        "probe": {k: w.probe.get(k) for k in ("width", "height", "fps", "duration", "duration_s", "frames") if k in w.probe},
        "transcript": " ".join(s["text"].strip() for s in words.get("segments", [])),
        "pace_wpm": words.get("pace_wpm"),
        "music": {"bpm": beats.get("bpm"), "key": sec.get("key_estimate"),
                  "sections": sec.get("librosa_sections") or sec.get("sections")},
        "voice": {"pitch_median_hz": pro.get("speaker_pitch_median_hz"), "register": pro.get("register_guess"),
                  "emphasis": [e["w"] for e in (pro.get("emphasis") or [])[:25]],
                  "pauses": len(pro.get("pauses") or [])},
        "rhythm": {k: rhy.get(k) for k in ("avg_shot_len_s", "median_shot_len_s", "rules_inferred")},
        "sfx_events": [{"t": r(e["t"]), "type": e.get("type"), "guess": e.get("clap_guess"), "db": r(e.get("level_db"), 1)}
                       for e in (sfx.get("events") or [])][:80],
    }


# ---------- review ----------

def build_review_requests(w):
    S = w.j("shots")
    trans = S["transitions"]
    notes = " | ".join(S.get("review", []))
    reqs = []
    for c0 in range(0, len(trans), CHUNK_STRIPS):
        chunk = trans[c0:c0 + CHUNK_STRIPS]
        content = [txt(
            "Each image is a strip of frames across one detected shot boundary of a 9:16 video. Detectors: "
            "PySceneDetect (hard cuts) and OmniShotCut (gradual transitions; it often mislabels stylised in-shot "
            "motion graphics - an element zooming, a counter changing, a caption swap, a light sweep - as a "
            "'zoom'/'wipe'/'dissolve'). For EVERY boundary decide:\n"
            "- keep: a real cut/transition of the listed type\n"
            "- retype: a real cut/transition but another type; give `type` from " + json.dumps(TRANSITION_TYPES) + "\n"
            "- merge: NOT a shot change (same shot continues; an animation inside it); give `as`, a short "
            "snake_case effect name (zoom_punch, element_swap, light_sweep, caption_swap, counter_change, ...)\n"
            "Rule of thumb for motion-graphics videos: if the background, layout and main subject persist and "
            "only elements animate, it is merge. If the whole frame changes to a new composition, it is a cut "
            "or transition.\nDetector notes: " + (notes or "none") + "\n"
            'Reply: {"T01": {"verdict": "keep|retype|merge", "type": null, "as": null, "why": "<8 words>"}, ...} '
            "covering exactly the ids shown.")]
        for i, t in enumerate(chunk, start=c0 + 1):
            tid = f"T{i:02d}"
            strip = w.kf / f"{tid}_strip.jpg"
            meta = {k: t.get(k) for k in ("type", "frame_start", "frame_end", "duration_frames", "confidence", "source")}
            content.append(txt(f"{tid} {t['from']}->{t['to']}: {json.dumps(meta)}"))
            if strip.exists():
                content.append(img(strip))
        reqs.append(content)
    return reqs


def do_review(w, py):
    S = w.j("shots")
    if not S["transitions"]:
        print("  no transitions to review")
        return
    if (w.raw / "api_review.json").exists():
        print("  review already applied (raw/api_review.json) - skipping")
        return
    verdicts = {}
    for n, content in enumerate(build_review_requests(w), 1):
        verdicts.update(ask(w.root, f"review{n}", content, max_tokens=16000, effort="medium"))
    args = []
    merges = {k: v for k, v in verdicts.items() if v.get("verdict") == "merge"}
    retypes = {k: v for k, v in verdicts.items() if v.get("verdict") == "retype" and v.get("type") in TRANSITION_TYPES}
    for k, v in retypes.items():
        args += ["--retype", k, "--type", v["type"]]
    for k, v in sorted(merges.items(), reverse=True):
        args += ["--merge", k, "--as", (v.get("as") or "in_shot_effect").replace(" ", "_")]
    args += ["--clear-review", "--note", "Fable 5.2 API review"]
    jsave(w.raw / "api_review.json", {"verdicts": verdicts, "resolve_args": args})
    print(f"  verdicts: {len(verdicts)}  merge {len(merges)}  retype {len(retypes)}", flush=True)
    subprocess.run([py, str(HERE / "resolve.py"), str(w.root)] + args, check=True, stdin=subprocess.DEVNULL)
    subprocess.run([py, str(HERE / "blueprint.py"), "redo", str(w.root)], check=True, stdin=subprocess.DEVNULL)


# ---------- vision ----------

MOTION_STEP_S, MOTION_COLS, MOTION_ROWS, MOTION_W = 1.0, 4, 3, 240
MAX_IMAGES = 80


def motion_sheets(w, sid, t0, t1):
    """Dense contact sheets (one frame per MOTION_STEP_S, labelled with time) for shots longer than 3 s,
    so long motion-graphics scenes are seen between their start/mid/end keyframes."""
    if t1 - t0 <= 3.0:
        return []
    tag = f"{sid}_{int(round(t0 * 1000))}"
    out = sorted(w.kf.glob(f"{tag}_motion_*.jpg"))
    if out:
        return out
    import cv2
    from PIL import Image, ImageDraw, ImageFont
    cap = cv2.VideoCapture(w.probe.get("proxy") or w.probe["file"])
    times, t = [], t0 + 0.5
    while t < t1 - 0.2:
        times.append(t)
        t += MOTION_STEP_S
    frames = []
    for tt in times:
        cap.set(cv2.CAP_PROP_POS_MSEC, tt * 1000)
        ok, fr = cap.read()
        if not ok:
            continue
        im = Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
        im = im.resize((MOTION_W, round(MOTION_W * im.height / im.width)))
        d = ImageDraw.Draw(im)
        try:
            font = ImageFont.truetype("arial.ttf", 18)
        except OSError:
            font = ImageFont.load_default()
        d.rectangle([0, 0, 70, 24], fill=(255, 230, 0))
        d.text((4, 2), f"{tt:.1f}s", fill=(0, 0, 0), font=font)
        frames.append(im)
    cap.release()
    per = MOTION_COLS * MOTION_ROWS
    for n in range(0, len(frames), per):
        group = frames[n:n + per]
        fw, fh = group[0].size
        rows = -(-len(group) // MOTION_COLS)
        sheet = Image.new("RGB", (fw * MOTION_COLS + 4 * (MOTION_COLS - 1), fh * rows + 4 * (rows - 1)), (255, 0, 255))
        for k, im in enumerate(group):
            sheet.paste(im, ((k % MOTION_COLS) * (fw + 4), (k // MOTION_COLS) * (fh + 4)))
        p = w.kf / f"{tag}_motion_{n // per + 1:02d}.jpg"
        sheet.save(p, quality=82)
        out.append(p)
    return out


def build_vision_requests(w):
    todo = w.j("vision.todo")
    S = w.j("shots")
    shots = {s["id"]: s for s in S["shots"]}
    cam = (w.j("camera_flow", {}) or {}).get("shots", {})
    pal = w.j("palette", {}) or {}
    ocr = (w.j("ocr", {}) or {}).get("tracks", [])
    words = (w.j("words", {}) or {}).get("words", [])
    shot_form = next(iter(todo["shots"].values())) if todo["shots"] else {}
    tmpl = {k: v for k, v in shot_form.items() if k not in ("sheet", "t")}
    prefix = [img(w.kf / "storyboard.jpg"), txt(
        "Storyboard of the whole video above. Measured context for the whole video:\n"
        + json.dumps(global_context(w), ensure_ascii=False)
        + "\n\nFill the vision form for the shots in this request. Per shot, fields = "
        + json.dumps(tmpl) + "\nshot_scale options: " + json.dumps(todo.get("_shot_scale_options"))
        + "\nGuidance: description = what is on screen and what changes start->mid->end. graphic_layers = every "
        "drawn element (objects, cards, charts, icons, characters) with hex colours from the palette and the "
        "animation you infer. For pseudo-3D (2.5D) drawings say HOW the depth is faked: projection (isometric 30deg, "
        "oblique, 2-point), face shading (top/left/right lightness), extrusion depth, drop/contact shadows, highlights, "
        "layering/parallax. text_animation = how each text enters/leaves. camera_semantic must agree with the measured "
        "camera (static camera + moving elements = layer animation). Transitions: looks_like in a few words + notes.",
        cache=True)]
    sids = list(todo["shots"].keys())
    motion = {sid: motion_sheets(w, sid, shots[sid]["t_in"], shots[sid]["t_out"]) for sid in sids}
    chunks, cur, n_img = [], [], 0
    for sid in sids:
        k = 2 + len(motion[sid])  # sheet + strip + motion sheets
        if cur and (len(cur) >= CHUNK_SHOTS or n_img + k > MAX_IMAGES):
            chunks.append(cur)
            cur, n_img = [], 0
        cur.append(sid)
        n_img += k
    if cur:
        chunks.append(cur)
    reqs = []
    for chunk in chunks:
        content = list(prefix)
        tids = []
        for sid in chunk:
            content.append(txt(f"{sid}: " + json.dumps(shot_context(w, sid, shots[sid], cam, pal, ocr, words), ensure_ascii=False)))
            sheet = w.kf / f"{sid}_sheet.jpg"
            if sheet.exists():
                content.append(img(sheet))
            if motion[sid]:
                content.append(txt(f"{sid} motion sheets: one frame every {MOTION_STEP_S:g} s, time in the yellow tag. "
                                   "Use them to list every element swap, camera step and caption change inside the shot "
                                   "(add a `beats` list to the shot: [{\"t\": s, \"what\": \"...\"}])."))
                content.extend(img(p) for p in motion[sid])
        for tid, tv in todo.get("transitions", {}).items():
            t = S["transitions"][int(tid[1:]) - 1]
            if t["from"] in chunk:
                tids.append(tid)
                content.append(txt(f"{tid} {t['from']}->{t['to']} measured {t.get('type')} {t.get('duration_frames')}f"))
                strip = w.kf / f"{tid}_strip.jpg"
                if strip.exists():
                    content.append(img(strip))
        content.append(txt('Reply: {"shots": {"' + chunk[0] + '": {<fields>}, ...}, "transitions": {"'
                           + (tids[0] if tids else "T01") + '": {"looks_like": "...", "notes": "..."}, ...}} for '
                           f"shots {chunk[0]}..{chunk[-1]} and transitions {tids[0] + '..' + tids[-1] if tids else '(none)'}."))
        reqs.append(content)
    return reqs


def do_vision(w):
    todo = w.j("vision.todo")
    out = w.raw / "vision.json"
    vis = jload(out) if out.exists() else json.loads(json.dumps(todo))
    for n, content in enumerate(build_vision_requests(w), 1):
        res = ask(w.root, f"vision{n}", content, max_tokens=64000, effort="high")
        for sid, v in (res.get("shots") or {}).items():
            if sid in vis["shots"]:
                vis["shots"][sid].update({k: v[k] for k in v if k not in ("sheet", "t")})
        for tid, v in (res.get("transitions") or {}).items():
            if tid in vis.get("transitions", {}):
                vis["transitions"][tid].update(v)
        jsave(out, vis)
    filled = sum(1 for s in vis["shots"].values() if s.get("description"))
    print(f"  vision.json: {filled}/{len(vis['shots'])} shots described", flush=True)


# ---------- dossier ----------

def build_dossier_request(w, brief):
    vis = jload(w.raw / "vision.json")
    todo_globals = {k: vis.get(k) for k in ("video_type", "narrative", "overall_style", "voice_tone", "music_mood",
                                            "text_fonts", "object_prompts")}
    S = w.j("shots")
    rhy = w.j("rhythm", {})
    ocr = (w.j("ocr", {}) or {}).get("tracks", [])
    data = {
        "measured": global_context(w),
        "shots": [{"id": s["id"], "t": [r(s["t_in"]), r(s["t_out"])]} for s in S["shots"]],
        "transitions": [{k: t.get(k) for k in ("from", "to", "type", "duration_frames")} for t in S["transitions"]],
        "text_to_voice": (rhy.get("text_to_voice") or [])[:60],
        "ocr": [{"text": o["text"], "t": [r(o["t_in"]), r(o["t_out"])], "bbox": [r(x, 3) for x in o.get("bbox_norm", [])]}
                for o in ocr][:150],
        "vision_shots": vis["shots"], "vision_transitions": vis.get("transitions", {}),
    }
    return [img(w.kf / "storyboard.jpg"), txt(
        "Blueprint data of one reference video (measured + per-shot vision notes):\n" + json.dumps(data, ensure_ascii=False)
        + "\n\nTask 1 - fill these global vision fields (same keys/shape as given; text_fonts: per text string a "
        "classification-level font guess, font_confirmed stays false; object_prompts: {} for pure graphics): "
        + json.dumps(todo_globals, ensure_ascii=False)
        + "\n\nTask 2 - write a style dossier in Markdown following this brief:\n" + brief
        + '\n\nReply: {"globals": {...}, "dossier_md": "<markdown>"}')]


def do_dossier(w, brief):
    res = ask(w.root, "dossier", build_dossier_request(w, brief), max_tokens=64000, effort="medium")
    vis = jload(w.raw / "vision.json")
    for k, v in (res.get("globals") or {}).items():
        if k in vis:
            vis[k] = v
    jsave(w.raw / "vision.json", vis)
    (w.root / "style_dossier.md").write_text(res.get("dossier_md", ""), encoding="utf-8")
    print(f"  style_dossier.md written ({len(res.get('dossier_md', ''))} chars)", flush=True)


# ---------- synthesis ----------

def do_synth(out_dir, brief, works):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "raw").mkdir(exist_ok=True)
    content = [txt("Style dossiers of " + str(len(works)) + " reference videos from one creator follow.")]
    for wk in works:
        w = W(wk)
        d = (w.root / "style_dossier.md")
        rh = w.j("rhythm", {})
        content.append(txt(f"\n\n=== {w.root.name} (avg shot {rh.get('avg_shot_len_s')} s) ===\n"
                           + (d.read_text(encoding="utf-8") if d.exists() else "(missing)")))
        if (w.kf / "storyboard.jpg").exists():
            content.append(img(w.kf / "storyboard.jpg"))
    content.append(txt("\n\nMerge them into ONE style system following this brief:\n" + brief
                       + '\n\nReply: {"style_system_md": "<markdown>", "scene_templates": [...], '
                       '"motion_tokens": {...}, "sound_profile": {...}, "quality_gates": [...]}'))
    res = ask(out_dir, "synth", content, max_tokens=64000, effort="high")
    (out_dir / "style_system.md").write_text(res.pop("style_system_md", ""), encoding="utf-8")
    jsave(out_dir / "style_system.json", res)
    print(f"  wrote {out_dir / 'style_system.md'} and style_system.json", flush=True)


# ---------- estimate ----------

def count(content):
    return client().messages.count_tokens(model=MODEL, system=SYSTEM,
                                          messages=[{"role": "user", "content": content}]).input_tokens


def do_estimate(works):
    grand = 0.0
    for wk in works:
        w = W(wk)
        if not (w.raw / "vision.todo.json").exists():
            print(f"{w.root.name}: analysis not finished yet")
            continue
        rv = build_review_requests(w)
        vi = build_vision_requests(w)
        n_shots = len(w.j("vision.todo")["shots"])
        n_tr = len(w.j("shots")["transitions"])
        tin_rev = sum(count(c) for c in rv)
        tin_vis = sum(count(c) for c in vi)
        # outputs incl. thinking (rough): review 60 tok/boundary + 2k think; vision 450 tok/shot + 4k think/chunk
        out_rev = n_tr * 60 + 2000 * len(rv)
        out_vis = n_shots * 450 + 4000 * len(vi)
        tin_dos, out_dos = 25000 + n_shots * 500, 14000
        usd = (tin_rev + tin_vis + tin_dos) * P_IN + (out_rev + out_vis + out_dos) * P_OUT
        usd *= 0.85 if n_shots > CHUNK_SHOTS else 1.0  # storyboard/context prefix cached across vision chunks
        grand += usd
        print(f"{w.root.name}: {n_shots} shots, {n_tr} boundaries | input review {tin_rev} + vision {tin_vis} "
              f"+ dossier ~{tin_dos} tok | est. ${usd:.2f}")
    print(f"TOTAL est. ${grand:.2f}  (review after redo may shrink shot count -> vision cost lower)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["estimate", "review", "vision", "dossier", "all", "synth"])
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--brief")
    a = ap.parse_intermixed_args()
    py = sys.executable
    brief = Path(a.brief).read_text(encoding="utf-8") if a.brief else ""
    if a.cmd == "estimate":
        return do_estimate(a.paths)
    a.paths = [str(Path(p).resolve()) for p in a.paths]
    if a.cmd == "synth":
        return do_synth(a.paths[0], brief, a.paths[1:])
    for wk in a.paths:
        wk = str(Path(wk).resolve())
        w = W(wk)
        print(f"== {w.root.name}: {a.cmd}", flush=True)
        if a.cmd in ("review", "all"):
            do_review(w, py)
            w = W(wk)
        if a.cmd in ("vision", "all"):
            do_vision(w)
        if a.cmd in ("dossier", "all"):
            do_dossier(w, brief)
        if a.cmd == "all":
            subprocess.run([py, str(HERE / "blueprint.py"), "finish", str(w.root)], check=False, stdin=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
