"""Draw a schematic YouTube Shorts / Instagram Reels UI over 9:16 frames to check the safe area (Ved, 25 Nov 2026:
"bottom part ... YouTube username and description come - safe area").

usage (core python):
  safe_overlay.py <out.png> <frame.png> [<frame2.png> ...] [--labels "Before" "After"] [--width 540]
Each input frame is scaled to --width (9:16), the UI drawn on top, and the frames placed side by side with labels.
Zones (fractions of the frame, from the apps' 2026 layouts; approximate):
  top icons 0-8 %  |  right action column x 86-98 %, y 50-86 %  |  bottom overlay 85-100 % (avatar, @name,
  Subscribe, title/description, music) - keep text and key objects out of these.
"""
import argparse

from PIL import Image, ImageDraw, ImageFont


def font(size, bold=False):
    for name in (("seguisb.ttf", "segoeuib.ttf") if bold else ("segoeui.ttf",)) + ("arial.ttf",):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def overlay(im):
    W, H = im.size
    base = im.convert("RGBA")
    ui = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ui)
    s = W / 540
    white, soft = (255, 255, 255, 235), (255, 255, 255, 120)
    # shaded danger zones
    d.rectangle([0, 0, W, int(0.08 * H)], fill=(0, 0, 0, 90))
    d.rectangle([0, int(0.85 * H), W, H], fill=(0, 0, 0, 120))
    d.rectangle([int(0.86 * W), int(0.50 * H), W, int(0.86 * H)], fill=(0, 0, 0, 70))
    # top icons: back arrow, search, menu
    y = int(0.04 * H)
    d.line([(int(0.06 * W), y), (int(0.10 * W), y - int(10 * s))], fill=white, width=int(4 * s))
    d.line([(int(0.06 * W), y), (int(0.10 * W), y + int(10 * s))], fill=white, width=int(4 * s))
    for x in (0.80, 0.92):
        d.ellipse([int(x * W) - int(11 * s), y - int(11 * s), int(x * W) + int(11 * s), y + int(11 * s)], outline=white, width=int(3 * s))
    # right action column: like, dislike, comment, share, remix
    for k, lab in enumerate(("12K", "Dislike", "340", "Share", "Remix")):
        cy = int((0.54 + 0.072 * k) * H)
        cx = int(0.92 * W)
        d.ellipse([cx - int(20 * s), cy - int(20 * s), cx + int(20 * s), cy + int(20 * s)], fill=(30, 30, 30, 170), outline=white, width=int(2 * s))
        d.text((cx, cy + int(27 * s)), lab, fill=white, font=font(int(12 * s)), anchor="mm")
    # bottom overlay: avatar, @name, Subscribe, title, music
    ay = int(0.875 * H)
    d.ellipse([int(0.04 * W), ay - int(16 * s), int(0.04 * W) + int(32 * s), ay + int(16 * s)], fill=(200, 200, 200, 230))
    d.text((int(0.12 * W), ay), "@yourchannel", fill=white, font=font(int(17 * s), True), anchor="lm")
    d.rounded_rectangle([int(0.47 * W), ay - int(15 * s), int(0.66 * W), ay + int(15 * s)], radius=int(15 * s), fill=(255, 255, 255, 240))
    d.text((int(0.565 * W), ay), "Subscribe", fill=(15, 15, 15, 255), font=font(int(14 * s), True), anchor="mm")
    d.text((int(0.04 * W), int(0.925 * H)), "Video title and description text goes here #Shorts", fill=white, font=font(int(16 * s)), anchor="lm")
    d.text((int(0.04 * W), int(0.958 * H)), "♪  Original sound", fill=soft, font=font(int(14 * s)), anchor="lm")
    d.line([(0, H - int(3 * s)), (int(0.4 * W), H - int(3 * s))], fill=(255, 0, 0, 230), width=int(3 * s))
    # safe line
    yl = int(0.85 * H)
    for x0 in range(0, W, int(16 * s)):
        d.line([(x0, yl), (x0 + int(9 * s), yl)], fill=(255, 70, 70, 255), width=max(2, int(2 * s)))
    d.text((W - int(8 * s), yl - int(10 * s)), "safe line 85 %", fill=(255, 90, 90, 255), font=font(int(13 * s), True), anchor="rm")
    return Image.alpha_composite(base, ui).convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("frames", nargs="+")
    ap.add_argument("--labels", nargs="*")
    ap.add_argument("--width", type=int, default=540)
    a = ap.parse_args()
    W = a.width
    H = int(W * 16 / 9)
    pad, top = 16, 46 if a.labels else 0
    tiles = [overlay(Image.open(f).convert("RGB").resize((W, H), Image.LANCZOS)) for f in a.frames]
    sheet = Image.new("RGB", (len(tiles) * W + (len(tiles) + 1) * pad, H + 2 * pad + top), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    for i, t in enumerate(tiles):
        x = pad + i * (W + pad)
        sheet.paste(t, (x, pad + top))
        if a.labels and i < len(a.labels):
            d.text((x + W // 2, pad + top // 2), a.labels[i], fill=(240, 240, 240), font=font(26, True), anchor="mm")
    sheet.save(a.out, quality=92)
    print(a.out)


if __name__ == "__main__":
    main()
