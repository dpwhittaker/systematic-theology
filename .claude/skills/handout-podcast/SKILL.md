---
name: handout-podcast
description: Generate NotebookLM Studio media (Audio Overviews, cinematic Video Overview, Editorial Infographic) from one or more handouts. Browser-driven via claude-in-chrome against an already-signed-in NotebookLM tab — NotebookLM has no public API. First invocation creates a notebook and adds the handout(s) as sources; each invocation generates the requested media, optionally downloads audio, and links it from the handout page and the handouts index. Append new entries — never overwrite previous ones.
---

# Handout Podcast / Studio-Media Generation

Generate NotebookLM Studio outputs from handout(s): two-host **Audio Overviews** (Deep Dive / Debate / Brief / Critique), a **cinematic Video Overview**, and an **Editorial Infographic**. Audio is downloaded, transcoded, placed under `audio/<slug>/`, and linked from `handouts/<name>.md` + `handouts/index.md`. Video/infographic stay in NotebookLM (no clean download path yet) and are linked by notebook URL.

NotebookLM has no public API. Everything runs through the live browser UI via `mcp__claude-in-chrome__*`. **UI selectors, button labels, and element refs change constantly — discover them at runtime with `find` / `read_page`, and re-`find` after every dialog reopen (refs renumber).** The output contract (file layout, manifest, web links) is what this skill commits to; the path through the UI is whatever the current NotebookLM requires.

## Trigger

`/handout-podcast <handout-name> [media...]` or "make a podcast from <handout>", "generate audio/video/infographic for <handout>". `<handout-name>` is the basename without `.md`. Multiple handouts can share one notebook (this session put both `women-in-family-and-ministry` and `active-bride-discussion` in one).

## Authentication — connect to an already-signed-in browser

**Do not try to authenticate `nlm`/Google yourself.** The reliable path is to drive a Chrome that is *already* logged into NotebookLM via the claude-in-chrome extension:

1. `mcp__claude-in-chrome__list_connected_browsers`.
2. **You must ask the user which browser to use** (the tool mandates it) — list every browser + the "open a confirmation screen in every connected Chrome" option. If they pick the broadcast option, call `switch_browser` (waits for them to click Connect); otherwise `select_browser` with the chosen deviceId.
3. `tabs_context_mcp` then `tabs_create_mcp` for a clean tab. Navigate to `https://notebooklm.google.com/`. Confirm the dashboard renders (notebook tiles, "Google Account: …"). If it redirects to `accounts.google.com`, **stop and ask the user to sign in** — never type credentials.

`nlm` CLI (`uv tool install notebooklm-mcp-cli`) is an *alternative* for scripted create/upload/download, but its auth is painful in this WSL2 setup: `nlm login` wants a local GUI Chrome (none in WSL2); `--wsl` launches the *Windows-host* Chrome (the user may not be at that desktop); CDP mode (`--cdp-url`) needs a debug Chrome exposed on the target host. If you ever get `nlm` authed, `nlm audio create` / `nlm download audio` are far less fiddly than the UI. Until then, drive the browser.

## Loading sources WITHOUT retyping (and the charset trap)

Handout files live on the WSL2 disk; the browser's file picker can't see them (native OS picker, undrivable). Don't paste by retyping either — it loses fidelity. Use the **tailnet raw-markdown URL + clipboard bridge**:

The dev server serves the repo over the tailnet at `https://desktop-uqt6i2t.tail9fb1cb.ts.net/theology/handouts/<name>.md` (reachable from any tailnet peer, including the user's browser host; **not** reachable from inside WSL2 itself, and **not** by NotebookLM's own URL-fetcher since the site is tailnet-private — so "Website" source won't work).

In a **second browser tab navigated to that raw-md URL** (same-origin fetch is allowed there; a fetch from the notebooklm.google.com tab is cross-origin and CORS-blocked):

```js
// CRITICAL: fetch + TextDecoder('utf-8'). Do NOT use document.body.innerText.
// The dev server sends .md without a charset, so the browser decodes Latin-1
// and every em-dash/Greek char becomes mojibake (— → â€", kephalē → kephalÄ").
const r = await fetch(location.href, {cache:'no-store'});
const t = (new TextDecoder('utf-8').decode(await r.arrayBuffer())).replace(/\s+$/,'') + '\n';
await navigator.clipboard.writeText(t);   // throws "Document is not focused"
```

`navigator.clipboard.writeText` fails with **"Document is not focused"** unless the tab has focus — do a `computer left_click` on the page body in the *same* batch right before the JS. Verify the result includes a real em-dash and no mojibake (`t.includes('—') && !t.includes('â€')`) before trusting it.

Then in the NotebookLM tab: **Add sources → "Copied text"** (the `Upload files` native picker is undrivable; "Website" can't reach the tailnet). Click the textarea, `ctrl+v`, screenshot to confirm the tail rendered with correct characters, click **Insert**. Repeat per handout.

> The old `cat handouts/x.md | clip.exe` trick mangles UTF-8 (clip.exe expects UTF-16LE) — same mojibake problem. The fetch+TextDecoder+clipboard.writeText path above is the fix and is verified.

NotebookLM auto-titles each source and auto-names the notebook from the first source. Capture the notebook URL (`notebook/<uuid>`, drop `?addSource=true`) into the manifest.

## Generating Studio media

The Studio panel (right) has tiles: Audio Overview, Slide Deck, Video Overview, Mind Map, Reports, Flashcards, Quiz, Infographic, Data Table. Each tile has a **sibling "Customize <X>" chevron button**.

⚠️ **Never click the tile body — it fires an instant, uncustomized default generation (a stray you'll have to delete).** Always open the chevron ("Customize Audio Overview" / "Customize Video Overview" / "Customize Infographic"). *(The previous version of this skill told you to click the tile for the "medium" entry — that was the bug. Don't.)*

⚠️ **Format/style selection by `ref` is unreliable.** Clicking a format radio via its `find` ref often does *not* move the selection (overlay transparency / ref mismap) — this bit hard on Debate and on the infographic style. Always **zoom the option row to confirm the checkmark moved**; if it didn't, click the option **tile by coordinate** and re-zoom. The instructions textarea, by contrast, is reliable via `form_input` on its ref.

**Custom-prompt convention.** Every prompt opens with a reusable lay-audience preamble, then the task:

> AUDIENCE: a live adult class of laypeople with NO theological or seminary training, from many Christian denominations. Be precise and serious but use only plain language any adult understands; define any unavoidable term (e.g. "exegesis," "complementarian") in one sentence. Assume no knowledge of Greek, church history, or theological labels. — *then the per-episode task.*

NotebookLM (PRO) **runs many generations concurrently** — audio + video + infographic all at once. Fire them all, don't wait between.

### Audio Overview

Open "Customize Audio Overview". Controls: **Format** (Deep Dive ✓default / Brief / Critique / **Debate**), **Length** (Short / Default / Long), **instructions textarea**, **Generate**. Per overview: re-`find` the four controls, click format (verify by zoom), click length, `form_input` the prompt, Generate. For **Debate**, expect the ref-click to miss — click the Debate tile by coordinate and confirm the ✓ before generating.

### Video Overview (cinematic)

Open "Customize Video Overview". Format: **Cinematic** (✓default, "rich, immersive… engaging visuals and storytelling") / Explainer / Brief. Fill the "How would you like the video customized?" textarea, confirm Cinematic ✓, Generate. Cinematic **takes a while** (often 15–25 min).

### Infographic (Editorial)

Open "Customize Infographic". Orientation (**Landscape** good for class/print / Portrait / Square), **visual style carousel** (Sketch Note / Anime / **Editorial** / Instructional / Bento Grid…), **Level of detail** (Concise / **Standard** / Detailed), description textarea. Editorial is the cleanest, most text-forward style for a theology framework. The style ref-click is unreliable → click the **Editorial thumbnail by coordinate**, zoom to confirm the ✓, then Generate.

## Output contract (audio)

```
audio/<handout-slug>/
  manifest.json
  deepdive-long-001.m4a
  deepdive-medium-001.m4a       (added on next invocation: -002, …)
```

`manifest.json`: `{handout, title, notebook_url, entries:[{kind, file, notebooklm_title, generated_at, duration_seconds, duration_human, length_setting, format, customize_prompt}]}`. For video/infographic, record entries with `kind:"video-cinematic"`/`"infographic-editorial"` and the `notebook_url` (no local file).

**Handout page** — after the H1 + subtitle, an `## Audio Overviews` block; **prepend** newest first on later rounds:
```markdown
## Audio Overviews
- **Deep Dive (long)** — May 4, 2026 · 56 min · [listen](audio/<slug>/deepdive-long-001.m4a)
```
⚠️ Path is `audio/...`, **not** `../audio/...`. The viewer renders at `/theology/#handouts/<name>.md`, so relative URLs resolve against `/theology/`; `../audio/...` → `/audio/...` → 404. `audio/...` → `/theology/audio/...` ✓.

**Index page** (`handouts/index.md`) — sub-bullets under the handout's bullet: 🎧 audio, 🎬 video, 🖼️ infographic. Append newest-first; don't re-add prior rounds.

## Download (audio) + transcode

Browser path: the completed entry's 3-dot **More → Download** lands in `/mnt/c/Users/David/Downloads/` (no save dialog; ignore the stray "Untitled" tab). Format is `.m4a`, filename from the auto-title. Disambiguate long vs medium by "View custom prompt" (only the custom one has it) or by duration. (`nlm download audio <notebook> <artifact-id>` if `nlm` is authed.)

**Transcode before commit** — raw exports are ~256 kbps stereo; a Long file can exceed GitHub's 100 MB limit:
```
ffmpeg -hide_banner -loglevel error -i in.m4a -ac 1 -b:a 64k -movflags +faststart out.m4a
```
Mono 64 kbps keeps spoken-word quality (~109 MB → ~28 MB). Verify duration unchanged with `ffprobe`.

Video downloads are large and have no clean UI download — leave video/infographic in NotebookLM and link by notebook URL unless the user asks otherwise.

## Wait → links → commit

`ScheduleWakeup` is `/loop`-only. In a normal session, **stop and ask the user to ping you in 15–20 min** (longer for video) — context survives between turns; don't poll. On return, navigate to the notebook URL; completed entries show a play button + duration. Then download/transcode audio, update `manifest.json`, edit `handouts/<name>.md` + `handouts/index.md`, and:
```
git add audio/<slug>/ handouts/<name>.md handouts/index.md && git commit -m "add: studio media for <name> (round NNN)" && git push
```

## Cleanup (stray default / mojibake source)

- **Stray default audio** (from an accidental tile-click): wait until titles render (all read "Generating…" identically until done), then identify the generic-titled one and delete it.
- **Mojibake source**: open the source; its body shows `â€"` / `kephalÄ"` if Latin-1-decoded. Re-add a clean one (fetch+TextDecoder), then delete the bad one.
- **Delete a source**: hover its row → kebab (3-dot) → **Remove source** → confirm **Delete**.

## Gotchas

- **Tile click = instant default.** Always use the "Customize <X>" chevron. (Was the #1 source of stray outputs.)
- **Format/style ref-clicks miss.** Verify the ✓ by zoom; fall back to clicking the tile/thumbnail by coordinate. Debate and Editorial both needed this.
- **Refs renumber on every dialog reopen** and **tab IDs change every session.** `tabs_context_mcp` first; re-`find` controls each open.
- **Charset/mojibake.** Always `fetch()+TextDecoder('utf-8')`; never `innerText`; never `clip.exe` for UTF-8. Verify em-dash present + no `â€` before pasting.
- **Clipboard needs focus.** `writeText` throws "Document is not focused" — `left_click` the page in the same batch first.
- **Cross-origin fetch is blocked** from the notebooklm tab; run the fetch in a tab that's *on* the tailnet origin. NotebookLM's own URL-fetcher can't reach tailnet-private content either.
- **Native file picker undrivable** — use "Copied text", not "Upload files".
- **Concurrent generations OK** (PRO) — fire all, don't serialize.
- **Generation is slow** — audio 5–15 min, cinematic video 15–25+ min. Don't poll; hand back to the user.
- **Daily quota** on lower tiers — if a generation refuses, surface the error and stop.
- **Modal JS dialogs kill the session** — never trigger a confirm/alert.
- **Range requests for audio streaming**: the static server must return `206 Partial Content` on `Range:` GETs or `<audio>`/`<video>` hang. Check `curl -s -D - -r 0-99 http://127.0.0.1:8000/audio/<file>.m4a` → expect `206`.

## When to stop and ask

Login/captcha/2FA prompt · generation pending >30 min · handout over NotebookLM's per-source limit (~500k chars) · handout doesn't exist · 2–3 failed UI attempts on one step (rabbit-hole guard) · which connected browser to use (always).
