"""Step 8e (top tool): SFX hits with AudioSep (MIT) - text-queried separation + CLAP zero-shot labels.

For each query ("whoosh", "impact", ...) AudioSep separates that sound from the music+SFX bed
(Demucs no-vocals stem, so the voiceover does not confuse it). Onsets in each separated track that
explain a good share of the bed at that moment become candidate hits. Each hit's separated audio is
then embedded with AudioSep's own CLAP encoder and named against SFX labels AND music labels; hits
that look most like music (a synth note, a drum beat) are dropped.

usage: sfx_audiosep.py <workdir> [--queries "whoosh,impact,riser,click,ding"] [--min-ratio 0.35]
runs in: envs/audiosep (Python 3.10) with the repo at D:\\VideoBlueprint\\repos\\AudioSep
writes: raw/sfx.json, stems/sfx_<query>.wav
"""
import argparse
import os
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import REPOS, Work, log  # noqa: E402

QUERIES = {
    "whoosh": "a fast whoosh swoosh transition sound effect",
    "impact": "a heavy cinematic impact boom hit sound effect",
    "riser": "a rising riser sweep build-up sound effect",
    "click": "a short click pop or tap user interface sound effect",
    "ding": "a bright ding chime notification sound effect",
}
LABELS_SFX = {
    "whoosh": "the sound of a whoosh swoosh", "swish": "the sound of a quick swish",
    "impact/boom": "the sound of a heavy impact boom", "hit/thud": "the sound of a punchy hit thud",
    "riser": "the sound of a rising riser sweep", "downlifter/drop": "the sound of a falling downlifter drop",
    "click/pop": "the sound of a click or pop", "ding/chime": "the sound of a ding chime notification",
    "cash/coins": "the sound of coins and a cash register", "glitch": "the sound of a digital glitch",
    "bubble pop": "the sound of a bubble popping", "camera shutter": "the sound of a camera shutter",
    "typing": "the sound of keyboard typing", "beep": "the sound of an electronic beep",
    "crash": "the sound of a crash", "swell": "the sound of a swelling stretching tone",
    "tick": "the sound of a clock ticking", "scratch": "the sound of a record scratch",
}
LABELS_MUSIC = {
    "music": "the sound of music", "drum beat": "the sound of a drum beat", "bass note": "the sound of a bass note",
    "synth note": "the sound of a synthesizer note", "piano": "the sound of a piano", "speech": "the sound of speech",
}


def env_db(x, sr, hop):
    n = len(x) // hop
    r = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    return 20 * np.log10(r)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--queries", default=",".join(QUERIES))
    ap.add_argument("--min-ratio", type=float, default=0.2, help="share of the bed's energy the hit must explain")
    ap.add_argument("--min-db", type=float, default=-42.0)
    ap.add_argument("--min-gap", type=float, default=0.12)
    a = ap.parse_args()
    w = Work(a.workdir)
    src = w.stems / "music_no_vocals.wav"
    if not src.exists():
        src = w.audio
    if not src.exists():
        w.save("sfx", {"skipped": "no audio"})
        return
    repo = REPOS / "AudioSep"
    sys.path.insert(0, str(repo))
    cwd = os.getcwd()
    os.chdir(repo)  # AudioSep loads config/ and checkpoint/ by relative path
    import librosa
    import soundfile as sf
    import torch
    from pipeline import build_audiosep

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    model = build_audiosep("config/audiosep_base.yaml", "checkpoint/audiosep_base_4M_steps.ckpt", dev)
    os.chdir(cwd)
    sr, hop = 32000, 320  # 10 ms
    mix, _ = librosa.load(str(src), sr=sr, mono=True)
    mix_db = env_db(mix, sr, hop)
    enc = model.query_encoder

    def text_emb(texts):
        return torch.nn.functional.normalize(enc.get_query_embed(modality="text", text=texts, device=dev), dim=-1)

    names = list(LABELS_SFX) + list(LABELS_MUSIC)
    lab = text_emb(list(LABELS_SFX.values()) + list(LABELS_MUSIC.values()))
    n_sfx = len(LABELS_SFX)

    cands = []
    for q in [x.strip() for x in a.queries.split(",") if x.strip()]:
        prompt = QUERIES.get(q, f"the sound of {q} sound effect")
        with torch.no_grad():
            cond = enc.get_query_embed(modality="text", text=[prompt], device=dev)
            inp = {"mixture": torch.Tensor(mix)[None, None, :].to(dev), "condition": cond}
            sep = np.squeeze(model.ss_model.chunk_inference(inp))
        sep = sep[:len(mix)]
        sf.write(w.stems / f"sfx_{q.replace(' ', '_')}.wav", sep, sr)
        sdb = env_db(sep, sr, hop)
        onset_env = librosa.onset.onset_strength(y=sep, sr=sr, hop_length=hop)
        fr = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop, delta=0.1,
                                        wait=int(a.min_gap * 100), backtrack=True)
        for f in fr:
            seg = slice(f, min(len(sdb), f + 15))
            lvl = float(np.max(sdb[seg])) if seg.stop > seg.start else -120
            ratio = float(np.mean(10 ** ((sdb[seg] - mix_db[seg]) / 10))) if seg.stop > seg.start else 0
            if lvl < a.min_db or ratio < a.min_ratio:
                continue
            cands.append({"t": round(f * hop / sr, 3), "query": q, "level_db": round(lvl, 1),
                          "bed_share": round(min(ratio, 1.0), 3), "_sep": sep})
        torch.cuda.empty_cache()

    events = []
    for c in sorted(cands, key=lambda c: c["t"]):
        i0 = int(max(0, c["t"] - 0.05) * sr)
        crop = c.pop("_sep")[i0:i0 + int(1.0 * sr)]
        with torch.no_grad():
            ae = torch.nn.functional.normalize(
                enc.get_query_embed(modality="audio", audio=torch.Tensor(crop)[None, :].to(dev), device=dev), dim=-1)
        sims = (ae @ lab.T).squeeze(0).cpu().numpy()
        best = int(np.argmax(sims))
        top_sfx = int(np.argmax(sims[:n_sfx]))
        if best >= n_sfx and sims[best] - sims[top_sfx] > 0.02:
            continue  # sounds like music/speech, not a designed effect
        # duration: how long the separated hit stays within 12 dB of its peak
        e = env_db(crop, sr, hop)
        dur = float(np.sum(e > e.max() - 12) * hop / sr) if len(e) else 0.0
        # The query that separated the hit is the more reliable family label (tested on a Short with a
        # known cue list); CLAP's zero-shot name is kept as a finer guess.
        c.update({"type": c["query"], "clap_guess": names[top_sfx], "clap_score": round(float(sims[top_sfx]), 3),
                  "runner_up": names[int(np.argsort(-sims)[1])], "dur_s": round(dur, 3),
                  "confidence": "medium (AudioSep query)" if c["bed_share"] > 0.5 else "low"})
        if events and c["t"] - events[-1]["t"] < a.min_gap:
            if c["clap_score"] > events[-1]["clap_score"]:
                events[-1] = c
            continue
        events.append(c)
    for e in events:
        e["strength"] = e["bed_share"]
        e["stem"] = f"sfx_{e['query']}"
    w.save("sfx", {"tool": "AudioSep (text-queried separation) + CLAP zero-shot labels", "device": dev,
                   "queries": a.queries.split(","), "events": events})
    log(f"sfx (AudioSep): {len(events)} hits from {len(cands)} candidates")


if __name__ == "__main__":
    main()
