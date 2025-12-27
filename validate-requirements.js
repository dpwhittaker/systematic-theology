// Validation script to check HUD requirements from CLAUDE.md
const fs = require('fs');
const path = require('path');

console.log('=== SYSTEMATIC THEOLOGY HUD - REQUIREMENTS VALIDATION ===\n');

// Read CSS file
const cssPath = path.join(__dirname, 'css/style.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

// Read HTML file
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

const results = {
    passed: [],
    failed: [],
    warnings: []
};

function check(requirement, condition, details = '') {
    if (condition) {
        results.passed.push(`✓ ${requirement}`);
        if (details) console.log(`  ${details}`);
    } else {
        results.failed.push(`✗ ${requirement}`);
        if (details) console.log(`  ${details}`);
    }
}

console.log('1. HIGH CONTRAST REQUIREMENTS\n');

// Check background color
const hasPureBlackBg = cssContent.includes('--bg-color: #000000');
check('Pure black background (#000000)', hasPureBlackBg,
    hasPureBlackBg ? 'Found: --bg-color: #000000' : 'Expected #000000');

// Check accent color
const hasGreenAccent = cssContent.includes('--accent-color: #00ff00');
check('Terminal green accent (#00ff00)', hasGreenAccent,
    hasGreenAccent ? 'Found: --accent-color: #00ff00' : 'Expected #00ff00');

// Check color-coded links
const hasYellowHebrew = cssContent.includes('.link.hebrew') && cssContent.includes('color: #ffdd00');
const hasGreenDrill = cssContent.includes('.link.drill') && cssContent.includes('color: #00ff00');
const hasCyanGreek = cssContent.includes('.link.greek') && cssContent.includes('color: #00ddff');
const hasMagentaParent = cssContent.includes('.link.parent') && cssContent.includes('color: #ff00ff');

check('Yellow Hebrew links (#ffdd00)', hasYellowHebrew);
check('Green Drill links (#00ff00)', hasGreenDrill);
check('Cyan Greek links (#00ddff)', hasCyanGreek);
check('Magenta Parent links (#ff00ff)', hasMagentaParent);

// Check orange highlights
const hasOrangeHighlight = cssContent.includes('.highlight') && cssContent.match(/\.highlight[^}]*color:\s*#ff8800/);
check('Orange non-link highlights (#ff8800)', hasOrangeHighlight);

console.log('\n2. ZERO SCROLLING REQUIREMENTS\n');

// Check overflow hidden on body
const hasOverflowHidden = cssContent.match(/body[^}]*overflow:\s*hidden/);
check('Body overflow: hidden', hasOverflowHidden);

// Check viewport units usage
const usesVhVw = cssContent.includes('vh') && cssContent.includes('vw');
check('Uses viewport units (vh/vw)', usesVhVw);

// Check 16:9 aspect ratio constraint
const has16x9Constraint = cssContent.includes('calc(100vh * 16 / 9)') || cssContent.includes('calc(100vw * 9 / 16)');
check('16:9 aspect ratio constraint', has16x9Constraint);

console.log('\n3. KEYBOARD-FIRST NAVIGATION\n');

// Check for navigation hints in HTML
const hasNavHints = htmlContent.includes('← Hebrew') &&
                    htmlContent.includes('↓ Drill') &&
                    htmlContent.includes('→ Greek') &&
                    htmlContent.includes('↑ Parent') &&
                    htmlContent.includes('↵ Go');
check('Navigation hints in footer', hasNavHints);

// Check for parent row
const hasParentRow = htmlContent.includes('id="parent-row"');
check('Parent navigation row', hasParentRow);

// Check for history row
const hasHistoryRow = htmlContent.includes('id="history-row"');
check('History breadcrumb row', hasHistoryRow);

console.log('\n4. TYPOGRAPHY & READABILITY\n');

// Check for Atkinson Hyperlegible font
const hasAtkinsonFont = htmlContent.includes('Atkinson+Hyperlegible');
check('Atkinson Hyperlegible font loaded', hasAtkinsonFont);

const usesAtkinsonFont = cssContent.includes("'Atkinson Hyperlegible'");
check('Atkinson Hyperlegible font applied', usesAtkinsonFont);

// Check for text-shadow on links (glanceability)
const hasTextShadow = cssContent.match(/\.link\.[a-z]+[^}]*text-shadow/g);
check('Text shadow on links for HUD clarity', hasTextShadow && hasTextShadow.length >= 4);

console.log('\n5. SPECTRUM INDICATOR\n');

// Check for spectrum track
const hasSpectrumTrack = htmlContent.includes('id="spectrum-track"');
check('Spectrum track element', hasSpectrumTrack);

const hasSpectrumIndicator = htmlContent.includes('id="spectrum-indicator"');
check('Spectrum indicator element', hasSpectrumIndicator);

// Check for H and G labels (Hebraic/Greek)
const hasHGLabels = htmlContent.includes('<span class="spec-label">H</span>') &&
                     htmlContent.includes('<span class="spec-label">G</span>');
check('H/G spectrum labels', hasHGLabels);

console.log('\n6. ARTICLE OVERLAY\n');

// Check for more indicator
const hasMoreIndicator = htmlContent.includes('id="more-indicator"');
check('[more...] indicator element', hasMoreIndicator);

console.log('\n=== SUMMARY ===\n');
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);
console.log(`Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
    console.log('\nFailed Requirements:');
    results.failed.forEach(f => console.log(`  ${f}`));
}

console.log('\n' + '='.repeat(60));
console.log(`Overall: ${results.failed.length === 0 ? 'PASS ✓' : 'NEEDS ATTENTION ⚠'}`);
console.log('='.repeat(60));

process.exit(results.failed.length > 0 ? 1 : 0);
