"""Render a remake: a stills sheet first (cheap visual check), then the MP4.

usage:
  render.py <project dir> stills [--at mid|start|end]   # one frame per scene -> out/stills/*.png + out/stills_sheet.jpg
  render.py <project dir> video [--scale 1]              # out/<id>.mp4 (H.264, AAC)
Runs `npx remotion` inside the shared engine (registers projects first).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import ENGINE, project_paths  # noqa: E402
import new_project  # noqa: E402


def master(src, dst, lufs=-14.0, tp=-1.5):
    """Two-pass EBU R128 loudness normalisation of the audio; video stream copied untouched.
    Social platforms play around -14 LUFS; an unmastered Remotion mix lands near -21."""
    import re
    m = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(src), "-af",
                        f"loudnorm=I={lufs}:TP={tp}:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    j = json.loads(re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", m)[-1])
    af = (f"loudnorm=I={lufs}:TP={tp}:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(src), "-c:v", "copy", "-af", af,
                    "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(dst)], check=True)


def npx(args):
    return subprocess.run(["npx.cmd", "remotion", *args], cwd=ENGINE, check=True, stdin=subprocess.DEVNULL)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("what", choices=["stills", "video", "master"], help="master = re-run loudness on the last render")
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--at", default="mid", choices=["start", "mid", "end"])
    ap.add_argument("--scale", type=float, default=None, help="default: project.output.width / canvas.width")
    ap.add_argument("--frames", help="comma list of frames for stills instead of one per scene")
    a = ap.parse_args()
    P = project_paths(a.project)
    new_project.register()
    pj = json.loads((P.proj / "project.json").read_text(encoding="utf-8"))
    P.out.mkdir(exist_ok=True)
    if a.what in ("video", "master"):
        out = P.out / f"{P.id}.mp4"
        raw = P.out / f"{P.id}_raw.mp4"
        if a.what == "video":
            # --scale renders the design canvas at a higher device scale: vectors, text and 2x screenshots stay sharp
            scale = a.scale or round((pj.get("output") or {}).get("width", pj["canvas"]["width"]) / pj["canvas"]["width"], 4)
            npx(["render", "src/index.ts", P.id, str(raw), "--codec=h264", "--audio-codec=aac", f"--scale={scale}",
                 "--crf=16", "--x264-preset=slow", "--color-space=bt709", "--concurrency=50%"])
        master(raw, out, a.lufs)
        print(f"[video-remake] rendered + mastered to {a.lufs} LUFS -> {out}")
        return
    d = P.out / "stills"
    d.mkdir(exist_ok=True)
    if a.frames:
        frames = [(f"f{int(x)}", int(x)) for x in a.frames.split(",")]
    else:
        frames = []
        for s in pj["scenes"]:
            f = {"start": s["from"] + 2, "mid": (s["from"] + s["to"]) // 2, "end": s["to"] - 3}[a.at]
            frames.append((s["id"], f))
    for name, f in frames:
        npx(["still", "src/index.ts", P.id, str(d / f"{name}.png"), f"--frame={f}", "--scale=0.5"])
    try:  # contact sheet for one look
        from PIL import Image, ImageDraw
        ims = [Image.open(d / f"{n}.png") for n, _ in frames]
        w, h = ims[0].size
        # 9:16 stills: 6 across; 16:9 landscape stills are 3.2x wider: 3 across keeps the sheet readable
        cols = min(3 if w > h else 6, len(ims))
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * w, rows * h), "#222")
        for i, (im, (n, f)) in enumerate(zip(ims, frames)):
            sheet.paste(im, ((i % cols) * w, (i // cols) * h))
            ImageDraw.Draw(sheet).text(((i % cols) * w + 8, (i // cols) * h + 6), f"{n} f{f}", fill="#ff3355")
        sheet.save(P.out / "stills_sheet.jpg", quality=85)
        print(f"[video-remake] stills sheet -> {P.out / 'stills_sheet.jpg'}")
    except Exception as ex:  # sheet is a convenience
        print(f"[video-remake] stills in {d} (sheet skipped: {ex})")


if __name__ == "__main__":
    main()
