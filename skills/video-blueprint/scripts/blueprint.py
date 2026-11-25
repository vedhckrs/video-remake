"""video-blueprint orchestrator. Runs each stage in its own Python environment.

  python blueprint.py doctor
  python blueprint.py run <video> [--out DIR] [--language hi] [--diarize] [--ocr-lang en]
                                  [--only stage,stage] [--skip stage,stage]
  python blueprint.py redo <workdir>        # after resolve.py: keyframes, camera, rhythm, vision form again
  python blueprint.py finish <workdir>      # after the vision pass: objects (SAM 3), blueprint, timelines, report
  python blueprint.py status <workdir>

Run it with the core env:  D:\\VideoBlueprint\\envs\\core\\Scripts\\python.exe blueprint.py ...
A stage whose environment is missing is skipped and recorded; the blueprint lists what that leaves open.
"""
import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import ENVS, MODELS, REPOS, SCRIPTS, VB_HOME, Work, env_exists, env_python, hf_token, log, stage_environ  # noqa: E402

# name: (env, script, needs)   "needs" = raw files that must exist first
STAGES = {
    "probe":       ("core", "probe.py", []),
    "cuts":        ("core", "cuts.py", []),
    "transitions": ("omnishotcut", "transitions_omnishotcut.py", []),
    "shots":       ("core", "shots.py", ["scenes"]),
    "keyframes":   ("core", "keyframes.py", ["shots"]),
    "camera_flow": ("core", "camera_flow.py", ["shots"]),
    "ocr":         ("ocr", "ocr.py", []),
    "stems":       ("music", "stems.py", []),
    "speech":      ("speech", "speech.py", []),
    "beats":       ("music", "beats.py", []),
    "sections":    ("music", "sections.py", []),
    "sections_ai": ("allin1", "sections_allin1.py", ["sections"]),
    "sfx":         ("audiosep", "sfx_audiosep.py", []),
    "prosody":     ("music", "prosody.py", ["words"]),
    "rhythm":      ("core", "rhythm.py", ["shots"]),
    "vision_form": ("core", "vision_template.py", ["shots"]),
    "objects":     ("sam3", "objects_sam3.py", ["shots"]),
    "camera_3d":   ("megasam", "camera_megasam.py", ["shots"]),
    "build":       ("core", "build_blueprint.py", ["shots"]),
    "export":      ("core", "export_timeline.py", []),
    "report":      ("core", "report.py", []),
}
RUN_ORDER = ["probe", "cuts", "transitions", "shots", "keyframes", "camera_flow", "ocr", "stems", "speech",
             "beats", "sections", "sections_ai", "sfx", "prosody", "rhythm", "vision_form"]
REDO_ORDER = ["keyframes", "camera_flow", "rhythm", "vision_form"]
FINISH_ORDER = ["objects", "camera_3d", "build", "export", "report"]
FALLBACK = {"sfx": ("music", "sfx.py")}  # licence-clean onset heuristic when AudioSep is not installed


def run_stage(name, w, extra, runlog):
    env, script, needs = STAGES[name]
    if not env_exists(env) and name in FALLBACK:
        env, script = FALLBACK[name]
    if not env_exists(env):
        log(f"[{name}] skipped: env '{env}' not installed")
        runlog[name] = {"status": "skipped", "why": f"env {env} missing"}
        return False
    missing = [n for n in needs if not w.has(n)]
    if missing:
        log(f"[{name}] skipped: needs {missing}")
        runlog[name] = {"status": "skipped", "why": f"needs {missing}"}
        return False
    if name == "objects" and not ((w.load("vision", {}) or {}).get("object_prompts")):
        log("[objects] skipped: no object_prompts in raw/vision.json")
        runlog[name] = {"status": "skipped", "why": "no object prompts"}
        return False
    args = [str(env_python(env)), str(SCRIPTS / script)]
    args += [w.root.as_posix()] if name != "probe" else []
    args += extra.get(name, [])
    logs = w.root / "logs"
    logs.mkdir(exist_ok=True)
    t0 = time.time()
    log(f"[{name}] running in env '{env}' ...")
    p = None
    for attempt in (1, 2):
        try:
            with open(logs / f"{name}.log", "w", encoding="utf-8") as lf:
                # stdin closed: ffmpeg (used inside Demucs/torchaudio/WhisperX) can block reading an inherited stdin
                p = subprocess.run(args, stdout=lf, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
                                   env=stage_environ(), cwd=str(w.root))
            break
        except OSError as ex:
            # Windows Smart App Control can refuse a launch once (WinError 4551) and allow it on retry
            log(f"[{name}] launch refused ({ex}); {'retrying' if attempt == 1 else 'giving up'}")
            time.sleep(3)
    if p is None:
        runlog[name] = {"status": "failed", "why": "launch blocked by Windows Application Control"}
        return False
    dt = round(time.time() - t0, 1)
    tail = (logs / f"{name}.log").read_text(encoding="utf-8", errors="replace").strip().splitlines()[-3:]
    ok = p.returncode == 0
    runlog[name] = {"status": "ok" if ok else "failed", "seconds": dt, "env": env, "script": script}
    for line in tail:
        if ok and "[video-blueprint]" not in line:
            continue
        print("   " + line)
    if not ok:
        log(f"[{name}] FAILED after {dt}s - see logs/{name}.log")
    else:
        log(f"[{name}] done in {dt}s")
    return ok


def save_runlog(w, runlog):
    p = w.raw / "run_log.json"
    old = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    old.update(runlog)
    p.write_text(json.dumps(old, indent=2), encoding="utf-8")


def doctor():
    print(f"VB_HOME {VB_HOME}")
    for e in ("core", "omnishotcut", "ocr", "speech", "music", "allin1", "audiosep", "sam3", "megasam"):
        print(f"  env {e:12s} {'OK' if env_exists(e) else 'missing'}")
    print(f"  ffmpeg       {'OK' if shutil.which('ffmpeg') else 'MISSING'}")
    print(f"  AudioSep ckpt {'OK' if (REPOS / 'AudioSep' / 'checkpoint' / 'audiosep_base_4M_steps.ckpt').exists() else 'missing'}")
    print(f"  whisper large-v3 {'OK' if (MODELS / 'faster-whisper-large-v3' / 'model.bin').exists() else 'downloads on first run (3 GB)'}")
    print(f"  HF token     {'present' if hf_token() else 'missing (needed for speaker labels and SAM 3)'}")
    try:
        out = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total,memory.used", "--format=csv,noheader"],
                             capture_output=True, text=True).stdout.strip()
        print(f"  GPU          {out}")
    except FileNotFoundError:
        print("  GPU          nvidia-smi not found")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("doctor")
    r = sub.add_parser("run")
    r.add_argument("video")
    r.add_argument("--out")
    r.add_argument("--language", help="force speech language (Hinglish: hi)")
    r.add_argument("--diarize", action="store_true")
    r.add_argument("--ocr-lang", default="en")
    r.add_argument("--only")
    r.add_argument("--skip")
    for c in ("redo", "finish", "status"):
        sub.add_parser(c).add_argument("workdir")
    a = ap.parse_args()

    if a.cmd == "doctor":
        return doctor()
    if a.cmd == "status":
        w = Work(a.workdir)
        print(json.dumps({"raw": sorted(p.stem for p in w.raw.glob("*.json")),
                          "run_log": json.loads((w.raw / "run_log.json").read_text()) if (w.raw / "run_log.json").exists() else {}},
                         indent=2))
        return

    runlog = {}
    if a.cmd == "run":
        video = Path(a.video).resolve()
        out = Path(a.out) if a.out else video.parent / f"{video.stem}_blueprint"
        w = Work(out)
        extra = {"probe": [str(video), w.root.as_posix()], "ocr": ["--lang", a.ocr_lang]}
        if a.language:
            extra["speech"] = ["--language", a.language]
        if a.diarize:
            extra.setdefault("speech", []).append("--diarize")
        order = RUN_ORDER
        if a.only:
            order = [s for s in RUN_ORDER if s in a.only.split(",")]
        if a.skip:
            order = [s for s in order if s not in a.skip.split(",")]
        for s in order:
            ok = run_stage(s, w, extra, runlog)
            if s == "probe" and not ok:
                break
        save_runlog(w, runlog)
        S = w.load("shots", {}) or {}
        print()
        log(f"work folder: {w.root}")
        if S.get("review"):
            log(f"{len(S['review'])} boundary(ies) to review - look at keyframes/T##_strip.jpg, then resolve.py:")
            for rv in S["review"]:
                print("   - " + rv)
        log("next: vision pass - fill raw/vision.todo.json from keyframes/*_sheet.jpg, save as raw/vision.json, "
            "then: blueprint.py finish " + w.root.as_posix())
    elif a.cmd == "redo":
        w = Work(a.workdir)
        for s in REDO_ORDER:
            run_stage(s, w, {}, runlog)
        save_runlog(w, runlog)
    elif a.cmd == "finish":
        w = Work(a.workdir)
        for s in FINISH_ORDER:
            run_stage(s, w, {}, runlog)
        save_runlog(w, runlog)
        log(f"open: {(w.root / 'report.html').as_posix()}")


if __name__ == "__main__":
    main()
