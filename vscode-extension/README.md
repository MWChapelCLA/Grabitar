# Grabitar VS Code Extension

🎨 Injectable screen capture overlay for GitHub Copilot with **@grabitar Chat Participant**

## Features

- **💬 @grabitar Chat Participant**: Interact directly in Copilot chat - no clipboard needed!
- **📸 Screen Capture**: Right-click to capture any webpage or UI element
- **✏️ Annotations**: Add boxes and text annotations to highlight issues
- **🤖 Copilot Integration**: Automatically available in Copilot chat via MCP protocol
- **📋 Direct to Chat**: Captures appear instantly in chat - just type `@grabitar /latest`
- **🌐 Universal**: Works on any webpage via bookmarklet injection
- **⚡ Auto-start**: Server starts automatically with VS Code

## Quick Start

1. **Install the extension** (Python 3.8+ required)
2. The Grabitar server starts automatically on port **9876**
   - First run will automatically install Python dependencies if needed
3. Get the bookmarklet: Command Palette → `Grabitar: Get Bookmarklet Code`
4. Create a browser bookmark with the provided code
5. Navigate to any webpage and click your Grabitar bookmark
6. Right-click to capture
7. In Copilot chat, type `@grabitar /latest` to see your capture!

## 💬 Using @grabitar in Chat

Once you've captured a screenshot, interact with it directly in Copilot chat:

```
@grabitar /latest
```

Shows your most recent capture with full image context.

### Available Commands:

- `@grabitar /capture` - Instructions for capturing screenshots
- `@grabitar /list` - List all captures in the current session
- `@grabitar /show capture_001` - Display a specific capture by ID
- `@grabitar /latest` - Display the most recent capture (most common!)

### Example Workflow:

1. Capture a webpage: Right-click → **Capture Window**
2. Open Copilot chat
3. Type: `@grabitar /latest What's wrong with this layout?`
4. Copilot analyzes your screenshot and provides feedback!

No clipboard copying needed - the image goes directly to chat! 🎉

## Commands

- `Grabitar: Start Server` - Start the Grabitar server
- `Grabitar: Stop Server` - Stop the Grabitar server
- `Grabitar: Get Bookmarklet Code` - Get the bookmarklet to inject Grabitar on any page
- `Grabitar: Open Test Page` - Open the test page in your browser
- `Grabitar: Show Server Status` - Show current server status

## Usage

### Method 1: Bookmarklet (Recommended)

1. Run command: `Grabitar: Get Bookmarklet Code`
2. Copy the bookmarklet code
3. Create a new bookmark in your browser with this code as the URL
4. Click the bookmark on any webpage to activate Grabitar

### Method 2: Inject into Your App

Add to your HTML:
```html
<script src="http://localhost:9876/static/grabitar-inject.js"></script>
```

### Method 3: Browser Console

Open browser console (F12) and paste:
```javascript
var s=document.createElement('script');
s.src='http://localhost:9876/static/grabitar-inject.js';
document.head.appendChild(s);
```

### Capturing & Annotating

1. Right-click anywhere → **Capture Window**
2. Right-click → **Add Square** to highlight areas
3. Right-click → **Add Text** to add notes
4. Right-click → **Copy to Clipboard**
5. Paste in Copilot chat (Ctrl+V)
6. Ask Copilot questions about your capture!

## Configuration

Access via Settings → Extensions → Grabitar:

- **Port**: Server port (default: 9876)
- **Auto Start**: Automatically start server on VS Code launch (default: true)
- **Python Path**: Path to Python executable (default: "python")

## Requirements

- Python 3.8+
- Required Python packages (installed automatically):
  - `fastapi`
  - `uvicorn`
  - `pillow`
  - `mss`
  - `mcp`

## Status Bar

The status bar shows Grabitar server status:
- **$(record) Grabitar** - Server is running
- **$(debug-stop) Grabitar** - Server is stopped

Click the status bar item to see detailed status and quick actions.

## MCP Integration

Grabitar integrates with GitHub Copilot via the Model Context Protocol (MCP). Add to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "grabitar": {
      "command": "python",
      "args": ["<path-to-extension>/server/server.py", "--mcp"]
    }
  }
}
```

The extension handles server management, but MCP tools are available in Copilot:
- `capture_screen` - Capture screenshots
- `add_box_annotation` - Add box annotations
- `add_text_annotation` - Add text annotations
- `get_capture_image` - Retrieve annotated images
- `list_captures` - List all captures

## Requirements

- VS Code 1.85.0 or higher
- Python 3.8 or higher
- Python dependencies (auto-installed on first run):
  - fastapi
  - uvicorn
  - pillow
  - mss
  - mcp

## Troubleshooting

### Server won't start

1. Check Python is installed: `python --version`
2. Check output channel: View → Output → Grabitar
3. Verify port 9876 is available
4. Try setting custom Python path in settings
5. If dependency installation fails, manually install:
   ```bash
   pip install fastapi uvicorn pillow mss mcp
   ```

### Bookmarklet doesn't work

1. Verify server is running (check status bar)
2. Try accessing http://localhost:9876 directly
3. Check browser console for errors
4. Make sure you're using `localhost` not `127.0.0.1`

### Captures not appearing in Copilot

1. Verify MCP server is configured in settings.json
2. Reload VS Code window
3. Check Copilot is enabled and working

## Development

This extension runs a local FastAPI server that:
- Serves the injectable overlay script
- Stores screen captures and annotations
- Provides MCP tools for Copilot integration
- Handles clipboard operations

## License

MIT License - Copyright (c) 2026 Michael Chapel

## Author

**Michael Chapel**

## Support

For issues and feature requests, visit: [GitHub Issues](https://github.com/michaelchapel/grabitar/issues)
