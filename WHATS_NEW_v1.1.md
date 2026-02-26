# 🎉 Grabitar v1.1.0 - @grabitar Chat Participant

## What's New?

You can now interact with Grabitar **directly in Copilot chat** using the `@grabitar` participant! No more clipboard copying - captures go straight to chat with full image context.

## Quick Demo

1. **Capture a screenshot:**
   - Click your Grabitar bookmarklet on any webpage
   - Right-click → "🖼️ Capture Window"
   - Green notification appears with capture ID

2. **Send to Copilot chat:**
   ```
   @grabitar /latest What's wrong with this UI?
   ```

3. **Copilot analyzes the image and responds!** 🎉

## Key Features

### 💬 Direct Chat Integration
- Type `@grabitar /latest` to see your most recent capture
- No clipboard copying required
- Images appear directly in chat with full context

### 📋 Available Commands
- `@grabitar /latest` - Show most recent capture
- `@grabitar /list` - List all captures
- `@grabitar /show capture_001` - Show specific capture
- `@grabitar /capture` - Capture instructions

### 🔔 Smart Notifications
When you capture a screenshot, you'll see a green notification:
```
✅ Capture Created!
ID: capture_003
💡 In VS Code, open Copilot chat and type:
   @grabitar /latest
```

## Why This is Better

### Before (v1.0.0):
1. Capture screenshot
2. Right-click → Copy to Clipboard
3. Switch to VS Code
4. Paste in Copilot chat (Ctrl+V)
5. Ask question

### Now (v1.1.0):
1. Capture screenshot
2. Type `@grabitar /latest What's wrong here?` in chat
3. Done! ✨

**3 steps saved!** And you can reference old captures anytime.

## Example Use Cases

### 🐛 Bug Reporting
```
# Capture the bug
Right-click → Capture Window

# Analyze in chat
@grabitar /latest This button is broken. How do I fix it?
```

### 🎨 Design Review
```
# Capture your design
Right-click → Capture Window

# Get feedback
@grabitar /latest Improve the spacing and colors
```

### 📚 Multiple Captures
```
# Capture several screens
capture_001, capture_002, capture_003

# Compare them
@grabitar /show capture_001
@grabitar /show capture_003
Which layout is better?
```

## Installation

### If you already have v1.0.0:
1. Uninstall old version
2. Build new version: `cd vscode-extension && ./build.sh`
3. Install `grabitar-1.1.0.vsix`
4. Reload VS Code

### Fresh install:
```bash
cd /workspaces/grabitar/vscode-extension
./build.sh
code --install-extension grabitar-1.1.0.vsix
```

## Requirements

- **VS Code 1.90.0 or higher** (for Chat Participant API)
- Python 3.8+
- Grabitar server running (auto-starts with extension)

## Documentation

See the full guide: [CHAT_PARTICIPANT_GUIDE.md](vscode-extension/CHAT_PARTICIPANT_GUIDE.md)

## Troubleshooting

### "Grabitar server is not running"
- Run: `Grabitar: Start Server`
- Check status bar indicator

### "@grabitar not showing up"
- Make sure VS Code is 1.90.0+
- Reload window: `Developer: Reload Window`
- Type `@gra` and it should autocomplete

### "No captures yet"
1. Inject Grabitar on a webpage (bookmarklet)
2. Right-click → Capture Window
3. Wait for green notification
4. Try `@grabitar /latest` again

## Server Port Change

The server now runs on port **9876** (was 8080) to avoid common port collisions.

Update your bookmarklet if you have an old one:
```javascript
javascript:(function(){var s=document.createElement('script');s.src='http://localhost:9876/static/grabitar-inject.js';document.head.appendChild(s);})()
```

## Feedback

This is a major improvement to the Grabitar workflow! The @grabitar chat participant makes screenshot analysis seamless and natural.

Try it out and see how much faster your workflow becomes! 🚀

---

**Made with ❤️ for GitHub Copilot and VS Code**
