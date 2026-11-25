"""Step 5 (optional): object masks + motion paths with SAM 3 (Meta, SAM License - custom, gated).

Status: written against the SAM 3 README API (build_sam3_video_predictor / handle_request); it runs
only once the `sam3` env is installed and the Hugging Face token has access to facebook/sam3.
On Windows SAM 3 imports `triton`; install `triton-windows` in that env (see references/tools.md).

usage: objects_sam3.py <workdir> [--max-side 640] [--stride 1]
reads: raw/shots.json, raw/vision.json -> object_prompts {"S01": ["sneaker", "hand"], ...}
writes: raw/objects.json {shots: {S01: [{id, label, frames: [{f, t, bbox_norm, area, centroid}]}]}}
Per shot: the shot's frames are written to a JPEG folder at <= max-side px, one session per shot,
one text prompt per noun, propagated through the shot. Centroid/bbox per frame = the element's
motion path (scale = bbox area change), which is what an animator needs to rebuild the move.
"""
import argparse
import shutil
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--max-side", type=int, default=640)
    a = ap.parse_args()
    w = Work(a.workdir)
    fps = w.probe["fps"]
    prompts = (w.load("vision", {}) or {}).get("object_prompts") or {}
    S = {s["id"]: s for s in w.load("shots")["shots"]}
    import torch
    from sam3.model_builder import build_sam3_video_predictor

    pred = build_sam3_video_predictor()
    out = {"tool": "SAM 3 video predictor", "shots": {}}
    cap = cv2.VideoCapture(str(w.video))
    for sid, nouns in prompts.items():
        if sid not in S or not nouns:
            continue
        sh = S[sid]
        tmp = Path(tempfile.mkdtemp(prefix=f"sam3_{sid}_"))
        cap.set(cv2.CAP_PROP_POS_FRAMES, sh["frame_in"])
        n = sh["frame_out"] - sh["frame_in"] + 1
        H = W = None
        for i in range(n):
            ok, img = cap.read()
            if not ok:
                break
            sc = min(1.0, a.max_side / max(img.shape[:2]))
            img = cv2.resize(img, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA) if sc < 1 else img
            H, W = img.shape[:2]
            cv2.imwrite(str(tmp / f"{i:05d}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 92])
        tracks = []
        for k, noun in enumerate(nouns):
            sess = pred.handle_request({"type": "start_session", "resource_path": str(tmp)})["session_id"]
            pred.handle_request({"type": "add_prompt", "session_id": sess, "frame_index": 0, "text": noun})
            per_obj = {}
            for res in pred.handle_stream_request({"type": "propagate_in_video", "session_id": sess}):
                fi = res.get("frame_index")
                masks = res["outputs"]["out_binary_masks"] if "outputs" in res else res.get("out_binary_masks")
                ids = (res.get("outputs") or res).get("out_obj_ids", list(range(len(masks))))
                for oid, m in zip(ids, masks):
                    m = np.asarray(m).astype(bool).squeeze()
                    if not m.any():
                        continue
                    ys, xs = np.nonzero(m)
                    per_obj.setdefault(int(oid), []).append({
                        "f": sh["frame_in"] + int(fi), "t": f2t(sh["frame_in"] + int(fi), fps),
                        "bbox_norm": [round(xs.min() / W, 4), round(ys.min() / H, 4), round(xs.max() / W, 4), round(ys.max() / H, 4)],
                        "centroid": [round(xs.mean() / W, 4), round(ys.mean() / H, 4)],
                        "area": round(float(m.mean()), 5)})
            pred.handle_request({"type": "close_session", "session_id": sess})
            for oid, frames in per_obj.items():
                frames.sort(key=lambda x: x["f"])
                tracks.append({"id": f"{sid}_{noun.replace(' ', '_')}_{oid}", "label": noun, "frames": frames})
            torch.cuda.empty_cache()
        out["shots"][sid] = tracks
        shutil.rmtree(tmp, ignore_errors=True)
        log(f"objects: {sid} -> {len(tracks)} tracks")
    cap.release()
    w.save("objects", out)


if __name__ == "__main__":
    main()
