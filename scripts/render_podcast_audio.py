"""Render full podcast audio via ElevenLabs text-to-dialogue API.

Parses the storyboard markdown, extracts dialogue lines per section,
batches them (max 10 per API call), and concatenates into section MP3s.
"""

import requests
import os
import re
import subprocess
import sys

API_KEY = os.environ["EL_API_KEY"]
API_URL = "https://api.elevenlabs.io/v1/text-to-dialogue"

VOICES = {
    "WRIGHT":  "JBFqnCBsd6RMkjVDRZzb",
    "CREED":   "IKne3meq5aSn9XLyUdCD",
    "CARRIE":  "EXAVITQu4vr4xnSDxMaL",
    "HOST":    "cgSgspJ2msm6clMCkdW9",
}

STORYBOARD = "/home/david/projects/systematic-theology/storyboards/baptism-in-the-spirit-podcast.md"
OUT_DIR = "/home/david/projects/systematic-theology/storyboards/audio"
os.makedirs(OUT_DIR, exist_ok=True)

# Stage direction patterns to strip from TTS text
STAGE_DIRS = re.compile(r'\[.*?\]\s*')


def parse_sections(path):
    """Parse storyboard into sections, each with a list of (speaker, text) tuples."""
    with open(path) as f:
        content = f.read()

    sections = []
    current_name = None
    current_lines = []

    for line in content.split("\n"):
        # Section header
        m = re.match(r'^## (.+)', line)
        if m:
            if current_name and current_lines:
                sections.append((current_name, current_lines))
            current_name = m.group(1).strip()
            current_lines = []
            continue

        # Skip slide callouts, images, horizontal rules, metadata
        if line.startswith("> [!slide]") or line.startswith("> **") or line.startswith("![") or line.startswith("---") or line.startswith("<!--") or line.startswith("|"):
            continue

        # Dialogue line
        m = re.match(r'^\*\*(\w+):\*\*\s*(.+)', line)
        if m:
            speaker = m.group(1)
            text = m.group(2).strip()
            # Strip stage directions
            text = STAGE_DIRS.sub('', text).strip()
            # Strip markdown emphasis
            text = text.replace('*', '')
            if speaker in VOICES and text:
                current_lines.append((speaker, text))

    if current_name and current_lines:
        sections.append((current_name, current_lines))

    return sections


def render_batch(inputs, out_path):
    """Call text-to-dialogue API and save MP3."""
    payload = {
        "inputs": [{"text": text, "voice_id": VOICES[spk]} for spk, text in inputs],
        "model_id": "eleven_v3",
    }
    resp = requests.post(
        API_URL,
        headers={"xi-api-key": API_KEY, "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    if resp.status_code != 200:
        print(f"  ERROR {resp.status_code}: {resp.text[:300]}")
        return False
    with open(out_path, "wb") as f:
        f.write(resp.content)
    print(f"  Saved {out_path} ({len(resp.content)} bytes)")
    return True


def concat_mp3s(parts, out_path):
    """Concatenate MP3 files using ffmpeg."""
    if len(parts) == 1:
        os.rename(parts[0], out_path)
        return
    list_file = out_path + ".list"
    with open(list_file, "w") as f:
        for p in parts:
            f.write(f"file '{p}'\n")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file, "-c", "copy", out_path],
        capture_output=True,
    )
    os.remove(list_file)
    for p in parts:
        os.remove(p)


def main():
    sections = parse_sections(STORYBOARD)
    print(f"Parsed {len(sections)} sections:\n")
    for name, lines in sections:
        print(f"  {name}: {len(lines)} lines")
    print()

    # Skip the Equilibrium Report section
    sections = [(n, l) for n, l in sections if "Equilibrium" not in n]

    for sec_idx, (name, lines) in enumerate(sections):
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        print(f"\n[{sec_idx+1}/{len(sections)}] {name} ({len(lines)} lines)")

        # Batch into chunks of 10
        batches = [lines[i:i+10] for i in range(0, len(lines), 10)]
        part_files = []

        for batch_idx, batch in enumerate(batches):
            suffix = f"_part{batch_idx+1}" if len(batches) > 1 else ""
            part_path = os.path.join(OUT_DIR, f"{sec_idx:02d}-{slug}{suffix}.mp3")
            print(f"  Batch {batch_idx+1}/{len(batches)}: {len(batch)} lines")
            ok = render_batch(batch, part_path)
            if ok:
                part_files.append(part_path)
            else:
                print(f"  FAILED — skipping section")
                break

        # Concatenate if multiple batches
        if len(part_files) > 1:
            final_path = os.path.join(OUT_DIR, f"{sec_idx:02d}-{slug}.mp3")
            concat_mp3s(part_files, final_path)
            print(f"  Concatenated -> {final_path}")
        elif len(part_files) == 1 and len(batches) > 1:
            # Rename if we had batches but only one succeeded
            final_path = os.path.join(OUT_DIR, f"{sec_idx:02d}-{slug}.mp3")
            os.rename(part_files[0], final_path)

    # Final concatenation of all section files
    all_files = sorted(f for f in os.listdir(OUT_DIR) if re.match(r'^\d{2}-', f) and not '_part' in f)
    if all_files:
        print(f"\nConcatenating {len(all_files)} sections into full podcast...")
        list_file = os.path.join(OUT_DIR, "full.list")
        with open(list_file, "w") as f:
            for fn in all_files:
                f.write(f"file '{os.path.join(OUT_DIR, fn)}'\n")
        full_path = os.path.join(OUT_DIR, "full-podcast.mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file, "-c", "copy", full_path],
            capture_output=True,
        )
        os.remove(list_file)
        size_mb = os.path.getsize(full_path) / (1024*1024)
        print(f"  Full podcast: {full_path} ({size_mb:.1f} MB)")

    print("\nDone!")


if __name__ == "__main__":
    main()
