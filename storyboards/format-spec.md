# Storyboard Format Spec

## Overview

Each storyboard is a markdown file combining **slides** (visual frames) with **dialogue** (panel discussion). The format is designed to be:
- Human-readable as a document
- Parseable by the MCP pipeline for audio/video generation
- Easy to evaluate equilibrium across the 4 voices

## Panelists

| ID | Voice | Perspective |
|----|-------|-------------|
| `WRIGHT` | NT Wright — British academic, narrative theologian | Inaugurated eschatology, covenant, new creation |
| `BT` | Baptist Theologian — careful exegete, confessional | Scriptural authority, propositional clarity, believer's baptism |
| `PT` | Pentecostal Theologian — passionate, Spirit-focused | Pneumatological, continuationist, kingdom-now |
| `LAY` | "Baptacostal" Layperson — raised Baptist, Spirit-curious | Grew up with solid doctrine but has had (or is open to) experiences that don't fit the categories. Asks the questions the audience is thinking. Honest about tension: "I believe the theology but something happened I can't explain." Practical: "What does this mean for my Monday?" |

## Format

````markdown
# [Panel Title]
<!-- topic: path/to/source.md -->
<!-- voices: WRIGHT, BT, PT, LAY -->

---

## [Section Title]

> [!slide]
> **background:** [brief description of desaturated vector image]
> **text:** [verse reference + text displayed on screen]

```svg
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated background image -->
</svg>
```

**WRIGHT:** Dialogue line here. Natural speech — contractions, hedges,
interruptions are fine. Keep lines to 2-3 sentences max for pacing.

**BT:** Response here. Can reference the verse on screen.

> [!slide]
> **background:** [new background description — every slide gets one]
> **text:** **Romans 8:9** — "...if anyone does not have the Spirit of
> Christ, they do not belong to Christ."

```svg
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <!-- Generated background image -->
</svg>
```

**LAY:** I remember the first time that verse really hit me — I'd been
chasing some experience, and it turns out He'd been there all along.

---

## [Next Section Title]

> [!slide]
> **background:** [description]
> **text:** [verse]

```svg
<!-- generated SVG -->
```
````

## Slide Rules

- **`background`** — One-line description for Stable Diffusion prompt. Always desaturated, dark, minimal. Every slide must have a background — no omitting.
- **`text`** — The verse or key phrase displayed on screen. Use `**bold**` for the reference. Keep to 2-3 lines max (must be readable across a small group room).
- **SVG block** — Follows each slide callout. Contains the generated background image as inline SVG. This lets us iterate on visuals alongside the script. The pipeline extracts these for video compositing.
- **No `duration` field** — Slide timing is derived from TTS audio timestamps. Slides transition when the next `> [!slide]` block's dialogue begins.

## Dialogue Rules

- Each line starts with `**SPEAKER_ID:**` followed by their dialogue
- Lines should be 1-3 sentences (natural speech rhythm)
- Speakers can interrupt (use `—` dash for cut-off: "But that's not what Paul—")
- Non-verbal cues in brackets: `[laughs]`, `[pause]`, `[sighs]`
- When a speaker references the on-screen verse, they don't need to quote it fully — the audience can see it

## Equilibrium Metadata

At the end of each storyboard, include a scoring block:

````markdown
---

## Equilibrium Report

| Voice | Lines | Words | Initiates | Concedes | Challenged By | Last Word |
|-------|-------|-------|-----------|----------|---------------|-----------|
| WRIGHT | 12 | 340 | 3 | 2 | BT, PT | 1 |
| BT | 11 | 310 | 2 | 1 | WRIGHT, PT | 2 |
| PT | 11 | 300 | 3 | 1 | BT, WRIGHT | 1 |
| LAY | 14 | 380 | 3 | 1 | BT | 1 |

**Balance notes:** LAY should get the most lines (audience surrogate)
but not dominate word count — short, punchy contributions plus 1-2
longer testimony moments. BT hasn't conceded anything yet — find a
point where the Pentecostal reading genuinely presses them. Each
theologian should be challenged by at least 2 others.
````

## Example: Baptism in the Spirit — Opening Section

# Baptism in the Spirit: A Panel Discussion

<!-- topic: handouts/baptism-in-the-spirit.md -->
<!-- voices: WRIGHT, BT, PT, LAY -->

---

## The Common Ground

> [!slide]
> **background:** single flame resting on still water, desaturated navy
> **text:** **Romans 8:9** — "If anyone does not have the Spirit of
> Christ, they do not belong to Christ."

```svg
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0a0a1a"/>
  <ellipse cx="400" cy="300" rx="120" ry="8" fill="#0d1b2a" opacity="0.6"/>
  <path d="M400 100 Q390 180 385 260 Q380 300 400 300 Q420 300 415 260 Q410 180 400 100Z" fill="#1a1a3a" opacity="0.4"/>
  <path d="M400 80 Q395 130 393 200 Q390 260 400 260 Q410 260 407 200 Q405 130 400 80Z" fill="#2a2a4a" opacity="0.5"/>
  <circle cx="400" cy="70" r="12" fill="#3a3a6a" opacity="0.6"/>
  <circle cx="400" cy="65" r="6" fill="#4a4a7a" opacity="0.4"/>
</svg>
```

**WRIGHT:** Before we start disagreeing — and we will — let's nail down
what everyone in this room actually agrees on. Romans 8:9. If you
belong to Christ, the Spirit lives in you. Full stop.

**BT:** Exactly. And that's not a minor point. Paul isn't saying the
Spirit *might* be there. The grammar is a first-class condition — he's
assuming it's true of his readers.

**PT:** We agree completely. No Pentecostal theologian worth their salt
denies that the Spirit indwells every believer at conversion.

**LAY:** Ok good — so why is this even a debate then?

**PT:** Because indwelling and empowering might not be the same thing.

> [!slide]
> **background:** open hands cupped upward, soft light from above, desaturated indigo
> **text:** **John 14:16-17** — "He will give you another advocate to
> help you and be with you forever — the Spirit of truth."

```svg
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0a0a1a"/>
  <ellipse cx="400" cy="280" rx="180" ry="60" fill="#0d1b2a" opacity="0.3"/>
  <path d="M320 300 Q300 260 310 220 Q320 200 340 210 Q360 220 370 250 L400 270 L430 250 Q440 220 460 210 Q480 200 490 220 Q500 260 480 300Z" fill="#1a1a3a" opacity="0.4"/>
  <line x1="400" y1="80" x2="400" y2="200" stroke="#2a2a5a" stroke-width="2" opacity="0.3"/>
  <circle cx="400" cy="160" r="40" fill="none" stroke="#2a2a5a" stroke-width="1" opacity="0.2"/>
</svg>
```

**WRIGHT:** And that's where it gets interesting. Jesus uses two quite
different categories of language about the Spirit. There's the
permanent-indwelling language — John 14, "with you forever" — and then
there's the power-and-mission language.

**LAY:** That's what I never understood growing up Baptist. I knew the
Spirit was in me — I believed that. But then I visited a friend's
church and something *happened* that I couldn't explain with the
theology I had.

**BT:** And I want to honor that experience — I really do. But we have
to be careful about building theology on experience rather than letting
Scripture interpret experience.

> [!slide]
> **background:** distant horizon with rays breaking through clouds, desaturated amber on dark
> **text:** **Acts 1:8** — "You will receive power when the Holy Spirit
> comes on you; and you will be my witnesses..."

```svg
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0a0a1a"/>
  <rect x="0" y="320" width="800" height="130" fill="#0d1520" opacity="0.8"/>
  <line x1="300" y1="320" x2="200" y2="100" stroke="#2a2010" stroke-width="1" opacity="0.3"/>
  <line x1="400" y1="320" x2="400" y2="80" stroke="#2a2010" stroke-width="1" opacity="0.4"/>
  <line x1="500" y1="320" x2="600" y2="100" stroke="#2a2010" stroke-width="1" opacity="0.3"/>
  <ellipse cx="400" cy="320" rx="300" ry="20" fill="#1a1510" opacity="0.4"/>
  <path d="M100 340 Q250 300 400 320 Q550 300 700 340" fill="none" stroke="#1a1510" stroke-width="2" opacity="0.3"/>
</svg>
```

**PT:** But the Scripture itself records these experiences. Acts 1:8
isn't Paul writing theology from a desk — it's Jesus telling disciples
who already had the Spirit to wait for something more.

**WRIGHT:** And that's the crux. Jesus says this *after* John 20:22,
where He breathes on them and says "Receive the Holy Spirit." So they
have the Spirit — and yet they're told to wait. What are they waiting
for?

**LAY:** I feel like I'm living in that gap. I know I have the Spirit.
But I'm waiting for... something. And I don't know what to call it.

**PT:** Maybe you don't need to call it anything. Maybe you just need
to stop being afraid of it.

**BT:** [pause] Or maybe what you need isn't a new experience but a
deeper understanding of what you already have. Both of those are real
possibilities.

---

## The Tabernacle Pattern

> [!slide]
> **background:** simple tabernacle outline, cloud descending into it, desaturated gold on dark
> **text:** **Exodus 40:34** — "The cloud covered the tent of meeting,
> and the glory of the LORD filled the tabernacle."

```svg
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0a0a0a"/>
  <path d="M300 350 L400 200 L500 350Z" fill="none" stroke="#2a2518" stroke-width="2" opacity="0.5"/>
  <line x1="300" y1="350" x2="500" y2="350" stroke="#2a2518" stroke-width="2" opacity="0.5"/>
  <rect x="370" y="310" width="60" height="40" fill="none" stroke="#2a2518" stroke-width="1" opacity="0.4"/>
  <ellipse cx="400" cy="160" rx="100" ry="50" fill="#1a1a20" opacity="0.4"/>
  <ellipse cx="400" cy="150" rx="80" ry="40" fill="#1a1a25" opacity="0.3"/>
  <path d="M380 180 Q390 220 400 250 Q410 220 420 180" fill="#1a1a30" opacity="0.2"/>
</svg>
```

**WRIGHT:** I want to introduce a pattern that runs through the whole
Bible and might reframe this debate. The Tabernacle. God tells Moses to
build it — construction first. Then consecration. Then the glory fills
it. Three stages, not one.

**PT:** And Paul picks this up directly — "Do you not know that your
bodies are temples of the Holy Spirit?" We *are* tabernacles.

**BT:** I'll grant the analogy is suggestive. But an analogy isn't an
argument. You can't build a two-stage pneumatology on a
Tabernacle-construction metaphor.

**WRIGHT:** Fair enough. But here's what's interesting — the glory
could also *depart*. Ezekiel 10. The glory leaves the temple because
of Israel's sin. Under the new covenant the Spirit doesn't leave — the
seal holds. But can His active influence be... muffled?

> [!slide]
> **background:** cracked seal or wax impression, muted warm tones on dark
> **text:** **Ephesians 4:30** — "Do not grieve the Holy Spirit of God,
> with whom you were sealed for the day of redemption."

```svg
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0a0a0a"/>
  <circle cx="400" cy="225" r="80" fill="#1a1210" opacity="0.5"/>
  <circle cx="400" cy="225" r="60" fill="#1a1510" opacity="0.4"/>
  <path d="M370 210 L390 240 L430 200 L410 230Z" fill="#2a2015" opacity="0.3"/>
  <line x1="340" y1="180" x2="360" y2="200" stroke="#1a1008" stroke-width="1" opacity="0.4"/>
  <line x1="440" y1="200" x2="460" y2="180" stroke="#1a1008" stroke-width="1" opacity="0.4"/>
  <line x1="380" y1="270" x2="370" y2="290" stroke="#1a1008" stroke-width="1" opacity="0.3"/>
  <line x1="420" y1="270" x2="430" y2="290" stroke="#1a1008" stroke-width="1" opacity="0.3"/>
</svg>
```

**LAY:** That's what it felt like for me. Not like God left. More like
I'd built so many walls of — I don't know — control? Respectability?
And then one night at a friend's church those walls just came down and
the Spirit was *right there*. He'd been there the whole time. I just
couldn't feel Him through all the... proper Baptist decorum. [laughs]

**BT:** And notice Paul's language — "grieve" the Spirit. That's
relational. You grieve a person, not a force. The Spirit can be present
and grieved at the same time. I think that gets at something real
without requiring a whole second-blessing framework.

**PT:** But "grieved" and "quenched" aren't the same. Paul uses both.
Grieved is relational — you've hurt Him. Quenched is functional —
you've *suppressed* Him. And I think a lot of traditional churches
have been quenching for generations.

**WRIGHT:** [carefully] That's a strong claim. But I think there's
evidence for it. When you look at the global South — the explosive
growth of Christianity in Africa, Asia, Latin America — it's almost
entirely Spirit-movement Christianity. And the Western church is
largely in decline. At some point you have to ask whether the Spirit is
doing something that our categories can't contain.
