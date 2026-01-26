# Tasker HUD Testing Scripts

Scripts for controlling Chrome browser via Tasker HTTP Server to test the HUD interface.

## Quick Start

1. **Setup Tasker** (one-time):
   - See `/storage/self/primary/projects/systematic-theology/TASKER-HTTP-SETUP.md`
   - Enable HTTP Server in Tasker
   - Create 3 tasks: HUD_Open_URL, HUD_Screenshot, HUD_Keypress

2. **Test connection**:
   ```bash
   ./test-connection.sh
   ```

3. **Run full test suite**:
   ```bash
   ./run-hud-tests.sh
   ```

## Individual Commands

```bash
# Open URL
./hud-open-url.sh                    # Open homepage
./hud-open-url.sh intro/narrative    # Open specific page

# Take screenshot
./hud-screenshot.sh my_screenshot    # Custom name
./hud-screenshot.sh                  # Auto timestamp

# Send keyboard input
./hud-keypress.sh left     # Hebrew navigation
./hud-keypress.sh right    # Greek navigation
./hud-keypress.sh down     # Drill navigation
./hud-keypress.sh up       # Back navigation
./hud-keypress.sh space    # Activate link
./hud-keypress.sh enter    # Toggle article

# Wait/delay
./hud-wait.sh 2000         # Wait 2 seconds
./hud-wait.sh 500          # Wait 500ms
```

## Configuration

Edit `config.sh` to change:
- Tasker HTTP Server port (default: 1821)
- HUD web server port (default: 8080)
- Screenshot directory
- Timeout values

## Files

- `config.sh` - Configuration settings
- `test-connection.sh` - Test Tasker connectivity
- `run-hud-tests.sh` - Full automated test suite
- `hud-open-url.sh` - Open URL in Chrome
- `hud-screenshot.sh` - Take screenshot
- `hud-keypress.sh` - Send keyboard input
- `hud-wait.sh` - Wait/delay utility
- `start-hud-server.sh` - Start local web server
- `stop-hud-server.sh` - Stop local web server

## Output

Screenshots are saved to:
```
/storage/emulated/0/Pictures/Screenshots/hud_*.png
```

Or:
```
/sdcard/Pictures/Screenshots/hud_*.png
```
