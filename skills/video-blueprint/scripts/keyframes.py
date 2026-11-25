"""Step 3: keyframes, contact sheets, palette/tone per shot, match-cut hints.

usage: keyframes.py <workdir> [--k 5]
reads: raw/shots.json
writes: keyframes/S01_in.jpg|_mid.jpg|_out.jpg, keyframes/S01_sheet.jpg,
        keyframes/T01_strip.jpg (frames across each transition), keyframes/storyboard.jpg,
        raw/keyframes.json, raw/palette.json
The sheets are what Claude looks at in the vision pass; one image per shot keeps it cheap.
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from sklearn.cluster import KMeans

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402

FONT = cv2.FONT_HERSHEY_SIMPLEX


def label(img, text):
    out = img.copy()
    s = max(0.5, img.shape[1] / 700)
    cv2.rectangle(out, (0, 0), (int(len(text) * 20 * s) + 10, int(36 * s)), (0, 0, 0), -1)
    cv2.putText(out, text, (6, int(26 * s)), FONT, s, (255, 255, 255), max(1, int(2 * s)), cv2.LINE_AA)
    return out


def fit_h(img, h):
    return cv2.resize(img, (max(1, int(img.shape[1] * h / img.shape[0])), h), interpolation=cv2.INTER_AREA)


def hstack(imgs, h, gap=6):
    imgs = [fit_h(i, h) for i in imgs]
    pad = np.full((h, gap, 3), 40, np.uint8)
    row = []
    for i, im in enumerate(imgs):
        row += ([pad] if i else []) + [im]
    return np.hstack(row)


def palette(img, k):
    small = cv2.resize(img, (96, int(96 * img.shape[0] / img.shape[1])), interpolation=cv2.INTER_AREA)
    lab = cv2.cvtColor(small, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    km = KMeans(n_clusters=k, n_init=4, random_state=0).fit(lab)
    counts = np.bincount(km.labels_, minlength=k)
    order = np.argsort(-counts)
    centers = km.cluster_centers_[order].astype(np.uint8).reshape(-1, 1, 3)
    bgr = cv2.cvtColor(centers, cv2.COLOR_LAB2BGR).reshape(-1, 3)
    return [{"hex": "#%02X%02X%02X" % (c[2], c[1], c[0]), "share": round(float(counts[o] / counts.sum()), 3)}
            for c, o in zip(bgr, order)]


def tone(img):
    ycc = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)[..., 0].astype(np.float32)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    # studio-range Y: 16->0 IRE, 235->100 IRE
    ire = np.clip((ycc - 16) / 219 * 100, 0, 100)
    return {
        "black_level_ire_est": round(float(np.percentile(ire, 2)), 1),
        "white_level_ire_est": round(float(np.percentile(ire, 98)), 1),
        "mean_luma_ire": round(float(ire.mean()), 1),
        "saturation_mean": round(float(hsv[..., 1].mean() / 255), 3),
        "warmth_b_star": round(float(lab[..., 2].mean() - 128), 1),  # >0 warm/yellow, <0 cool/blue
        "tint_a_star": round(float(lab[..., 1].mean() - 128), 1),    # >0 magenta, <0 green
        "contrast_std_ire": round(float(ire.std()), 1),
    }


def similarity(a, b):
    """0..1 hint that frame b continues the look/shape of frame a (match-cut candidate)."""
    ha = cv2.calcHist([cv2.cvtColor(a, cv2.COLOR_BGR2HSV)], [0, 1], None, [30, 32], [0, 180, 0, 256])
    hb = cv2.calcHist([cv2.cvtColor(b, cv2.COLOR_BGR2HSV)], [0, 1], None, [30, 32], [0, 180, 0, 256])
    hist = max(0.0, cv2.compareHist(cv2.normalize(ha, ha), cv2.normalize(hb, hb), cv2.HISTCMP_CORREL))
    ea = cv2.Canny(cv2.resize(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), (64, 64)), 60, 160).astype(np.float32)
    eb = cv2.Canny(cv2.resize(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY), (64, 64)), 60, 160).astype(np.float32)
    ea, eb = cv2.GaussianBlur(ea, (7, 7), 2), cv2.GaussianBlur(eb, (7, 7), 2)
    shape = float(np.corrcoef(ea.ravel(), eb.ravel())[0, 1]) if ea.std() and eb.std() else 0.0
    return round(hist, 3), round(max(0.0, shape), 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--k", type=int, default=5)
    ap.add_argument("--sheet-h", type=int, default=480)
    a = ap.parse_args()
    w = Work(a.workdir)
    fps = w.probe["fps"]
    S = w.load("shots")
    shots, trans = S["shots"], S["transitions"]

    want = {}  # frame -> list of names
    for sh in shots:
        fi, fo = sh["frame_in"], sh["frame_out"]
        n = fo - fi + 1
        picks = {"in": min(fi + 1, fo), "mid": fi + n // 2, "out": max(fo - 1, fi)}
        for k, f in picks.items():
            want.setdefault(f, []).append(f"{sh['id']}_{k}")
        want.setdefault(fi, []).append(f"{sh['id']}_first")
        want.setdefault(fo, []).append(f"{sh['id']}_last")
    for i, tr in enumerate(trans):
        fs, fe = tr["frame_start"] - 2, tr["frame_end"] + 2
        span = list(range(max(0, fs), fe + 1))
        if len(span) > 12:
            span = list(np.linspace(span[0], span[-1], 12).round().astype(int))
        tr["_strip"] = span
        for f in span:
            want.setdefault(int(f), []).append(f"T{i + 1:02d}_{int(f)}")

    frames = {}
    cap = cv2.VideoCapture(str(w.video))
    idx, last = 0, max(want)
    while idx <= last:
        ok, img = cap.read()
        if not ok:
            break
        if idx in want:
            frames[idx] = img
        idx += 1
    cap.release()

    kf = {"shots": {}, "transitions": {}, "storyboard": "keyframes/storyboard.jpg"}
    pal = {}
    mids = []
    for sh in shots:
        sid = sh["id"]
        names = {}
        for k in ("in", "mid", "out"):
            f = next(fr for fr, ns in want.items() if f"{sid}_{k}" in ns)
            if f in frames:
                p = w.keyframes / f"{sid}_{k}.jpg"
                cv2.imwrite(str(p), frames[f], [cv2.IMWRITE_JPEG_QUALITY, 92])
                names[k] = {"file": f"keyframes/{p.name}", "frame": int(f), "t": f2t(f, fps)}
        imgs = [label(frames[names[k]["frame"]], f"{sid} {k} f{names[k]['frame']} {names[k]['t']:.3f}s")
                for k in ("in", "mid", "out") if k in names]
        if imgs:
            cv2.imwrite(str(w.keyframes / f"{sid}_sheet.jpg"), hstack(imgs, a.sheet_h), [cv2.IMWRITE_JPEG_QUALITY, 85])
            names["sheet"] = f"keyframes/{sid}_sheet.jpg"
        kf["shots"][sid] = names
        if "mid" in names:
            m = frames[names["mid"]["frame"]]
            pal[sid] = {"palette": palette(m, a.k), "tone": tone(m)}
            mids.append(label(m, sid))

    for i, tr in enumerate(trans):
        tid = f"T{i + 1:02d}"
        span = [f for f in tr["_strip"] if f in frames]
        if span:
            strip = hstack([label(frames[f], f"f{f}") for f in span], 260, gap=3)
            cv2.imwrite(str(w.keyframes / f"{tid}_strip.jpg"), strip, [cv2.IMWRITE_JPEG_QUALITY, 85])
        A = next(s for s in shots if s["id"] == tr["from"])
        B = next(s for s in shots if s["id"] == tr["to"])
        hint = {}
        if A["frame_out"] in frames and B["frame_in"] in frames:
            hist, shape = similarity(frames[A["frame_out"]], frames[B["frame_in"]])
            hint = {"color_sim": hist, "shape_sim": shape,
                    "match_cut_candidate": bool(shape > 0.55 or (hist > 0.85 and shape > 0.35))}
        kf["transitions"][tid] = {"from": tr["from"], "to": tr["to"],
                                  "strip": f"keyframes/{tid}_strip.jpg" if span else None, **hint}

    if mids:
        cols = 6 if w.probe["aspect"] < 1 else 4
        th = 360
        tiles = [fit_h(m, th) for m in mids]
        tw = max(t.shape[1] for t in tiles)
        tiles = [cv2.copyMakeBorder(t, 3, 3, 3, 3 + tw - t.shape[1], cv2.BORDER_CONSTANT, value=(30, 30, 30)) for t in tiles]
        rows = []
        for r in range(0, len(tiles), cols):
            row = tiles[r:r + cols]
            row += [np.full_like(tiles[0], 30)] * (cols - len(row))
            rows.append(np.hstack(row))
        cv2.imwrite(str(w.keyframes / "storyboard.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])

    w.save("keyframes", kf)
    w.save("palette", pal)
    log(f"keyframes: {len(frames)} frames saved, {len(shots)} sheets, {len(trans)} transition strips")


if __name__ == "__main__":
    main()
