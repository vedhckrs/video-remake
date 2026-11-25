# How 60, 120 & 144 fps actually work: YouTube Shorts upload guide

Package made 25 Nov 2026. Everything here is ready to paste.

## 1. What's in this folder

| File | Use |
|---|---|
| `FPS-Explainer_1080x1920_60fps.mp4` | The video to upload (final master, with the Shorts/Reels safe area) |
| `thumbnail_shorts_1080x1920.jpg` | Shorts thumbnail / cover (9:16) |
| `thumbnail_master_1520x2688.png` | Full-size original of the thumbnail (keep for edits or reposts) |
| `frame_pick_0m42s.jpg` | Fallback: the frame to pick if the app only lets you choose a frame |
| `captions_en.srt` | English subtitles with exact timing (56 cues, word for word with the voiceover) |
| `UPLOAD_YOUTUBE.md` | This guide |

**Video specs** (checked): 1080 × 1920 vertical, 60 fps, H.264 High, BT.709, 100.5 s, about 9.6 Mbps.
Audio is AAC-LC 320 kbps, 48 kHz stereo, −14.6 LUFS, true peak −1.8 dB, with faststart.
A vertical video up to 3 minutes is published as a **Short** automatically.

**Safe area** (checked by text detection, 2 frames a second): no readable text sits under YouTube's @name, description or music rows (bottom 15%) or the top icons. A few labels pass under the right-hand like/comment/share buttons; that's expected.

## 2. Upload flow (phone first, then desktop Studio)

YouTube Studio on desktop can't change a Short's thumbnail, so set the thumbnail on the phone and everything else on desktop.

1. **Phone, YouTube app**: **+** → **Upload a video** → `FPS-Explainer_1080x1920_60fps.mp4` → **Next**. Copy the file to the phone first; don't use a WhatsApp copy. Don't add music: the video already has its own mixed music and sound effects.
2. On the details screen, tap the ✏️ pencil on the thumbnail:
   - If you see an option to **add/upload an image**, choose `thumbnail_shorts_1080x1920.jpg`.
   - If you can only pick a frame, scrub to **0:42**, the 60 Hz vs 120 Hz lanes with the smooth trail (see `frame_pick_0m42s.jpg`).
3. Paste the **Title**, set **Visibility: Private** for now, and upload.
4. **Desktop, studio.youtube.com** → Content → open the Short → **Details**:
   - paste the **Description** and **Tags** (Show more → Tags);
   - set every setting in section 4;
   - click **Save**.
5. **Subtitles** → Add language → **English** → **Upload file** → **With timing** → `captions_en.srt` → Publish.
6. Check the Short once on your phone (sound, first frame, captions toggle), then set **Visibility: Public**. Or use **Schedule** for the time your viewers are most active (Studio → Analytics → Audience → "When your viewers are on YouTube").
7. Post the **pinned comment** (section 5) and pin it.

## 3. Copy-paste fields

### Title (pick one, max 100 characters)
```
How 60, 120 & 144 fps Actually Work
```
Alternatives:
- `60Hz vs 120Hz vs 144Hz: Why High Refresh Feels Smooth`
- `FPS vs Hz Explained: Why 120Hz Feels So Smooth`

(The thumbnail shows the reaction and the side-by-side "60Hz vs 144Hz"; the title tells how it works.)

### Description
```
What do 60, 120 and 144 fps really mean on your phone and in games? Your screen isn't playing a video, it's flipping still pictures. Frames per second is how fast your chip draws them; hertz is how often your screen refreshes.

In this Short:
• Frame time: 16.7 ms at 60, 8.3 ms at 120, 6.9 ms at 144
• Inside the screen: each refresh redraws it row by row, and tiny transistors hold each pixel's color
• Why 120 Hz looks smoother (shown slowed down, because this video plays at 60 fps)
• LTPO phone screens: 120 Hz when you scroll, slower when you read, 1 Hz on the lock screen
• Gaming phones at 144 and 165 Hz, with touch sensors checking your finger thousands of times a second
• Screen tearing at 90 fps on a 144 Hz monitor, and how G-Sync / FreeSync (variable refresh) fixes it
• Why each jump gives less: 60→120 saves 8.3 ms a frame, 120→144 only 1.4 ms (yet esports monitors hit 600 Hz)

Follow for Part 2: what input lag really is.

Facts checked 25 Nov 2026:
• Frame time = 1000 ms ÷ refresh rate (60 → 16.7 ms, 120 → 8.3 ms, 144 → 6.9 ms)
• LTPO screens vary refresh from 120 Hz down to 1 Hz for static content and always-on display (Android Authority, Digital Trends, How-To Geek)
• Gaming phones: RedMagic 11S Pro 144 Hz with a claimed 3,000 Hz touch sampling rate (TechRadar), ROG Phone 9 Pro 165 Hz (GSMArena)
• Esports monitors up to 600 Hz, e.g. ZOWIE XL2586X+ (BenQ ZOWIE product page; PC Gamer, RTINGS)

Not sponsored. Narration: AI voice. Visuals: original motion graphics.

#Shorts #RefreshRate #120Hz
```

### Tags (paste as one line, under 500 characters)
```
fps vs hz, refresh rate explained, 60hz vs 120hz, 120hz vs 144hz, what is refresh rate, frame rate explained, 144hz monitor, 120hz phone, ltpo display, screen tearing, gsync vs freesync, variable refresh rate, frame time, gaming phone, tech explained
```
The first tag is the main search phrase. Tags are a minor signal now; the title and description matter more.

## 4. Settings (Studio → Details → Show more)

| Setting | Choose | Why |
|---|---|---|
| Audience | **No, it's not made for kids** | General-audience tech content. This is a legal (COPPA) flag, so answer truthfully. |
| Age restriction | No | — |
| Paid promotion | **No** | Not sponsored; the brands in the sources are only cited |
| Altered or synthetic content | **No** | Not required: the narrator is an AI voice, not a real person's voice, and the visuals are clearly animation. Choosing "Yes" is allowed if you want to be extra careful; it adds a label under the video. |
| Category | **Science & Technology** | — |
| Video language | **English** | — |
| Caption certification | **None** (this content has never aired on TV) | — |
| Title & description language | English | — |
| License | Standard YouTube License | — |
| Allow embedding | On | — |
| Publish to subscriptions feed | On | — |
| Shorts remixing | Allow video and audio remixing | Remixes help reach |
| Comments | On; sort by **Top** | — |
| Show how many viewers like this | On | — |
| Related video | Leave empty for now; link **Part 2 (input lag)** here once it's out | The Shorts player shows it as a tappable link |

There are no chapters: Shorts don't support them.
Links in Shorts descriptions and comments aren't clickable, which is why the description has none.

## 5. Pinned comment

Post this from your channel and pin it:
```
Part 2 is next: what input lag really is ⏱️ What refresh rate is your phone or monitor? 👇
```
Replying to comments in the first hour helps the Short get shown to more people.

## 6. Thumbnail: how it was made

Made on Magnific with **GPT Image 2.6 · Sunburst** (photoreal; you asked for a real, viral look instead of the first AI-looking cover): 9:16, 2K, Quality High, Thinking High, 1 image, **175 credits**. The whole image is generated; the person is not a real individual.
- A young man faces the camera and **shows** a phone (screen toward the viewer) at chest height, pointing at the smooth half. The screen shows one racing-game frame split in two: stuttering ghost copies vs razor-sharp.
- The headline "60Hz vs 144Hz" sits just above the phone, with a red ✗ and a green ✓. No logos and no real brands; the car badge is invented.
- `thumbnail_master_1520x2688.png` is the original; the 1080 × 1920 JPG is a resized copy. The image was downloaded and then deleted from Magnific.

Prompt summary (to regenerate a variation): a real photograph (35mm, f/2.8, skin texture, film grain) of a young man in a black hoodie in a magenta/cyan-lit gaming room, waist up, facing the camera. He holds a phone sideways at arm's length with the screen facing the viewer and points at its right half, looking into the camera excited. The screen is split: left blurry ghost copies of a car, right a sharp car with motion streaks. Text: "60Hz" red / "vs" / "144Hz" green above the phone, with ✗ and ✓.

## 7. Pre-publish checklist

- [ ] The uploaded file is `FPS-Explainer_1080x1920_60fps.mp4` (100 s, vertical, plays with sound)
- [ ] The thumbnail is set (custom image, or the frame at 0:42)
- [ ] The title, description and tags are pasted, with #Shorts at the end of the description
- [ ] Made for kids: **No** · Category: **Science & Technology** · Language: **English**
- [ ] `captions_en.srt` is uploaded under English, With timing
- [ ] Altered content and Paid promotion are both **No**
- [ ] Checked once on the phone (first frame, audio, CC toggle; nothing hidden under @name)
- [ ] Visibility set to Public / Scheduled
- [ ] The pinned comment is posted and pinned
- [ ] After 48 hours, read the real numbers in Studio → Analytics (viewed vs swiped away, average view duration)
