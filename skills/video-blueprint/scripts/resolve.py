"""Apply Claude's (or Ved's) decisions to the shot list after looking at the review strips.

usage:
  resolve.py <workdir> --merge T01 --as light_sweep     # not a cut: fold into one shot, keep as an in-shot effect
  resolve.py <workdir> --retype T03 --type whip_pan      # it is a transition, but of another kind
  resolve.py <workdir> --confirm T02                     # keep as is, clear its review note
  resolve.py <workdir> --add-cut 412 [--type cut]        # a cut both detectors missed (frame number)
Several flags can be combined; T-ids refer to the CURRENT raw/shots.json, applied right-to-left
so the ids stay valid. Every decision is appended to raw/decisions.json. Re-run keyframes,
camera_flow and rhythm afterwards (blueprint.py redo <workdir> does it).
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, f2t, log  # noqa: E402


def renumber(shots, transitions, fps):
    ids = {}
    for i, s in enumerate(shots):
        ids[s["id"]] = f"S{i + 1:02d}"
        s["id"] = ids[s["id"]]
        s["t_in"], s["t_out"] = f2t(s["frame_in"], fps), f2t(s["frame_out"] + 1, fps)
        s["duration_s"] = round((s["frame_out"] + 1 - s["frame_in"]) / fps, 6)
    for i, t in enumerate(transitions):
        t["from"], t["to"] = shots[i]["id"], shots[i + 1]["id"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--merge", action="append", default=[])
    ap.add_argument("--as", dest="as_", action="append", default=[], help="effect name for each --merge")
    ap.add_argument("--retype", action="append", default=[])
    ap.add_argument("--type", action="append", default=[], help="type for each --retype / --add-cut")
    ap.add_argument("--confirm", action="append", default=[])
    ap.add_argument("--add-cut", action="append", default=[],
                    help="FRAME or FRAME:START-END (a gradual transition centred on FRAME)")
    ap.add_argument("--range", action="append", default=[],
                    help="T02=START,END - set a transition's exact frame span (boundary = middle)")
    ap.add_argument("--note", default="")
    ap.add_argument("--clear-review", action="store_true", help="every review item has been checked")
    a = ap.parse_args()
    w = Work(a.workdir)
    fps = w.probe["fps"]
    S = w.load("shots")
    shots, trans = S["shots"], S["transitions"]
    log_rows = (w.load("decisions", {"decisions": []}) or {"decisions": []})
    types = list(a.type)

    def idx(tid):
        return int(tid.lstrip("Tt")) - 1

    for tid in a.retype:
        t = trans[idx(tid)]
        new = types.pop(0) if types else "other"
        log_rows["decisions"].append({"action": "retype", "at_frame": t["frame_start"], "from": t["type"], "to": new,
                                      "note": a.note})
        t.update({"type": new, "source": t["source"] + "+manual", "confidence": 0.9})
    for spec in a.range:
        tid, span = spec.split("=")
        i = idx(tid)
        fs, fe = (int(x) for x in span.split(","))
        b = (fs + fe + 1) // 2
        t = trans[i]
        t.update({"frame_start": fs, "frame_end": fe, "duration_frames": fe - fs,
                  "t_start": f2t(fs, fps), "t_end": f2t(fe, fps)})
        shots[i]["frame_out"], shots[i + 1]["frame_in"] = b - 1, b
        log_rows["decisions"].append({"action": "range", "transition": tid, "frames": [fs, fe]})
    for tid in a.confirm:
        t = trans[idx(tid)]
        t["confidence"] = max(t["confidence"], 0.9)
        t["source"] += "+confirmed"
        log_rows["decisions"].append({"action": "confirm", "at_frame": t["frame_start"], "type": t["type"]})

    effects = list(zip(a.merge, a.as_ + ["in_shot_effect"] * (len(a.merge) - len(a.as_))))
    for tid, eff in sorted(effects, key=lambda e: -idx(e[0])):
        i = idx(tid)
        t = trans.pop(i)
        A, Bs = shots[i], shots.pop(i + 1)
        A["frame_out"] = Bs["frame_out"]
        A.setdefault("effects", []).extend(Bs.get("effects", []))
        A["effects"].append({"type": eff, "frame": t["frame_start"], "t": f2t(t["frame_start"], fps),
                             "frame_end": t["frame_end"], "source": "review (was a candidate cut)"})
        log_rows["decisions"].append({"action": "merge", "at_frame": t["frame_start"], "as": eff, "note": a.note})

    for spec in a.add_cut:
        typ = types.pop(0) if types else "cut"
        f, _, span = str(spec).partition(":")
        f = int(f)
        fs, fe = (int(x) for x in span.split("-")) if span else (f, f)
        i = next(k for k, s in enumerate(shots) if s["frame_in"] < f <= s["frame_out"])
        A = shots[i]
        B = {"id": "new", "frame_in": f, "frame_out": A["frame_out"]}
        A["frame_out"] = f - 1
        shots.insert(i + 1, B)
        trans.insert(i, {"type": typ, "relation": None, "t_start": f2t(fs, fps), "t_end": f2t(fe, fps),
                         "frame_start": fs, "frame_end": fe, "duration_frames": fe - fs, "confidence": 0.9,
                         "source": "manual"})
        log_rows["decisions"].append({"action": "add_cut", "at_frame": f, "type": typ})

    renumber(shots, trans, fps)
    done = {d["at_frame"] for d in log_rows["decisions"] if "at_frame" in d}
    done |= {trans[idx(s.split("=")[0])]["frame_start"] for s in a.range if idx(s.split("=")[0]) < len(trans)}
    S["review"] = [] if a.clear_review else [r for r in S.get("review", []) if not any(f"frame {f} " in r for f in done)]
    w.save("shots", S)
    w.save("decisions", log_rows)
    log(f"resolve: {len(shots)} shots, {len(trans)} transitions, {len(S['review'])} review items left")


if __name__ == "__main__":
    main()
