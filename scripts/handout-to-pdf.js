#!/usr/bin/env node
// Generate a PDF from a handout via headless Chrome.
//
// Usage:
//   node scripts/handout-to-pdf.js handouts/pneumatology.md [output.pdf]
//
// Requires: puppeteer (npm install puppeteer)
// The local dev server must be running on localhost:8000.

const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
    const handoutPath = process.argv[2];
    if (!handoutPath) {
        console.error('Usage: node scripts/handout-to-pdf.js <handout-path> [output.pdf]');
        console.error('  e.g. node scripts/handout-to-pdf.js handouts/pneumatology.md');
        process.exit(1);
    }

    const defaultOut = handoutPath.replace(/\.md$/, '.pdf').replace(/\//g, '_');
    const outputPath = process.argv[3] || path.join('pdf', defaultOut);

    // Ensure pdf/ directory exists
    const fs = require('fs');
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const url = `http://localhost:8000/#${handoutPath}`;
    console.log(`Loading ${url} ...`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait for handout content to render
    await page.waitForSelector('#card-body h1', { timeout: 10000 });
    // Small extra delay for any async rendering
    await new Promise(r => setTimeout(r, 500));

    await page.pdf({
        path: outputPath,
        format: 'Letter',
        margin: { top: '0.25in', bottom: '0.25in', left: '0.25in', right: '0.25in' },
        printBackground: false
    });

    await browser.close();
    console.log(`PDF written to ${outputPath}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
