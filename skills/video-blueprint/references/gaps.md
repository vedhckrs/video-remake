# What no tool extracts - and the workaround to give Ved

| Element | Why | Workaround |
|---|---|---|
| AE keyframes & easing curves | Pixels give positions per frame, never bezier handles | Use `bbox_path` (text), object `frames` (SAM 3) or `camera_flow.series`: normalise progress 0→1 over the move, fit a cubic-bezier (x1,y1,x2,y2) by least squares, snap to linear / ease-in / ease-out / Easy Ease (0.33,0,0.67,1), confirm by A/B overlay in AE. camera_flow already labels ease-in / ease-out / ease-in-out. |
| Exact fonts | OCR returns strings | Crop the cleanest glyphs from the frame where the text is largest; compare in FontBase / Adobe Fonts (`adobe-fonts` skill can search). Keep `font_confirmed: false` until matched. |
| LUT / grade | Log + LUT + secondaries cannot be inverted from one output | Palette + IRE black/white levels + saturation + warmth in the blueprint; rebuild with Resolve colour match or curves against a neutral reference. |
| Plugin effects (glitch, light leak, film burn, flashes) | Not in OmniShotCut's 7 classes | They show up as review items or vision `effects`; match by eye against preset libraries. |
| Whip pan / match cut | Not OmniShotCut classes | `hints.whip_pan_candidate` (flow spike + blur), `hints.match_cut_candidate` (shape/colour similarity across the cut); confirm on the strip, then `resolve.py --retype`. |
| SFX recipe / synth patch | Separation gives audio, not the patch | `stems/sfx_<query>.wav` holds the isolated hit to audition; rebuild (riser = filtered noise + pitch ramp, whoosh = band-passed noise sweep) or match from a library by ear. |
| Focal length in mm, DoF | Needs MegaSaM + a sensor-size assumption | Not installed; describe DoF qualitatively in the vision pass. |
| Voice emotion | No verified repo | prosody.json numbers + your `voice_tone` words, labelled manual. |
| Music mood, sections | Taggers biased; All-In-One non-commercial | sections.py energy-based roles + `music_mood`, both low confidence. |
