# Vision pass - filling raw/vision.json

You are describing what the scripts cannot measure. Keep timings out of it (they exist already);
keep words concrete enough that a motion designer could rebuild the shot.

## Order

1. `keyframes/storyboard.jpg` - the whole video at a glance: decide `video_type`, `overall_style`
   (look, typography system, colour story, brand marks) and the `narrative` sections
   (hook / problem / proof / benefit / CTA ... with the time each starts - read times off the shots).
2. Each `keyframes/S##_sheet.jpg` (start, mid, end frame, each labelled with frame and seconds).
3. Each `keyframes/T##_strip.jpg` (frames across the boundary) - `looks_like` in a few words.
4. `voice_tone` from `raw/words.json` text + `raw/prosody.json` (pitch median, register, emphasis,
   pauses, pace). `music_mood` from BPM, key, energy curve in `raw/sections.json`.

## Shot fields

- `shot_scale`: one of the listed options. Use `graphic_fullscreen` for pure motion-graphics frames
  and `screen_recording` for UI captures; real-camera scales for people/products
  (close_up = face/product fills most of the frame, medium = waist up, wide = whole subject + space).
- `description`: one sentence, what is on screen and what changes from start to end frame.
- `subjects`: main elements with where they sit ("NVIDIA logo, upper third, centred").
- `composition`: rule (centred, rule of thirds, symmetry, split), headroom, safe-zone use
  (9:16 videos: keep text clear of the bottom 20 % and right edge UI).
- `lighting` (real footage only): key direction/hardness, rim, contrast ratio guess.
- `grade_look`: short label ("warm beige paper, red accents", "teal-orange"). Use the palette and the
  IRE numbers in raw/palette.json - do not contradict them.
- `graphic_layers`: shapes, bars, cards, charts, icons, stickers, with colour hex from the palette
  where it matches and the animation as seen between start/mid/end ("bar scale_x 0→1").
- `text_animation`: for each visible text, how it enters/leaves (slide_up, pop/scale overshoot, type-on,
  word-by-word, mask reveal, cut). raw/ocr.json already says when; you say how.
- `effects`: in-shot events - flash, light sweep, glitch, shake, zoom punch, blur, colour tint.
- `camera_semantic`: what the measured move reads as ("slow push-in on the laptop",
  "parallax: background drifts left slower than the foreground"). Check raw/camera_flow.json first:
  if it says static and you see motion, it is layer animation, not camera.
- `text_fonts`: per text string, a classification-level guess ("geometric sans, bold, rounded
  terminals - Poppins-like"); never claim an exact font. `font_confirmed` stays false.
- `object_prompts`: only for real-footage shots where an element's path matters for the rebuild
  (product, hand, person). One or two nouns per shot. Skip for pure graphics.

Leave anything you cannot see as null. "unsure" is better than a confident wrong label.
