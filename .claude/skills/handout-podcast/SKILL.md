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
    deepdive-long-001.m4a
    deepdive-medium-001.m4a
    deepdive-long-002.m4a    (added on next invocation)
    deepdive-medium-002.m4a
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
      "file": "deepdive-long-001.m4a",
      "notebooklm_title": "...",
      "generated_at": "2026-05-04T02:08:00Z",
      "duration_seconds": 3388,
      "duration_human": "56:28",
      "length_setting": "Long",
      "format": "Deep Dive",
      "customize_prompt": "..."
    }
  ]
}
```

### Handout-page link block

At the top of `handouts/<name>.md`, immediately after the H1 line and the one-paragraph subtitle, insert (or append to) an `## Audio Overviews` block:

```markdown
## Audio Overviews

- **Deep Dive (long)** — May 4, 2026 · 56 min · [listen](../audio/<slug>/deepdive-long-001.m4a)
- **Deep Dive (medium)** — May 4, 2026 · 23 min · [listen](../audio/<slug>/deepdive-medium-001.m4a)
```

If the section exists from a prior invocation, *prepend* the new entries (newest first), don't replace.

### Index page link

In `handouts/index.md`, append a 🎧 marker after the handout's bullet linking to its first long audio:

```markdown
- [Heaven, Hell, and Resurrection: Where Are We Going?](#handouts/heaven-hell-resurrection.md) — ... [🎧](audio/heaven-hell-resurrection/deepdive-long-001.m4a)
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

Always start with `mcp__claude-in-chrome__tabs_context_mcp` to get fresh tab state, then `tabs_create_mcp` to spawn a clean tab for this run. Don't reuse a tab the user already has open. Then:

- **First invocation** (no `notebook_url` in manifest):
  - Navigate to `https://notebooklm.google.com/`
  - Confirm logged-in state — the page will say "Google Account: …" with the user's email. If Google redirects to `accounts.google.com`, **stop and ask the user to sign in manually**. Don't try to type credentials.
  - Click "+ Create new" (top right). The button labelled "Create new notebook" on the empty-state tile sometimes doesn't trigger; the top-right button is more reliable.
  - URL becomes `notebook/<id>?addSource=true` and the source-upload modal opens.
  - **Upload the handout — do not use `Upload files`.** That button opens a native OS file picker that the MCP cannot drive (no `input[type=file]` is injected into the DOM). Use the **`Copied text`** path instead:
    1. Click the "Copied text" button in the source modal.
    2. Put the file on the Windows clipboard: `cat handouts/<name>.md | /mnt/c/Windows/System32/clip.exe`.
    3. Click into the textarea (find by query "Paste text here textarea" or label "Pasted text").
    4. Send `ctrl+v` via `mcp__claude-in-chrome__computer` `key` action.
    5. Click "Insert".
  - Wait ~5 seconds for processing. The page title will change from "Untitled notebook" to an auto-generated title derived from the content.
  - Capture the notebook URL from the address bar (`notebook/<uuid>`, drop the `?addSource=true`); save into manifest.
- **Subsequent invocations**: navigate directly to the saved `notebook_url`. Confirm the source is still listed.

### 4. Kick off both generations

The Studio panel on the right has tiles: Audio Overview, Slide Deck, Video Overview, Mind Map, Reports, Flashcards, Quiz, Infographic, Data Table. Each tile has a sibling "Customize" button (chevron/arrow icon).

⚠️ **Clicking the Audio Overview tile itself starts a default-length generation immediately**, with no customize step. To get the customize panel, click the *sibling* "Customize Audio Overview" button (one with the chevron / arrow), not the main tile.

NotebookLM allows multiple Audio Overview generations queued at once. The fastest path is to fire both in sequence and let them generate in parallel:

**Medium (default-length) overview:**
- Click the Audio Overview tile directly. This kicks off a default-length Deep Dive immediately. You'll see "Generating Audio Overview... Come back in a few minutes" appear in the studio panel.
- This is your **medium** entry. Default length runs ~10-15 min final audio.

**Long custom overview:**
- Click "Customize Audio Overview" (the chevron button next to the tile).
- Customize panel exposes:
  - **Format**: Deep Dive (default ✓), Brief, Critique, Debate. Keep Deep Dive.
  - **Choose language**: English (or appropriate).
  - **Length**: Short / Default / Long. Click **Long**.
  - **Focus prompt** ("What should the AI hosts focus on in this episode?"): paste a comprehensive prompt naming the contested theological points the handout covers — by name, so the hosts spend time on them. E.g. *"Comprehensive deep dive covering every section of the handout. Don't rush — spend significant time on [list specific contested points from this handout]. Walk through the major biblical passages slowly. Audience: thoughtful Christians, no formal seminary training. Two-host conversational format."*
- Click "Generate".
- A second "Generating Audio Overview..." entry appears in the studio panel.

Now both are queued. Generation takes 8-15 minutes each, running concurrently.

### 5. Wait for completion

⚠️ `ScheduleWakeup` only applies in `/loop` dynamic mode. In a regular interactive session, **stop and tell the user to ping you in 15-20 minutes**. Don't poll in a tight loop and don't burn cache trying to "wait" — your context survives quietly between user turns.

When the user pings you back: navigate to the notebook URL and check the Audio Overview entries in the studio panel. Completed entries change from "Generating Audio Overview..." to a play button + title + duration.

### 6. Download both files

For each completed Audio Overview:
- Click the entry's 3-dot "More" menu (next to the title in the studio panel).
- Click "Download" from the menu.
- The download lands in `/mnt/c/Users/David/Downloads/` automatically — no save dialog appears (Chrome routes downloads straight to the default folder). The MCP also opens an "Untitled" tab as a side effect; ignore it.
- File format is **`.m4a`** (NotebookLM doesn't serve `.wav`). Filename is derived from the auto-generated overview title (e.g. `Heaven_is_just_the_waiting_room.m4a`).
- Disambiguate which file is which: the "View custom prompt" menu item only appears on entries that had a custom prompt. Use that, or compare durations (custom-with-Long ~50 min; Default ~20 min).
- Move into place:
  ```
  mv "/mnt/c/Users/David/Downloads/<auto-title>.m4a" \
     "audio/<slug>/deepdive-{long,medium}-NNN.m4a"
  ```

**Transcode before committing.** NotebookLM exports at ~256 kbps stereo. The Long file commonly exceeds GitHub's 100 MB per-file push limit. Transcode to mono 64 kbps AAC, which preserves spoken-word quality and brings the typical Long overview from ~109 MB down to ~28 MB:

```
ffmpeg -hide_banner -loglevel error -i deepdive-long-001.m4a \
  -ac 1 -b:a 64k -movflags +faststart deepdive-long-001-compressed.m4a
mv deepdive-long-001-compressed.m4a deepdive-long-001.m4a
```

Apply the same to the medium file. Probe duration with `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 <file>` before/after — duration shouldn't change, only file size.

### 7. Update the manifest

Append both new entries with `generated_at`, `duration_seconds` (probe with `ffprobe` if available), `customize_prompt`, and the file name. Write back to `audio/<slug>/manifest.json` with stable formatting (2-space indent).

### 8. Update web links

- Edit `handouts/<name>.md`: insert/prepend the new audio entries under `## Audio Overviews`.
- Edit `handouts/index.md`: ensure a 🎧 link exists for this handout (idempotent — don't double-add).

### 9. Commit and push

```
git add audio/<slug>/ handouts/<name>.md handouts/index.md
git commit -m "add: audio overviews for <name> (round NNN)"
git push origin master
```

Audio files are tracked in git for now (small enough, served as static assets). If size becomes a problem, switch to git-lfs or a separate storage bucket — out of scope for this skill.

## Gotchas

- **The UI changes.** Selectors, button labels, panel layouts. Use `mcp__claude-in-chrome__read_page` and `find` to locate elements; don't hard-code refs.
- **Native file pickers can't be driven.** The "Upload files" button opens an OS picker the MCP can't see. Use the "Copied text" path with the Windows clipboard (`clip.exe`) instead.
- **Localhost fetches from notebooklm.google.com hang.** Mixed-content blocking + Chrome's localhost handling means a `fetch('http://127.0.0.1:8000/...')` from a Google page will time out the JavaScript bridge for 45+ seconds. Don't try.
- **Tile click ≠ customize.** Clicking the Audio Overview tile fires a default-length generation immediately. The customize panel only opens via the sibling "Customize Audio Overview" chevron button.
- **NotebookLM accepts parallel queued generations** — useful for firing the medium and long versions in one shot rather than waiting for the first to finish.
- **Generation is slow.** 8-15 min per overview. In an interactive session, stop and ask the user to ping you when it's likely done. `ScheduleWakeup` is only valid in `/loop` mode.
- **Daily quota.** The free NotebookLM tier limits Audio Overview generations per day. If generation refuses, surface the error and stop — don't retry blindly.
- **Tab management.** Don't reuse tab IDs across sessions. Always `tabs_context_mcp` first, then `tabs_create_mcp` for a fresh tab.
- **Modal dialogs lock the browser.** Don't click anything that triggers a JS confirm/alert. If you do, the MCP session is dead and the user has to dismiss it manually.
- **Audio files are large.** Raw NotebookLM exports run ~256 kbps stereo `.m4a` — a Long Deep Dive can hit 100+ MB and fail GitHub's per-file push limit. Always transcode to mono 64 kbps before commit (see step 6). Don't try to read or transcribe the audio; just place and transcode.
- **Don't re-record.** If a generation fails partway, leave the existing files alone and start a new round with the next sequence number.

## When to stop and ask

- Login redirect appears.
- A captcha or 2FA prompt appears.
- Generation has been pending more than 30 minutes (something is wrong).
- The handout file is over NotebookLM's per-source size limit (currently around 200k words / 500k chars).
- The user invokes against a handout that doesn't exist.
- After 2-3 failed UI attempts on any single step (rabbit-hole guard).
