"""
Dia 4-speaker panel WITH voice cloning.

Strategy:
- Dia is natively 2-speaker ([S1]/[S2]). We need 4 voices (Frank, Carter, Alice/Jenny, Maya).
- The 8-line script alternates M/M/F/F/M/M/F/F, so grouping as 4 pairs gives:
    pair 1: Frank(S1) -> Carter(S2)    [MM]
    pair 2: Jenny(S1) -> Maya(S2)      [FF]
    pair 3: Frank(S1) -> Carter(S2)    [MM]
    pair 4: Jenny(S1) -> Maya(S2)      [FF]
- Build two Dia voice prompts by concatenating the VibeVoice reference wavs:
    MM prompt = Frank.wav + Carter.wav  (labeled as [S1] text [S2] text)
    FF prompt = Jenny.wav + Maya.wav
- Use Whisper (transformers pipeline) to transcribe the 4 refs once so we can build
  clone_from_text accurately.
- Bypass Dia's torchaudio.load path (which pulls torchcodec on torch 2.11) by loading
  wavs with soundfile, resampling with torchaudio.functional.resample (pure-torch, no
  torchcodec), then calling model._encode() directly to get the DAC tensor.

Output: /home/david/projects/systematic-theology/test_4voice_dia_cloned.wav
"""
import os
import time
import numpy as np
import soundfile as sf
import torch
import torchaudio

from dia.model import Dia, DEFAULT_SAMPLE_RATE  # 44100

OUT_PATH = "/home/david/projects/systematic-theology/test_4voice_dia_cloned.wav"
VOICES_DIR = "/home/david/VibeVoice-community/demo/voices"
CACHE_DIR = "/tmp/dia_cloned_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

REFS = {
    "Frank": os.path.join(VOICES_DIR, "en-Frank_man.wav"),
    "Carter": os.path.join(VOICES_DIR, "en-Carter_man.wav"),
    "Jenny": os.path.join(VOICES_DIR, "en-Jenny_woman.wav"),
    "Maya": os.path.join(VOICES_DIR, "en-Maya_woman.wav"),
}

# Dia's state buffer is sized from config.data.audio_length (~3072 tokens ≈ 35s
# at the DAC frame rate). The audio prompt plus generated audio must fit. We
# cap each individual reference at REF_MAX_SEC so a pair ref stays well under
# the budget and leaves room for the target generation.
REF_MAX_SEC = 10.0

# 8 lines, same script as test_4voice_script_v3 (in-media-res opener).
# Speaker labels track the four panelists; we'll re-label per pair.
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

# Group into 4 pairs of (speaker_name, text)
pairs = [SCRIPT[i:i+2] for i in range(0, 8, 2)]

# ---------------------------------------------------------------------------
# Step 1: Whisper-transcribe the 4 reference wavs (cached to JSON).
# ---------------------------------------------------------------------------
import json
TRANS_CACHE = os.path.join(CACHE_DIR, "transcripts.json")
if os.path.exists(TRANS_CACHE):
    print(f"[transcripts] loading cache {TRANS_CACHE}")
    with open(TRANS_CACHE) as f:
        transcripts = json.load(f)
else:
    print("[transcripts] running Whisper on reference wavs...")
    from transformers import pipeline
    asr = pipeline(
        "automatic-speech-recognition",
        model="openai/whisper-base.en",
        device=0,
        torch_dtype=torch.float16,
    )
    transcripts = {}
    for name, path in REFS.items():
        t0 = time.time()
        # Load via soundfile to avoid ffmpeg dep inside pipeline
        audio_np, sr = sf.read(path)
        if audio_np.ndim > 1:
            audio_np = audio_np.mean(axis=1)
        audio_np = audio_np.astype(np.float32)
        # Trim to REF_MAX_SEC so transcript matches what Dia will actually see
        max_samples = int(REF_MAX_SEC * sr)
        if len(audio_np) > max_samples:
            audio_np = audio_np[:max_samples]
        result = asr({"array": audio_np, "sampling_rate": sr})
        text = result["text"].strip()
        transcripts[name] = text
        print(f"  {name}: {time.time()-t0:.1f}s -> {text[:80]}...")
    with open(TRANS_CACHE, "w") as f:
        json.dump(transcripts, f, indent=2)
    del asr
    torch.cuda.empty_cache()

for name, text in transcripts.items():
    print(f"  [{name}] {text[:100]}")

# ---------------------------------------------------------------------------
# Step 2: Load Dia.
# ---------------------------------------------------------------------------
print("\n[dia] loading Dia-1.6B fp16...")
t0 = time.time()
model = Dia.from_pretrained("nari-labs/Dia-1.6B", compute_dtype="float16")
print(f"  loaded in {time.time()-t0:.1f}s")
device = model.device

# ---------------------------------------------------------------------------
# Step 3: Safe audio loading (replaces torchaudio.load -> torchcodec path).
# ---------------------------------------------------------------------------
def load_wav_to_44k_mono_tensor(path, max_sec=None):
    """sf.read + pure-torch resample. Returns [1, T] float32 tensor at 44100 Hz."""
    audio, sr = sf.read(path)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if max_sec is not None:
        max_samples = int(max_sec * sr)
        if len(audio) > max_samples:
            audio = audio[:max_samples]
    audio = torch.from_numpy(audio.astype(np.float32)).unsqueeze(0)  # [1, T]
    if sr != DEFAULT_SAMPLE_RATE:
        audio = torchaudio.functional.resample(audio, sr, DEFAULT_SAMPLE_RATE)
    return audio

def encode_ref(path):
    """Load + resample + DAC-encode a reference wav."""
    audio = load_wav_to_44k_mono_tensor(path).to(device)
    return model._encode(audio)  # [T_enc, C]

# ---------------------------------------------------------------------------
# Step 4: Build MM and FF reference tensors + clone texts.
#
# Dia's voice_clone pattern: clone_from_text + target_text as one string,
# audio_prompt = encoded ref audio. Dia keeps the voice identities for the
# target portion.
# ---------------------------------------------------------------------------
def concat_wavs(paths):
    """Concat multiple wavs at 44.1kHz with 200ms silence between. Each ref trimmed to REF_MAX_SEC."""
    sil = torch.zeros(1, int(0.2 * DEFAULT_SAMPLE_RATE), dtype=torch.float32)
    parts = []
    for i, p in enumerate(paths):
        parts.append(load_wav_to_44k_mono_tensor(p, max_sec=REF_MAX_SEC))
        if i < len(paths) - 1:
            parts.append(sil)
    return torch.cat(parts, dim=1)

def encode_concat(paths):
    audio = concat_wavs(paths).to(device)
    return model._encode(audio)

print("\n[refs] encoding MM (Frank+Carter) and FF (Jenny+Maya) references...")
mm_ref = encode_concat([REFS["Frank"], REFS["Carter"]])
ff_ref = encode_concat([REFS["Jenny"], REFS["Maya"]])
print(f"  MM: {mm_ref.shape}  FF: {ff_ref.shape}")

mm_clone_text = f"[S1] {transcripts['Frank']} [S2] {transcripts['Carter']}"
ff_clone_text = f"[S1] {transcripts['Jenny']} [S2] {transcripts['Maya']}"

# ---------------------------------------------------------------------------
# Step 5: Generate the 4 pairs.
# ---------------------------------------------------------------------------
def pair_to_target_text(pair):
    # pair is [(name, text), (name, text)]; name is cosmetic, positional S1/S2
    return f"[S1] {pair[0][1]} [S2] {pair[1][1]}"

PAIR_REFS = [
    ("MM", mm_clone_text, mm_ref),  # Frank+Carter
    ("FF", ff_clone_text, ff_ref),  # Jenny+Maya
    ("MM", mm_clone_text, mm_ref),  # Frank+Carter
    ("FF", ff_clone_text, ff_ref),  # Jenny+Maya
]

results = []
for i, (pair, (tag, clone_text, ref_tensor)) in enumerate(zip(pairs, PAIR_REFS), 1):
    target_text = pair_to_target_text(pair)
    full_text = clone_text + " " + target_text
    print(f"\nPair {i} [{tag}] {pair[0][0]}->{pair[1][0]}")
    print(f"  target: {target_text[:100]}...")
    t0 = time.time()
    audio = model.generate(
        full_text,
        audio_prompt=ref_tensor,
        use_torch_compile=False,  # dynamo chokes on variable-length audio prompt
        verbose=False,
    )
    dur = len(audio) / DEFAULT_SAMPLE_RATE
    print(f"  generated in {time.time()-t0:.1f}s, {dur:.2f}s audio")
    results.append(np.asarray(audio, dtype=np.float32))

# ---------------------------------------------------------------------------
# Step 6: Concatenate with 250ms silence between pairs and save.
# ---------------------------------------------------------------------------
silence = np.zeros(int(0.25 * DEFAULT_SAMPLE_RATE), dtype=np.float32)
segments = []
for i, a in enumerate(results):
    segments.append(a)
    if i < len(results) - 1:
        segments.append(silence)
full = np.concatenate(segments)

sf.write(OUT_PATH, full, DEFAULT_SAMPLE_RATE, subtype="PCM_16")
total_dur = len(full) / DEFAULT_SAMPLE_RATE
print(f"\nSaved {OUT_PATH} ({total_dur:.2f}s total)")
