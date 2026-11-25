"""Step 1: hard-cut and fade candidates with PySceneDetect 0.7.x.

usage: cuts.py <workdir> [--threshold 3.0]
writes: raw/scenes.json, raw/scenedetect_stats.csv
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402

from scenedetect import AdaptiveDetector, ThresholdDetector, detect  # noqa: E402


def frame_of(tc) -> int:
    for attr in ("frame_num", "get_frames"):
        v = getattr(tc, attr, None)
        if v is not None:
            return int(v() if callable(v) else v)
    raise AttributeError("FrameTimecode has no frame accessor")


def secs_of(tc) -> float:
    for attr in ("seconds", "get_seconds"):
        v = getattr(tc, attr, None)
        if v is not None:
            return float(v() if callable(v) else v)
    raise AttributeError("FrameTimecode has no seconds accessor")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--threshold", type=float, default=3.0, help="AdaptiveDetector adaptive_threshold")
    ap.add_argument("--min-scene-len", type=int, default=6, help="frames")
    a = ap.parse_args()
    w = Work(a.workdir)
    fps = w.probe["fps"]

    stats = w.raw / "scenedetect_stats.csv"
    scenes = detect(str(w.video), AdaptiveDetector(adaptive_threshold=a.threshold,
                                                   min_scene_len=a.min_scene_len),
                    stats_file_path=str(stats))
    shots = []
    for i, (s, e) in enumerate(scenes):
        fi, fo = frame_of(s), frame_of(e) - 1  # end is exclusive in PySceneDetect
        shots.append({"id": f"S{i + 1:02d}", "frame_in": fi, "frame_out": fo,
                      "t_in": round(secs_of(s), 6), "t_out": round(secs_of(e), 6)})
    if not shots:  # a single-shot video
        n = w.probe["frames"]
        shots = [{"id": "S01", "frame_in": 0, "frame_out": n - 1, "t_in": 0.0,
                  "t_out": w.probe["duration_s"]}]

    # Fades to/from black: a separate pass, used later to type transitions.
    fades = []
    try:
        fscenes = detect(str(w.video), ThresholdDetector(threshold=12, fade_bias=0.0))
        for s, e in fscenes[1:]:
            fades.append({"frame": frame_of(s), "t": round(secs_of(s), 6)})
    except Exception as ex:  # fade pass is a hint only
        log(f"fade pass skipped: {ex}")

    cuts = [{"frame": sh["frame_in"], "t": sh["t_in"]} for sh in shots[1:]]
    w.save("scenes", {"tool": "PySceneDetect AdaptiveDetector", "fps": fps,
                      "shots": shots, "cuts": cuts, "fade_events": fades})
    log(f"cuts: {len(cuts)} cuts, {len(shots)} shots, {len(fades)} fade events")


if __name__ == "__main__":
    main()
