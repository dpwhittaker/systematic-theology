// State management
const state = {
    currentTopicId: 'intro',
    focusedColumn: 'detail', // 'hebraic', 'detail', or 'hellenistic'
    focusedLinkIndex: 0,
    topics: {}, // Map of id -> topic
    history: [], // For Back navigation
    loading: true
};

// DOM Elements
const els = {
    breadcrumb: document.getElementById('breadcrumb'),
    cardBody: document.getElementById('card-body'),
    spectrumIndicator: document.getElementById('spectrum-indicator'),
    moreIndicator: document.getElementById('more-indicator'),
    navGrid: document.getElementById('nav-grid')
};

// Init
async function init() {
    try {
        const response = await fetch('data/theology.json');
        const data = await response.json();
        
        // Index topics by ID
        data.topics.forEach(t => {
            state.topics[t.id] = t;
        });
        
        state.loading = false;
        
        // Load initial topic (from hash or default)
        const hashId = window.location.hash.replace('#', '');
        if (state.topics[hashId]) {
            state.currentTopicId = hashId;
        }
        
        render();
    } catch (e) {
        console.error("Failed to load data", e);
        els.breadcrumb.innerText = "ERROR LOADING DATA";
    }
}

// Render
function render() {
    if (state.loading) return;

    const topic = state.topics[state.currentTopicId];
    if (!topic) return;

    // Header
    els.breadcrumb.innerText = `${topic.category} > ${topic.title}`;

    // Body Content
    els.cardBody.innerHTML = '';
    topic.content.forEach(line => {
        const p = document.createElement('div');
        p.className = 'content-line';
        if (topic.type === 'verse') p.classList.add('verse-text');
        
        // Markdown parsing: *text* -> <span class="highlight">text</span>
        const html = line.replace(/\*(.*?)\*/g, '<span class="highlight">$1</span>');
        p.innerHTML = topic.type === 'concept' ? `> ${html}` : html;
        
        els.cardBody.appendChild(p);
    });

    // Spectrum (-10 to 10 mapped to 0% to 100%)
    // -10 = 0%, 0 = 50%, 10 = 100%
    const spectrumPercent = ((topic.spectrum + 10) / 20) * 100;
    els.spectrumIndicator.style.left = `${Math.max(0, Math.min(100, spectrumPercent))}%`;

    // More Indicator
    els.moreIndicator.classList.toggle('hidden', !topic.hasArticle);

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
            const isActive = (col.name === state.focusedColumn && index === state.focusedLinkIndex);
            div.className = `nav-item ${isActive ? 'active' : ''}`;
            div.innerText = `[${isActive ? 'x' : ' '}] ${link.label}`;
            div.onclick = () => activateLinkInColumn(col.name, index);
            colDiv.appendChild(div);
        });

        els.navGrid.appendChild(colDiv);
    });
}

// Actions
function navigateTo(id) {
    if (state.topics[id]) {
        state.history.push(state.currentTopicId);
        state.currentTopicId = id;
        state.focusedColumn = 'detail'; // Reset to center column
        state.focusedLinkIndex = 0; // Reset focus
        window.location.hash = id;
        render();
    }
}

function navigateBack() {
    if (state.history.length > 0) {
        state.currentTopicId = state.history.pop();
        state.focusedColumn = 'detail';
        state.focusedLinkIndex = 0;
        window.location.hash = state.currentTopicId;
        render();
    }
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

    // Only switch if target column has links
    if (columnMap[column] && columnMap[column].length > 0) {
        state.focusedColumn = column;
        state.focusedLinkIndex = 0;
        render();
    }
}

function activateLinkInColumn(column, index) {
    const topic = state.topics[state.currentTopicId];
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

function activateCurrentLink() {
    activateLinkInColumn(state.focusedColumn, state.focusedLinkIndex);
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

// Browser button handlers
document.getElementById('btn-up')?.addEventListener('click', () => {
    navigateBack();
});

document.getElementById('btn-down')?.addEventListener('click', () => {
    if (state.focusedColumn === 'detail') {
        moveFocusInColumn(1);
    } else {
        switchColumn('detail');
    }
});

document.getElementById('btn-left')?.addEventListener('click', () => {
    if (state.focusedColumn === 'hebraic') {
        moveFocusInColumn(1);
    } else {
        switchColumn('hebraic');
    }
});

document.getElementById('btn-right')?.addEventListener('click', () => {
    if (state.focusedColumn === 'hellenistic') {
        moveFocusInColumn(1);
    } else {
        switchColumn('hellenistic');
    }
});

document.getElementById('btn-ok')?.addEventListener('click', () => {
    activateCurrentLink();
});

// Start
init();