"""Write raw/vision.todo.json: the form Claude fills while looking at the keyframe sheets.

usage: vision_template.py <workdir>
Claude reads keyframes/S01_sheet.jpg ... and keyframes/T01_strip.jpg ..., fills every field it can
see, and saves the result as raw/vision.json (same shape). Fields Claude cannot judge stay null.
These are descriptions (confidence "vlm"), never the source of timing - timing comes from the scripts.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log, write_json  # noqa: E402

SHOT_SCALES = ["extreme_wide", "wide", "medium_wide", "medium", "medium_close", "close_up",
               "extreme_close_up", "insert", "graphic_fullscreen", "screen_recording", "split_screen"]


def main(workdir):
    w = Work(workdir)
    S = w.load("shots")
    K = w.load("keyframes", {"shots": {}, "transitions": {}})
    O = (w.load("ocr", {}) or {}).get("tracks") or []
    todo = {
        "_how": "Look at each sheet/strip, fill the fields, save as raw/vision.json. Keep null when unsure.",
        "_shot_scale_options": SHOT_SCALES,
        "video_type": None,  # e.g. "motion-graphics explainer Short", "talking-head reel", "product ad"
        "narrative": [{"section": "hook", "t_in": 0.0, "t_out": None, "purpose": None}],
        "overall_style": {"look": None, "typography_system": None, "colour_story": None, "brand_marks": None},
        "voice_tone": None,     # from transcript + delivery numbers in raw/prosody.json
        "music_mood": None,
        "shots": {},
        "transitions": {},
        "text_fonts": {},       # text -> font guess ("condensed grotesk, heavy"); font_confirmed stays false
        "object_prompts": {},   # shot id -> ["noun", ...] for SAM 3 (only things worth tracking)
    }
    for sh in S["shots"]:
        sid = sh["id"]
        todo["shots"][sid] = {
            "sheet": K["shots"].get(sid, {}).get("sheet"),
            "t": [sh["t_in"], sh["t_out"]],
            "shot_scale": None, "description": None,
            "subjects": [],          # [{"label": "...", "where": "right third"}]
            "composition": {"rule": None, "headroom": None, "safe_zone": None},
            "lighting": {"key": None, "rim": None, "ratio_est": None},
            "grade_look": None,      # "teal-orange", "warm pastel", "high-key clean"...
            "dof": None,
            "graphic_layers": [],    # [{"type": "underline_bar", "color": "#F25C2A", "anim": "scale_x 0->1"}]
            "text_animation": [],    # [{"text": "...", "in": "slide_up", "out": "cut"}]
            "effects": [],           # [{"type": "light_sweep", "t": 0.33}] in-shot flashes, glows, shakes
            "camera_semantic": None,  # what the move reads as: "slow push-in", "orbit", "parallax layers"
        }
    for tid, t in (K.get("transitions") or {}).items():
        todo["transitions"][tid] = {"strip": t.get("strip"), "looks_like": None, "notes": None,
                                    "match_cut_candidate": t.get("match_cut_candidate")}
    for tr in O:
        if len(tr["text"]) >= 3:
            todo["text_fonts"].setdefault(tr["text"], None)
    write_json(w.raw / "vision.todo.json", todo)
    log(f"vision template: {len(todo['shots'])} shots, {len(todo['transitions'])} transitions -> raw/vision.todo.json")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
