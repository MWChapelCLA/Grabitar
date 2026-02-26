# Running the Grabitar Overlay

## Important: Display Requirements

The Grabitar overlay is a **GUI application** that requires a display server to run. It **cannot run inside the dev container** because dev containers are typically headless environments without X11/Wayland display servers.

## How to Run

### Option 1: Run on Your Local Machine (Recommended)

1. **Clone the repository to your local machine** (outside the dev container):
   ```bash
   git clone <your-repo-url>
   cd grabitar
   ```

2. **Install dependencies**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Run the overlay**:
   ```bash
   python overlay.py
   ```

4. **Right-click anywhere** to access the context menu

### Option 2: Forward X11 from Container (Advanced)

If you want to run the overlay from within the dev container, you need to:

1. **Install X11 forwarding** on your host machine
2. **Set DISPLAY environment variable** in the container
3. **Allow X11 connections** from the container

This is more complex and platform-specific. We recommend Option 1 for most users.

## Testing Without Display

The test page can run without a display. From the dev container:

```bash
python server.py
```

Then open http://localhost:9876 in your browser to see the test page.

## MCP Integration

The MCP server (for VS Code integration) runs automatically when configured in VS Code settings. It doesn't require a display and works fine in the dev container.

The MCP server is started by VS Code with:
```bash
python server.py --mcp
```

This runs in the background and provides the MCP tools to Copilot.
