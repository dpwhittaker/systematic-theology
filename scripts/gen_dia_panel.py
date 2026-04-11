"""
Stitched 4-speaker panel using Dia (2-speaker model).

Strategy:
- 8 lines split into 4 alternating pairs (all generated cold, no voice cloning).
- Each pair is a natural 2-speaker [S1][S2] exchange — Dia's native format.
- Voices will vary across pairs (Dia picks random voices per generation), but
  within each pair the [S1]/[S2] identity is stable. Primary goal here is to
  A/B the *conversational vibe* against VibeVoice — voice-identity consistency
  across pairs can be solved later with a cleaner audio-prompting path.
- Concatenate at 44.1 kHz with a ~250 ms silence between pairs.

Output: /home/david/projects/systematic-theology/test_4voice_dia.wav
"""
import os
import time
import numpy as np
import soundfile as sf
import torch

from dia.model import Dia, DEFAULT_SAMPLE_RATE

OUT_PATH = "/home/david/projects/systematic-theology/test_4voice_dia.wav"
TMP_DIR = "/tmp/dia_panel"
os.makedirs(TMP_DIR, exist_ok=True)

# 8 lines, same as test_4voice_script_v3.txt (in-media-res opener)
LINES = [
    ("S1", "Paul spent his entire ministry rereading the Hebrew scriptures through the lens of Christ."),
    ("S2", "It's a fascinating topic. The apostles didn't abandon the Old Testament. They reread it through the lens of Jesus' death and resurrection."),
    ("S1", "Absolutely. And what strikes me is how the Spirit guided that process. Peter at Pentecost quotes Joel and the Psalms, and suddenly those ancient words come alive with new meaning."),
    ("S2", "Can I jump in here? As someone sitting in the pews, I've always wondered, did the early believers see themselves as starting something brand new, or continuing an old story?"),
    ("S1", "That's exactly the right question. Paul argues in Romans that the gospel was promised beforehand through the prophets. It's continuation, not replacement."),
    ("S2", "And yet there's genuine newness. The inclusion of the Gentiles, the indwelling of the Spirit, these weren't just footnotes. They transformed the community's identity."),
    ("S1", "That tension between old and new is where the Spirit does His best work. He doesn't erase the past. He illuminates it."),
    ("S2", "I love that. It's like reading a mystery novel for the second time. You see all the clues you missed before."),
]

# Group into 4 pairs of (2 lines each)
pairs = [LINES[i:i+2] for i in range(0, 8, 2)]

def pair_to_text(pair):
    return " ".join(f"[{tag}] {text}" for tag, text in pair)

print("Loading Dia-1.6B (float16)...")
t0 = time.time()
model = Dia.from_pretrained("nari-labs/Dia-1.6B", compute_dtype="float16")
print(f"  loaded in {time.time()-t0:.1f}s")

results = []
for i, pair in enumerate(pairs, 1):
    text = pair_to_text(pair)
    print(f"\nPair {i} (cold)")
    print("  text:", text[:120], "...")
    t0 = time.time()
    audio = model.generate(text, use_torch_compile=True, verbose=False)
    print(f"  generated in {time.time()-t0:.1f}s, {len(audio)/DEFAULT_SAMPLE_RATE:.2f}s audio")
    results.append(audio)

# Concatenate with silence between pairs
silence = np.zeros(int(0.25 * DEFAULT_SAMPLE_RATE), dtype=np.float32)
segments = []
for i, a in enumerate(results):
    a = np.asarray(a, dtype=np.float32)
    segments.append(a)
    if i < len(results) - 1:
        segments.append(silence)
full = np.concatenate(segments)

sf.write(OUT_PATH, full, DEFAULT_SAMPLE_RATE, subtype="PCM_16")
total_dur = len(full) / DEFAULT_SAMPLE_RATE
print(f"\nSaved {OUT_PATH} ({total_dur:.2f}s total)")
