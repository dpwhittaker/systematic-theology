// State management
const state = {
    currentTopicId: 'intro',
    focusedColumn: 'article', // 'article', 'parent', 'hebraic', 'detail', or 'hellenistic'
    focusedLinkIndex: 0,
    topics: {}, // Map of id -> topic
    history: [], // History of visited topics (max 6)
    loading: true,
    showingArticle: false
};

// DOM Elements
const els = {
    historyRow: document.getElementById('history-row'),
    parentRow: document.getElementById('parent-row'),
    cardBody: document.getElementById('card-body'),
    spectrumIndicator: document.getElementById('spectrum-indicator'),
    moreIndicator: document.getElementById('more-indicator'),
    navGrid: document.getElementById('nav-grid')
};

// Parse markdown file
async function loadTopic(id) {
    const path = `data/${id}.md`;
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        const text = await response.text();

        // Split by ---
        const sections = text.split(/^---$/m).map(s => s.trim());

        // Remove first empty section (before first ---)
        if (sections[0] === '') sections.shift();

        if (sections.length < 3) throw new Error(`Invalid format in ${path}: only ${sections.length} sections found`);

        // Parse YAML front matter
        const frontMatter = {};
        sections[0].split('\n').forEach(line => {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const key = match[1];
                const value = match[2];
                frontMatter[key] = isNaN(value) ? value : Number(value);
            }
        });

        // Extract links from markdown
        const extractLinks = (text, defaultColumn = 'Drill') => {
            const links = { parent: [], hebraic: [], detail: [], hellenistic: [] };
            const linkRegex = /\[([^\]]+)\]\(#([^\s)]+)(?:\s+'([^']+)')?\)/g;
            let match;

            while ((match = linkRegex.exec(text)) !== null) {
                const label = match[1];
                const target = match[2];
                const column = (match[3] || defaultColumn).toLowerCase();

                const columnKey = column === 'parent' ? 'parent' :
                                 column === 'hebrew' ? 'hebraic' :
                                 column === 'greek' ? 'hellenistic' : 'detail';

                links[columnKey].push({ label, target });
            }

            return links;
        };

        const parentLinks = extractLinks(sections[1], 'Parent');
        const summaryLinks = extractLinks(sections[2], 'Drill');
        const articleLinks = sections[3] ? extractLinks(sections[3], 'Drill') : { parent: [], hebraic: [], detail: [], hellenistic: [] };

        // Merge links
        const mergeLinks = (a, b) => {
            return {
                parent: [...a.parent, ...b.parent],
                hebraic: [...a.hebraic, ...b.hebraic],
                detail: [...a.detail, ...b.detail],
                hellenistic: [...a.hellenistic, ...b.hellenistic]
            };
        };

        let allLinks = mergeLinks(parentLinks, summaryLinks);
        if (sections[3]) allLinks = mergeLinks(allLinks, articleLinks);

        // Remove duplicate parents
        allLinks.parent = allLinks.parent.filter((link, index, self) =>
            index === self.findIndex(l => l.target === link.target)
        );

        return {
            id,
            title: frontMatter.title,
            spectrum: frontMatter.spectrum || 0,
            parents: sections[1],
            summary: sections[2],
            article: sections[3] || '',
            hasArticle: !!sections[3],
            parentLinks: allLinks.parent,
            hebraicLinks: allLinks.hebraic,
            detailLinks: allLinks.detail,
            hellenisticLinks: allLinks.hellenistic
        };
    } catch (e) {
        console.error(`Error loading topic ${id}:`, e);
        return null;
    }
}

// Fit content to viewport by adjusting font size and layout
function fitContentToViewport() {
    const cardBody = els.cardBody;
    const contentLines = cardBody.querySelectorAll('.content-line');

    if (contentLines.length === 0) return;

    // Reset to defaults
    cardBody.classList.remove('two-column');
    cardBody.style.fontSize = '';
    contentLines.forEach(line => line.style.fontSize = '');

    // Check if content overflows
    const isOverflowing = () => cardBody.scrollHeight > cardBody.clientHeight;

    // Try different configurations, from best to worst
    const configs = [
        { fontSize: '1.5rem', columns: 1 },
        { fontSize: '1.3rem', columns: 1 },
        { fontSize: '1.5rem', columns: 2 },
        { fontSize: '1.1rem', columns: 1 },
        { fontSize: '1.3rem', columns: 2 },
        { fontSize: '1.0rem', columns: 1 },
        { fontSize: '1.1rem', columns: 2 },
        { fontSize: '0.9rem', columns: 1 },
        { fontSize: '1.0rem', columns: 2 },
        { fontSize: '0.8rem', columns: 1 }
    ];

    for (const config of configs) {
        // Apply configuration
        if (config.columns === 2) {
            cardBody.classList.add('two-column');
        } else {
            cardBody.classList.remove('two-column');
        }

        contentLines.forEach(line => {
            line.style.fontSize = config.fontSize;
        });

        // Check if it fits
        if (!isOverflowing()) {
            // Found a configuration that works!
            return;
        }
    }

    // If nothing works, use the smallest option (already applied)
}

// Render
function render() {
    if (state.loading) return;

    const topic = state.topics[state.currentTopicId];
    if (!topic) return;

    // History row (last 6 topics, ending with current)
    const historyToShow = [...state.history.slice(-5), state.currentTopicId];
    const historyItems = historyToShow.map((id, index) => {
        const t = state.topics[id];
        if (!t) return '';
        const isCurrent = id === state.currentTopicId;
        const isActive = state.focusedColumn === 'parent' && state.focusedLinkIndex === index;
        return `<span class="history-item ${isCurrent ? 'current' : ''} ${isActive ? 'active' : ''}" data-index="${index}">${t.title}</span>`;
    }).join(' > ');
    els.historyRow.innerHTML = historyItems;

    // Parent row
    const parentOffset = historyToShow.length;
    els.parentRow.innerHTML = topic.parentLinks.map((link, index) => {
        const isActive = state.focusedColumn === 'parent' && state.focusedLinkIndex === parentOffset + index;
        return `<span class="parent-item ${isActive ? 'active' : ''}" data-target="${link.target}" data-index="${parentOffset + index}">${link.label}</span>`;
    }).join(' | ');

    // Add click handlers to history items
    els.historyRow.querySelectorAll('.history-item').forEach(span => {
        span.style.cursor = 'pointer';
        span.onclick = () => {
            const index = parseInt(span.dataset.index);
            activateLinkInColumn('parent', index);
        };
    });

    // Add click handlers to parent items
    els.parentRow.querySelectorAll('.parent-item').forEach(span => {
        span.style.cursor = 'pointer';
        span.onclick = () => navigateTo(span.dataset.target);
    });

    // Spectrum Indicator
    const percent = ((topic.spectrum + 10) / 20) * 100;
    els.spectrumIndicator.style.left = `${percent}%`;

    // Card body: render summary or article
    const contentToShow = state.showingArticle && topic.article ? topic.article : topic.summary;
    let processed = contentToShow;

    // First, convert markdown links to clickable spans
    processed = processed.replace(/\[([^\]]+)\]\(#([^\s)]+)(?:\s+'[^']+')?\)/g, (match, text, target) => {
        return `<span class="highlight link" data-target="${target}">${text}</span>`;
    });

    // Then highlight *text* that isn't already in a link
    processed = processed.replace(/\*([^*]+)\*/g, '<span class="highlight">$1</span>');

    els.cardBody.innerHTML = processed.split('\n').map(line =>
        line.trim() ? `<div class="content-line">${line}</div>` : ''
    ).join('');

    // Add click handlers to link spans
    els.cardBody.querySelectorAll('.link').forEach(span => {
        span.style.cursor = 'pointer';
        span.onclick = () => navigateTo(span.dataset.target);
    });

    // Adjust font size to fit content
    fitContentToViewport();

    // More Indicator
    els.moreIndicator.classList.toggle('hidden', !topic.hasArticle);

    // Add click handler to more indicator
    els.moreIndicator.style.cursor = topic.hasArticle ? 'pointer' : 'default';
    els.moreIndicator.onclick = topic.hasArticle ? () => toggleArticle() : null;

    // Navigation Grid - 3 columns
    els.navGrid.innerHTML = '';

    const columns = [
        { name: 'hebraic', links: topic.hebraicLinks || [] },
        { name: 'detail', links: topic.detailLinks || [] },
        { name: 'hellenistic', links: topic.hellenisticLinks || [] }
    ];

    columns.forEach(col => {
        const colDiv = document.createElement('div');
        colDiv.className = 'nav-column';

        col.links.forEach((link, index) => {
            const div = document.createElement('div');
            const isActive = (state.focusedColumn !== 'article' && col.name === state.focusedColumn && index === state.focusedLinkIndex);
            div.className = `nav-item ${isActive ? 'active' : ''}`;
            div.innerText = `[${isActive ? 'x' : ' '}] ${link.label}`;
            div.onclick = () => activateLinkInColumn(col.name, index);
            colDiv.appendChild(div);
        });

        els.navGrid.appendChild(colDiv);
    });
}

// Actions
async function navigateTo(id, skipHistory = false) {
    const topic = state.topics[id] || await loadTopic(id);
    if (!topic) return;

    state.topics[id] = topic;

    if (!skipHistory && state.currentTopicId !== id) {
        // Check if target is in recent history (last 6)
        const recentHistory = [...state.history.slice(-5), state.currentTopicId];
        const indexInHistory = recentHistory.indexOf(id);

        if (indexInHistory >= 0) {
            // Target is in recent history - truncate history at that point (multi-back)
            const fullHistoryIndex = state.history.indexOf(id);
            if (fullHistoryIndex >= 0) {
                state.history = state.history.slice(0, fullHistoryIndex);
            }
        } else {
            // Target is new - add current to history
            if (!state.history.includes(state.currentTopicId)) {
                state.history.push(state.currentTopicId);
                if (state.history.length > 6) state.history.shift();
            }
        }
    }

    state.currentTopicId = id;
    state.focusedColumn = 'article';
    state.focusedLinkIndex = 0;
    state.showingArticle = false;
    window.location.hash = id;
    render();
}

function navigateBack() {
    // Up arrow now cycles through parent links
    const topic = state.topics[state.currentTopicId];
    if (!topic) return;

    const historyToShow = [...state.history.slice(-5), state.currentTopicId];
    const totalParentItems = historyToShow.length + topic.parentLinks.length;

    if (state.focusedColumn !== 'parent') {
        // Switch to parent column
        state.focusedColumn = 'parent';
        state.focusedLinkIndex = Math.max(0, historyToShow.length - 2); // Start at previous page
    } else {
        // Cycle through parent items
        state.focusedLinkIndex = (state.focusedLinkIndex + 1) % totalParentItems;
    }
    render();
}

function moveFocusInColumn(direction) {
    const topic = state.topics[state.currentTopicId];
    const columnMap = {
        'hebraic': topic.hebraicLinks || [],
        'detail': topic.detailLinks || [],
        'hellenistic': topic.hellenisticLinks || []
    };

    const currentLinks = columnMap[state.focusedColumn];
    if (!currentLinks || currentLinks.length === 0) return;

    const count = currentLinks.length;
    state.focusedLinkIndex = (state.focusedLinkIndex + direction + count) % count;
    render();
}

function switchColumn(column) {
    const topic = state.topics[state.currentTopicId];
    const columnMap = {
        'hebraic': topic.hebraicLinks || [],
        'detail': topic.detailLinks || [],
        'hellenistic': topic.hellenisticLinks || []
    };

    if (columnMap[column] && columnMap[column].length > 0) {
        state.focusedColumn = column;
        state.focusedLinkIndex = 0;
        render();
    }
}

function activateLinkInColumn(column, index) {
    const topic = state.topics[state.currentTopicId];

    if (column === 'parent') {
        const historyToShow = [...state.history.slice(-5), state.currentTopicId];
        if (index < historyToShow.length) {
            // Navigate to history item - truncate history at that point
            const targetId = historyToShow[index];
            state.history = state.history.slice(0, state.history.indexOf(targetId));
            navigateTo(targetId, true); // Skip adding to history
        } else {
            // Navigate to parent link
            const parentIndex = index - historyToShow.length;
            if (topic.parentLinks[parentIndex]) {
                navigateTo(topic.parentLinks[parentIndex].target);
            }
        }
        return;
    }

    const columnMap = {
        'hebraic': topic.hebraicLinks || [],
        'detail': topic.detailLinks || [],
        'hellenistic': topic.hellenisticLinks || []
    };

    const links = columnMap[column];
    if (links && links[index]) {
        navigateTo(links[index].target);
    }
}

function toggleArticle() {
    state.showingArticle = !state.showingArticle;
    render();
}

function activateCurrentLink() {
    if (state.focusedColumn === 'article') {
        const topic = state.topics[state.currentTopicId];
        if (topic && topic.hasArticle) {
            toggleArticle();
        }
    } else {
        activateLinkInColumn(state.focusedColumn, state.focusedLinkIndex);
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case "ArrowLeft":
            if (state.focusedColumn === 'hebraic') {
                moveFocusInColumn(1);
            } else {
                switchColumn('hebraic');
            }
            break;
        case "ArrowRight":
            if (state.focusedColumn === 'hellenistic') {
                moveFocusInColumn(1);
            } else {
                switchColumn('hellenistic');
            }
            break;
        case "ArrowDown":
            if (state.focusedColumn === 'detail') {
                moveFocusInColumn(1);
            } else {
                switchColumn('detail');
            }
            break;
        case "ArrowUp":
            navigateBack();
            break;
        case " ":
        case "Enter":
            e.preventDefault();
            activateCurrentLink();
            break;
    }
});

// Touch gesture handling
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 30; // minimum distance for a swipe

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    // If target is a link or clickable element, don't process as swipe
    const target = e.target;
    if (target.classList.contains('link') ||
        target.classList.contains('history-item') ||
        target.classList.contains('parent-item') ||
        target.classList.contains('nav-item') ||
        target.id === 'more-indicator') {
        return;
    }

    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if it's a tap (minimal movement)
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        // Tap anywhere = enter/ok
        activateCurrentLink();
        return;
    }

    // Determine if swipe is primarily horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe right
                if (state.focusedColumn === 'hellenistic') {
                    moveFocusInColumn(1);
                } else {
                    switchColumn('hellenistic');
                }
            } else {
                // Swipe left
                if (state.focusedColumn === 'hebraic') {
                    moveFocusInColumn(1);
                } else {
                    switchColumn('hebraic');
                }
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                // Swipe down
                if (state.focusedColumn === 'detail') {
                    moveFocusInColumn(1);
                } else {
                    switchColumn('detail');
                }
            } else {
                // Swipe up
                navigateBack();
            }
        }
    }
}, { passive: true });

// Fullscreen support
function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

// Request fullscreen on first user interaction
let fullscreenRequested = false;
document.addEventListener('click', () => {
    if (!fullscreenRequested) {
        fullscreenRequested = true;
        enterFullscreen();
    }
}, { once: true });

document.addEventListener('touchend', () => {
    if (!fullscreenRequested) {
        fullscreenRequested = true;
        enterFullscreen();
    }
}, { once: true });

// Find shortest path from one topic to another using BFS
async function findShortestPath(fromId, toId) {
    if (fromId === toId) return [fromId];

    const visited = new Set();
    const queue = [[fromId]]; // Queue of paths

    while (queue.length > 0) {
        const path = queue.shift();
        const currentId = path[path.length - 1];

        if (visited.has(currentId)) continue;
        visited.add(currentId);

        // Load the current topic
        const topic = state.topics[currentId] || await loadTopic(currentId);
        if (!topic) continue;
        state.topics[currentId] = topic;

        // Get all links from this topic
        const allLinks = [
            ...(topic.parentLinks || []),
            ...(topic.hebraicLinks || []),
            ...(topic.detailLinks || []),
            ...(topic.hellenisticLinks || [])
        ];

        for (const link of allLinks) {
            if (link.target === toId) {
                // Found the target!
                return [...path, toId];
            }

            if (!visited.has(link.target)) {
                queue.push([...path, link.target]);
            }
        }
    }

    // No path found
    return null;
}

// Init
async function init() {
    try {
        state.loading = false;

        const hashId = window.location.hash.replace('#', '') || 'intro';

        if (hashId !== 'intro') {
            // Build artificial history from intro to this node
            const path = await findShortestPath('intro', hashId);
            if (path && path.length > 1) {
                // path is [intro, ..., hashId]
                // We want history to be [intro, ..., parent_of_hashId]
                // So we exclude the last item (which will be the current topic)
                state.history = path.slice(0, -1);
                // Keep only last 6 in history
                if (state.history.length > 6) {
                    state.history = state.history.slice(-6);
                }
            }
        }

        await navigateTo(hashId, true);
    } catch (e) {
        console.error("Failed to load data", e);
        if (els.historyRow) els.historyRow.innerText = "ERROR LOADING DATA";
    }
}

// Start
init();
