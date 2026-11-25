"""Step 10c: blueprint.json -> report.html (storyboard + timeline + rules), opened next to the files.

usage: report.py <workdir>
The page uses relative paths to keyframes/, so keep it inside the work folder.
"""
import html
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log, read_json  # noqa: E402

CSS = """
:root{--bg:#f6f5f2;--card:#fff;--ink:#1d1d1f;--mute:#6b6b70;--line:#e3e1dc;--acc:#e4572e;--acc2:#2e86ab;
--beat:#c0392b;--word:#7b61ff;--sfx:#1b9e5a;--text:#0099b8;--sec:#a05bd6}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--card:#1e1e22;--ink:#ececef;--mute:#9a9aa2;--line:#303036}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 Inter,Segoe UI,system-ui,sans-serif}
main{max-width:1280px;margin:0 auto;padding:24px 16px 64px}h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 12px}
.mute{color:var(--mute)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:16px 0}
.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.stat b{display:block;font-size:18px}
.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
ul{margin:6px 0;padding-left:20px}.shot{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;
background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin:12px 0}
@media(max-width:820px){.shot{grid-template-columns:1fr}}.shot img{width:100%;border-radius:8px;display:block}
.tag{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:1px 8px;margin:2px 4px 2px 0;font-size:12px}
.sw{display:inline-block;width:22px;height:22px;border-radius:5px;margin-right:4px;vertical-align:middle;border:1px solid var(--line)}
.tr{margin:-4px 0 12px 24px;padding:8px 12px;border-left:3px solid var(--acc);font-size:13px}.tr img{max-width:100%;border-radius:6px;margin-top:6px}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{text-align:left;padding:3px 6px;border-bottom:1px solid var(--line);vertical-align:top}
.tl{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px}
code{font:12px Consolas,monospace}.warn{border-left:3px solid #e0a800}
"""


def e(x):
    return html.escape(str(x)) if x is not None else ""


def timeline_svg(bp):
    D = bp["source"]["duration_s"] or 1
    W = max(1100, int(D * 60))
    X = lambda t: 70 + (W - 80) * t / D  # noqa: E731
    rows = {"shots": 18, "text": 52, "voice": 96, "music": 132, "sfx": 166}
    s = [f'<svg width="{W}" height="240" viewBox="0 0 {W} 240" font-size="10" font-family="Segoe UI,sans-serif">']
    for name, y in rows.items():
        s.append(f'<text x="4" y="{y + 12}" fill="var(--mute)">{name}</text>')
    for t in range(0, int(D) + 1):
        s.append(f'<line x1="{X(t):.1f}" y1="10" x2="{X(t):.1f}" y2="235" stroke="var(--line)"/>'
                 f'<text x="{X(t) + 2:.1f}" y="236" fill="var(--mute)">{t}s</text>')
    for i, sh in enumerate(bp["shots"]):
        c = "var(--acc)" if i % 2 else "var(--acc2)"
        s.append(f'<rect x="{X(sh["t_in"]):.1f}" y="{rows["shots"]}" width="{max(1, X(sh["t_out"]) - X(sh["t_in"])):.1f}" '
                 f'height="24" rx="3" fill="{c}" opacity=".85"><title>{e(sh["id"])} {sh["t_in"]:.3f}-{sh["t_out"]:.3f}s</title></rect>'
                 f'<text x="{X(sh["t_in"]) + 3:.1f}" y="{rows["shots"] + 16}" fill="#fff">{e(sh["id"])}</text>')
    lane = 0
    for sh in bp["shots"]:
        for tl in sh["text_layers"]:
            if tl["frame_in"] < sh["frame_in"] or tl.get("role") == "ui_text":
                continue
            y = rows["text"] + (lane % 3) * 12
            lane += 1
            s.append(f'<rect x="{X(tl["t_in"]):.1f}" y="{y}" width="{max(2, X(tl["t_out"]) - X(tl["t_in"])):.1f}" height="9" '
                     f'rx="2" fill="var(--text)" opacity=".7"><title>{e(tl["text"])} {tl["t_in"]:.3f}-{tl["t_out"]:.3f}s</title></rect>')
    for wd in bp["audio"]["voiceover"].get("words", []):
        s.append(f'<rect x="{X(wd["t_in"]):.1f}" y="{rows["voice"]}" width="{max(1.5, X(wd["t_out"]) - X(wd["t_in"])):.1f}" '
                 f'height="22" fill="var(--word)" opacity=".55"><title>{e(wd["w"])} {wd["t_in"]:.3f}s</title></rect>')
    m = bp["audio"]["music"]
    for sec in m.get("sections", []):
        s.append(f'<rect x="{X(sec["t_in"]):.1f}" y="{rows["music"] - 4}" width="{X(sec["t_out"]) - X(sec["t_in"]):.1f}" '
                 f'height="30" fill="var(--sec)" opacity=".10"/><text x="{X(sec["t_in"]) + 3:.1f}" y="{rows["music"] + 24}" '
                 f'fill="var(--sec)">{e(sec["label"])} {e(sec.get("role") or "")}</text>')
    downs = set(round(d, 3) for d in m.get("downbeats", []))
    for b in m.get("beats", []):
        h = 22 if round(b, 3) in downs else 12
        s.append(f'<line x1="{X(b):.1f}" y1="{rows["music"]}" x2="{X(b):.1f}" y2="{rows["music"] + h}" stroke="var(--beat)" '
                 f'stroke-width="{2 if h == 22 else 1}"/>')
    for ev in bp["audio"].get("sfx", []):
        s.append(f'<circle cx="{X(ev["t"]):.1f}" cy="{rows["sfx"] + 8}" r="5" fill="var(--sfx)"><title>{e(ev["type"])} '
                 f'{ev["t"]:.3f}s</title></circle>')
    for t in bp["transitions"]:
        s.append(f'<line x1="{X(t["t_start"]):.1f}" y1="10" x2="{X(t["t_start"]):.1f}" y2="200" stroke="var(--ink)" '
                 f'stroke-dasharray="2 3" opacity=".35"/>')
    s.append("</svg>")
    return "".join(s)


def main(workdir):
    w = Work(workdir)
    bp = read_json(w.root / "blueprint.json")
    src, au = bp["source"], bp["audio"]
    vo, mu = au["voiceover"], au["music"]
    rh = bp.get("rhythm", {})
    trans = {t["from"]: t for t in bp["transitions"]}
    out = [f"<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
           f"<title>Video blueprint</title><style>{CSS}</style><main>"]
    out.append(f"<h1>{e(Path(src['file']).name)}</h1><div class=mute>{e(bp.get('video_type') or 'Video blueprint')} · "
               f"{e(src['resolution'])} · {src['fps']:g} fps{' (VFR→CFR)' if src.get('vfr') else ''} · {src['duration_s']:.2f} s</div>")
    stats = [("Shots", len(bp["shots"])), ("Avg shot", f"{rh.get('avg_shot_len_s', 0):.2f} s"),
             ("Transitions", ", ".join(sorted({t['type'] for t in bp['transitions']})) or "-"),
             ("BPM", mu.get("bpm") or "-"), ("Key", (mu.get("key") or "-").split(" (")[0]),
             ("Voice", f"{vo.get('language') or '-'} · {vo.get('pace_wpm') or '-'} wpm"),
             ("Captions", len({(t["text"], t["frame_in"]) for s in bp["shots"] for t in s["text_layers"] if t.get("role") != "ui_text"})),
             ("SFX hits", len(au.get("sfx", [])))]
    out.append("<div class=grid>" + "".join(f"<div class=stat><span class=mute>{e(k)}</span><b>{e(v)}</b></div>" for k, v in stats) + "</div>")
    if rh.get("rules_inferred"):
        out.append("<h2>Edit rules found</h2><div class=box><ul>" + "".join(f"<li>{e(r)}</li>" for r in rh["rules_inferred"]) + "</ul></div>")
    if bp.get("narrative"):
        out.append("<h2>Narrative</h2><div class=box><table><tr><th>Section</th><th>Time</th><th>Purpose</th></tr>" +
                   "".join(f"<tr><td>{e(n.get('section'))}</td><td>{e(n.get('t_in'))}–{e(n.get('t_out'))} s</td><td>{e(n.get('purpose'))}</td></tr>"
                           for n in bp["narrative"]) + "</table></div>")
    out.append("<h2>Timeline</h2><div class=tl>" + timeline_svg(bp) + "</div>")
    if Path(w.keyframes / "storyboard.jpg").exists():
        out.append("<h2>Storyboard</h2><img src='keyframes/storyboard.jpg' style='width:100%;border-radius:12px' alt='storyboard'>")
    out.append("<h2>Shot by shot</h2>")
    words = vo.get("words", [])
    for sh in bp["shots"]:
        cam = ", ".join(f"{m.get('type')}{' (' + m['speed'] + ')' if m.get('speed') else ''}" for m in sh["camera"].get("movement", []))
        pal = "".join(f"<span class=sw title='{e(p['hex'])} {p['share']:.0%}' style='background:{e(p['hex'])}'></span>" for p in sh.get("palette", []))
        g = sh.get("grade", {})
        vw = " ".join(x["w"] for x in words if sh["t_in"] <= x["t_in"] < sh["t_out"])
        sfx = ", ".join(f"{x['type']} @{x['t']:.2f}s" for x in au.get("sfx", []) if sh["t_in"] <= x["t"] < sh["t_out"])
        texts = "".join(f"<tr><td>{e(t['text'])}</td><td>{t['t_in']:.3f}–{t['t_out']:.3f}</td><td>{e(t.get('reveal') or (t.get('anim') or {}).get('in') or '')}</td></tr>"
                        for t in sh["text_layers"] if t["frame_in"] >= sh["frame_in"] and t.get("role") != "ui_text")
        n_ui = sum(1 for t in sh["text_layers"] if t["frame_in"] >= sh["frame_in"] and t.get("role") == "ui_text")
        if n_ui:
            texts += f"<tr><td colspan=3 class=mute>+ {n_ui} UI text items (in blueprint.json)</td></tr>"
        fx = ", ".join(f"{x['type']}" + (f" @{x['t']:.2f}s" if "t" in x else "") for x in sh.get("effects", []))
        img = f"<img src='{e(sh['sheet'])}' alt='{e(sh['id'])}'>" if sh.get("sheet") else ""
        out.append(f"<div class=shot><div>{img}</div><div><b>{e(sh['id'])}</b> <span class=mute>{sh['t_in']:.3f}–{sh['t_out']:.3f} s · "
                   f"{sh['duration_s']:.2f} s · frames {sh['frame_in']}–{sh['frame_out']}</span><br>"
                   f"{'<span class=tag>' + e(sh['shot_scale']) + '</span>' if sh.get('shot_scale') else ''}"
                   f"{''.join('<span class=tag>' + e(m.get('type')) + '</span>' for m in sh['camera'].get('movement', []))}"
                   f"<p>{e(sh.get('description') or '')}</p>"
                   f"<div>{pal}</div><div class=mute style='font-size:12px'>black {e(g.get('black_level_ire_est'))} IRE · white {e(g.get('white_level_ire_est'))} IRE · "
                   f"sat {e(g.get('saturation_mean'))} · warmth {e(g.get('warmth_b_star'))}{' · ' + e(g['look']) if g.get('look') else ''}</div>"
                   f"<p><b>Camera</b> {e(cam) or '-'}"
                   f"{'<br>' + e(sh['camera'].get('semantic')) if sh['camera'].get('semantic') else ''}</p>"
                   f"{'<p><b>Voice</b> ' + e(vw) + '</p>' if vw else ''}{'<p><b>SFX</b> ' + e(sfx) + '</p>' if sfx else ''}"
                   f"{'<p><b>Effects</b> ' + e(fx) + '</p>' if fx else ''}"
                   f"{'<table><tr><th>Text</th><th>In–out (s)</th><th>Anim</th></tr>' + texts + '</table>' if texts else ''}</div></div>")
        t = trans.get(sh["id"])
        if t:
            strip = f"<br><img src='{e(t['strip'])}' alt='strip'>" if t.get("strip") else ""
            hint = (" · hints: " + ", ".join(k for k, v in t.get("hints", {}).items() if v)) if t.get("hints") else ""
            over = f" over {t['duration_frames']} frames" if t.get("duration_frames") else ""
            out.append(f"<div class=tr><b>{e(t['type'])}</b> {e(t['from'])}→{e(t['to'])} at {t['t_start']:.3f} s"
                       f"{over} · conf {t['confidence']:.2f} · "
                       f"<span class=mute>{e(t['source'])}{e(hint)}</span>{strip}</div>")
    out.append("<h2>Still open</h2><div class='box warn'><ul>" + "".join(f"<li>{e(u)}</li>" for u in bp.get("unresolved", [])) + "</ul></div>")
    files = [f for f in ("blueprint.json", "timeline_fcp7.xml", "timeline.fcpxml", "timeline.edl", "timeline.otio", "words.srt", "beats.tsv")
             if (w.root / f).exists()]
    out.append("<h2>Files</h2><div class=box>" + " · ".join(f"<a href='{f}'>{f}</a>" for f in files) +
               "<p class=mute>Premiere: File → Import → timeline_fcp7.xml. Resolve / FCP: timeline.fcpxml. Stems in stems/.</p></div>")
    out.append("</main></html>")
    (w.root / "report.html").write_text("".join(out), encoding="utf-8")
    log("report: report.html")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
