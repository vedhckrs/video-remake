"""Step 6 (default camera pass): dominant 2D motion per shot from optical flow (OpenCV).

Runs on CPU in seconds and works on Windows. Gives pan / tilt / zoom (push-pull) / roll / static,
handheld shake RMS, an ease profile, and whip-pan candidates at the cuts.
It does NOT recover a 3D camera path or focal length: that is MegaSaM's job (optional, see
references/tools.md). In motion-graphics videos the "camera" found here is the dominant layer move.

usage: camera_flow.py <workdir> [--width 320]
reads: raw/shots.json   writes: raw/camera_flow.json
"""
import argparse
import math
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402


def affine_step(prev, cur):
    pts = cv2.goodFeaturesToTrack(prev, maxCorners=300, qualityLevel=0.01, minDistance=7, blockSize=7)
    if pts is None or len(pts) < 12:
        return None
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, pts, None, winSize=(21, 21), maxLevel=3)
    ok = st.ravel() == 1
    if ok.sum() < 10:
        return None
    p0, p1 = pts[ok].reshape(-1, 2), nxt[ok].reshape(-1, 2)
    M, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=2.0)
    if M is None:
        return None
    s = math.hypot(M[0, 0], M[1, 0])
    rot = math.degrees(math.atan2(M[1, 0], M[0, 0]))
    mag = float(np.median(np.linalg.norm(p1 - p0, axis=1)))
    inlier = float(inl.mean()) if inl is not None else 0.0
    return M[0, 2], M[1, 2], s, rot, mag, inlier


_orb = None


def direct_affine(a, b):
    """First->last frame registration with ORB + RANSAC. Animated layers change between the two
    frames, so their features stop matching and the static set/background wins - unlike
    frame-to-frame flow, where a scrolling chart or counter can dominate every step."""
    global _orb
    _orb = _orb or cv2.ORB_create(2000)
    ka, da = _orb.detectAndCompute(a, None)
    kb, db = _orb.detectAndCompute(b, None)
    if da is None or db is None or len(ka) < 20 or len(kb) < 20:
        return None
    m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(da, db)
    if len(m) < 15:
        return None
    p0 = np.float32([ka[x.queryIdx].pt for x in m])
    p1 = np.float32([kb[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=3.0)
    if M is None or inl is None or inl.sum() < 12:
        return None
    s = math.hypot(M[0, 0], M[1, 0])
    return M[0, 2], M[1, 2], math.log(max(s, 1e-6)), math.degrees(math.atan2(M[1, 0], M[0, 0])), float(inl.mean())


def ease_of(speed):
    n = len(speed)
    if n < 9:
        return "n/a"
    a, b, c = (float(np.mean(speed[i * n // 3:(i + 1) * n // 3])) for i in range(3))
    peak = max(a, b, c) or 1e-9
    a, b, c = a / peak, b / peak, c / peak
    if b > 0.8 and a < 0.6 and c < 0.6:
        return "ease-in-out"
    if a < 0.6 <= c:
        return "ease-in (accelerating)"
    if c < 0.6 <= a:
        return "ease-out (decelerating)"
    return "linear"


def classify(dx, dy, ds, dr, fps_eff, wpx, direct=None):
    """dx, dy in frame-widths per step; ds log-scale per step; dr degrees per step.
    `direct` = (pan, tilt, zoom, roll) from first->last registration; when present it sets the totals."""
    T = len(dx) / fps_eff if len(dx) else 0
    tot = {"pan": float(np.sum(dx)), "tilt": float(np.sum(dy)),
           "zoom": float(np.sum(ds)), "roll": float(np.sum(dr))}
    if direct is not None:
        tot = dict(zip(("pan", "tilt", "zoom", "roll"), map(float, direct)))
    moves = []
    if abs(tot["pan"]) > 0.04:
        moves.append({"type": "pan_right" if tot["pan"] < 0 else "pan_left",  # content moves left => camera pans right
                      "amount_frame_widths": round(abs(tot["pan"]), 3)})
    if abs(tot["tilt"]) > 0.04:
        moves.append({"type": "tilt_down" if tot["tilt"] < 0 else "tilt_up",
                      "amount_frame_widths": round(abs(tot["tilt"]), 3)})
    if abs(tot["zoom"]) > 0.025:
        moves.append({"type": "push_in" if tot["zoom"] > 0 else "pull_out",
                      "scale_change": round(math.exp(tot["zoom"]), 3)})
    if abs(tot["roll"]) > 2.0:
        moves.append({"type": "roll", "degrees": round(tot["roll"], 1)})
    # shake = high-frequency residual after a 9-step moving average, in source pixels
    shake = 0.0
    if len(dx) > 12:
        k = np.ones(9) / 9
        rx = np.cumsum(dx) - np.convolve(np.cumsum(dx), k, mode="same")
        ry = np.cumsum(dy) - np.convolve(np.cumsum(dy), k, mode="same")
        shake = float(np.sqrt(np.mean(rx[5:-5] ** 2 + ry[5:-5] ** 2)) * wpx) if len(rx) > 10 else 0.0
    # Shake from frame-to-frame flow is polluted by animated layers; a locked frame (direct registration
    # finds no move) with jittery flow is layer animation, not a handheld camera.
    locked = direct is not None and abs(tot["pan"]) < 0.02 and abs(tot["tilt"]) < 0.02 and abs(tot["zoom"]) < 0.015
    if shake > 3.0 and not locked:
        moves.append({"type": "handheld", "shake_rms_px": round(shake, 2)})
    if not moves:
        moves.append({"type": "static"})
    speed = np.hypot(dx, dy) + np.abs(ds)
    for m in moves:
        if m["type"] not in ("static", "handheld"):
            m["speed"] = ease_of(speed)
    return moves, round(shake, 2), tot, T


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--width", type=int, default=320)
    a = ap.parse_args()
    w = Work(a.workdir)
    fps, wpx = w.probe["fps"], w.probe["width"]
    S = w.load("shots")
    step = max(1, round(fps / 30))  # analyse at ~30 fps
    fps_eff = fps / step

    cap = cv2.VideoCapture(str(w.video))
    per_frame = {}  # frame -> (dx, dy, dlogs, rot, mag, inlier, sharp)
    prev, idx = None, 0
    shot_of = {}
    for sh in S["shots"]:
        for f in range(sh["frame_in"], sh["frame_out"] + 1):
            shot_of[f] = sh["id"]
    prev_shot = None
    ends = {}  # shot -> [first gray, last gray] at 640 px for direct registration
    while True:
        ok, img = cap.read()
        if not ok:
            break
        if idx % step == 0:
            g = cv2.cvtColor(cv2.resize(img, (a.width, int(a.width * img.shape[0] / img.shape[1]))), cv2.COLOR_BGR2GRAY)
            sharp = float(cv2.Laplacian(g, cv2.CV_64F).var())
            sid = shot_of.get(idx)
            if sid is not None:
                big = cv2.cvtColor(cv2.resize(img, (640, int(640 * img.shape[0] / img.shape[1]))), cv2.COLOR_BGR2GRAY)
                ends.setdefault(sid, [big, big])[1] = big
            if prev is not None:
                r = affine_step(prev, g)
                if r is not None:
                    tx, ty, s, rot, mag, inl = r
                    per_frame[idx] = (tx / a.width, ty / a.width, math.log(max(s, 1e-6)), rot, mag / a.width, inl, sharp,
                                      sid != prev_shot)
                else:
                    per_frame[idx] = (0, 0, 0, 0, float("nan"), 0, sharp, sid != prev_shot)
            prev, prev_shot = g, sid
        idx += 1
    cap.release()

    out = {"tool": "OpenCV LK flow + partial affine", "analysis_fps": round(fps_eff, 3), "shots": {}, "transitions": {}}
    for sh in S["shots"]:
        fr = [f for f in range(sh["frame_in"] + step, sh["frame_out"] + 1) if f in per_frame and not per_frame[f][7]]
        if not fr:
            out["shots"][sh["id"]] = {"movement": [{"type": "static"}], "note": "too short to measure"}
            continue
        arr = np.array([per_frame[f][:6] for f in fr], dtype=float)
        dx, dy, ds, dr = arr[:, 0], arr[:, 1], arr[:, 2], arr[:, 3]
        direct = None
        if sh["id"] in ends:
            r = direct_affine(*ends[sh["id"]])
            if r is not None and r[4] > 0.3:
                direct = (r[0] / 640, r[1] / 640, r[2], r[3])
        moves, shake, tot, T = classify(dx, dy, ds, dr, fps_eff, wpx, direct)
        for m in moves:
            m["t_in"], m["t_out"] = sh["t_in"], sh["t_out"]
        out["shots"][sh["id"]] = {
            "movement": moves, "shake_rms_px": shake,
            "totals": {k: round(v, 4) for k, v in tot.items()},
            "tracking_quality": round(float(np.nanmean(arr[:, 5])), 2),
            "totals_source": "first->last frame registration (ORB)" if direct is not None
            else "integrated frame-to-frame flow (registration failed - may include layer motion)",
            "series": [{"f": int(f), "t": f2t(f, fps), "dx": round(float(per_frame[f][0]), 5),
                        "dy": round(float(per_frame[f][1]), 5), "dlogs": round(float(per_frame[f][2]), 5)}
                       for f in fr[::max(1, len(fr) // 40)]],
        }

    mags = np.array([v[4] for v in per_frame.values() if not math.isnan(v[4])])
    med = float(np.median(mags)) if len(mags) else 0.0
    for i, tr in enumerate(S["transitions"]):
        lo, hi = tr["frame_start"] - 4 * step, tr["frame_end"] + 4 * step
        win = [(f, v) for f, v in per_frame.items() if lo <= f <= hi and not v[7]]
        if not win:
            continue
        peak = max((v[4] for _, v in win if not math.isnan(v[4])), default=0.0)
        sharp_min = min(v[6] for _, v in win)
        sharp_med = float(np.median([v[6] for v in per_frame.values()]))
        whip = bool(peak > max(0.02, 4 * med) and sharp_min < 0.5 * sharp_med)
        out["transitions"][f"T{i + 1:02d}"] = {"flow_peak": round(peak, 4), "flow_median": round(med, 4),
                                               "sharpness_drop": round(sharp_min / (sharp_med or 1), 3),
                                               "whip_pan_candidate": whip}
    w.save("camera_flow", out)
    log(f"camera_flow: {len(out['shots'])} shots measured")


if __name__ == "__main__":
    main()
