const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testHUD() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set viewport to simulate smart glasses HUD
  await page.setViewport({
    width: 1280,
    height: 720,
    deviceScaleFactor: 1
  });

  // Navigate to local file
  const filePath = 'file://' + path.join(__dirname, 'index.html');
  console.log(`Loading ${filePath}...`);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Wait for content to load
  await page.waitForSelector('#content');

  console.log('Running visual tests...\n');

  // Test 1: Initial load (intro page)
  console.log('✓ Test 1: Capturing intro page');
  await page.screenshot({
    path: path.join(screenshotsDir, '01-intro.png'),
    fullPage: false
  });

  // Test 2: Check color-coded links are present
  console.log('✓ Test 2: Checking color-coded links');
  const linkColors = await page.evaluate(() => {
    const links = document.querySelectorAll('.link');
    const colors = {};
    links.forEach(link => {
      const color = window.getComputedStyle(link).color;
      const column = link.getAttribute('data-column');
      if (!colors[column]) colors[column] = [];
      colors[column].push(color);
    });
    return colors;
  });
  console.log('  Link colors by column:', Object.keys(linkColors));

  // Test 3: Navigate using keyboard (Hebrew link - ArrowLeft)
  console.log('✓ Test 3: Testing Hebrew navigation (ArrowLeft)');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '02-hebrew-focus.png'),
    fullPage: false
  });

  // Test 4: Activate the focused link
  console.log('✓ Test 4: Activating focused link');
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  const currentUrl = await page.evaluate(() => window.location.hash);
  console.log(`  Navigated to: ${currentUrl}`);
  await page.screenshot({
    path: path.join(screenshotsDir, '03-after-navigation.png'),
    fullPage: false
  });

  // Test 5: Check breadcrumb
  console.log('✓ Test 5: Checking breadcrumb trail');
  const breadcrumb = await page.evaluate(() => {
    return document.querySelector('#breadcrumb')?.textContent;
  });
  console.log(`  Breadcrumb: ${breadcrumb}`);

  // Test 6: Navigate to a deeper topic (drill down)
  console.log('✓ Test 6: Testing Drill navigation (ArrowDown)');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '04-drill-focus.png'),
    fullPage: false
  });

  // Test 7: Activate and capture
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '05-drill-page.png'),
    fullPage: false
  });

  // Test 8: Test article expansion if available
  console.log('✓ Test 8: Testing article expansion');
  const hasArticle = await page.evaluate(() => {
    const indicator = document.querySelector('.more-indicator');
    return indicator && indicator.textContent.includes('more');
  });

  if (hasArticle) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, '06-article-expanded.png'),
      fullPage: false
    });
    console.log('  Article expanded');
  } else {
    console.log('  No article available on this page');
  }

  // Test 9: Navigate back using history (ArrowUp)
  console.log('✓ Test 9: Testing back navigation (ArrowUp)');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '07-back-navigation.png'),
    fullPage: false
  });

  // Test 10: Check footer navigation hints
  console.log('✓ Test 10: Checking footer navigation hints');
  const footerText = await page.evaluate(() => {
    return document.querySelector('#footer')?.textContent;
  });
  console.log(`  Footer hints: ${footerText?.substring(0, 80)}...`);

  // Test 11: Verify zero-scroll constraint
  console.log('✓ Test 11: Verifying zero-scroll constraint');
  const hasScroll = await page.evaluate(() => {
    const body = document.body;
    return body.scrollHeight > body.clientHeight || body.scrollWidth > body.clientWidth;
  });
  console.log(`  Body overflow: ${hasScroll ? 'FAIL - scrolling detected' : 'PASS - no scroll'}`);

  // Test 12: Test Greek navigation (ArrowRight)
  console.log('✓ Test 12: Testing Greek navigation (ArrowRight)');
  await page.goto(filePath + '#intro/intro', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '08-greek-focus.png'),
    fullPage: false
  });

  // Test 13: Test different viewport sizes
  console.log('✓ Test 13: Testing responsive layouts');

  // Smaller smart glasses viewport
  await page.setViewport({ width: 800, height: 600 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '09-viewport-800x600.png'),
    fullPage: false
  });

  // Larger desktop viewport
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '10-viewport-1920x1080.png'),
    fullPage: false
  });

  // Test 14: Capture multiple topic pages
  console.log('✓ Test 14: Capturing various topic pages');
  const topics = [
    '#god/god',
    '#christ/christ',
    '#salvation/salvation',
    '#church/church'
  ];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    await page.goto(filePath + topic, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);
    const topicName = topic.replace('#', '').replace('/', '-');
    await page.screenshot({
      path: path.join(screenshotsDir, `11-topic-${topicName}.png`),
      fullPage: false
    });
    console.log(`  Captured ${topic}`);
  }

  // Test 15: Test contrast and colors
  console.log('✓ Test 15: Analyzing color contrast');
  const colors = await page.evaluate(() => {
    const body = document.body;
    const content = document.querySelector('#content');
    const links = {
      hebrew: document.querySelector('.link[data-column="Hebrew"]'),
      drill: document.querySelector('.link[data-column="Drill"]'),
      greek: document.querySelector('.link[data-column="Greek"]'),
      parent: document.querySelector('.link[data-column="Parent"]')
    };

    return {
      background: window.getComputedStyle(body).backgroundColor,
      contentColor: window.getComputedStyle(content).color,
      hebrewColor: links.hebrew ? window.getComputedStyle(links.hebrew).color : null,
      drillColor: links.drill ? window.getComputedStyle(links.drill).color : null,
      greekColor: links.greek ? window.getComputedStyle(links.greek).color : null,
      parentColor: links.parent ? window.getComputedStyle(links.parent).color : null
    };
  });
  console.log('  Color scheme:');
  console.log(`    Background: ${colors.background}`);
  console.log(`    Content: ${colors.contentColor}`);
  console.log(`    Hebrew: ${colors.hebrewColor}`);
  console.log(`    Drill: ${colors.drillColor}`);
  console.log(`    Greek: ${colors.greekColor}`);
  console.log(`    Parent: ${colors.parentColor}`);

  console.log('\n✓ All tests complete!');
  console.log(`Screenshots saved to: ${screenshotsDir}`);

  await browser.close();
}

// Run tests
testHUD().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
