# HUD Visual Testing

Two approaches for automated visual testing of the HUD interface.

## Quick Start

### Option 1: Tasker HTTP (Recommended for Android/ARM)

```bash
# One-time setup: See TASKER-HTTP-SETUP.md

# Test Tasker connectivity
npm run test:connection

# Run full test suite
npm run test:tasker

# Start/stop web server
npm run server:start
npm run server:stop
```

### Option 2: Puppeteer (Desktop/CI)

```bash
# Run Puppeteer tests (requires Chrome/Chromium)
npm run test:visual

# Generate test URLs
npm run generate-urls
```

## Comparison

| Feature | Tasker HTTP | Puppeteer |
|---------|-------------|-----------|
| **Platform** | Android | Desktop/CI |
| **Browser** | Real Chrome | Headless Chromium |
| **Setup** | Manual task creation | npm install |
| **Control** | HTTP commands from Termux | JavaScript API |
| **Screenshots** | Native Android | PNG files |
| **Keyboard** | Real input events | Simulated |
| **Touch** | Native gestures | Simulated |
| **Automation** | Bash scripts | Node.js |
| **CI/CD** | No | Yes |
| **Smart Glasses** | Can test with real device | No |

## Documentation

- **TASKER-HTTP-SETUP.md** - Complete Tasker HTTP Server setup guide
- **TEST-README.md** - General visual testing overview
- **TASKER-TESTING.md** - Original Tasker approach (manual)

## Tasker HTTP Architecture

```
Terminal (Claude)
    |
    | HTTP Request
    v
Tasker HTTP Server (port 1821)
    |
    | Android Intents / Shell Commands
    v
Chrome Browser
    |
    | Screenshots
    v
/sdcard/Pictures/Screenshots/
```

### Available Commands

All scripts in `/data/data/com.termux/files/home/.termux/tasker/`:

```bash
./test-connection.sh              # Test setup
./run-hud-tests.sh                # Full test suite (14 tests)
./hud-open-url.sh [path]          # Open URL
./hud-screenshot.sh [name]        # Take screenshot
./hud-keypress.sh [key]           # Send keyboard input
./hud-wait.sh [ms]                # Wait/delay
./start-hud-server.sh             # Start web server
./stop-hud-server.sh              # Stop web server
```

### Test Suite Coverage

The automated test suite (`run-hud-tests.sh`) covers:

1. **Initial Load** - Homepage/entry point
2. **Hebrew Navigation** - ArrowLeft key, yellow links
3. **Activate Hebrew Link** - Space to navigate
4. **Back Navigation** - ArrowUp to go back
5. **Greek Navigation** - ArrowRight key, cyan links
6. **Activate Greek Link** - Space to navigate
7. **Drill Navigation** - ArrowDown key, green links
8. **Activate Drill Link** - Space to navigate
9-14. **Category Pages** - God, Christ, Salvation, Church, Spirit, End Times

Each test:
- Opens the page
- Waits for load (2s)
- Takes screenshot
- Validates with manual review

### Screenshot Output

All screenshots saved with descriptive names:
- `hud_01_initial.png`
- `hud_02_hebrew_focus.png`
- `hud_03_hebrew_page.png`
- ... and so on

Location: `/storage/emulated/0/Pictures/Screenshots/`

## Manual Verification Checklist

After running tests, verify:

- [ ] All pages load without errors
- [ ] Links are color-coded correctly:
  - [ ] Hebrew links: Yellow (#ffdd00)
  - [ ] Drill links: Green (#00ff00)
  - [ ] Greek links: Cyan (#00ddff)
  - [ ] Parent links: Purple (#a88dd8)
- [ ] Navigation focuses correct links
- [ ] Activation navigates to correct page
- [ ] Breadcrumb shows navigation trail
- [ ] **Zero-scroll constraint**: No scrollbars anywhere
- [ ] Footer shows correct navigation hints
- [ ] Article expansion works (if present)
- [ ] Back navigation returns to previous page
- [ ] Content fits in viewport at all sizes

## Development Workflow

### Daily Development

```bash
# Start server
npm run server:start

# Make code changes
# ...

# Test changes
npm run test:tasker

# Review screenshots
# ...

# Stop server when done
npm run server:stop
```

### Before Commit

```bash
# Run full test suite
npm run test:tasker

# Verify all screenshots look correct
# Manual review in gallery app

# If tests pass, commit
git add .
git commit -m "feat: add new feature"
git push
```

### CI/CD Pipeline (Future)

For automated CI/CD on GitHub Actions, use Puppeteer:

```yaml
name: Visual Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:visual
      - uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: screenshots/
```

## Troubleshooting

### Tasker HTTP Server

**Problem:** "Cannot connect to Tasker HTTP Server"

**Solutions:**
1. Ensure Tasker is running (not force-stopped)
2. Enable HTTP Server: Tasker → Preferences → Misc → Allow External Access
3. Check port: Default is 1821
4. Test in browser: `http://localhost:1821/`

**Problem:** "Task not found"

**Solutions:**
1. Verify task names match exactly: `HUD_Open_URL`, `HUD_Screenshot`, `HUD_Keypress`
2. Tasks must be enabled (not disabled)
3. Check Tasker run log: Menu → More → Run Log

### Screenshots

**Problem:** Screenshots fail on Android 11+

**Solutions:**
1. Use shell command in task: `screencap -p /sdcard/Pictures/Screenshots/%name.png`
2. Grant "Draw Over Other Apps" permission to Tasker
3. Use AutoInput plugin for screenshots

### Keyboard Input

**Problem:** Keys don't work in Chrome

**Solutions:**
1. Ensure Chrome is in foreground
2. Test manually: `input keyevent KEYCODE_SPACE`
3. Some keys may need Chrome flags
4. Consider AutoInput plugin for reliable input

## Advanced Usage

### Custom Test Scenarios

Create your own test script:

```bash
#!/data/data/com.termux/files/usr/bin/bash
source /data/data/com.termux/files/home/.termux/tasker/config.sh

# Your custom test sequence
/data/data/com.termux/files/home/.termux/tasker/hud-open-url.sh "intro/intro"
/data/data/com.termux/files/home/.termux/tasker/hud-wait.sh 2000
/data/data/com.termux/files/home/.termux/tasker/hud-keypress.sh down
/data/data/com.termux/files/home/.termux/tasker/hud-screenshot.sh my_test
```

### Debugging

Add verbose output:

```bash
# In your script
set -x  # Enable command tracing
./hud-open-url.sh intro/narrative
```

Check Tasker's run log for detailed execution info.

### Integration with Other Tools

The HTTP API can be called from any tool:

**Python:**
```python
import requests
requests.get('http://localhost:1821/HUD_Screenshot?name=test')
```

**JavaScript:**
```javascript
fetch('http://localhost:1821/HUD_Open_URL?url=http://localhost:8080')
```

**curl:**
```bash
curl "http://localhost:1821/HUD_Keypress?keycode=KEYCODE_SPACE"
```

## Next Steps

1. Complete Tasker setup (see TASKER-HTTP-SETUP.md)
2. Run connection test: `npm run test:connection`
3. Run full test suite: `npm run test:tasker`
4. Review screenshots for visual correctness
5. Iterate on design and re-test

Happy testing!
