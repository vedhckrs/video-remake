"""Copy each remake project's CODE from the Remotion engine into this repo (projects/<id>/) before a commit.

usage: python tools/sync_projects.py [--engine D:\\VideoBlueprint\\remakes\\engine] [--dry-run]

The engine (`<VB>\\remakes\\engine\\projects\\<id>`) stays the working place - Remotion resolves `../../src/kit`
imports from there, so projects cannot be linked into the repo. This copies only text sources (script.json,
project.json, vo_words.json, scenes.tsx, worlds/*.tsx, recipe/compare/qa reports, upload guides + captions) and never
media (MP4, WAV, MP3, PNG, JPG, zips) or the out/ and frames/ folders. Files deleted in the engine are removed here.
"""
import argparse
import filecmp
import os
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CODE_EXT = {".json", ".tsx", ".ts", ".md", ".srt", ".txt", ".py"}
SKIP_DIRS = {"out", "frames", "node_modules", "__pycache__", "stills", "check"}
SKIP_NAMES = ("project_before_",)   # timeline backups made while fixing


def wanted(rel: Path) -> bool:
    if any(part in SKIP_DIRS for part in rel.parts[:-1]):
        return False
    if rel.name.startswith(SKIP_NAMES):
        return False
    return rel.suffix.lower() in CODE_EXT


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", default=os.environ.get("VB_HOME", r"D:\VideoBlueprint") + r"\remakes\engine")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    src_root = Path(a.engine) / "projects"
    dst_root = REPO / "projects"
    added = changed = removed = 0
    for proj in sorted(p for p in src_root.iterdir() if p.is_dir()):
        dst = dst_root / proj.name
        keep = set()
        for f in proj.rglob("*"):
            if not f.is_file():
                continue
            rel = f.relative_to(proj)
            if not wanted(rel):
                continue
            keep.add(rel)
            out = dst / rel
            if out.exists() and filecmp.cmp(f, out, shallow=False):
                continue
            added += not out.exists()
            changed += out.exists()
            if not a.dry_run:
                out.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, out)
        if dst.exists():
            for f in list(dst.rglob("*")):
                if f.is_file() and f.relative_to(dst) not in keep:
                    removed += 1
                    if not a.dry_run:
                        f.unlink()
    print(f"projects synced from {src_root}: {added} added, {changed} changed, {removed} removed"
          + (" (dry run)" if a.dry_run else ""))


if __name__ == "__main__":
    main()
