# One-stage 2.5D explainer: merged style system

Basis: 12 dossiers, 1,203 s of video, 63 measured shots, 51 measured transitions.

- **(ref)** = measured in the reference set. **(est.)** = estimated by eye in the dossiers. **(ours)** = a decision for Ved's kit.
- Pixel values are for 1080x1920 (reference 720 px values x 1.5). Frame counts are written @30 / @60; seconds are unchanged.
- kfNN ids point to the source dossiers. Nothing here reuses the creator's name, handle or mascot.

## 1. The formula in 10 lines
1. **Show the answer before explaining it.** Motion on frame 0, the hero object transforms within 3 s, and the picture changes about three times in those 3 s. No logo, no greeting (12/12).
2. **Open on a gap.** A question, a paradox or a contradicted belief. In at least 5 videos an open loop is planted early and closed in the last third.
3. **One world, one stage.** A single object or metaphor (desk, map, rack, tile field, cross-section, keyboard) carries 15-65 s. It is re-coloured and re-stated, never thrown away.
4. **Long shots, fast picture.** Mean shot is 19.1 s and three videos are a single take, yet something changes every 1.0-1.5 s (about 0.75-1 visual beats per second).
5. **Locked three-band frame.** Caption on top, stage in the middle, presenter bust at the bottom. Only the stage has a camera.
6. **The voice is the clock.** Mean 207 wpm; caption words lead the voice by 23-85 ms; visual events land on stressed words; nothing is cut to the beat.
7. **Name, show, lock.** The caption names the thing, one animation demonstrates it, a number or stamp locks it. Each step takes 3-6 s.
8. **Numbers are objects.** Every spoken figure has a readout that counts and lands on the word, with a unit and a tiny source line.
9. **Colour is logic, honesty is style.** One hue has one meaning per video. State is always colour plus icon plus motion. Disclaimers and limits are shown openly.
10. **Call back, then act out the CTA.** The hook object returns for the payoff, and the ask is performed as UI (follow, send, comment) in 1-6 s with no outro card.

## 2. Constants vs variables
| Constant (same in every video) | Evidence |
|---|---|
| Vertical, fully animated, no live action | 12/12 |
| Three bands: caption y 15-25%, stage y 25-72%, presenter y 72-100% | 12/12 (one video starts captions at 73% for 6 s) |
| Word-by-word caption, bold active word, grey spoken words, boxed keyword | 12/12 |
| Presenter absent in the hook, then on screen to the end | 12/12; entry 3.2-18 s, median 6.5 s |
| One pose per phrase, literal mime of the words | 12/12; mostly every 1-2 s |
| Dark ground dominant | 8/12 fully dark; dark is 49-89% of runtime in the other 4 |
| In-shot swaps instead of cuts | 51 transitions vs roughly 1,000 in-shot changes (estimate from beat lists) |
| Voice-led sync, flat music bed, quiet SFX | 12/12 |
| Source footnotes and 'illustration' disclaimers | 10/12 explicit |
| Acted-out social CTA, no outro padding | 12/12 |

| Variable (changes per topic) | Range seen |
|---|---|
| Runtime | 63-146 s |
| Hero world and metaphor | desk, kitchen, pizza map, chip city, factory line, suitcase lock, ear cross-section |
| Projection mode | front, top-down, one-point card, oblique, isometric (ours: one standard, section 3) |
| Colour acts | single dark act (8) or alternating dark/light chapters (4) |
| Accent meaning map | 2-5 topic hues, declared per video |
| Chapter HUD | none (9), progress rail or roadmap or token header (3) |
| Transition family | blurred push, panel wipe, dissolve, zoom-through; one family per video |
| SFX density | 0.3-7 events per 10 s |
| Presenter entry time | 3.2-18 s |
| CTA type | follow (8), send or share (7), comment keyword (2); some combine |

## 3. 2.5D drawing spec

### 3.1 One projection standard (ours)
The reference mixes front-orthographic, top-down, one-point trapezoids, oblique and isometric from video to video; one dossier flags that as a flaw. The kit uses one engine and three flat modes of it.

- **ISO (default 3D look):** `sx = (x - y) * cos(30deg) * u`, `sy = (x + y) * sin(30deg) * u - z * u`. Depth sort key is `x + y`, then `z`.
- **PLAN (top-down):** `sx = x * u`, `sy = y * u`. For boards, chips, die shots, maps before the tilt.
- **ELEVATION (front or cutaway):** `sx = x * u`, `sy = -z * u`. For racks, cross-sections, furnaces, devices front-on.
- **CARD:** a flat UI card with CSS `perspective` about 1350 px and `rotateX` 50-62 deg (est.). Only for flat cards and keyboards.
- **Tilt reveal:** a `tilt` prop 0..1 lerps every projected point from PLAN to ISO and scales extrusion by the same value. This is the reference's 'plan view tilts into 3D' move (desk, heatmap, city).
- **Rules:** one ISO angle per video; yaw never animates more than a few degrees; the camera is a 2D translate and scale of the stage group; depth fog is `opacity *= exp(-depth * k)` toward the background colour.

### 3.2 Face shading (light from top-left)
| Theme | Top face | Left face | Right face | Source |
|---|---|---|---|---|
| Dark | 100% of base | 70% | 50% | est.; other dossiers give 55-65% and 35-40% |
| Light | base lightened 10-12% | base | base darkened 18-22% | est. |
| Flat modes | face 100%, top lip 10-15% lighter | bevel rim about 60% | underside 35-40% | est. |

### 3.3 Extrusion, shadow, highlight, stroke
- **Extrusion:** tile or keycap 9-15 px; chip rim 9-12 px offset down-right; ground slab 6-8% of slab width; boxes and buildings 1-2x footprint width; cards have no thickness, shadow only.
- **Contact shadow:** blurred ellipse, blur 18-30 px, 40-60% black on dark, 10-15% on light. For hovering items the offset and blur grow with z and collapse to zero in the last 3 / 6 frames of the landing.
- **Card drop shadow:** y 18 px, blur 45 px, 50% black on dark, 25-35% on light.
- **Ambient occlusion:** a dark gradient on the lowest 15% of each side face.
- **Glow:** only on emissive or active parts; a blurred duplicate (stdDeviation 12-21 px) in screen blend.
- **Highlight:** 1.5 px lighter line on top and left edges (white at 15-25%), 1.5 px darker on bottom and right. Metal uses a 3-4 stop gradient. One sheen sweep per hero reveal.
- **Strokes:** none on solids; form comes from value steps. Strokes of 1.5-3 px are reserved for annotation: leader lines, brackets, ruler ticks, wires, crosshairs. X-ray shells are the one exception: fill at 12-15% white plus a 2 px white stroke at 60%.

### 3.4 Material colour table (kit tokens, chosen inside the reference ranges)
| Token | Hex | Notes |
|---|---|---|
| bg.dark | #0E0F11 | ref range #000102 to #111111 |
| bg.light | #F6F7F9 | ref #F6F7F9 to #F7F8FA |
| ui.card.dark | #1A1C21 | 1 px border, white at 8% |
| ui.card.light | #F7F8FA | evidence cards |
| paper | #E8E2D6 | history, quotes; serif text allowed |
| hardware.dark | #2A2E32 | lip #3A3F44 (est.), bay #101113 |
| stage.slate | #3C3B3E | desk tops, plates |
| tile.top / tile.side | #696665 / #2F302F | keycaps, number tiles |
| silver.lit / silver.shade | #C0C8D6 / #747571 | laptops, lids; mid #BFBEBA |
| metal.gradient | #D3D6DB to #767471 | discs, drives, steel |
| pcb.green | #334D37 base, #51634A lit, #6B8275 highlight | sticks, boards |
| pcb.dark | #212327 | modern boards; traces about 8% lighter |
| substrate | #24322E (green) or #81786A (beige) | chip packages |
| chip.package | #51463C | gunmetal with white laser print |
| gold.lit / gold.shade | #D3C1A0 / #A0957D | pins, pads, frames |
| gold.rich | #C9A24A to #7A5E1E | flex strips, locks, wires |
| copper | #C08A60, light #DCBCA7 | heat pipes, conductors |
| caption.grey | #8E9196 (ours) | ref #747571 to #828689, raised for contrast |
| sem.ok | #3FB950 | ref #2EA043 to #5FD38D |
| sem.warn | #F5A623 | ref #F2B84B, about #E0A040 |
| sem.error | #DC1E30 | ref #B92030 to #F4324D |
| sem.info | #3B8CFF | ref #4A8BD0, #4397E5 |
| sem.marker | #FFD84D (est.) | highlighter yellow, unsampled in ref |
| sem.neutral | #747571 | unanswered, inactive, past |
| accent.violet | #A14ED6 | light, energy, a topic hue |
| brand.presenter | Ved's choice | one saturated hue not used above; see section 4 |

### 3.5 Level of detail for macro zooms
- **L0 wide:** silhouette, colour block, one accent. No text below the label floor; omit it instead.
- **L1 hero:** edge highlights, chips, labels at 30 px or more.
- **L2 macro (above about 1.5x scale):** microtext, pads, solder dots, grille patterns, defocused foreground shapes blurred 9-12 px, blurred top and bottom bands as fake depth of field.
- Swap tiers at the blur peak of the zoom. Never scale L0 art up.
- Author hero sprites at 3-4x so a 4x push stays crisp.
- Crowds: draw dots when wide and cross-fade to boxes above about 2.5x. Cull anything outside the viewport.

### 3.6 Component library to build
| Component | Key props |
|---|---|
| `IsoBox`, `IsoSlab` | size, base colour, theme, extrude, tilt, emissive |
| `IsoChip` | substrate, lid, pads pattern, die floorplan, `xray` 0..1, label |
| `IsoBoard` | trace pattern, components[], silkscreen, lod |
| `IsoDevice` | kind (laptop, phone, monitor), screen slot, `xray`, open |
| `IsoRack` | rows[], row states, LEDs, nameplate |
| `ExplodedView` | layers[], gap spring, connectors, labels |
| `XRay` | cross-fade between opaque and glass groups |
| `CutawaySection` | shell path, inner clip, parts[] |
| `TileField` | grid, heights[], glow[], camera |
| `FlowPath` | path, packets, state colour, draw progress |
| `ZoomStack` | levels[], progress, blur peak |
| `PlanTilt` | tilt 0..1 around any child |
| `Callout`, `Readout`, `Meter`, `Odometer` | anchor, value, unit, thresholds |
| `ContactShadow`, `Glow`, `SheenSweep` | height, strength, progress |

## 4. Presenter rig spec (original character)
- **Design rule:** an original character that differs from the reference mascot in silhouette, face accessory and garment colour. Keep the principle only: one saturated garment colour (`brand.presenter`) that nothing else on screen uses. In the reference it collides with error red; ours must not.
- **Placement:** waist-up bust, cropped by the bottom edge, y 72-100%, 30-40% of frame width (324-432 px), 25-30% of frame height. Default anchor bottom-centre; shift bottom-right or bottom-left when the stage needs the room.
- **Layering:** screen-locked, outside the stage camera, above the stage, below the captions. It never covers data.
- **Presence:** absent during the hook. Enters with a pop on the first sentence after it, at 3-7 s (ours; ref median 6.5 s). Stays to the end. May hide for up to 5 s behind a full-height graphic.
- **Rig parts:** torso, neck, head, hair, brows, 5 mouths, eyes with blink, two upper arms, two forearms, about 12 hand shapes, one prop slot per hand, one costume slot. Poses are stored as joint angles plus hand, mouth and prop ids.

| Pose group | Poses | Use when |
|---|---|---|
| Point | up-left, up-right, sideways | a new graphic lands; look where the viewer should look |
| Address | point at viewer, open palm | 'you', direct claims, CTA |
| Count | 1-5 fingers, two-finger sign | 'step N', small spoken numbers, 'second' |
| Size | pinch, arms wide | 'tiny', 'just', 'huge', 'hundreds' |
| Approve | thumbs up, double thumbs, fist pump | wins, passes, green states |
| Block | stop palm, arms crossed | 'before anything else', 'no more', 'zero', verdicts |
| Doubt | chin rub, head scratch, shrug | questions, 'why?', 'that's all' |
| Alarm | hands on head, hands on cheeks, open mouth | big numbers, bad numbers, price spikes |
| Fail | facepalm, grimace, wipe brow | 'useless', crashes, cost, heat, punchline |
| Hide | cover eyes, peek through fingers | 'invisible', 'looking', 'small' |
| Time | wrist tap, stopwatch or hourglass prop | slow, latency, years |
| Explain | level hand, chopping hands, typing | 'average', steps, typed input |
| Hold prop | named object beside the face | the first mention of a physical thing |
| Close | wave, wink | last line |

- **Cadence:** one pose per phrase, every 1-2 s (ref runs about 0.35-0.9 poses per second). Hold up to 3-4 s under dense diagrams.
- **Timing vs voice:** change on the phrase boundary; pose onset 2-4 frames @60 before the stressed word, matching the caption lead (ours).
- **Change method:** ref swaps or cross-fades stills in 2-6 / 4-12 frames. Ours springs the joints in 6-8 / 12-16 frames with 2 / 4 frames of anticipation and about 5% overshoot.
- **Idle (ours):** breathing 2-3 px on a 3-4 s loop; blink every 3-5 s (3 / 6 frames); eye-line turns to the active callout.

## 5. Scene template library
Every scene sits in one shell: `Background`, `Stage` (inside `SceneCamera`), optional `Rail`, `Footnote`, `Presenter`, `Captions`. Full layer stacks and beats are in `scene_templates`; this table is the index.

| Id | Template | Frequency | Duration (s) | Main sound |
|---|---|---|---|---|
| hook_hero | Hook hero in motion | 12/12, once | 2-6 | ding at 0.3-0.6 s, whoosh on the transformation |
| hero_callouts | Hero object + leader-line callouts | 11/12, 3-10 uses | 1-5 | soft pop per label |
| persistent_stage | Persistent metaphor stage with state swaps | 11/12, 1-3 stretches | 5-25 | pop per item, ding on fix, thud on fail |
| macro_zoom | Macro zoom or zoom-through into a part | 9/12, 1-4 uses | 1-4 | whoosh, click on landing |
| big_number | Big number or odometer with unit | 11/12, 2-12 uses | 1-2.5 | tick roll, impact on landing |
| compare | Side-by-side or before-after compare | 10/12, 1-3 uses | 2-8 | beeps, chime on the ratio stamp |
| evidence_card | Document or real UI in a frame | 11/12, 2-8 uses | 1-3.5 | click on landing, swipe on highlighter |
| device_meter | Device with live screen + side meter | 6/12 | 3-8 | click per item, pitched beep per step |
| exploded_xray | Exploded view, x-ray or layer peel | 7/12 | 2-6 | ding on explode, pop per label |
| flow_wires | Flow or node-wire diagram with packets | 6/12 | 3-25 | ding per arrival, click on frame |
| chart_build | Line, bar or timeline build | 10/12 | 2-7 | rising tick, impact on peak |
| unit_grid | Grid as quantity | 8/12 | 1.5-4 | rapid ticks, impact on final count |
| focus_overlay | Dimmed-stage overlay or pop-forward card | 5/12 | 2-4 | whoosh in, thud on stamp |
| chapter_rail | Chapter card + progress rail | 3/12 | 1.3-2 per card | impact on landing, riser before |
| terminal_type | Terminal or typed input | 4/12 | 1-3 | key clicks in bursts |
| thumbnail_callback | Shrink-to-thumbnail carry-over | 3/12 | 0.3-0.5 move | soft whoosh |
| recap_list | Recap accordion or checklist | 3/12 | 6-7 | pop per row |
| social_cta | Acted-out social CTA | 12/12, once | 1.2-6 | click on press, pop on state flip |

## 6. Camera and transition grammar
**There is no camera.** Every pan, push and zoom is a transform on the stage group. Captions and presenter never move with it.

**Measured transition counts (51 across 12 videos):**
| Type | Count | Where |
|---|---|---|
| Short dissolve or blur-dissolve (2-21 frames @30) | 19 | kf03, kf04, kf07, kf08, kf09, kf10, kf11 |
| Hard cut | 10 (7 in one video) | kf03, kf04, kf07, kf11 |
| Blurred push or whip (3-10 frames) | 8 | kf01, kf07, kf10 |
| Zoom-through or continuous camera move | 5 | kf02, kf07 |
| Expanding rounded-panel wipe | 4 | kf09 |
| Layer or panel slide | 3 | kf02 |
| Match-morph | 2 | kf04, kf07 |
| No transitions at all (single take) | 3 videos | kf05, kf06, kf12 |

In-shot macro zooms appear in 9/12 videos even where no shot boundary is measured. Only 15 of the 40 cuts where it was measured carry an SFX; sound follows in-shot events.

**Rules:**
1. **Element swap is the default.** Same topic continues: change state on the same object, swap a card in the same slot, or reflow the layout.
2. **Zoom-through when the story changes scale** (into a part, out to thousands). Swap the artwork at the blur peak.
3. **Whip push when the script changes place or chapter** ('in space', 'down here', 'a second trick').
4. **Theme wipe or flip only at chapter boundaries,** and only in videos that use alternating acts.
5. **Blur-dissolve (2-5 / 4-10 frames) for an unrelated reset.** Always carry one anchor across: an object, a readout, the pose or the caption.
6. **Hard cut is the exception.** Use it only for a fast montage of several ideas in a few seconds, with caption and presenter running through and a 3 / 6 frame blur-in on the new hero.
7. **Shrink to a corner thumbnail** when the old diagram will be called back.
8. **Steer focus by dimming** (others to 15-35% plus blur), not by zooming, when labels must stay in place.
9. **Never change the whole frame.** Two of the three bands stay continuous through every change.

**Move sizes (ref):** idle drift 1.02-1.05x over a scene; detail push 1.14-1.37x; macro 2.8-8x; make-room reflow 0.55-0.88x; thumbnail 0.2-0.25x.

**Feel:** snappy ease-out, long soft settle, motion blur at peak speed, 0.6-1.5 s hold after each move. Ours adds a 2-5% drift on every hold; several reference videos sit fully still.

## 7. Typography, captions, highlight box
**Captions**
- Face: one geometric sans in regular and bold. The reference face is unconfirmed (Poppins, Gilroy or Product Sans class); pick one licensed face as `font.caption`.
- Size 66-72 px; line box about 86 px; max 2 lines; 2-4 words per phrase; width inside x 18-82%; centred in the y 16-25% band.
- States: active word bold, full contrast (white on dark, near-black on light). Spoken words drop to regular `caption.grey`. The whole phrase is replaced at the next phrase.
- Lead: each word appears before its audio onset. Reference medians run 23-85 ms (median about 42 ms). Kit default 3 frames @60 (50 ms), allowed 2-5.
- Enter: blur 12 px to 0, opacity 0 to 1, scale 0.96 to 1 over 3-4 / 6-8 frames. Exit: hard replace or a 2-3 / 4-6 frame blur-out; no slide.
- No ghost of upcoming words. The caption may go empty for a beat while a card is read.
- At most one inline emoji per motif.

**Highlight box**
- Reference behaviour: a design-tool selection rectangle (1.5-2 px blue stroke, 15-20% blue fill, small corner handles). It is born with the keyword and leaves with the phrase. It does not travel.
- Frequency: from one per phrase to one per four phrases. Kit rule: at most one per phrase, target one per sentence.
- Targets: numbers, proper nouns, the contrast word.
- Colour: `sem.info` by default; it may take the topic hue of the thing named (one video does this).
- Ours: give it an original skin (for example corner brackets), draw it in 4-5 / 8-10 frames, and spring it between consecutive keywords instead of re-spawning.

**Other text**
- Labels: uppercase, tracked +10-15%, middle-dot separator, with a 1.5-2 px leader line. Floor 30 px (ours). Preferred stack: TITLE / spec / plain-words gloss.
- Hero numbers: extra-bold tabular numerals, 7-14% of frame height, small unit beside or under.
- Monospace: code, hashes, terminal, name tokens, LCD readouts.
- Footnotes: grey sentence case at the lower-left of the stage. Floor 22 px and at least 1.5 s on screen (ours).
- Serif: only inside paper artefacts.
- No separate title cards. The title is the first caption over the hero object.

## 8. Colour acts and backgrounds
- **Default: one dark act** (8/12). `bg.dark`, a faint square grid with 60 px cells, a soft vignette. Four reference videos use pure black with no grid; the kit always uses the grid version.
- **Option: alternating acts** (4/12). Dark carries mechanism, problem and anything invisible or glowing. Light carries tangible work, document evidence and practical tips. The flip is the chapter marker and happens during a move or wipe, never as a flash.
- **Light interruptions inside a dark act:** white evidence cards and paper only. They read as proof.
- **Ours:** 2-4 px grid parallax during camera moves and 2-3% noise to stop banding.

| Colour | Meaning |
|---|---|
| sem.ok green | done, answered, free, the winner |
| sem.warn amber | pending, tight, energy, the hidden layer |
| sem.error red | error, over the limit, loss, does not fit |
| sem.info blue | caption emphasis, UI action, 'the fix' |
| sem.neutral grey | unanswered, inactive, the past |
| sem.marker yellow | quoted evidence |
| gold | value, contacts, a planted prop |
| white | results and numbers |
| paper off-white | history and real-world artefacts |
| topic hues (2-5) | one per component, declared in the video's `accentMap` |

- State is always redundant: colour plus icon ('?', check, X) plus motion (tilt, strike, glow).
- Prefer dimming the rest to 25-35% over adding another colour.
- Gauges step green, amber, red at fill thresholds 0.5, 0.8 and 1.0.
- At failure the red may flood the environment as a glow or wash.

## 9. Motion tokens
The full set is in `motion_tokens`. Core values:

| Token | Frames @30 | Frames @60 | Easing |
|---|---|---|---|
| Caption word in | 3-4 | 6-8 | ease-out with blur |
| Highlight box in | 4-5 | 8-10 | ease-out |
| Pop in | 8-10 | 16-20 | spring.pop |
| Card slide in | 8-12 | 16-24 | spring.settle |
| Leader draw, then label fade | 6-10, then 4-5 | 12-20, then 8-10 | ease-out |
| Count-up | 20-45 | 40-90 | ease-out, lands on the word |
| State swap or check pop | 5-8 | 10-16 | spring.pop |
| Focus dim | 6-10 | 12-20 | ease-out |
| Camera reframe | 8-15 | 16-30 | spring.camera |
| Macro push | 20-35 | 40-70 | ease-in-out |
| Zoom-through | 4-8 | 8-16 | ease-in, then ease-out |
| Whip push | 3-10 | 6-20 | linear with heavy blur |
| Blur dissolve | 2-5 | 4-10 | linear |
| Pose change (ours) | 6-8 | 12-16 | spring.pose |
| Payoff hold (ours) | 12-20 | 24-40 | nothing new appears |

**Springs (Remotion `spring` config; all values are guesses to tune by eye):**
| Name | mass | damping | stiffness | Overshoot | Use |
|---|---|---|---|---|---|
| pop | 1 | 20 | 260 | about 8% | badges, checks, stamps, labels |
| settle | 1 | 21 | 200 | about 3% | cards, reflows |
| camera | 1 | 26 | 170 | 0% (clamp on) | stage moves |
| pose | 1 | 20 | 220 | about 6% | presenter joints |
| bouncy | 1 | 14 | 180 | about 15% | pin drops, bulges, gags |

The dossiers guess 'damping 12-14, stiffness 180' for pops, but that pair gives roughly 15-21% overshoot, which is more than the 3-8% they describe. The table is tuned to the described overshoot.

**Stagger:** grid items 1 / 2 frames; rows and list items 2-4 / 4-8; callouts 6-8 / 12-16; wires 6 / 12; sequence lights 4-5 / 8-10.

## 10. Sound profile
**Measured in the reference**
- 342 SFX events in 1,203 s, a mean of 2.8 per 10 s. Range per video: 0.3 to 7.
- All quiet: mostly -25 to -42 dB, typical around -30 dB; the loudest hits in one video reach -13 to -16 dB.
- SFX mark in-shot events (landings, state changes, counters), not cuts.
- Music is a flat bed under the voice: C# major (7 videos), D# minor (3), E minor (2). No BPM was detectable in 10 of 12; the other two read 90.9 and about 48 (possibly half-time of about 97).
- Level against the voice was not measured in any dossier.
- Nothing is cut to the beat. Where measured, 0 of 4 and 2 of 11 cuts fall within 40 ms of a beat.

**Kit targets (ours)**
- Density 4-6 events per 10 s, and no stretch longer than 8 s without one.
- Music with a known tempo of about 92 BPM (88-100). Word-level animation still follows the voice; chapter changes and the two or three biggest reveals land on bar lines.
- Master -14 LUFS integrated, true peak -1 dBTP. Voice bus about -16 LUFS. Music about 18 dB under the voice, ducked a further 3-4 dB under key numbers and lifted about 3 dB in pauses and at the CTA.
- Routine SFX peak -30 to -22 dBFS; three to five hero hits per video peak -16 to -12 dBFS.
- These level targets are recommendations, not reference measurements.

| Event | Sound |
|---|---|
| First object in the hook | ding at 0.3-0.6 s |
| Label or badge pop | bubble pop or soft beep |
| Item lands on the stage | click or pop, pitch rising as the stage fills |
| Camera move, slide, reflow | soft whoosh |
| Zoom-through | whoosh plus a low impact on landing |
| Count-up | tick roll |
| Big number lands | impact or ding |
| State turns good | ding |
| State turns bad | low thud |
| Chapter change | riser 0.5-1 s before, impact on landing |
| Stamp | thud plus chime |
| Typing | key clicks per burst |
| Cursor press, button flip | click, then pop |
| Packet arrives | short ding |

## 11. Script formula
- **Hook types across the 12:** question with a paradox (5), paradox statement followed by a question (1), myth or belief contradicted (2), series promise that names this episode (2), villain and rebellion (1), scale stats with 'let's follow one' (1).
- **Pace:** reference mean 207 wpm, range 185-225. Kit target 195-205 wpm so payoffs can hold.
- **Sentences:** mostly 4-14 words, second person, present tense. Fragments are beats: 'Same language.', 'Here's the trap.', 'No more couriers.'
- **Questions:** one to three per video, each answered at once.
- **One sustained analogy** carries the middle (desk, kitchen, pizza shops, company buildings, suitcase code). The vocabulary stays inside it.
- **Jargon comes after the picture.** Show the thing, then name it once, glossed in the same breath: 'X, a plain-words description'.
- **Numbers** are concrete, comparative and tied to 'your': your RAM, 1,700 of your computers.
- **Honesty beat:** volunteer the limits before the momentum numbers.
- **Step pattern:** constraint, 'so', mechanism, green confirmation.

| Slot | Share of runtime | Content |
|---|---|---|
| Hook | first 3-7 s | claim shown visually, gap opened |
| Promise or roadmap | 3-8% | what will be decoded; plant the open loop |
| Basics via analogy | 15-25% | one metaphor, one persistent stage |
| Mechanism steps | 35-45% | 3-5 steps, each name, show, lock |
| Caveat or twist | 8-15% | limits, 'never perfect', the trap |
| Proof | 5-10% | sourced numbers, evidence cards |
| Payoff | 5-8% | hook object returns, reframed in one line |
| CTA | last 1.2-6 s | acted-out follow, send or comment |

## 12. Where we beat them
1. **Animate the presenter.** Spring-driven joints, blinks, breathing and eye-line replace still swaps (flagged in 12/12 dossiers).
2. **One projection standard** with true side faces, ambient occlusion and contact shadows, instead of a different look per video.
3. **Native vector art only.** No photo cutouts, screenshots or third-party key art; every object has two detail tiers, so real macro zooms are possible.
4. **A travelling highlight box** with an original skin that springs from keyword to keyword.
5. **Readable labels.** 30 px floor, 22 px footnotes held 1.5 s, and never more than the caption plus two labels at one moment.
6. **Room to land.** 195-205 wpm and a 12-20 / 24-40 frame hold after every payoff with nothing new appearing.
7. **A real zoom-through per act,** and a 2-5% drift on every hold so no frame is frozen.
8. **Designed sound.** 4-6 events per 10 s, pitch tied to meaning (rising fills, falling error), no silent stretches, music with a tempo and ducking, a lift at each act change.
9. **A persistent progress cue** (rail or scoreboard) in every video over 60 s.
10. **Better data.** Count-ups on every figure, units and axis labels on charts, ratios drawn as brackets between bar ends.
11. **Parallax and texture.** 2-4 px between grid, stage and presenter; faint grain on the ground.
12. **Motion blur from sub-frame sampling at 60 fps,** not a Gaussian blur.
13. **A proper ending.** Hold the final state 0.5-1 s and match the last frame to the opening composition for a clean loop.
14. **Clean semantics.** The presenter colour sits outside the state colours, so red only ever means error.