# "Why iOS feels so smooth" - Act 1 - where things stand (saved 26 Nov 2026, ~20:40)

Ved stopped for the night: "don't render, just save all things ... we render after I come and tell you to render".
**Do not start a full render until Ved says so.**

## State
- Script (9 scenes, 362 words), voice `public/ios-smooth-act1/vo.mp3` (129.4 s, Liam) and timeline (`project.json`,
  130.58 s, 1920x1080 @ 60, `gl: angle`) are final. S02 now enters by a plain `cut` (was portal).
- Scene code `worlds/*.tsx` is the latest: v2 fix round (real iPhone 18 Pro model, 3D transistor, 3D MacBook Air M1 with
  Ved's wallpaper, decluttered radio labels, rebuilt render-loop machine, real photos of the first iPhone and the A4,
  no lines, no overlaid glows) PLUS the camera fix round of 26 Nov evening (hook / S02 / S09: hard cuts between hook
  shots, one continuous board move through the 0:10 join, one constant-rate dive, eased S09 moves). Type-checks clean.
- **The camera fix round has NOT been rendered in full.** `out/ios-smooth-act1.mp4` / `_raw.mp4` are still the v2
  picture from 19:23 (the cut Ved rejected for the 0:10 jump and the sound). A re-render was started at ~20:33 and
  stopped at frame 48 on Ved's instruction; nothing was overwritten.
- Camera numbers: v2 render per scene S01 2.93 / S02 1.50 / S09 1.46 (limit 0.9), others 0.39-0.79. After the fix the
  agent measured S01 0.64 / S02 0.72 / S09 0.53 on quarter-size per-scene renders - NOT yet confirmed on a full render.
- Sound: a redesign is in progress / delivered by the sound agent (fewer and better-matched effects, a new music bed,
  re-balanced mix): see `out/sound_spotting.md`, `out/ab_*_before.mp4` / `_after.mp4`, `out/v2/ios-smooth-act1_mix_before.mp4`
  (old mix). Ved rejected the old sound: "sfx not good, looks cheap, AI generated". The final mix must be run on the NEW
  picture after the re-render.

## When Ved says "render"
1. `D:\VideoBlueprint\envs\core\Scripts\python.exe <skill>\scripts\render.py . video` (about 20 min, GPU backend from project.json).
2. Mix with the sound agent's rerun recipe (in its report / `out/sound_spotting.md`), then `sound_design.py . listen`.
3. `qa_explainer.py .`; measure the camera per scene (`D:\VideoBlueprint\remakes\sbx-act1-a\jig.py <mp4> project.json`);
   look at every frame around 10.38 s (the old jump) and at the review sheets before handing over.
4. Copy the cut to `C:\Users\VED\Documents\Local\Reverse\deliverables\ios-smooth\ios-smooth_act1_v3.mp4`.

## Open points for Ved
- "P.A. Semi" at 1:23 is spoken fast - re-voice that sentence only if he asks.
- Apple-owned assets shown at his request: the iPhone 18 Pro AR model, the macOS wallpaper (S07). Real photos shown
  with credits: first iPhone (Pavel Ševela, CC BY-SA 3.0), Apple A4 (Raimond Spekking, CC BY-SA 4.0).
- MacBook: a real model on Sketchfab was paid ($29, editorial licence) so a code-built 3D MacBook Air M1 was made instead.
- Act 2 budget: Act 1 used $20.43 of the $25 API cap (first drafts only); all later work ran on plan agents.
- Acts 2-4 not started. Each act starts only after Ved approves the previous one.

## Where things are
- Project: `D:\VideoBlueprint\remakes\engine\projects\ios-smooth-act1` · assets: `...\engine\public\ios-smooth-act1`
  (`img\` cleared photos + wallpaper, `ref\` drawing references) · model + HDRIs: `...\engine\public\models`, `hdri`
  (never in git) · sandboxes: `D:\VideoBlueprint\remakes\sbx-act1-a|b|c` (each agent's brief.md / fix.md / out\) ·
  v1 scene backup: `D:\VideoBlueprint\remakes\backups\ios-smooth-act1\worlds_v1`.
- Cuts: `C:\Users\VED\Documents\Local\Reverse\deliverables\ios-smooth\ios-smooth_act1_v1.mp4`, `_v2.mp4`.
- Previews: `C:\Users\VED\Documents\Local\Reverse\previews\ios-smooth-act1`, `cine3d-demo`, `silicon-demo`.
- API ledger: `D:\VideoBlueprint\remakes\api_ledger\ios-smooth-act1.json`.
