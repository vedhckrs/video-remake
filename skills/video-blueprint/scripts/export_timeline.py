"""Step 10b: blueprint.json -> OpenTimelineIO timeline -> .otio, CMX 3600 .edl, .fcpxml, FCP7 .xml.

usage: export_timeline.py <workdir> [--markers downbeats|beats|none]
writes: timeline.otio, timeline.edl, timeline.fcpxml (and timeline_fcp7.xml when the adapter exists)

V1 = one clip per shot, cut from the source file at its exact frames; gradual transitions become
OTIO Transitions (SMPTE_Dissolve for dissolve/fade, named custom ones otherwise - EDL keeps only
dissolves). A1 = the source audio. Markers: shots' text-ins (cyan), SFX hits (green), beats or
downbeats (red), sections (purple), review items (yellow).
Open the .fcpxml in Premiere/Resolve/FCP; relink to the source file if it moved.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log, read_json  # noqa: E402

import opentimelineio as otio  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--markers", choices=["downbeats", "beats", "none"], default="downbeats")
    a = ap.parse_args()
    w = Work(a.workdir)
    bp = read_json(w.root / "blueprint.json")
    src = bp["source"]
    rate = src["fps"]
    n_total = src["frames"]
    RT = lambda f: otio.opentime.RationalTime(f, rate)  # noqa: E731
    TR = lambda f, d: otio.opentime.TimeRange(RT(f), RT(d))  # noqa: E731
    url = Path(src["file"]).resolve().as_uri()

    def media():
        return otio.schema.ExternalReference(target_url=url, available_range=TR(0, n_total))

    tl = otio.schema.Timeline(name=Path(src["file"]).stem + " blueprint")
    tl.global_start_time = RT(0)
    v1 = otio.schema.Track(name="V1 shots", kind=otio.schema.TrackKind.Video)
    tl.tracks.append(v1)
    trans = {t["from"]: t for t in bp["transitions"]}
    for sh in bp["shots"]:
        n = sh["frame_out"] - sh["frame_in"] + 1
        clip = otio.schema.Clip(name=f"{sh['id']} {sh.get('shot_scale') or ''}".strip(),
                                media_reference=media(), source_range=TR(sh["frame_in"], n))
        clip.metadata["blueprint"] = {"id": sh["id"], "description": sh.get("description"),
                                      "camera": [m.get("type") for m in sh["camera"].get("movement", [])],
                                      "palette": [p["hex"] for p in sh.get("palette", [])[:5]]}
        for tl_ in sh.get("text_layers", []):
            if not (sh["frame_in"] <= tl_["frame_in"] <= sh["frame_out"]) or tl_.get("role") == "ui_text":
                continue  # text that started in an earlier shot is marked there
            clip.markers.append(otio.schema.Marker(name=f"TEXT: {tl_['text'][:60]}",
                                                   marked_range=TR(tl_["frame_in"], 0),
                                                   color=otio.schema.MarkerColor.CYAN))
        for ef in sh.get("effects", []):
            if "frame" in ef:
                clip.markers.append(otio.schema.Marker(name=f"FX: {ef['type']}", marked_range=TR(ef["frame"], 0),
                                                       color=otio.schema.MarkerColor.MAGENTA))
        v1.append(clip)
        t = trans.get(sh["id"])
        if t and t["type"] not in ("cut", "sudden_jump") and t.get("duration_frames", 0) > 1:
            half = max(1, t["duration_frames"] // 2)
            ttype = (otio.schema.TransitionTypes.SMPTE_Dissolve if t["type"] in ("dissolve", "fade")
                     else otio.schema.TransitionTypes.Custom)
            v1.append(otio.schema.Transition(name=t["type"], transition_type=ttype,
                                             in_offset=RT(half), out_offset=RT(t["duration_frames"] - half)))

    a1 = otio.schema.Track(name="A1 source audio", kind=otio.schema.TrackKind.Audio)
    if src.get("has_audio"):
        a1.append(otio.schema.Clip(name="source audio", media_reference=media(), source_range=TR(0, n_total)))
        tl.tracks.append(a1)

    # timeline-level markers live on the V1 track (all three adapters keep track/clip markers)
    marks = []
    au = bp["audio"]
    for e in au.get("sfx", []):
        marks.append((e["t"], f"SFX: {e['type']}", otio.schema.MarkerColor.GREEN))
    m = au.get("music") or {}
    if a.markers != "none":
        for t in (m.get("downbeats") if a.markers == "downbeats" else m.get("beats")) or []:
            marks.append((t, "BEAT" if a.markers == "beats" else "BAR", otio.schema.MarkerColor.RED))
    for s in m.get("sections", []):
        marks.append((s["t_in"], f"MUSIC {s['label']}: {s.get('role') or ''}", otio.schema.MarkerColor.PURPLE))
    for r in bp.get("unresolved", []):
        if r.startswith("review:") and "frame " in r:
            try:
                f = int(r.split("frame ")[1].split()[0])
                marks.append((f / rate, "CHECK: " + r[8:70], otio.schema.MarkerColor.YELLOW))
            except ValueError:
                pass
    for t, name, color in marks:
        f = int(t * rate + 1e-6)
        # attach to the clip under that time so EDL/FCPXML keep it
        for clip in v1.find_clips():
            r = clip.range_in_parent()
            if r.start_time.value <= f < r.end_time_exclusive().value:
                local = clip.source_range.start_time.value + (f - r.start_time.value)
                clip.markers.append(otio.schema.Marker(name=name, marked_range=TR(local, 0), color=color))
                break

    out = {}
    otio.adapters.write_to_file(tl, str(w.root / "timeline.otio"))
    out["otio"] = "timeline.otio"
    for fmt, fn, adapter in (("edl", "timeline.edl", "cmx_3600"), ("fcpxml", "timeline.fcpxml", "fcpx_xml"),
                             ("fcp7", "timeline_fcp7.xml", "fcp_xml")):
        try:
            v_only = tl
            if adapter == "cmx_3600":  # EDL: one video track only
                v_only = otio.schema.Timeline(name=tl.name, tracks=[v1.deepcopy()], global_start_time=RT(0))
            otio.adapters.write_to_file(v_only, str(w.root / fn), adapter_name=adapter)
            out[fmt] = fn
        except Exception as ex:
            log(f"export: {fmt} skipped ({type(ex).__name__}: {str(ex)[:120]})")
    log(f"export: {', '.join(out.values())}")


if __name__ == "__main__":
    main()
