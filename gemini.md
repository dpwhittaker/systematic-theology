# Gemini Agent Context & Workflow

## Project Overview
*   **Purpose:** A dual-purpose platform serving as a "Research Notebook" for theological study and an "Interactive Teaching HUD" for smart glasses.
*   **Core Thesis:** Re-examining "Systematic Theology" through a Hebraic, concrete, and relational lens rather than the traditional Hellenistic, abstract framework.
*   **Key Features:**
    *   **HUD Interface:** Zero-scroll, high-contrast UI optimized for wearable displays (100vh/100vw).
    *   **Drill-Down Navigation:** Lattice structure allowing movement from high-level concepts to verse-by-verse evidence and historical context.
    *   **Tech Stack:** Static site (HTML/CSS/JS) with JSON/Markdown data sources.

## Workflow Management
To facilitate branching conversations and context preservation:
*   **Prompt Storage:** Every user prompt must be appended to `prompts.md`.
*   **Output Logging:** All agent text outputs (that are not direct file content generation) must be appended to `output.md`.
*   **State Persistence:** At the start of each turn, read `prompts.md` and `output.md` to re-establish the conversational context.

## Version Control
*   **Commit Strategy:** Every turn that results in file modification must end with a git commit.
*   **Branching:** Use git branches to isolate and explore different conversation threads or features.
*   **Pushing:** All commits must be pushed to the remote repository immediately.

## File Handling
*   `README.md`: Project introduction, core thesis, and feature list.
*   `design.md`: UX constraints (HUD), information architecture (Lattice), and design decisions.
*   `gemini.md`: This file. Agent operational guidelines and project context.
*   `prompts.md`: Append-only log of user inputs.
*   `output.md`: Append-only log of agent responses/summaries.
*   `data/`: Directory containing theological data (e.g., `theology.json`).
*   `css/`, `js/`: Frontend implementation files.

## Agent Instructions
*   **Conventions:** Follow the design constraints strictly (High Contrast, Zero Scroll, Keyboard Nav).
*   **Safety:** Prioritize system safety; explain critical shell commands.
*   **Verification:** Ensure HTML/CSS/JS is valid and functional.
*   **Workflow:** ALWAYS read context files first, log interactions, and commit/push changes.
