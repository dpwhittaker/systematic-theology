#!/data/data/com.termux/files/usr/bin/bash
# Tasker HTTP Server Configuration

# Tasker HTTP Server settings
export TASKER_HOST="localhost"
export TASKER_PORT="1821"
export TASKER_BASE_URL="http://${TASKER_HOST}:${TASKER_PORT}"

# HUD Server settings
export HUD_HOST="localhost"
export HUD_PORT="8080"
export HUD_BASE_URL="http://${HUD_HOST}:${HUD_PORT}"

# Screenshot directory
export SCREENSHOT_DIR="/storage/emulated/0/Pictures/Screenshots"

# Project directory
export PROJECT_DIR="/storage/self/primary/projects/systematic-theology"

# Test timeout settings (milliseconds)
export PAGE_LOAD_TIMEOUT=2000
export ACTION_WAIT=500
export SCREENSHOT_DELAY=500
