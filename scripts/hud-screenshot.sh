#!/data/data/com.termux/files/usr/bin/bash
# Take a screenshot via Tasker
# Usage: hud-screenshot.sh [name]
# Example: hud-screenshot.sh hud_01_initial

# Load config
source "$(dirname "$0")/config.sh"

SCREENSHOT_NAME="${1:-hud_$(date +%Y%m%d_%H%M%S)}"

# Send command to Tasker via POST with body
RESPONSE=$(curl -s -X POST -d "$SCREENSHOT_NAME" "${TASKER_BASE_URL}/HUD_Screenshot")

echo "Command sent: Take Screenshot"
echo "Name: $SCREENSHOT_NAME"
echo "Location: ${SCREENSHOT_DIR}/${SCREENSHOT_NAME}.png"
echo "Response: $RESPONSE"
