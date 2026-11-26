"""script.json + vo_words.json + recipe.json -> project.json (every frame decided, nothing drawn yet).

usage: plan_timeline.py <project dir> [--tail 1.2]

Rules taken from the recipe (so the new video edits like the reference):
- scene boundaries sit in the voice's pauses (midpoint of the gap between the last word of one scene
  and the first word of the next) when the reference's transitions follow the voice;
- transition type: the script's choice, else iris where the background flips dark<->light and the
  reference's in-act type (usually dissolve) inside an act; length = the reference's median frames;
- captions: pages split at punctuation (max 6 words), each word shown `lead_ms` before it is spoken,
  keyword styles from the script;
- SFX: a whoosh/swish on each soft transition at the reference's offset, plus the script's word hits;
- music level from the reference's music-to-voice ratio.
Each scene gets `cues`: frame (relative to its start) of every word, keyed "w:<word>" (first use) and "i:<n>".

script.json "style": "explainer" (keyframes-explainer style library) also builds: 2-4-word caption phrases in the
explainer caption mode, the presenter track (entry 3-7 s, a pose on every phrase boundary from keyword rules,
scene "poses" overrides and an explain-pose cycle so no pose holds > 4 s, mouth timing from the voice), the
progress rail from scene "chapter" labels (videos > 60 s) and the explainer theme. recipe.json defaults to
references/styles/keyframes-explainer/recipe.json when the project has none.

Landscape 16:9 (26 Nov 2026): an explainer script whose "output" is wider than tall (e.g. 1920x1080 @ 60) is planned
on a 1920x1080 design canvas (the recipe's canvas turned on its side, so render.py renders it at scale 1): captions
become a lower third (36 px, anchor "bottom", y 0.84), the world sits centred with no Shorts safe-area shift
(safe focusY 0.5 / zoom 1 / fadeTo 0) and transition origins default to the frame centre. Portrait is unchanged.
Any scene may carry "credit": "<source>" - passed through as spec.credit, the engine draws "Source: <source>"
bottom-right for that scene (kit SourceCredit).
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import ENGINE, project_paths  # noqa: E402

DEFAULT_THEME = {
    "dark": {"bg": "#08090B", "fg": "#F2F2F0", "mute": "#6E7074", "grid": "#2A2C31", "card": "#15171B", "cardBorder": "#2A2D33"},
    "light": {"bg": "#E6E7DD", "fg": "#18181A", "mute": "#9A9B94", "grid": "#C9CBBF", "card": "#FBFBF7", "cardBorder": "#D9DBD0"},
    "accent": "#22A55B", "accent2": "#E5484D", "select": {"fill": "#C8D3E1", "border": "#4468BA"},
    "fontSans": "Inter", "fontSerif": "Instrument Serif", "fontMono": "JetBrains Mono",
}


def clean(w):
    return re.sub(r"[^\w%$+#.-]", "", w.lower()).strip(".")


# ---------------------------------------------------------------------------------------------- explainer
EXPLAINER_THEME = {
    "dark": {"bg": "#0E0F11", "fg": "#FFFFFF", "mute": "#8E9196", "grid": "rgba(255,255,255,0.045)", "card": "#1A1C21",
             "cardBorder": "rgba(255,255,255,0.08)"},
    "light": {"bg": "#F6F7F9", "fg": "#0E0F11", "mute": "#6B6E73", "grid": "rgba(14,15,17,0.06)", "card": "#FFFFFF",
              "cardBorder": "rgba(14,15,17,0.08)"},
    "accent": "#3B8CFF", "accent2": "#DC1E30", "select": {"fill": "rgba(59,140,255,0.16)", "border": "#3B8CFF"},
    "fontSans": "Poppins", "fontSerif": "Instrument Serif", "fontMono": "JetBrains Mono",
}

# same rules as kit/explainer/presenter.tsx autoPose (keep in sync)
POSE_RULES = [
    (r"^(you|your|yours|youre)$", "point_viewer"), (r"^(why|how|what|really)$", "chin_rub"),
    (r"^(huge|massive|hundreds|thousands|millions|billions|everything|all)$", "arms_wide"),
    (r"^(tiny|small|just|only|little)$", "pinch"), (r"^(no|never|stop|zero|nothing|cant|cannot)$", "stop_palm"),
    (r"^(works|yes|win|wins|done|faster|better|free)$", "thumbs_up"), (r"^(slow|wait|seconds|years|time|latency)$", "wrist_tap"),
    (r"^(crash|crashes|fails|broken|useless|lost)$", "facepalm"), (r"^(one|first)$", "count_1"), (r"^(two|second)$", "count_2"),
    (r"^(three|third)$", "count_3"), (r"^(wow|insane|crazy|shocking)$", "hands_on_cheeks"),
]
CYCLE = ["open_palm", "point_up_left", "level_hand", "point_up_right", "listen", "point_left", "chop", "point_right"]


def auto_pose(word):
    w = re.sub(r"[^a-z0-9]", "", word.lower())
    for rx, pose in POSE_RULES:
        if re.match(rx, w):
            return pose
    return None


def _norm(w):
    return re.sub(r"[^\w]", "", w.lower())


def add_explainer(project, script, scenes_w, pages, F, TS, W, total, fps, land=False):
    """Presenter track, explainer captions, rail and theme (all presenter times in DESIGN frames)."""
    D = lambda f: round(f / TS, 2)  # noqa: E731  output frame -> design frame
    project["style"] = "explainer"
    project["theme"] = json.loads(json.dumps(EXPLAINER_THEME))
    project["captions"]["mode"] = "explainer"
    if land:
        _landscape_frame(project, script)
    else:
        _portrait_frame(project, script, W)
    _explainer_tracks(project, script, scenes_w, pages, F, TS, total, fps, D)


def _landscape_frame(project, script):
    """Landscape 16:9 long-form (26 Nov 2026): no Shorts/Reels UI to dodge. Captions are a centred lower third -
    `y` is the top of the LAST line (one line 84-88.1 %, two lines 79.9-88.1 % of the height at 36 px on a 1080-high
    frame; Ved 26 Nov 2026: smaller and above the YouTube player's control bar, which covers the bottom ~10 %) - and the world is shown 1:1 around the frame centre with no dark top fade. Same override keys as portrait:
    "caption_size", "caption_y", "safe" (partial dicts merge), plus "caption_anchor" ("top" puts the phrases back in a
    top band: then also give "safe": {"fadeTo": 0.2}) and "caption_scrim" (0..1 lower-third gradient, default 0.75)."""
    H = project["canvas"]["height"]
    cap = project["captions"]
    cap["size"] = int(round(script.get("caption_size") or 36 * H / 1080))
    cap["anchor"] = script.get("caption_anchor", "bottom")
    cap["y"] = script.get("caption_y", 0.84 if cap["anchor"] == "bottom" else 0.07)
    if script.get("caption_scrim") is not None:
        cap["scrim"] = script["caption_scrim"]
    project["safe"] = {"focusY": 0.5, "zoom": 1, "fadeTo": 0, **(script.get("safe") or {})}


def _portrait_frame(project, script, W):
    # Shorts/Reels safe area (Ved, 25 Nov 2026): captions 20 % smaller than the original 68 px (54 px on 1080 wide) and
    # world framing lifted + zoomed out so key content sits between the captions and 85 % of the height (the bottom
    # 15 % carries the app's username / description / music). Override in script.json: "caption_size", "safe".
    project["captions"]["size"] = int(round(script.get("caption_size") or 54 * W / 1080))
    # Higher framing - the default since 25 Nov 2026 (Ved on six-agents v1: "why above blank area ... shift all visual
    # above", then "Yes, make it default"): captions start at 11.5 % (end ~18.5 %), worlds land their anchor at 44 % of
    # the height, 0.86x, and the dark top caption fade ends at 21 % -> visuals ~20-84 % of the height, bottom 15 % clear.
    # Was caption_y 0.165 + safe {0.50, 0.82} (content ~26-84 %). Override per video in script.json ("caption_y",
    # "safe" - partial dicts are merged over these defaults).
    project["captions"]["y"] = script.get("caption_y", 0.115)
    project["safe"] = {"focusY": 0.44, "zoom": 0.86, "fadeTo": 0.21, **(script.get("safe") or {})}


def _explainer_tracks(project, script, scenes_w, pages, F, TS, total, fps, D):
    project.pop("handle", None)
    words = [w for ws in scenes_w for w in ws]
    add_beats(project, script, scenes_w, F, TS)
    pz = script.get("presenter") or {}
    if not pz.get("enabled"):
        # Ved, 24 Nov 2026: no presenter. The world fills the frame; enable with "presenter": {"enabled": true}.
        project.pop("presenter", None)
        _rail(project, script, D, total, fps)
        return
    # entry: end of the first sentence, clamped to 3-7 s (absent during the hook)
    first_end = next((w["end"] for w in words if re.search(r"[.?!]$", w["w"])), 4.0)
    enter = D(F(pz.get("enter_s", min(7.0, max(3.0, first_end)))))
    overrides = {}   # word start (s) -> pose, from scene "poses": [{"word": ..., "pose": ...}]
    for sc, ws in zip(script["scenes"], scenes_w):
        for o in sc.get("poses") or []:
            for w in ws:
                if _norm(w["w"]) == _norm(o["word"]) and round(w["start"], 3) not in overrides:
                    overrides[round(w["start"], 3)] = o["pose"]
                    break
    first_pose = pz.get("enter_pose", "wave")
    cues = [{"t": enter, "pose": first_pose}]
    last_pose, last_t, ci = first_pose, enter, 0
    for pg in pages:
        t_page = pg["words"][0]["frame"]
        if D(t_page) < enter + 8:
            continue
        pose = None
        for w in pg["words"]:
            st = next((x["start"] for x in words if F(x["start"]) >= w["frame"]), None)
            if st is not None and round(st, 3) in overrides:
                pose = overrides[round(st, 3)]
                break
        if pose is None:
            pose = next((p for p in (auto_pose(w["w"]) for w in pg["words"]) if p), None)
        tD = D(t_page) - 1.5   # onset 2-4 frames @60 before the phrase (matches the caption lead)
        if pose is None:
            if tD - last_t < 36:   # automatic swaps at most every ~1.2 s; keyword poses always fire
                continue
            pose = CYCLE[ci % len(CYCLE)]
            ci += 1
            if pose == last_pose:
                pose = CYCLE[ci % len(CYCLE)]
                ci += 1
        if pose == last_pose and tD - last_t < 120:
            continue
        cues.append({"t": round(max(tD, last_t + 6), 2), "pose": pose})
        last_pose, last_t = pose, max(tD, last_t + 6)
    if pz.get("outro_pose", "wave"):
        cues.append({"t": round(D(F(words[-1]["start"])) - 2, 2), "pose": pz.get("outro_pose", "wave")})
    cues.sort(key=lambda c: c["t"])
    # nothing holds longer than ~3.7 s (110 design frames)
    filled = []
    for i, c in enumerate(cues):
        filled.append(c)
        nxt = cues[i + 1]["t"] if i + 1 < len(cues) else D(total)
        t = c["t"] + 110
        while t < nxt - 20:
            filled.append({"t": round(t, 2), "pose": CYCLE[ci % len(CYCLE)]})
            ci += 1
            t += 110
    project["presenter"] = {
        "enter": enter, "cues": filled, "anchor": pz.get("anchor", "center"), "widthFrac": pz.get("width_frac", 0.56),
        "talk": [[D(F(w["start"])), D(F(w["end"]))] for w in words],
        "hide": pz.get("hide", []),
    }
    _rail(project, script, D, total, fps)


def _rail(project, script, D, total, fps):
    # The progress rail (HUD line at 10.5 % of the height) is OFF by default since 25 Nov 2026: with the higher
    # captions (11.5 %) it would sit on top of them, and every world shows its own subject. Opt in with
    # "rail": true in script.json (and move the captions back down, e.g. "caption_y": 0.165).
    if not script.get("rail"):
        return
    chapters = [{"t": D(project["scenes"][i]["from"]), "label": sc["chapter"]}
                for i, sc in enumerate(script["scenes"]) if sc.get("chapter")]
    if chapters and total / fps > 60:
        project["rail"] = {"chapters": chapters}


# ---------------------------------------------------------------------------------------------- word beats
# Ved, 24 Nov 2026: "each word spoken I want a visual change - camera zoom and animation and new world design".
STOP = set("""the a an of to and or in on at for with is are was were be been it its it's that that's as by from this these
those so but then than into your you you're they their them we our i my me he she his her do does did has have had can will
would could should there here what's let's let us up out about over just very also""".split())
NUM_WORDS = set("""zero one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred hundreds
thousand thousands million millions billion billions trillion half double triple""".split())
ACTIONS = set("""push pushes pull fill fills filled empty emptied refill refilled stack stacks split splits spread spreads write
writes written read reads move moves moved open opens follow save saved saves reach reaches drop drops flow flows cut cuts zoom
grow grows shrink shrinks leak leaks wear wears cheat cheats shuffle shuffled store stored stores trap traps trapped hold holds
live lives send sends build building built stopped stop start starts run runs jump jumps turn turns rewrite rewrites rewrites,
spin spins break breaks burn burns copy copies delete hit hits find finds look looks""".split())
STATES = set("""tiny small big huge fast faster slow slower empty full flat modern greedy cheap cheaper single every least worn new
old quietly constantly parallel same different more less high low hot cold bright dark smaller bigger dead alive typical""".split())


def _clean(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def add_beats(project, script, scenes_w, F, TS):
    """A beat for every content word (at its spoken frame, 1 design frame early), typed for the director:
    number | action | state | object (+ 'drift' fillers so nothing is still > 0.6 s). strength 1-3."""
    D = lambda f: round(f / TS, 2)  # noqa: E731
    beats = []
    for sc_script, spec, ws in zip(script["scenes"], project["scenes"], scenes_w):
        kw = {_clean(k) for k, v in (sc_script.get("keywords") or {}).items() if v == "select"}
        over = {_clean(b["word"]): b for b in sc_script.get("beats") or []}
        start = D(spec["from"])
        mine = []
        for j, w in enumerate(ws):
            c = _clean(w["w"])
            if not c or (c in STOP and c not in over):
                continue
            if re.search(r"\d", c) or c in NUM_WORDS:
                kind = "number"
            elif c in ACTIONS or c.rstrip("s") in ACTIONS:
                kind = "action"
            elif c in STATES:
                kind = "state"
            else:
                kind = "object"
            strength = 1
            if kind in ("number", "action") or len(c) > 6:
                strength = 2
            if c in kw or kind == "number" or re.search(r"[.?!]$", w["w"]):
                strength = 3
            b = {"t": round(D(F(w["start"])) - start - 1, 2), "w": w["w"], "word": c, "kind": kind, "s": strength, "i": j}
            if c in over:
                b.update({k: v for k, v in over[c].items() if k != "word"})
            mine.append(b)
        # fill holes so the picture never rests > 0.6 s (18 design frames)
        dur = D(spec["to"] - spec["from"])
        filled, last = [], 0.0
        for b in mine + [{"t": dur}]:
            while b["t"] - last > 18:
                last += 14
                filled.append({"t": round(last, 2), "w": "", "word": "", "kind": "drift", "s": 1})
            if "kind" in b:
                filled.append(b)
                last = b["t"]
        spec["beats"] = filled
        beats += [{**b, "scene": spec["id"], "abs": round(b["t"] + start, 2)} for b in filled]
    project["beats"] = {"count": len(beats), "words": sum(1 for b in beats if b["kind"] != "drift"),
                        "per_s": round(len(beats) / max(1, D(project["durationInFrames"]) / 30), 2)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--tail", type=float, default=1.2, help="seconds after the last word")
    a = ap.parse_args()
    P = project_paths(a.project)
    script = json.loads((P.proj / "script.json").read_text(encoding="utf-8"))
    explainer = script.get("style") == "explainer"
    rp = P.proj / "recipe.json"
    if not rp.exists() and explainer:
        src = Path(__file__).resolve().parent.parent / "references" / "styles" / "keyframes-explainer" / "recipe.json"
        rp.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    rec = json.loads(rp.read_text(encoding="utf-8"))
    vw = json.loads((P.proj / "vo_words.json").read_text(encoding="utf-8"))["words"]
    base = rec["canvas"]["fps"]                      # design fps: scene code + cues are written in these units
    W, H = rec["canvas"]["width"], rec["canvas"]["height"]
    out = script.get("output") or {}
    fps = int(out.get("fps") or base)                 # render fps (e.g. 60 for fluid motion)
    # Landscape 16:9 (26 Nov 2026): output wider than tall. The explainer library's recipe canvas is 9:16, so the
    # design canvas is turned on its side (1080x1920 -> 1920x1080: same px density, text sizes come from the short side).
    land = (int(out.get("width") or W) > int(out.get("height") or H)) if out.get("width") else W > H
    if explainer and land and W < H:
        W, H = H, W
    TS = fps / base  # output frames per design frame
    lead = rec["captions"].get("lead_ms", 50) / 1000
    F = lambda s: int(round(s * fps))  # noqa: E731

    # ---- split the voice words back into scenes (same whitespace tokens as the script text)
    scenes_w, k = [], 0
    for s in script["scenes"]:
        n = len(s["text"].split())
        scenes_w.append(vw[k:k + n])
        k += n
    if k != len(vw):
        sys.exit(f"word count mismatch: script has {k} words, voice has {len(vw)} - regenerate the voice")

    total = F(vw[-1]["end"] + a.tail)
    bounds = [0]
    for i in range(1, len(scenes_w)):
        prev_end, nxt = scenes_w[i - 1][-1]["end"], scenes_w[i][0]["start"]
        bounds.append(F((prev_end + nxt) / 2))
    bounds.append(total)

    med = rec["transitions"].get("median_frames") or {}
    counts = rec["transitions"].get("counts") or {}
    in_act = max((t for t in counts if t not in ("iris", "cut")), key=lambda t: counts[t], default="dissolve")
    flip_type = "iris" if counts.get("iris") else in_act

    theme = json.loads(json.dumps(DEFAULT_THEME))
    theme["dark"]["bg"] = rec["acts"].get("dark_bg", theme["dark"]["bg"])
    theme["light"]["bg"] = rec["acts"].get("light_bg", theme["light"]["bg"])
    for k2, v2 in (script.get("theme") or {}).items():
        if isinstance(v2, dict) and k2 in theme:
            theme[k2].update(v2)
        else:
            theme[k2] = v2

    scenes, pages, sfx = [], [], []
    for i, (s, ws) in enumerate(zip(script["scenes"], scenes_w)):
        fr, to = bounds[i], bounds[i + 1]
        prev_bg = script["scenes"][i - 1]["bg"] if i else s["bg"]
        if i == 0:
            ttype = "cut"
        else:
            ttype = s.get("transition") or (flip_type if s["bg"] != prev_bg else in_act)
        frames = 0 if ttype == "cut" else int(round((s.get("transition_frames") or med.get(ttype) or 10) * TS))
        frames = max(0, min(frames, (to - fr) // 2, (fr - bounds[i - 1]) // 2 if i else 0)) if ttype != "cut" else 0
        cues = {}  # in DESIGN frames (base fps), relative to the scene start
        for j, w in enumerate(ws):
            rel = round((F(w["start"]) - fr) / TS, 2)
            cues[f"i:{j}"] = rel
            cues.setdefault(f"w:{clean(w['w'])}", rel)
        spec = {"id": s["id"], "from": fr, "to": to, "bg": s["bg"],
                "transitionIn": {"type": ttype, "frames": frames, "origin": s.get("origin", [0.5, 0.5] if explainer and land else [0.5, 0.42])},
                "props": s.get("props", {}), "cues": cues}
        if s.get("credit"):   # "Source: <credit>" bottom-right for this scene (engine: kit SourceCredit)
            spec["credit"] = str(s["credit"])
        scenes.append(spec)

        # captions
        kw = {clean(k3): v3 for k3, v3 in (s.get("keywords") or {}).items()}
        chunk = []
        for j, w in enumerate(ws):
            chunk.append(w)
            maxw = s.get("max_words", rec["captions"].get("max_words", 4 if explainer else 6))
            end_here = bool(re.search(r"[,.?!:;]$", w["w"])) or len(chunk) >= maxw or j == len(ws) - 1
            if end_here:
                words_ = [{"w": x["w"], "frame": max(fr - 1, F(x["start"] - lead)),
                           "style": kw.get(clean(x["w"]), "normal")} for x in chunk]
                # at most ONE keyword box per phrase (QA gate): a repeated keyword ("row by row.") boxes only once
                boxed = False
                for wd in words_:
                    if wd["style"] != "normal":
                        if boxed:
                            wd["style"] = "normal"
                        boxed = True
                pages.append({"from": max(fr - 1, F(chunk[0]["start"] - lead)), "to": None, "words": words_, "_scene_end": to})
                chunk = []
        # sfx: transition + word hits - PREVIEW ONLY inside Remotion; the final soundtrack is built by sound_design.py
        # (earshot) and replaces this audio. Use a plain public/<id>/sfx/<role>.wav, else earshot's first take
        # <role>_1.wav, else skip - a missing file makes Remotion's render fail (404) at that frame (fps-explainer, 25 Nov 2026).
        def sfx_file(role):
            for cand in (role, f"{role}_1", "whoosh_in_1" if role == "whoosh" else None):
                if cand and (P.pub / "sfx" / f"{cand}.wav").exists():
                    return f"{P.id}/sfx/{cand}.wav"
            return None
        sx = rec["sfx"]
        if ttype in ("iris", "zoom", "push", "slide") or (ttype == "dissolve" and sx.get("transitions_with_sfx", 0) >= 0.4):
            name = "whoosh" if ttype != "dissolve" else "swish"
            src = sfx_file(name)
            if src:
                sfx.append({"src": src, "frame": max(0, fr - frames // 2 + F(sx.get("median_offset_ms_vs_transition", -250) / 1000)),  # vs transition start
                            "volume": 0.32 if name == "whoosh" else 0.22, "type": name})
        for hit in s.get("hits") or []:
            src = sfx_file(hit["sfx"]) if "word" in hit else None
            if not src:
                continue
            key = f"w:{clean(hit['word'])}"
            if key in cues:
                sfx.append({"src": src, "frame": max(0, fr + int(round((cues[key] + hit.get("offset", 0)) * TS))),
                            "volume": hit.get("volume", 0.4), "type": hit["sfx"]})

    for i, p in enumerate(pages):  # a page stays until the next page starts or its scene ends
        nxt = pages[i + 1]["from"] if i + 1 < len(pages) else total
        p["to"] = min(nxt, p.pop("_scene_end")) - 1

    level = rec["music"].get("level_vs_voice") or 0.2
    project = {
        "id": P.id, "title": script.get("title", P.id),
        "canvas": {"width": W, "height": H, "fps": fps}, "baseFps": base,
        "output": {"width": int(out.get("width") or W), "height": int(out.get("height") or H)},
        "durationInFrames": total, "theme": theme,
        "handle": script.get("handle"),
        "audio": {"vo": f"{P.id}/vo.mp3", "voVolume": 1.0,
                  "music": {"src": f"{P.id}/music.wav", "volume": round(max(0.06, min(0.35, level * 0.8)), 3), "fadeOutFrames": F(1.0)}
                  if (P.pub / "music.wav").exists() else None,
                  "sfx": sorted(sfx, key=lambda x: x["frame"])},
        "captions": {"y": script.get("caption_y", rec["captions"]["y"]),
                     "size": int(script.get("caption_size") or max(28, rec["captions"]["size_px"] * 1.0)),
                     "pages": pages},
        "scenes": scenes,
    }
    if project["audio"]["music"] is None:
        del project["audio"]["music"]
    if explainer:
        add_explainer(project, script, scenes_w, pages, F, TS, W, total, fps, land=land)
    (P.proj / "project.json").write_text(json.dumps(project, indent=2, ensure_ascii=False), encoding="utf-8")
    lens = [(s["to"] - s["from"]) / fps for s in scenes]
    tr = {}
    for s in scenes[1:]:
        tr[s["transitionIn"]["type"]] = tr.get(s["transitionIn"]["type"], 0) + 1
    print(f"[video-remake] timeline {W}x{H}{' landscape' if land else ''} @ {fps} fps (design {base}): {total / fps:.2f} s, {len(scenes)} scenes (avg {sum(lens) / len(lens):.2f} s), "
          f"transitions {tr}, {len(pages)} caption pages, {len(sfx)} sfx -> {P.proj / 'project.json'}")


if __name__ == "__main__":
    main()
