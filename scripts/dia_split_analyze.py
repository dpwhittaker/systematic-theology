"""
Diagnostic: split a Dia-generated 8-line audio into 8 utterances by silence
detection, then measure each utterance's fundamental frequency (F0) to
classify as male/female.

Runs on the existing test_4voice_dia.wav (4 stitched pairs, 8 utterances).
"""
import sys
import numpy as np
import soundfile as sf

IN_PATH = "/home/david/projects/systematic-theology/test_4voice_dia.wav"

audio, sr = sf.read(IN_PATH)
if audio.ndim > 1:
    audio = audio.mean(axis=1)
audio = audio.astype(np.float32)
print(f"loaded {IN_PATH}: {len(audio)/sr:.2f}s @ {sr}Hz")

# Energy envelope (50ms RMS windows, 10ms hop)
win = int(0.050 * sr)
hop = int(0.010 * sr)
n_frames = 1 + (len(audio) - win) // hop
rms = np.array([
    np.sqrt(np.mean(audio[i*hop:i*hop+win]**2))
    for i in range(n_frames)
])
# Silence threshold: 15% of median non-silent energy
nz = rms[rms > 1e-5]
if len(nz) == 0:
    print("audio is silent, bailing")
    sys.exit(1)
thresh = np.percentile(nz, 30) * 0.3
print(f"silence threshold = {thresh:.5f} (30th pct non-silent RMS * 0.3)")

# Find contiguous voiced regions, requiring >=200ms gap to split
voiced = rms > thresh
gap_frames_required = int(0.200 / 0.010)  # 200ms
segments = []
i = 0
while i < len(voiced):
    if voiced[i]:
        start = i
        # extend while voiced OR gap < threshold
        j = i + 1
        gap = 0
        while j < len(voiced):
            if voiced[j]:
                gap = 0
            else:
                gap += 1
                if gap >= gap_frames_required:
                    break
            j += 1
        end = j - gap
        seg_start_s = start * 0.010
        seg_end_s = end * 0.010
        if seg_end_s - seg_start_s >= 0.3:  # ignore very short blips
            segments.append((seg_start_s, seg_end_s))
        i = j
    else:
        i += 1

print(f"\nfound {len(segments)} segments (expecting 8 for our 8-line script):")

# F0 estimation via autocorrelation — simple voiced F0
def estimate_f0(sig, sr):
    """Autocorrelation-based F0 estimate for a signal. Returns F0 in Hz."""
    if len(sig) < sr // 40:  # <25ms
        return 0.0
    # Bandpass-ish: remove DC, simple highpass
    sig = sig - sig.mean()
    # Autocorrelate
    corr = np.correlate(sig, sig, mode='full')[len(sig)-1:]
    # Look for peak in lag range 60-400 Hz
    min_lag = sr // 400
    max_lag = sr // 60
    if max_lag >= len(corr):
        return 0.0
    peak_lag = min_lag + np.argmax(corr[min_lag:max_lag])
    if corr[peak_lag] < 0.3 * corr[0]:  # weak peak => unvoiced
        return 0.0
    return sr / peak_lag

for i, (start, end) in enumerate(segments):
    seg_audio = audio[int(start*sr):int(end*sr)]
    # Get median F0 over 50ms windows
    win_sz = int(0.050 * sr)
    hop_sz = int(0.025 * sr)
    f0s = []
    for k in range(0, len(seg_audio) - win_sz, hop_sz):
        f0 = estimate_f0(seg_audio[k:k+win_sz], sr)
        if f0 > 0:
            f0s.append(f0)
    median_f0 = float(np.median(f0s)) if f0s else 0.0
    # Classification heuristic: <165 Hz = male, >165 Hz = female, 0 = unknown
    if median_f0 == 0:
        gender = "?"
    elif median_f0 < 165:
        gender = "M"
    elif median_f0 > 180:
        gender = "F"
    else:
        gender = "M/F borderline"
    print(f"  seg {i+1:2d}: {start:6.2f}s → {end:6.2f}s  ({end-start:5.2f}s)  F0={median_f0:6.1f}Hz  [{gender}]")
