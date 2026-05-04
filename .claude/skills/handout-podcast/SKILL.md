---
name: handout-podcast
description: Generate NotebookLM Audio Overview "podcasts" (deep-dive format) from a handout. First invocation creates a notebook and uploads the handout; every invocation generates one long and one medium audio overview, downloads them, and links them from the handout page and the handouts index. Subsequent invocations append new entries — never overwrite previous ones.
---

# Handout Podcast Generation

Generate two-host "deep dive" Audio Overviews from a handout via NotebookLM, then place them under `audio/<handout-slug>/` and link from `handouts/<name>.md` and `handouts/index.md`.

NotebookLM has no public API. Everything here runs through the live browser UI via the `mcp__claude-in-chrome__*` tools. Treat the UI selectors, button labels, and customize-flow as things to discover at runtime — they change. The shape of the output (file layout, manifest, web links) is what this skill commits to; the path to get there is whatever the current NotebookLM UI requires.

## Trigger

User invokes `/handout-podcast <handout-name>` or types something like:
- "make a podcast from heaven-hell-resurrection"
- "generate audio for the wrath-and-mercy handout"

`<handout-name>` is the basename without `.md` (e.g. `heaven-hell-resurrection`).

## Output contract

### File layout

```
audio/
  <handout-slug>/
    manifest.json
    deepdive-long-001.wav    (or .mp3 — whatever NotebookLM serves)
    deepdive-medium-001.wav
    deepdive-long-002.wav    (added on next invocation)
    deepdive-medium-002.wav
    ...
```

### Manifest format

`audio/<slug>/manifest.json`:

```json
{
  "handout": "heaven-hell-resurrection.md",
  "title": "Heaven, Hell, and Resurrection: Where Are We Going?",
  "notebook_url": "https://notebooklm.google.com/notebook/<id>",
  "entries": [
    {
      "kind": "deepdive-long",
      "file": "deepdive-long-001.wav",
      "generated_at": "2026-05-03T22:14:00Z",
      "duration_seconds": 1789,
      "customize_prompt": "..."
    }
  ]
}
```

### Handout-page link block

At the top of `handouts/<name>.md`, immediately after the H1 line and the one-paragraph subtitle, insert (or append to) an `## Audio Overviews` block:

```markdown
## Audio Overviews

- **Deep Dive (long)** — May 3, 2026 · ~30 min · [listen](../audio/<slug>/deepdive-long-001.wav)
- **Deep Dive (medium)** — May 3, 2026 · ~13 min · [listen](../audio/<slug>/deepdive-medium-001.wav)
```

If the section exists from a prior invocation, *prepend* the new entries (newest first), don't replace.

### Index page link

In `handouts/index.md`, append a 🎧 marker after the handout's bullet linking to its first long audio:

```markdown
- [Heaven, Hell, and Resurrection: Where Are We Going?](#handouts/heaven-hell-resurrection.md) — ... [🎧](../audio/heaven-hell-resurrection/deepdive-long-001.wav)
```

Only add the headphone marker once per handout — don't append a new emoji on each invocation.

## Steps

### 1. Validate inputs

- Confirm `handouts/<name>.md` exists.
- Read the title from the first H1 line.
- Compute slug = basename without `.md`.

### 2. Set up output directory

- `mkdir -p audio/<slug>`
- Read existing files; determine next sequence number `N` (highest existing + 1, or 001).
- If `audio/<slug>/manifest.json` exists, load it; otherwise initialize an empty manifest.

### 3. Browser session

Always start with `mcp__claude-in-chrome__tabs_context_mcp` to get fresh tab state. Then:

- **First invocation** (no `notebook_url` in manifest):
  - Navigate to `https://notebooklm.google.com/`
  - Click "Create new" / "+ Create" / whatever the current label is
  - Upload `handouts/<name>.md` as a source (drag-and-drop is brittle through the MCP — prefer the file-picker; use `mcp__claude-in-chrome__file_upload`)
  - Wait for the source to finish processing (NotebookLM shows a spinner / "Sources" count updates)
  - Capture the notebook URL from the address bar; save into manifest
- **Subsequent invocations**: navigate directly to the saved `notebook_url`. Confirm the source is still listed.

If Google login is required, the page will redirect to `accounts.google.com`. **Do not try to type credentials.** Stop and ask the user to sign in manually in the browser, then continue.

### 4. Generate the long deep dive

- Open the Audio Overview / Studio panel.
- Use the **Customize** option (don't accept defaults).
- Customize prompt: roughly *"Long, comprehensive deep dive of about 25-30 minutes. Cover every section. Don't rush. Spend significant time on the most contested theological points. Two-host conversational format."*
- Length setting: pick whatever is currently the longest option (e.g. "Longer" / "Long").
- Click Generate.
- Generation takes 8-15 minutes. **Use `ScheduleWakeup` with delaySeconds=600** (10 min) to come back. Don't poll in a tight loop. When you wake up, check status; if still generating, sleep again (delaySeconds=300).
- When complete: download the file. NotebookLM serves it as `.wav` via a direct link or an in-app download button.
- Save to `audio/<slug>/deepdive-long-NNN.<ext>`.

### 5. Generate the medium deep dive

Same flow as step 4, with:
- Customize prompt: *"Focused deep dive of about 12-15 minutes. Cover the central thesis and the key biblical passages. Skip exhaustive surveys; focus on the main argument. Two-host conversational format."*
- Length setting: "Default" / "Standard".
- Save to `audio/<slug>/deepdive-medium-NNN.<ext>`.

### 6. Update the manifest

Append both new entries with `generated_at`, `duration_seconds` (probe with `ffprobe` if available), `customize_prompt`, and the file name. Write back to `audio/<slug>/manifest.json` with stable formatting (2-space indent).

### 7. Update web links

- Edit `handouts/<name>.md`: insert/prepend the new audio entries under `## Audio Overviews`.
- Edit `handouts/index.md`: ensure a 🎧 link exists for this handout (idempotent — don't double-add).

### 8. Commit and push

```
git add audio/<slug>/ handouts/<name>.md handouts/index.md
git commit -m "add: audio overviews for <name> (round NNN)"
git push origin master
```

Audio files are tracked in git for now (small enough, served as static assets). If size becomes a problem, switch to git-lfs or a separate storage bucket — out of scope for this skill.

## Gotchas

- **The UI changes.** Selectors, button labels, panel layouts. Use `mcp__claude-in-chrome__read_page` and look at the actual DOM rather than guessing.
- **Generation is slow.** Always use `ScheduleWakeup` for the wait; don't burn cache polling.
- **Daily quota.** The free NotebookLM tier limits Audio Overview generations per day. If generation refuses, surface the error and stop — don't retry blindly.
- **Tab management.** Don't reuse tab IDs across sessions. Always fetch fresh context.
- **Modal dialogs lock the browser.** Don't click anything that triggers a confirm/alert. If you do, the MCP session is dead and the user has to dismiss it manually.
- **Audio files are large.** `.wav` files run 30-100 MB each. Don't try to read or transcribe them. Just place them.
- **Don't re-record.** If a generation fails partway, leave the existing files alone and start a new round with the next sequence number.

## When to stop and ask

- Login redirect appears.
- A captcha or 2FA prompt appears.
- Generation has been pending more than 30 minutes (something is wrong).
- The handout file is over NotebookLM's per-source size limit (currently around 200k words / 500k chars).
- The user invokes against a handout that doesn't exist.
- After 2-3 failed UI attempts on any single step (rabbit-hole guard).
