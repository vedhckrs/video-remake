"""Camera-motion smoothness from a rendered video (Ved: "not frame jiggle and hand-like camera jump every frame").

usage: camera_motion.py <video> [--fps 30] [--json out.json]
Camera velocity per frame (pan x/y + zoom %) from tracked corners (Lucas-Kanade) and a RANSAC partial-affine fit,
so objects that animate on their own are outliers; frames whose fit is unreliable (< 50 % inliers) hold the last
value. Then, optionally skipping +-0.4 s around scene cuts (transitions blend two worlds on purpose):
  jiggle_rms / jiggle_per_min  shake = distance of the velocity from its own 9-frame smoothed path
  reversals_per_min            frames where the camera's direction flips while moving (hand-held feel)
  moving_share, mean_speed     how much and how fast the camera moves
Used by qa_explainer.py (gates: jiggle rms <= 0.9 and reversals <= 6/min). Calibration: SSD v2 (Ved: "camera
jump too much") rms 4.70 / 41.8 per min; v3 (approved) rms 0.75 / 3.6 per min.
"""
import argparse
import json
import subprocess

import cv2
import numpy as np


def frames(path, fps=30, w=180):
    h = int(w * 16 / 9)
    r = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", str(path), "-vf", f"fps={fps},scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                       capture_output=True, stdin=subprocess.DEVNULL)
    return np.frombuffer(r.stdout, dtype=np.uint8).reshape(-1, h, w)


def motion(path, fps=30):
    """Camera velocity per frame: tracked corners (Lucas-Kanade) + RANSAC partial-affine fit (pan + zoom).
    Objects that animate on their own are RANSAC outliers, flashes/colour changes do not move corners, so this
    measures the CAMERA, like video-blueprint's camera_flow stage. Frames with too few tracks count as still."""
    F = frames(path, fps, w=270)
    v = []
    for a, b in zip(F[:-1], F[1:]):
        pts = cv2.goodFeaturesToTrack(a, maxCorners=400, qualityLevel=0.01, minDistance=6)
        if pts is None or len(pts) < 25:
            v.append((0.0, 0.0, 0.0)); continue
        nxt, st, _ = cv2.calcOpticalFlowPyrLK(a, b, pts, None, winSize=(21, 21), maxLevel=3)
        good = st.reshape(-1) == 1
        if good.sum() < 25:
            v.append((0.0, 0.0, 0.0)); continue
        M, inl = cv2.estimateAffinePartial2D(pts[good], nxt[good], method=cv2.RANSAC, ransacReprojThreshold=1.5)
        if M is None or inl is None or inl.sum() < 20 or inl.sum() < 0.5 * good.sum():
            # unreliable fit (cross-fading layers, most points moving on their own): no camera estimate - hold
            v.append(v[-1] if v else (0.0, 0.0, 0.0)); continue
        scale = float(np.sqrt(M[0, 0] ** 2 + M[1, 0] ** 2))
        v.append((float(M[0, 2]) * 180 / 270, float(M[1, 2]) * 180 / 270, (scale - 1) * 100))
    return np.array(v)


def _smooth(v, k=9):
    pad = np.pad(v, ((k // 2, k // 2), (0, 0)), mode="edge")
    ker = np.ones(k) / k
    return np.stack([np.convolve(pad[:, j], ker, mode="valid") for j in range(v.shape[1])], axis=1)


def metrics(path, fps=30, v=None, cuts=None, guard=0.4):
    """cuts: scene-boundary times (s); +-guard s around each is skipped (transitions blend two worlds on purpose)."""
    v = motion(path, fps) if v is None else v
    if cuts:
        keep = np.ones(len(v), bool)
        for c in cuts:
            keep[max(0, int((c - guard) * fps)):int((c + guard) * fps)] = False
        v = v[keep]
    mins = len(v) / fps / 60
    spd = np.linalg.norm(v, axis=1)
    resid = np.linalg.norm(v - _smooth(v), axis=1)       # shake around the camera's own smooth path
    jiggle = resid > 1.2                                 # px (180-wide frame) or % zoom per frame
    rev = sum(1 for a, b in zip(v[:-1], v[1:]) if np.linalg.norm(a) > 0.35 and np.linalg.norm(b) > 0.35 and float(np.dot(a, b)) < 0)
    return {"seconds": round(len(v) / fps, 2), "jiggle_per_min": round(int(jiggle.sum()) / mins, 1), "jiggle_rms": round(float(np.sqrt((resid ** 2).mean())), 3),
            "reversals_per_min": round(rev / mins, 1), "moving_share": round(float((spd > 0.25).mean()), 3), "mean_speed": round(float(spd.mean()), 3)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--json")
    a = ap.parse_args()
    m = metrics(a.video, a.fps)
    print(json.dumps(m))
    if a.json:
        open(a.json, "w").write(json.dumps(m, indent=1))
