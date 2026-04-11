/**
 * Storyboard Editor — inline editing for podcast storyboard markdown files.
 * Double-click to edit, click speaker to insert, media controls for generations.
 */
(function () {
  'use strict';

  const SPEAKERS = {
    HOST:   { cls: 'speaker-host',   color: '#6a1b9a' },
    WRIGHT: { cls: 'speaker-wright', color: '#2e7d32' },
    CREED:  { cls: 'speaker-creed',  color: '#1565c0' },
    CARRIE: { cls: 'speaker-carrie', color: '#c62828' },
  };

  const API = '/api';

  /* ── Parsing ────────────────────────────────────────────────── */

  function parse(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // HTML comment
      if (line.startsWith('<!--')) {
        blocks.push({ type: 'metadata', raw: line });
        i++; continue;
      }

      // Heading
      const hm = line.match(/^(#{1,3}) (.+)/);
      if (hm) {
        blocks.push({ type: 'heading', level: hm[1].length, text: hm[2].trim() });
        i++; continue;
      }

      // HR
      if (line.trim() === '---') {
        blocks.push({ type: 'hr' });
        i++; continue;
      }

      // Slide callout block — text field supports multiple lines
      if (line.startsWith('> [!slide]')) {
        let background = '';
        let textLines = [];
        let inText = false;
        i++;
        while (i < lines.length && lines[i].startsWith('> ')) {
          const bg = lines[i].match(/^> \*\*background:\*\*\s*(.*)/);
          const tx = lines[i].match(/^> \*\*text:\*\*\s*(.*)/);
          if (bg) { background = bg[1].trim(); inText = false; }
          else if (tx) { textLines.push(tx[1].trim()); inText = true; }
          else if (inText) { textLines.push(lines[i].substring(2)); }
          i++;
        }
        // Skip blanks
        while (i < lines.length && lines[i].trim() === '') i++;
        // Image line
        let image = null;
        if (i < lines.length) {
          const im = lines[i].match(/^!\[slide\]\(([^)]+)\)/);
          if (im) { image = im[1]; i++; }
        }
        blocks.push({ type: 'slide', background, text: textLines.join('\n'), image });
        continue;
      }

      // Audio line
      const am = line.match(/^!\[audio\]\(([^)]+)\)/);
      if (am) {
        blocks.push({ type: 'audio', src: am[1] });
        i++; continue;
      }

      // Dialogue line
      const dm = line.match(/^\*\*(\w+):\*\*\s*(.*)/);
      if (dm) {
        blocks.push({ type: 'dialogue', speaker: dm[1], text: dm[2] });
        i++; continue;
      }

      // Table block
      if (line.startsWith('|')) {
        const tl = [];
        while (i < lines.length && lines[i].startsWith('|')) { tl.push(lines[i]); i++; }
        blocks.push({ type: 'table', lines: tl });
        continue;
      }

      // Empty
      if (line.trim() === '') {
        blocks.push({ type: 'empty' });
        i++; continue;
      }

      // Other
      blocks.push({ type: 'text', content: line });
      i++;
    }
    return blocks;
  }

  /* ── Serialization ──────────────────────────────────────────── */

  function serialize(blocks) {
    const out = [];
    for (const b of blocks) {
      switch (b.type) {
        case 'metadata': out.push(b.raw); break;
        case 'heading':  out.push('#'.repeat(b.level) + ' ' + b.text); break;
        case 'hr':       out.push('---'); break;
        case 'slide': {
          out.push('> [!slide]');
          out.push('> **background:** ' + b.background);
          const tLines = b.text.split('\n');
          out.push('> **text:** ' + tLines[0]);
          for (let t = 1; t < tLines.length; t++) {
            out.push('> ' + tLines[t]);
          }
          out.push('');
          if (b.image) out.push('![slide](' + b.image + ')');
          break;
        }
        case 'audio':    out.push('![audio](' + b.src + ')'); break;
        case 'dialogue': out.push('**' + b.speaker + ':** ' + b.text); break;
        case 'table':    b.lines.forEach(l => out.push(l)); break;
        case 'empty':    out.push(''); break;
        case 'text':     out.push(b.content); break;
      }
    }
    return out.join('\n');
  }

  /* ── Rendering ──────────────────────────────────────────────── */

  let _blocks, _path, _container, _docDir;
  let _savedMarkdown = null;

  function render(blocks, path, container) {
    _blocks = blocks;
    _path = path;
    _container = container;
    _docDir = path.substring(0, path.lastIndexOf('/') + 1);

    container.innerHTML = '';
    container.classList.add('sb-editor-container');

    // Player launch link
    const launch = document.createElement('div');
    launch.className = 'player-launch';
    launch.innerHTML = '<a href="' + _docDir + 'player.html" target="_blank">Play Fullscreen</a>';
    container.appendChild(launch);

    blocks.forEach((block, idx) => {
      const el = renderBlock(block, idx);
      el.dataset.idx = idx;
      container.appendChild(el);
    });

    // Track saved state for dirty detection (reset when loading a new file)
    if (_path !== path) _savedMarkdown = null;
    if (_savedMarkdown === null) _savedMarkdown = serialize(blocks);

    // Save bar at bottom
    const bar = document.createElement('div');
    bar.className = 'sb-save-bar';
    bar.innerHTML =
      '<button class="sb-save-btn" id="sb-save">Save</button>' +
      '<button class="sb-commit-btn" id="sb-commit" disabled>Commit</button>' +
      '<span class="sb-save-status"></span>';
    container.appendChild(bar);
    document.getElementById('sb-save').addEventListener('click', doSave);
    document.getElementById('sb-commit').addEventListener('click', doCommit);
  }

  function rerender() {
    render(_blocks, _path, _container);
  }

  function renderBlock(block, idx) {
    const wrap = document.createElement('div');
    wrap.className = 'sb-block sb-' + block.type;

    switch (block.type) {

      case 'metadata': {
        const d = document.createElement('div');
        d.className = 'storyboard-meta';
        d.textContent = block.raw.replace(/^<!--\s*/, '').replace(/\s*-->$/, '');
        wrap.appendChild(d);
        break;
      }

      case 'heading': {
        const h = document.createElement('h' + block.level);
        h.textContent = block.text;
        h.addEventListener('dblclick', () => makeEditable(h, v => { block.text = v; }));
        wrap.appendChild(h);
        break;
      }

      case 'hr':
        wrap.appendChild(document.createElement('hr'));
        break;

      case 'slide': {
        const callout = document.createElement('div');
        callout.className = 'slide-callout';

        // Header row: label + controls
        const header = document.createElement('div');
        header.className = 'slide-header';
        header.innerHTML =
          '<span class="slide-label">Slide</span>' +
          '<div class="sb-media-controls">' +
            '<button class="sb-ctrl" data-dir="prev" title="Previous">&lsaquo;</button>' +
            '<button class="sb-ctrl sb-regen" data-dir="regen" title="Regenerate image">Regenerate</button>' +
            '<button class="sb-ctrl" data-dir="next" title="Next">&rsaquo;</button>' +
          '</div>';
        callout.appendChild(header);

        // Background field
        const bgRow = document.createElement('div');
        bgRow.className = 'slide-field';
        bgRow.innerHTML = '<strong>background:</strong> ';
        const bgVal = document.createElement('span');
        bgVal.className = 'sb-editable-value';
        bgVal.textContent = block.background;
        bgVal.addEventListener('dblclick', () => makeTextareaEditable(bgVal, block.background, v => {
          block.background = v;
        }));
        bgRow.appendChild(bgVal);
        callout.appendChild(bgRow);

        // Text field — render markdown, edit as raw
        const txRow = document.createElement('div');
        txRow.className = 'slide-field';
        txRow.innerHTML = '<strong>text:</strong> ';
        const txVal = document.createElement('span');
        txVal.className = 'sb-editable-value';
        txVal.innerHTML = renderInlineMd(block.text);
        txVal.addEventListener('dblclick', () => makeTextareaEditable(txVal, block.text, v => {
          block.text = v;
        }));
        txRow.appendChild(txVal);
        callout.appendChild(txRow);

        // Image preview
        if (block.image) {
          const img = document.createElement('img');
          img.className = 'slide-preview';
          img.src = _docDir + block.image;
          img.alt = 'slide';
          callout.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.className = 'slide-placeholder';
          ph.textContent = 'No image generated';
          callout.appendChild(ph);
        }

        // Wire media controls
        setupImageControls(header, block, callout);

        wrap.appendChild(callout);
        break;
      }

      case 'audio': {
        const row = document.createElement('div');
        row.className = 'sb-audio-row';

        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'none';
        audio.src = _docDir + block.src;
        row.appendChild(audio);

        const ctrls = document.createElement('div');
        ctrls.className = 'sb-media-controls';
        ctrls.innerHTML =
          '<button class="sb-ctrl" data-dir="prev" title="Previous">&lsaquo;</button>' +
          '<button class="sb-ctrl sb-regen" data-dir="regen" title="Regenerate audio">Regenerate</button>' +
          '<button class="sb-ctrl" data-dir="next" title="Next">&rsaquo;</button>';
        row.appendChild(ctrls);

        setupAudioControls(ctrls, block, audio);

        wrap.appendChild(row);
        break;
      }

      case 'dialogue': {
        const p = document.createElement('p');
        p.className = 'sb-dialogue';

        // Speaker label (clickable for insert)
        const spk = document.createElement('strong');
        const info = SPEAKERS[block.speaker] || { cls: '', color: '#666' };
        spk.className = info.cls + ' sb-speaker-label';
        spk.textContent = block.speaker + ':';
        spk.addEventListener('click', e => { e.stopPropagation(); showInsertMenu(spk, idx); });
        p.appendChild(spk);

        // Text (editable on dblclick)
        const txt = document.createElement('span');
        txt.className = 'sb-dialogue-text';
        txt.textContent = ' ' + block.text;
        txt.addEventListener('dblclick', () => makeEditable(txt, v => { block.text = v.trim(); }));
        p.appendChild(txt);

        wrap.appendChild(p);
        break;
      }

      case 'table': {
        let html = '<table class="equilibrium-table">';
        block.lines.forEach((line, li) => {
          if (line.match(/^\|[\s\-:|]+\|$/)) return;
          const cells = line.split('|').slice(1, -1).map(c => c.trim());
          const tag = li === 0 ? 'th' : 'td';
          html += '<tr>' + cells.map(c => '<' + tag + '>' + c + '</' + tag + '>').join('') + '</tr>';
        });
        html += '</table>';
        wrap.innerHTML = html;
        break;
      }

      case 'empty':
        break;

      case 'text': {
        const p = document.createElement('p');
        p.textContent = block.content;
        wrap.appendChild(p);
        break;
      }
    }

    return wrap;
  }

  /* ── Inline Editing ─────────────────────────────────────────── */

  /** Single-line contentEditable (for headings, dialogue text). */
  function makeEditable(el, onCommit) {
    if (el.isContentEditable) return;
    const original = el.textContent;
    el.contentEditable = 'true';
    el.classList.add('sb-editing');
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function commit() {
      el.contentEditable = 'false';
      el.classList.remove('sb-editing');
      const v = el.textContent;
      if (v !== original) { onCommit(v); updateCommitButton(); }
      el.removeEventListener('blur', commit);
      el.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      // Let Space, arrows, etc. work normally inside the editable
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { el.textContent = original; commit(); }
    }
    el.addEventListener('blur', commit);
    el.addEventListener('keydown', onKey);
  }

  /**
   * Textarea editor for slide fields — supports multiline, markdown, arrow keys, spaces.
   * Replaces the display element with a textarea; restores on commit.
   */
  function makeTextareaEditable(displayEl, rawValue, onCommit) {
    if (displayEl.querySelector('textarea')) return;

    const ta = document.createElement('textarea');
    ta.className = 'sb-field-textarea';
    ta.value = rawValue;
    // Auto-size: at least 1 row, grow with content
    ta.rows = Math.max(1, rawValue.split('\n').length);

    // Hide the display content, show textarea
    const origDisplay = displayEl.innerHTML;
    displayEl.innerHTML = '';
    displayEl.appendChild(ta);
    ta.focus();
    ta.select();

    function commit() {
      const v = ta.value;
      displayEl.innerHTML = '';
      if (v !== rawValue) {
        onCommit(v);
        displayEl.innerHTML = renderInlineMd(v);
        updateCommitButton();
      } else {
        displayEl.innerHTML = origDisplay;
      }
      ta.removeEventListener('blur', commit);
      ta.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      // All keys work inside textarea; only Escape cancels
      e.stopPropagation();
      if (e.key === 'Escape') {
        displayEl.innerHTML = origDisplay;
        ta.removeEventListener('blur', commit);
        ta.removeEventListener('keydown', onKey);
      }
    }

    ta.addEventListener('blur', commit);
    ta.addEventListener('keydown', onKey);
    // Auto-resize on input
    ta.addEventListener('input', () => {
      ta.rows = Math.max(1, ta.value.split('\n').length);
    });
  }

  /* ── Insert Menu ────────────────────────────────────────────── */

  let _menu = null;

  function closeMenu() {
    if (_menu) { _menu.remove(); _menu = null; }
    document.removeEventListener('click', closeMenu);
  }

  function showInsertMenu(anchor, blockIdx) {
    closeMenu();

    _menu = document.createElement('div');
    _menu.className = 'sb-insert-menu';

    const items = [
      { label: 'New Section', key: 'section' },
      null, // separator
      { label: 'HOST',   key: 'HOST' },
      { label: 'WRIGHT', key: 'WRIGHT' },
      { label: 'CREED',  key: 'CREED' },
      { label: 'CARRIE', key: 'CARRIE' },
    ];

    items.forEach(item => {
      if (!item) {
        const sep = document.createElement('div');
        sep.className = 'sb-menu-sep';
        _menu.appendChild(sep);
        return;
      }

      const row = document.createElement('div');
      row.className = 'sb-menu-row';

      const label = document.createElement('span');
      label.className = 'sb-menu-label';
      if (SPEAKERS[item.key]) {
        label.innerHTML = '<strong class="' + SPEAKERS[item.key].cls + '">' + item.label + '</strong>';
      } else {
        label.textContent = item.label;
      }
      row.appendChild(label);

      const before = document.createElement('button');
      before.className = 'sb-menu-btn';
      before.textContent = 'Before';
      before.addEventListener('click', e => { e.stopPropagation(); doInsert(blockIdx, item.key, 'before'); });
      row.appendChild(before);

      const after = document.createElement('button');
      after.className = 'sb-menu-btn';
      after.textContent = 'After';
      after.addEventListener('click', e => { e.stopPropagation(); doInsert(blockIdx, item.key, 'after'); });
      row.appendChild(after);

      _menu.appendChild(row);
    });

    // Delete option
    const delSep = document.createElement('div');
    delSep.className = 'sb-menu-sep';
    _menu.appendChild(delSep);

    const delRow = document.createElement('div');
    delRow.className = 'sb-menu-row';
    const delLabel = document.createElement('span');
    delLabel.className = 'sb-menu-label';
    delLabel.innerHTML = '<span style="color:#c62828">Delete this line</span>';
    delRow.appendChild(delLabel);
    const delBtn = document.createElement('button');
    delBtn.className = 'sb-menu-btn';
    delBtn.style.cssText = 'color:#c62828;border-color:#c62828';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeMenu();
      _blocks.splice(blockIdx, 1);
      updateCommitButton();
      rerender();
    });
    delRow.appendChild(delBtn);
    _menu.appendChild(delRow);

    const rect = anchor.getBoundingClientRect();
    _menu.style.left = rect.left + 'px';
    _menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    document.body.appendChild(_menu);

    setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 0);
  }

  function doInsert(atIdx, key, pos) {
    closeMenu();
    const insertAt = pos === 'before' ? atIdx : atIdx + 1;
    let newBlocks;

    if (key === 'section') {
      newBlocks = [
        { type: 'hr' },
        { type: 'empty' },
        { type: 'heading', level: 2, text: 'New Section' },
        { type: 'empty' },
        { type: 'slide', background: 'describe background here', text: 'Verse or title text', image: null },
        { type: 'empty' },
        { type: 'audio', src: 'audio/new-section.mp3' },
        { type: 'empty' },
        { type: 'dialogue', speaker: 'HOST', text: '[dialogue here]' },
        { type: 'empty' },
      ];
    } else {
      newBlocks = [
        { type: 'empty' },
        { type: 'dialogue', speaker: key, text: '[dialogue here]' },
      ];
    }

    _blocks.splice(insertAt, 0, ...newBlocks);
    rerender();
  }

  /* ── Media Controls (Image) ─────────────────────────────────── */

  function setupImageControls(header, block, callout) {
    if (!block.image) {
      // Only enable regenerate
      header.querySelectorAll('.sb-ctrl:not(.sb-regen)').forEach(b => b.disabled = true);
      header.querySelector('.sb-regen').addEventListener('click', () => regenImage(block, callout));
      return;
    }

    // Parse stem and extension
    const stem = block.image.replace(/\.[^.]+$/, '');
    const ext = block.image.match(/\.[^.]+$/)?.[0] || '.png';

    // State: list of generation paths and current index
    let gens = null;
    let genIdx = 0;

    async function loadGens() {
      if (gens !== null) return;
      try {
        const r = await fetch(API + '/list-generations?' + new URLSearchParams({
          dir: _docDir, stem: stem.split('/').pop(), ext
        }));
        if (r.ok) {
          const data = await r.json();
          gens = data.files; // array of filenames
          const current = block.image.split('/').pop();
          genIdx = gens.indexOf(current);
          if (genIdx < 0) genIdx = gens.length - 1;
        } else {
          gens = [block.image.split('/').pop()];
          genIdx = 0;
        }
      } catch {
        gens = [block.image.split('/').pop()];
        genIdx = 0;
      }
    }

    function updateImage() {
      const dir = block.image.substring(0, block.image.lastIndexOf('/') + 1);
      block.image = dir + gens[genIdx];
      const img = callout.querySelector('.slide-preview');
      if (img) img.src = _docDir + block.image;
    }

    header.querySelector('[data-dir="prev"]').addEventListener('click', async () => {
      await loadGens();
      if (genIdx > 0) { genIdx--; updateImage(); }
    });
    header.querySelector('[data-dir="next"]').addEventListener('click', async () => {
      await loadGens();
      if (genIdx < gens.length - 1) { genIdx++; updateImage(); }
    });
    header.querySelector('[data-dir="regen"]').addEventListener('click', () => regenImage(block, callout));
  }

  async function regenImage(block, callout) {
    const btn = callout.querySelector('.sb-regen');
    const origText = btn.textContent;
    btn.textContent = 'Generating...';
    btn.disabled = true;

    try {
      const r = await fetch(API + '/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          background: block.background,
          text: block.text,
          current: block.image,
          docDir: _docDir,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        block.image = data.path; // relative path like images/foo.v002.png
        const img = callout.querySelector('.slide-preview');
        if (img) {
          img.src = _docDir + block.image + '?t=' + Date.now();
        } else {
          // Replace placeholder
          const ph = callout.querySelector('.slide-placeholder');
          if (ph) {
            const newImg = document.createElement('img');
            newImg.className = 'slide-preview';
            newImg.src = _docDir + block.image;
            newImg.alt = 'slide';
            ph.replaceWith(newImg);
          }
        }
        btn.textContent = 'Done!';
        setTimeout(() => { btn.textContent = origText; }, 2000);
      } else {
        const err = await r.text();
        btn.textContent = 'Error';
        console.error('Image regen failed:', err);
        setTimeout(() => { btn.textContent = origText; }, 3000);
      }
    } catch (e) {
      btn.textContent = 'Server offline';
      console.error(e);
      setTimeout(() => { btn.textContent = origText; }, 3000);
    }
    btn.disabled = false;
  }

  /* ── Media Controls (Audio) ─────────────────────────────────── */

  function setupAudioControls(ctrls, block, audioEl) {
    const stem = block.src.replace(/\.[^.]+$/, '');
    const ext = block.src.match(/\.[^.]+$/)?.[0] || '.mp3';

    let gens = null;
    let genIdx = 0;

    async function loadGens() {
      if (gens !== null) return;
      try {
        const r = await fetch(API + '/list-generations?' + new URLSearchParams({
          dir: _docDir, stem: stem.split('/').pop(), ext
        }));
        if (r.ok) {
          const data = await r.json();
          gens = data.files;
          const current = block.src.split('/').pop();
          genIdx = gens.indexOf(current);
          if (genIdx < 0) genIdx = gens.length - 1;
        } else {
          gens = [block.src.split('/').pop()];
          genIdx = 0;
        }
      } catch {
        gens = [block.src.split('/').pop()];
        genIdx = 0;
      }
    }

    function updateAudio() {
      const dir = block.src.substring(0, block.src.lastIndexOf('/') + 1);
      block.src = dir + gens[genIdx];
      audioEl.src = _docDir + block.src;
      audioEl.play();
    }

    ctrls.querySelector('[data-dir="prev"]').addEventListener('click', async () => {
      await loadGens();
      if (genIdx > 0) { genIdx--; updateAudio(); }
    });
    ctrls.querySelector('[data-dir="next"]').addEventListener('click', async () => {
      await loadGens();
      if (genIdx < gens.length - 1) { genIdx++; updateAudio(); }
    });
    ctrls.querySelector('[data-dir="regen"]').addEventListener('click', async () => {
      const btn = ctrls.querySelector('.sb-regen');
      const origText = btn.textContent;
      btn.textContent = 'Rendering...';
      btn.disabled = true;

      try {
        // Collect all dialogue in this section (between prev and next audio/hr blocks)
        const sectionDialogue = collectSectionDialogue(_blocks, block);
        const r = await fetch(API + '/regenerate-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dialogue: sectionDialogue,
            current: block.src,
            docDir: _docDir,
            storyboardPath: _path,
          }),
        });
        if (r.ok) {
          const data = await r.json();
          block.src = data.path;
          audioEl.src = _docDir + block.src + '?t=' + Date.now();
          btn.textContent = 'Done!';
          setTimeout(() => { btn.textContent = origText; }, 2000);
        } else {
          btn.textContent = 'Error';
          setTimeout(() => { btn.textContent = origText; }, 3000);
        }
      } catch (e) {
        btn.textContent = 'Server offline';
        setTimeout(() => { btn.textContent = origText; }, 3000);
      }
      btn.disabled = false;
    });
  }

  /** Collect dialogue lines belonging to the same section as the given audio block. */
  function collectSectionDialogue(blocks, audioBlock) {
    // Find this audio block's index
    const audioIdx = blocks.indexOf(audioBlock);
    const lines = [];
    // Walk forward from the audio block until we hit another audio, hr, or end
    for (let i = audioIdx + 1; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === 'audio' || b.type === 'hr') break;
      if (b.type === 'dialogue') {
        lines.push({ speaker: b.speaker, text: b.text });
      }
    }
    return lines;
  }

  /* ── Save / Commit ───────────────────────────────────────────── */

  function updateCommitButton() {
    const btn = document.getElementById('sb-commit');
    if (!btn) return;
    const current = serialize(_blocks);
    btn.disabled = (current === _savedMarkdown);
  }

  async function doSave() {
    const status = _container.querySelector('.sb-save-status');
    status.textContent = 'Saving...';

    const markdown = serialize(_blocks);
    try {
      const r = await fetch(API + '/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: _path, content: markdown, commit: false }),
      });
      if (r.ok) {
        _savedMarkdown = markdown;
        status.textContent = 'Saved';
        updateCommitButton();
        setTimeout(() => { status.textContent = ''; }, 3000);
      } else {
        status.textContent = 'Error: ' + (await r.text());
      }
    } catch (e) {
      status.textContent = 'Save failed — server error';
    }
  }

  async function doCommit() {
    const status = _container.querySelector('.sb-save-status');
    const btn = document.getElementById('sb-commit');

    // Save first to make sure the file is up to date
    const markdown = serialize(_blocks);
    status.textContent = 'Saving & committing...';
    try {
      const r = await fetch(API + '/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: _path, content: markdown, commit: true }),
      });
      if (r.ok) {
        const data = await r.json();
        _savedMarkdown = markdown;
        status.textContent = data.message || 'Committed!';
        btn.disabled = true;
        setTimeout(() => { status.textContent = ''; }, 4000);
      } else {
        status.textContent = 'Error: ' + (await r.text());
      }
    } catch (e) {
      status.textContent = 'Commit failed — server error';
    }
  }

  /* ── Helpers ────────────────────────────────────────────────── */

  /** Render slide-text markdown to HTML for display.
   *  Supports: **bold**, *italic*, # headings, ---, and newlines. */
  function renderInlineMd(s) {
    return s.split('\n').map(line => {
      // Escape HTML
      line = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // HR
      if (line.trim() === '---') return '<hr class="slide-hr">';
      // Headings
      const hm = line.match(/^(#{1,3}) (.+)/);
      if (hm) {
        const lvl = hm[1].length;
        const txt = hm[2]
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return '<div class="slide-h' + lvl + '">' + txt + '</div>';
      }
      // Inline formatting
      line = line
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
      return line || '<br>';
    }).join('<br>');
  }

  /* ── Export ─────────────────────────────────────────────────── */

  window.StoryboardEditor = { parse, render, serialize };
})();
