# Changelog

All notable changes to the Grabitar extension will be documented in this file.

## [1.1.0] - 2026-02-26

### Added
- **@grabitar Chat Participant** - Revolutionary new way to interact with captures!
  - Type `@grabitar /latest` in Copilot chat to instantly see your captures
  - No more clipboard copying - images go directly to chat
  - Commands: `/capture`, `/list`, `/show <id>`, `/latest`
  - Full image context automatically provided to Copilot
- Auto-notification when capture is created
  - Green notification shows capture ID
  - Reminds you to use `@grabitar /latest` in chat
- New command: "Grabitar: Send Latest Capture to Chat"
- Chat participant icon (Designer.png)

### Changed
- Updated VS Code engine requirement to 1.90.0+ (required for Chat API)
- Enhanced capture workflow with direct-to-chat integration
- Improved user experience with notification system

### Technical
- Implemented `vscode.chat.createChatParticipant` API
- Added capture fetching via HTTP from local server
- Temporary image storage for chat display
- Stream-based chat responses with markdown and images

## [1.0.0] - 2026-02-26

### Added
- Initial release of Grabitar VS Code extension
- Auto-starting server on VS Code launch
- Status bar indicator for server status
- Commands for server management:
  - Start/Stop server
  - Get bookmarklet code
  - Open test page
  - Show server status
- Configuration options for port, auto-start, and Python path
- MCP protocol integration for GitHub Copilot
- Injectable overlay script served from local server (port 9876)
- Screen capture with html-to-image (browser-based)
- Annotation tools (box and text)
- Clipboard integration for pasting into Copilot
- Right-click context menu on any webpage
- Floating draggable control panel
- Test page for practicing captures

### Features
- 📸 Capture any webpage element or full page
- ✏️ Add box and text annotations
- 📋 Copy to clipboard and paste into Copilot chat
- 🔌 Injectable via bookmarklet on any webpage
- 🤖 Full MCP integration with GitHub Copilot
- 🎨 Visual feedback and status messages
- ⚡ Zero-config setup with auto-start

### Technical Details
- Server runs on port 9876 (configurable)
- Python backend with FastAPI
- PIL/Pillow for image processing
- mss for OS-level screen capture (fallback)
- html-to-image for browser-based capture
- CORS enabled for cross-origin injection
- Session-based capture storage (in-memory)

### Requirements
- VS Code 1.85.0 or higher
- Python 3.8 or higher
- Required Python packages: fastapi, uvicorn, pillow, mss, mcp
