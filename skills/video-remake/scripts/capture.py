"""Real screenshots for remakes (Playwright + Chromium): a page, an element, or a clipped region, at 2x.

usage:
  capture.py <project dir> <name> <url> [--selector CSS] [--clip x,y,w,h] [--width 1280] [--height 900]
                                        [--scale 2] [--dark] [--full] [--wait 1500] [--hide "css1,css2"]
writes: <engine>/public/<id>/img/<name>.png  (use in scenes as <Shot src="<id>/img/<name>.png" .../>)

Rules: capture only public pages about the video's own topic (the product/repo the video explains), as they
are today; never log in, never capture private data. Cookie banners and sticky headers can be hidden
with --hide. Screenshots are 2x so they stay sharp in a 1080p render.
Runs with any Python that has playwright (Ved's system Python 3.12 has it + Chromium).
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import project_paths  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("name")
    ap.add_argument("url")
    ap.add_argument("--selector")
    ap.add_argument("--clip", help="x,y,w,h in CSS px of the viewport/page")
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--scale", type=float, default=2)
    ap.add_argument("--dark", action="store_true")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--wait", type=int, default=1500, help="ms after load (animations, lazy images)")
    ap.add_argument("--hide", default="", help="comma list of CSS selectors to hide")
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright

    P = project_paths(a.project)
    d = P.pub / "img"
    d.mkdir(parents=True, exist_ok=True)
    out = d / f"{a.name}.png"
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={"width": a.width, "height": a.height}, device_scale_factor=a.scale,
                            color_scheme="dark" if a.dark else "light", locale="en-US")
        pg = ctx.new_page()
        pg.goto(a.url, wait_until="networkidle", timeout=60000)
        if a.hide:
            css = ",".join(s.strip() for s in a.hide.split(",") if s.strip()) + "{display:none !important}"
            pg.add_style_tag(content=css)
        pg.wait_for_timeout(a.wait)
        if a.selector:
            pg.locator(a.selector).first.screenshot(path=str(out))
        elif a.clip:
            x, y, w, h = (float(v) for v in a.clip.split(","))
            pg.screenshot(path=str(out), clip={"x": x, "y": y, "width": w, "height": h}, full_page=True)
        else:
            pg.screenshot(path=str(out), full_page=a.full)
        b.close()
    print(f"[video-remake] screenshot -> {out}  (src in scenes: '{P.id}/img/{a.name}.png')")


if __name__ == "__main__":
    main()
