#!/data/data/com.termux/files/usr/bin/bash
# Start HUD web server for testing
# Usage: Called from Tasker with no arguments

PROJECT_DIR="/storage/self/primary/projects/systematic-theology"
PORT=8080
PID_FILE="/data/data/com.termux/files/home/.hud-server.pid"

cd "$PROJECT_DIR" || exit 1

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Server already running on port $PORT (PID: $OLD_PID)"
        exit 0
    fi
fi

# Start server in background
python3 -m http.server $PORT > /dev/null 2>&1 &
SERVER_PID=$!

# Save PID
echo $SERVER_PID > "$PID_FILE"

echo "HUD server started on port $PORT (PID: $SERVER_PID)"
echo "Access at: http://localhost:$PORT"
