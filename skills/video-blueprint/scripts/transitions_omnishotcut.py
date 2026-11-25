"""Step 2: shot ranges + transition class with OmniShotCut (MIT, checkpoint v1.5 from HF).

usage: transitions_omnishotcut.py <workdir> [--max-fps 30] [--overlap 10]
writes: raw/transitions.json (normalised for shots.py) and raw/omnishotcut_raw.json

OmniShotCut returns ordered segments. A "General" segment is a shot; any other intra label
(Dissolve, Wipes, Push, Slide, Zoom, Fade, Doorway) is a transition segment between two shots.
The inter label says how a segment relates to the previous one (Hard_Cut, Sudden_Jump, ...).
It was trained on synthetic transitions, so stylised real-world transitions can be mislabelled;
whip pans are folded into "Slide" by its label map.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402

TYPE = {"Dissolve": "dissolve", "Wipes": "wipe", "Push": "push", "Slide": "slide", "Zoom": "zoom",
        "Fade": "fade", "Doorway": "doorway"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--max-fps", type=float, default=30.0,
                    help="subsample high-frame-rate video before inference; indices map back")
    ap.add_argument("--overlap", type=int, default=10)
    ap.add_argument("--checkpoint", default="uva-cv-lab/OmniShotCut_v1.5")
    a = ap.parse_args()
    w = Work(a.workdir)
    fps, N = w.probe["fps"], w.probe["frames"]

    import subprocess

    import numpy as np
    import omnishotcut

    model = omnishotcut.load(a.checkpoint, filename="OmniShotCut_ckpt.pth")
    args = model._model_args
    pw, ph = args.process_width, args.process_height
    # Own decode: OmniShotCut's helper passes -vsync, which FFmpeg 8+ removed (-fps_mode replaces it).
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(w.video), "-fps_mode", "passthrough",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{pw}x{ph}", "pipe:"],
                         check=True, capture_output=True).stdout
    vid = np.frombuffer(raw, np.uint8).reshape(-1, ph, pw, 3)
    step = max(1, round(fps / a.max_fps))
    sub = vid[::step]
    ranges, intra, inter = model.inference(sub, mode="default", overlap=a.overlap)
    full = lambda f: min(N - 1, int(f) * step)  # noqa: E731

    segs = [{"frame_start": full(r[0]), "frame_end": min(N - 1, full(r[1]) + step - 1),
             "intra": il, "inter": rl} for r, il, rl in zip(ranges, intra, inter) if il != "Padding"]
    w.save("omnishotcut_raw", {"checkpoint": a.checkpoint, "step": step, "segments": segs})

    shots, transitions = [], []
    for i, s in enumerate(segs):
        if s["intra"] == "General":
            if shots and (not segs[i - 1] or segs[i - 1]["intra"] == "General"):
                # two shots back to back: a cut (hard cut or a jump cut inside one source)
                b = s["frame_start"]
                jump = s["inter"] == "Sudden_Jump"
                transitions.append({"frame_start": b, "frame_end": b, "boundary_frame": b,
                                    "type": "sudden_jump" if jump else "cut", "relation": s["inter"],
                                    "confidence": 0.76 if jump else 0.8})
            shots.append({"frame_in": s["frame_start"], "frame_out": s["frame_end"]})
        else:
            transitions.append({"frame_start": s["frame_start"], "frame_end": s["frame_end"],
                                "boundary_frame": (s["frame_start"] + s["frame_end"] + 1) // 2,
                                "type": TYPE.get(s["intra"], "other"), "relation": s["inter"],
                                "confidence": 0.63})
    w.save("transitions", {"tool": "OmniShotCut", "checkpoint": a.checkpoint, "shots": shots,
                           "transitions": transitions})
    kinds = {}
    for t in transitions:
        kinds[t["type"]] = kinds.get(t["type"], 0) + 1
    log(f"omnishotcut: {len(shots)} shots, transitions {kinds}")


if __name__ == "__main__":
    main()
