"""
Download LibriTTS-R train-clean-360 subset via HuggingFace datasets.
LibriTTS-R is the TTS-specific derivative of LibriVox recordings — clean,
segmented, 24kHz, multi-speaker with many female narrators. Perfect source
for VibeVoice voice prompts.

train-clean-100: ~5 GB, ~247 speakers
train-clean-360: ~18 GB, ~904 speakers  <- chosen for variety
"""
import os
import sys
import time

CACHE_DIR = '/home/david/datasets/libritts_r'
os.makedirs(CACHE_DIR, exist_ok=True)

from datasets import load_dataset

start = time.time()
print(f'[{time.strftime("%H:%M:%S")}] begin libritts-r train.clean.360 download')
sys.stdout.flush()

ds = load_dataset(
    'mythicinfinity/libritts_r',
    'clean',
    split='train.clean.360',
    cache_dir=CACHE_DIR,
)

print(f'[{time.strftime("%H:%M:%S")}] download complete in {time.time()-start:.0f}s')
print(f'num rows: {len(ds)}')
print(f'columns: {ds.column_names}')
print(f'cache dir: {CACHE_DIR}')
