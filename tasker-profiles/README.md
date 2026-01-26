# Tasker Profile Import Files

These XML files contain the complete Tasker profiles and tasks for HUD testing automation.

## How to Import

### Method 1: Import Individual Profiles

1. Open Tasker app
2. Long-press the **Profiles** tab header (at the top)
3. Tap **Import**
4. Navigate to: `/storage/self/primary/projects/systematic-theology/tasker-profiles/`
5. Select and import each file:
   - `HUD_Open_URL.prf.xml`
   - `HUD_Screenshot.prf.xml`
   - `HUD_Keypress.prf.xml`
6. After import, make sure all profiles are **enabled** (green toggle)

### Method 2: Import via File Manager

1. Use your file manager app
2. Navigate to: `/storage/self/primary/projects/systematic-theology/tasker-profiles/`
3. Tap each `.prf.xml` file
4. Select "Open with Tasker"
5. Confirm import
6. Enable the profiles

## What Each Profile Does

### HUD_Open_URL
- **Listens on:** `http://localhost:1821/HUD_Open_URL`
- **Receives:** URL in POST body
- **Action:** Opens URL in Chrome browser
- **Response:** "URL opened: [url]"

### HUD_Screenshot
- **Listens on:** `http://localhost:1821/HUD_Screenshot`
- **Receives:** Screenshot name in POST body
- **Action:** Takes screenshot and saves to `/sdcard/Pictures/Screenshots/[name].png`
- **Response:** "Screenshot saved: [name]"
- **Note:** Requires shell command permission (usually works without root)

### HUD_Keypress
- **Listens on:** `http://localhost:1821/HUD_Keypress`
- **Receives:** Keycode in POST body (e.g., "KEYCODE_SPACE")
- **Action:** Sends keyboard input to foreground app
- **Response:** "Keypress sent: [keycode]"
- **Note:** Chrome must be in foreground

## Verify Import

After importing, check that you have:
- 3 profiles in the Profiles tab
- Each profile has a green toggle (enabled)
- Each profile shows an HTTP Request event with path `/HUD_*`
- Each profile is linked to its task

## Test the Setup

From terminal:
```bash
cd /storage/self/primary/projects/systematic-theology
bash scripts/test-connection.sh
```

All 4 tests should pass with ✓.

## Troubleshooting

**Profiles don't appear after import:**
- Make sure Tasker has storage permissions
- Try importing from Tasker's default directory: `/sdcard/Tasker/profiles/`
- Copy the XML files there first, then import

**Import fails:**
- Check that the files aren't corrupted
- Make sure Tasker is up to date
- Try importing one at a time

**Profiles imported but don't work:**
- Check that profiles are **enabled** (green toggle)
- Verify HTTP Request event shows correct path and port
- Check Tasker's run log: Menu → More → Run Log

**Screenshots fail:**
- Android 11+ restricts screenshot API
- The shell command `screencap` should work without root
- If it fails, grant Tasker storage permissions
- Check screenshots are saving to `/sdcard/Pictures/Screenshots/`

**Keypresses don't work:**
- Chrome must be in foreground
- Test manually: `adb shell input keyevent KEYCODE_SPACE`
- Some devices may require accessibility permissions for Tasker

## Next Steps

Once imported and tested:
1. Run `bash scripts/test-connection.sh` to verify all endpoints
2. Run `bash scripts/run-hud-tests.sh` to execute full test suite
3. Check screenshots in your gallery app

Happy testing!
