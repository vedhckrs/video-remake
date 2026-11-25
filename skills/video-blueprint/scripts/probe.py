"""Step 0: probe the source once, extract the audio, make a CFR proxy if needed.

usage: probe.py <video> <workdir>
writes: probe.json, audio_48k.wav, (proxy_cfr.mp4 when the source is VFR)
"""
import json
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, ffmpeg_bin, log, write_json  # noqa: E402


def main(video: str, workdir: str) -> None:
    src = Path(video).resolve()
    w = Work(workdir)
    out = subprocess.run(
        [ffmpeg_bin("ffprobe"), "-v", "error", "-print_format", "json",
         "-show_format", "-show_streams", str(src)],
        check=True, capture_output=True, text=True).stdout
    info = json.loads(out)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)

    r = Fraction(v.get("r_frame_rate", "0/1"))
    avg = Fraction(v.get("avg_frame_rate", "0/1")) if v.get("avg_frame_rate", "0/0") != "0/0" else r
    vfr = r != 0 and avg != 0 and abs(float(r) - float(avg)) > 0.01
    fps_frac = avg if avg else r
    fps = float(fps_frac)
    duration = float(info["format"].get("duration") or v.get("duration") or 0)
    nb_frames = int(v["nb_frames"]) if v.get("nb_frames", "").isdigit() else round(duration * fps)

    # rotation side-data (phone footage) swaps the displayed size
    rot = 0
    for sd in v.get("side_data_list", []) or []:
        if "rotation" in sd:
            rot = int(sd["rotation"]) % 360
    wpx, hpx = int(v["width"]), int(v["height"])
    if rot in (90, 270):
        wpx, hpx = hpx, wpx

    proxy = src
    if vfr:
        cfr = round(fps)
        proxy = w.root / "proxy_cfr.mp4"
        log(f"source is VFR (r={r}, avg={avg}); writing CFR proxy at {cfr} fps")
        subprocess.run([ffmpeg_bin(), "-nostdin", "-v", "error", "-y", "-i", str(src), "-r", str(cfr),
                        "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-c:a", "copy", str(proxy)],
                       check=True)
        fps_frac, fps = Fraction(cfr), float(cfr)

    if a is not None:
        subprocess.run([ffmpeg_bin(), "-nostdin", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "2",
                        "-ar", "48000", "-c:a", "pcm_s16le", str(w.audio)], check=True)

    probe = {
        "file": str(src),
        "proxy": str(proxy),
        "duration_s": round(duration, 6),
        "fps": round(fps, 6),
        "fps_fraction": f"{fps_frac.numerator}/{fps_frac.denominator}",
        "frames": nb_frames,
        "vfr": vfr,
        "width": wpx,
        "height": hpx,
        "resolution": f"{wpx}x{hpx}",
        "aspect": round(wpx / hpx, 4),
        "rotation": rot,
        "video_codec": v.get("codec_name"),
        "has_audio": a is not None,
        "audio_codec": a.get("codec_name") if a else None,
        "audio_rate": int(a["sample_rate"]) if a else None,
        "frame_rule": f"frame = floor(t * {fps_frac.numerator}/{fps_frac.denominator})",
    }
    write_json(w.root / "probe.json", probe)
    log(f"probe: {probe['resolution']} @ {probe['fps_fraction']} fps, {duration:.2f}s, "
        f"vfr={vfr}, audio={'yes' if a else 'no'}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
