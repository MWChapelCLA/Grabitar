# @grabitar Chat Participant Guide

## What is @grabitar?

`@grabitar` is a **chat participant** in VS Code Copilot that lets you send screen captures directly into chat without using the clipboard. It's like having a screenshot assistant right in your chat!

## Quick Start

1. **Capture a screenshot**
   - Inject Grabitar on any webpage (bookmarklet or script tag)
   - Right-click → "🖼️ Capture Window"
   - You'll see a green notification with the capture ID

2. **Open Copilot Chat**
   - Press `Ctrl+Shift+I` (or `Cmd+Shift+I` on Mac)
   - Or use Command Palette → "Chat: Focus on Chat View"

3. **Send capture to chat**
   ```
   @grabitar /latest
   ```

4. **Ask questions**
   ```
   @grabitar /latest What's wrong with this layout?
   @grabitar /latest Suggest improvements for this UI
   @grabitar /latest How can I fix the spacing issues?
   ```

## Available Commands

### `/latest`
Shows your most recent capture. This is the most commonly used command!

**Example:**
```
@grabitar /latest
@grabitar /latest What improvements would you suggest?
```

### `/list`
Lists all captures from the current session with IDs and metadata.

**Example:**
```
@grabitar /list
```

Output:
```
Found 3 capture(s):

- capture_001 - 1920x1080px - 2 annotation(s)
- capture_002 - 1440x900px - 0 annotation(s)
- capture_003 - 1600x1200px - 1 annotation(s)

💡 Use /show <capture_id> to view a specific capture
```

### `/show <capture_id>`
Displays a specific capture by ID.

**Example:**
```
@grabitar /show capture_001
@grabitar /show capture_002 Analyze this error message
```

### `/capture`
Shows instructions for how to capture screenshots.

**Example:**
```
@grabitar /capture
```

## Workflows

### 🐛 Bug Report Workflow

1. **Capture the bug**
   ```
   Right-click → Capture Window
   ```

2. **Optionally annotate**
   ```
   Right-click → Add Square (to highlight the bug)
   Right-click → Add Text (to add notes)
   ```

3. **Send to Copilot**
   ```
   @grabitar /latest This button is misaligned. Can you help me fix it?
   ```

4. **Get code suggestions**
   - Copilot analyzes the image
   - Provides CSS/HTML fixes
   - Suggests improvements

### 🎨 Design Review Workflow

1. **Capture the design**
   ```
   Navigate to your app
   Right-click → Capture Window
   ```

2. **Ask for feedback**
   ```
   @grabitar /latest Review the spacing and typography
   @grabitar /latest Suggest color palette improvements
   @grabitar /latest Does this follow Material Design guidelines?
   ```

### 📚 Documentation Workflow

1. **Capture multiple screens**
   ```
   Capture feature A → capture_001
   Capture feature B → capture_002
   Capture feature C → capture_003
   ```

2. **Reference specific captures**
   ```
   @grabitar /show capture_001 Document how this feature works
   @grabitar /show capture_002 Write user instructions for this screen
   ```

### 🔍 Code Review Workflow

1. **Capture code on screen**
   ```
   Display code in browser/viewer
   Right-click → Capture Area (select the code section)
   ```

2. **Request review**
   ```
   @grabitar /latest Review this function for potential bugs
   @grabitar /latest Suggest performance optimizations
   @grabitar /latest Does this follow best practices?
   ```

## Tips & Tricks

### 💡 Combine with Other Participants

You can mention multiple participants:
```
@workspace @grabitar /latest Is this component defined in our codebase?
```

### 💡 Add Context to Your Questions

The more specific your question, the better the answer:
```
❌ @grabitar /latest What's wrong?
✅ @grabitar /latest The button text is overlapping. What CSS properties should I adjust?
```

### 💡 Use Annotations

Add boxes and text before sending to chat to highlight specific issues:
```
1. Capture window
2. Right-click → Add Square (highlight problem area)
3. Right-click → Add Text (add note: "Button too small")
4. @grabitar /latest Fix the issues I've highlighted
```

### 💡 Capture Multiple Times

If you need to compare before/after or show multiple issues:
```
@grabitar /list
@grabitar /show capture_001 This is before the change
@grabitar /show capture_003 This is after the change - is it better?
```

### 💡 Save Captures for Later

Captures persist for the entire VS Code session:
```
# Morning
Capture issue → capture_001

# Afternoon (hours later)
@grabitar /show capture_001 Can you help me fix this now?
```

## Troubleshooting

### "Grabitar server is not running"

**Solution:**
- Run command: `Grabitar: Start Server`
- Or check status bar and click the Grabitar icon
- Or reload VS Code window

### "No captures yet"

**Solution:**
1. Make sure you've injected Grabitar on a webpage
2. Right-click and select "🖼️ Capture Window"
3. Wait for the green notification
4. Try `@grabitar /latest` again

### "Capture not found"

**Solution:**
- Use `/list` to see available captures
- Make sure you're using the correct capture ID
- Captures are cleared when the server restarts

### Chat participant not showing up

**Solution:**
1. Make sure you have VS Code 1.90.0 or higher
2. Reload VS Code window
3. Check that Grabitar extension is enabled
4. Type `@gra` and it should autocomplete to `@grabitar`

## Advanced Usage

### Multiple Captures in One Conversation

```
@grabitar /show capture_001
Now looking at the homepage...

@grabitar /show capture_002
And here's the dashboard - notice the difference?

Which design is more user-friendly?
```

### Iterative Refinement

```
@grabitar /latest The button is too small

# Copilot suggests CSS changes
# You apply changes and capture again

@grabitar /latest Is this better now?
```

### Team Collaboration

Share capture IDs in team chat:
```
Team: "Check out the bug in capture_005"
You: @grabitar /show capture_005 How serious is this bug?
```

## Keyboard Shortcuts

While there's no built-in shortcut for `@grabitar`, you can create custom keybindings:

1. Open Keyboard Shortcuts (Ctrl+K Ctrl+S)
2. Search for "Grabitar: Send Latest Capture to Chat"
3. Assign your preferred shortcut (e.g., `Ctrl+Alt+G`)

This will automatically open chat with `@grabitar /latest`

## Why Use @grabitar vs Clipboard?

| Method | Steps | Pros |
|--------|-------|------|
| **@grabitar** | 1. Capture<br>2. Type `@grabitar /latest` | ✅ Faster<br>✅ No clipboard pollution<br>✅ Can reference old captures<br>✅ List and compare captures |
| **Clipboard** | 1. Capture<br>2. Right-click → Copy<br>3. Paste in chat | ✅ Works without extension<br>❌ Slower<br>❌ One capture at a time |

## API Reference

All commands follow this pattern:
```
@grabitar [/command] [arguments] [optional question]
```

- **command**: Optional, defaults to help
- **arguments**: Required for `/show` (capture ID)
- **question**: Optional, ask Copilot anything about the capture

---

**Pro Tip:** Set up the bookmarklet once, capture anytime, and use `@grabitar /latest` instantly. It's that simple! 🚀
