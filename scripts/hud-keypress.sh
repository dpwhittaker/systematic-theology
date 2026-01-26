#!/data/data/com.termux/files/usr/bin/bash
# Send keyboard input to Chrome via Tasker
# Usage: hud-keypress.sh [key]
# Keys: up, down, left, right, space, enter

# Load config
source "$(dirname "$0")/config.sh"

KEY="${1:-space}"

# Map friendly names to Android keycodes
case "$KEY" in
    up|UP|arrowup)
        KEYCODE="KEYCODE_DPAD_UP"
        ;;
    down|DOWN|arrowdown)
        KEYCODE="KEYCODE_DPAD_DOWN"
        ;;
    left|LEFT|arrowleft)
        KEYCODE="KEYCODE_DPAD_LEFT"
        ;;
    right|RIGHT|arrowright)
        KEYCODE="KEYCODE_DPAD_RIGHT"
        ;;
    space|SPACE)
        KEYCODE="KEYCODE_SPACE"
        ;;
    enter|ENTER|return)
        KEYCODE="KEYCODE_ENTER"
        ;;
    center|CENTER)
        KEYCODE="KEYCODE_DPAD_CENTER"
        ;;
    *)
        echo "Unknown key: $KEY"
        echo "Valid keys: up, down, left, right, space, enter, center"
        exit 1
        ;;
esac

# Send command to Tasker via POST with body
RESPONSE=$(curl -s -X POST -d "$KEYCODE" "${TASKER_BASE_URL}/HUD_Keypress")

echo "Command sent: Keypress"
echo "Key: $KEY ($KEYCODE)"
echo "Response: $RESPONSE"
