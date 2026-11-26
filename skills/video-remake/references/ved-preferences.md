# Ved's standing preferences and decisions (read before any video)

These came from Ved in the sessions that built this skill (23–24 Nov 2026). They override defaults.
Quotes are Ved's words. Apply them every time without asking again.

## Output
- **English only** for video-remake videos. (Hinglish AlphaTech Shorts belong to remotion-video-producer.)
- **1080×1920, 60 fps MP4**, mastered to about −14 LUFS. ("give me 1080p 60fps mp4 file")
- **No creator handle and no channel name** on screen or in the CTA unless Ved gives one
  ("without handles @alphatechofficials and name of channel"). `"handle": null` in script.json.
- A fresh standalone skill: **never build inside Ved's Remotion repo** (`D:\AlphaTech Youtube\Remotion`)
  and never add to remotion-video-producer ("new skill dont add anything"). Work in `<VB>\remakes\engine`.
- Never touch the `vedhckrs` GitHub account or `vedhckrs/Remotion`.

## Look and motion
- Make it look real: **real SVG brand logos** (Simple Icons) and **real screenshots / feature images**
  of the product ("use real SVG logo like github and others … real features images").
- **More animation, smooth fluid motion**: camera drift on every shot, staggered entrances, springs,
  light sweeps, floating; nothing static.
- Ved's review of v2 (24 Nov): cropped card images and small/sparse layouts "not looks good"; "animation
  looks off". Rules that came out of it (also in SKILL.md "Layout and image rules"):
  - never show a subject cut by its frame — crop to one whole subject, or use the clamped `Shot` camera;
  - fill the frame (hero 80–90 % of width, content between ~25 % and ~82 % of the height);
  - comparisons = two whole subjects moving identically (Tilt3D) or a before/after slider, with the real
    measured number;
  - iris wipes start from an element of the outgoing shot;
  - check motion strips frame by frame, not only stills.

## Sound
- "for listening sound use always this repo" — **earshot** (github.com/Leonxlnx/earshot). Effects and
  music are **made in code with earshot**, not AI-generated, and **earshot's ears check them**
  (`sound_design.py palette/cues/music/mix/listen`). Ved asked for "next level" sound design.
- Every visible action gets a sound; every shot change is audible (earshot timeline: no "without a hit").
- Prefer real-action and product-UI designs; no long chimes/bells as effects (from meta-ads-video).
- Target: earshot `critique` "launch-grade" with no critical/major issues (achieved 0.974).
- After the earshot checks, ask Ved for one human listen on headphones (earshot's ears are models).

## Money and approvals
- Show the script + ElevenLabs cost and **wait for Ved's yes** before generating the voice; any re-voice
  is asked again (re-voice of one line ≈ 266–604 characters). One recommended option, cost shown first.
- Keys: ElevenLabs `%USERPROFILE%\.config\elevenlabs\api_key`, read at use, never printed/logged/copied.
  On a 401 or a missing key file: say so and ask Ved — never look for keys elsewhere.

## Facts
- Research facts fresh and date them (stars, versions, prices). Example: reanimate had 2.3k stars on
  23 Nov and 2.4k on 24 Nov — the video was re-voiced to match.
- Licences: All-In-One music-section weights are CC-BY-NC-SA → internal analysis only; non-commercial
  tools (Essentia, CoTracker3, Ultralytics AGPL, VGGT original, Video Depth Anything B/L) are excluded
  from client work. SAM 3 uses Meta's SAM License (commercial OK, restrictions listed in video-blueprint
  `references/tools.md`).

## Work folder and GitHub - decided 25 Nov 2026
- Work folder moved: `C:\Users\VED\Documents\Local\Reverse` ("next work with this location") - deliverables,
  upload-packages, skill-zips, and the git repo `video-remake\` live there.
- **The two skills live in that repo** (`video-remake\skills\video-remake`, `...\video-blueprint`) and are linked into
  `%USERPROFILE%\.claude\skills\` as junctions (same pattern as the Remotion skills). Edit them in place.
- Ved: "connect github for every new feature update - push, branch, PR, commit and all". Repo
  **`vedhckrs/video-remake`, private** (https://github.com/vedhckrs/video-remake) - Ved chose vedhckrs and added the
  exception to his global CLAUDE.md: this is the ONLY vedhckrs repo to work in; `vedhckrs/Remotion` and everything
  else on vedhckrs stay off-limits, and none of this goes into creative2-cyber. Per-repo remote
  `https://vedhckrs@github.com/vedhckrs/video-remake.git`, local user VED / `85392668+vedhckrs@users.noreply.github.com`.
  Never change the global identity or the saved sign-ins.
- GitHub CLI (`C:\Program Files\GitHub CLI\gh.exe`, logged in as vedhckrs) is only for `gh repo` / `gh pr`. It must
  NOT be Git's credential helper (it would take over github.com and break the creative2-cyber pushes): at
  "Authenticate Git with your GitHub credentials?" answer n; check `git config --show-scope --get-all
  credential.https://github.com.helper` is empty.
- Every feature/fix: branch `feat/...` or `fix/...` from main -> `python tools/sync_projects.py` if a video project
  changed -> commit -> push -> PR into main (`gh pr create`) -> **merge it straight away** (Ved, 25 Nov 2026: "always
  merge and update latest features up to date") -> `git switch main` + `git pull` (live skills) -> rebuild the skill
  zips in `C:\Users\VED\Documents\Local\Reverse\skill-zips`. Never leave a feature branch checked out at the end.
- Tracks skills + per-video project code only; media (MP4/WAV/MP3/zips/renders) never goes into Git.

## Working style Ved asked for
- "give me plan first" on new requests; then build. Short status lines while long jobs run.
- When asked to "finish the skill properly": test cases + baselines + grading (skill-creator loop).
- Deliver zips of the skills in `C:\Users\VED\Documents\Local\Reverse\skill-zips\` (`video-remake-suite.zip` =
  both skills + INSTALL.md) whenever the skills change, so he can install them on another account.
- Don't load unrelated skills when Ved asks a direct question about this one.

## PC facts that matter here
- RTX 3050 8 GB, i7-14700F (28 threads), 32 GB RAM, Windows 11 Pro, work drive D:.
- **Smart App Control is ON** since the 23 Nov 2026 restart → envs on signed python.org Python only.
- earshot install is shared with meta-ads-video at `D:\Sumit\tools\earshot` (never reinstall).
- No WSL; no `gh` CLI; Node 24 + Remotion 4.0.544; FFmpeg 9; Python 3.12.10 / 3.10.11 (python.org).

## Explainer style (keyframes-explainer) - decided 24 Nov 2026
- Goal (Ved): reach the level of 12 code-made 2.5D tech explainers "and even better" - "full code, no 3d
  draw, no threejs, only 2d code look 3d". Style library: `references/styles/keyframes-explainer.md`.
- Phase A analysis ran on **Ved's own Anthropic API** with **Claude Fable 5.2** ("use my API for Fable 5.2
  model each"): `ant auth login` profile, org Onealphamend Pvt. Ltd (user "Anu"), $96 promotional API credit
  valid to 13 Dec 2026. Cost $36.28 for 12 videos + merge. Always show a free `estimate` first and keep a hard cap.
  Console on 26 Nov 2026 (Ved's screenshot): organization credits $197.71; spend this month $54.50 of a $100 monthly
  limit (resets 1 Dec), so about $45.50 usable before the reset whatever the credit balance says.
- Presenter: an **original character** ("Juno": pink hoodie, headphones round the neck, curly hair,
  freckles) - never the reference creator's mascot, name or handle. Pink is the presenter's colour only.
- Length 75-100 s; 1080x1920 @ 60; English; first proof topic "How does an SSD store your files?".
- **Later on 24 Nov (overrides the presenter line above): no presenter by default** - "remove presenter I don't
  want anymore"; "each word spoken I want visual change, camera zoom, animation and new world design" → world mode.
- **Camera** (Ved on v2): "camera jump too much ... I don't want the camera to jump every frame, only where
  required ... camera smoothly, not frame jiggle and hand-like camera jump every frame" → moves only to named
  things, one per phrase, eased, no shake; the visual change on every word comes from the world, not the camera.
  "I want nanoscopic zoom continue inside the chip world and make visual more powerful" → `NanoZoom` dives.
- **Fable 5.2 for drawing worlds: as Claude Code subagents (`model: "fable"`), not Ved's API** ("Fable 5.2 no
  api use, use in our plan"). Ved's API (above) was only for the Phase A analysis.
- **26 Nov 2026 - this is reversed for the work from now on (Ved): "upcoming work agent use Fable 5.2 high effort agent
  from API credit, each Act make API cap 25$ max".** World-drawing and kit-building agents now run on Ved's Anthropic
  API with `scripts/api_agent.py` (`claude-fable-5-2`, effort high), one ledger per act and a hard **$25 cap per act**
  (`--act <id> --cap 25`; the runner stops an agent before a request that could cross the cap). When the cap is
  reached: SWITCH TO PLAN subagents (Claude Code Fable agents, no API) for the rest of that act and tell Ved in the status - never raise the cap (Ved, later on 26 Nov: "if Act cap hit 25$ switch to plan, no API; each Act hard cap only 25$").
  Mind the Console's monthly spend limit too ($100; $54.50 used on 26 Nov, resets 1 Dec). Orchestration, review and
  small fixes by the main Claude session stay on the plan. Agents already running on the plan when he said this
  (chip kit, reference pack) were left to finish.

## Upload packages - decided 24 Nov 2026
- After approval Ved wants: "final render file 1080p 60 fps with proper YouTube and Instagram upload package
  with thumbnail from Magnific, .md upload file detailed, both platforms separate in zip file". → step 10,
  `references/upload-package.md`, `scripts/upload_package.py`.
- **Covers/thumbnails: GPT Image 2.6, 9:16** on Magnific ("generate image using gpt 2.6 flare 9:16 ratio"):
  2K, Quality High, Thinking High, one image per video (175 credits each on 24 Nov 2026). Show the cost before
  generating; note the balance before and after.
- **25 Nov update:** "I want thumbnail more real, it looks AI" -> then "no no no, use GPT image only but create like
  viral thumbnail" (NOT a stock-photo composite) -> GPT 2.6 **Sunburst**, real-photo look, viral grammar (genuine
  expressive face, big red-vs-green comparison, neon). He caught a logic error ("how display opposite side, back side
  of mobile?"): a person can't watch a screen that faces the camera - he must SHOW it; natural proportions.
  Details + approved prompt: `references/upload-package.md` and `example-upload/fps-explainer/`.
- **"after generation thumbnail image download local AND delete from Magnific"**: save the PNG to
  `upload-packages\thumbnail-originals\`, verify it, then `creations_trash` it.
- Delivered to `C:\Users\VED\Documents\Local\Reverse\upload-packages\` (4 zips: SSD / Reanimate × YouTube / Instagram).
- Magnific stock (if used): `license: "premium"` + `ai_generated: "excluded"`; downloads cost 0 credits on
  Ved's Premium plan - still check the balance before/after and tell Ved at once if it drops.

## Shorts/Reels safe area - decided 25 Nov 2026
- Ved: "bottom part need 15% above shift my visual because YouTube username and description come - safe area ...
  also caption make 20% decrease size so top area also safe". → engine default `safe = {focusY 0.50, zoom 0.82}`
  (key content ~26-84 % of the height), captions 54 px (was 68). Details: style guide "Shorts/Reels safe area".
- He approved it from ONE before/after preview frame with the YouTube UI drawn on top (`safe_overlay.py`) before the
  final render ("give me one frame image how looks, after my approval do final render") - do the same for layout
  changes: preview frame first, full render only after his OK.
- `safe_check.py` (OCR) must PASS before delivery; text under the right-side buttons is reported, not failed
  (Ved has not asked to clear the right column; it would need zoom ~0.75).

## Hook and higher framing - decided 25 Nov 2026 (six-agents video)
- Ved on the first cut: "start 6 second no visual change, no powerful hook". The opening had a big "6" for 0.5 s,
  then ONE 3x2 wall of small cards held for 5.5 s (only small pills/moon changed) and nothing filled the voice pauses.
  Rule: in the first ~6 s a BIG picture change at least every 0.5-0.7 s (a full-screen hero per word, then a build,
  a flip, a payoff), and every voice pause gets its own picture event. A layout that holds > 1 s in the hook is a fail
  even if details inside it change. Approved hook: `projects/six-agents/worlds/frame_wall.tsx` (6 mascot slams ->
  big wall -> night clock + "Done" ticks -> all cards flip "Works for you 24/7" -> price ladder FREE ... $100+/mo).
- The same review: "why above blank area and below my visual - I want shift all visual above". Visuals started at
  ~27 % of the height under a dark caption fade. Fix (per video, script.json): `caption_y: 0.115`, `safe: {focusY:
  0.44, zoom: 0.86, fadeTo: 0.21}`, no scene `chapter` labels (rail off) -> captions 11.5-18.5 %, visuals ~20-84 %.
  He approved it from a before/after preview with the YouTube UI on top, and then said "Yes, make it default" -> it is
  the plan_timeline default since 25 Nov 2026 (no need to set it per video; the rail is opt-in now).
- A whip-cut hero montage reads as "jiggle" to `camera_motion.py` (1.54 rms with it, 0.47 without); it is allowed
  in the first ~2 s - say so in the hand-over rather than hiding it.
