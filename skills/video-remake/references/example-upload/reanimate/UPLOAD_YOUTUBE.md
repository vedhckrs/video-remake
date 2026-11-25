# This free Claude Code skill copies any animation (reanimate): YouTube Shorts upload guide

Package made 24 Nov 2026. Everything here is ready to paste.

## 1. What's in this folder

| File | Use |
|---|---|
| `Reanimate_1080x1920_60fps.mp4` | The video to upload (final master) |
| `thumbnail_shorts_1080x1920.jpg` | Shorts thumbnail / cover (9:16) |
| `thumbnail_master_1520x2688.png` | Full-size original of the thumbnail |
| `frame_pick_0m34s.jpg` | Fallback: the frame to pick if the app only lets you choose a frame |
| `captions_en.srt` | English subtitles with exact timing (24 cues, word-for-word with the voiceover) |
| `UPLOAD_YOUTUBE.md` | This guide |

**Video specs** (checked): 1080 × 1920 vertical, 60 fps, H.264 High, BT.709, 44.2 s.
Audio is AAC-LC 320 kbps, 48 kHz stereo, −14.5 LUFS, true peak −1.9 dB, with faststart.
It publishes as a **Short** automatically.

**Repo facts** (checked 24 Nov 2026 on GitHub): `NiazMorshed2007/reanimate`, 2,451 stars (the video says "2.4K"), 216 forks, MIT licence.

## 2. Upload flow (phone first, then desktop Studio)

YouTube Studio on desktop can't change a Short's thumbnail, so set it on the phone.

1. **Phone, YouTube app**: **+** → **Upload a video** → `Reanimate_1080x1920_60fps.mp4` → **Next**. Don't add music.
2. Tap the ✏️ pencil on the thumbnail:
   - If you can **add/upload an image**, choose `thumbnail_shorts_1080x1920.jpg`.
   - If you can only pick a frame, choose **0:34**, the "417 / 417 frames identical" frame (see `frame_pick_0m34s.jpg`).
3. Paste the **Title**, set **Visibility: Private**, and upload.
4. **Desktop, studio.youtube.com** → Content → the Short → **Details**: paste the **Description** and **Tags**, set section 4, and **Save**.
5. **Subtitles** → Add language → **English** → **Upload file** → **With timing** → `captions_en.srt` → Publish.
6. Check it once on the phone, then set it to **Public** or **Schedule** it (Studio → Analytics → Audience → "When your viewers are on YouTube").
7. Post and **pin the link comment** (section 5) straight away. The voiceover says "Comment ANIMATE and I'll send you the link", and on YouTube you can't DM people, so the link lives in the pinned comment.

## 3. Copy-paste fields

### Title (pick one)
```
This Free Claude Code Skill Copies Any Web Animation
```
Alternatives:
- `Clone Any Website Animation with Claude Code (Free)`
- `Copy Any UI Animation Frame by Frame with Claude Code`

### Description
```
This free Claude Code skill copies any animation you see online, frame by frame, and then proves the copy moves the same.

How reanimate works:
1. Point it at a live site, a screen recording, an MP4 or GIF, or a Lottie file
2. It records the motion in a headless browser
3. It writes a spec for every element: property, from → to, easing, timing
4. It rebuilds it in CSS, Framer Motion or GSAP
5. It films its own copy and measures the difference
On Vercel's toolbar it matched 417 of 417 frames.

Tip: don't stop at a copy. Ask it to "clone this and add that" and build your own on top.

GitHub: github.com/NiazMorshed2007/reanimate (link pinned in the comments)
Open source, MIT licence, 2.4K+ stars (checked 24 Nov 2026)

Not affiliated with the reanimate author, Anthropic, Vercel or Stripe. Narration: AI voice.

#Shorts #ClaudeCode #WebAnimation
```
(Links in Shorts descriptions aren't clickable, which is why the pinned comment carries the link.)

### Tags
```
claude code, claude code skill, reanimate, web animation, copy website animation, css animation, framer motion, gsap, lottie animation, clone animation, ai coding, frontend development, motion design, claude skills, open source
```

## 4. Settings (Studio → Details → Show more)

| Setting | Choose | Why |
|---|---|---|
| Audience | **No, it's not made for kids** | Developer content (COPPA flag, answer truthfully) |
| Paid promotion | **No** | Not sponsored by the repo author or anyone else |
| Altered or synthetic content | **No** | Not required: an AI narrator voice that isn't a real person, plus UI graphics. "Yes" is allowed if you prefer. |
| Category | **Science & Technology** | — |
| Video language | **English** | — |
| Caption certification | None (never aired on TV) | — |
| License | Standard YouTube License | — |
| Allow embedding / subscriptions feed | On / On | — |
| Shorts remixing | Allow video and audio remixing | — |
| Comments | On; sort by **Newest** for the first day | So you see the "ANIMATE" comments and can reply |
| Related video | Empty, or link a longer Claude Code video if you have one | — |

## 5. Pinned comment and replies (the "Comment ANIMATE" promise)

**Pinned comment** (post it from your channel, then pin it):
```
🔗 Here's the link: github.com/NiazMorshed2007/reanimate
Free and open source (MIT). Install steps are in the README. Commented ANIMATE? This is it 👆
```

**Reply to each "ANIMATE" comment:**
```
Here you go 👉 github.com/NiazMorshed2007/reanimate (also pinned at the top) 🙌
```
- YouTube sometimes holds comments that contain links. If your reply doesn't appear, check Studio → Comments → **Held for review**.
- You can also save the reply text in your phone's text replacement so it's one tap.

## 6. Thumbnail: how it was made

Made on Magnific with **GPT Image 2.6 · Flare**: 9:16, 2K, Quality High, Thinking High, 1 image, **175 credits**.
- The headline "FRAME-PERFECT COPY" and the pill "417 / 417 FRAMES" are clear of the top 12% and the bottom 20% (the Shorts buttons).
- It shows two identical UI cards with "=" between them, over a laptop at night, with a film strip of checked frames.
- There are no logos and no real brand names.

## 7. Pre-publish checklist

- [ ] The uploaded file is `Reanimate_1080x1920_60fps.mp4` (44 s, vertical, plays with sound)
- [ ] The thumbnail is set (custom image, or the frame at 0:34)
- [ ] The title, description and tags are pasted, with #Shorts at the end
- [ ] Made for kids: **No** · Category: **Science & Technology** · Language: **English**
- [ ] `captions_en.srt` is uploaded under English, With timing
- [ ] Altered content and Paid promotion are both **No**
- [ ] Visibility is Public / Scheduled
- [ ] The link comment is posted and **pinned** before you share the Short anywhere
- [ ] You reply to "ANIMATE" comments for the first 24 hours
- [ ] Real numbers checked at 48 hours in Studio → Analytics
