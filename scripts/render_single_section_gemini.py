"""Render a single section's audio via Gemini TTS (multi-speaker).

Reads JSON from stdin:
{
  "dialogue": [{"speaker": "CREED", "text": "Hello..."}, ...],
  "speakers": {
    "CREED": {"voice": "Charon", "profile": "65-year-old Southern Baptist..."},
    "CARRIE": {"voice": "Aoede", "profile": "Brilliant Black woman in her 40s..."}
  },
  "scene": "A professional recording studio...",
  "director": "Speaker 1: ...",
  "output": "/path/to/output.wav"
}
"""

import base64
import json
import os
import re
import struct
import sys
import requests

API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-2.5-flash-preview-tts"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

STAGE_DIRS = re.compile(r'\[.*?\]\s*')


def strip_markup(text):
    """Strip stage directions and markdown emphasis from dialogue text."""
    text = STAGE_DIRS.sub('', text).strip()
    text = text.replace('*', '')
    return text


def render(data):
    dialogue = data["dialogue"]
    speakers = data["speakers"]
    scene = data.get("scene", "")
    director = data.get("director", "")
    output = data["output"]

    if not API_KEY:
        print("ERROR: GEMINI_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    # Build transcript
    transcript_lines = []
    for line in dialogue:
        speaker = line["speaker"]
        text = strip_markup(line["text"])
        if not text:
            continue
        info = speakers.get(speaker)
        if not info:
            continue
        transcript_lines.append(f"{speaker}: {text}")

    if not transcript_lines:
        print("ERROR: No valid dialogue lines", file=sys.stderr)
        sys.exit(1)

    transcript = "\n\n".join(transcript_lines)

    # Build audio profile
    profiles = "# AUDIO PROFILE\n\n"
    for name, info in speakers.items():
        profiles += f"## {name}\n{info['profile']}\n\n"

    # Build full prompt
    prompt_parts = [profiles]
    if scene:
        prompt_parts.append(f"# SCENE\n\n{scene}")
    if director:
        prompt_parts.append(f"# DIRECTOR'S NOTES\n\n{director}")
    prompt_parts.append(f"# TRANSCRIPT\n\n{transcript}")

    full_prompt = "\n\n---\n\n".join(prompt_parts)

    # Build speaker voice configs
    speaker_configs = []
    for name, info in speakers.items():
        speaker_configs.append({
            "speaker": name,
            "voiceConfig": {
                "prebuiltVoiceConfig": {
                    "voiceName": info["voice"]
                }
            }
        })

    payload = {
        "contents": [{
            "parts": [{"text": full_prompt}]
        }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "multiSpeakerVoiceConfig": {
                    "speakerVoiceConfigs": speaker_configs
                }
            }
        }
    }

    print(f"  Sending {len(transcript_lines)} lines to Gemini TTS ({MODEL})")
    resp = requests.post(
        f"{API_URL}?key={API_KEY}",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=300,
    )

    if resp.status_code != 200:
        print(f"ERROR {resp.status_code}: {resp.text[:500]}", file=sys.stderr)
        sys.exit(1)

    result = resp.json()

    # Extract audio
    for candidate in result.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "inlineData" in part:
                mime = part["inlineData"].get("mimeType", "")
                audio_bytes = base64.b64decode(part["inlineData"]["data"])
                print(f"  MIME: {mime}, raw size: {len(audio_bytes)} bytes")

                # If raw PCM (audio/L16 or no WAV header), wrap in WAV
                if not audio_bytes[:4] == b'RIFF':
                    # Gemini returns 24kHz 16-bit mono PCM
                    sample_rate = 24000
                    channels = 1
                    bits = 16
                    data_size = len(audio_bytes)
                    header = struct.pack(
                        '<4sI4s4sIHHIIHH4sI',
                        b'RIFF', 36 + data_size, b'WAVE',
                        b'fmt ', 16, 1, channels,
                        sample_rate, sample_rate * channels * bits // 8,
                        channels * bits // 8, bits,
                        b'data', data_size,
                    )
                    audio_bytes = header + audio_bytes

                with open(output, "wb") as f:
                    f.write(audio_bytes)
                print(f"  Saved {output} ({len(audio_bytes)} bytes)")
                return

    print(f"ERROR: No audio in response: {json.dumps(result)[:300]}", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    data = json.loads(sys.stdin.read())
    render(data)
