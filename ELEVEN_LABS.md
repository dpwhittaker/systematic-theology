# ElevenLabs TTS Reference

API key: `$EL_API_KEY` (set in `~/.bashrc`). **Never commit the key.**

## Text-to-Dialogue API

This is the primary endpoint for our 4-speaker panel. Generates a single audio file from a sequence of speaker turns.

### Endpoint

```
POST https://api.elevenlabs.io/v1/text-to-dialogue
POST https://api.elevenlabs.io/v1/text-to-dialogue/stream   (SSE streaming)
```

Auth header: `xi-api-key: $EL_API_KEY`

### Request Format

```json
{
  "inputs": [
    { "text": "First speaker's line.", "voice_id": "JBFqnCBsd6RMkjVDRZzb" },
    { "text": "Second speaker responds.", "voice_id": "pNInz6obpgDQGcFmaJgB" },
    { "text": "[laughs] Third speaker jumps in.", "voice_id": "abc123" }
  ],
  "model_id": "eleven_v3",
  "language_code": "en",
  "settings": {
    "stability": 0.5
  },
  "seed": 42,
  "apply_text_normalization": "auto"
}
```

**Key constraints:**
- `model_id` must be `eleven_v3` — dialogue is v3 exclusive
- Max **10 unique voice IDs** per request
- No limit on number of turns (entries in `inputs` array)
- **5,000 character limit** on v3 (~5 min of audio per request)
- Only `settings.stability` is exposed for dialogue (not similarity_boost, style, speed)
- Array order = dialogue order

### Response

- `200`: `application/octet-stream` (binary audio)
- `422`: validation error
- Response headers: `x-character-count` (credit cost), `request-id`

### Timestamps Variant

```
POST /v1/text-to-dialogue (with convert_with_timestamps SDK method)
```

Returns structured response with audio + character-level timing data. Useful for subtitle sync.

### Python SDK

```python
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ["EL_API_KEY"])

# Full dialogue
audio = client.text_to_dialogue.convert(
    inputs=[
        {"text": "Hello!", "voice_id": "voice_1"},
        {"text": "Hi there.", "voice_id": "voice_2"},
    ],
    model_id="eleven_v3",
    output_format="mp3_44100_128",
)
with open("dialogue.mp3", "wb") as f:
    f.write(audio)

# With timestamps (for subtitle sync)
result = client.text_to_dialogue.convert_with_timestamps(
    inputs=[...],
    model_id="eleven_v3",
)
```

Install: `pip install elevenlabs`

## Audio Tags (v3 only)

Square-bracket tags inserted directly in `text` fields. These do NOT work on v2 models. Feature is under active development — no official complete list exists; these are gathered from across the docs.

**Laughter / vocal reactions:**
`[laughs]`, `[laughs harder]`, `[starts laughing]`, `[wheezing]`, `[chuckles]`, `[giggling]`, `[snorts]`

**Breathing / throat:**
`[sighs]`, `[sigh]`, `[exhales]`, `[exhales sharply]`, `[inhales deeply]`, `[clears throat]`, `[swallows]`, `[gulps]`

**Speech style:**
`[whispers]`, `[whispering]`, `[muttering]`, `[crying]`, `[groaning]`

**Mood / tone modifiers:**
`[happy]`, `[sad]`, `[angry]`, `[excited]`, `[elated]`, `[appalled]`, `[annoyed]`, `[surprised]`, `[curious]`, `[sarcastic]`, `[mischievously]`, `[cautiously]`, `[cheerfully]`, `[thoughtful]`, `[indecisive]`, `[quizzically]`, `[jumping in]`

**Pacing:**
`[short pause]`, `[long pause]`, `[auctioneer]`

**Sound effects / environmental:**
`[applause]`, `[clapping]`, `[gunshot]`, `[explosion]`, `[leaves rustling]`, `[gentle footsteps]`

**Overall scene direction:**
`[football]`, `[wrestling match]`

**Experimental:**
`[strong X accent]` (replace X with accent), `[sings]`, `[woo]`, `[fart]`

**Usage rules:**
- Place immediately before or after the text they modify
- Match to voice character — a serious voice won't do `[giggles]` convincingly
- Physical actions (`[standing]`, `[pacing]`, `[grinning]`) don't work — vocal expression only
- Results vary per voice and are nondeterministic
- Tags appear to be free-form — the model interprets natural language in brackets, so unlisted tags like `[nervously]` or `[with conviction]` may work

## Text Formatting for Natural Speech

- **Ellipses (...)**: Add pauses, hesitation, weight
- **CAPITALIZATION**: Increases emphasis
- **Dashes (—, --)**: Short pauses, interruptions
- **Standard punctuation**: Commas, periods, question marks control rhythm naturally
- **No SSML on v3**: `<break>` tags only work on v2/v2.5, not v3. Use punctuation and audio tags instead.
- **Pre-normalize text**: Convert numbers, abbreviations to spoken form (especially important — "$1M" may read differently across models)

## Voice Settings

| Parameter | Range | Default | Effect |
|-----------|-------|---------|--------|
| `stability` | 0.0–1.0 | 0.5 | Low = expressive/variable, High = monotone/consistent |
| `similarity_boost` | 0.0–1.0 | 0.75 | Higher = closer to original voice (TTS only, not dialogue) |
| `style` | 0.0+ | 0 | Style exaggeration (TTS only) |
| `speed` | 0.7–1.2 | 1.0 | Speech rate (TTS only) |
| `use_speaker_boost` | bool | true | Voice clarity enhancement (TTS only) |

For dialogue: only `stability` is available. Use 0.3–0.5 for expressive panel discussion.

## Voice Management

### List Voices
```
GET https://api.elevenlabs.io/v2/voices
```
Query params: `search`, `voice_type` (premade/cloned/generated), `category`, `page_size` (max 100)

### Instant Voice Clone
```
POST https://api.elevenlabs.io/v1/voices/add
Content-Type: multipart/form-data
```
- `name` (required), `files` (required, audio), `description`, `labels`, `remove_background_noise`
- Sweet spot: 1–2 minutes of clean single-speaker audio (>3 min has diminishing returns)
- Quality matters more than quantity: no background noise, reverb, or artifacts
- MP3 at 192kbps+ recommended

## Models

| Model ID | Char Limit | Credits/Char | Notes |
|----------|-----------|--------------|-------|
| `eleven_v3` | 5,000 (~5 min) | 1 | **Dialogue support**, most expressive, audio tags |
| `eleven_multilingual_v2` | 10,000 (~10 min) | 1 | Stable, long-form, SSML support |
| `eleven_flash_v2_5` | 40,000 (~40 min) | 0.5 | 50% cheaper, ~75ms latency, 32 languages |
| `eleven_flash_v2` | 30,000 (~30 min) | 0.5 | English only |

## Audio Output Formats

Pattern: `codec_samplerate_bitrate`

- **MP3**: `mp3_44100_128` (default), `mp3_44100_192`, `mp3_44100_96`, `mp3_44100_64`, `mp3_44100_32`, `mp3_24000_48`, `mp3_22050_32`
- **WAV**: `wav_44100`, `wav_48000`, `wav_24000`, `wav_22050`, `wav_16000`, `wav_8000`
- **PCM** (raw S16LE): `pcm_44100`, `pcm_48000`, `pcm_24000`, etc.
- **Opus**: `opus_48000_128`, `opus_48000_96`, `opus_48000_64`, `opus_48000_32`

## Pricing & Limits

### Plans

| Plan | $/mo | Credits/mo | Custom Voices |
|------|------|-----------|---------------|
| Free | $0 | 10,000 | 3 |
| Starter | $5 | 30,000 | 10 |
| Creator | $22 | 100,000 | 30 |
| Pro | $99 | 500,000 | 160 |
| Scale | $330 | 2,000,000 | 660 |

### Concurrency (simultaneous requests)

| Plan | v2/v3 | Flash |
|------|-------|-------|
| Free | 2 | 4 |
| Starter | 3 | 6 |
| Creator | 5 | 10 |
| Pro | 10 | 20 |

## Gotchas

1. **v3 has NO SSML** — no `<break>`, no `<phoneme>`. Use punctuation and audio tags.
2. **Nondeterministic** — even with `seed`, subtle differences occur. Generate multiple takes.
3. **PVC not optimized for v3** — Professional Voice Clones may degrade on v3.
4. **Text normalization varies by model** — "$1,000,000" reads differently on v2 vs Flash. Pre-normalize.
5. **Default voices expire Dec 31, 2026** — plan accordingly.
6. **Audio tags depend on voice training** — not all tags work on all voices.
7. **Dialogue is batch, not realtime** — for pre-generated content only.
8. **5,000 char limit on v3** — for our 8-line panel (~800 chars) this is fine.
9. **Community voices may have credit multipliers** — check before using.

## Our Panel: Quick Math

The 8-line theology panel script (v3) is ~800 characters. At 1 credit/char on v3:
- **800 credits per generation** on the dialogue endpoint
- Free tier (10,000 credits/mo) = ~12 full panel generations
- Starter ($5/mo, 30,000) = ~37 generations
- Testing with short snippets first is essential to conserve credits

## Workflow for This Project

1. List available voices, pick 4 that fit (2 male, 2 female)
2. Test with a single 2-turn snippet (~100 chars) to validate API + voice quality
3. User listens and approves before scaling up
4. Generate full 8-line panel via text-to-dialogue endpoint
5. Use `convert_with_timestamps` variant for subtitle/slide sync data
6. Export as `wav_44100` for highest quality, or `mp3_44100_192` for smaller files
