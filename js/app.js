// State management
const state = {
    currentTopicId: 'intro',
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

    // Navigation Grid
    els.navGrid.innerHTML = '';
    if (topic.links) {
        topic.links.forEach((link, index) => {
            const div = document.createElement('div');
            div.className = `nav-item ${index === state.focusedLinkIndex ? 'active' : ''}`;
            div.innerText = `[${index === state.focusedLinkIndex ? 'x' : ' '}] ${link.label}`;
            div.onclick = () => activateLink(index);
            els.navGrid.appendChild(div);
        });
    }
}

// Actions
function navigateTo(id) {
    if (state.topics[id]) {
        state.history.push(state.currentTopicId);
        state.currentTopicId = id;
        state.focusedLinkIndex = 0; // Reset focus
        window.location.hash = id;
        render();
    }
}

function navigateBack() {
    if (state.history.length > 0) {
        state.currentTopicId = state.history.pop();
        state.focusedLinkIndex = 0;
        window.location.hash = state.currentTopicId;
        render();
    }
}

function moveFocus(delta) {
    const topic = state.topics[state.currentTopicId];
    if (!topic.links) return;
    
    const count = topic.links.length;
    state.focusedLinkIndex = (state.focusedLinkIndex + delta + count) % count;
    render();
}

function activateLink(index) {
    const topic = state.topics[state.currentTopicId];
    if (topic.links && topic.links[index]) {
        navigateTo(topic.links[index].target);
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case "ArrowRight":
            moveFocus(1);
            break;
        case "ArrowLeft":
            moveFocus(-1);
            break;
        case "ArrowDown":
            moveFocus(3); // Jump row in 3-col grid
            break;
        case "ArrowUp":
            // Check if we want to move focus up or nav back
            // For now, Up is Nav Back as per spec "UP: Immediately navigates to Parent"
            navigateBack();
            break;
        case " ":
        case "Enter":
            activateLink(state.focusedLinkIndex);
            break;
    }
});

// Start
init();