"""Voice-over with ElevenLabs text-to-speech WITH timestamps -> vo.mp3 + word timings.

usage:
  tts.py <project dir> --estimate        # characters, credit balance; generates nothing (free)
  tts.py <project dir> --yes             # generate (paid: ~1 credit per character on multilingual v2)
  tts.py <project dir> --redo "<old sentence>" --new "<new sentence>" [--yes]
        # re-voice ONE sentence (Ved approves the cost first): generates only the new sentence with the
        # neighbouring text as context, splices it into the pauses around the old one, matches loudness,
        # shifts all later word times, updates script.json; keeps vo_take<N>.mp3 / vo_words_take<N>.json backups.
        # Then re-run plan_timeline (scene frames change after the splice).
reads: <project>/script.json  (voice settings + scene texts)
writes: <engine>/public/<id>/vo.mp3, <project>/vo_words.json

The key is read from C:\\Users\\VED\\.config\\elevenlabs\\api_key at the moment of use and never
printed. ElevenLabs returns per-character times; they are grouped into words here, so no speech
recognition is needed for our own voice-over.
"""
import argparse
import base64
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rmcommon import ENGINE, project_paths  # noqa: E402

API = "https://api.elevenlabs.io"


def key():
    p = Path.home() / ".config" / "elevenlabs" / "api_key"
    if not p.exists():
        sys.exit("ElevenLabs key file missing: C:\\Users\\VED\\.config\\elevenlabs\\api_key - ask Ved")
    return p.read_text(encoding="utf-8").strip()


def full_text(script):
    return " ".join(s["text"].strip() for s in script["scenes"])


def words_from_alignment(al):
    chars, t0s, t1s = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, s, e = [], "", None, None
    for c, a, b in zip(chars, t0s, t1s):
        if c.isspace():
            if cur:
                words.append({"w": cur, "start": round(s, 3), "end": round(e, 3)})
            cur, s, e = "", None, None
            continue
        if s is None:
            s = a
        cur += c
        e = b
    if cur:
        words.append({"w": cur, "start": round(s, 3), "end": round(e, 3)})
    return words


def _decode(path_or_bytes, sr=44100):
    """mp3 (path or bytes) -> mono float32 at sr."""
    import subprocess
    import numpy as np
    src = ["-i", str(path_or_bytes)] if not isinstance(path_or_bytes, (bytes, bytearray)) else ["-i", "pipe:0"]
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", *src, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                       input=path_or_bytes if isinstance(path_or_bytes, (bytes, bytearray)) else None, capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def redo_sentence(P, script, v, h, old, new, yes):
    """Re-voice one sentence and splice it into the existing take (see usage)."""
    import subprocess
    import numpy as np
    sr = 44100
    wj = json.loads((P.proj / "vo_words.json").read_text(encoding="utf-8"))
    words = wj["words"]
    old_t, new_t = old.split(), new.split()
    idx = [i for i in range(len(words) - len(old_t) + 1) if [w["w"] for w in words[i:i + len(old_t)]] == old_t]
    if len(idx) != 1:
        sys.exit(f"old sentence found {len(idx)} times in vo_words.json - give the exact words (with punctuation)")
    i0, i1 = idx[0], idx[0] + len(old_t) - 1
    scene = next((s for s in script["scenes"] if old in s["text"]), None)
    if scene is None:
        sys.exit("old sentence not found in any scene text of script.json")
    print(f"[video-remake] redo in {scene['id']}: {len(new)} characters (was: '{old}')")
    if not yes:
        print("[video-remake] estimate only - rerun with --yes after the user approves the cost")
        return
    prev_text = " ".join(w["w"] for w in words[max(0, i0 - 40):i0])
    next_text = " ".join(w["w"] for w in words[i1 + 1:i1 + 41])
    body = {"text": new, "model_id": v.get("model", "eleven_multilingual_v2"), "previous_text": prev_text, "next_text": next_text,
            "voice_settings": {"stability": v.get("stability", 0.4), "similarity_boost": v.get("similarity", 0.8),
                               "style": v.get("style", 0.25), "use_speaker_boost": True, "speed": v.get("speed", 1.0)}}
    r = requests.post(f"{API}/v1/text-to-speech/{v['voice_id']}/with-timestamps?output_format=mp3_44100_128",
                      headers={**h, "Content-Type": "application/json"}, json=body, timeout=300)
    if not r.ok:
        sys.exit(f"ElevenLabs TTS failed: HTTP {r.status_code} {r.text[:300]}")
    res = r.json()
    nw = words_from_alignment(res.get("alignment") or res.get("normalized_alignment"))
    if [w["w"] for w in nw] != new_t:
        print(f"[video-remake] note: alignment words {[w['w'] for w in nw]} differ from the text; using the text's words")
    na = _decode(base64.b64decode(res["audio_base64"]), sr)
    oa = _decode(P.pub / "vo.mp3", sr)
    # the alignment's last character often runs into trailing silence (seen 24 Nov: +1.2 s of dead air after the
    # splice) - end the sentence where the speech energy actually ends
    fr = int(0.01 * sr)
    env = np.sqrt(np.mean(na[:len(na) // fr * fr].reshape(-1, fr) ** 2, axis=1))
    loud = np.where(env > 0.005)[0]
    if len(loud) and nw:
        speech_end = (loud[-1] + 1) * 0.01 + 0.04
        if speech_end < nw[-1]["end"]:
            nw[-1]["end"] = round(max(nw[-1]["start"] + 0.08, speech_end), 3)
    # backups of the current take
    n = 1
    while (P.pub / f"vo_take{n}.mp3").exists():
        n += 1
    (P.pub / f"vo_take{n}.mp3").write_bytes((P.pub / "vo.mp3").read_bytes())
    (P.pub / f"vo_redo{n}.mp3").write_bytes(base64.b64decode(res["audio_base64"]))   # the paid clip itself
    (P.proj / f"vo_words_take{n}.json").write_text(json.dumps(wj, indent=2, ensure_ascii=False), encoding="utf-8")
    s0, e0 = words[i0]["start"], words[i1]["end"]
    p = words[i0 - 1]["end"] if i0 > 0 else 0.0
    q = words[i1 + 1]["start"] if i1 + 1 < len(words) else len(oa) / sr
    pre, post = (s0 - p) / 2, (q - e0) / 2          # cut in the middle of the pauses (silence)
    ns0, ne0 = nw[0]["start"], nw[-1]["end"]
    # loudness match on the spoken parts
    rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-9)
    g = rms(oa[int(s0 * sr):int(e0 * sr)]) / rms(na[int(ns0 * sr):int(ne0 * sr)])
    seg = na[max(0, int((ns0 - pre) * sr)):int((ne0 + post) * sr)] * g
    lead = int(round(pre * sr)) - (int(ns0 * sr) - max(0, int((ns0 - pre) * sr)))
    seg = np.concatenate([np.zeros(max(0, lead), np.float32), seg])
    tail = int(round((pre + (ne0 - ns0) + post) * sr)) - len(seg)
    seg = np.concatenate([seg, np.zeros(max(0, tail), np.float32)])[:int(round((pre + (ne0 - ns0) + post) * sr))]
    f = int(0.01 * sr)
    seg[:f] *= np.linspace(0, 1, f)
    seg[-f:] *= np.linspace(1, 0, f)
    out = np.concatenate([oa[:int((p + pre) * sr)], seg, oa[int((e0 + post) * sr):]])
    delta = (ne0 - ns0) - (e0 - s0)
    new_words = [{"w": t, "start": round(s0 + (w["start"] - ns0), 3), "end": round(s0 + (w["end"] - ns0), 3)}
                 for t, w in zip(new_t, nw)] if len(nw) == len(new_t) else \
        [{"w": t, "start": round(s0 + k * (ne0 - ns0) / len(new_t), 3), "end": round(s0 + (k + 1) * (ne0 - ns0) / len(new_t), 3)}
         for k, t in enumerate(new_t)]
    later = [{"w": w["w"], "start": round(w["start"] + delta, 3), "end": round(w["end"] + delta, 3)} for w in words[i1 + 1:]]
    pcm = (np.clip(out, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "pipe:0",
                    "-c:a", "libmp3lame", "-b:a", "192k", str(P.pub / "vo.mp3")], input=pcm, check=True)
    scene["text"] = scene["text"].replace(old, new)
    (P.proj / "script.json").write_text(json.dumps(script, indent=1, ensure_ascii=False), encoding="utf-8")
    text = full_text(script)
    (P.proj / "vo_words.json").write_text(json.dumps({"text": text, "words": words[:i0] + new_words + later},
                                                     indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[video-remake] spliced {len(new_t)} words at {s0:.2f}s (gain {20 * np.log10(g):+.1f} dB, length {delta:+.2f}s); "
          f"backup vo_take{n}.mp3; voice now {len(out) / sr:.2f}s. Re-run plan_timeline.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--estimate", action="store_true")
    ap.add_argument("--yes", action="store_true", help="the user approved the cost")
    ap.add_argument("--redo", help="exact old sentence to re-voice (as in vo_words.json, with punctuation)")
    ap.add_argument("--new", help="replacement sentence")
    a = ap.parse_args()
    P = project_paths(a.project)
    script = json.loads((P.proj / "script.json").read_text(encoding="utf-8"))
    if a.redo:
        if not a.new:
            sys.exit("--redo needs --new")
        v = script.get("voice") or {}
        redo_sentence(P, script, v, {"xi-api-key": key()}, a.redo, a.new, a.yes and not a.estimate)
        return
    text = full_text(script)
    v = script.get("voice") or {}
    h = {"xi-api-key": key()}
    sub = requests.get(f"{API}/v1/user/subscription", headers=h, timeout=30)
    if sub.status_code == 401:
        sys.exit("ElevenLabs returned 401 - the key is not accepted; ask Ved")
    j = sub.json() if sub.ok else {}
    left = (j.get("character_limit") or 0) - (j.get("character_count") or 0)
    print(f"[video-remake] voice: {len(text)} characters, voice {v.get('name')} ({v.get('voice_id')}), "
          f"model {v.get('model', 'eleven_multilingual_v2')}; balance {left} characters left")
    if a.estimate or not a.yes:
        print("[video-remake] estimate only - rerun with --yes after the user approves the cost")
        return
    body = {"text": text, "model_id": v.get("model", "eleven_multilingual_v2"),
            "voice_settings": {"stability": v.get("stability", 0.4), "similarity_boost": v.get("similarity", 0.8),
                               "style": v.get("style", 0.25), "use_speaker_boost": True, "speed": v.get("speed", 1.0)}}
    r = requests.post(f"{API}/v1/text-to-speech/{v['voice_id']}/with-timestamps?output_format=mp3_44100_128",
                      headers={**h, "Content-Type": "application/json"}, json=body, timeout=300)
    if not r.ok:
        sys.exit(f"ElevenLabs TTS failed: HTTP {r.status_code} {r.text[:300]}")
    res = r.json()
    P.pub.mkdir(parents=True, exist_ok=True)
    (P.pub / "vo.mp3").write_bytes(base64.b64decode(res["audio_base64"]))
    words = words_from_alignment(res.get("alignment") or res.get("normalized_alignment"))
    (P.proj / "vo_words.json").write_text(json.dumps({"text": text, "words": words}, indent=2, ensure_ascii=False),
                                          encoding="utf-8")
    dur = words[-1]["end"] if words else 0
    print(f"[video-remake] voice: vo.mp3 {dur:.2f} s, {len(words)} words, "
          f"{len(words) / dur * 60 if dur else 0:.0f} wpm -> {P.pub / 'vo.mp3'}")


if __name__ == "__main__":
    main()
