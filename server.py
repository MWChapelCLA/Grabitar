"""
Grabitar - Screen Capture MCP Server with Web UI
Hybrid server supporting both MCP protocol for Copilot and FastAPI for web UI
"""

import asyncio
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, Response, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uvicorn

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource

from capture_manager import CaptureManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grabitar")

# Global capture manager
capture_manager = CaptureManager()

# MCP Server setup
mcp_server = Server("grabitar")

# ========== MCP TOOLS ==========

@mcp_server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List all available MCP tools."""
    return [
        Tool(
            name="capture_screen",
            description="Capture a screenshot. Can capture full screen or specific region.",
            inputSchema={
                "type": "object",
                "properties": {
                    "monitor": {
                        "type": "integer",
                        "description": "Monitor number (0 for primary, 1+ for others)",
                        "default": 0
                    },
                    "region": {
                        "type": "object",
                        "description": "Optional region to capture",
                        "properties": {
                            "x": {"type": "integer"},
                            "y": {"type": "integer"},
                            "width": {"type": "integer"},
                            "height": {"type": "integer"}
                        }
                    },
                    "capture_id": {
                        "type": "string",
                        "description": "Optional custom ID for the capture"
                    }
                }
            }
        ),
        Tool(
            name="add_box_annotation",
            description="Add a box/rectangle annotation to a capture",
            inputSchema={
                "type": "object",
                "properties": {
                    "capture_id": {
                        "type": "string",
                        "description": "ID of the capture to annotate"
                    },
                    "x": {"type": "integer", "description": "X position of top-left corner"},
                    "y": {"type": "integer", "description": "Y position of top-left corner"},
                    "width": {"type": "integer", "description": "Width of the box"},
                    "height": {"type": "integer", "description": "Height of the box"},
                    "color": {
                        "type": "string",
                        "description": "Color name or hex code",
                        "default": "red"
                    },
                    "line_width": {
                        "type": "integer",
                        "description": "Line width in pixels",
                        "default": 3
                    },
                    "label": {
                        "type": "string",
                        "description": "Optional text label for the box"
                    }
                },
                "required": ["capture_id", "x", "y", "width", "height"]
            }
        ),
        Tool(
            name="add_text_annotation",
            description="Add text annotation to a capture",
            inputSchema={
                "type": "object",
                "properties": {
                    "capture_id": {
                        "type": "string",
                        "description": "ID of the capture to annotate"
                    },
                    "x": {"type": "integer", "description": "X position of the text"},
                    "y": {"type": "integer", "description": "Y position of the text"},
                    "text": {"type": "string", "description": "Text content"},
                    "font_size": {
                        "type": "integer",
                        "description": "Font size",
                        "default": 20
                    },
                    "color": {
                        "type": "string",
                        "description": "Text color",
                        "default": "red"
                    },
                    "background": {
                        "type": "string",
                        "description": "Background color",
                        "default": "white"
                    }
                },
                "required": ["capture_id", "x", "y", "text"]
            }
        ),
        Tool(
            name="get_capture_image",
            description="Get the annotated image for attachment to chat context",
            inputSchema={
                "type": "object",
                "properties": {
                    "capture_id": {
                        "type": "string",
                        "description": "ID of the capture to retrieve"
                    },
                    "format": {
                        "type": "string",
                        "description": "Output format: 'base64' or 'markdown'",
                        "enum": ["base64", "markdown"],
                        "default": "markdown"
                    }
                },
                "required": ["capture_id"]
            }
        ),
        Tool(
            name="list_captures",
            description="List all captures in the current session",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="delete_capture",
            description="Delete a specific capture",
            inputSchema={
                "type": "object",
                "properties": {
                    "capture_id": {
                        "type": "string",
                        "description": "ID of the capture to delete"
                    }
                },
                "required": ["capture_id"]
            }
        ),
        Tool(
            name="clear_all_captures",
            description="Clear all captures from the session",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_bookmarklet",
            description="Get the Grabitar bookmarklet code to inject overlay into any webpage",
            inputSchema={
                "type": "object",
                "properties": {
                    "server_url": {
                        "type": "string",
                        "description": "Server URL (default: http://localhost:9876)",
                        "default": "http://localhost:9876"
                    }
                }
            }
        ),
        Tool(
            name="install_overlay",
            description="Get instructions for installing Grabitar overlay on any frontend application",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@mcp_server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent | ImageContent | EmbeddedResource]:
    """Handle MCP tool calls."""
    
    try:
        if name == "capture_screen":
            monitor = arguments.get("monitor", 0)
            region = arguments.get("region")
            capture_id = arguments.get("capture_id")
            
            capture = capture_manager.capture_screen(monitor, region, capture_id)
            
            return [TextContent(
                type="text",
                text=f"Screen captured successfully!\n\nCapture ID: {capture.id}\n"
                     f"Dimensions: {capture.original_image.width}x{capture.original_image.height}\n"
                     f"Timestamp: {capture.timestamp}\n\n"
                     f"Use 'add_box_annotation' or 'add_text_annotation' to annotate, "
                     f"then 'get_capture_image' to view."
            )]
        
        elif name == "add_box_annotation":
            capture_id = arguments["capture_id"]
            capture = capture_manager.get_capture(capture_id)
            
            if not capture:
                return [TextContent(type="text", text=f"Error: Capture '{capture_id}' not found")]
            
            capture.add_box_annotation(
                x=arguments["x"],
                y=arguments["y"],
                width=arguments["width"],
                height=arguments["height"],
                color=arguments.get("color", "red"),
                line_width=arguments.get("line_width", 3),
                label=arguments.get("label")
            )
            
            return [TextContent(
                type="text",
                text=f"Box annotation added to capture '{capture_id}'!\n"
                     f"Position: ({arguments['x']}, {arguments['y']})\n"
                     f"Size: {arguments['width']}x{arguments['height']}\n"
                     f"Total annotations: {len(capture.annotations)}"
            )]
        
        elif name == "add_text_annotation":
            capture_id = arguments["capture_id"]
            capture = capture_manager.get_capture(capture_id)
            
            if not capture:
                return [TextContent(type="text", text=f"Error: Capture '{capture_id}' not found")]
            
            capture.add_text_annotation(
                x=arguments["x"],
                y=arguments["y"],
                text=arguments["text"],
                font_size=arguments.get("font_size", 20),
                color=arguments.get("color", "red"),
                background=arguments.get("background", "white")
            )
            
            return [TextContent(
                type="text",
                text=f"Text annotation added to capture '{capture_id}'!\n"
                     f"Text: '{arguments['text']}'\n"
                     f"Position: ({arguments['x']}, {arguments['y']})\n"
                     f"Total annotations: {len(capture.annotations)}"
            )]
        
        elif name == "get_capture_image":
            capture_id = arguments["capture_id"]
            capture = capture_manager.get_capture(capture_id)
            
            if not capture:
                return [TextContent(type="text", text=f"Error: Capture '{capture_id}' not found")]
            
            format_type = arguments.get("format", "markdown")
            
            if format_type == "markdown":
                markdown = capture.to_markdown()
                return [TextContent(type="text", text=markdown)]
            else:
                base64_uri = capture.to_base64()
                return [TextContent(type="text", text=base64_uri)]
        
        elif name == "list_captures":
            captures = capture_manager.list_captures()
            
            if not captures:
                return [TextContent(type="text", text="No captures found in the current session.")]
            
            result = "**Captures:**\n\n"
            for cap in captures:
                result += f"- **{cap['id']}**\n"
                result += f"  - Timestamp: {cap['timestamp']}\n"
                result += f"  - Dimensions: {cap['width']}x{cap['height']}\n"
                result += f"  - Annotations: {cap['annotation_count']}\n\n"
            
            return [TextContent(type="text", text=result)]
        
        elif name == "delete_capture":
            capture_id = arguments["capture_id"]
            success = capture_manager.delete_capture(capture_id)
            
            if success:
                return [TextContent(type="text", text=f"Capture '{capture_id}' deleted successfully.")]
            else:
                return [TextContent(type="text", text=f"Error: Capture '{capture_id}' not found.")]
        
        elif name == "clear_all_captures":
            capture_manager.clear_all()
            return [TextContent(type="text", text="All captures cleared successfully.")]
        
        elif name == "get_bookmarklet":
            server_url = arguments.get("server_url", "http://localhost:8080")
            bookmarklet_code = f"javascript:(function(){{var s=document.createElement('script');s.src='{server_url}/static/grabitar-inject.js';document.head.appendChild(s);}})()"
            
            result = f"""**Grabitar Bookmarklet**

To use Grabitar on any webpage:

**Method 1: Bookmarklet (Recommended)**
1. Drag this link to your bookmarks bar: 
   [📸 Grabitar]({bookmarklet_code})
   
2. Or create a bookmark with this code:
   ```
   {bookmarklet_code}
   ```

3. Click the bookmark on any page to inject the overlay

**Method 2: Console Injection**
Open browser console (F12) and paste:
```javascript
var s=document.createElement('script');
s.src='{server_url}/static/grabitar-inject.js';
document.head.appendChild(s);
```

**Method 3: Add to Your App**
Add this to your HTML:
```html
<script src="{server_url}/static/grabitar-inject.js"></script>
```

Once injected:
- Right-click anywhere for context menu
- Use floating controls to capture & annotate
- Click "Copy to Clipboard" to get image
- Paste in Copilot chat (Ctrl+V)

Server URL: {server_url}
Make sure the Grabitar server is running!
"""
            return [TextContent(type="text", text=result)]
        
        elif name == "install_overlay":
            result = """**Installing Grabitar Overlay**

## Quick Start

1. **Start the Grabitar server** (if not already running):
   ```bash
   cd /path/to/grabitar
   python server.py
   ```
   Server runs on http://localhost:9876

2. **Get the bookmarklet**:
   Ask Copilot: "get grabitar bookmarklet"

3. **Use on any page**:
   - Click the bookmarklet on any webpage
   - Or add the script tag to your app's HTML
   - Overlay appears with capture controls

## For Your Frontend App

Add to your HTML (e.g., in index.html or layout):

```html
<!-- Add before closing </body> tag -->
<script src="http://localhost:9876/static/grabitar-inject.js"></script>
```

Or load conditionally (dev only):

```javascript
if (process.env.NODE_ENV === 'development') {
  const script = document.createElement('script');
  script.src = 'http://localhost:9876/static/grabitar-inject.js';
  document.head.appendChild(script);
}
```

## VS Code Integration

The MCP server is already configured. Captures automatically available in Copilot.

## Usage
Once overlay is loaded:
- **Right-click** anywhere → Context menu
- **Capture Area** → Select region
- **Capture Window** → Full page
- **Add Square** → Draw annotations
- **Add Text** → Click to place text
- **Copy to Clipboard** → Paste in Copilot (Ctrl+V)
"""
            return [TextContent(type="text", text=result)]
        
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    
    except Exception as e:
        logger.error(f"Error executing tool {name}: {e}", exc_info=True)
        return [TextContent(type="text", text=f"Error: {str(e)}")]


# ========== FASTAPI WEB UI ==========

app = FastAPI(title="Grabitar", description="Screen Capture with Annotations")

# Enable CORS so the injected script can work from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Pydantic models for API
class CaptureRequest(BaseModel):
    monitor: int = 0
    region: Optional[dict] = None
    imageData: Optional[str] = None  # Base64 data URL from browser capture

class BoxAnnotationRequest(BaseModel):
    x: int
    y: int
    width: int
    height: int
    color: str = "red"
    line_width: int = 3
    label: Optional[str] = None

class TextAnnotationRequest(BaseModel):
    x: int
    y: int
    text: str
    font_size: int = 20
    color: str = "red"
    background: Optional[str] = "white"


@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    """Serve the main web UI."""
    try:
        static_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
        with open(static_path, "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(
            content="<h1>Grabitar</h1><p>UI not found. Please ensure static files exist.</p>",
            status_code=503
        )


@app.get("/api/captures")
async def list_captures_api():
    """List all captures."""
    return JSONResponse(content=capture_manager.list_captures())


@app.post("/api/capture")
async def capture_screen_api(request: CaptureRequest):
    """Capture screen."""
    try:
        # Log for debugging
        logger.info(f"Capture request: monitor={request.monitor}, region={request.region}, has_imageData={bool(request.imageData)}")
        
        # If browser-captured image data is provided, use it
        if request.imageData:
            logger.info(f"Using browser-captured imageData (size: {len(request.imageData)} chars)")
            capture = capture_manager.create_capture_from_data(request.imageData)
        else:
            # Fall back to OS-level screen capture
            logger.info("Falling back to OS-level screen capture")
            capture = capture_manager.capture_screen(request.monitor, request.region)
        
        return JSONResponse(content=capture.get_metadata())
    except Exception as e:
        logger.error(f"Capture error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/captures/{capture_id}/annotations/box")
async def add_box_annotation_api(capture_id: str, annotation: BoxAnnotationRequest):
    """Add box annotation."""
    capture = capture_manager.get_capture(capture_id)
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
    
    capture.add_box_annotation(**annotation.model_dump())
    
    return JSONResponse(content={"success": True, "annotation_count": len(capture.annotations)})


@app.post("/api/captures/{capture_id}/annotations/text")
async def add_text_annotation_api(capture_id: str, annotation: TextAnnotationRequest):
    """Add text annotation."""
    capture = capture_manager.get_capture(capture_id)
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
    
    capture.add_text_annotation(**annotation.model_dump())
    
    return JSONResponse(content={"success": True, "annotation_count": len(capture.annotations)})


@app.get("/api/captures/{capture_id}/image")
async def get_capture_image_api(capture_id: str, format: str = "png"):
    """Get capture image."""
    capture = capture_manager.get_capture(capture_id)
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
    
    if format == "base64":
        return JSONResponse(content={"image": capture.to_base64()})
    else:
        image_bytes = capture.to_bytes()
        return Response(content=image_bytes, media_type="image/png")


@app.delete("/api/captures/{capture_id}")
async def delete_capture_api(capture_id: str):
    """Delete capture."""
    success = capture_manager.delete_capture(capture_id)
    if not success:
        raise HTTPException(status_code=404, detail="Capture not found")
    
    return JSONResponse(content={"success": True})


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates."""
    await websocket.accept()
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass


# ========== MAIN ENTRYPOINT ==========

async def run_mcp_server():
    """Run the MCP server for Copilot integration."""
    async with stdio_server() as (read_stream, write_stream):
        await mcp_server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="grabitar",
                server_version="1.0.0",
                capabilities=mcp_server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                )
            )
        )


def run_web_server():
    """Run the FastAPI web server."""
    uvicorn.run(app, host="0.0.0.0", port=9876, log_level="info")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--mcp":
        # Run in MCP mode for Copilot
        asyncio.run(run_mcp_server())
    else:
        # Run in web server mode
        logger.info("Starting Grabitar web server on http://localhost:9876")
        run_web_server()
