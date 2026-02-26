# 🎯 Region Capture & Annotation Testing Guide

## New Features Added ✨

### 1. **Region Capture** ✂️
Select specific areas of your screen to capture instead of the entire screen.

### 2. **Interactive Region Selection** 🖱️
Visual click-and-drag selection for precise region capture.

### 3. **Automated Testing** 🧪
One-click test button to verify all annotation features.

---

## How to Use

### 🌐 Web UI Features

#### **Option 1: Full Screen Capture**
1. Click **"📷 Capture Screen"** button
2. Entire screen is captured
3. Annotations can be added

#### **Option 2: Region Capture (Interactive)**
1. Click **"✂️ Capture Region"** button
2. Screen overlay appears
3. **Click and drag** to select the region you want to capture
4. Release mouse to capture that specific region
5. Press **ESC** to cancel selection

#### **Option 3: Test Annotations** 
1. Click **"🧪 Test Annotations"** button
2. Automatically:
   - Captures screen
   - Adds 3 boxes (red, blue, green square)
   - Adds 1 yellow square
   - Adds 2 text annotations (purple header, orange note)
3. Watch the status messages as each annotation is added

### 📦 Drawing Tools

#### **Box Tool** (Rectangles & Squares)
- Select "□ Box" tool
- Click and drag on the image
- Creates boxes/rectangles
- Perfect squares: make width = height

#### **Text Tool**
- Select "T Text" tool  
- Click where you want text
- Type your text in the dialog
- Press Enter or click OK

### 🎨 Customization Options

- **Color**: Choose from 8 colors (red, blue, green, yellow, orange, purple, black, white)
- **Line Width**: 1-10 pixels for boxes
- **Font Size**: 10-60 for text

---

## API Testing

### Test via Command Line

```bash
# Run the comprehensive test suite
./test_grabitar.sh
```

This will test:
- Full screen capture
- Region capture (800x600 at position 100,100)
- 4 box annotations (rectangles and squares)
- 3 text annotations
- Image retrieval
- Complete workflow

### Manual API Testing

#### Capture Full Screen
```bash
curl -X POST http://localhost:8080/api/capture \
  -H "Content-Type: application/json" \
  -d '{"monitor": 0}'
```

#### Capture Specific Region
```bash
curl -X POST http://localhost:8080/api/capture \
  -H "Content-Type: application/json" \
  -d '{
    "monitor": 0,
    "region": {"x": 100, "y": 100, "width": 800, "height": 600}
  }'
```

#### Add Rectangle
```bash
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/box \
  -H "Content-Type: application/json" \
  -d '{
    "x": 50, "y": 50, "width": 300, "height": 200,
    "color": "red", "line_width": 4, "label": "Important Area"
  }'
```

#### Add Square
```bash
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/box \
  -H "Content-Type: application/json" \
  -d '{
    "x": 400, "y": 100, "width": 200, "height": 200,
    "color": "blue", "line_width": 5, "label": "Square Highlight"
  }'
```

#### Add Text
```bash
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/text \
  -H "Content-Type: application/json" \
  -d '{
    "x": 100, "y": 350, "text": "Bug Here!",
    "font_size": 24, "color": "red", "background": "yellow"
  }'
```

#### Get Annotated Image
```bash
# As PNG file
curl http://localhost:8080/api/captures/capture_001/image -o screenshot.png

# As Base64 for Copilot
curl http://localhost:8080/api/captures/capture_001/image?format=base64
```

---

## MCP / Copilot Chat Usage

### Capture with Copilot

```
User: Capture my screen

User: Capture a region at position 200, 200 with size 800x600

User: Add a red box at 100, 150 size 300x200 with label "Bug Area"

User: Add a blue square at 500, 500 size 200x200

User: Add text "Critical issue" at 150, 350 in orange

User: Show me the capture

User: List all my captures
```

---

## Examples

### Example 1: Bug Documentation
```bash
# Capture region around the bug
curl -X POST http://localhost:8080/api/capture \
  -d '{"region": {"x": 100, "y": 100, "width": 600, "height": 400}}'

# Highlight the bug with red box
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/box \
  -d '{"x": 50, "y": 50, "width": 200, "height": 100, "color": "red", "label": "Login Button Bug"}'

# Add description
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/text \
  -d '{"x": 50, "y": 180, "text": "Button not clickable", "font_size": 18, "color": "red"}'

# Get the image
curl http://localhost:8080/api/captures/capture_001/image -o bug_report.png
```

### Example 2: UI Review with Multiple Annotations
```bash
# Capture full screen
curl -X POST http://localhost:8080/api/capture -d '{"monitor": 0}'

# Mark header area (blue)
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/box \
  -d '{"x": 0, "y": 0, "width": 1920, "height": 80, "color": "blue", "label": "Header"}'

# Mark sidebar area (green)
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/box \
  -d '{"x": 0, "y": 80, "width": 250, "height": 1000, "color": "green", "label": "Sidebar"}'

# Mark content area (orange square)
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/box \
  -d '{"x": 300, "y": 150, "width": 800, "height": 800, "color": "orange", "label": "Content"}'

# Add notes
curl -X POST http://localhost:8080/api/captures/capture_001/annotations/text \
  -d '{"x": 100, "y": 1100, "text": "Spacing needs adjustment", "font_size": 20}'
```

---

## Tips & Tricks 💡

1. **Perfect Squares**: When using the API, set width = height
2. **Region Selection**: Use ESC key to cancel region selection
3. **Test Button**: Use the test button to see example annotations
4. **Multiple Monitors**: Change monitor dropdown (0 = primary, 1+ = additional)
5. **Labels**: Add labels to boxes for better context
6. **Colors**: Use contrasting colors for visibility
7. **Background**: Add text backgrounds for better readability

---

## Keyboard Shortcuts ⌨️

- **ESC**: Cancel region selection
- **Enter**: Submit text in text annotation dialog

---

## Troubleshooting

### Region capture not working?
- Make sure the overlay appears when you click the button
- Try clicking and dragging - don't just click
- Make the region at least 50x50 pixels

### Annotations not showing?
- Wait 1-2 seconds for the server to process
- Check the capture list on the right to verify

### Can't see the capture?
- Click on the capture in the list to load it
- Try capturing again if the image doesn't appear

---

## What's Working ✅

- ✅ Full screen capture
- ✅ Region capture with coordinates
- ✅ Interactive region selection (click & drag)
- ✅ Box annotations (rectangles)
- ✅ Square annotations (equal width/height boxes)
- ✅ Text annotations with customizable font/color
- ✅ Multiple annotations per capture
- ✅ Image export (PNG and Base64)
- ✅ WebSocket real-time updates
- ✅ Automated testing
- ✅ MCP integration for Copilot

---

**🎉 All features are fully implemented and tested!**

Ready to capture, annotate, and share with Copilot! 🚀
