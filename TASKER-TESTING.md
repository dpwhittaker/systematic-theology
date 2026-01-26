# Android Chrome Testing with Tasker

This guide explains how to automate visual testing of the HUD interface using Tasker on Android.

## Prerequisites

**Required:**
- Tasker app installed
- Chrome browser
- Local web server running (see Setup below)

**Optional (for advanced automation):**
- AutoInput plugin (for precise touch coordinates)
- AutoTools plugin (for advanced web interaction)
- Join/Pushbullet (for remote triggering)

## Setup: Serve the Site Locally

First, start a local web server in Termux:

```bash
cd /storage/self/primary/projects/systematic-theology
python3 -m http.server 8080
```

The site will be available at: `http://localhost:8080`

## Tasker Project: HUD Visual Test

### Task 1: Launch and Capture

**Name:** `HUD_Test_Basic`

**Actions:**

1. **Launch Chrome**
   - Action: `Launch App`
   - App: `Chrome`
   - Wait: `2 seconds`

2. **Load URL**
   - Action: `Browse URL`
   - URL: `http://localhost:8080`
   - Wait: `2 seconds`

3. **Screenshot - Initial Load**
   - Action: `Take Screenshot`
   - Name: `hud_01_initial`

4. **Wait**
   - Action: `Wait`
   - Seconds: `1`

### Task 2: Test Navigation

**Name:** `HUD_Test_Navigation`

**Actions:**

1. **Test ArrowLeft (Hebrew Links)**
   - Action: `Input` → `Dpad` → `Left`
   - Wait: `500ms`
   - Screenshot: `hud_02_hebrew_focus`

2. **Activate Link**
   - Action: `Input` → `Dpad` → `Center` (or Space)
   - Wait: `1s`
   - Screenshot: `hud_03_hebrew_page`

3. **Test ArrowDown (Drill Links)**
   - Action: `Input` → `Dpad` → `Down`
   - Wait: `500ms`
   - Screenshot: `hud_04_drill_focus`

4. **Activate Link**
   - Action: `Input` → `Dpad` → `Center`
   - Wait: `1s`
   - Screenshot: `hud_05_drill_page`

5. **Test ArrowRight (Greek Links)**
   - Go back to intro: `http://localhost:8080`
   - Input: `Dpad Right`
   - Wait: `500ms`
   - Screenshot: `hud_06_greek_focus`

6. **Test Back Navigation**
   - Action: `Input` → `Dpad` → `Up`
   - Wait: `1s`
   - Screenshot: `hud_07_back_nav`

### Task 3: Test Multiple Topics

**Name:** `HUD_Test_Topics`

**Actions:**

For each topic URL:
1. `Browse URL: http://localhost:8080#god/god`
2. Wait: `1s`
3. Screenshot: `hud_topic_god`
4. Repeat for: `christ/christ`, `salvation/salvation`, `church/church`

## Simple Tasker Setup (No Plugins)

If you want to keep it simple without plugins:

### Profile: Quick HUD Test

**Trigger:**
- Widget or manual run

**Task Actions:**

```
1. Launch App: Chrome
2. Wait: 2 seconds
3. Browse URL: http://localhost:8080
4. Wait: 2 seconds
5. Take Screenshot [Name: hud_initial_%DATE_%TIME]
6. Wait: 1 second

# Test keyboard navigation (requires Bluetooth keyboard or USB OTG)
7. Send Intent
   Action: android.intent.action.VIEW
   Data: http://localhost:8080#intro/narrative
8. Wait: 2 seconds
9. Take Screenshot [Name: hud_narrative_%DATE_%TIME]

10. Send Intent
    Action: android.intent.action.VIEW
    Data: http://localhost:8080#intro/philosophy
11. Wait: 2 seconds
12. Take Screenshot [Name: hud_philosophy_%DATE_%TIME]

# Repeat for other key pages...
```

## Advanced: AutoInput Integration

With AutoInput plugin, you can simulate keyboard events more precisely:

### Task: Keyboard Navigation Test

```
1. Launch Chrome with URL
2. AutoInput Action → Keyboard
   - Key: KEYCODE_DPAD_LEFT
   - Wait: 500ms
3. Take Screenshot
4. AutoInput Action → Keyboard
   - Key: KEYCODE_SPACE
5. Take Screenshot
```

### Available Keycodes:
- `KEYCODE_DPAD_UP` - Parent/Back navigation
- `KEYCODE_DPAD_DOWN` - Drill links
- `KEYCODE_DPAD_LEFT` - Hebrew links
- `KEYCODE_DPAD_RIGHT` - Greek links
- `KEYCODE_SPACE` - Activate link
- `KEYCODE_ENTER` - Toggle article

## Touch-Based Testing (Alternative)

If you don't have keyboard/D-pad access, use touch coordinates:

### Task: Touch Navigation

```
1. Launch Chrome with URL
2. Wait for page load
3. AutoInput Action → Click
   - X: 640 (center)
   - Y: 400 (adjust for Hebrew link position)
4. Screenshot
5. Wait: 500ms
6. AutoInput Action → Click (same position to activate)
```

**Note:** You'll need to determine touch coordinates for each link type.

## Swipe Gestures

The HUD supports touch swipes:
- **Swipe Left** → Hebrew navigation
- **Swipe Right** → Greek navigation
- **Swipe Down** → Drill navigation
- **Swipe Up** → Back navigation

### Task: Swipe Test

```
1. Launch Chrome with URL
2. AutoInput Action → Gesture
   - Start: X=800, Y=360
   - End: X=400, Y=360
   - Duration: 200ms
3. Screenshot [Name: after_swipe_left]
```

## Export Tasker Project

Once you've created the tasks:

1. Long-press the project in Tasker
2. Export → Export as XML
3. Save to: `/storage/self/primary/projects/systematic-theology/tasker-hud-test.xml`
4. Share or commit to repository

## Running Tests

### Manual Run:
1. Open Tasker
2. Select `HUD_Test_Basic` task
3. Tap Play button

### Widget:
1. Long-press home screen
2. Add Widget → Tasker → Task
3. Select `HUD_Test_Basic`
4. Tap widget to run tests

### Voice Command (with AutoVoice):
- "Test HUD interface"

### Scheduled:
- Profile: Time → 9:00 AM daily
- Task: Run HUD tests

## Screenshot Location

Screenshots are saved to:
```
/storage/emulated/0/Pictures/Screenshots/
```

Or configure in Tasker:
```
Take Screenshot
- File: /storage/self/primary/projects/systematic-theology/screenshots/hud_%DATE_%TIME.png
```

## Validation Checklist

After running tests, manually verify:

- [ ] Initial page loads correctly
- [ ] Links are color-coded (yellow, green, cyan, purple)
- [ ] Navigation changes focus correctly
- [ ] Activation navigates to new page
- [ ] Breadcrumb shows navigation trail
- [ ] No scrolling occurs (zero-scroll constraint)
- [ ] Footer shows correct navigation hints
- [ ] Article expansion works (if available)
- [ ] Back navigation returns to previous page

## Limitations

**Tasker Limitations:**
- Cannot directly inspect DOM elements
- Cannot verify JavaScript state
- Cannot programmatically check colors (requires manual verification)
- Screenshot comparison is manual

**Advantages over Puppeteer:**
- Runs on actual Android device (real-world testing)
- Tests touch gestures natively
- No need for Chrome/Chromium installation
- Can test with actual smart glasses (if connected)

## Combining with Puppeteer

Best approach:
- **Development:** Use Puppeteer on desktop for detailed DOM inspection
- **Production:** Use Tasker on Android for real-device testing
- **CI/CD:** Use Puppeteer in GitHub Actions

## Next Steps

1. Start the local server: `python3 -m http.server 8080`
2. Create basic Tasker task following "Simple Tasker Setup"
3. Run and verify screenshots
4. Expand with AutoInput if needed for keyboard simulation
5. Export Tasker project and commit to repo
