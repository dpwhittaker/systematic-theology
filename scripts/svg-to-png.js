#!/usr/bin/env node
// Render an SVG file to PNG via headless Chrome.
// Usage: node scripts/svg-to-png.js <input.svg> [output.png] [scale]

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
  const [, , svgPathArg, outArg, scaleArg] = process.argv;
  if (!svgPathArg) {
    console.error('Usage: node scripts/svg-to-png.js <input.svg> [output.png] [scale]');
    process.exit(1);
  }
  const svgPath = path.resolve(svgPathArg);
  const out = outArg
    ? path.resolve(outArg)
    : svgPath.replace(/\.svg$/i, '.png');
  const scale = scaleArg ? parseFloat(scaleArg) : 2;

  const svg = fs.readFileSync(svgPath, 'utf8');
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) throw new Error('No viewBox in SVG');
  const [, , vbW, vbH] = m[1].split(/\s+/).map(Number);
  const W = Math.round(vbW);
  const H = Math.round(vbH);

  const html = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#fff;}svg{display:block;width:${W}px;height:${H}px;}</style>
</head><body>${svg}</body></html>`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: scale });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: out, omitBackground: false, fullPage: false, clip: { x: 0, y: 0, width: W, height: H } });
    console.log(`Wrote ${out} (${W*scale}x${H*scale}, scale=${scale})`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
