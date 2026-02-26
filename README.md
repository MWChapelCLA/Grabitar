![Grabitar Logo](/icon/Logo.png)

# 📸 Grabitar - Injectable Screen Capture MCP Server

Grabitar is an **injectable overlay** that works on ANY webpage, allowing you to capture content, annotate it, and paste directly into VS Code Copilot chat. It integrates with GitHub Copilot via the Model Context Protocol (MCP).

## ✨ Features

- **🔌 Injectable Anywhere**: Works on any webpage via bookmarklet or script tag
- **� @grabitar Chat Participant**: Direct integration in Copilot chat - no clipboard needed!
- **🖱️ Right-Click Context Menu**: Access capture tools with right-click
- **🎛️ Floating Controls**: Draggable toolbar always accessible
- **📸 Smart Capture**: Select regions or capture full page
- **🎨 Live Annotations**: Add boxes and text directly on page
- **📋 Clipboard Integration**: Copy and paste into Copilot chat
- **🤖 VS Code MCP Integration**: Installable MCP server + chat participant
- **🌐 Universal**: Works in dev containers and local environments
- **⚡ Zero Config**: Easy one-click injection

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  Browser Page (localhost:9876)      │
│  - Floating overlay controls        │
│  - Right-click context menu         │
│  - Canvas for annotations           │
│  - html-to-image for screenshots    │
└──────────────┬──────────────────────┘
               │ HTTP API
┌──────────────▼──────────────────────┐
│  MCP Server (server.py --mcp)       │
│  - Stores captures & annotations    │
│  - Makes them available to VS Code  │
│  - Provides Copilot chat tools      │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Install the MCP Server in VS Code

Add to VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "grabitar": {
      "command": "/workspaces/grabitar/.venv/bin/python",
      "args": ["/workspaces/grabitar/server.py", "--mcp"],
      "cwd": "/workspaces/grabitar"
    }
  }
}
```

**Note:** If using a different virtual environment or system Python, adjust the `command` path accordingly. In dev containers, use the full path to the virtual environment's Python executable.

### 2. Start the Server

```bash
cd /workspaces/grabitar
python server.py
```

Server runs on **http://localhost:9876**

### 3. Get the Bookmarklet

In VS Code Copilot chat, ask:
```
get grabitar bookmarklet
```

Copy the bookmarklet code and save it as a browser bookmark.

### 4. Use on Any Page

**Option A: Bookmarklet (Universal)**
- Navigate to any webpage
- Click your Grabitar bookmarklet
- Overlay appears!

**Option B: Inject into Your App**
Add to your HTML:
```html
<script src="http://localhost:9876/static/grabitar-inject.js"></script>
```

**Option C: Console (One-time)**
Open console (F12) and paste:
```javascript
var s=document.createElement('script');
s.src='http://localhost:9876/static/grabitar-inject.js';
document.body.appendChild(s);
```

### 5. Capture & Paste

**Option A: Direct to Chat (VS Code Extension)**
1. **Right-click** anywhere → Capture Window
2. Open Copilot chat
3. Type: `@grabitar /latest`
4. Ask questions about the image!

**Option B: Clipboard Method**
1. **Right-click** anywhere → Capture Window
2. Optionally add annotations
3. **Right-click** → Copy to Clipboard
4. **Paste in Copilot** (Ctrl+V)
5. Ask questions about the image!

📖 **Full Guide**: See [INSTALL.md](INSTALL.md) for detailed setup

## 📖 How to Use

### Capturing Screens

**Capture Window (Full Screen):**
1. Right-click anywhere
2. Select "🖼️ Capture Window"
3. The overlay hides briefly and captures your screen
4. A notification shows the capture ID

**Capture Area (Region):**
1. Right-click anywhere
2. Select "📷 Capture Area"
3. Click and drag to select the region
4. Release to complete the capture

### Adding Annotations

**Add Box Annotation:**
1. First, capture a screen (you'll get a capture ID)
2. Right-click and select "⬛ Add Square"
3. Click and drag to draw a box
4. The box is added to your capture

**Add Text Annotation:**
1. First, capture a screen 
2. Right-click and select "📝 Add Text Annotation"
3. Type your text in the dialog
4. Click where you want the text placed

### Using in VS Code Copilot

**With @grabitar Chat Participant (Recommended):**

Once you've captured, simply open Copilot chat and type:

```
@grabitar /latest
```

The capture appears instantly with full image context. Then ask questions:

```
@grabitar /latest What's wrong with this UI?
@grabitar /latest Suggest CSS fixes for the layout
@grabitar /show capture_001 Analyze this design
```

**With MCP Tools (Alternative):**

Once you've captured and annotated, the capture is available in VS Code. In Copilot chat, you can reference it:

```
Show me capture_2024_02_26_123456
What's wrong with this UI element?
Analyze the layout in my capture
```

### Keyboard Shortcuts

- **Ctrl+Q** - Quit the overlay
- **ESC** - Cancel current selection

## 🧪 Test Page

The test page at `http://localhost:9876` is a simple webpage designed for testing captures:

- Multiple colored cards to practice area selection
- Different elements with varying styles
- Instructions on how to use the overlay
- Visual targets for annotation practice

**It's not the main interface** - it's just a test target!

## 🛠️ Technical Details

### Files

- **overlay.py** - Main overlay GUI (Tkinter-based)
- **server.py** - MCP server + test page web server
- **capture_manager.py** - Screen capture and annotation logic
- **annotations.py** - Annotation data models
- **static/index.html** - Test webpage
- **static/style.css** - Test page styles
- **static/app.js** - Test page scripts (minimal)

### MCP Tools

#### `capture_screen`
Capture a screenshot.

**Parameters:**
- `monitor` (optional): Monitor number (0 = primary, 1+ = additional)
- `region` (optional): `{x, y, width, height}` for specific area
- `capture_id` (optional): Custom ID for the capture

**Example:**
```
Capture my screen
```

#### `add_box_annotation`
Add a box/rectangle annotation.

**Parameters:**
- `capture_id`: ID of capture to annotate
- `x`, `y`: Position of top-left corner
- `width`, `height`: Box dimensions
- `color` (optional): Color name (default: "red")
- `line_width` (optional): Line thickness (default: 3)
- `label` (optional): Text label for the box

**Example:**
```
Add a red box at position 100, 200 with size 300x150 and label "Important"
```

#### `add_text_annotation`
Add text annotation.

**Parameters:**
- `capture_id`: ID of capture to annotate
- `x`, `y`: Text position
- `text`: Text content
- `font_size` (optional): Font size (default: 20)
- `color` (optional): Text color (default: "red")
- `background` (optional): Background color (default: "white")

**Example:**
```
Add text "Bug here" at position 500, 300 in blue
```

#### `get_capture_image`
Get the annotated image for chat context.

**Parameters:**
- `capture_id`: ID of capture to retrieve
- `format` (optional): "base64" or "markdown" (default: "markdown")

**Example:**
```
Show me capture_001
```

#### `list_captures`
List all captures in the current session.

**Example:**
```
List all captures
```

#### `delete_capture`
Delete a specific capture.

**Parameters:**
- `capture_id`: ID of capture to delete

#### `clear_all_captures`
Clear all captures from the session.

## 📁 Project Structure

```
/workspaces/grabitar/
├── overlay.py             # Main overlay GUI (Tkinter)
├── server.py              # MCP server + test page server
├── capture_manager.py     # Screen capture and session management
├── annotations.py         # Annotation classes (box, text)
├── requirements.txt       # Python dependencies
├── README.md              # This file
├── IMPLEMENTATION_PLAN.md # Detailed architecture documentation
├── static/                # Test page assets
│   ├── index.html        # Simple test webpage
│   └── style.css         # (inline in HTML)
└── .vscode/
    └── settings.json     # MCP configuration for VSCode
```

## 🎯 Example Workflows

### Workflow 1: Bug Documentation

1. Run `python overlay.py`
2. Navigate to the buggy UI
3. Right-click → "📷 Capture Area"
4. Select the problem area
5. Right-click → "⬛ Add Square" to highlight the bug
6. Right-click → "📝 Add Text" to add note "Button misaligned"
7. In VS Code Copilot: "Analyze the UI bug in my latest capture"

### Workflow 2: Code Review

1. Have code visible on screen
2. Right-click → "🖼️ Capture Window"
3. Right-click → "⬛ Add Square" around function to review
4. Right-click → "📝 Add Text" with note "Needs optimization"
5. In Copilot: "Review the highlighted function and suggest improvements"

### Workflow 3: Design Feedback

1. Open design in browser/app
2. Right-click → "📷 Capture Area" on specific component
3. Add multiple annotations for different issues
4. In Copilot: "Generate CSS to fix the spacing issues highlighted"

## 🛠️ Development

### Running the Overlay

```bash
python overlay.py
```

### Running the Test Page Server

```bash
python server.py
```

Then open http://localhost:9876 to see the test page.

### Running in MCP Mode

The MCP server runs automatically when VS Code starts (configured in settings). To run manually:

```bash
python server.py --mcp
```

## 🔧 Configuration

### VSCode MCP Configuration

Located in `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "grabitar": {
      "command": "python",
      "args": ["/workspaces/grabitar/server.py", "--mcp"],
      "env": {}
    }
  }
}
```

### Multi-Monitor Setup

Grabitar supports multiple monitors. Use `monitor` parameter:
- `0`: Primary monitor (all monitors combined)
- `1`: First additional monitor
- `2`: Second additional monitor
- etc.

## 🐛 Troubleshooting

### Screen Capture Not Working

**Linux**: May need permissions for screen capture:
```bash
# Give permissions if needed
xhost +local:
```

**macOS**: Grant screen recording permission in System Preferences → Security & Privacy → Screen Recording

**Windows**: Should work out of the box

### Web UI Not Loading

1. Check server is running: `http://localhost:9876`
2. Check console for errors
3. Verify static files exist in `static/` directory

### Copilot Not Seeing MCP Server

1. **Check Python path**: Ensure the `command` in settings.json points to the correct Python executable (with MCP dependencies installed)
2. **Verify paths**: In dev containers, use `/workspaces/grabitar/` not local paths
3. **Check dependencies**: Run `/workspaces/grabitar/.venv/bin/python -c "import mcp"` to verify MCP is installed
4. **Reload VSCode**: Reload window after changing settings.json
5. **Check logs**: Look for MCP errors in VSCode Output panel (select "MCP" from dropdown)
6. **Test manually**: Run `/workspaces/grabitar/.venv/bin/python server.py --mcp` to check for startup errors

## 📋 Requirements

- Python 3.8+
- Pillow (image manipulation)
- mss (screen capture)
- FastAPI + Uvicorn (web server)
- MCP SDK (Copilot integration)

See `requirements.txt` for full list.

## 🚦 Limitations

- **Linux display servers**: Works best with X11. Wayland support may vary
- **Overlay transparency**: May not work perfectly on all platforms/window managers
- **Session-based**: Captures are stored in memory (cleared on restart)
- **No persistence**: Captures not automatically saved to disk
- **Single capture workflow**: Can only annotate the most recently captured image

## 🔮 Future Enhancements

- **Multi-monitor selection** - Choose which monitor to overlay
- **Persistent storage** - Save captures to disk automatically
- **Capture history** - View and manage multiple captures
- **Annotation editing** - Edit or delete existing annotations
- **More annotation types** - Arrows, circles, freehand drawing
- **Screen recording** - Capture video/GIF in addition to still images
- **Hotkeys** - Global keyboard shortcuts (e.g., Ctrl+Shift+C to capture)
- **Color picker** - Choose custom colors for annotations
- **Undo/redo** - Support for multi-step annotation editing

## 📝 License

MIT License - Copyright (c) 2026 Michael Chapel

## 👨‍💻 Author

**Michael Chapel**

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/michaelchapel/grabitar/issues).

## 💡 Tips

- **Practice on test page first**: Use the test page at localhost:9876 to get comfortable
- **Capture then annotate**: Always capture the screen before adding annotations
- **Use ESC to cancel**: Press ESC anytime to cancel a selection or annotation
- **Descriptive text**: Add clear text labels to help Copilot understand your intent
- **Ctrl+Q to quit**: Quickly exit the overlay when done
- **Different colors**: Future versions will support color selection for better categorization
- **VS Code integration**: Captures are automatically available in Copilot - just reference the capture ID

---

**Made with ❤️ for GitHub Copilot and VSCode by Michael Chapel**
