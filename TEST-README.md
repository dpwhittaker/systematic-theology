# Visual Testing

This project includes automated visual testing using Puppeteer.

## Requirements

The `test-visual.js` script requires a Chromium/Chrome browser to run. This works on:

- **macOS/Windows/Linux desktop** - Puppeteer will auto-download Chromium
- **CI/CD environments** - Use Docker images with Chrome pre-installed
- **WSL2** - Install Chrome manually or use X11 forwarding

## Running Visual Tests

```bash
npm run test:visual
```

This will:
- Launch a headless browser
- Load the HUD interface
- Test keyboard navigation (arrow keys, space, enter)
- Verify color-coded links (Hebrew/Drill/Greek/Parent)
- Check zero-scroll constraint
- Test multiple viewport sizes
- Capture screenshots to `screenshots/` directory

## Environments Without Browser Support

### ARM64/Mobile Environments

The visual tests require a full Chrome browser and won't work on:
- ARM Android (Termux, PRoot)
- Lightweight containers without Chrome
- Some CI environments without browser support

For these environments, use the basic validation instead:

```bash
npm run validate
```

This validates:
- File structure integrity
- HTML/CSS/JS syntax
- Link targets exist
- Zero-scroll CSS rules
- Color scheme compliance

## Manual Testing

For manual visual testing:

1. Start a local server:
   ```bash
   python3 -m http.server 8000
   # or
   php -S localhost:8000
   ```

2. Open in browser: `http://localhost:8000`

3. Test keyboard navigation:
   - **ArrowUp** - Cycle through parent links and history
   - **ArrowDown** - Cycle through Drill links (green)
   - **ArrowLeft** - Cycle through Hebrew links (yellow)
   - **ArrowRight** - Cycle through Greek links (cyan)
   - **Space/Enter** - Activate focused link or toggle article

4. Verify zero-scroll:
   - No content should overflow viewport
   - No scrollbars should appear
   - Content should dynamically scale

5. Check color contrast:
   - Background: Pure black (#000000)
   - Terminal accent: Green (#00ff00)
   - Hebrew links: Yellow (#ffdd00)
   - Greek links: Cyan (#00ddff)
   - Parent links: Purple (#a88dd8)

## Screenshot Gallery

After running `npm run test:visual`, check `screenshots/` for:
- Navigation states
- Multiple viewport sizes
- Topic category pages
- Link focus states
- Article expansion
- Back navigation

## Troubleshooting

### Browser Not Found

If you see:
```
Failed to launch the browser process
```

Solutions:
1. **Install Chrome/Chromium**:
   ```bash
   # macOS
   brew install chromium

   # Ubuntu/Debian
   sudo apt install chromium-browser

   # Fedora
   sudo dnf install chromium
   ```

2. **Use Docker**:
   ```bash
   docker run -v $(pwd):/app -w /app node:20 npm run test:visual
   ```

3. **Specify Chrome path** (edit test-visual.js):
   ```javascript
   const browser = await puppeteer.launch({
     executablePath: '/path/to/chrome',
     headless: true
   });
   ```

### Snap Not Working

If chromium-browser requires snap but snapd doesn't work:
- Use non-snap Chromium build
- Use Docker container with Chrome
- Run tests on different system

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Visual Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:visual
      - uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: screenshots/
```
