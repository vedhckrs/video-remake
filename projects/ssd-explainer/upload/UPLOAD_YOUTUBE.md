# How an SSD stores your files: YouTube Shorts upload guide

Package made 24 Nov 2026. Everything here is ready to paste.

## 1. What's in this folder

| File | Use |
|---|---|
| `SSD-Explainer_1080x1920_60fps.mp4` | The video to upload (final master) |
| `thumbnail_shorts_1080x1920.jpg` | Shorts thumbnail / cover (9:16) |
| `thumbnail_master_1520x2688.png` | Full-size original of the thumbnail (keep for edits or reposts) |
| `frame_pick_0m56s.jpg` | Fallback: the frame to pick if the app only lets you choose a frame |
| `captions_en.srt` | English subtitles with exact timing (61 cues, word-for-word with the voiceover) |
| `UPLOAD_YOUTUBE.md` | This guide |

**Video specs** (checked): 1080 × 1920 vertical, 60 fps, H.264 High, BT.709, 91.3 s, about 15 Mbps.
Audio is AAC-LC 320 kbps, 48 kHz stereo, −14.8 LUFS, true peak −1.9 dB, with faststart.
A vertical video up to 3 minutes is published as a **Short** automatically.

## 2. Upload flow (phone first, then desktop Studio)

YouTube Studio on desktop can't change a Short's thumbnail, so set the thumbnail on the phone and everything else on desktop.

1. **Phone, YouTube app**: tap **+** → **Upload a video**, then pick `SSD-Explainer_1080x1920_60fps.mp4`. Copy it to the phone first; keep the original file, don't use a WhatsApp copy.
2. Tap **Next**. Don't add music, because the video already has its own mixed music and sound effects.
3. On the details screen, tap the ✏️ pencil on the thumbnail:
   - If you see an option to **add/upload an image**, choose `thumbnail_shorts_1080x1920.jpg`.
   - If you can only pick a frame, scrub to **0:56**, the "7,450 MB/s" readout (see `frame_pick_0m56s.jpg`).
4. Paste the **Title**, set **Visibility: Private** for now, and upload.
5. **Desktop, studio.youtube.com** → Content → open the Short → **Details**:
   - paste the **Description** and **Tags** (Show more → Tags);
   - set every setting in section 4;
   - click **Save**.
6. **Subtitles** → Add language → **English** → **Upload file** → **With timing** → `captions_en.srt` → Publish.
7. Check the Short once on your phone (sound, first frame, captions toggle), then set **Visibility: Public**. Or use **Schedule** for the time your viewers are most active (Studio → Analytics → Audience → "When your viewers are on YouTube").
8. Post the **pinned comment** (section 5) and pin it.

## 3. Copy-paste fields

### Title (pick one, max 100 characters)
```
How an SSD Actually Stores Your Files
```
Alternatives:
- `Where Do Your Files Live Inside an SSD?`
- `How SSDs Store Data: Electrons in Tiny Buckets`

(The thumbnail says "INSIDE THE CHIP", so the title doesn't repeat it.)

### Description
```
How does an SSD store your files? There are no moving parts, just billions of tiny traps for electrons. We zoom inside a NAND flash chip and follow one photo as it gets saved.

In this Short:
• How a flash cell traps electrons, even with the power off
• 1s and 0s as full and empty "buckets"
• MLC, TLC and QLC: 4, 8 and 16 charge levels = 2, 3 and 4 bits per cell
• 3D NAND: cells stacked over 300 layers high on a chip smaller than your fingernail
• How the controller writes to every chip in parallel (over 7,000 MB/s on a fast PCIe 4.0 drive)
• Why cells wear out, and the wear-leveling trick that keeps your drive alive
• Why a typical 1 TB drive is rated for 600 TB written

Follow for Part 2: what happens when you hit delete.

Facts checked 24 Nov 2026:
• 321-layer NAND in mass production: SK hynix (reported by TrendForce and TechSpot)
• Up to 7,450 MB/s sequential read: Samsung 990 PRO 1 TB spec sheet (samsung.com)
• 600 TBW endurance on typical 1 TB TLC drives: Samsung 980 PRO 1 TB, WD Blue SN580 1 TB and Corsair MP600 Elite 1 TB spec sheets (600 TB over 5 years ≈ 329 GB a day)
• TLC flash lasts about 1,000 to 3,000 program/erase cycles (TechTarget)

Narration: AI voice. Visuals: original motion graphics.

#Shorts #SSD #HowItWorks
```

### Tags (paste as one line, under 500 characters)
```
how does an ssd work, how ssd stores data, ssd explained, nand flash, 3d nand, qlc vs tlc, ssd endurance, tbw, wear leveling, ssd controller, flash memory explained, solid state drive, nvme ssd, how storage works, computer science, tech explained
```
The first tag is the main search phrase. Tags are a minor signal now; the title and description matter more.

## 4. Settings (Studio → Details → Show more)

| Setting | Choose | Why |
|---|---|---|
| Audience | **No, it's not made for kids** | It's general-audience tech content. This is a legal (COPPA) flag, so answer truthfully. |
| Age restriction | No | — |
| Paid promotion | **No** | Nothing in it is sponsored |
| Altered or synthetic content | **No** | Not required: the narrator is an AI voice but not a real person's voice, and the visuals are clearly animation. Choosing "Yes" is allowed if you want to be extra careful; it adds a label under the video. |
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
| Related video | Leave empty for now; link **Part 2** here once it's out | The Shorts player shows it as a tappable link |

There are no chapters: Shorts don't support them.
Links in Shorts descriptions and comments aren't clickable, which is why the description has none.

## 5. Pinned comment

Post this from your channel and pin it:
```
Part 2 is next: what really happens when you hit delete 🗑️ Drop your guess below 👇
```
Replying to comments in the first hour helps the Short get shown to more people.

## 6. Thumbnail: how it was made

Made on Magnific with **GPT Image 2.6 · Flare**: 9:16, 2K, Quality High, Thinking High, 1 image, **175 credits**. There's no stock photo in it; the whole image is generated.
- The headline "INSIDE THE CHIP" sits clear of the top 12% and the bottom 20%, where the YouTube buttons go.
- The lens and memory cell sit in the centre.
- `thumbnail_master_1520x2688.png` is the original; the 1080 × 1920 JPG is a resized copy of it.

Prompt summary (to regenerate a variation): a macro photo of a black M.2 NVMe SSD on black, with a cyan-ringed magnifying lens over one NAND chip. Inside the lens is a glowing glass "bucket" memory cell with a gold gate, blue electrons and stacked violet and copper 3D NAND layers. The headline "INSIDE THE CHIP" is in bold white condensed capitals with a cyan glow. There are no logos or people.

## 7. Pre-publish checklist

- [ ] The uploaded file is `SSD-Explainer_1080x1920_60fps.mp4` (91 s, vertical, plays with sound)
- [ ] The thumbnail is set (custom image, or the frame at 0:56)
- [ ] The title, description and tags are pasted, with #Shorts at the end of the description
- [ ] Made for kids: **No** · Category: **Science & Technology** · Language: **English**
- [ ] `captions_en.srt` is uploaded under English, With timing
- [ ] Altered content and Paid promotion are both **No**
- [ ] Checked once on the phone (first frame, audio, CC toggle)
- [ ] Visibility set to Public / Scheduled
- [ ] The pinned comment is posted and pinned
- [ ] After 48 hours, read the real numbers in Studio → Analytics (viewed vs swiped away, average view duration)
