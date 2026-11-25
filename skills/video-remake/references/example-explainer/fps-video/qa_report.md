# QA - fps-explainer

17/18 measured gates pass, 0 hard failures.

| Gate | Result | Value | Target |
|---|---|---|---|
| Narration pace | warn | 163 wpm | 195-205 wpm (185-215 ok) |
| Caption phrases <= 4 words | PASS | 0 over | 0 |
| At most one keyword box per phrase | PASS | 0 over | 0 |
| Keyword boxes ~ one per sentence | PASS | 29 boxes / 31 sentences | >= 0.5 per sentence |
| Caption lead before the voice | PASS | 50 ms median | 2-5 frames @60 (33-83 ms) |
| SFX density | PASS | 6.3 per 10 s | 4-6 per 10 s |
| No silent stretch (SFX) > 8 s | PASS | longest 5.1 s | <= 8 s |
| Render 1080x1920 @ 60 | PASS | 1080x1920 @ 60 | 1080x1920 @ 60 |
| No span > 1.5 s without visible change | PASS | longest 0.38 s at 80.1 s | <= 1.5 s |
| Something moves on frame 0 | PASS | 3.33 | > 0.35 |
| >= 3 visual states in the first 3 s | PASS | 21 big changes | >= 3 |
| Visual beat rate (info) | PASS | 5.74 big changes / s | world mode: every word |
| Visual change on every spoken word | PASS | 192/192 words (100 %) | >= 90 % |
| Never still > 1.0 s (15 fps) | PASS | longest 0.67 s | <= 1.0 s |
| Camera smooth: jiggle | PASS | rms 0.461 (37.3 frames/min) | rms <= 0.9 |
| Camera smooth: direction reversals | PASS | 1.3 / min | <= 6 / min (v2 was 43) |
| Loudness -14 LUFS integrated | PASS | -14.7 LUFS | -14 +- 1 |
| True peak <= -1 dBTP | PASS | -1.5 dBTP | <= -1 |

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