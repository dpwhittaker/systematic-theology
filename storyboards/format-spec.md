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
<!-- duration: ~15 min -->
<!-- voices: WRIGHT, BT, PT, LAY -->

---

## [Section Title]

> [!slide]
> **background:** [brief description of desaturated vector image]
> **text:** [verse reference + text displayed on screen]
> **duration:** [approx seconds this slide is on screen]

**WRIGHT:** Dialogue line here. Natural speech — contractions, hedges,
interruptions are fine. Keep lines to 2-3 sentences max for pacing.

**BT:** Response here. Can reference the verse on screen.

> [!slide]
> **background:** [new image if background changes — omit if same]
> **text:** **Romans 8:9** — "...if anyone does not have the Spirit of
> Christ, they do not belong to Christ."
> **duration:** 20s

**LAY:** I remember the first time that verse really hit me — I'd been
chasing some experience, and it turns out He'd been there all along.

**PT:** And that's exactly what Paul is driving at — this isn't optional
theology, this is identity.

**LAY:** Ok but practically speaking — if I already have the Spirit, why
do I still feel so... dry sometimes?

---

## [Next Section Title]

> [!slide]
> ...
````

## Slide Rules

- **`background`** — One-line description for Stable Diffusion prompt. Always desaturated, dark, minimal. Omit line if the background doesn't change from the previous slide.
- **`text`** — The verse or key phrase displayed on screen. Use `**bold**` for the reference. Keep to 2-3 lines max (must be readable across a small group room).
- **`duration`** — Approximate seconds. This guides pacing — the pipeline adjusts based on actual dialogue audio length.

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
<!-- duration: ~15 min -->
<!-- voices: WRIGHT, BT, PT, LAY -->

---

## The Common Ground

> [!slide]
> **background:** single flame resting on still water, desaturated navy
> **text:** **Romans 8:9** — "If anyone does not have the Spirit of
> Christ, they do not belong to Christ."
> **duration:** 25s

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
> **text:** **John 14:16-17** — "He will give you another advocate to
> help you and be with you forever — the Spirit of truth."
> **duration:** 20s

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
> **text:** **Acts 1:8** — "You will receive power when the Holy Spirit
> comes on you; and you will be my witnesses..."
> **duration:** 25s

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
> **background:** simple tabernacle outline, cloud descending into it,
> desaturated gold on dark
> **text:** **Exodus 40:34** — "The cloud covered the tent of meeting,
> and the glory of the LORD filled the tabernacle."
> **duration:** 30s

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
> **text:** **Ephesians 4:30** — "Do not grieve the Holy Spirit of God,
> with whom you were sealed for the day of redemption."
> **duration:** 20s

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
