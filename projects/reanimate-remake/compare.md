# Remake vs reference: 10/11 edit metrics match

| Metric | Reference | Remake | Match | Note |
|---|---|---|---|---|
| length s | 43.22 | 44.1 | yes |  |
| shots | 15 | 17 | yes | detector count on the render - soft transitions can merge shots |
| avg shot s | 2.87 | 2.59 | yes |  |
| transition mix (raw detector, both) | {'iris': 4, 'dissolve': 3, 'zoom': 2, 'push': 1, 'cut': 1} | {'cut': 3, 'iris': 10, 'dissolve': 3} | **no** | reviewed reference: {'zoom': 2, 'dissolve': 8, 'iris': 4} |
| hard cuts (raw detector, both) | 1 | 3 | yes |  |
| transitions follow | voice | voice | yes |  |
| caption y | 0.144 | 0.146 | yes |  |
| caption lead ms | 48 | 23 | yes |  |
| voice wpm | 159.8 | 162.5 | yes |  |
| music BPM | 100.0 | 100.0 | yes |  |
| sfx per 10 s | 5.78 | 5.44 | yes |  |
| act pattern | DDDDDDLLLLLLDLD | DDDDDDDLLLLLLDLDD | yes | for reading, not scored |