"""Shorts/Reels safe-area check by OCR (Ved, 25 Nov 2026: the YouTube username / description cover the bottom).

usage (run with the OCR env: <VB>\\envs\\ocr\\Scripts\\python.exe):
  safe_check.py <video.mp4> [--fps 2] [--bottom 0.85] [--top 0.08] [--min-h 0.016] [--json out.json]
Samples frames, finds text with PaddleOCR 3.x (same setup as video-blueprint's ocr stage) and reports READABLE text
(box height >= --min-h of the frame; tiny decorative micro-labels are ignored) that sits in a zone the apps cover:
  FAIL  bottom: any part below --bottom (the username, description and music rows)
  FAIL  top:    any part above --top (back / search / menu icons)
  info  right:  in the action-button column (x > 86 %, y 50-86 %), listed but not failed
Exit code 1 when a FAIL zone has text. Text that is meant to be there (none in our videos) would need --bottom/--top.
"""
import argparse
import json
import os
import sys

os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
import cv2  # noqa: E402


def get(res, key):
    try:
        return res[key]
    except Exception:
        return res.json["res"][key]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=2.0)
    ap.add_argument("--bottom", type=float, default=0.85)
    ap.add_argument("--top", type=float, default=0.08)
    ap.add_argument("--min-h", type=float, default=0.016)
    ap.add_argument("--min-score", type=float, default=0.6)
    ap.add_argument("--max-side", type=int, default=1280)
    ap.add_argument("--min-samples", type=int, default=2, help="text must be seen this often in a zone to count")
    ap.add_argument("--max-h", type=float, default=0.10, help="taller boxes are texture, not text")
    ap.add_argument("--json")
    a = ap.parse_args()
    from paddleocr import PaddleOCR
    kw = dict(lang="en", use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False)
    try:
        ocr = PaddleOCR(device="gpu", **kw)
    except Exception:
        ocr = PaddleOCR(device="cpu", **kw)
    cap = cv2.VideoCapture(a.video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 60
    step = max(1, round(fps / a.fps))
    hits = {"bottom": [], "top": [], "right": []}
    n = i = 0
    while True:
        ok, img = cap.read()
        if not ok:
            break
        if i % step == 0:
            n += 1
            sc = min(1.0, a.max_side / max(img.shape[:2]))
            small = cv2.resize(img, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) if sc < 1 else img
            hh, ww = small.shape[:2]
            for res in ocr.predict(small):
                for t, s, b in zip(get(res, "rec_texts"), get(res, "rec_scores"), get(res, "rec_boxes")):
                    if s < a.min_score or not t.strip():
                        continue
                    x1, y1, x2, y2 = float(b[0]) / ww, float(b[1]) / hh, float(b[2]) / ww, float(b[3]) / hh
                    if y2 - y1 < a.min_h:
                        continue
                    rec = {"t": round(i / fps, 2), "text": t.strip(), "box": [round(v, 3) for v in (x1, y1, x2, y2)]}
                    if y2 > a.bottom:
                        hits["bottom"].append(rec)
                    if y1 < a.top:
                        hits["top"].append(rec)
                    if x2 > 0.86 and y2 > 0.50 and y1 < 0.86:
                        hits["right"].append(rec)
        i += 1
    cap.release()
    # keep only text that STAYS in a zone: seen in >= --min-samples samples (one-sample sightings are animations
    # passing through or OCR noise); boxes taller than --max-h are texture false positives (e.g. "www" on a pixel grid)
    def persistent(lst):
        lst = [r for r in lst if r["box"][3] - r["box"][1] <= a.max_h]
        cnt = {}
        for r in lst:
            cnt[r["text"].lower()] = cnt.get(r["text"].lower(), 0) + 1
        return [r for r in lst if cnt[r["text"].lower()] >= a.min_samples], [r for r in lst if cnt[r["text"].lower()] < a.min_samples]
    hits["bottom"], tb = persistent(hits["bottom"])
    hits["top"], tt = persistent(hits["top"])
    rep = {"frames_checked": n, "sample_fps": a.fps, "zones": {"bottom": a.bottom, "top": a.top, "min_h": a.min_h},
           "bottom": hits["bottom"], "top": hits["top"], "right_info": hits["right"], "transient_ignored": tb + tt,
           "pass": not hits["bottom"] and not hits["top"]}
    for z in ("bottom", "top"):
        print(f"{'PASS' if not hits[z] else 'FAIL'}  readable text in the {z} zone: {len(hits[z])}")
        for r in hits[z][:12]:
            print(f"      {r['t']:6.2f}s  '{r['text']}'  box {r['box']}")
    print(f"info  text under the right-side buttons: {len(hits['right'])} sightings "
          f"({len({r['text'] for r in hits['right']})} different texts)")
    print(f"[video-remake] safe-area check on {n} frames: {'PASS' if rep['pass'] else 'FAIL'}")
    if a.json:
        open(a.json, "w", encoding="utf-8").write(json.dumps(rep, indent=1, ensure_ascii=False))
    sys.exit(0 if rep["pass"] else 1)


if __name__ == "__main__":
    main()
