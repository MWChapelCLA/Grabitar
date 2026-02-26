# Installing Grabitar VS Code Extension

## 📦 Package the Extension

1. **Navigate to extension directory:**
   ```bash
   cd /workspaces/grabitar/vscode-extension
   ```

2. **Install Node.js dependencies (if you want to modify the extension):**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   ./build.sh
   ```
   
   Note: Python dependencies will be auto-installed when users first run the extension.
   
   Or manually:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```

   This creates `grabitar-1.0.0.vsix`

## 🔧 Install the Extension

### Method 1: VS Code UI

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type and select: **"Extensions: Install from VSIX..."**
4. Navigate to `/workspaces/grabitar/vscode-extension/`
5. Select `grabitar-1.0.0.vsix`
6. Click **Install**
7. Reload VS Code when prompted

### Method 2: Command Line

```bash
code --install-extension /workspaces/grabitar/vscode-extension/grabitar-1.0.0.vsix
```

### Method 3: Drag and Drop

1. Open VS Code
2. Open the Extensions view (Ctrl+Shift+X)
3. Drag `grabitar-1.0.0.vsix` into the Extensions view
4. Confirm installation

## ✅ Verify Installation

1. Check the status bar - you should see **$(record) Grabitar** or **$(debug-stop) Grabitar**
2. Open Command Palette (Ctrl+Shift+P) and type "Grabitar" - you should see 5 commands:
   - Grabitar: Start Server
   - Grabitar: Stop Server
   - Grabitar: Get Bookmarklet Code
   - Grabitar: Open Test Page
   - Grabitar: Show Server Status

3. Click the Grabitar status bar item to see server status

## ⚙️ Configure (Optional)

Open Settings (Ctrl+,) and search for "Grabitar":

- **Port**: Change server port (default: 9876)
- **Auto Start**: Auto-start server on VS Code launch (default: true)
- **Python Path**: Path to Python executable (default: "python")

## 🚀 First Use

1. **Ensure Python 3.8+ is installed**: `python --version`
2. The server should start automatically (check status bar)
3. On first run, the extension will automatically install required Python packages (fastapi, uvicorn, pillow, mss, mcp)
4. Check the Grabitar output channel if there are any issues
2. Run command: **"Grabitar: Get Bookmarklet Code"**
3. Copy the bookmarklet and create a browser bookmark
4. Navigate to any webpage
5. Click your Grabitar bookmark
6. Right-click to capture!

## 🔄 Updating

To update the extension:

1. Make changes to the code
2. Increment version in `package.json`
3. Run `vsce package` again
4. Uninstall old version from VS Code
5. Install new `.vsix` file

## 🐛 Troubleshooting

### Extension won't install
- Check VS Code version (requires 1.85.0+)
- Try restarting VS Code
- Check VS Code output panel for errors

### Server won't start
- Check Python is installed: `python --version` (Python 3.8+ required)
- Check the Grabitar output channel (View → Output → Grabitar)
- If auto-install failed, manually install dependencies:
  ```bash
  pip install fastapi uvicorn pillow mss mcp
  ```
- Verify port 9876 is not in use: `lsof -i :9876`
- Try setting custom Python path in settings: `grabitar.pythonPath`

### Can't find commands
- Reload VS Code window (Ctrl+Shift+P → "Developer: Reload Window")
- Check extension is enabled (Extensions view)

## 📝 MCP Configuration

For GitHub Copilot integration, add to VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "grabitar": {
      "command": "python",
      "args": ["<USER_HOME>/.vscode/extensions/grabitar-1.0.0/server/server.py", "--mcp"],
      "cwd": "<USER_HOME>/.vscode/extensions/grabitar-1.0.0/server"
    }
  }
}
```

Replace `<USER_HOME>` with your actual home directory or extension installation path.

## 🗑️ Uninstall

1. Open Extensions view (Ctrl+Shift+X)
2. Search for "Grabitar"
3. Click the gear icon → Uninstall
4. Or use: `code --uninstall-extension grabitar.grabitar`

## 📦 Publishing (Optional)

To publish to VS Code Marketplace:

1. Create a publisher account at https://marketplace.visualstudio.com/
2. Get a Personal Access Token
3. Run: `vsce login <publisher-name>`
4. Update `publisher` in `package.json`
5. Run: `vsce publish`

---

**Made with ❤️ for GitHub Copilot**
