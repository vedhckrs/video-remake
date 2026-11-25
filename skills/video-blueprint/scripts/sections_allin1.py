"""Step 8d+ : functional music sections with All-In-One (openmirlab/all-in-one-infer, NATTEN-free).

Replaces the librosa sections in raw/sections.json with All-In-One's labelled segments
(intro / verse / chorus / bridge / inst / outro ...), and adds its BPM/beats as a cross-check.
Keeps the librosa key estimate and energy curve.

LICENCE: the code is MIT, but the Harmonix checkpoints are listed by the fork as CC-BY-NC-SA-4.0
(the HF card says MIT - conflicting). Ved accepted using it; every blueprint built with it says
"internal analysis only" next to the sections.

usage: sections_allin1.py <workdir> [--model harmonix-all]
reads: audio_48k.wav (All-In-One runs its own source separation)   writes: raw/sections.json
"""
import argparse
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import Work, log  # noqa: E402


def field(obj, name, default=None):
    if isinstance(obj, dict):
        return obj.get(name, default)
    return getattr(obj, name, default)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--model", default="harmonix-all")
    a = ap.parse_args()
    w = Work(a.workdir)
    if not w.audio.exists():
        return
    import torch
    import allin1_infer

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    with tempfile.TemporaryDirectory() as tmp:
        res = allin1_infer.analyze(str(w.audio), out_dir=tmp, model=a.model, device=dev)
    if isinstance(res, list):
        res = res[0]
    segs = [{"label": str(field(s, "label")), "role_guess": str(field(s, "label")),
             "t_in": round(float(field(s, "start")), 3), "t_out": round(float(field(s, "end")), 3)}
            for s in field(res, "segments", [])]
    old = w.load("sections", {}) or {}
    real = [s for s in segs if s["label"] not in ("start", "end") and s["t_out"] - s["t_in"] > 1.0]
    if len({s["label"] for s in real}) < 2:
        # Short-form edits often read as one long "verse"; that tells less than the energy-based split, so keep
        # librosa's sections and store All-In-One's answer beside them.
        old.update({"allin1_segments": segs, "allin1_bpm": field(res, "bpm"),
                    "allin1_note": "All-In-One found a single section; librosa sections kept"})
        w.save("sections", old)
        log(f"sections (All-In-One): one section only {[s['label'] for s in segs]} - kept librosa sections")
        return
    out = {
        "tool": f"All-In-One ({a.model}, all-in-one-infer) - weights CC-BY-NC-SA-4.0: internal analysis only",
        "licence_note": "sections from non-commercial weights; do not ship them as a client deliverable",
        "sections": segs,
        "allin1_bpm": field(res, "bpm"),
        "allin1_beats": [round(float(b), 4) for b in (field(res, "beats", []) or [])],
        "allin1_downbeats": [round(float(b), 4) for b in (field(res, "downbeats", []) or [])],
        "key_estimate": old.get("key_estimate"), "key_confidence": old.get("key_confidence"),
        "energy_curve": old.get("energy_curve", []),
        "librosa_sections": old.get("sections", []),
    }
    w.save("sections", out)
    log(f"sections (All-In-One): {len(segs)} segments {[s['label'] for s in segs]}, bpm={out['allin1_bpm']} on {dev}")


if __name__ == "__main__":
    main()
