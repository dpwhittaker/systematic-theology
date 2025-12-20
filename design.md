# Design Document

## 1. User Experience (UX) - The "HUD" Concept

The primary consumption device is a pair of smart glasses. This dictates strict constraints:
- **Zero Scrolling:** Content must fit within a single fixed viewport (100vh/100vw).
- **High Contrast:** Pure black background (#000000) with high-visibility text (e.g., Neon Green, Amber, or High-Contrast White) to ensure legibility in varying lighting conditions.
- **Glanceability:** 
    - Top-level slides must be readable in < 2 seconds.
    - Hierarchy should be visual (size/color), not spatial (scrolling down).
- **Navigation:**
    - "Decks" or "Cards" metaphor.
    - Horizontal swipe/action for next/prev topic.
    - Vertical swipe/action to drill down into details/references.
    - Keyboard shortcuts mapping to simple remotes (Arrow keys, Space, Enter).

## 2. Information Architecture

We need to map a traditional Systematic Theology outline to a Hebraic critique.

### Structure Idea: The Lattice
Instead of a tree, we use a lattice where nodes are theological topics.
- **Node:** "Soteriology" (Salvation)
    - **Greek View:** Ordo Salutis, Predestination vs Free Will (Abstract concepts).
    - **Hebrew View:** Exodus, Covenant, "Yasha" (Concrete deliverance).
    - **Drill Down:** Verse list -> Interlinear text -> Historical Context.

### The "Question" Overlay
Every page should have a toggleable "Critique" layer that highlights where the current theological category might be imposing a foreign structure on the text.

## 3. Technology Stack

- **Static Site Generator:** Plain HTML/CSS/JS or a lightweight generator (e.g., 11ty/Vite). Simplicity is key for performance and maintenance.
- **Data Source:** Markdown files or JSON for theological data points to allow easy editing of the "research notebook" aspect.
- **CSS Framework:** Custom "HUD" framework.
    - CSS Grid for rigid layout.
    - Viewport units (vw/vh) for sizing text.
    - `@media (prefers-color-scheme: dark)` standard.

## 4. Design Decisions TBD

- **Navigation Input:** How will the glasses interact? (Touchpad on temple? Ring controller? Phone remote?)
    - *Decision:* Build for generic keyboard input (Arrows/Space) which most controllers map to.
- **Typography:** Needs a font with open counters and uniform stroke width for display transparency.
    - *Candidate:* Roboto Mono, Fira Code, or a high-legibility sans-serif like Atkinson Hyperlegible.
- **Graph Visualization:** Do we visualize the connections?
    - *Decision:* Keep it text-based for the HUD. Complex graphs are too noisy for transparent displays.

## 5. Prototype Layout (Single Screen)

```
+--------------------------------------------------+
|  [TOPIC: ESCHATOLOGY]                  [HEBREW]  | <- Header
+--------------------------------------------------+
|                                                  |
|   "The Day of the Lord"                          | <- Main Focus (Large)
|                                                  |
|   > Amos 5:18                                    | <- Actionable Link
|   > 1 Thess 5:2                                  |
|                                                  |
+--------------------------------------------------+
|  [NAV: > Next Topic | v Drill Down]              | <- Footer hints
+--------------------------------------------------+
```
