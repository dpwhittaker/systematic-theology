#!/data/data/com.termux/files/usr/bin/bash
# Wait for a specified duration
# Usage: hud-wait.sh [milliseconds]
# Example: hud-wait.sh 2000

MS="${1:-500}"
SECONDS=$(echo "scale=3; $MS / 1000" | bc)

sleep "$SECONDS"
