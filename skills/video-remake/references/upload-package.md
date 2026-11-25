# Step 10: upload package (YouTube Shorts + Instagram Reels)

Added 24 Nov 2026 after Ved approved the SSD v3 and reanimate videos:
> "give me final render file 1080p 60 fps with proper YouTube and Instagram upload package with thumbnail from
> Magnific, .md upload file detailed, both platforms separate in zip file"
> then: "generate image using gpt 2.6 flare 9:16 ratio"

Changed 25 Nov 2026 to ONE zip (Ved, on the fps video):
> "give me proper zip file for this video ... final video mp4 file 1080p with updated thumbnail and both separate
> folder Instagram and YouTube .md upload detailed ... in one zip file", then "Yes, add to skill"

**When:** only after Ved approves the final cut ("good to go", "final render", "upload package", "ready to post").
**Deliverable per video (default):** ONE zip, `<Name>_Final_Upload.zip`:
```
<Name>_Final_Upload/
├── README.md                              written by `build`: the tree, the specs, before-you-upload steps
├── <Name>_1080x1920_60fps.mp4             the final video, ONCE, for both platforms
├── <Name>_Thumbnail_1080x1920.jpg         the final thumbnail / cover
├── <Name>_Thumbnail_master_<WxH>.png      the untouched full-size original
├── YouTube/
│   ├── UPLOAD_YOUTUBE.md
│   ├── captions_en.srt
│   └── frame_pick_<m>m<ss>s.jpg
└── Instagram/
    ├── UPLOAD_INSTAGRAM.md
    └── grid_preview_1080x1440.jpg
```
The video and the thumbnail sit once in the main folder, so the zip is half the size of two self-contained zips.
**Only when Ved asks for separate zips:** `build --layout split` makes the older `<Name>_YouTube.zip` and
`<Name>_Instagram.zip`, each with its own copy of the video and its platform's cover name.
**Where:** the folder Ved names. In Nov 2026 that was `C:\Users\VED\Documents\Local\Reverse\upload-packages` (pass `--dest`); the default is `<VB>\upload-packages`.
**Worked examples:** `references/example-upload/` (the guides, the cover prompts and preview images). Copy their structure, not their facts. `fps-explainer/` is the one-zip layout (with its README); `ssd-explainer/` and `reanimate/` are the older split layout, so their file names differ.

Run with core python: `rm/upload_package <project> <command>` (see the script's docstring).

## The steps

1. **Re-check every fact** the guides will state (stars, forks, licence, prices, versions) and date it. For a GitHub repo, `curl -s https://api.github.com/repos/<owner>/<repo>` gives `stargazers_count`, `forks_count` and `license.spdx_id` without sign-in.
2. **Master + captions:** `rm/upload_package <project> master --name <Name> --title "<video title>"`.
   - The picture is stream-copied from `out/<id>.mp4`, so there's no generation loss.
   - The audio is re-mastered from `out/<id>_mix.wav` with `rmcommon.MASTER_AF` (the same chain as `sound_design.py mix`) at AAC-LC 320k, 48 kHz, trimmed to the exact video length, with faststart and clean metadata.
   - It checks H.264 yuv420p, 1080×1920, 60 fps, AAC 48 kHz, A/V length within one frame, moov before mdat, −15.5…−13 LUFS, true peak ≤ −1 dB, and ≤ 3 min (the Shorts limit).
   - It writes `upload/captions_en.srt` from `vo_words.json`: one-line cues ≤ 38 characters, split at sentences, then commas, then pauses, with no one-word orphans. It checks the captions match the voice word for word.
   - Any failed check stops the script with the reason.
3. **Cover** (section "Cover" below): one image per video with GPT Image 2.6 Flare at 9:16. Show Ved the cost first.
4. **Fallback frame:** `rm/upload_package <project> frames` makes `upload/frames_sheet.jpg`. LOOK at it and pick a frame that is strong, readable, and not mid-transition or mid-wipe. This is what Ved picks in the YouTube app if it won't take a custom Short thumbnail.
5. `rm/upload_package <project> cover <downloaded.png> --frame <sec>` makes:
   - `cover_1080x1920.jpg`;
   - `cover_master_<WxH>.png`, the untouched original;
   - `grid_preview_1080x1440.jpg`, the 3:4 Instagram grid crop, moved up from centre when the headline would touch the crop edge. The script prints by how much; the guide then says "drag the image down slightly in Profile grid";
   - `frame_pick_<m>m<ss>s.jpg`.

   It warns if the headline starts inside the top 12% (app buttons).
6. **Write the two guides** into `<project>/upload/UPLOAD_YOUTUBE.md` and `UPLOAD_INSTAGRAM.md` (checklists below), using the file names of the layout you will build (next section). Give each guide a short **Quick start** (3 steps) at the top. `build` refuses guides that still contain template markers (`{{`, `TODO`, `TBD`, `<<`…) or that name the other layout's files.
7. **Build:** `rm/upload_package <project> build --dest "<folder>" --note "<version line>" --note "<QA line>"` (add `--force` to replace an earlier build).
   - It makes the `<Name>_Final_Upload/` folder (above) and its zip, and writes `README.md` from the master's specs. Each `--note` adds a row to the README's video table, e.g. `"v2, the final: the safe-area version Ved approved on 25 Nov"` and `"QA 17/18 with 0 hard fails; safe-area text check PASS"`.
   - `--layout split` makes the two older zips instead (only when Ved asks).
   - Media files go in stored, text files deflated.
   - It verifies each zip: CRC test, exactly the expected files, every file extracted and SHA-256-compared with its source, the MP4 re-probed, and text files decoded as UTF-8.
8. **Hand over:**
   - the zip path, its size, the tree of its contents, and the specs line (resolution, fps, codec, Mbps, LUFS, true peak);
   - the credits spent, with the balance before and after;
   - the cover images sent with SendUserFile;
   - the steps only Ved can do: posting, the comment-to-DM tool, the cover crop;
   - no "done" claim for anything unverified.

## File names in the guides (checked by `build`)

The guides must name the files exactly as they appear in the zip, and say where each one is.

| | One zip (default) | `--layout split` |
|---|---|---|
| Video | `<Name>_1080x1920_60fps.mp4`, "main folder" | same name, in each platform folder |
| Thumbnail / cover | `<Name>_Thumbnail_1080x1920.jpg`, "main folder", in BOTH guides | YouTube `thumbnail_shorts_1080x1920.jpg`, Instagram `reel_cover_1080x1920.jpg` |
| Full-size thumbnail | `<Name>_Thumbnail_master_<WxH>.png`, "main folder" | YouTube `thumbnail_master_<WxH>.png` |
| Captions, fallback frame | `captions_en.srt`, `frame_pick_*.jpg`, "this folder" (YouTube) | same names |
| Grid preview | `grid_preview_1080x1440.jpg`, "this folder" (Instagram) | same name |

In the one-zip layout the "Files you'll use" table gets a **Where** column ("main folder" / "this folder").
`build` stops when a guide never names the master MP4 or its thumbnail, or still names the other layout's thumbnail.

## Cover: GPT Image 2.6, photoreal VIRAL style, 9:16 (Ved, updated 25 Nov 2026)

**Read this first - it overrides the Flare notes and the template further down.**
- Ved rejected the first-style covers: "I want thumbnail more real, it looks AI". He also rejected a real stock-photo
  composite: "no no no, use GPT image only but create like viral thumbnail". So: **GPT Image 2.6, mode Sunburst**
  (same 175 credits as Flare at 2K High; better photoreal and text layout), a **real-photo look** (35 mm, f/2-2.8,
  natural skin texture with pores, film grain, "not CGI, no plastic skin") and **viral thumbnail grammar**: a genuine
  expressive face, one big comparison or number pair (e.g. "60Hz" red ✗ vs "144Hz" green ✓, thick black outline),
  saturated neon light, the proof on a screen. Approved example: `references/example-upload/fps-explainer/`
  (prompt in `cover_prompts.md`).
- **Physical-logic check (Ved caught it: "how display opposite side, back side of mobile?")**: a screen that faces the
  viewer can't be watched by the person holding it - he SHOWS it (looks at the camera, points at it); proportions
  natural (the phone a normal size in the hand, not giant in front of the lens). Write this into the prompt ("he is
  SHOWING the screen to us", "Avoid: the man looking at the back of the phone") and check it on the result,
  together with: fingers (count, grip), every word spelled, no real logos (an invented car badge is fine), no extra
  people.
- **After generating: download locally, then delete from Magnific** (Ved: "after generation thumbnail image download
  local and delete from Magnific"). Save the full-res PNG under `<delivery folder>\upload-packages\thumbnail-originals\`
  as `<date>_<Name>_cover_<version>_<model>.png`, open it to confirm it decodes at 1520x2688, then
  `creations_trash` the creation (to Magnific's trash - restorable; offer permanent purge only if Ved asks).
  `creations_trash` is all-or-nothing: trash ids one by one. On 25 Nov the two covers made on 24 Nov returned
  "File not found" although `creations_get` still listed them - give Ved their web links to delete by hand.
- `cover --grid-top <px>` picks the 3:4 Instagram grid window by eye when a face is at the top of the cover
  (the automatic window looks for a white headline).

- **Tooling (Magnific MCP connector):**
  - `magnific_start` (once per conversation), then `account_balance`: note the balance.
  - `simulate_cost` with tool `images_generate` and `{"mode": "gpt-2-6", "aspectRatio": "9:16", "resolution": "2k", "count": 1, "extraSettings": {"variant": "flare", "quality": "high", "thinkingLevel": "high"}}`. On 24 Nov 2026 that was **175 credits, exact**.
  - Tell Ved the cost: 175 × one cover per video.
  - Then `images_generate` with the same settings, `creations_wait`, and download the full-res `url` (1520×2688 PNG).
  - Run `account_balance` again and report before → after.
  - Stock photos (if any) come from `stock_search` with `license: "premium"` and `ai_generated: "excluded"`. They cost 0 credits on Ved's Premium plan, but check the balance before and after anyway.
- **No Magnific connector on this account:** give Ved the prompt and these settings to paste on magnific.com (AI Image Generator → GPT 2.6 → Flare, 2K, Quality High, Thinking High, 9:16, 1 image, AI prompt **Off**). He saves the PNG, and you continue with `cover <png>`.
- **Check the image before using it** (Read it, then crop the top half at full size):
  - every word spelled exactly;
  - no extra text, logos, brand marks, watermark, people or hands;
  - the headline below the top 12% and the hero in the centre.

  If text is wrong, regenerate once with the same prompt (ask first; it costs another 175). Don't paste fake text on top.
- **Design rules:**
  - The thumbnail and the title are one unit: the thumbnail **shows**, the title **tells**, and they never repeat each other.
  - Headline 2–4 words in bold condensed capitals, high contrast on a dark base, one hero element.
  - No real brand logos (Ved doesn't own them).
  - The promise must match the video: no clickbait.

Prompt template (fill the brackets; keep it under ~1,800 characters; quotes for exact text):
```
A vertical cover image for a YouTube Short and Instagram Reel that [WHAT THE VIDEO SHOWS]. Fully opaque image, solid background everywhere.

Scene: [CONCRETE SETTING, light direction and colours].

Hero element: in the centre of the frame [ONE HERO VISUAL that is the video's key moment, described physically].

Text (verbatim, each appears exactly once): "[HEADLINE 2-4 WORDS]" in huge bold white condensed sans-serif capitals [glow colour], on two lines ("[LINE 1]" / "[LINE 2]"), centred horizontally, about a quarter of the way down the frame, well clear of the top edge. [optional: "[SHORT NUMBER LABEL]" in a small rounded [colour] pill with dark text, just under the headline.]

Layout: keep the top 12% and the bottom 20% of the frame free of important details (app buttons cover them); keep the headline and the hero inside the central area.
Style: [photorealistic macro photography / cinematic desk scene] blended with [clean scientific visualisation / crisp flat UI graphics], high contrast, [3 accent colours] on [dark base].
Avoid: any other text, logos, brand names, watermark, people, hands.
```
In practice GPT 2.6 put the headline top at about y = 245 (of 1920) even when asked for "a quarter of the way down". That clears the Shorts buttons; `cover` shifts the grid preview to match.

## YouTube guide checklist (`UPLOAD_YOUTUBE.md`)

1. **Quick start** (3 steps), then the **files table** (with a Where column in the one-zip layout), the specs line, and that a vertical video ≤ 3 min becomes a Short automatically.
2. **Upload flow: phone first, then desktop Studio.**
   - Desktop Studio can't change a Short's thumbnail. In the app, the ✏️ on the thumbnail allows an image upload where it's rolled out; otherwise use the fallback frame at m:ss.
   - Upload as Private, finish the details on desktop, upload the captions (Subtitles → English → Upload file → **With timing**), check on the phone, then go Public or Scheduled ("When your viewers are on YouTube" in Analytics → Audience; never invent a "best time").
3. **Title + 2 alternatives:**
   - keyword in the first ~40 characters, about 50–60 characters, max 100;
   - doesn't repeat the thumbnail text.
4. **Description:**
   - line 1 = the value and the keyword;
   - a short "In this Short" list;
   - the CTA;
   - **sources with the date checked**;
   - "Narration: AI voice";
   - a not-affiliated line when it names brands;
   - 3 hashtags at the end, `#Shorts` first.
   - Shorts description and comment links are **not clickable**, so don't rely on them.
5. **Tags**, one line under 500 characters, with the exact main search phrase first.
6. **Settings table:**
   - Made for kids **No** (a legal COPPA flag; answer truthfully);
   - Paid promotion No;
   - **Altered or synthetic content No**: an AI narrator that isn't a real person's voice, plus clearly animated graphics, doesn't need it. Choosing "Yes" is allowed;
   - Category **Science & Technology**;
   - language English, caption certification None, Standard licence;
   - embedding on, Shorts remixing allowed;
   - comments on;
   - Related video (link Part 2 or a long video when there is one).
7. **Pinned comment.** When the CTA is "Comment X and I'll send you the link", YouTube has no DMs: pin the link as plain text and give a reply template. Mention "Held for review" for comments with links.
8. **How the thumbnail was made:** model, settings, credits and a prompt summary.
9. **Pre-publish checklist.**

## Instagram guide checklist (`UPLOAD_INSTAGRAM.md`)

1. **Quick start** (3 steps), then the **files table** (with a Where column in the one-zip layout), the specs line (Reels up to 3 min; burned-in captions inside the safe zone), and "no other app's watermark".
2. **Comment-keyword promise** (if the CTA uses one): set up the comment-to-DM automation **before** posting. Give:
   - ManyChat (free plan, Instagram professional account) steps: trigger "comments on post/reel", the keyword, a public reply and the DM text;
   - a test from a second account;
   - a manual fallback.
3. **Upload flow in the app:**
   - copy files to the phone without WhatsApp;
   - no added music or filters, original audio at 100%;
   - paste the caption;
   - **Edit cover → Add from camera roll**, then adjust **Profile grid** to match `grid_preview_1080x1440.jpg`. **The cover can't be changed after posting**;
   - Rename audio and Add topics (if offered);
   - Advanced settings: **Add AI label ON** (realistic AI voice / AI cover; Meta asks for it), auto-generated captions **OFF** if the toggle exists (the captions are burned in), downloads your choice;
   - Share to Facebook optional; Trial reel off;
   - wait 15–30 min for HD processing.
4. **Caption:**
   - keyword-first line;
   - 2–3 short lines of value;
   - Save/Follow CTA;
   - facts with "checked <month year>";
   - credit to the creator/repo author;
   - **exactly 5 hashtags** (Instagram's maximum since Dec 2025).
5. **After posting:** pin a comment, reply in the first hour, a Story share (poll or link sticker), and Insights at 48 hours (no made-up benchmarks).
6. **Pre-publish checklist.**

## Platform facts (checked 24 Nov 2026; re-check every ~3 months, as platforms change)

| | YouTube Shorts | Instagram Reels |
|---|---|---|
| Format | vertical, up to 3 min → Short automatically | 9:16, up to 3 min in the app |
| File | H.264 + AAC, faststart; 1080×1920 @ 60 fps is fine | MP4 H.264, 30/60 fps, ≤ 4 GB, about 15–20 Mbps is ideal |
| Cover | phone app only (frame picker, or image upload where rolled out); not changeable in desktop Studio | custom upload, 9:16 plus a 3:4 grid crop; **can't be edited after posting** |
| Captions | upload .srt (With timing) | none to upload; the video's captions are burned in |
| Links | not clickable in the description or comments | not clickable in captions; use comment-to-DM, link in bio or a Story link sticker |
| Hashtags | 3 at the end of the description (#Shorts first) | max 5 |
| AI disclosure | "Altered or synthetic content" only for realistic people, places or events (not needed for an AI narrator + animation) | "AI label" for realistic AI audio or imagery: ON for these videos |
| Kids flag | Made for kids: No (COPPA, must be truthful) | — |
