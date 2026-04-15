# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Purpose:** A static web application for teaching Systematic Theology through a HUD (Heads-Up Display) interface designed for smart glasses.

**Thesis:** Traditional Systematic Theology's categorical approach (Hellenistic) may distort the relational, narrative nature of biblical revelation (Hebraic).

**Goals:**
- Explore the tension between Greek (abstract, systematic) and Hebrew (concrete, relational) approaches
- Present theology through a lattice structure that resists rigid categorization
- Provide a zero-scroll, high-contrast interface optimized for smart glasses
- Enable exploration through color-coded directional navigation

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

# Main Heading (1.3rem, bold)
Content with headings for structure.

## Subheading (1.1rem, bold)
More detailed sections within the article.
---
Optional article section for deeper exploration.
Shows when user presses enter on "↵ more..." indicator.
Use # and ## headings to organize longer content.
```

**Markdown Features:**
- `[text](#path 'column')` - Color-coded inline links
  - `path`: Relative path without `.md` extension (e.g., `intro/narrative`)
  - `column`: One of `Hebrew`, `Drill`, `Greek`, or `Parent` (default: `Drill`)
- `[text](#path#anchor 'column')` - Deep links to specific sections within files
  - `anchor`: ID of heading to scroll to (e.g., `#baptism/necessity#acts-2-38`)
  - Enables granular navigation to specific passages within comprehensive files
- `# Heading {#anchor-id}` - Heading with anchor for deep linking
  - Creates navigable section ID for cross-references
  - Use kebab-case for anchor IDs (e.g., `{#covenant-vs-contract}`)
- `*text*` - Emphasis highlighting (yellow)
- `# Heading` - Main heading (1.3rem, bold)
- `## Subheading` - Subheading (1.1rem, bold)
- `### Sub-subheading` - Sub-subheading (1.0rem, bold)

**Link Deduplication:**
- Multiple links to the same target are treated as one navigation item
- When focused, all duplicate links are outlined simultaneously
- This prevents redundant cycling through the same destination

**Content Hierarchy:**
- **Top-level category pages** (e.g., `god/god.md`, `christ/christ.md`): Index pages, link-heavy, NO article section
  - Summary should briefly introduce each major sub-concept with inline links
  - These pages serve as navigation hubs, not deep dives
- **Sub-topic pages** (e.g., `god/essence.md`, `god/names.md`): Topic exploration with optional article
  - Summary provides overview with links to related concepts
  - Article section (optional) offers deep dive on that specific topic
- **Detail pages**: Specific concepts that may link further into the lattice

When adding new topics:
- Ensure bidirectional links where conceptually appropriate (lattice structure)
- Use descriptive link text that fits naturally in sentences
- Choose column thoughtfully: Hebrew for concrete/narrative, Greek for abstract/systematic
- Prefer consolidation: child pages should add significant value to stand alone

**Cross-Referencing Strategies:**
- **Anchor links for redundancy reduction**: When multiple files discuss the same passage/concept, designate one file as the primary treatment with comprehensive analysis, and have other files link to it using anchor links (e.g., `#freewill/romans-nine#jacob-esau`)
- **See Also sections**: Add navigation sections at the end of comprehensive files to guide readers to related topics:
  ```markdown
  ---
  # See Also

  **Deep Dives (Related Topics):**
  - [Topic 1](#path/to/topic 'column') - Brief description
  - [Topic 2](#path/to/topic 'column') - Brief description

  **Theological Tensions:**
  - [Counterpoint 1](#path/to/topic 'column') - Brief description
  - [Counterpoint 2](#path/to/topic 'column') - Brief description
  ```
- **Content replacement pattern**: Replace redundant full discussions with brief summaries (2-3 sentences) plus anchor link to comprehensive treatment

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

This is a static site with no build process. The dev server is managed by systemd as `systematic-theology.service` and starts automatically at Windows boot (via the existing `\Boot WSL at startup` Task Scheduler entry → WSL2 → systemd). **No manual startup is needed — it should already be running.** To check / control:
```bash
systemctl status systematic-theology.service
sudo systemctl restart systematic-theology.service   # after edits that need a server reload (rare — static files don't need it)
journalctl -u systematic-theology.service -f          # tail logs
```
The unit file is at `/etc/systemd/system/systematic-theology.service` and binds `127.0.0.1:8000` as user `david` with `Restart=always`. Then open: http://localhost:8000

**Port 8000 is also the backend for Tailscale HTTPS serving.** The Windows tailscale daemon runs a persistent `tailscale serve --https=443 http://localhost:8000` config that fronts this same port with a publicly trusted Let's Encrypt cert and exposes the site to the tailnet over HTTPS. Both the TLS side and the Python backend now survive reboots and WSL2 restarts. Don't tear down port 8000 casually if other devices on the tailnet are using the site.

**WSL2 networking note:** this machine runs WSL2 in `networkingMode=Mirrored` (see `/mnt/c/Users/David/.wslconfig`), so Windows and WSL2 share the network stack. Any Windows-side process binding port 8000 will conflict with the WSL2 systemd unit (and vice versa). If the service fails with `EADDRINUSE`, check the Windows side first: `/mnt/c/Windows/System32/netstat.exe -ano | grep :8000`.

**Self-loopback gotcha:** curl-ing the tailnet HTTPS hostname from inside WSL2 fails with "connection refused" — the 443 bind lives on the Windows tailscale virtual interface, which WSL2 can't route to directly. Test from another tailnet peer, from Windows (`/mnt/c/Windows/System32/curl.exe ...`), or just hit `http://127.0.0.1:8000/` locally. This is expected, not broken.

**Current exposure:** tailnet-private only. Public exposure via Tailscale Funnel or Cloudflare Tunnel was evaluated and deferred — we're keeping the site behind the tailnet for now. If that changes, Funnel is a one-command flip (same FQDN, reuses the existing `tailscale serve` config).

### Adding New Content

1. Create a new `.md` file in appropriate folder (e.g., `data/salvation/grace.md`)
2. Add YAML frontmatter with `title` (and optional `shortTitle`)
3. Add parent links in section 2
4. Write summary content in section 3 with inline `[links](#target 'column')`
5. Optionally add article content in section 4 for "more..." expansion
6. Add reciprocal links from related topics to create lattice connections
7. Refresh browser (no build step needed; cache disabled during development)

### Testing Navigation

- Use browser DevTools console to inspect `state` object
- URL hash should sync with `currentTopicId`
- History array should grow/shrink with forward/back navigation
- Arrow keys cycle through color-coded links by column type
- Duplicate links to the same target are outlined simultaneously

## Handout System

Handouts are printable/reference documents served through the same static shell as the HUD, but with a completely different CSS and no navigation UI.

### Architecture

- **Same shell**: `index.html` serves both HUD and handout views; no separate handout HTML
- **CSS switching**: `loadHandout()` in `js/app.js` replaces `css/style.css` with `css/handout.css` at runtime
- **CSS restoration**: When back-navigating from a handout, `init()` detects `handout.css` is active and restores `style.css`
- **hashchange listener**: `window.addEventListener('hashchange', init)` handles browser back/forward navigation between HUD and handouts

### Handout Files

Located in `handouts/` as plain markdown files (no YAML frontmatter, no HUD-specific syntax):
- `the-bible-about-the-bible.md` - Full treatment
- `the-bible-about-the-bible-condensed.md` - Condensed version
- `the-bible-about-the-bible-printable.md` - Short/printable version
- `living-word-closed-textbook.md` - Comparison handout

### Navigation Flow

**HUD → Handout:**
1. Handout links in topic markdown use path `handouts/filename.md` (e.g., in `data/bible/bible.md`)
2. Click handler detects `target.startsWith('handouts/')`, sets `window.location.href = '#handouts/...'` and calls `window.location.reload()`
3. On reload, `init()` detects hash starts with `handouts/`, calls `loadHandout(path)`
4. `loadHandout()` switches CSS, fetches and parses the markdown, renders to `#card-body`

**Handout → HUD (back button):**
1. Browser `hashchange` fires with previous HUD hash
2. `init()` runs, does NOT detect handout prefix
3. Detects `link[href*="handout.css"]` and restores `style.css`
4. Normal HUD initialization proceeds

### Handout CSS (`css/handout.css`)

- Black on white (#000000 / #ffffff), 8.5in max-width (letter paper)
- Hides all HUD elements: `.hud-header`, `.hud-footer`, `#breadcrumb-row`, `#nav-hint`, etc.
- Print-optimized: page-break rules, orphan/widow protection, blockquote styling for Scripture
- Typography: Atkinson Hyperlegible / Georgia serif, 11pt base

### Adding New Handouts

1. Create a `.md` file in `handouts/` using standard markdown (no HUD frontmatter)
2. Use `# Heading` for major sections
3. Use `> blockquote` for Scripture quotations
4. Link to it from relevant topic files: `[Label](#handouts/filename.md 'Drill')`

### Page Break Philosophy

Page breaks are explicit only — use `===` in markdown where you want a print page break (renders as a double-line rule on screen, `page-break-after: always` in print). Use `---` for visual section dividers that should not force a new page.

**Detailed vs. normal handouts:**
- **Detailed handouts** (comprehensive/every-verse coverage): `pneumatology.md`, `the-bible-about-the-bible.md`, `the-bible-about-the-bible-condensed.md`, `the-bible-about-the-bible-printable.md`
- **Normal handouts**: everything else

**Page break rules (applied during a dedicated page-break pass after content is complete):**

Note: `h1` is the document title only. Content sections begin at `h2`.

1. No major section should span more than one page.
   - Normal handouts: no `h2` section spans more than one page
   - Detailed handouts: no `h3` section spans more than one page
2. Break before an `h2` (or `h3` in detailed handouts), unless the next section fits on the current page without a break.
3. Maximize content per page. Minimize top-level sections that span multiple pages.

**Workflow:** During content development, `===` placement is a rough guess. A deliberate page-break pass happens after content is finalized — using the PDF generation and page analysis tools to verify layout and place `===` markers intentionally for the physical page-turning flow of a class.

**Page-break verification tools:**

Two scripts automate the page-break verification workflow. Always run these when adding, removing, or changing `===`/`---` markers — do not rely on source line counting, which is unreliable because blockquotes, blank lines, and line wrapping make printed length unpredictable.

1. **Generate PDF** (Puppeteer, headless Chrome):
   ```bash
   export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
   node scripts/handout-to-pdf.js handouts/pneumatology.md [output.pdf]
   ```
   - Requires the dev server running on localhost:8000 (the systemd unit)
   - Loads the handout via the same `#handouts/...` hash route the browser uses
   - Renders to Letter-size PDF with 0.4in margins (matches Chrome print dialog pagination)
   - Output defaults to `pdf/<filename>.pdf`

2. **Analyze page density** (pymupdf):
   ```bash
   source ~/ml-env/bin/activate
   python3 scripts/analyze-pdf-pages.py pdf/handouts_pneumatology.pdf
   ```
   - Reports per-page: character count, line count, fullness %, first heading
   - Warns on sparse pages (<25% full) that suggest a section is overflowing from the previous page
   - Warns on overfull pages (>95%) where content may be clipped
   - Reports total page count and whether it's even (for double-sided printing)
   - Exit code 1 if any warnings found

**Typical workflow:** Change `===` → `---` (or vice versa), run both scripts, check the analysis output. If a merged section overflows onto a near-empty next page (the analyzer will flag it as <25% full), revert that `---` back to `===`. Iterate until no sections span page boundaries unnecessarily.

**Pre-production page-break process:**

When a section overruns its page budget, attempt the following measures in order before introducing a new page break:

1. **Reword short-ending paragraphs.** If a commentary paragraph's last line contains 5 words or fewer, reword that paragraph so it fits in one fewer line. This reclaims space without changing meaning.
2. **Remove low-value details.** Cut details that provide little support to the overall theme of the handout. Prefer trimming elaborations, qualifications, or illustrative asides over core claims.
3. **Ellipsize biblical quotes (last resort).** Shorten Scripture quotations by ellipsizing less-relevant portions of the text (e.g. `"...the Spirit helps us in our weakness... the Spirit himself intercedes for us." (Rom 8:26)`). Never ellipsize in a way that changes the meaning of the passage.

If none of these measures achieve the layout goals, explain the specific problem sections to the user and ask for advice before making further changes.

**Further Study / reference section format:**
Use inline semicolon-separated references with a bold category header, not bullet lists. This maximizes density while keeping references readable:
```
**The Classical Case:** Augustine, *Confessions* Book XI (time as a creation of God); Boethius, *Consolation of Philosophy* Book V; Aquinas, *Summa Theologiae* I, Q. 10
```
Each category is one paragraph line. Apply this format to all reference/further-study sections in handouts.

**Double-sided printing:** Handouts are always printed double-sided, so aim for an even total page count. An odd page count wastes a blank back page. There is little practical difference between, say, 7 and 8 pages — so when a handout lands on an odd count, prefer adding a page (relaxing a break or expanding a section) over cutting one, unless cutting is clearly the better editorial choice.

**Optimal length evaluation:** Once an even page count is reached, ask: *"Can I express the same content in N−2 pages without losing anything important to the theme?"* If yes, continue cutting toward the shorter count using the same ordered measures above. Repeat until the answer is no — that is the optimal length. Only when the page count is optimal should `===` placement be finalized.

**Minimizing page-turns within sections:** After the optimal page count is confirmed, place `===` markers to minimize page-turns that occur mid-section. A reader should ideally be able to follow a top-level section without turning a page. When a section must span two pages, place the break at the most natural pause in the argument (between subsections, after a conclusion, before a new example), not mid-thought.

## GPU / ML Workloads

This machine IS the GPU server. Claude Code runs natively inside the WSL2 environment (Ubuntu 24.04), which owns the GPU, the ML tools, and the Python venv. No SSH, no `wsl bash -c` wrapper — just run commands directly.

### Hardware

- **OS:** Ubuntu 24.04 on WSL2 (Windows 11 host)
- **GPU:** RTX 4080 16GB (CUDA via WSL2 passthrough)
- **CPU:** Intel i7-14700K, 14 cores / 28 threads
- **RAM:** 46GB
- **Sudo:** Passwordless

### Running ML Commands

Activate the venv, then run Python directly. Backgrounding with `nohup ... & disown` works normally for long jobs:

```bash
source ~/ml-env/bin/activate && python3 /path/to/script.py
```

The RTX 4080 is fast enough (~3s/image for SDXL, <30s for short TTS) that most inference can run synchronously. For multi-minute TTS jobs, use `nohup` and poll the log.

### Installed Software

- Python 3.12 (venv at `~/ml-env` — always `source ~/ml-env/bin/activate` before running Python)
- CUDA Toolkit 12.8 (paths in `~/.bashrc`)
- PyTorch 2.11.0+cu128 (CUDA confirmed working)
- nvidia-smi at `/usr/lib/wsl/lib/nvidia-smi`
- Stable Diffusion XL (`stabilityai/stable-diffusion-xl-base-1.0` via `diffusers`, fp16, cached in `~/.cache/huggingface/`)
- Dia TTS (repo at `~/dia/`, pinned to commit `2811af1` pre-Dia2; installed with `--no-deps` to avoid torch downgrade)
- Tortoise TTS (separate venv at `~/tortoise-env/`; `transformers==4.31.0` with patched tokenizers version check)
- VibeVoice (repo at `~/VibeVoice/`, requires flash-attn)
- flash-attn 2.8.3 (compiled from source for CUDA 12.8)
- Dia2 TTS (repo at `~/dia2/`, uses its own `uv`-managed venv at `~/dia2/.venv/`; run via `cd ~/dia2 && .venv/bin/python3`)
- ElevenLabs TTS (cloud API, see below)
- ffmpeg 6.1.1 (system package, required by whisper/torchcodec/Dia2)

### ElevenLabs TTS

API key is stored in `$EL_API_KEY` (set in `~/.bashrc`). **Never commit the key or mention it in repo files** — reference only the environment variable name.

Pricing is per-character, so follow this graduated testing protocol:
1. **Start with minimal snippets** — one short sentence (< 50 chars) to validate API calls, voice selection, and audio format.
2. **Do not increase text length** until the user has listened and confirmed the output sounds human and natural. Only the user can judge audio quality.
3. **Ask the user before escalating** — explicitly ask "ready to try a longer passage?" before submitting more text. Each confidence level increase must be user-approved.
4. **Never submit the full 8-line panel script** until the user has approved shorter tests and given the go-ahead.

### Voice Casting Workflow

When the user asks to find voices or cast characters for a production:

1. **Ask** what each character's voice should sound like — they'll reference a previous production or give a natural-language description.
2. **Broad search** from `~/projects/eleven_labs/voices.db` using `search_voices.py` or direct SQL/FTS queries.
3. **Post-filter with judgment** — the DB labels don't index ethnicity/culture, so examine `name` + `description` fields for cultural, ethnic, and personality cues that structured labels can't capture (e.g. "Black Woman" in a description, African-sounding names, "southern" in names). Never just dump raw SQL results.
4. **Assign relevance scores (1–10)** to each candidate. Bump `professional` category voices slightly higher — they tend to be more natural/consistent than `high_quality` community voices.
5. **Add `match_note`** explaining why each voice was selected.
6. **Aim for ~25 results.** Be generous — include medium-relevance voices (score 5–6) the user might want for other reasons. Don't over-filter.
7. **Write results** to `voices/results.json` — the web UI at `/voices/` polls this file every 2s and auto-renders.
8. User listens to previews, copies `voice_id` via clipboard button, and pastes it back in chat to confirm selection.

**Voice DB location:** `~/projects/eleven_labs/voices.db` (SQLite + FTS5, ~6,200 English voices). Refresh with `python3 ~/projects/eleven_labs/fetch_voices.py` (requires `$EL_API_KEY`).

## Storyboard System

Storyboards are markdown scripts for AI-generated panel discussion videos. Four theological voices debate topics from the handouts, with verse slides shown on screen.

### Panel Voices

| ID | Role |
|----|------|
| `WRIGHT` | NT Wright — British academic, narrative theologian |
| `BT` | Baptist Theologian — careful exegete, confessional |
| `PT` | Pentecostal Theologian — passionate, Spirit-focused |
| `LAY` | "Baptacostal" Layperson — raised Baptist, Spirit-curious (audience surrogate) |

### Storyboard Format

Files in `storyboards/` using standard markdown with these conventions:
- **Slide callouts**: `> [!slide]` blockquotes with `background:` and `text:` fields
- **Generated images**: `![slide](images/filename.png)` after each slide callout — generated by SDXL with verse text composited via PIL
- **Speaker labels**: `**WRIGHT:**`, `**BT:**`, `**PT:**`, `**LAY:**` — rendered with color-coded CSS classes
- **Stage directions**: `[laughs]`, `[pause]`, etc. — rendered in gray italic
- **Equilibrium report**: Table at end tracking lines, words, initiations, concessions per speaker
- **No duration field**: Slide timing derived from TTS audio timestamps at runtime

See `storyboards/format-spec.md` for the full specification and a worked example.

### Rendering

Storyboards are routed through the same `loadHandout()` path as handouts (detected by `hash.startsWith('storyboards/')`). Additional processing for storyboard paths:
- `> [!slide]` blockquotes → `.slide-callout` dark panels with "SLIDE" label
- `**SPEAKER:**` → colored `.speaker-{id}` classes (green/blue/red/purple)
- `[laughs]` etc. → `.stage-direction` gray italic spans
- `<!-- comments -->` → `.storyboard-meta` visible metadata
- `![alt](src)` → `<img>` tags with path resolution relative to storyboard directory

### Video Pipeline (Planned)

1. **Script**: Claude writes storyboard markdown from handout source material
2. **Review**: User evaluates equilibrium, slide visuals, and dialogue in browser
3. **Images**: SDXL generates backgrounds on GPU server; PIL composites verse text
4. **Audio**: Multi-speaker TTS (Dia/VibeVoice/Tortoise) generates dialogue audio
5. **Video**: FFmpeg composites slide images + audio into MP4 with timed transitions

### Image Generation

Scripts live in `scripts/` and write directly to `storyboards/images/`. Run directly from WSL:

```bash
source ~/ml-env/bin/activate && python3 scripts/gen_bap_slides.py
```

SDXL settings: 800x448, 30 inference steps, guidance_scale 7.5, fp16. ~3 seconds per image on RTX 4080.

Negative prompt: `"text, words, letters, numbers, watermark, signature, bright saturated colors, neon, cartoon, anime, high key, white background"`

See `scripts/gen_bap_slides.py` for a complete working example including PIL text compositing.

**Important:** Never recomposite text onto an existing composited PNG — the text will double. The generation pipeline always runs SDXL → PIL text in a single pass, writing directly to `storyboards/images/`. If only text changes, re-run the full generation script rather than attempting to composite over the saved file.

## Key Files

- `index.html` - Static shell, injects content via JS
- `js/app.js` - All application logic, state management, rendering
- `data/**/*.md` - Content source (markdown files), defines lattice structure
- `css/style.css` - HUD styling, zero-scroll layout, color-coded navigation
- `css/handout.css` - Print/handout styling, black on white, hides HUD chrome, plus storyboard styles
- `handouts/**/*.md` - Printable handout source files
- `storyboards/format-spec.md` - Storyboard format specification and worked example
- `storyboards/images/` - SDXL-generated slide background images
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

When adding content or features:
- The Hebraic ↔ Hellenistic spectrum is a critical lens, not decoration
- The lattice structure is the core critique of tree-based theology, not just UX
- Content should support examination, not advocacy for one framework
- Capitalize God pronouns (He, His, Him) to reflect His personhood
- The Hebrew-Greek tension is about *how* we know God (relationship vs. definition), not *whether* He is personal
- **Preferred Bible translations:** ESV, NIV, NET, or AMP only. Do not use NKJV, KJV, NASB, NLT, MSG, or RSV in scripture quotations

### Accessibility vs. HUD Optimization

The primary target is smart glasses (HUD), but the site should remain:
- Keyboard navigable (already achieved)
- Screen-reader friendly (ensure semantic HTML when adding features)
- Clickable (touch works for testing on phones/tablets)

Don't sacrifice HUD constraints for desktop convenience—the zero-scroll, high-contrast design is the point.

### Content Organization Philosophy

**Consolidation over Fragmentation:**
The intro folder demonstrates the preferred approach—consolidated from 15+ files to 5 core files:
- `intro.md` - Overview and entry point
- `philosophy.md` - Greek method (essence, abstraction, propositions as three-step process)
- `narrative.md` - Hebrew narrative approach (includes events/acts)
- `relation.md` - Hebrew relational approach (includes covenant vs contract)
- `wrestling.md` - Hebrew interpretive method (includes hagah/meditation)

**When to consolidate:**
- Child pages should add significant independent value to justify standalone existence
- If content is brief or closely related, merge into parent or sibling page
- Use # and ## headings within articles to organize consolidated content
- Aim for depth over breadth in page structure

### Recent Changes & Current State

**Core Features:**
- Markdown-based content with color-coded inline links
- **Anchor navigation system**: Deep linking to specific sections within files
  - Syntax: `[text](#path#anchor 'column')` links to heading with `{#anchor}` ID
  - URL hash includes anchor (e.g., `#baptism/necessity#acts-2-38`)
  - Smooth scrolling to target section after page load
- **Redundancy reduction**: Primary treatment model with anchor cross-references
  - Comprehensive discussions in designated files with anchor IDs
  - Redundant sections replaced with brief summaries + anchor links
  - ~30% reduction in duplicate content across codebase
- **See Also sections**: Navigation aids at end of comprehensive files
  - Categorized cross-references (Deep Dives, Theological Tensions, etc.)
  - Helps readers explore interconnected topics in lattice structure
- Article expansion system (fourth section in markdown files)
- Dynamic font sizing to fit content in viewport
- Touch gesture support (swipe for navigation)
- Single-row header (breadcrumbs left, parents right)
- Fixed-width footer cells (20% each) to prevent shifting
- Link deduplication (same target = single cycle item, simultaneous outline)
- Heading support (# main, ## sub) for organized long-form content

**Design Decisions:**
- Removed spectrum slider visual (concept retained in link categorization)
- Removed separate navigation grid (links embedded in content)
- Zero-scroll constraint maintained throughout
- Keyboard-first interaction model (arrow keys, space, enter)
