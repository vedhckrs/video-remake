# video-remake (private)

Ved's video pipeline as Claude Code skills, plus the code of every video made with it.

| Folder | What |
|---|---|
| `skills/video-remake/` | make a new video that edits like a reference, 2.5D tech explainers (world mode, nano zoom, safe area), sound with earshot, QA gates, upload packages - **the live skill** |
| `skills/video-blueprint/` | analyse any finished video into a blueprint, timeline and report - **the live skill** |
| `projects/<id>/` | each video's code: script.json, project.json, scenes.tsx, worlds/, reports, upload guides + captions |
| `tools/sync_projects.py` | copies project code from the Remotion engine into `projects/` before a commit |

**Live skills = this repo.** `%USERPROFILE%\.claude\skills\video-remake` and `...\video-blueprint` are junctions to
`skills/` here (same pattern as the Remotion skills), so editing a skill edits the repo. Media (MP4, audio, zips,
renders) never goes into Git - it stays in `C:\Users\VED\Documents\Local\Reverse` (deliverables) and
`D:\VideoBlueprint` (engine, envs, jobs).

## Workflow for every new feature or fix (Ved, 25 Nov 2026)
1. `git switch main` and `git pull`
2. `git switch -c feat/<short-name>` (or `fix/<short-name>`)
3. work; then `python tools/sync_projects.py` if a video project changed
4. commit with a clear message (what + why)
5. `git push -u origin <branch>`
6. open a pull request into `main` (`gh pr create`), with a summary and how it was checked
7. Ved reviews and merges (Claude does not merge unless Ved says so)

## Accounts (never mix)
This repo uses its OWN GitHub account, set per repo (remote URL with the username + local user.name / user.email).
Never the global identity (VED / vedhckrs) and never creative2-cyber (that one is only for `creative2-cyber/Remotion`).
