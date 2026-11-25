"""Step 8b: voiceover transcript with word timestamps (WhisperX, BSD-2) + speakers (pyannote community-1).

usage: speech.py <workdir> [--model large-v3] [--language hi|en|...] [--diarize] [--batch 8]
reads: stems/vocals.wav when present (cleaner under loud music), else audio_48k.wav
writes: raw/words.json, words.srt
Diarization needs a Hugging Face token at ~/.config/huggingface/token and the
pyannote/speaker-diarization-community-1 terms accepted; without it every word is SPEAKER_00.
"""
import argparse
import gc
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vbcommon import MODELS, Work, hf_token, log  # noqa: E402


def local_model(repo: str, folder: Path) -> Path:
    """Download a HF repo into a plain folder. Windows without Developer Mode cannot make the
    cache's symlinks, so models live as real files under D:\\VideoBlueprint\\models."""
    if folder.exists() and any(folder.iterdir()):
        return folder
    from huggingface_hub import snapshot_download
    snapshot_download(repo, local_dir=str(folder), token=hf_token())
    return folder


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--model", default="large-v3")
    ap.add_argument("--language", default=None, help="force a language code; Hinglish usually works best as 'hi'")
    ap.add_argument("--diarize", action="store_true")
    ap.add_argument("--min-speakers", type=int)
    ap.add_argument("--max-speakers", type=int)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--chunk-size", type=int, default=15,
                    help="seconds per Whisper window. WhisperX's default 30 lets Whisper stop early inside a window "
                         "and silently drop speech (tested: 88 of 124 words at 30 s, all 124 at 15 s and 10 s)")
    ap.add_argument("--source", choices=["vocals", "mix"], default="vocals")
    a = ap.parse_args()
    w = Work(a.workdir)
    src = w.stems / "vocals.wav"
    if a.source == "mix" or not src.exists():
        src = w.audio
    if not src.exists():
        w.save("words", {"skipped": "no audio"})
        return

    import torch
    import whisperx

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    ctype = "float16" if dev == "cuda" else "int8"
    audio = whisperx.load_audio(str(src))
    asr_dir = MODELS / f"faster-whisper-{a.model}"
    if not (asr_dir / "model.bin").exists():
        local_model(f"Systran/faster-whisper-{a.model}", asr_dir)
    model = whisperx.load_model(str(asr_dir), dev, compute_type=ctype, language=a.language,
                                vad_method="silero")
    res = model.transcribe(audio, batch_size=a.batch, language=a.language, chunk_size=a.chunk_size)
    lang = res.get("language", a.language)
    del model
    gc.collect()
    torch.cuda.empty_cache()

    aligned = True
    try:
        from whisperx.alignment import DEFAULT_ALIGN_MODELS_HF
        name = DEFAULT_ALIGN_MODELS_HF.get(lang)
        if name:  # HF-hosted aligner: fetch to a plain folder (no symlinks on Windows)
            am, meta = whisperx.load_align_model(language_code=lang, device=dev,
                                                 model_name=str(local_model(name, MODELS / name.replace("/", "__"))))
        else:     # torchaudio pipeline languages (en, fr, de, ...)
            am, meta = whisperx.load_align_model(language_code=lang, device=dev)
        res = whisperx.align(res["segments"], am, meta, audio, dev, return_char_alignments=False,
                             interpolate_method="nearest")
        del am
        gc.collect()
        torch.cuda.empty_cache()
    except Exception as ex:
        aligned = False
        log(f"speech: no alignment model for '{lang}' ({ex}); word times are segment-level estimates")

    diarized = False
    if a.diarize:
        tok = hf_token()
        if not tok:
            log("speech: --diarize asked but no Hugging Face token found; skipping speakers")
        else:
            try:
                from whisperx.diarize import DiarizationPipeline
                dp = DiarizationPipeline(token=tok, device=dev)
                kw = {k: v for k, v in (("min_speakers", a.min_speakers), ("max_speakers", a.max_speakers)) if v}
                ds = dp(audio, **kw)
                res = whisperx.assign_word_speakers(ds, res)
                diarized = True
            except Exception as ex:
                log(f"speech: diarization failed: {ex}")

    words, segs = [], []
    for s in res["segments"]:
        segs.append({"t_in": round(float(s.get("start", 0)), 3), "t_out": round(float(s.get("end", 0)), 3),
                     "text": s.get("text", "").strip(), "speaker": s.get("speaker", "SPEAKER_00")})
        for wd in s.get("words", []):
            if "start" not in wd:
                continue  # numbers/symbols the aligner could not place
            words.append({"w": wd["word"], "t_in": round(float(wd["start"]), 3), "t_out": round(float(wd["end"]), 3),
                          "score": round(float(wd.get("score", 0)), 3),
                          "speaker": wd.get("speaker", s.get("speaker", "SPEAKER_00"))})
    dur = (words[-1]["t_out"] - words[0]["t_in"]) if words else 0
    out = {"tool": f"WhisperX {a.model}", "language": lang, "aligned": aligned, "diarized": diarized,
           "source": src.name, "words": words, "segments": segs,
           "pace_wpm": round(len(words) / dur * 60, 1) if dur > 0 else None,
           "speakers": sorted({wd["speaker"] for wd in words})}
    w.save("words", out)
    lines = []
    for i, s in enumerate(segs, 1):
        lines += [str(i), f"{srt_time(s['t_in'])} --> {srt_time(s['t_out'])}", s["text"], ""]
    (w.root / "words.srt").write_text("\n".join(lines), encoding="utf-8")
    log(f"speech: {len(words)} words, lang={lang}, aligned={aligned}, diarized={diarized}, pace={out['pace_wpm']} wpm")


if __name__ == "__main__":
    main()
