"""Upload packages for a finished remake (Ved, 24 Nov 2026: "final render 1080p 60 fps with proper YouTube and
Instagram upload package, thumbnail from Magnific, .md upload guide, both platforms separate zip").

One master MP4 that suits both YouTube Shorts and Instagram Reels, English captions, the cover in the sizes each
platform needs, and two verified zips (<Name>_YouTube.zip / <Name>_Instagram.zip) each with its own upload guide.
The whole step (cover prompt for GPT Image 2.6 Flare, guide templates, platform rules) is in
references/upload-package.md - read it first.

usage (core python):
  upload_package.py <project> master [--name NAME] [--title TEXT]   # master MP4 + captions_en.srt + checks
  upload_package.py <project> frames [--every 3]                    # contact sheet for picking a fallback frame
  upload_package.py <project> cover <image> [--frame SEC]           # 1080x1920 cover, 3:4 grid preview, frame pick
  upload_package.py <project> build [--dest DIR] [--force]          # both folders + zips, verified
Everything is written to <project>/upload/ until `build` copies it to --dest (default <VB>/upload-packages).
"""
import argparse
import hashlib
import json
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import MASTER_AF, VB_HOME, project_paths  # noqa: E402

W, H = 1080, 1920
SHORTS_TOP_UI = int(0.12 * H)       # top ~12 % is covered by app buttons on Shorts / Reels
GRID_H = 1440                        # Instagram profile grid shows a 3:4 crop (1080x1440) of the 9:16 cover
GRID_CENTRE_TOP = (H - GRID_H) // 2  # 240
MAXC = 38                            # caption characters per cue (one line)


# ------------------------------------------------------------------------------------------------ helpers
def die(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, stdin=subprocess.DEVNULL, **kw)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_entries",
             "stream=index,codec_type,codec_name,profile,pix_fmt,width,height,r_frame_rate,duration,nb_frames,"
             "sample_rate,channels,bit_rate,color_primaries:format=duration,size", "-of", "json", str(path)])
    j = json.loads(r.stdout or "{}")
    v = next((s for s in j.get("streams", []) if s["codec_type"] == "video"), None)
    a = next((s for s in j.get("streams", []) if s["codec_type"] == "audio"), None)
    return v, a, j.get("format", {})


def loudness(path):
    r = run(["ffmpeg", "-nostdin", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"])
    lines = [ln.strip() for ln in r.stderr.splitlines()]
    i_val = [ln for ln in lines if ln.startswith("I:")]
    p_val = [ln for ln in lines if ln.startswith("Peak:")]
    i = float(i_val[-1].split()[1]) if i_val else None
    p = float(p_val[-1].split()[1]) if p_val else None
    return i, p


def top_atoms(path):
    out = []
    with open(path, "rb") as f:
        while True:
            h = f.read(8)
            if len(h) < 8:
                break
            size, typ = struct.unpack(">I4s", h)
            if size == 1:
                size = struct.unpack(">Q", f.read(8))[0]
                f.seek(size - 16, 1)
            elif size == 0:
                out.append(typ.decode("latin-1"))
                break
            else:
                f.seek(size - 8, 1)
            out.append(typ.decode("latin-1"))
    return out


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def state_path(P):
    return P.proj / "upload" / "package.json"


def load_state(P):
    p = state_path(P)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def save_state(P, st):
    state_path(P).parent.mkdir(parents=True, exist_ok=True)
    state_path(P).write_text(json.dumps(st, indent=1, ensure_ascii=False), encoding="utf-8")


def mmss(t):
    return f"{int(t // 60)}m{int(round(t % 60)):02d}s"


# ------------------------------------------------------------------------------------------------ captions
def _txt(ws):
    return " ".join(x["w"] for x in ws)


def _balanced(ws):
    """Split a phrase that is too long into k parts of near-equal length (no one-word orphans)."""
    total = len(_txt(ws))
    k = -(-total // MAXC)
    while True:
        target = total / k
        parts, cur = [], []
        for w in ws:
            if cur and len(_txt(cur + [w])) > target + 4 and len(parts) < k - 1:
                parts.append(cur)
                cur = []
            cur.append(w)
        parts.append(cur)
        if all(len(_txt(p)) <= MAXC for p in parts) or k > len(ws):
            return parts
        k += 1


def _ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(words_json, srt_path, video_dur):
    """YouTube captions from vo_words.json (the voice starts at video t=0 in the engine): one-line cues split at
    sentence ends, then commas, then pauses > 0.45 s; long phrases split in balanced halves; never overlapping."""
    data = json.loads(Path(words_json).read_text(encoding="utf-8"))
    words = data["words"]
    phrases, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        gap = words[i + 1]["start"] - w["end"] if i + 1 < len(words) else 1
        if w["w"].endswith((".", "?", "!")) or (w["w"].endswith((",", ":", ";")) and len(_txt(cur)) >= 14) or gap > 0.45:
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    cues = []
    for p in phrases:
        cues.extend([p] if len(_txt(p)) <= MAXC else _balanced(p))
    blocks = []
    for i, c in enumerate(cues):
        start = c[0]["start"]
        end = max(c[-1]["end"] + 0.25, start + 0.7)
        if i + 1 < len(cues):
            end = min(end, cues[i + 1][0]["start"] - 0.02)
        end = min(end, video_dur)
        blocks.append(f"{i + 1}\n{_ts(start)} --> {_ts(end)}\n{_txt(c)}\n")
    Path(srt_path).write_text("\n".join(blocks), encoding="utf-8", newline="\n")
    said = data.get("text", " ".join(w["w"] for w in words)).split()
    back = " ".join(_txt(c) for c in cues).split()
    return len(cues), max(len(_txt(c)) for c in cues), said == back


# ------------------------------------------------------------------------------------------------ master
def cmd_master(P, a):
    st = load_state(P)
    name = a.name or st.get("name") or P.id
    title = a.title or st.get("title")
    if not title:
        sj = P.proj / "script.json"
        title = json.loads(sj.read_text(encoding="utf-8")).get("title", P.id) if sj.exists() else P.id
    src = P.out / f"{P.id}.mp4"
    mixwav = P.out / f"{P.id}_mix.wav"
    if not src.exists():
        die(f"no final render {src} - run render.py video and sound_design.py mix first")
    v, _, _ = probe(src)
    if not v:
        die(f"{src} has no video stream")
    vdur = float(v["duration"])
    up = P.proj / "upload"
    up.mkdir(exist_ok=True)
    dst = up / f"{name}_{W}x{H}_60fps.mp4"
    meta = ["-map_metadata", "-1", "-metadata", f"title={title}", "-metadata:s:a:0", "language=eng",
            "-metadata:s:v:0", "language=eng", "-movflags", "+faststart"]
    if mixwav.exists():
        # picture copied untouched; audio re-mastered from the lossless mix with the same chain, AAC 320k for upload
        args = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-i", str(mixwav), "-filter_complex",
                f"[1:a]{MASTER_AF},atrim=0:{vdur:.6f}[a]", "-map", "0:v:0", "-map", "[a]", "-c:v", "copy",
                "-c:a", "aac", "-b:a", "320k", "-aac_pns", "0", "-ar", "48000", "-ac", "2", "-t", f"{vdur:.6f}", *meta, str(dst)]
        how = "audio re-mastered from the mix WAV at AAC 320k"
    else:
        args = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-map", "0:v:0", "-map", "0:a:0",
                "-c", "copy", *meta, str(dst)]
        how = "no mix WAV found: audio copied as rendered"
    r = run(args)
    if r.returncode:
        die(r.stderr[-800:])
    # ---- checks: what both platforms want
    v, au, fm = probe(dst)
    errs = []
    fps = float(Fraction(v["r_frame_rate"])) if v else 0.0  # "60/1"
    if not v or v["codec_name"] != "h264" or v.get("pix_fmt") != "yuv420p":
        errs.append("video must be H.264 yuv420p")
    if v and (int(v["width"]), int(v["height"])) != (W, H):
        errs.append(f"video is {v['width']}x{v['height']}, expected {W}x{H}")
    if abs(fps - 60) > 0.01:
        errs.append(f"video is {fps} fps, expected 60")
    if not au or au["codec_name"] != "aac" or au.get("sample_rate") != "48000":
        errs.append("audio must be AAC 48 kHz")
    adur = float(au["duration"]) if au else 0
    if au and abs(adur - vdur) > 1 / 60 + 0.001:
        errs.append(f"audio {adur:.3f}s vs video {vdur:.3f}s")
    atoms = top_atoms(dst)
    if "moov" not in atoms or "mdat" not in atoms or atoms.index("moov") > atoms.index("mdat"):
        errs.append(f"not faststart: {atoms}")
    lufs, tp = loudness(dst)
    if lufs is None or not -15.5 <= lufs <= -13.0:
        errs.append(f"loudness {lufs} LUFS (want about -14)")
    if tp is None or tp > -1.0:
        errs.append(f"true peak {tp} dB (want <= -1)")
    if vdur > 180:
        errs.append(f"{vdur:.1f}s is longer than 3 min: YouTube will not treat it as a Short")
    # ---- captions
    words = P.proj / "vo_words.json"
    cap = None
    if words.exists():
        n, longest, exact = write_srt(words, up / "captions_en.srt", vdur)
        cap = {"cues": n, "longest": longest, "matches_voice": exact}
        if not exact:
            errs.append("captions do not match the voice text word for word")
    st.update(name=name, title=title, master=dst.name, duration=round(vdur, 3), lufs=lufs, true_peak=tp,
              video_mbps=round(int(v.get("bit_rate", 0) or 0) / 1e6, 2), audio=how, captions=cap)
    save_state(P, st)
    print(f"master: {dst}\n  {how}\n  {v['width']}x{v['height']} {fps:g} fps H.264 yuv420p {v.get('color_primaries')}, "
          f"{vdur:.2f}s, video {st['video_mbps']} Mbps, {lufs} LUFS, true peak {tp} dB, atoms {atoms}")
    print(f"  captions: {cap}" if cap else "  captions: no vo_words.json - none written")
    if errs:
        die("; ".join(errs))
    print("checks: OK")


# ------------------------------------------------------------------------------------------------ frames
def cmd_frames(P, a):
    from PIL import Image, ImageDraw
    st = load_state(P)
    if "master" not in st:
        die("run `master` first")
    src = P.proj / "upload" / st["master"]
    dur = st["duration"]
    fd = P.proj / "upload" / "frames"
    if fd.exists():
        shutil.rmtree(fd)
    fd.mkdir(parents=True)
    times = [round(t, 1) for t in [x * a.every for x in range(1, int(dur // a.every) + 1)] if t < dur - 0.2]
    tiles = []
    for t in times:
        f = fd / f"t{t:05.1f}.jpg"
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(t), "-i", str(src), "-frames:v", "1", "-vf", "scale=216:384", str(f)])
        if f.exists():
            im = Image.open(f).convert("RGB")
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 70, 22], fill=(0, 0, 0))
            d.text((5, 5), f"{t:.1f}s", fill=(255, 255, 255))
            tiles.append(im)
    cols = 8
    rows = -(-len(tiles) // cols)
    sheet = Image.new("RGB", (cols * 220, rows * 388), (30, 30, 30))
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % cols) * 220 + 2, (i // cols) * 388 + 2))
    out = P.proj / "upload" / "frames_sheet.jpg"
    sheet.save(out, quality=88)
    print(f"{len(tiles)} frames every {a.every}s -> {out} (pick one for `cover --frame SEC`)")


# ------------------------------------------------------------------------------------------------ cover
def cmd_cover(P, a):
    from PIL import Image
    import numpy as np
    st = load_state(P)
    if "master" not in st:
        die("run `master` first")
    srcimg = Path(a.image)
    if not srcimg.exists():
        die(f"no image {srcimg}")
    up = P.proj / "upload"
    im = Image.open(srcimg).convert("RGB")
    ratio = im.width / im.height
    if abs(ratio - W / H) > 0.02:
        print(f"WARNING: cover is {im.width}x{im.height} ({ratio:.3f}), not 9:16 - it will be centre-cropped")
    s = max(W / im.width, H / im.height)
    rs = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x0, y0 = (rs.width - W) // 2, (rs.height - H) // 2
    cover = rs.crop((x0, y0, x0 + W, y0 + H))
    for old in up.glob("cover_master_*"):
        old.unlink()
    master_copy = up / f"cover_master_{im.width}x{im.height}{srcimg.suffix.lower()}"
    shutil.copy2(srcimg, master_copy)
    cover.save(up / "cover_1080x1920.jpg", quality=93, optimize=True, subsampling=0)
    # headline: first row in the top 45 % where >= 5 % of the pixels are near-white (bold white titles)
    arr = np.asarray(cover).astype(int)
    bright = (arr.min(axis=2) > 235).mean(axis=1)
    rows = np.where(bright[: int(0.45 * H)] >= 0.05)[0]
    head = int(rows.min()) if len(rows) else None
    grid_top = GRID_CENTRE_TOP if head is None else max(0, min(GRID_CENTRE_TOP, head - 70))
    if a.grid_top is not None:   # e.g. a face at the top of the cover: pick the 3:4 window by eye
        grid_top = max(0, min(H - GRID_H, int(a.grid_top)))
    cover.crop((0, grid_top, W, grid_top + GRID_H)).save(up / "grid_preview_1080x1440.jpg", quality=92)
    warn = []
    if head is not None and head < SHORTS_TOP_UI:
        warn.append(f"headline starts at y={head}, inside the top {SHORTS_TOP_UI}px that app buttons cover - regenerate or move it")
    st.update(cover_master=master_copy.name, headline_top=head, grid_top=grid_top)
    for old in up.glob("frame_pick_*.jpg"):
        old.unlink()
    if a.frame is not None:
        f = up / f"frame_pick_{mmss(a.frame)}.jpg"
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(a.frame), "-i", str(up / st["master"]), "-frames:v", "1", "-q:v", "2", str(f)])
        if not f.exists():
            die(f"could not extract a frame at {a.frame}s")
        st["frame_pick"] = f.name
    else:
        st.pop("frame_pick", None)
    save_state(P, st)
    print(f"cover: {up / 'cover_1080x1920.jpg'} (from {im.width}x{im.height})\n"
          f"  headline top y={head}; grid preview window y={grid_top}..{grid_top + GRID_H} "
          f"({'centre' if grid_top == GRID_CENTRE_TOP else f'{GRID_CENTRE_TOP - grid_top}px above centre - say so in the Instagram guide'})")
    if st.get("frame_pick"):
        print(f"  frame pick: {st['frame_pick']}")
    for w_ in warn:
        print("WARNING:", w_)


# ------------------------------------------------------------------------------------------------ build
GUIDE_MARKERS = ("{{", "}}", "<<", ">>", "TODO", "TBD", "XXX")


def cmd_build(P, a):
    st = load_state(P)
    up = P.proj / "upload"
    need = {"master": st.get("master"), "cover": "cover_1080x1920.jpg", "grid": "grid_preview_1080x1440.jpg",
            "UPLOAD_YOUTUBE.md": "UPLOAD_YOUTUBE.md", "UPLOAD_INSTAGRAM.md": "UPLOAD_INSTAGRAM.md"}
    for k, fn in need.items():
        if not fn or not (up / fn).exists():
            die(f"missing {k} in {up} - run master / cover and write the two guides (references/upload-package.md)")
    for g in ("UPLOAD_YOUTUBE.md", "UPLOAD_INSTAGRAM.md"):
        txt = (up / g).read_text(encoding="utf-8")
        bad = [m for m in GUIDE_MARKERS if m in txt]
        if bad:
            die(f"{g} still has template markers {bad} - fill them in")
    name = st["name"]
    dest = Path(a.dest) if a.dest else VB_HOME / "upload-packages"
    dest.mkdir(parents=True, exist_ok=True)
    yt = {st["master"]: up / st["master"], "thumbnail_shorts_1080x1920.jpg": up / "cover_1080x1920.jpg",
          "UPLOAD_YOUTUBE.md": up / "UPLOAD_YOUTUBE.md"}
    if st.get("cover_master"):
        cm = up / st["cover_master"]
        yt[cm.name.replace("cover_master_", "thumbnail_master_")] = cm
    if st.get("frame_pick") and (up / st["frame_pick"]).exists():
        yt[st["frame_pick"]] = up / st["frame_pick"]
    if (up / "captions_en.srt").exists():
        yt["captions_en.srt"] = up / "captions_en.srt"
    ig = {st["master"]: up / st["master"], "reel_cover_1080x1920.jpg": up / "cover_1080x1920.jpg",
          "grid_preview_1080x1440.jpg": up / "grid_preview_1080x1440.jpg", "UPLOAD_INSTAGRAM.md": up / "UPLOAD_INSTAGRAM.md"}
    report = []
    for plat, files in (("YouTube", yt), ("Instagram", ig)):
        folder = dest / f"{name}_{plat}"
        zp = dest / f"{name}_{plat}.zip"
        if folder.exists() or zp.exists():
            if not a.force:
                die(f"{folder} or its zip exists - pass --force to replace them")
            if folder.exists():
                shutil.rmtree(folder)
            if zp.exists():
                zp.unlink()
        folder.mkdir()
        for fn, src in files.items():
            shutil.copy2(src, folder / fn)
        with zipfile.ZipFile(zp, "w") as z:
            for fn in sorted(files):
                comp = zipfile.ZIP_DEFLATED if fn.endswith((".md", ".srt")) else zipfile.ZIP_STORED
                z.write(folder / fn, arcname=f"{folder.name}/{fn}", compress_type=comp)
        # verify: CRC, byte-identical round trip, the video still probes right, text files are UTF-8
        with zipfile.ZipFile(zp) as z:
            crc = z.testzip()
            tmp = Path(tempfile.mkdtemp())
            z.extractall(tmp)
        try:
            same = all(sha(folder / fn) == sha(tmp / folder.name / fn) for fn in files)
            v, au, fm = probe(tmp / folder.name / st["master"])
            vid_ok = bool(v and v["codec_name"] == "h264" and (int(v["width"]), int(v["height"])) == (W, H) and au)
            for fn in files:
                if fn.endswith((".md", ".srt")):
                    (tmp / folder.name / fn).read_text(encoding="utf-8")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        ok = crc is None and same and vid_ok
        report.append((zp, len(files), zp.stat().st_size, ok))
        print(f"{'OK ' if ok else 'BAD'} {zp}  {zp.stat().st_size / 1e6:.1f} MB  {len(files)} files: {', '.join(sorted(files))}")
        if not ok:
            die(f"verification failed for {zp} (crc={crc}, identical={same}, video={vid_ok})")
    st["built"] = {"dest": str(dest), "zips": [str(r[0]) for r in report]}
    save_state(P, st)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("master")
    m.add_argument("--name", help="file/zip name, e.g. SSD-Explainer (saved for later commands)")
    m.add_argument("--title", help="MP4 title metadata (default: script.json title)")
    f = sub.add_parser("frames")
    f.add_argument("--every", type=float, default=3.0)
    c = sub.add_parser("cover")
    c.add_argument("image")
    c.add_argument("--frame", type=float, help="seconds: fallback frame for the YouTube app's frame picker")
    c.add_argument("--grid-top", type=int, help="top of the 3:4 Instagram grid window (0-480 px on 1920); default: from the headline")
    b = sub.add_parser("build")
    b.add_argument("--dest", help="output folder (default <VB>/upload-packages)")
    b.add_argument("--force", action="store_true", help="replace existing package folders/zips of this project")
    a = ap.parse_args()
    P = project_paths(a.project)
    {"master": cmd_master, "frames": cmd_frames, "cover": cmd_cover, "build": cmd_build}[a.cmd](P, a)


if __name__ == "__main__":
    main()
