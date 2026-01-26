#!/data/data/com.termux/files/usr/bin/bash
# Test Tasker HTTP Server connectivity and setup
# Usage: test-connection.sh

# Load config
source "$(dirname "$0")/config.sh"

echo "========================================="
echo "Tasker HTTP Server Connection Test"
echo "========================================="
echo ""

echo "Testing connection to: $TASKER_BASE_URL"
echo ""

# Test basic connectivity by calling a real endpoint
echo "[1/4] Testing basic HTTP connectivity..."
RESPONSE=$(curl -s -m 5 -X POST -d "test" "${TASKER_BASE_URL}/HUD_Open_URL" 2>&1)
if [ $? -eq 0 ]; then
    echo "✓ Tasker HTTP Server is reachable"
    echo "  Response: $RESPONSE"
else
    echo "✗ FAILED: Cannot reach Tasker HTTP Server"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Open Tasker app"
    echo "  2. Make sure HTTP Request profile exists and is enabled"
    echo "  3. Profile path should be /HUD_Open_URL"
    echo "  4. Check port in HTTP Request event is $TASKER_PORT"
    echo ""
    exit 1
fi
echo ""

# Test HUD_Open_URL task
echo "[2/4] Testing HUD_Open_URL task..."
RESPONSE=$(curl -s -m 5 -X POST -d "test" "${TASKER_BASE_URL}/HUD_Open_URL" 2>&1)
if [ $? -eq 0 ]; then
    echo "✓ HUD_Open_URL task exists and responds"
    echo "  Response: $RESPONSE"
else
    echo "✗ WARNING: HUD_Open_URL task may not exist"
    echo "  Create this task in Tasker (see TASKER-HTTP-SETUP.md)"
fi
echo ""

# Test HUD_Screenshot task
echo "[3/4] Testing HUD_Screenshot task..."
RESPONSE=$(curl -s -m 5 -X POST -d "connection_test" "${TASKER_BASE_URL}/HUD_Screenshot" 2>&1)
if [ $? -eq 0 ]; then
    echo "✓ HUD_Screenshot task exists and responds"
    echo "  Response: $RESPONSE"
else
    echo "✗ WARNING: HUD_Screenshot task may not exist"
    echo "  Create this task in Tasker (see TASKER-HTTP-SETUP.md)"
fi
echo ""

# Test HUD_Keypress task
echo "[4/4] Testing HUD_Keypress task..."
RESPONSE=$(curl -s -m 5 -X POST -d "KEYCODE_SPACE" "${TASKER_BASE_URL}/HUD_Keypress" 2>&1)
if [ $? -eq 0 ]; then
    echo "✓ HUD_Keypress task exists and responds"
    echo "  Response: $RESPONSE"
else
    echo "✗ WARNING: HUD_Keypress task may not exist"
    echo "  Create this task in Tasker (see TASKER-HTTP-SETUP.md)"
fi
echo ""

echo "========================================="
echo "Test Results Summary"
echo "========================================="
echo ""
echo "If all tests passed, you're ready to run:"
echo "  ./run-hud-tests.sh"
echo ""
echo "If any tests failed, see:"
echo "  /storage/self/primary/projects/systematic-theology/TASKER-HTTP-SETUP.md"
echo ""
