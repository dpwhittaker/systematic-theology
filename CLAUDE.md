# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static web application for teaching Systematic Theology through a HUD (Heads-Up Display) interface designed for smart glasses. The project explores the tension between Hebraic (concrete, narrative, relational) and Hellenistic (abstract, categorical, systematic) approaches to understanding God.

## Core Architecture

### The Lattice Structure (Not a Tree)

The data model uses a **lattice (Directed Acyclic Graph)** rather than a traditional tree hierarchy:
- Each theological concept can have multiple parents and multiple children
- Example: "Blood" connects to Theology Proper, Anthropology, Christology, and Ecclesiology simultaneously
- This structure is central to the thesis that traditional Systematic Theology's rigid categorization is a Hellenistic imposition on Hebraic revelation

**Implementation:** Each topic in `data/theology.json` contains:
- `links`: Array of related concepts/verses that become navigation targets
- `type`: Either "concept" or "verse"
- `spectrum`: Integer from -10 (Hebraic/Concrete) to +10 (Hellenistic/Abstract)
- `content`: Array of strings with inline `*highlights*` for extracting related terms

### Navigation Model: Directional Semantics

The keyboard navigation has theological significance mapped to physical directions:
- **UP (ArrowUp)**: Navigate to parent category (abstraction) - currently implemented as "back"
- **DOWN (ArrowDown)**: Drill into evidence/details - moves focus down in nav grid
- **LEFT (ArrowLeft)**: Pivot toward Hebraic/concrete/narrative aspects - moves focus left
- **RIGHT (ArrowRight)**: Pivot toward Hellenistic/abstract/categorical aspects - moves focus right
- **SPACE/ENTER**: Activate focused link

See design.md:38-46 for the full directional semantics specification.

### State Management (js/app.js)

The application uses a simple vanilla JS state object:
```javascript
state = {
    currentTopicId: 'intro',
    focusedLinkIndex: 0,  // Which nav item has focus
    topics: {},            // Indexed by id from theology.json
    history: []            // For back navigation
}
```

Navigation updates state, changes URL hash, and triggers re-render. The render cycle:
1. Updates breadcrumb from `topic.category` and `topic.title`
2. Renders content with `*markdown*` highlights converted to `<span class="highlight">`
3. Positions spectrum indicator based on `topic.spectrum` value
4. Generates navigation grid from `topic.links`

### Data Structure (data/theology.json)

Each topic object:
```json
{
    "id": "unique_id",
    "type": "concept" | "verse",
    "category": "SOTERIOLOGY",
    "title": "Display Title",
    "spectrum": -8,              // -10 to +10
    "hasArticle": false,         // [more...] indicator
    "content": ["Line with *highlights*"],
    "links": [
        { "label": "Display", "target": "topic_id" }
    ]
}
```

When adding new topics:
- Ensure bidirectional links where conceptually appropriate (lattice structure)
- Use `*asterisks*` in content to mark terms that appear in the links array
- Set spectrum thoughtfully: negative values favor narrative/function, positive favor definition/category

## Design Constraints

### HUD Requirements (Non-negotiable)

1. **Zero Scrolling**: Content must fit in 100vh/100vw viewport
   - CSS uses `overflow: hidden` on body
   - Navigation grid has fixed height (30vh)

2. **High Contrast**: Pure black background (#000000) with terminal green accent (#00ff00)
   - Designed for transparent display legibility
   - Avoid mid-range grays that disappear on transparent displays

3. **Glanceability**: Top-level content readable in < 2 seconds
   - Use viewport units (vw/vh) for font sizing
   - Hierarchy through size/color, not scrolling

4. **Keyboard-First Navigation**: Must work with simple D-pad/remote controls
   - All interactions mapped to arrow keys, space, enter
   - No mouse-specific features (though click works for accessibility)

### Typography

Current: System fonts with monospace fallbacks for UI chrome
Recommended upgrades: Roboto Mono, Fira Code, or Atkinson Hyperlegible for better HUD transparency

## Common Development Tasks

### Running the Application

This is a static site with no build process:
```bash
# Option 1: Python simple server
python3 -m http.server 8000

# Option 2: PHP built-in server
php -S localhost:8000

# Then open: http://localhost:8000
```

### Adding New Content

1. Edit `data/theology.json`
2. Add new topic object with unique `id`
3. Add `links` entries in related topics pointing to your new `id`
4. Set appropriate `spectrum` value based on concrete ↔ abstract nature
5. Refresh browser (no build step needed)

### Testing Navigation

- Use browser DevTools console to check `state` object
- URL hash should sync with `currentTopicId`
- History array should grow/shrink with forward/back navigation
- Focused link index should wrap within 0 to `links.length - 1`

### Grid Navigation Logic

The nav area uses a 3-column grid. Arrow key behavior:
- Left/Right: -1/+1 with wraparound
- Down: +3 (jump one row) - see js/app.js:136
- Up: Navigate back (not focus movement) - see js/app.js:139-142

This assumes 3 columns. If changing grid layout, update the delta in `moveFocus()`.

## Key Files

- `index.html` - Static shell, injects content via JS
- `js/app.js` - All application logic, state management, rendering
- `data/theology.json` - Content source, defines lattice structure
- `css/style.css` - HUD styling, zero-scroll layout, spectrum visualization
- `design.md` - Full UX rationale and theological design decisions
- `README.md` - Project thesis and overview

## Workflow Management for Claude Code

When working in this repository, follow these procedures to maintain conversation history and enable branching exploration:

### Prompt and Output Logging

- **Read Context First:** At the start of each turn, read `prompts.md` and `output.md` to restore conversational context
- **Log User Prompts:** Append every user prompt to `prompts.md`
- **Log Agent Outputs:** Append text outputs (that aren't direct file content) to `output.md`
- **Purpose:** This allows exploring alternate threads via git branches and resuming work after checkouts

### Version Control

- **Commit on Every Turn:** Any turn that modifies files must end with a git commit
- **Push Immediately:** All commits must be pushed to the remote repository
- **Commit Message Format:** Use descriptive messages that explain what changed
- **Purpose:** Creates a complete history of how the site was built, enabling others to follow the development process

## Important Considerations

### Theological Integrity

This project has an argumentative thesis: that traditional Systematic Theology's categorical approach may distort the relational, narrative nature of biblical revelation. When adding content or features:

- Respect the Hebraic ↔ Hellenistic spectrum as a critical lens, not decoration
- The lattice structure is not just for UX—it's the core critique of tree-based theology
- Content should support examination, not advocacy for one systematic framework

### Accessibility vs. HUD Optimization

The primary target is smart glasses (HUD), but the site should remain:
- Keyboard navigable (already achieved)
- Screen-reader friendly (ensure semantic HTML when adding features)
- Clickable (touch works for testing on phones/tablets)

Don't sacrifice HUD constraints for desktop convenience—the zero-scroll, high-contrast design is the point.

### Future Extensions

Mentioned in design.md but not yet implemented:
- Full article overlay (`hasArticle: true` currently just shows `[more...]` indicator)
- "Question" overlay to show categorical critiques
- Advanced visualization of lattice connections (intentionally avoided for HUD clarity)

If implementing these, maintain the zero-scroll constraint and keyboard-first interaction model.
