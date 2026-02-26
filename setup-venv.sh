#!/bin/bash
# Setup virtual environment for Grabitar

set -e

echo "🔧 Setting up Grabitar virtual environment..."

# Remove existing venv if it exists
if [ -d ".venv" ]; then
    echo "⚠️  Removing existing .venv directory..."
    rm -rf .venv
fi

# Create new virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv .venv

# Upgrade pip
echo "⬆️  Upgrading pip..."
.venv/bin/pip install --upgrade pip

# Install requirements
echo "📥 Installing dependencies from requirements.txt..."
.venv/bin/pip install -r requirements.txt

# Verify installation
echo ""
echo "✅ Virtual environment setup complete!"
echo ""
echo "To activate the virtual environment:"
echo "  source .venv/bin/activate"
echo ""
echo "To verify MCP installation:"
echo "  .venv/bin/python -c 'import mcp; print(\"MCP version:\", mcp.__version__)'"
echo ""
