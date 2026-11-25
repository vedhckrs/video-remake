"""Step 4: on-screen text with PaddleOCR 3.x, merged into text tracks with frame-exact in/out.

usage: ocr.py <workdir> [--fps 4] [--max-side 1280] [--min-score 0.6] [--lang en] [--device gpu|cpu]
writes: raw/ocr.json

Track = {text, t_in, t_out, frame_in, frame_out, bbox_norm, bbox_path, score, readings}.
In/out are found at the sampling rate, then refined to the exact frame by watching the pixels
inside the text box change (the frame with the largest change is the switch) in ONE extra pass.
Captions that build up word by word ("3" -> "3 reasons" -> "3 reasons hain,") are grouped into
one caption with `reveal: word_by_word` and its steps.
"""
import argparse
import difflib
import os
import sys
from pathlib import Path

os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
import cv2  # noqa: E402
import numpy as np  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402


def get(res, key):
    try:
        return res[key]
    except Exception:
        return res.json["res"][key]


def iou(a, b):
    x1, y1, x2, y2 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / u if u > 0 else 0.0


def norm(s):
    return " ".join(s.lower().replace(" ", "").split()) if len(s) < 3 else " ".join(s.lower().split())


def same_place(b1, b2):
    cy1, cy2 = (b1[1] + b1[3]) / 2, (b2[1] + b2[3]) / 2
    return iou(b1, b2) > 0.2 or (abs(cy1 - cy2) < 0.04 and min(b1[2], b2[2]) > max(b1[0], b2[0]) - 0.05)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--fps", type=float, default=4.0, help="sampling rate for OCR")
    ap.add_argument("--max-side", type=int, default=1280)
    ap.add_argument("--min-score", type=float, default=0.6)
    ap.add_argument("--lang", default="en")
    ap.add_argument("--device", default="gpu")
    ap.add_argument("--no-refine", action="store_true")
    a = ap.parse_args()
    w = Work(a.workdir)
    P = w.probe
    fps, W, H, N = P["fps"], P["width"], P["height"], P["frames"]

    from paddleocr import PaddleOCR
    try:
        ocr = PaddleOCR(lang=a.lang, device=a.device, use_doc_orientation_classify=False,
                        use_doc_unwarping=False, use_textline_orientation=False)
    except Exception as ex:
        log(f"ocr: device {a.device} failed ({ex}); falling back to cpu")
        ocr = PaddleOCR(lang=a.lang, device="cpu", use_doc_orientation_classify=False,
                        use_doc_unwarping=False, use_textline_orientation=False)

    stepf = max(1, round(fps / a.fps))
    samples = set(range(0, N, stepf))
    dets = []
    cap = cv2.VideoCapture(str(w.video))
    i = 0
    while True:
        ok, img = cap.read()
        if not ok:
            break
        if i in samples:
            sc = min(1.0, a.max_side / max(img.shape[:2]))
            small = cv2.resize(img, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) if sc < 1 else img
            hh, ww = small.shape[:2]
            found = []
            for res in ocr.predict(small):
                for t, s, b in zip(get(res, "rec_texts"), get(res, "rec_scores"), get(res, "rec_boxes")):
                    if s >= a.min_score and t.strip():
                        b = [float(b[0]) / ww, float(b[1]) / hh, float(b[2]) / ww, float(b[3]) / hh]
                        found.append((t.strip(), float(s), [round(v, 4) for v in b]))
            dets.append((i, found))
        i += 1
    cap.release()
    N = min(N, i)

    # --- link detections into tracks (same text, same place, consecutive samples)
    tracks, active = [], []
    for f, found in dets:
        nxt = []
        for text, s, box in found:
            best = None
            for tr in active:
                if tr in nxt:
                    continue
                if difflib.SequenceMatcher(None, norm(tr["text"]), norm(text)).ratio() >= 0.85 and \
                        same_place(tr["_last_box"], box):
                    best = tr
                    break
            if best is None:
                best = {"text": text, "frame_in": f, "score": s, "bbox_norm": box, "bbox_path": [], "_texts": {}}
                tracks.append(best)
            best["_last"], best["_last_box"] = f, box
            best["score"] = max(best["score"], s)
            best["_texts"][text] = best["_texts"].get(text, 0) + 1
            if not best["bbox_path"] or best["bbox_path"][-1]["box"] != box:
                best["bbox_path"].append({"f": f, "t": f2t(f, fps), "box": box})
            nxt.append(best)
        active = nxt
    for tr in tracks:
        tr["text"] = max(tr["_texts"], key=tr["_texts"].get)
        tr["_n"] = sum(tr["_texts"].values())
    # drop one-sample, low-confidence fragments ("0bo", stray single glyphs)
    tracks = [t for t in tracks if not (t["_n"] == 1 and (t["score"] < 0.9 or len(t["text"]) < 2))]

    # --- frame-exact in/out: one sequential pass collecting only the text-box crops we need
    windows = []  # (track, kind, lo, hi, box)
    for tr in tracks:
        tr["_fin"], tr["_fout"] = tr["frame_in"], min(N - 1, tr["_last"] + stepf - 1)
        if a.no_refine:
            continue
        windows.append((tr, "in", max(0, tr["frame_in"] - stepf), tr["frame_in"], tr["bbox_norm"]))
        windows.append((tr, "out", tr["_last"], min(N - 1, tr["_last"] + stepf), tr["_last_box"]))
    if windows:
        need = {}
        for k, (_, _, lo, hi, box) in enumerate(windows):
            for f in range(lo, hi + 1):
                need.setdefault(f, []).append(k)
        crops = {k: [] for k in range(len(windows))}
        cap = cv2.VideoCapture(str(w.video))
        f, last = 0, max(need)
        while f <= last:
            ok, img = cap.read()
            if not ok:
                break
            if f in need:
                g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                for k in need[f]:
                    b = windows[k][4]
                    x1, y1, x2, y2 = int(b[0] * W), int(b[1] * H), int(b[2] * W) + 1, int(b[3] * H) + 1
                    crops[k].append((f, g[y1:y2, x1:x2].astype(np.float32)))
            f += 1
        cap.release()
        for k, (tr, kind, lo, hi, _) in enumerate(windows):
            c = crops[k]
            if len(c) < 2 or c[0][1].size == 0:
                continue
            diffs = [(c[j + 1][0], float(np.mean(np.abs(c[j + 1][1] - c[j][1])))) for j in range(len(c) - 1)]
            fc, dmax = max(diffs, key=lambda d: d[1])
            if dmax < 2.0:  # nothing switched visibly inside the window: keep the sampled value
                continue
            if kind == "in":
                tr["_fin"] = fc
            else:
                tr["_fout"] = fc - 1

    out = []
    for tr in tracks:
        fin, fout = int(tr["_fin"]), int(max(tr["_fin"], tr["_fout"]))
        out.append({"text": tr["text"], "frame_in": fin, "frame_out": fout,
                    "t_in": f2t(fin, fps), "t_out": f2t(fout + 1, fps),
                    "bbox_norm": tr["bbox_norm"], "bbox_path": tr["bbox_path"][:30],
                    "score": round(tr["score"], 3),
                    "readings": sorted(tr["_texts"], key=tr["_texts"].get, reverse=True)[:3],
                    "font_guess": None, "font_confirmed": False,
                    "timing_precision": f"±{stepf} frames" if a.no_refine else "frame (refined)"})
    out.sort(key=lambda t: (t["frame_in"], t["bbox_norm"][1]))

    # --- group word-by-word reveals: B starts as A ends, same place, and B's text extends A's
    groups, used = [], set()
    for i, t in enumerate(out):
        if i in used:
            continue
        chain = [t]
        used.add(i)
        while True:
            cur = chain[-1]
            nxt = next((j for j, u in enumerate(out) if j not in used
                        and abs(u["frame_in"] - (cur["frame_out"] + 1)) <= stepf
                        and same_place(cur["bbox_norm"], u["bbox_norm"])
                        and norm(u["text"]).replace(" ", "").startswith(norm(cur["text"]).replace(" ", "")[:max(1, len(cur["text"]) - 2)])
                        and len(u["text"]) > len(cur["text"])), None)
            if nxt is None:
                break
            chain.append(out[nxt])
            used.add(nxt)
        if len(chain) == 1:
            groups.append(t)
        else:
            final = dict(chain[-1])
            final.update({"frame_in": chain[0]["frame_in"], "t_in": chain[0]["t_in"], "reveal": "word_by_word",
                          "steps": [{"text": c["text"], "frame_in": c["frame_in"], "t_in": c["t_in"]} for c in chain]})
            groups.append(final)

    w.save("ocr", {"tool": "PaddleOCR 3.x", "sample_fps": round(fps / stepf, 3), "tracks": groups})
    log(f"ocr: {len(groups)} text tracks ({sum(1 for g in groups if g.get('reveal'))} word-by-word captions) "
        f"from {len(dets)} sampled frames")


if __name__ == "__main__":
    main()
