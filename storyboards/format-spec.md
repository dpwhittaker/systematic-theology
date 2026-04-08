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
  <!-- reflection on water -->
  <ellipse cx="400" cy="340" rx="150" ry="10" fill="#1a2a4a" opacity="0.6"/>
  <ellipse cx="400" cy="350" rx="120" ry="6" fill="#15254a" opacity="0.4"/>
  <!-- flame body -->
  <path d="M400 100 Q380 180 375 260 Q370 310 400 310 Q430 310 425 260 Q420 180 400 100Z" fill="#2a3a6a" opacity="0.7"/>
  <path d="M400 130 Q388 190 385 250 Q382 290 400 290 Q418 290 415 250 Q412 190 400 130Z" fill="#3a4a8a" opacity="0.6"/>
  <!-- flame tip -->
  <path d="M400 80 Q393 110 390 150 Q387 200 400 200 Q413 200 410 150 Q407 110 400 80Z" fill="#4a5aa0" opacity="0.7"/>
  <ellipse cx="400" cy="75" r="10" fill="#5a6ab8" opacity="0.5"/>
  <!-- verse text -->
  <text x="400" y="390" text-anchor="middle" fill="#c0c8e0" font-family="Georgia, serif" font-size="18" font-weight="bold">Romans 8:9</text>
  <text x="400" y="415" text-anchor="middle" fill="#a0a8c0" font-family="Georgia, serif" font-size="15">"If anyone does not have the Spirit of Christ,</text>
  <text x="400" y="435" text-anchor="middle" fill="#a0a8c0" font-family="Georgia, serif" font-size="15">they do not belong to Christ."</text>
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
  <rect width="800" height="450" fill="#08081a"/>
  <!-- light from above -->
  <ellipse cx="400" cy="60" rx="80" ry="30" fill="#1a2050" opacity="0.6"/>
  <line x1="400" y1="90" x2="370" y2="220" stroke="#2a3570" stroke-width="2" opacity="0.4"/>
  <line x1="400" y1="90" x2="430" y2="220" stroke="#2a3570" stroke-width="2" opacity="0.4"/>
  <line x1="400" y1="90" x2="400" y2="230" stroke="#304080" stroke-width="2" opacity="0.5"/>
  <!-- cupped hands -->
  <path d="M300 310 Q280 260 290 220 Q305 190 330 200 Q355 215 370 250 L400 280 L430 250 Q445 215 470 200 Q495 190 510 220 Q520 260 500 310Z" fill="#1a2550" opacity="0.6"/>
  <path d="M320 300 Q305 265 312 235 Q322 212 342 220 Q358 230 370 258 L400 275 L430 258 Q442 230 458 220 Q478 212 488 235 Q495 265 480 300Z" fill="#253068" opacity="0.5"/>
  <!-- gentle glow in hands -->
  <ellipse cx="400" cy="265" rx="35" ry="18" fill="#3a4a90" opacity="0.4"/>
  <!-- verse text -->
  <text x="400" y="380" text-anchor="middle" fill="#c0c8e0" font-family="Georgia, serif" font-size="18" font-weight="bold">John 14:16-17</text>
  <text x="400" y="405" text-anchor="middle" fill="#a0a8c0" font-family="Georgia, serif" font-size="15">"He will give you another advocate to help you</text>
  <text x="400" y="425" text-anchor="middle" fill="#a0a8c0" font-family="Georgia, serif" font-size="15">and be with you forever — the Spirit of truth."</text>
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
  <rect width="800" height="450" fill="#0a0a10"/>
  <!-- horizon line -->
  <rect x="0" y="280" width="800" height="170" fill="#10150a" opacity="0.8"/>
  <line x1="0" y1="280" x2="800" y2="280" stroke="#2a3520" stroke-width="1" opacity="0.5"/>
  <!-- rays breaking through clouds -->
  <line x1="400" y1="280" x2="250" y2="40" stroke="#5a5020" stroke-width="3" opacity="0.5"/>
  <line x1="400" y1="280" x2="400" y2="20" stroke="#6a6025" stroke-width="3" opacity="0.6"/>
  <line x1="400" y1="280" x2="550" y2="40" stroke="#5a5020" stroke-width="3" opacity="0.5"/>
  <line x1="400" y1="280" x2="150" y2="80" stroke="#4a4018" stroke-width="2" opacity="0.35"/>
  <line x1="400" y1="280" x2="650" y2="80" stroke="#4a4018" stroke-width="2" opacity="0.35"/>
  <!-- cloud bank -->
  <ellipse cx="400" cy="120" rx="350" ry="80" fill="#15180e" opacity="0.6"/>
  <ellipse cx="300" cy="110" rx="150" ry="60" fill="#181c10" opacity="0.5"/>
  <ellipse cx="520" cy="130" rx="160" ry="55" fill="#181c10" opacity="0.5"/>
  <!-- glow at horizon -->
  <ellipse cx="400" cy="280" rx="200" ry="30" fill="#3a3518" opacity="0.5"/>
  <!-- verse text -->
  <text x="400" y="340" text-anchor="middle" fill="#d0c890" font-family="Georgia, serif" font-size="18" font-weight="bold">Acts 1:8</text>
  <text x="400" y="365" text-anchor="middle" fill="#b0a870" font-family="Georgia, serif" font-size="15">"You will receive power when the Holy Spirit</text>
  <text x="400" y="385" text-anchor="middle" fill="#b0a870" font-family="Georgia, serif" font-size="15">comes on you; and you will be my witnesses..."</text>
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
  <rect width="800" height="450" fill="#08080a"/>
  <!-- tabernacle structure -->
  <path d="M280 320 L400 170 L520 320Z" fill="none" stroke="#6a5a30" stroke-width="2.5" opacity="0.7"/>
  <line x1="280" y1="320" x2="520" y2="320" stroke="#6a5a30" stroke-width="2.5" opacity="0.7"/>
  <!-- entrance -->
  <rect x="375" y="275" width="50" height="45" fill="#1a1508" opacity="0.6" stroke="#6a5a30" stroke-width="1.5" opacity="0.5"/>
  <!-- interior glow from entrance -->
  <ellipse cx="400" cy="290" rx="20" ry="25" fill="#4a4020" opacity="0.4"/>
  <!-- cloud descending -->
  <ellipse cx="400" cy="100" rx="160" ry="55" fill="#252530" opacity="0.7"/>
  <ellipse cx="380" cy="90" rx="120" ry="45" fill="#303040" opacity="0.6"/>
  <ellipse cx="430" cy="110" rx="100" ry="35" fill="#2a2a38" opacity="0.5"/>
  <!-- glory stream from cloud to tabernacle -->
  <path d="M370 140 Q380 165 385 190 Q390 220 400 250" stroke="#5a5040" stroke-width="3" fill="none" opacity="0.5"/>
  <path d="M430 140 Q420 165 415 190 Q410 220 400 250" stroke="#5a5040" stroke-width="3" fill="none" opacity="0.5"/>
  <ellipse cx="400" cy="250" rx="20" ry="10" fill="#5a5040" opacity="0.35"/>
  <!-- verse text -->
  <text x="400" y="370" text-anchor="middle" fill="#c0b880" font-family="Georgia, serif" font-size="18" font-weight="bold">Exodus 40:34</text>
  <text x="400" y="395" text-anchor="middle" fill="#a09868" font-family="Georgia, serif" font-size="15">"The cloud covered the tent of meeting,</text>
  <text x="400" y="415" text-anchor="middle" fill="#a09868" font-family="Georgia, serif" font-size="15">and the glory of the LORD filled the tabernacle."</text>
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
  <rect width="800" height="450" fill="#0a0808"/>
  <!-- seal / wax impression -->
  <circle cx="400" cy="190" r="90" fill="#2a1810" opacity="0.7"/>
  <circle cx="400" cy="190" r="70" fill="#3a2518" opacity="0.65"/>
  <circle cx="400" cy="190" r="50" fill="#4a3020" opacity="0.6"/>
  <!-- embossed symbol -->
  <path d="M380 175 L400 155 L420 175 L410 175 L410 210 L390 210 L390 175Z" fill="#5a3a28" opacity="0.6"/>
  <!-- cracks radiating outward -->
  <line x1="345" y1="140" x2="310" y2="100" stroke="#4a2a18" stroke-width="2" opacity="0.6"/>
  <line x1="455" y1="140" x2="490" y2="100" stroke="#4a2a18" stroke-width="2" opacity="0.6"/>
  <line x1="340" y1="220" x2="300" y2="260" stroke="#4a2a18" stroke-width="2" opacity="0.5"/>
  <line x1="460" y1="220" x2="500" y2="260" stroke="#4a2a18" stroke-width="2" opacity="0.5"/>
  <line x1="400" y1="280" x2="400" y2="310" stroke="#4a2a18" stroke-width="1.5" opacity="0.4"/>
  <line x1="340" y1="180" x2="290" y2="175" stroke="#3a2015" stroke-width="1.5" opacity="0.45"/>
  <line x1="460" y1="180" x2="510" y2="175" stroke="#3a2015" stroke-width="1.5" opacity="0.45"/>
  <!-- verse text -->
  <text x="400" y="360" text-anchor="middle" fill="#c0a880" font-family="Georgia, serif" font-size="18" font-weight="bold">Ephesians 4:30</text>
  <text x="400" y="385" text-anchor="middle" fill="#a09068" font-family="Georgia, serif" font-size="15">"Do not grieve the Holy Spirit of God,</text>
  <text x="400" y="405" text-anchor="middle" fill="#a09068" font-family="Georgia, serif" font-size="15">with whom you were sealed for the day of redemption."</text>
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
