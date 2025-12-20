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

## 2. Information Architecture: The Lattice

### The Problem with Trees
Systematic Theology is traditionally structured as a **Tree**: a rigid hierarchy where a concept belongs to only one category (e.g., "Sin" is under "Anthropology"). This enforces a Hellenistic worldview of categorization and separation, often stripping concepts of their relational context.

### The Solution: A Lattice
We will use a **Lattice** structure (a Directed Acyclic Graph).
- **Definition:** A node can have multiple parents and multiple children.
- **Application:** The concept of "Blood" isn't just a sub-point of "Atonement."
    - In a **Tree**, you find "Blood" only under *Soteriology*.
    - In a **Lattice**, "Blood" connects simultaneously to:
        - *Theology Proper* (God as Life-Giver).
        - *Anthropology* (Life is in the blood).
        - *Christology* (The Cross).
        - *Ecclesiology* (Covenant sealing).

### UX Implications
This structure unlocks specific user interactions unavailable in a strict tree:
1.  **The "Thread" Pivot:** Users can "pivot" laterally to related topics.
2.  **Contextual Inheritance:** A verse displays context based on its active lattice path.

### Directional Semantics
We map physical navigation input (D-Pad/Arrow Keys) to theological dimensions:
-   **UP (Abstraction):** Move towards the parent category (e.g., from "Blood" to "Soteriology").
-   **DOWN (Detail):** Drill down into evidence (e.g., from "Blood" to "Leviticus 17:11").
-   **LEFT (Hebraic - Concrete):** Pivot the view towards the narrative/concrete function.
    -   *Example:* Focus shifts to the "Covenant" aspect of the topic.
-   **RIGHT (Hellenistic - Abstract):** Pivot the view towards the categorical/philosophical definition.
    -   *Example:* Focus shifts to the "Satisfaction Theory" aspect of the topic.

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

To visualize the Lattice, we introduce **"Threads"** (Lateral Links) alongside the standard hierarchy.

```
+--------------------------------------------------+
|  < [HEBREW: COVENANT]      [GREEK: SATISFACTION] > | <- Horizontal Axis
+--------------------------------------------------+
|  [PARENT: SOTERIOLOGY]                           | <- Vertical Axis (Up)
|                                                  |
|   "The Blood"                                    | <- Current Node
|                                                  |
|   v Leviticus 17:11                              | <- Vertical Axis (Down)
|   v Hebrews 9:22                                 |
|                                                  |
+--------------------------------------------------+
|  THREADS: [Life]  [Sacrifice]  [Purity]          |
+--------------------------------------------------+
|  [NAV: Arrows Navigate | Space: Select]          |
+--------------------------------------------------+
```
*   **Horizontal Axis:** Left Arrow shifts context to Hebraic (Concrete), Right Arrow shifts to Hellenistic (Abstract).
*   **Vertical Axis:** Up goes to Parent Category, Down goes to Verse Evidence.
