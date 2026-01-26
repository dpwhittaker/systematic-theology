#!/data/data/com.termux/files/usr/bin/bash
# Run full HUD visual test suite
# Usage: run-hud-tests.sh

set -e  # Exit on error

# Load config
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/config.sh"

echo "========================================="
echo "HUD Visual Test Suite"
echo "========================================="
echo "Tasker URL: $TASKER_BASE_URL"
echo "HUD URL: $HUD_BASE_URL"
echo "Screenshot Dir: $SCREENSHOT_DIR"
echo "========================================="
echo ""

# Test Tasker connectivity
echo "Testing Tasker HTTP Server connectivity..."
if ! curl -s -m 5 -X POST -d "test" "${TASKER_BASE_URL}/HUD_Open_URL" > /dev/null 2>&1; then
    echo "ERROR: Cannot connect to Tasker HTTP Server at $TASKER_BASE_URL"
    echo "Make sure:"
    echo "  1. Tasker is running"
    echo "  2. HTTP Request profiles are created and enabled"
    echo "  3. Port is set to $TASKER_PORT"
    exit 1
fi
echo "✓ Tasker HTTP Server is reachable"
echo ""

# Test 1: Initial Load
echo "Test 1: Initial Load"
bash $SCRIPT_DIR/hud-open-url.sh ""
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-screenshot.sh "hud_01_initial"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 1 complete"
echo ""

# Test 2: Hebrew Navigation (ArrowLeft)
echo "Test 2: Hebrew Navigation (ArrowLeft)"
bash $SCRIPT_DIR/hud-keypress.sh left
bash $SCRIPT_DIR/hud-wait.sh 500
bash $SCRIPT_DIR/hud-screenshot.sh "hud_02_hebrew_focus"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 2 complete"
echo ""

# Test 3: Activate Hebrew Link (Space)
echo "Test 3: Activate Hebrew Link"
bash $SCRIPT_DIR/hud-keypress.sh space
bash $SCRIPT_DIR/hud-wait.sh 1500
bash $SCRIPT_DIR/hud-screenshot.sh "hud_03_hebrew_page"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 3 complete"
echo ""

# Test 4: Back Navigation (ArrowUp)
echo "Test 4: Back Navigation (ArrowUp)"
bash $SCRIPT_DIR/hud-keypress.sh up
bash $SCRIPT_DIR/hud-wait.sh 1500
bash $SCRIPT_DIR/hud-screenshot.sh "hud_04_back_to_intro"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 4 complete"
echo ""

# Test 5: Greek Navigation (ArrowRight)
echo "Test 5: Greek Navigation (ArrowRight)"
bash $SCRIPT_DIR/hud-keypress.sh right
bash $SCRIPT_DIR/hud-wait.sh 500
bash $SCRIPT_DIR/hud-screenshot.sh "hud_05_greek_focus"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 5 complete"
echo ""

# Test 6: Activate Greek Link
echo "Test 6: Activate Greek Link"
bash $SCRIPT_DIR/hud-keypress.sh space
bash $SCRIPT_DIR/hud-wait.sh 1500
bash $SCRIPT_DIR/hud-screenshot.sh "hud_06_greek_page"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 6 complete"
echo ""

# Test 7: Drill Navigation (ArrowDown)
echo "Test 7: Drill Navigation (ArrowDown)"
bash $SCRIPT_DIR/hud-open-url.sh "intro/intro"
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-keypress.sh down
bash $SCRIPT_DIR/hud-wait.sh 500
bash $SCRIPT_DIR/hud-screenshot.sh "hud_07_drill_focus"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 7 complete"
echo ""

# Test 8: Activate Drill Link
echo "Test 8: Activate Drill Link"
bash $SCRIPT_DIR/hud-keypress.sh space
bash $SCRIPT_DIR/hud-wait.sh 1500
bash $SCRIPT_DIR/hud-screenshot.sh "hud_08_drill_page"
bash $SCRIPT_DIR/hud-wait.sh 500
echo "✓ Test 8 complete"
echo ""

# Test 9-14: Category Pages
echo "Test 9: God Category"
bash $SCRIPT_DIR/hud-open-url.sh "god/god"
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-screenshot.sh "hud_09_god"
echo "✓ Test 9 complete"
echo ""

echo "Test 10: Christ Category"
bash $SCRIPT_DIR/hud-open-url.sh "jesus/jesus"
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-screenshot.sh "hud_10_jesus"
echo "✓ Test 10 complete"
echo ""

echo "Test 11: Salvation Category"
bash $SCRIPT_DIR/hud-open-url.sh "salvation/salvation"
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-screenshot.sh "hud_11_salvation"
echo "✓ Test 11 complete"
echo ""

echo "Test 12: Church Category"
bash $SCRIPT_DIR/hud-open-url.sh "church/church"
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-screenshot.sh "hud_12_church"
echo "✓ Test 12 complete"
echo ""

echo "Test 13: Spirit Category"
bash $SCRIPT_DIR/hud-open-url.sh "spirit/spirit"
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-screenshot.sh "hud_13_spirit"
echo "✓ Test 13 complete"
echo ""

echo "Test 14: End Times Category"
bash $SCRIPT_DIR/hud-open-url.sh "eschatology/eschatology"
bash $SCRIPT_DIR/hud-wait.sh 2000
bash $SCRIPT_DIR/hud-screenshot.sh "hud_14_eschatology"
echo "✓ Test 14 complete"
echo ""

echo "========================================="
echo "All tests complete!"
echo "========================================="
echo "Screenshots saved to: $SCREENSHOT_DIR"
echo ""
echo "Next steps:"
echo "  1. Review screenshots for visual correctness"
echo "  2. Check color coding (yellow/green/cyan/purple links)"
echo "  3. Verify zero-scroll constraint (no scrollbars)"
echo "  4. Confirm navigation worked correctly"
