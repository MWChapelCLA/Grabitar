#!/bin/bash
# Build and install Grabitar VS Code extension

set -e

echo "🔨 Building Grabitar VS Code Extension..."

cd "$(dirname "$0")"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install vsce if not already installed
if ! command -v vsce &> /dev/null; then
    echo "📦 Installing vsce (VS Code Extension packager)..."
    npm install -g @vscode/vsce
fi

# Install dependencies
echo "📦 Installing extension dependencies..."
npm install --production

# Check if Python dependencies are installed
echo "🐍 Checking Python dependencies..."
if ! python3 -c "import fastapi, uvicorn, PIL, mss, mcp" 2>/dev/null; then
    echo "📥 Installing Python dependencies..."
    pip3 install -r server/requirements.txt
fi

# Package the extension
echo "📦 Packaging extension..."
vsce package --out grabitar-1.1.0.vsix

echo ""
echo "✅ Extension built successfully!"
echo ""
echo "📦 Package created: grabitar-1.1.0.vsix"
echo ""
echo "✨ NEW in v1.1.0:"
echo "  • @grabitar chat participant - send captures directly to Copilot chat!"
echo "  • Type '@grabitar /latest' in chat to see your captures"
echo "  • No more clipboard copying needed"
echo ""
echo "To install:"
echo "  1. Open VS Code"
echo "  2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)"
echo "  3. Type 'Extensions: Install from VSIX'"
echo "  4. Select grabitar-1.1.0.vsix"
echo ""
echo "Or install from command line:"
echo "  code --install-extension grabitar-1.1.0.vsix"
echo ""
