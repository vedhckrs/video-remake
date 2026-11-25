# Listening report (earshot)

## Music (earshot describe)
```
44.20 s busy, 3.1 onsets/s, loudness range 8 LU. Music (AudioSet Music 0.85). Unvalidated hints - genre: inspirational corporate background music (z +3.6), upbeat corporate pop music (z +3.3); mood (wrong for ~1 in 5 tracks in a test): uplifting and hopeful music (z +3.2), sad and melancholic music (z +3.0). No sound-effect description stands out (closest: a music box melody z +1.2, walking through dry leaves z +1.2; tentative). AudioSet: Music 0.85, Drum 0.20, Piano 0.18. peak -1.0 dBFS, -20.2 LUFS, brightness 3.2 kHz, bandwidth 20.5 kHz, side/mid -6 dB. Windows that read differently: 0:00.00-0:10.00 a music box melody (z +2.1; AudioSet Music 0.70); 0:20.00-0:30.00 walking through dry leaves (z +1.4; AudioSet Music 0.82).

top tags (z calibrated: >= 3 clear, 2.5-3 plausible, 2-2.5 weak, < 2 tentative):
   +1.2  a music box melody  [chimes]  cos 0.153
   +1.2  walking through dry leaves  [nature]  cos 0.087
   +1.0  keys jingling  [everyday]  cos 0.081
   +1.0  an uplifter sweep  [transitions]  cos 0.122
   +0.8  a success chime  [ui]  cos 0.143
   +0.8  footsteps on grass  [nature]  cos 0.030
   +0.7  birds singing in the morning  [ambience]  cos 0.003
   +0.6  a finger tapping on glass  [foley]  cos 0.089
unvalidated hints (music genre / mood, instruments, voice): inspirational corporate background music (+3.6), upbeat corporate pop music (+3.3), uplifting and hopeful music (+3.2), sad and melancholic music (+3.0), romantic music (+2.7)
best per category: transitions: an up
```

## Final loudness (earshot measure)
```
reanimate-remake.mp4: 44.200 s, peak -1.7 dBFS (true peak -1.5 dBTP); -14.5 LUFS, LRA 1.3 LU; noise floor -34.3 dBFS, attack 70 ms, decay 3283 ms, brightness 2611 Hz, bandwidth 20480 Hz; bands sub -16.5 low -4.2 lowmid -4.5 mid -7.6 presence -14.7 air -15.3 top -34.2 dB.
```

## Critique vs professional launch films

- **lufs_i**: ok - -14.5 
- **true_peak**: ok - -1.5 
- **p_real**: ok - 0.929 
- **music_frac**: ok - 1.0 
- **cuts_with_sound**: ok - 0.6 
- **lra**: ok - 1.3 
- **crest_lu**: ok - 0.8 
- **first_sound_s**: ok - 0.03 
- **end_silence_s**: ok - 0.13 
- **max_gap_s**: ok - 0.0 
- **final_lu**: ok - 1.1 
- **onset_rate**: ok - 5.75 
- **hit_rate**: ok - 1.58 
- **intro_lu**: ok - 0.2 
- **end_lu**: ok - -0.8 
- **fade_s**: ok - 0.87 
- **band_sub**: ok - -16.5 
- **band_low**: ok - -4.2 
- **band_lowmid**: ok - -4.5 
- **band_mid**: high - -7.6 
- **band_presence**: ok - -14.7 
- **band_air**: ok - -15.3 
- **side_to_mid_db**: ok - -12.8 
- **speech_frac**: info - 1.0 
- **tempo**: info - 101 
- **peak_pos**: info - 0.71 
- **tail_s**: info - 0.96 
- **stopdowns_min**: info - 6.8 
- **cut_rate**: info - 0.34 
- **cut_hit_frac**: info - 0.2 
- **cut_frame_sync**: info - 0.07 
- **cuts_on_beat**: info - 0.13 
- **brightness_hz**: info - 2611 
- **correlation**: info - 0.9 

## Files
- out/sheet.png (frames, events, spectrogram, loudness, sync) - LOOK at it
- out/timeline.json, out/critique.json, out/earshot_*.txt

earshot's ears are models: ask Ved for one human listen on headphones.