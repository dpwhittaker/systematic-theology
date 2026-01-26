# Tasker HTTP Server Setup for HUD Testing

This guide shows how to set up Tasker to receive HTTP commands from Termux, allowing Claude Code to fully automate browser testing.

## Architecture

```
Claude/Termux (PRoot)  -->  HTTP Request  -->  Tasker  -->  Chrome Browser
                                                 |
                                                 v
                                           Screenshots
```

## Step 1: Enable Tasker HTTP Server

1. Open Tasker app
2. Go to **Preferences** (3-dot menu → Preferences)
3. Tap **Misc** tab
4. Enable **Allow External Access**
5. Set **HTTP Server Port** to `1821` (or your preferred port)
6. Note the authentication key if required (optional)

## Step 2: Create Tasker Tasks

You need to create 3 tasks in Tasker that respond to HTTP requests:

### Task 1: HUD_Open_URL

**Purpose:** Open a URL in Chrome

**Actions:**
1. **Variable Set**
   - Name: `%url`
   - To: `%par1`

2. **Launch App**
   - App: Chrome
   - Data: `%url`

   OR use:

2. **Send Intent**
   - Action: `android.intent.action.VIEW`
   - Data: `%url`
   - Package: `com.android.chrome`
   - Target: Activity

**Test from terminal:**
```bash
curl "http://localhost:1821/HUD_Open_URL?url=http://localhost:8080"
```

### Task 2: HUD_Screenshot

**Purpose:** Take a screenshot with a custom name

**Actions:**
1. **Variable Set**
   - Name: `%name`
   - To: `%par1`

2. **Take Screenshot**
   - Name: `%name`
   - Insert In Gallery: Yes (optional)

**Note:** On Android 11+, screenshots require special permissions:
- Grant Tasker "Draw Over Other Apps" permission
- Or use AutoInput plugin for screenshots
- Or use shell command: `screencap -p /sdcard/Pictures/Screenshots/%name.png`

**Test from terminal:**
```bash
curl "http://localhost:1821/HUD_Screenshot?name=test_screenshot"
```

### Task 3: HUD_Keypress

**Purpose:** Send keyboard input to Chrome

**Actions:**
1. **Variable Set**
   - Name: `%keycode`
   - To: `%par1`

2. **Send Intent**
   - Action: `android.intent.action.VIEW`
   - Extra: (Leave empty)

   OR better, use **Run Shell** (requires Termux or root):

2. **Run Shell**
   - Command: `input keyevent %keycode`
   - Use Root: No (works without root)
   - Store Output In: (leave empty)

**Valid keycodes:**
- `KEYCODE_DPAD_UP` or `19`
- `KEYCODE_DPAD_DOWN` or `20`
- `KEYCODE_DPAD_LEFT` or `21`
- `KEYCODE_DPAD_RIGHT` or `22`
- `KEYCODE_SPACE` or `62`
- `KEYCODE_ENTER` or `66`
- `KEYCODE_DPAD_CENTER` or `23`

**Test from terminal:**
```bash
curl "http://localhost:1821/HUD_Keypress?keycode=KEYCODE_SPACE"
```

## Step 3: Alternative - Import Task XML

Instead of manually creating tasks, you can import the XML definitions below.

### Import Instructions:

1. Long-press the **Tasks** tab in Tasker
2. Select **Import**
3. Navigate to the XML file
4. Confirm import

### Task XML Files

Save these to `/sdcard/Tasker/tasks/` then import:

#### HUD_Open_URL.tsk.xml

```xml
<TaskerData sr="" dvi="1" tv="6.3.15">
    <Task sr="task1">
        <cdate>1706262000000</cdate>
        <edate>1706262000000</edate>
        <id>1</id>
        <nme>HUD_Open_URL</nme>
        <pri>6</pri>
        <Action sr="act0" ve="7">
            <code>547</code>
            <Str sr="arg0" ve="3">%url</Str>
            <Str sr="arg1" ve="3">%par1</Str>
            <Int sr="arg2" val="0"/>
            <Int sr="arg3" val="0"/>
            <Int sr="arg4" val="0"/>
            <Int sr="arg5" val="3"/>
        </Action>
        <Action sr="act1" ve="7">
            <code>129</code>
            <Str sr="arg0" ve="3">android.intent.action.VIEW</Str>
            <Str sr="arg1" ve="3">%url</Str>
            <Str sr="arg2" ve="3"/>
            <Str sr="arg3" ve="3"/>
            <Str sr="arg4" ve="3"/>
            <Str sr="arg5" ve="3">com.android.chrome</Str>
            <Int sr="arg6" val="1"/>
        </Action>
    </Task>
</TaskerData>
```

#### HUD_Screenshot.tsk.xml

```xml
<TaskerData sr="" dvi="1" tv="6.3.15">
    <Task sr="task2">
        <cdate>1706262000000</cdate>
        <edate>1706262000000</edate>
        <id>2</id>
        <nme>HUD_Screenshot</nme>
        <pri>6</pri>
        <Action sr="act0" ve="7">
            <code>547</code>
            <Str sr="arg0" ve="3">%name</Str>
            <Str sr="arg1" ve="3">%par1</Str>
            <Int sr="arg2" val="0"/>
            <Int sr="arg3" val="0"/>
            <Int sr="arg4" val="0"/>
            <Int sr="arg5" val="3"/>
        </Action>
        <Action sr="act1" ve="7">
            <code>135</code>
            <Str sr="arg0" ve="3">screencap -p /sdcard/Pictures/Screenshots/%name.png</Str>
            <Int sr="arg1" val="0"/>
            <Str sr="arg2" ve="3"/>
            <Str sr="arg3" ve="3"/>
            <Str sr="arg4" ve="3"/>
            <Int sr="arg5" val="0"/>
            <Int sr="arg6" val="0"/>
        </Action>
    </Task>
</TaskerData>
```

#### HUD_Keypress.tsk.xml

```xml
<TaskerData sr="" dvi="1" tv="6.3.15">
    <Task sr="task3">
        <cdate>1706262000000</cdate>
        <edate>1706262000000</edate>
        <id>3</id>
        <nme>HUD_Keypress</nme>
        <pri>6</pri>
        <Action sr="act0" ve="7">
            <code>547</code>
            <Str sr="arg0" ve="3">%keycode</Str>
            <Str sr="arg1" ve="3">%par1</Str>
            <Int sr="arg2" val="0"/>
            <Int sr="arg3" val="0"/>
            <Int sr="arg4" val="0"/>
            <Int sr="arg5" val="3"/>
        </Action>
        <Action sr="act1" ve="7">
            <code>135</code>
            <Str sr="arg0" ve="3">input keyevent %keycode</Str>
            <Int sr="arg1" val="0"/>
            <Str sr="arg2" ve="3"/>
            <Str sr="arg3" ve="3"/>
            <Str sr="arg4" ve="3"/>
            <Int sr="arg5" val="0"/>
            <Int sr="arg6" val="0"/>
        </Action>
    </Task>
</TaskerData>
```

## Step 4: Test Individual Commands

From Termux/PRoot terminal:

```bash
cd /data/data/com.termux/files/home/.termux/tasker

# Test connectivity
curl http://localhost:1821/

# Open HUD interface
./hud-open-url.sh

# Open specific page
./hud-open-url.sh intro/narrative

# Take screenshot
./hud-screenshot.sh test_01

# Send keyboard input
./hud-keypress.sh left
./hud-keypress.sh space
./hud-keypress.sh enter
```

## Step 5: Run Full Test Suite

Once all Tasker tasks are created and working:

```bash
cd /data/data/com.termux/files/home/.termux/tasker
./run-hud-tests.sh
```

This will:
1. Test Tasker connectivity
2. Run 14 automated tests
3. Test navigation (Hebrew/Greek/Drill/Back)
4. Capture screenshots of all major pages
5. Report results

## Troubleshooting

### "Cannot connect to Tasker HTTP Server"

- Ensure Tasker is running (not force-stopped)
- Check HTTP Server is enabled in Preferences → Misc
- Verify port number matches config (default: 1821)
- Try accessing from Chrome: `http://localhost:1821/`

### "Task not found" or no response

- Task names must match exactly: `HUD_Open_URL`, `HUD_Screenshot`, `HUD_Keypress`
- Tasks must be enabled (not disabled)
- Check Tasker run log for errors (Tasker menu → More → Run Log)

### Screenshots not working

Android 11+ restricts screenshot APIs. Solutions:

1. **Use shell command** (no special permissions):
   ```
   Run Shell: screencap -p /sdcard/Pictures/Screenshots/%name.png
   ```

2. **Grant "Draw Over Other Apps"**:
   - Settings → Apps → Tasker → Advanced → Draw over other apps → Allow

3. **Use AutoInput plugin**:
   - Install AutoInput from Play Store
   - Use AutoInput Screenshot action instead

### Keypress not working

- Chrome must be in foreground
- Test with: `adb shell input keyevent KEYCODE_SPACE`
- Some keys require specific Chrome flags or extensions
- Consider using AutoInput plugin for more reliable input

### Wrong port or host

Edit configuration:
```bash
nano /data/data/com.termux/files/home/.termux/tasker/config.sh
```

Change `TASKER_PORT` or `HUD_PORT` as needed.

## Advanced: Response Handling

Tasker can send responses back via HTTP:

In your Tasker task, add:
```
Variable Set: %http_response = success
HTTP Response: %http_response
```

Then check in script:
```bash
RESPONSE=$(curl -s "http://localhost:1821/HUD_Open_URL?url=...")
echo "Tasker responded: $RESPONSE"
```

## Next Steps

1. Set up Tasker HTTP Server
2. Create the 3 required tasks
3. Test individual commands
4. Run full test suite: `./run-hud-tests.sh`
5. Review screenshots in `/sdcard/Pictures/Screenshots/`
6. Verify visual correctness, navigation, colors, zero-scroll

Now Claude can fully automate your HUD testing!
