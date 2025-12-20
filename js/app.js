// State management
const state = {
    currentTopicIndex: 0,
    topics: [],
    loading: true
};

// DOM Elements
const els = {
    topicTitle: document.getElementById('topic-title'),
    viewMode: document.getElementById('view-mode'),
    breadcrumb: document.getElementById('breadcrumb'),
    contextDesc: document.getElementById('context-desc'),
    mainConcept: document.getElementById('main-concept'),
    detailsList: document.getElementById('details-list'),
};

// Init
async function init() {
    try {
        const response = await fetch('data/theology.json');
        const data = await response.json();
        state.topics = data.topics;
        state.loading = false;
        render();
    } catch (e) {
        console.error("Failed to load data", e);
        els.mainConcept.innerText = "Error Loading Data";
    }
}

// Render
function render() {
    if (state.loading) return;

    const topic = state.topics[state.currentTopicIndex];
    
    // Header
    els.topicTitle.innerText = topic.category;
    els.viewMode.innerText = topic.mindset || "GENERAL";

    // Context Panel
    els.breadcrumb.innerText = `SYSTEM > ${topic.category} > ${topic.title}`;
    els.contextDesc.innerText = `Perspective: ${topic.mindset}`;
    
    // Main
    els.mainConcept.innerText = topic.title;
    
    // List
    els.detailsList.innerHTML = '';
    topic.points.forEach((point, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerText = `> ${point.text}`;
        els.detailsList.appendChild(div);
    });
}

// Navigation
function nextTopic() {
    if (state.currentTopicIndex < state.topics.length - 1) {
        state.currentTopicIndex++;
        render();
    }
}

function prevTopic() {
    if (state.currentTopicIndex > 0) {
        state.currentTopicIndex--;
        render();
    }
}

// Input Handling
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case "ArrowRight":
        case " ":
            nextTopic();
            break;
        case "ArrowLeft":
            prevTopic();
            break;
    }
});

// Start
init();
