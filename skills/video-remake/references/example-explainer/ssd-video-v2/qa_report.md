# QA - ssd-explainer

16/16 measured gates pass, 0 hard failures.

| Gate | Result | Value | Target |
|---|---|---|---|
| Narration pace | PASS | 189 wpm | 195-205 wpm (185-215 ok) |
| Caption phrases <= 4 words | PASS | 0 over | 0 |
| At most one keyword box per phrase | PASS | 0 over | 0 |
| Keyword boxes ~ one per sentence | PASS | 34 boxes / 29 sentences | >= 0.5 per sentence |
| Caption lead before the voice | PASS | 50 ms median | 2-5 frames @60 (33-83 ms) |
| SFX density | PASS | 6.7 per 10 s | 4-6 per 10 s |
| No silent stretch (SFX) > 8 s | PASS | longest 4.1 s | <= 8 s |
| Render 1080x1920 @ 60 | PASS | 1080x1920 @ 60 | 1080x1920 @ 60 |
| No span > 1.5 s without visible change | PASS | longest 0.25 s at 22.6 s | <= 1.5 s |
| Something moves on frame 0 | PASS | 8.08 | > 0.35 |
| >= 3 visual states in the first 3 s | PASS | 23 big changes | >= 3 |
| Visual beat rate (info) | PASS | 7.73 big changes / s | world mode: every word |
| Visual change on every spoken word | PASS | 186/186 words (100 %) | >= 90 % |
| Never still > 0.5 s (15 fps) | PASS | longest 0.27 s | <= 0.5 s |
| Loudness -14 LUFS integrated | PASS | -14.8 LUFS | -14 +- 1 |
| True peak <= -1 dBTP | PASS | -1.7 dBTP | <= -1 |

## Check by eye (contact sheet)

- [ ] One ISO angle for every 3D object; flat modes only PLAN / ELEVATION / CARD
- [ ] No outline strokes on solid objects (strokes only on annotations, wires, x-ray shells)
- [ ] Every 3D box uses the theme's three face tones, light from the top-left
- [ ] Each accent colour has one meaning (accentMap); state = colour + icon + motion
- [ ] The presenter's pink is not used for any state or data element
- [ ] Every spoken number has an animated readout landing on the word, with a unit (and a footnote if sourced)
- [ ] Labels >= 30 px, footnotes >= 22 px held >= 1.5 s; never more than caption + two labels at once
- [ ] The hook's claim is shown visually before 7 s; the payoff reuses the hook object or composition
- [ ] At least one honesty element (illustration disclaimer, stated limit or caveat)
- [ ] Every zoom-through swaps artwork at the blur peak; no L0 art scaled above 1.5x
- [ ] Every scene change keeps at least 2 of the 3 bands continuous