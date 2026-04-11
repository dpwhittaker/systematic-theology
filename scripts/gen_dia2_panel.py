"""
Dia2-2B 4-speaker panel with per-speaker voice conditioning.

Strategy:
- Same 4-pair structure as Dia1 cloned version, but using Dia2's native
  prefix_speaker_1 / prefix_speaker_2 for voice conditioning.
- Pair 1 & 3 (Frank→Carter): prefix S1=Frank.wav, S2=Carter.wav
- Pair 2 & 4 (Jenny→Maya): prefix S1=Jenny.wav, S2=Maya.wav
- Dia2 auto-transcribes prefix audio via whisper-large-v3 (first run downloads ~3GB).
- Returns word-level timestamps for precise cutting.

Prefix wavs are trimmed to ~10s on disk to stay within Dia2's 1500-step context.

Output: /home/david/projects/systematic-theology/test_4voice_dia2.wav
"""
import sys, os, time
sys.path.insert(0, "/home/david/dia2")

import numpy as np
import soundfile as sf

# Trim reference wavs to 10s copies (Dia2 takes file paths, not tensors)
VOICES_DIR = "/home/david/VibeVoice-community/demo/voices"
TMP_DIR = "/tmp/dia2_panel"
os.makedirs(TMP_DIR, exist_ok=True)

REF_MAX_SEC = 10.0
REFS = {
    "Frank": os.path.join(VOICES_DIR, "en-Frank_man.wav"),
    "Carter": os.path.join(VOICES_DIR, "en-Carter_man.wav"),
    "Jenny": os.path.join(VOICES_DIR, "en-Jenny_woman.wav"),
    "Maya": os.path.join(VOICES_DIR, "en-Maya_woman.wav"),
}

# Create trimmed copies
trimmed = {}
for name, path in REFS.items():
    out_path = os.path.join(TMP_DIR, f"{name}_10s.wav")
    audio, sr = sf.read(path)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    max_samples = int(REF_MAX_SEC * sr)
    if len(audio) > max_samples:
        audio = audio[:max_samples]
    sf.write(out_path, audio, sr)
    trimmed[name] = out_path
    print(f"  ref {name}: {len(audio)/sr:.1f}s @ {sr}Hz -> {out_path}", flush=True)

# Script lines — same as test_4voice_script_v3
SCRIPT = [
    ("Frank",  "Paul spent his entire ministry rereading the Hebrew scriptures through the lens of Christ."),
    ("Carter", "It's a fascinating topic. The apostles didn't abandon the Old Testament. They reread it through the lens of Jesus' death and resurrection."),
    ("Jenny",  "Absolutely. And what strikes me is how the Spirit guided that process. Peter at Pentecost quotes Joel and the Psalms, and suddenly those ancient words come alive with new meaning."),
    ("Maya",   "Can I jump in here? As someone sitting in the pews, I've always wondered, did the early believers see themselves as starting something brand new, or continuing an old story?"),
    ("Frank",  "That's exactly the right question. Paul argues in Romans that the gospel was promised beforehand through the prophets. It's continuation, not replacement."),
    ("Carter", "And yet there's genuine newness. The inclusion of the Gentiles, the indwelling of the Spirit, these weren't just footnotes. They transformed the community's identity."),
    ("Jenny",  "That tension between old and new is where the Spirit does His best work. He doesn't erase the past. He illuminates it."),
    ("Maya",   "I love that. It's like reading a mystery novel for the second time. You see all the clues you missed before."),
]

pairs = [SCRIPT[i:i+2] for i in range(0, 8, 2)]

# Pair config: which prefix wavs to use
PAIR_CONFIG = [
    ("MM", trimmed["Frank"], trimmed["Carter"]),   # pair 1
    ("FF", trimmed["Jenny"], trimmed["Maya"]),      # pair 2
    ("MM", trimmed["Frank"], trimmed["Carter"]),   # pair 3
    ("FF", trimmed["Jenny"], trimmed["Maya"]),      # pair 4
]

# Load Dia2
from dia2 import Dia2, GenerationConfig, SamplingConfig

print("\nLoading Dia2-2B...", flush=True)
t0 = time.time()
dia = Dia2.from_repo("nari-labs/Dia2-2B", device="cuda", dtype="bfloat16")
print(f"  loaded in {time.time()-t0:.1f}s", flush=True)

config = GenerationConfig(
    cfg_scale=6.0,
    audio=SamplingConfig(temperature=0.8, top_k=50),
)

OUT_PATH = "/home/david/projects/systematic-theology/test_4voice_dia2.wav"
results = []
all_timestamps = []

for i, (pair, (tag, s1_ref, s2_ref)) in enumerate(zip(pairs, PAIR_CONFIG), 1):
    target = f"[S1] {pair[0][1]} [S2] {pair[1][1]}"
    print(f"\nPair {i} [{tag}] {pair[0][0]}->{pair[1][0]}", flush=True)
    print(f"  text: {target[:100]}...", flush=True)
    t0 = time.time()
    result = dia.generate(
        target,
        config=config,
        prefix_speaker_1=s1_ref,
        prefix_speaker_2=s2_ref,
        verbose=True,
    )
    dur = result.waveform.shape[-1] / result.sample_rate
    print(f"  generated in {time.time()-t0:.1f}s, {dur:.2f}s audio", flush=True)
    print(f"  timestamps: {result.timestamps[:6]}...", flush=True)
    wav_np = result.waveform.squeeze().cpu().numpy()
    results.append((wav_np, result.sample_rate))
    all_timestamps.append(result.timestamps)

# Concatenate with 250ms silence
sr = results[0][1]
silence = np.zeros(int(0.25 * sr), dtype=np.float32)
segments = []
for i, (wav, _) in enumerate(results):
    segments.append(wav.astype(np.float32))
    if i < len(results) - 1:
        segments.append(silence)
full = np.concatenate(segments)

sf.write(OUT_PATH, full, sr, subtype="PCM_16")
total_dur = len(full) / sr
print(f"\nSaved {OUT_PATH} ({total_dur:.2f}s total)", flush=True)

# Print all timestamps
for i, ts in enumerate(all_timestamps, 1):
    print(f"\nPair {i} timestamps:", flush=True)
    for word, t in ts:
        print(f"  {t:6.2f}s  {word}", flush=True)
