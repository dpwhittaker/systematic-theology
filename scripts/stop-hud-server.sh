#!/data/data/com.termux/files/usr/bin/bash
# Stop HUD web server
# Usage: Called from Tasker with no arguments

PID_FILE="/data/data/com.termux/files/home/.hud-server.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "No server PID file found"
    exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    rm "$PID_FILE"
    echo "Server stopped (PID: $PID)"
else
    rm "$PID_FILE"
    echo "Server was not running (stale PID file removed)"
fi
