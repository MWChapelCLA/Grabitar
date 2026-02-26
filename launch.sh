#!/bin/bash
# Quick launcher script for Grabitar components

echo "🚀 Grabitar Launcher"
echo ""
echo "What would you like to run?"
echo ""
echo "1) Overlay GUI (requires display)"
echo "2) Test page server (localhost:9876)"  
echo "3) MCP server (for VS Code)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Starting overlay..."
        echo "Note: This requires a display server (X11/Wayland)"
        echo "Right-click anywhere to show the context menu"
        echo "Press Ctrl+Q to quit"
        echo ""
        python overlay.py
        ;;
    2)
        echo ""
        echo "Starting test page server..."
        echo "Open http://localhost:9876 in your browser"
        echo "Press Ctrl+C to stop"
        echo ""
        python server.py
        ;;
    3)
        echo ""
        echo "Starting MCP server..."
        echo "This runs in MCP protocol mode for VS Code integration"
        echo ""
        python server.py --mcp
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
