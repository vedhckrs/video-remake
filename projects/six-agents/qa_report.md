# QA - six-agents

16/18 measured gates pass, 1 hard failures.

| Gate | Result | Value | Target |
|---|---|---|---|
| Narration pace | warn | 184 wpm | 195-205 wpm (185-215 ok) |
| Caption phrases <= 4 words | PASS | 0 over | 0 |
| At most one keyword box per phrase | PASS | 0 over | 0 |
| Keyword boxes ~ one per sentence | PASS | 35 boxes / 37 sentences | >= 0.5 per sentence |
| Caption lead before the voice | PASS | 49 ms median | 2-5 frames @60 (33-83 ms) |
| SFX density | PASS | 6.0 per 10 s | 4-6 per 10 s |
| No silent stretch (SFX) > 8 s | PASS | longest 5.7 s | <= 8 s |
| Render 1080x1920 @ 60 | PASS | 1080x1920 @ 60 | 1080x1920 @ 60 |
| No span > 1.5 s without visible change | PASS | longest 0.00 s at 0.0 s | <= 1.5 s |
| Something moves on frame 0 | PASS | 35.65 | > 0.35 |
| >= 3 visual states in the first 3 s | PASS | 24 big changes | >= 3 |
| Visual beat rate (info) | PASS | 5.13 big changes / s | world mode: every word |
| Visual change on every spoken word | PASS | 226/227 words (100 %) | >= 90 % |
| Never still > 1.0 s (15 fps) | PASS | longest 0.60 s | <= 1.0 s |
| Camera smooth: jiggle | FAIL | rms 1.543 (56.1 frames/min) | rms <= 0.9 |
| Camera smooth: direction reversals | PASS | 5.8 / min | <= 6 / min (v2 was 43) |
| Loudness -14 LUFS integrated | PASS | -14.8 LUFS | -14 +- 1 |
| True peak <= -1 dBTP | PASS | -1.6 dBTP | <= -1 |

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