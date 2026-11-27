"""Spotting table for ios-smooth-act1 -> script.json scene `hits` (sound redesign, 26 Nov 2026).

The table is written in ABSOLUTE seconds of the film, read off the picture (frame strips + the scene code's design
frames); this script converts each row to the scene's design frame (@30) and writes the scene `hits` that
`sound_design.py cues` reads. script.json stays the source the pipeline uses; edit the table and re-run:

    <core python> sound_hits.py          # rewrites the hits in script.json (nothing else in it changes)
    <core python> <skill>/scripts/plan_timeline.py <project>     # scene frames must stay identical
    <earshot python> <skill>/scripts/sound_design.py <project> cues

Row: (time_s, role, {db, pan, rate, take, at, run}, "what is on screen")
pan: -1 left .. +1 right = where it happens in the frame. db is relative to the role's level in sfx_palette.json.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
FPS, BASE = 60, 30

T = [
    # ---------------- S01 hook 0-10.4: the real phone, the film strip, the late frame, the macro touch
    (0.455, "glass_swipe", dict(pan=-0.05, db=1), "thumb flicks the feed on the real phone"),
    (1.620, "peel", dict(pan=-0.15, db=-1), "hard cut: the screen's frames fanned out as a film strip"),
    (2.800, "ratchet", dict(pan=-0.55, run=dict(n=5, dur=0.30, ease="out", db_end=-2)), "hard cut to the frame-time graph: drum counter rolls to 8 ms"),
    (3.645, "stamp", dict(pan=0.2), "LATE stamp lands on the red spike (hero)"),
    (6.200, "glass_tap", dict(pan=0.1, db=1, take=2), "hard cut to the macro: the fingertip is on the glass"),
    (6.667, "pulse", dict(pan=0.0), "red ripple runs from the glass into the finger: felt, not heard"),
    (8.850, "glass_swipe", dict(pan=0.0, db=-3, rate=1.05, take=2), "on an iPhone: the thumb scrolls again, every frame on time"),
    # ---------------- S02 promise 10.4-26.8: board wakes, pedestals, $125M/day counter, back glass, the dive, transistor
    (15.15, "set", dict(pan=-0.42, rate=0.94), "A20 Pro settles on the first pedestal"),
    (16.03, "set", dict(pan=0.0, rate=1.0, db=-1), "modem settles on the second pedestal"),
    (17.08, "set", dict(pan=0.42, rate=1.1, db=-2), "glass software stack settles on the third pedestal"),
    (18.15, "ratchet", dict(pan=-0.35, run=dict(n=16, dur=1.40, ease="out", db_end=-3, rate_end=-0.06)), "$125,000,000 drum counter rolls, slowing"),
    (19.68, "lock", dict(pan=-0.3), "counter wheels lock"),
    (22.60, "glass_lift", dict(pan=-0.3), "back glass ghosts and lifts off the phone"),
    (24.50, "air_long", dict(pan=0.0, at="peak", take=2, db=-2), "one continuous dive: board -> package -> die -> cells"),
    (25.50, "hum_on", dict(pan=0.1, take=2), "the transistor's gate charges"),
    (25.97, "switch", dict(pan=0.1), "transistor switches ON: the channels light up"),
    # ---------------- S03 the deadline 26.8-40.9: OLED sub-pixels, 120 Hz, gates, ON TIME / LATE / HITCH
    (29.25, "ratchet", dict(pan=-0.6, run=dict(n=8, dur=0.70, ease="out", db_end=-2)), "120 Hz drum counter rolls"),
    (35.47, "knock_dull", dict(pan=-0.25), "the gate shuts: no new frame"),
    (35.71, "stamp", dict(pan=-0.3, db=-2, take=2), "LATE stamp"),
    (40.29, "stamp", dict(pan=-0.3, db=1, rate=0.92, take=3), "HITCH stamp (hero of the scene)"),
    # ---------------- S04 the race 40.9-57.1: touch -> app -> render server -> GPU -> display, cartridge on a rail
    (42.93, "glass_tap", dict(pan=-0.4, take=3), "finger touches the real phone at the first station"),
    (44.42, "slide", dict(pan=-0.3, rate=1.0), "cartridge travels the rail: touch -> app"),
    (48.42, "slide", dict(pan=-0.1, rate=0.95, db=-1), "hands it over: cartridge travels app -> render server"),
    (53.55, "node_ticks", dict(pan=0.1), "GPU die paints the frame tile by tile"),
    (54.50, "slide", dict(pan=0.15, rate=0.9, db=-1), "cartridge travels GPU -> display"),
    (56.39, "clock_tick", dict(pan=0.0, db=2), "the very next tick"),
    # ---------------- S05 the clever part 57.1-71.2: glass wall, card crosses, BUSY, ProMotion dial, battery
    (59.95, "glass_swipe", dict(pan=-0.15, rate=0.85, take=2), "the animation card lifts out of the app and crosses the glass wall"),
    (64.20, "knock_dull", dict(pan=-0.3, take=2), "app goes amber: BUSY - stuck"),
    (66.10, "clock_tick", dict(pan=0.2, db=-1), "the server keeps landing frames on time"),
    (66.45, "clock_tick", dict(pan=0.2, db=-2, rate=1.03), "... and the next"),
    (67.05, "air_pass", dict(pan=0.0, at="peak", db=-2), "camera whips along the machine to the display"),
    (68.92, "ratchet", dict(pan=0.2, db=1, run=dict(n=6, dur=0.55, ease="out", db_end=-4, rate_end=-0.28)), "ProMotion dial needle winds down"),
    # ---------------- S06 the turn 71.2-81.6: tunnel of gates, 7,200/min, iOS layers onto the chip, first iPhone, empty socket
    (71.20, "air_long", dict(pan=0.0, at="peak", db=-1), "portal into the tunnel of gates"),
    (73.50, "ratchet", dict(pan=0.0, run=dict(n=12, dur=1.02, ease="out", db_end=-3, rate_end=-0.06)), "7,200 / MIN drum counter rolls"),
    (77.47, "set", dict(pan=0.0, rate=0.88), "glass iOS layers seat on the chip"),
    (80.93, "hollow", dict(pan=0.2), "the empty socket: a question mark"),
    # ---------------- S07 the chip road 81.6-107.3
    (83.75, "ratchet", dict(pan=-0.2, run=dict(n=10, dur=0.74, ease="out", db_end=-3, rate_end=-0.06)), "$278,000,000 drum counter rolls"),
    (84.50, "lock", dict(pan=-0.2), "$278,000,000 locks"),
    (86.22, "stamp", dict(pan=-0.25, db=1, rate=0.96), "seal stamp on the P.A. Semi deal card (hero)"),
    (88.43, "seat", dict(pan=0.0, db=1), "A4 drops into the empty socket (hero)"),
    (93.80, "ratchet", dict(pan=0.25, run=dict(n=6, dur=0.45, ease="out", db_end=-2)), "32 -> 64 counter rolls as the lanes widen"),
    (98.40, "node_ticks", dict(pan=0.3, rate=1.12, take=2), "neural net nodes light up one by one"),
    (103.4, "air_long", dict(pan=0.0, at="peak", db=-4, take=2), "the die scales up into the M1"),
    (105.12, "slide", dict(pan=0.2, rate=0.72, take=4, db=-2), "x86 chip pushed out of the frame"),
    (106.72, "air_short", dict(pan=0.0, rate=0.8, db=-1), "MacBook lid swings open"),
    # ---------------- S08 the chips around it 107.3-121.8
    (110.86, "seat", dict(pan=0.3, db=-2, rate=1.08, take=3), "C1 modem drops into its place"),
    (114.12, "seat", dict(pan=0.1, db=-3, rate=1.14), "N1 drops in"),
    (114.68, "lock", dict(pan=0.5, db=-6, rate=1.3, take=1), "Wi-Fi 7"),
    (115.20, "lock", dict(pan=0.5, db=-7, rate=1.38, take=2), "Bluetooth 6"),
    (115.47, "lock", dict(pan=0.5, db=-8, rate=1.46, take=3), "Thread"),
    (119.30, "air_long", dict(pan=0.0, at="peak", db=-1), "push into the A20 Pro hero"),
    (120.30, "switch", dict(pan=0.6), "transistor lens switches on"),
    # ---------------- S09 hand-off 121.8-130.6
    (121.87, "ratchet", dict(pan=-0.75, run=dict(n=4, dur=0.20, ease="out", db_end=-2)), "18 YEARS counter rolls"),
    (124.85, "glass_swipe", dict(pan=0.0, db=-1, take=3), "thumb scrolls the phone again: every frame on time"),
    (128.78, "glass_lift", dict(pan=-0.25, take=2), "back glass lifts"),
    (129.20, "air_long", dict(pan=0.0, at="onset", db=-2, take=2), "camera pushes inside the phone (hand-off to Act 2)"),
]

# beats deliberately left WITHOUT a sound (music and voice carry them) - printed in out/sound_spotting.md
SILENT = [
    (78.50, "cut to the real photo of the first iPhone (a camera shutter was tried: in the mix earshot heard it as a zipper / zap, so the cut stays quiet and the score's low piano marks it)"),
    (0.35, "the thumb landing (the flick right after it is the first sound)"),
    (10.38, "S01 -> S02 join: an invisible cut on one continuous board move - no transition sound; the board waking is left to the score's lift"),
    (19.79, "/ DAY drops in under the calendar (the counter's lock is the accent)"),
    (33.88, "ON TIME stamps on the first frames - kept silent so LATE and HITCH land by contrast"),
    (44.76, "cartridge docking at each station (the slide ends in its own soft stop)"),
    (55.00, "display phone lights up; ON TIME stamp at 56.5 (the stopwatch tick on 'tick' is the accent)"),
    (61.00, "animation card lands inside the server"),
    (77.50, "pins light under the seated layers"),
    (81.60, "push onto the chip road (the score's downbeat carries it)"),
    (106.92, "MacBook screen lights"),
    (116.90, "board slides into the real phone"),
    (2.37, "the red frame lags behind the strip - the LATE stamp a second later is the one accent"),
    (4.45, "two film frames slide in, the scan finds nothing, NO VISIBLE DIFFERENCE banner: 'you can't see it' = you hear nothing"),
    (7.40, "second red ripple on the glass"),
    (8.00, "graph flattens to even green bars and the phone redraws - left to the music's release"),
    (9.40, "logic board rises out of the phone (music lifts into S02 instead)"),
    (13.95, "camera glides down to the pedestals; pedestal rings light"),
    (17.80, "calendar pages flip behind the counter (16 flips - would be clutter under the ratchet)"),
    (23.05, "layer cards light one by one (back glass, logic board, battery, A20 Pro)"),
    (26.78, "zoom-through into the OLED sub-pixels (the dive's air tail covers it)"),
    (28.75, "refresh scan line sweeps the panel again and again"),
    (32.10, "pull-back from the sub-pixels to the VSYNC timeline"),
    (33.40, "8.3 ms counter; second ON TIME stamp at 34.5; green gates passing"),
    (37.00, "REPEAT: the old picture is copied into the slot"),
    (38.25, "the next gate goes green ('one more beat')"),
    (41.60, "wide reveal of the render machine, deadline bar appears"),
    (46.00, "app window re-lays out its boxes"),
    (49.30, "glass enclosure draws round the render server, SEPARATE PROCESS tag; layer tiles stack"),
    (52.30, "cartridge travels render server -> GPU (the fourth rail move; three are enough)"),
    (57.90, "camera pulls back, glass wall rises between app and server"),
    (70.45, "battery fills"),
    (75.75, "cut from the tunnel to the chip"),
    (80.20, "the photo opens into the 2008 board"),
    (82.10, "deal card slides in, signature draws"),
    (104.00, "the M1 floats in over the x86 chip (no contact on screen, so no impact)"),
    (87.50, "road moves 2008 -> 2010; and every later year move (2013, 2017, 2020) - the score steps up instead"),
    (89.50, "real A4 photo"),
    (95.00, "phone with 64 pops beside the die"),
    (99.50, "face outline recognised, check mark"),
    (108.75, "push onto the 2025 board, neighbouring chips highlight"),
    (111.13, "the pulse out to the cell tower and its reply (a radio 'ping' read as a cheap synth beep - earshot match +3.1 - so the wave stays silent)"),
    (118.50, "A20 Pro callout on the back of the phone"),
    (123.50, "18-year ribbon folds into the phone; green bars spread"),
    (125.90, "phone turns to its back; A20 Pro callout card"),
]


def main():
    sp = HERE / "script.json"
    script = json.loads(sp.read_text(encoding="utf-8"))
    pj = json.loads((HERE / "project.json").read_text(encoding="utf-8"))
    bounds = [(s["id"], s["from"] / FPS, s["to"] / FPS) for s in pj["scenes"]]
    hits = {sid: [] for sid, _, _ in bounds}
    for t, role, o, note in T:
        sid, t0, _ = next(b for b in bounds if b[1] <= t < b[2] or b is bounds[-1])
        h = {"frame": round((t - t0) * BASE, 2), "sfx": role, **o, "note": note}
        hits[sid].append(h)
    for s in script["scenes"]:
        s["hits"] = hits.get(s["id"], [])
    script["sound_silent_beats"] = [{"t": t, "note": n} for t, n in sorted(SILENT)]
    sp.write_text(json.dumps(script, indent=1, ensure_ascii=False), encoding="utf-8", newline="\r\n")
    print(f"script.json: {len(T)} hits ({sum(1 for r in T if 'run' in r[2])} runs), {len(SILENT)} beats left silent")


if __name__ == "__main__":
    main()
