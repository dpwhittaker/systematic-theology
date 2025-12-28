// Feature flags
const ENABLE_TOPIC_CACHE = false; // Set to true for production to cache topics in memory

// Page-level topic cache (persists across navigations)
const topicCache = {};

// State management
const state = {
    currentTopicId: 'intro/intro',
    focusedLinkIndex: -1, // Index of focused inline link (-1 = article mode)
    focusedParentIndex: -1, // Index of focused parent link (-1 = none)
    inlineLinks: [], // Array of {element, target, column} for navigation
    parentLinks: [], // Array of {element, target, column} for parent navigation (includes back link)
    history: [], // History of visited topics (max 6)
    loading: true,
    showingArticle: false,
    lastNavigationDirection: null // Track how we got to current page: 'hebrew', 'drill', 'greek', 'parent'
};

// DOM Elements
const els = {
    historyRow: document.getElementById('history-row'),
    parentRow: document.getElementById('parent-row'),
    cardBody: document.getElementById('card-body'),
    moreIndicator: document.getElementById('more-indicator')
};

// Debug logging
function debug(msg) {
    const panel = document.getElementById('debug-panel');
    if (panel) {
        panel.innerHTML += msg + '<br>';
        panel.scrollTop = panel.scrollHeight;
    }
    console.log(msg);
}


// Parse markdown file
async function loadTopic(id) {
    // Add timestamp to prevent caching in development
    const timestamp = ENABLE_TOPIC_CACHE ? '' : `?v=${Date.now()}`;
    const path = `data/${id}.md${timestamp}`;
    try {
        // When cache is disabled, bypass browser HTTP cache
        const fetchOptions = ENABLE_TOPIC_CACHE ? {} : { cache: 'no-cache' };
        const response = await fetch(path, fetchOptions);
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
            shortTitle: frontMatter.shortTitle || frontMatter.title,
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
    cardBody.classList.remove('scrollable');
    cardBody.style.fontSize = '';
    cardBody.style.overflowY = '';
    contentLines.forEach(line => line.style.fontSize = '');

    // Check if content overflows
    const isOverflowing = () => cardBody.scrollHeight > cardBody.clientHeight;

    // Try single-column configurations first (largest to smallest)
    const singleColumnConfigs = [
        { fontSize: '1.5rem', columns: 1 },
        { fontSize: '1.3rem', columns: 1 },
        { fontSize: '1.1rem', columns: 1 },
        { fontSize: '1.0rem', columns: 1 },
        { fontSize: '0.9rem', columns: 1 },
        { fontSize: '0.8rem', columns: 1 }
    ];

    // Try two-column configurations (only if they fit without scrolling)
    const twoColumnConfigs = [
        { fontSize: '1.5rem', columns: 2 },
        { fontSize: '1.3rem', columns: 2 },
        { fontSize: '1.1rem', columns: 2 },
        { fontSize: '1.0rem', columns: 2 },
        { fontSize: '0.9rem', columns: 2 }
    ];

    // First, try single-column configs
    for (const config of singleColumnConfigs) {
        cardBody.classList.remove('two-column');
        contentLines.forEach(line => {
            line.style.fontSize = config.fontSize;
        });
        cardBody.style.overflowY = 'hidden';

        if (!isOverflowing()) {
            // Found a single-column configuration that works!
            return;
        }
    }

    // If no single-column config fits, try two-column configs (only if they fit without scrolling)
    for (const config of twoColumnConfigs) {
        cardBody.classList.add('two-column');
        contentLines.forEach(line => {
            line.style.fontSize = config.fontSize;
        });
        cardBody.style.overflowY = 'hidden';

        if (!isOverflowing()) {
            // Found a two-column configuration that works without scrolling!
            return;
        }
    }

    // If nothing fits without scrolling, fall back to smallest single-column with scrolling
    cardBody.classList.remove('two-column');
    contentLines.forEach(line => {
        line.style.fontSize = '0.8rem';
    });
    cardBody.style.overflowY = 'auto';
    cardBody.classList.add('scrollable');
}

// Render
function render() {
    if (state.loading) return;

    const topic = topicCache[state.currentTopicId];
    if (!topic) return;

    // History row (last 6 topics, ending with current)
    // Special case: TOC page shows only its title, no history
    let historyToShow;
    if (state.currentTopicId === 'TOC') {
        historyToShow = ['TOC'];
    } else {
        // Filter out 'TOC' and 'intro/intro' from history (but keep if current page)
        const allHistory = [...state.history.slice(-5), state.currentTopicId];
        const isTopLevelCategory = topic.parentLinks.some(link => link.target === 'TOC');
        historyToShow = allHistory.filter(id => {
            // Always keep the current page
            if (id === state.currentTopicId) return true;
            // Filter out TOC from history breadcrumb
            if (id === 'TOC') return false;
            // Filter out intro/intro from history if current page is top-level
            if (id === 'intro/intro' && isTopLevelCategory) return false;
            return true;
        });
    }
    const historyItems = historyToShow.map((id, index) => {
        const t = topicCache[id];
        if (!t) return '';
        const isCurrent = id === state.currentTopicId;
        const isActive = state.focusedColumn === 'parent' && state.focusedLinkIndex === index;
        // Use full title for current page, shortTitle for history items
        const displayTitle = isCurrent ? t.title : t.shortTitle;
        return `<span class="history-item ${isCurrent ? 'current' : ''} ${isActive ? 'active' : ''}" data-index="${index}">${displayTitle}</span>`;
    }).join(' > ');
    els.historyRow.innerHTML = historyItems;

    // Parent row with back link
    let parentRowHTML = '';
    let backTarget = null;

    // Add back link if we have history (skip over TOC)
    if (state.history.length > 0) {
        // Find the last history item that isn't TOC
        const validHistory = state.history.filter(id => id !== 'TOC');
        if (validHistory.length > 0) {
            backTarget = validHistory[validHistory.length - 1];
            const backTopic = topicCache[backTarget];

            if (backTopic) {
                const isActive = state.focusedParentIndex === 0;
                parentRowHTML = `<span class="link parent back-link ${isActive ? 'active' : ''}" data-target="${backTarget}" data-column="parent" data-index="0">← ${backTopic.shortTitle}</span>`;

                if (topic.parentLinks.length > 0) {
                    parentRowHTML += ' | ';
                }
            }
        }
    }

    // Add regular parent links (exclude back target if it appears in parents)
    const filteredParentLinks = topic.parentLinks.filter(link => link.target !== backTarget);
    parentRowHTML += filteredParentLinks.map((link, index) => {
        // Offset index by 1 if we have a back link
        const actualIndex = state.history.length > 0 ? index + 1 : index;
        const isActive = state.focusedParentIndex === actualIndex;
        return `<span class="link parent ${isActive ? 'active' : ''}" data-target="${link.target}" data-column="parent" data-index="${actualIndex}">${link.label}</span>`;
    }).join(' | ');

    els.parentRow.innerHTML = parentRowHTML;

    // Build parent links array and add click handlers
    state.parentLinks = [];
    els.parentRow.querySelectorAll('.link').forEach((span, index) => {
        span.style.cursor = 'pointer';
        const direction = span.dataset.column;
        span.onclick = () => navigateTo(span.dataset.target, false, direction);
        state.parentLinks.push({
            element: span,
            target: span.dataset.target,
            column: direction,
            index: parseInt(span.dataset.index)
        });
    });

    // Add click handlers to history items
    els.historyRow.querySelectorAll('.history-item').forEach(span => {
        span.style.cursor = 'pointer';
        span.onclick = () => {
            const index = parseInt(span.dataset.index);
            const historyToShow = [...state.history.slice(-5), state.currentTopicId];
            if (index < historyToShow.length) {
                const targetId = historyToShow[index];
                state.history = state.history.slice(0, state.history.indexOf(targetId));
                navigateTo(targetId, true, null);
            }
        };
    });

    // Card body: render summary or article
    const contentToShow = state.showingArticle && topic.article ? topic.article : topic.summary;
    let processed = contentToShow;

    // First, convert headings to styled spans (## before # to avoid double-matching)
    processed = processed.replace(/^## (.+)$/gm, '<span class="heading-2">$1</span>');
    processed = processed.replace(/^# (.+)$/gm, '<span class="heading">$1</span>');

    // Then, convert markdown links to clickable spans with color classes
    processed = processed.replace(/\[([^\]]+)\]\(#([^\s)]+)(?:\s+'([^']+)')?\)/g, (match, text, target, column) => {
        const col = (column || 'Drill').toLowerCase();
        const columnClass = col === 'hebrew' ? 'hebrew' : col === 'greek' ? 'greek' : col === 'parent' ? 'parent' : 'drill';
        return `<span class="link ${columnClass}" data-target="${target}" data-column="${columnClass}">${text}</span>`;
    });

    // Then highlight *text* that isn't already in a link
    processed = processed.replace(/\*+([^*]+)\*+/g, '<span class="highlight">$1</span>');

    els.cardBody.innerHTML = processed.split('\n').map(line =>
        line.trim() ? `<div class="content-line">${line}</div>` : ''
    ).join('');

    // Build inline links array and add click handlers
    state.inlineLinks = [];
    els.cardBody.querySelectorAll('.link').forEach((span, index) => {
        span.style.cursor = 'pointer';
        const direction = span.dataset.column;
        span.onclick = () => navigateTo(span.dataset.target, false, direction);
        state.inlineLinks.push({
            element: span,
            target: span.dataset.target,
            column: span.dataset.column,
            index: index
        });
    });

    // Reset focused link
    state.focusedLinkIndex = -1;

    // Adjust font size to fit content
    fitContentToViewport();

    // Update more indicator
    updateMoreIndicator();
}

// Update the dynamic more indicator
function updateMoreIndicator() {
    const topic = topicCache[state.currentTopicId];
    if (!topic) return;

    // Determine what to show based on state
    // Keep indicator always visible (takes up space) to prevent layout shift
    if (state.focusedLinkIndex === -1 && state.focusedParentIndex === -1) {
        // Article mode - show "↵ more..." if article available, otherwise empty
        if (topic.hasArticle) {
            els.moreIndicator.textContent = '↵ more...';
            els.moreIndicator.style.cursor = 'pointer';
            els.moreIndicator.onclick = () => toggleArticle();
        } else {
            els.moreIndicator.textContent = '';
            els.moreIndicator.style.cursor = 'default';
            els.moreIndicator.onclick = null;
        }
    } else {
        // Link or parent focused - show "↵ Go"
        els.moreIndicator.textContent = '↵ Go';
        els.moreIndicator.style.cursor = 'default';
        els.moreIndicator.onclick = null;
    }
}

// Actions
async function navigateTo(id, skipHistory = false, direction = null) {
    // Check cache first if enabled, otherwise always reload
    let topic = ENABLE_TOPIC_CACHE ? topicCache[id] : null;

    if (!topic) {
        topic = await loadTopic(id);
        if (!topic) return;
        topicCache[id] = topic;
    }

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

    // Track navigation direction
    state.lastNavigationDirection = direction;

    state.currentTopicId = id;
    state.focusedLinkIndex = -1;
    state.focusedParentIndex = -1;
    state.showingArticle = false;
    window.location.hash = id;
    render();
}

function navigateBack() {
    // Up arrow cycles through parent links (including back link if present)
    if (state.parentLinks.length > 0) {
        if (state.focusedParentIndex === -1) {
            // First up press - focus first parent (might be back link)
            state.focusedParentIndex = 0;
            state.focusedLinkIndex = -1;
        } else {
            // Subsequent presses - cycle through parents, then back to article mode
            const nextIndex = state.focusedParentIndex + 1;
            if (nextIndex >= state.parentLinks.length) {
                // Reached the end, return to article mode
                state.focusedParentIndex = -1;
                state.focusedLinkIndex = -1;
            } else {
                state.focusedParentIndex = nextIndex;
                state.focusedLinkIndex = -1;
            }
        }
        updateActiveLinkHighlight();
        updateMoreIndicator();
    } else if (state.history.length > 0) {
        // No parents, navigate back in history
        const previousId = state.history[state.history.length - 1];
        state.history.pop();
        navigateTo(previousId, true, null);
    }
}

// Update active link highlighting
function updateActiveLinkHighlight() {
    // Remove active class from all links
    state.inlineLinks.forEach(link => link.element.classList.remove('active'));
    state.parentLinks.forEach(link => link.element.classList.remove('active'));

    // Add active class to focused inline link AND all links with same target
    if (state.focusedLinkIndex >= 0 && state.focusedLinkIndex < state.inlineLinks.length) {
        const focusedTarget = state.inlineLinks[state.focusedLinkIndex].target;
        state.inlineLinks.forEach(link => {
            if (link.target === focusedTarget) {
                link.element.classList.add('active');
            }
        });
    }

    // Add active class to focused parent link
    if (state.focusedParentIndex >= 0 && state.focusedParentIndex < state.parentLinks.length) {
        state.parentLinks[state.focusedParentIndex].element.classList.add('active');
    }
}

// Cycle through links by column type (includes back link)
function cycleLinks(columnFilter) {
    // First check if we have a back link that matches this direction
    const backLink = state.parentLinks.find(link => link.column === columnFilter && link.element.classList.contains('back-link'));

    // If we have a back link for this direction and nothing is focused, focus it first
    if (backLink && state.focusedLinkIndex === -1 && state.focusedParentIndex === -1) {
        state.focusedParentIndex = backLink.index;
        state.focusedLinkIndex = -1;
        updateActiveLinkHighlight();
        return;
    }

    // If back link is already focused, activate it
    if (backLink && state.focusedParentIndex === backLink.index) {
        // Already focused on back link, activate it
        activateCurrentLink();
        return;
    }

    // Otherwise cycle through inline links as before
    if (state.inlineLinks.length === 0) return;

    // Filter links by column, keeping only one index per unique target
    const seenTargets = new Set();
    const filteredIndices = state.inlineLinks
        .map((link, idx) => ({ link, idx }))
        .filter(item => {
            if (item.link.column !== columnFilter) return false;
            if (seenTargets.has(item.link.target)) return false;
            seenTargets.add(item.link.target);
            return true;
        })
        .map(item => item.idx);

    if (filteredIndices.length === 0) return;

    // Find current focused target in filtered list
    let currentFilteredIndex = -1;
    if (state.focusedLinkIndex >= 0) {
        const focusedTarget = state.inlineLinks[state.focusedLinkIndex].target;
        currentFilteredIndex = filteredIndices.findIndex(idx =>
            state.inlineLinks[idx].target === focusedTarget
        );
    }

    // Move to next link in this column, or back to article mode if at the end
    const nextFilteredIndex = currentFilteredIndex + 1;
    if (nextFilteredIndex >= filteredIndices.length) {
        // Reached the end, return to article mode
        state.focusedLinkIndex = -1;
        state.focusedParentIndex = -1;
    } else {
        state.focusedLinkIndex = filteredIndices[nextFilteredIndex];
        state.focusedParentIndex = -1;
    }

    updateActiveLinkHighlight();
    updateMoreIndicator();
}

function toggleArticle() {
    state.showingArticle = !state.showingArticle;
    render();
}

function activateCurrentLink() {
    // Check if a parent link is focused
    if (state.focusedParentIndex >= 0 && state.focusedParentIndex < state.parentLinks.length) {
        const link = state.parentLinks[state.focusedParentIndex];
        navigateTo(link.target, false, link.column);
    } else if (state.focusedLinkIndex >= 0 && state.focusedLinkIndex < state.inlineLinks.length) {
        // Check if an inline link is focused
        const link = state.inlineLinks[state.focusedLinkIndex];
        navigateTo(link.target, false, link.column);
    } else {
        // No link focused, toggle article if available
        const topic = topicCache[state.currentTopicId];
        if (topic && topic.hasArticle) {
            toggleArticle();
        }
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    // Check if content is scrollable
    const cardBody = els.cardBody;
    const isScrollable = cardBody && cardBody.classList.contains('scrollable');

    switch(e.key) {
        case "ArrowLeft":
            cycleLinks('hebrew');
            break;
        case "ArrowRight":
            cycleLinks('greek');
            break;
        case "ArrowDown":
            if (isScrollable) {
                // Scroll down instead of navigating
                e.preventDefault();
                cardBody.scrollBy({ top: 100, behavior: 'smooth' });
            } else {
                cycleLinks('drill');
            }
            break;
        case "ArrowUp":
            if (isScrollable) {
                // Scroll up instead of navigating
                e.preventDefault();
                cardBody.scrollBy({ top: -100, behavior: 'smooth' });
            } else {
                navigateBack();
            }
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

    // If target is inside scrollable content, allow native scrolling for vertical swipes
    const isInScrollableContent = target.closest('#card-body.scrollable');

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
                cycleLinks('greek');
            } else {
                // Swipe left
                cycleLinks('hebrew');
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            // If in scrollable content, don't navigate - let native scrolling handle it
            if (isInScrollableContent) {
                return;
            }

            if (deltaY > 0) {
                // Swipe down
                cycleLinks('drill');
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
        let topic = topicCache[currentId];
        if (!topic) {
            topic = await loadTopic(currentId);
            if (!topic) continue;
            topicCache[currentId] = topic;
        }

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

        const hashId = window.location.hash.replace('#', '') || 'intro/intro';

        if (hashId !== 'intro/intro') {
            // Build artificial history from intro/intro to this node
            const path = await findShortestPath('intro/intro', hashId);
            if (path && path.length > 1) {
                // path is [intro/intro, ..., hashId]
                // We want history to be [intro/intro, ..., parent_of_hashId]
                // So we exclude the last item (which will be the current topic)
                state.history = path.slice(0, -1);
                // Keep only last 6 in history
                if (state.history.length > 6) {
                    state.history = state.history.slice(-6);
                }
            }
        }

        await navigateTo(hashId, true, null);
    } catch (e) {
        console.error("Failed to load data", e);
        if (els.historyRow) els.historyRow.innerText = "ERROR LOADING DATA";
    }
}

// Start
init();
