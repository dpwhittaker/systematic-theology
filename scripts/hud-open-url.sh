#!/data/data/com.termux/files/usr/bin/bash
# Open a URL in Chrome via Tasker HTTP Server
# Usage: hud-open-url.sh [page-hash]
# Example: hud-open-url.sh intro/narrative

# Load config
source "$(dirname "$0")/config.sh"

PAGE_HASH="${1:-}"

if [ -z "$PAGE_HASH" ]; then
    URL="$HUD_BASE_URL"
else
    URL="$HUD_BASE_URL#$PAGE_HASH"
fi

# Send command to Tasker via POST with body
RESPONSE=$(curl -s -X POST -d "$URL" "${TASKER_BASE_URL}/HUD_Open_URL")

echo "Command sent: Open URL"
echo "URL: $URL"
echo "Response: $RESPONSE"
