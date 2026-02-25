// Feature flags
const ENABLE_TOPIC_CACHE = false; // Set to true for production to cache topics in memory

// Page-level topic cache (persists across navigations)
const topicCache = {};

// State management
const state = {
    currentTopicId: 'intro/intro',
    currentAnchor: null, // Anchor within current topic (e.g., "greek-framework")
    focusedLinkIndex: -1, // Index of focused inline link (-1 = article mode)
    focusedParentIndex: -1, // Index of focused parent link (-1 = none)
    inlineLinks: [], // Array of {element, target, column, anchor} for navigation
    parentLinks: [], // Array of {element, target, column, anchor} for parent navigation (includes back link)
    history: [], // History of visited topics (max 6)
    breadcrumbPath: [], // Shortest path from TOC to current topic
    loading: true,
    showingArticle: false,
    lastNavigationDirection: null // Track how we got to current page: 'hebrew', 'drill', 'greek', 'parent'
};

// DOM Elements
const els = {
    historyRow: document.getElementById('history-row'),
    parentRow: document.getElementById('parent-row'),
    cardBody: document.getElementById('card-body')
};



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
                const fullTarget = match[2];
                const column = (match[3] || defaultColumn).toLowerCase();

                // Parse target into path and anchor: "path/to/file#anchor" or just "path/to/file"
                const anchorSplit = fullTarget.split('#');
                const target = anchorSplit[0];
                const anchor = anchorSplit[1] || null;

                const columnKey = column === 'parent' ? 'parent' :
                                 column === 'hebrew' ? 'hebraic' :
                                 column === 'greek' ? 'hellenistic' : 'detail';

                links[columnKey].push({ label, target, anchor });
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
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const contentLines = mainContent.querySelectorAll('.content-line');
    if (contentLines.length === 0) return;

    // Get header and footer heights
    const header = document.querySelector('.hud-header');
    const footer = document.querySelector('.hud-footer');
    const headerHeight = header ? header.offsetHeight : 0;
    const footerHeight = footer ? footer.offsetHeight : 0;

    // Available viewport height for content
    const availableHeight = window.innerHeight - headerHeight - footerHeight;

    // Reset to defaults
    mainContent.classList.remove('two-column');
    contentLines.forEach(line => line.style.fontSize = '');

    // Check if main content overflows available space
    const isOverflowing = () => {
        // Temporarily show content to measure
        const originalDisplay = mainContent.style.display;
        mainContent.style.display = 'block';
        const height = mainContent.scrollHeight;
        mainContent.style.display = originalDisplay;
        return height > availableHeight;
    };

    // Try single-column configurations first (largest to smallest)
    const singleColumnConfigs = [
        { fontSize: '2.0rem', columns: 1 },
        { fontSize: '1.8rem', columns: 1 },
        { fontSize: '1.5rem', columns: 1 },
        { fontSize: '1.3rem', columns: 1 },
        { fontSize: '1.1rem', columns: 1 },
        { fontSize: '1.0rem', columns: 1 },
        { fontSize: '0.9rem', columns: 1 },
        { fontSize: '0.8rem', columns: 1 }
    ];

    // Try two-column configurations
    const twoColumnConfigs = [
        { fontSize: '1.5rem', columns: 2 },
        { fontSize: '1.3rem', columns: 2 },
        { fontSize: '1.1rem', columns: 2 },
        { fontSize: '1.0rem', columns: 2 },
        { fontSize: '0.9rem', columns: 2 }
    ];

    // Helper to add padding to fill viewport
    const fillViewport = () => {
        // Get current height of main content
        const contentHeight = mainContent.scrollHeight;

        // Calculate remaining space
        const remainingSpace = availableHeight - contentHeight;

        if (remainingSpace > 0) {
            // Distribute remaining space as top and bottom padding
            const paddingTop = Math.floor(remainingSpace / 2);
            const paddingBottom = remainingSpace - paddingTop;
            mainContent.style.paddingTop = `${paddingTop}px`;
            mainContent.style.paddingBottom = `${paddingBottom}px`;
        }
    };

    // First, try single-column configs
    for (const config of singleColumnConfigs) {
        mainContent.classList.remove('two-column');
        mainContent.style.paddingTop = '';
        mainContent.style.paddingBottom = '';
        contentLines.forEach(line => {
            line.style.fontSize = config.fontSize;
        });

        if (!isOverflowing()) {
            // Found a single-column configuration that works!
            fillViewport();
            return;
        }
    }

    // If no single-column config fits, try two-column configs
    for (const config of twoColumnConfigs) {
        mainContent.classList.add('two-column');
        mainContent.style.paddingTop = '';
        mainContent.style.paddingBottom = '';
        contentLines.forEach(line => {
            line.style.fontSize = config.fontSize;
        });

        if (!isOverflowing()) {
            // Found a two-column configuration that works!
            fillViewport();
            return;
        }
    }

    // If nothing fits, fall back to smallest single-column
    mainContent.classList.remove('two-column');
    mainContent.style.paddingTop = '';
    mainContent.style.paddingBottom = '';
    contentLines.forEach(line => {
        line.style.fontSize = '0.8rem';
    });
    fillViewport();
}

// Render
function render() {
    if (state.loading) return;

    const topic = topicCache[state.currentTopicId];
    if (!topic) return;

    // Breadcrumb row (shortest path from TOC to current)
    // Special case: TOC page shows only its title
    let breadcrumbToShow;
    if (state.currentTopicId === 'TOC') {
        breadcrumbToShow = ['TOC'];
    } else {
        // Use the shortest path, but filter for display
        const isTopLevelCategory = topic.parentLinks.some(link => link.target === 'TOC');
        breadcrumbToShow = state.breadcrumbPath.filter(id => {
            // Always keep the current page
            if (id === state.currentTopicId) return true;
            // Filter out TOC from breadcrumb
            if (id === 'TOC') return false;
            // Filter out intro/intro from breadcrumb if current page is top-level category
            if (id === 'intro/intro' && isTopLevelCategory) return false;
            return true;
        });
    }
    const historyItems = breadcrumbToShow.map((id, index) => {
        const t = topicCache[id];
        if (!t) return '';
        const isCurrent = id === state.currentTopicId;
        const isActive = state.focusedColumn === 'parent' && state.focusedLinkIndex === index;
        // Use full title for current page, shortTitle for breadcrumb items
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
        const anchor = span.dataset.anchor || null;
        const target = span.dataset.target;

        // Check if this is a handout link
        if (target && target.startsWith('handouts/')) {
            // Handout link - reload page with handout hash
            span.onclick = () => {
                window.location.href = '#' + target;
                window.location.reload();
            };
        } else {
            // Regular topic link
            span.onclick = () => navigateTo(target, false, direction, anchor);
        }

        state.parentLinks.push({
            element: span,
            target: target,
            anchor: anchor,
            column: direction,
            index: parseInt(span.dataset.index)
        });
    });

    // Add click handlers to breadcrumb items
    els.historyRow.querySelectorAll('.history-item').forEach(span => {
        span.style.cursor = 'pointer';
        span.onclick = () => {
            const index = parseInt(span.dataset.index);
            if (index < breadcrumbToShow.length) {
                const targetId = breadcrumbToShow[index];
                navigateTo(targetId, false, null);
            }
        };
    });

    // Card body: render summary and article (if available)
    let mainContent = topic.summary;
    let articleContent = topic.article || '';

    // Helper function to process markdown content
    const processMarkdown = (content) => {
        let result = content;

        // First, extract and convert ```mermaid code blocks to div elements
        // Store them temporarily with placeholders to avoid processing their content
        const mermaidBlocks = [];
        result = result.replace(/```mermaid\n([\s\S]*?)```/g, (match, diagram) => {
            const placeholder = `___MERMAID_${mermaidBlocks.length}___`;
            mermaidBlocks.push(diagram.trim());
            return placeholder;
        });

        // Convert headings to styled spans with optional anchor IDs (### before ## before # to avoid double-matching)
        // Format: # Heading {#anchor-id} or just # Heading
        result = result.replace(/^### (.+?)(?:\s*\{#([^}]+)\}\s*)?$/gm, (match, text, anchor) => {
            return anchor ? `<span class="heading-3" id="${anchor}">${text}</span>` : `<span class="heading-3">${text}</span>`;
        });
        result = result.replace(/^## (.+?)(?:\s*\{#([^}]+)\}\s*)?$/gm, (match, text, anchor) => {
            return anchor ? `<span class="heading-2" id="${anchor}">${text}</span>` : `<span class="heading-2">${text}</span>`;
        });
        result = result.replace(/^# (.+?)(?:\s*\{#([^}]+)\}\s*)?$/gm, (match, text, anchor) => {
            return anchor ? `<span class="heading" id="${anchor}">${text}</span>` : `<span class="heading">${text}</span>`;
        });

        // Convert markdown links to clickable spans with color classes
        // Parse anchors from targets: #path#anchor becomes data-target="path" data-anchor="anchor"
        result = result.replace(/\[([^\]]+)\]\(#([^\s)]+)(?:\s+'([^']+)')?\)/g, (match, text, fullTarget, column) => {
            const col = (column || 'Drill').toLowerCase();
            const columnClass = col === 'hebrew' ? 'hebrew' : col === 'greek' ? 'greek' : col === 'parent' ? 'parent' : 'drill';
            const anchorSplit = fullTarget.split('#');
            const target = anchorSplit[0];
            const anchor = anchorSplit[1] || '';
            return `<span class="link ${columnClass}" data-target="${target}" data-anchor="${anchor}" data-column="${columnClass}">${text}</span>`;
        });

        // Highlight *text* that isn't already in a link
        result = result.replace(/\*+([^*]+)\*+/g, '<span class="highlight">$1</span>');

        // Restore mermaid blocks as div elements
        result = result.replace(/___MERMAID_(\d+)___/g, (match, index) => {
            const diagram = mermaidBlocks[parseInt(index)];
            return `<div class="mermaid-container"><div class="mermaid">${diagram}</div></div>`;
        });

        return result;
    };

    // Helper to split content preserving mermaid blocks
    const buildContentHTML = (content) => {
        // Extract mermaid containers to protect from line splitting
        const mermaidContainers = [];
        let protected = content.replace(/<div class="mermaid-container">[\s\S]*?<\/div><\/div>/g, (match) => {
            const placeholder = `___MERMAID_CONTAINER_${mermaidContainers.length}___`;
            mermaidContainers.push(match);
            return placeholder;
        });

        // Split by lines and wrap in content-line divs
        let html = protected.split('\n').map(line => {
            line = line.trim();
            if (!line) return '';

            // Check if this line contains a mermaid placeholder
            if (line.includes('___MERMAID_CONTAINER_')) {
                return line; // Don't wrap placeholders
            }
            return `<div class="content-line">${line}</div>`;
        }).join('');

        // Restore mermaid containers
        html = html.replace(/___MERMAID_CONTAINER_(\d+)___/g, (match, index) => {
            return mermaidContainers[parseInt(index)];
        });

        return html;
    };

    // Process main content
    let processed = processMarkdown(mainContent);

    // Process article content if available
    let processedArticle = '';
    if (articleContent) {
        processedArticle = processMarkdown(articleContent);
    }

    // Build HTML with main content, separator, and article
    let html = '<div id="main-content">';
    html += buildContentHTML(processed);
    html += '</div>';

    if (processedArticle) {
        html += '<div id="article-separator"></div>';
        html += '<div id="article-content">';
        html += buildContentHTML(processedArticle);
        html += '</div>';
    }

    els.cardBody.innerHTML = html;

    // Render Mermaid diagrams if mermaid is available
    if (window.mermaid && els.cardBody.querySelectorAll('.mermaid').length > 0) {
        window.mermaid.run({
            nodes: els.cardBody.querySelectorAll('.mermaid')
        }).catch(err => console.error('Mermaid rendering error:', err));
    }

    // Build inline links array and add click handlers
    state.inlineLinks = [];
    els.cardBody.querySelectorAll('.link').forEach((span, index) => {
        span.style.cursor = 'pointer';
        const direction = span.dataset.column;
        const anchor = span.dataset.anchor || null;
        const target = span.dataset.target;

        // Check if this is a handout link
        if (target && target.startsWith('handouts/')) {
            // Handout link - reload page with handout hash
            span.onclick = () => {
                window.location.href = '#' + target;
                window.location.reload();
            };
        } else {
            // Regular topic link
            span.onclick = () => navigateTo(target, false, direction, anchor);
        }

        state.inlineLinks.push({
            element: span,
            target: target,
            anchor: anchor,
            column: span.dataset.column,
            index: index
        });
    });

    // Reset focused link
    state.focusedLinkIndex = -1;

    // Update article indicator visibility
    updateArticleIndicator();

    // Adjust font size to fit content
    fitContentToViewport();
}

// Update article indicator visibility
function updateArticleIndicator() {
    const indicator = document.getElementById('article-indicator');
    const topic = topicCache[state.currentTopicId];

    if (indicator && topic) {
        // Show ellipsis if there's an article to scroll to
        indicator.style.display = topic.hasArticle ? 'flex' : 'none';
    }
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
async function navigateTo(id, skipHistory = false, direction = null, anchor = null) {
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
    state.currentAnchor = anchor;
    state.focusedLinkIndex = -1;
    state.focusedParentIndex = -1;
    state.showingArticle = false;

    // Update URL hash to include anchor if present
    window.location.hash = anchor ? `${id}#${anchor}` : id;

    // Calculate breadcrumb path (shortest path from TOC to current)
    if (id === 'TOC') {
        state.breadcrumbPath = ['TOC'];
    } else {
        const path = await findShortestPath('TOC', id);
        state.breadcrumbPath = path || [id];
    }

    render();

    // After render, scroll to anchor if present
    if (anchor) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            const anchorElement = document.getElementById(anchor);
            if (anchorElement) {
                anchorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
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

// Cycle through links (header and inline, only visible ones)
function cycleLinks(direction) {
    // Helper function to check if element is visible in viewport
    function isVisible(element) {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= viewportHeight &&
            rect.right <= viewportWidth
        );
    }

    // Collect all visible links (parent links first, then inline links)
    const allVisibleLinks = [];

    // Add visible parent links
    state.parentLinks.forEach((link, idx) => {
        if (isVisible(link.element)) {
            allVisibleLinks.push({
                type: 'parent',
                index: idx,
                target: link.target,
                element: link.element,
                top: link.element.getBoundingClientRect().top
            });
        }
    });

    // Add visible inline links (deduplicated by target)
    const seenTargets = new Set();
    state.inlineLinks.forEach((link, idx) => {
        if (isVisible(link.element) && !seenTargets.has(link.target)) {
            seenTargets.add(link.target);
            allVisibleLinks.push({
                type: 'inline',
                index: idx,
                target: link.target,
                element: link.element,
                top: link.element.getBoundingClientRect().top
            });
        }
    });

    if (allVisibleLinks.length === 0) return;

    // Sort by vertical position (top to bottom)
    allVisibleLinks.sort((a, b) => a.top - b.top);

    // Find current focused link in the visible list
    let currentIndex = -1;
    if (state.focusedParentIndex >= 0) {
        currentIndex = allVisibleLinks.findIndex(
            link => link.type === 'parent' && link.index === state.focusedParentIndex
        );
    } else if (state.focusedLinkIndex >= 0) {
        const focusedTarget = state.inlineLinks[state.focusedLinkIndex].target;
        currentIndex = allVisibleLinks.findIndex(
            link => link.type === 'inline' && link.target === focusedTarget
        );
    }

    // Move to next or previous link
    let nextIndex;
    if (direction === 'next') {
        nextIndex = currentIndex + 1;
        if (nextIndex >= allVisibleLinks.length) {
            // Wrap to beginning
            nextIndex = 0;
        }
    } else {
        // direction === 'prev'
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
            // Wrap to end
            nextIndex = allVisibleLinks.length - 1;
        }
    }

    // Update focus state based on link type
    const nextLink = allVisibleLinks[nextIndex];
    if (nextLink.type === 'parent') {
        state.focusedParentIndex = nextLink.index;
        state.focusedLinkIndex = -1;
    } else {
        state.focusedLinkIndex = nextLink.index;
        state.focusedParentIndex = -1;
    }

    updateActiveLinkHighlight();
}

function toggleArticle() {
    state.showingArticle = !state.showingArticle;
    render();
}

function activateCurrentLink() {
    // Check if a parent link is focused
    if (state.focusedParentIndex >= 0 && state.focusedParentIndex < state.parentLinks.length) {
        const link = state.parentLinks[state.focusedParentIndex];
        navigateTo(link.target, false, link.column, link.anchor);
    } else if (state.focusedLinkIndex >= 0 && state.focusedLinkIndex < state.inlineLinks.length) {
        // Check if an inline link is focused
        const link = state.inlineLinks[state.focusedLinkIndex];
        navigateTo(link.target, false, link.column, link.anchor);
    }
    // No action if no link is focused
}

// Input Handling
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case "ArrowLeft":
            e.preventDefault();
            cycleLinks('prev');
            break;
        case "ArrowRight":
            e.preventDefault();
            cycleLinks('next');
            break;
        case "ArrowDown":
            e.preventDefault();
            window.scrollBy({ top: 100, behavior: 'smooth' });
            break;
        case "ArrowUp":
            e.preventDefault();
            window.scrollBy({ top: -100, behavior: 'smooth' });
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
        target.classList.contains('nav-item')) {
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

    // Only handle horizontal swipes for link cycling
    // Vertical swipes are for native scrolling
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
            // Swipe right - next link
            cycleLinks('next');
        } else {
            // Swipe left - previous link
            cycleLinks('prev');
        }
    }
}, { passive: true });

// Fullscreen support
function toggleFullscreen() {
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
        // Enter fullscreen
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
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Update fullscreen button icon and re-render content based on fullscreen state
function updateFullscreenIcon() {
    const enterIcon = document.getElementById('fullscreen-icon');
    const exitIcon = document.getElementById('fullscreen-exit-icon');

    if (document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement) {
        // In fullscreen - show exit icon
        if (enterIcon) enterIcon.style.display = 'none';
        if (exitIcon) exitIcon.style.display = 'block';
    } else {
        // Not in fullscreen - show enter icon
        if (enterIcon) enterIcon.style.display = 'block';
        if (exitIcon) exitIcon.style.display = 'none';
    }

    // Re-render content to fit new viewport dimensions
    // Longer delay to ensure fullscreen transition has completed (especially on exit)
    setTimeout(() => {
        setContainerPadding();
        fitContentToViewport();
    }, 300);
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

// Attach fullscreen button click handler
function attachFullscreenHandler() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleFullscreen();
        });
        console.log('Fullscreen button handler attached');
    } else {
        console.error('Fullscreen button not found');
    }
}

// Try to attach immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachFullscreenHandler);
} else {
    attachFullscreenHandler();
}

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
// Set container padding to exact header/footer heights
function setContainerPadding() {
    const container = document.querySelector('.hud-container');
    const header = document.querySelector('.hud-header');
    const footer = document.querySelector('.hud-footer');

    if (container && header && footer) {
        const headerHeight = header.offsetHeight;
        const footerHeight = footer.offsetHeight;

        container.style.paddingTop = `${headerHeight}px`;
        container.style.paddingBottom = `${footerHeight}px`;
    }
}

// Load and render handout files (printable format)
async function loadHandout(path) {
    try {
        // Switch to handout CSS
        const existingLink = document.querySelector('link[href*="style.css"]');
        if (existingLink) {
            existingLink.href = 'css/handout.css';
        }

        // Fetch handout markdown
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        let markdown = await response.text();

        // Extract mermaid blocks before line-by-line parsing
        const mermaidBlocks = [];
        markdown = markdown.replace(/```mermaid\n([\s\S]*?)```/g, (match, diagram) => {
            const placeholder = `___HANDOUT_MERMAID_${mermaidBlocks.length}___`;
            mermaidBlocks.push(diagram.trim());
            return placeholder;
        });

        // Extract svg blocks before line-by-line parsing
        const svgBlocks = [];
        markdown = markdown.replace(/```svg\n([\s\S]*?)```/g, (match, svg) => {
            const placeholder = `___HANDOUT_SVG_${svgBlocks.length}___`;
            svgBlocks.push(svg.trim());
            return placeholder;
        });

        // Parse markdown line by line for better list handling
        const lines = markdown.split('\n');
        let html = '';
        let inList = false;
        let inBlockquote = false;
        let blockquoteContent = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Close blockquote if we're in one and hit a non-blockquote line
            if (inBlockquote && !line.startsWith('>')) {
                html += '<blockquote>' + blockquoteContent.join('<br>') + '</blockquote>\n';
                blockquoteContent = [];
                inBlockquote = false;
            }

            // Handle blockquotes
            if (line.startsWith('> ')) {
                if (!inBlockquote) {
                    inBlockquote = true;
                }
                blockquoteContent.push(line.substring(2));
                continue;
            }

            // Close list if we're in one and hit a non-list line (and it's not empty)
            if (inList && !line.match(/^[-*]\s/) && line.trim() !== '') {
                html += '</ul>\n';
                inList = false;
            }

            // Mermaid/SVG placeholders — pass through without wrapping
            if (line.includes('___HANDOUT_MERMAID_') || line.includes('___HANDOUT_SVG_')) {
                html += line + '\n';
            }
            // Headers
            else if (line.startsWith('### ')) {
                html += '<h3>' + line.substring(4) + '</h3>\n';
            } else if (line.startsWith('## ')) {
                html += '<h2>' + line.substring(3) + '</h2>\n';
            } else if (line.startsWith('# ')) {
                html += '<h1>' + line.substring(2) + '</h1>\n';
            }
            // Horizontal rules
            else if (line.trim() === '---') {
                html += '<hr>\n';
            }
            // List items
            else if (line.match(/^[-*]\s/)) {
                if (!inList) {
                    html += '<ul>\n';
                    inList = true;
                }
                html += '<li>' + line.substring(2) + '</li>\n';
            }
            // Empty lines
            else if (line.trim() === '') {
                html += '\n';
            }
            // Regular paragraphs
            else {
                html += '<p>' + line + '</p>\n';
            }
        }

        // Close any open tags
        if (inList) {
            html += '</ul>\n';
        }
        if (inBlockquote) {
            html += '<blockquote>' + blockquoteContent.join('<br>') + '</blockquote>\n';
        }

        // Now apply inline formatting
        html = html
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic (but not in blockquotes or list bullets)
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Restore mermaid blocks as div elements
        html = html.replace(/___HANDOUT_MERMAID_(\d+)___/g, (match, index) => {
            const diagram = mermaidBlocks[parseInt(index)];
            return `<div class="mermaid-container"><div class="mermaid">${diagram}</div></div>`;
        });

        // Restore svg blocks as raw SVG
        html = html.replace(/___HANDOUT_SVG_(\d+)___/g, (match, index) => {
            return `<div class="svg-container">${svgBlocks[parseInt(index)]}</div>`;
        });

        // Render to page
        els.cardBody.innerHTML = html;

        // Re-initialize mermaid with light theme for handouts, then render
        if (window.mermaid && els.cardBody.querySelectorAll('.mermaid').length > 0) {
            window.mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                themeVariables: {
                    primaryColor: '#e8e8e8',
                    primaryTextColor: '#000000',
                    primaryBorderColor: '#333333',
                    lineColor: '#333333',
                    secondaryColor: '#f0f0f0',
                    tertiaryColor: '#f8f8f8',
                    background: '#ffffff',
                    mainBkg: '#ffffff',
                    fontFamily: 'Atkinson Hyperlegible, Georgia, serif',
                    fontSize: '14px'
                }
            });
            window.mermaid.run({
                nodes: els.cardBody.querySelectorAll('.mermaid')
            }).catch(err => console.error('Mermaid rendering error:', err));
        }

    } catch (e) {
        console.error("Failed to load handout", e);
        els.cardBody.innerHTML = `<h1>Error</h1><p>Failed to load handout: ${e.message}</p>`;
    }
}

async function init() {
    try {
        const hash = window.location.hash.replace('#', '') || 'intro/intro';

        // Check if this is a handout request
        if (hash.startsWith('handouts/') || hash.startsWith('../handouts/')) {
            // Extract the handout filename
            const handoutPath = hash.replace(/^\.\.\//, '');
            await loadHandout(handoutPath);
            return;
        }

        // Restore HUD CSS if returning from a handout
        const handoutLink = document.querySelector('link[href*="handout.css"]');
        if (handoutLink) {
            handoutLink.href = 'css/style.css?v=' + Date.now();
        }

        // Normal HUD navigation
        // Set container padding based on actual header/footer sizes
        setContainerPadding();

        state.loading = false;

        // Parse hash into topicId and anchor: "path/to/file#anchor" or just "path/to/file"
        const anchorSplit = hash.split('#');
        const hashId = anchorSplit[0];
        const hashAnchor = anchorSplit[1] || null;

        // navigateTo will calculate the breadcrumb path and scroll to anchor
        await navigateTo(hashId, true, null, hashAnchor);
    } catch (e) {
        console.error("Failed to load data", e);
        if (els.historyRow) els.historyRow.innerText = "ERROR LOADING DATA";
    }
}

// Update container padding and content sizing on resize
window.addEventListener('resize', () => {
    setContainerPadding();
    fitContentToViewport();
});

// Re-initialize on browser back/forward navigation
window.addEventListener('hashchange', () => {
    init();
});

// Start
init();
