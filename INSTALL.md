# 🚀 Grabitar Installation Guide

Complete guide for installing and using Grabitar MCP server with VS Code and any frontend application.

## 📦 What You Get

- **MCP Server** for VS Code Copilot integration
- **Injectable Overlay** that works on any webpage
- **Bookmarklet** for one-click injection
- **Right-click context menu** for easy access
- **Clipboard integration** to paste captures into Copilot

---

## 🔧 Installation

### 1. Install Grabitar MCP Server in VS Code

Add this to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "grabitar": {
      "command": "python",
      "args": [
        "/workspaces/grabitar/server.py",
        "--mcp"
      ],
      "cwd": "/workspaces/grabitar"
    }
  }
}
```

**To add:**
1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "mcp servers"
3. Click "Edit in settings.json"
4. Add the grabitar configuration above

### 2. Start the Grabitar Server

The MCP server runs automatically when VS Code starts, but you also need the web server for the overlay to work:

```bash
cd /workspaces/grabitar
python server.py
```

This starts the web server on **http://localhost:9876** which serves the injectable script.

---

## 🎯 Usage Methods

### Method 1: Bookmarklet (Universal - Works Anywhere)

**Get the Bookmarklet:**
1. In VS Code, ask Copilot: `get grabitar bookmarklet`
2. Copy the bookmarklet code
3. Create a new bookmark in your browser
4. Paste the code as the URL
5. Name it "📸 Grabitar"

**Use the Bookmarklet:**
1. Navigate to any webpage
2. Click the "📸 Grabitar" bookmark
3. Overlay appears with controls
4. Right-click for context menu

### Method 2: Inject into Your Frontend App

**For Development:**

Add to your HTML (e.g., `index.html`):

```html
<!-- Add near the end of <body> tag -->
<script src="http://localhost:8080/static/grabitar-inject.js"></script>
```

**For Conditional Loading (Dev Only):**

```javascript
// React/Vue/Angular
if (process.env.NODE_ENV === 'development') {
  const script = document.createElement('script');
  script.src = 'http://localhost:9876/static/grabitar-inject.js';
  document.body.appendChild(script);
}
```

**For Next.js:**

In `pages/_app.js` or `app/layout.js`:

```javascript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const script = document.createElement('script');
    script.src = 'http://localhost:9876/static/grabitar-inject.js';
    document.body.appendChild(script);
  }
}, []);
```

### Method 3: Browser Console

For quick one-time use:

1. Open browser console (F12)
2. Paste this and press Enter:

```javascript
var s=document.createElement('script');
s.src='http://localhost:9876/static/grabitar-inject.js';
document.body.appendChild(s);
```

---

## 🎨 Using the Overlay

Once the overlay is injected, you'll see:

1. **Floating Controls** (top-right corner)
   - Draggable and minimizable
   - 📷 Capture Area
   - 🖼️ Capture Window
   - ⬛ Add Square
   - 📝 Add Text
   - ✓ Copy to Clipboard

2. **Right-Click Context Menu**
   - Works anywhere on the page
   - Same options as floating controls
   - Quick access without clicking UI

### Workflow

1. **Capture** something:
   - Right-click → "Capture Window" (full page)
   - Or "Capture Area" → Click & drag to select

2. **Annotate** (optional):
   - Right-click → "Add Square" → Draw box
   - Right-click → "Add Text" → Type & click to place

3. **Send to Copilot**:
   - Right-click → "Copy to Clipboard"
   - Or click "✓ Copy to Clipboard" button
   - Image is copied with all annotations

4. **Paste in Copilot**:
   - Open Copilot chat in VS Code
   - Press Ctrl+V (Cmd+V on Mac)
   - Image appears in chat
   - Ask questions about it!

---

## 💡 Example Workflows

### Bug Documentation

```
1. Navigate to your app with the bug
2. Inject Grabitar (bookmarklet or already injected)
3. Right-click → "Capture Window"
4. Right-click → "Add Square" → Draw around bug
5. Right-click → "Add Text" → Type "Button misaligned"
6. Right-click → "Copy to Clipboard"
7. In Copilot: Paste image and ask "How do I fix this alignment?"
```

### Design Review

```
1. Open your app's design/UI
2. Capture specific components
3. Add multiple annotations highlighting issues
4. Copy to clipboard
5. Paste in Copilot and ask for CSS improvements
```

### Code Review with Context

```
1. Have your app running showing the feature
2. Capture the UI
3. Annotate the specific area
4. Paste in Copilot
5. Ask: "Here's my current UI. Review the code for this feature."
```

---

## 🔍 Troubleshooting

### "Grabitar already loaded" message

The overlay is already injected. Refresh the page if you need to reload it.

### Bookmarklet doesn't work

- Make sure the Grabitar server is running on port 9876
- Check browser console for errors
- Try the console injection method instead

### Can't copy to clipboard

Some browsers restrict clipboard access. The image will be downloaded instead - drag it into Copilot chat.

### CORS errors

Make sure you're using `http://localhost:9876` not `http://127.0.0.1:9876`

### Overlay doesn't appear

- Check that JavaScript is enabled
- Check browser console for errors
- Ensure no Content Security Policy is blocking the script

---

## ⌨️ Keyboard Shortcuts

- **ESC** - Cancel current operation
- **Ctrl+V / Cmd+V** - Paste captured image in Copilot

---

## 🎓 MCP Tools Available in Copilot

Ask Copilot these questions:

- `get grabitar bookmarklet` - Get bookmarklet code
- `install grabitar overlay` - Get installation instructions
- `list captures` - See all captures
- `show me capture_ID` - View specific capture
- `capture my screen` - (Future: direct capture)

---

## 🔒 Security Note

The injectable overlay works by loading JavaScript from `localhost:9876`. Only use this in development environments. Do not deploy apps with Grabitar injection to production.

---

## 📝 Configuration

### Change Server Port

Edit `server.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=YOUR_PORT)
```

Update `grabitar-inject.js`:
```javascript
const GRABITAR_SERVER = 'http://localhost:YOUR_PORT';
```

---

## 🎉 You're Ready!

Now you can capture and annotate any webpage and use those images as context in GitHub Copilot chat!

**Quick Start Reminder:**
1. Server running? `python server.py`
2. Bookmarklet ready? Get from Copilot
3. Click bookmark on any page
4. Right-click → Capture → Annotate → Copy → Paste in Copilot!
