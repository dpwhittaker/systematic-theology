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

**Implementation:** Each topic is a markdown file in `data/` with YAML frontmatter:
- One `.md` file per topic (e.g., `data/intro/narrative.md` or `data/god/god.md`)
- Links embedded inline using `[text](#path 'column')` format
- Column types: `Hebrew`, `Drill`, `Greek`, `Parent`
- Content sections separated by `---`: frontmatter, parents, summary, article (optional)

### Navigation Model: Directional Semantics & Color-Coded Links

The keyboard navigation has theological significance mapped to physical directions:
- **UP (ArrowUp)**: Cycle through parent links and navigation history
- **DOWN (ArrowDown)**: Cycle through Drill links (detailed exploration)
- **LEFT (ArrowLeft)**: Cycle through Hebrew/concrete/narrative links (yellow)
- **RIGHT (ArrowRight)**: Cycle through Greek/abstract/categorical links (cyan)
- **SPACE/ENTER**: Activate focused link or toggle article

**Visual Implementation:**
- Links are color-coded within the main text content:
  - **Hebrew links**: Yellow (#ffdd00) - concrete, narrative, relational
  - **Drill links**: Green (#00ff00) - detailed exploration, evidence
  - **Greek links**: Cyan (#00ddff) - abstract, categorical, systematic
  - **Parent links**: Purple (#a88dd8) - navigation up the hierarchy
- Active link shows a border highlight
- Footer displays navigation hints with corresponding colors

### State Management (js/app.js)

The application uses a simple vanilla JS state object:
```javascript
state = {
    currentTopicId: 'intro/intro',
    focusedLinkIndex: -1,      // Which inline link has focus (-1 = article mode)
    focusedParentIndex: -1,    // Which parent link has focus
    history: [],               // For back navigation
    showingArticle: false,     // Toggle between summary and article
    inlineLinks: []            // Array of {element, target, column, index}
}
```

Navigation updates state, changes URL hash, and triggers re-render. The render cycle:
1. Updates breadcrumb with navigation history (last 5 topics + current)
2. Displays back link and parent links in header (right-aligned)
3. Renders content with inline markdown links converted to color-coded `<span class="link">` elements
4. Updates footer with navigation hints and dynamic more/go indicator
5. Applies dynamic font sizing to fit content within viewport constraints

### Data Structure (Markdown Files)

Each topic is a `.md` file with 4 sections separated by `---`:

```markdown
---
title: Topic Title
shortTitle: Short      # Optional, for breadcrumbs
---
[Parent Topic](#path/to/parent 'Parent')
---
Main content with [inline links](#target 'Hebrew') marked.
Use *asterisks* for emphasis highlighting.
Can reference [drill-down](#detail 'Drill') or [abstract](#concept 'Greek') topics.
---
Optional article section for deeper exploration.
Shows when user presses enter on "↵ more..." indicator.
Can include multiple paragraphs and [more links](#other).
```

**Link Format:** `[text](#path 'column')`
- `text`: Display text (will be color-coded)
- `path`: Relative path without `.md` extension (e.g., `intro/narrative` or `god/god`)
- `column`: One of `Hebrew`, `Drill`, `Greek`, or `Parent`
- Default column in section 2 (parents) is `Parent`
- Default column in sections 3-4 (summary/article) is `Drill`

When adding new topics:
- Ensure bidirectional links where conceptually appropriate (lattice structure)
- Use descriptive link text that fits naturally in sentences
- Choose column thoughtfully: Hebrew for concrete/narrative, Greek for abstract/systematic

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

1. Create a new `.md` file in appropriate folder (e.g., `data/salvation/grace.md`)
2. Add YAML frontmatter with `title` (and optional `shortTitle`)
3. Add parent links in section 2
4. Write summary content in section 3 with inline `[links](#target 'column')`
5. Optionally add article content in section 4 for "more..." expansion
6. Add reciprocal links from related topics to create lattice connections
7. Refresh browser (no build step needed; cache disabled during development)

### Testing Navigation

- Use browser DevTools console to check `state` object
- URL hash should sync with `currentTopicId`
- History array should grow/shrink with forward/back navigation
- Focused link index should wrap within 0 to `links.length - 1`

### Inline Link Navigation Logic

Navigation works by cycling through color-coded links embedded in the text:
- Arrow keys filter links by column type (Hebrew/Drill/Greek/Parent)
- `cycleLinks(columnFilter)` finds all matching links and advances focus
- Active link gets visual border highlight
- Cycling past the last link returns to "article mode" (no focus)
- In article mode, pressing Enter toggles article expansion if available

## Key Files

- `index.html` - Static shell, injects content via JS
- `js/app.js` - All application logic, state management, rendering
- `data/**/*.md` - Content source (markdown files), defines lattice structure
- `css/style.css` - HUD styling, zero-scroll layout, color-coded navigation
- `design.md` - Full UX rationale and theological design decisions
- `README.md` - Project thesis and overview
- `CLAUDE.md` - This file - guidance for AI assistants working on the project

## Workflow Management for Claude Code

When working in this repository, follow these procedures to maintain conversation history and enable branching exploration:

### Prompt and Output Logging

- **Read Context First:** At the beginning of a new session, read `prompts.md` and `output.md` to restore conversational context (they will remain in context for the rest of the session)
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

**God's Personhood:**
Both Hebrew and Greek perspectives agree on a foundational truth: **God is personal—He is a "Who," not a "what."** When writing content:
- Capitalize pronouns referring to God: He, His, Him, Himself
- This is not merely stylistic—it reflects the shared conviction that God is a person, not an abstract force or philosophical concept
- The Hebrew-Greek tension is about *how* we know this personal God (relationship vs. definition), not *whether* He is personal

### Accessibility vs. HUD Optimization

The primary target is smart glasses (HUD), but the site should remain:
- Keyboard navigable (already achieved)
- Screen-reader friendly (ensure semantic HTML when adding features)
- Clickable (touch works for testing on phones/tablets)

Don't sacrifice HUD constraints for desktop convenience—the zero-scroll, high-contrast design is the point.

### Recent Changes & Current State

**Implemented:**
- ✅ Markdown-based content system (replaced theology.json)
- ✅ Color-coded inline links (replaced nav-grid)
- ✅ Article expansion system (fourth section in markdown files)
- ✅ Dynamic font sizing to fit content in viewport
- ✅ Touch gesture support (swipe for navigation)
- ✅ Artificial history for deep-linking
- ✅ Single-row header (breadcrumbs left, parents right)
- ✅ Fixed-width footer cells (20% each) to prevent shifting

**Removed:**
- ❌ Spectrum slider visual indicator (concept retained in link categorization)
- ❌ theology.json data file
- ❌ Separate navigation grid below content

**Future Extensions:**
- "Question" overlay to show categorical critiques
- Advanced visualization of lattice connections (intentionally avoided for HUD clarity)
- Additional theological content expansion

If implementing these, maintain the zero-scroll constraint and keyboard-first interaction model.
