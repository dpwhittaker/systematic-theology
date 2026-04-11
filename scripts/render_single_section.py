"""Render a single section's audio via ElevenLabs text-to-dialogue API.

Reads JSON from stdin:
{
  "dialogue": [{"speaker": "HOST", "text": "Hello..."}, ...],
  "voices": {"HOST": "voice_id", "WRIGHT": "voice_id", ...},
  "output": "/path/to/output.mp3"
}
"""

import json
import os
import re
import subprocess
import sys
import requests

API_KEY = os.environ.get("EL_API_KEY", "")
API_URL = "https://api.elevenlabs.io/v1/text-to-dialogue"
STAGE_DIRS = re.compile(r'\[.*?\]\s*')


def strip_markup(text):
    """Strip stage directions and markdown emphasis from dialogue text."""
    text = STAGE_DIRS.sub('', text).strip()
    text = text.replace('*', '')
    return text


def render(data):
    dialogue = data["dialogue"]
    voices = data["voices"]
    output = data["output"]

    if not API_KEY:
        print("ERROR: EL_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    # Build inputs (max 10 per batch)
    inputs = []
    for line in dialogue:
        speaker = line["speaker"]
        text = strip_markup(line["text"])
        voice_id = voices.get(speaker)
        if not voice_id or not text:
            continue
        inputs.append({"text": text, "voice_id": voice_id})

    if not inputs:
        print("ERROR: No valid dialogue lines", file=sys.stderr)
        sys.exit(1)

    # Batch into chunks of 10
    batches = [inputs[i:i+10] for i in range(0, len(inputs), 10)]
    part_files = []

    for batch_idx, batch in enumerate(batches):
        payload = {
            "inputs": batch,
            "model_id": "eleven_v3",
            "settings": {"stability": 0.1},
        }
        print(f"  Batch {batch_idx+1}/{len(batches)}: {len(batch)} lines")
        resp = requests.post(
            API_URL,
            headers={"xi-api-key": API_KEY, "Content-Type": "application/json"},
            json=payload,
            timeout=120,
        )
        if resp.status_code != 200:
            print(f"ERROR {resp.status_code}: {resp.text[:300]}", file=sys.stderr)
            sys.exit(1)

        if len(batches) == 1:
            with open(output, "wb") as f:
                f.write(resp.content)
            print(f"  Saved {output} ({len(resp.content)} bytes)")
            return

        part_path = output + f".part{batch_idx+1}.mp3"
        with open(part_path, "wb") as f:
            f.write(resp.content)
        part_files.append(part_path)

    # Concatenate parts with ffmpeg
    if len(part_files) > 1:
        list_file = output + ".list"
        with open(list_file, "w") as f:
            for p in part_files:
                f.write(f"file '{p}'\n")
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file, "-c", "copy", output],
            capture_output=True,
        )
        os.remove(list_file)
        for p in part_files:
            os.remove(p)
        print(f"  Concatenated -> {output}")


if __name__ == "__main__":
    data = json.loads(sys.stdin.read())
    render(data)
