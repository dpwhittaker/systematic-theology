"""
Time-stretch a wav without changing pitch (librosa phase vocoder).

Usage:
    python3 stretch_wav.py INPUT.wav OUTPUT.wav RATE
        RATE < 1.0  = slower  (e.g. 0.88 = ~13% slower)
        RATE > 1.0  = faster  (e.g. 1.10 = ~10% faster)

Preserves sample rate and bit depth (writes PCM_16).
"""
import sys
import numpy as np
import soundfile as sf
import librosa

if len(sys.argv) != 4:
    print(__doc__)
    sys.exit(1)

src, dst, rate = sys.argv[1], sys.argv[2], float(sys.argv[3])
audio, sr = sf.read(src)
if audio.ndim > 1:
    audio = audio.mean(axis=1)
audio = audio.astype(np.float32)
print(f"in  : {len(audio)/sr:.2f}s @ {sr}Hz, rate={rate}")
stretched = librosa.effects.time_stretch(audio, rate=rate)
sf.write(dst, stretched, sr, subtype="PCM_16")
print(f"out : {len(stretched)/sr:.2f}s -> {dst}")
