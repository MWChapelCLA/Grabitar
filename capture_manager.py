"""
Capture Manager for Grabitar.
Handles screen capture and annotation management.
"""

import io
import base64
import os
from datetime import datetime
from typing import Dict, List, Optional, Union
from PIL import Image, ImageDraw, ImageFont
import mss

from annotations import Annotation, BoxAnnotation, TextAnnotation


class Capture:
    """Represents a single screen capture with annotations."""
    
    def __init__(self, capture_id: str, image: Image.Image, monitor: int = 0, region: Optional[dict] = None):
        self.id = capture_id
        self.original_image = image
        self.monitor = monitor
        self.region = region or {}
        self.timestamp = datetime.now().isoformat()
        self.annotations: List[Annotation] = []
    
    def add_box_annotation(self, x: int, y: int, width: int, height: int, 
                          color: str = "red", line_width: int = 3, label: Optional[str] = None):
        """Add a box annotation to this capture."""
        annotation = BoxAnnotation(
            x=x, y=y, width=width, height=height,
            color=color, line_width=line_width, label=label
        )
        self.annotations.append(annotation)
    
    def add_text_annotation(self, x: int, y: int, text: str, 
                           font_size: int = 20, color: str = "red", background: Optional[str] = "white"):
        """Add a text annotation to this capture."""
        annotation = TextAnnotation(
            x=x, y=y, text=text,
            font_size=font_size, color=color, background=background
        )
        self.annotations.append(annotation)
    
    def render_annotated_image(self) -> Image.Image:
        """Render the image with all annotations applied."""
        # Create a copy of the original image
        image = self.original_image.copy()
        draw = ImageDraw.Draw(image)
        
        # Render each annotation
        for annotation in self.annotations:
            annotation.render(draw, image)
        
        return image
    
    def to_base64(self) -> str:
        """Convert the annotated image to base64 data URI."""
        image = self.render_annotated_image()
        
        # Convert to PNG bytes
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Encode to base64
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        return f"data:image/png;base64,{img_base64}"
    
    def to_bytes(self) -> bytes:
        """Convert the annotated image to PNG bytes."""
        image = self.render_annotated_image()
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer.read()
    
    def to_markdown(self) -> str:
        """Convert to markdown image syntax."""
        base64_uri = self.to_base64()
        return f"![Capture {self.id}]({base64_uri})"
    
    def get_metadata(self) -> dict:
        """Get capture metadata."""
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "monitor": self.monitor,
            "region": self.region,
            "width": self.original_image.width,
            "height": self.original_image.height,
            "annotation_count": len(self.annotations),
            "annotations": [
                {
                    "type": ann.type,
                    **(ann.model_dump(exclude={"type"}))
                }
                for ann in self.annotations
            ]
        }


class CaptureManager:
    """Manages screen captures and provides capture functionality."""
    
    def __init__(self):
        self.captures: Dict[str, Capture] = {}
        self._capture_counter = 0
        self.mock_mode = not self._has_display()
        if self.mock_mode:
            print("⚠️  No display detected - using MOCK MODE with test images")
    
    def _has_display(self) -> bool:
        """Check if a display is available."""
        return os.environ.get('DISPLAY') is not None
    
    def _create_mock_image(self, width: int = 1920, height: int = 1080) -> Image.Image:
        """Create a mock test image when no display is available."""
        # Create a gradient background
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        # Create gradient background
        for y in range(height):
            color_val = int(200 - (y / height) * 50)
            draw.line([(0, y), (width, y)], fill=(color_val, color_val + 20, color_val + 40))
        
        # Add grid pattern
        grid_size = 100
        for x in range(0, width, grid_size):
            draw.line([(x, 0), (x, height)], fill=(180, 180, 200), width=1)
        for y in range(0, height, grid_size):
            draw.line([(0, y), (width, y)], fill=(180, 180, 200), width=1)
        
        # Add "MOCK MODE" watermark
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Main watermark
        text = "MOCK SCREEN CAPTURE"
        bbox = draw.textbbox((0, 0), text, font=font_large)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # Shadow
        draw.text((x + 3, y + 3), text, fill=(100, 100, 100), font=font_large)
        # Main text
        draw.text((x, y), text, fill=(102, 126, 234), font=font_large)
        
        # Info text
        info_text = f"Test Image {width}x{height} - Add annotations to test!"
        bbox = draw.textbbox((0, 0), info_text, font=font_small)
        info_width = bbox[2] - bbox[0]
        info_x = (width - info_width) // 2
        info_y = y + text_height + 30
        draw.text((info_x, info_y), info_text, fill=(80, 80, 80), font=font_small)
        
        # Add some sample UI elements to annotate
        # Simulated button
        button_x, button_y = width // 4, height // 4
        draw.rectangle([button_x, button_y, button_x + 150, button_y + 50], 
                      fill=(67, 110, 238), outline=(50, 90, 200), width=2)
        draw.text((button_x + 35, button_y + 15), "Button", fill='white', font=font_small)
        
        # Simulated input field
        input_x, input_y = width // 2 + 100, height // 4
        draw.rectangle([input_x, input_y, input_x + 300, input_y + 45], 
                      fill='white', outline=(150, 150, 150), width=2)
        draw.text((input_x + 10, input_y + 12), "Input Field", fill=(150, 150, 150), font=font_small)
        
        # Simulated checkbox area
        check_x, check_y = width // 4, height // 2 + 100
        draw.rectangle([check_x, check_y, check_x + 30, check_y + 30], 
                      fill='white', outline=(100, 100, 100), width=2)
        draw.text((check_x + 45, check_y + 5), "Checkbox Option", fill=(60, 60, 60), font=font_small)
        
        return image
    
    def _generate_capture_id(self) -> str:
        """Generate a unique capture ID."""
        self._capture_counter += 1
        return f"capture_{self._capture_counter:03d}"
    
    def capture_screen(self, monitor: int = 0, region: Optional[dict] = None, 
                       capture_id: Optional[str] = None) -> Capture:
        """
        Capture a screenshot.
        
        Args:
            monitor: Monitor number (0 for primary, 1+ for additional monitors)
            region: Optional dict with keys: x, y, width, height
            capture_id: Optional custom ID for the capture
        
        Returns:
            Capture object
        """
        if capture_id is None:
            capture_id = self._generate_capture_id()
        
        # Use mock mode if no display is available
        if self.mock_mode:
            # Determine size based on region or defaults
            if region:
                width = region.get('width', 1920)
                height = region.get('height', 1080)
            else:
                width = 1920
                height = 1080
            
            image = self._create_mock_image(width, height)
            capture = Capture(capture_id, image, monitor, region)
            self.captures[capture_id] = capture
            return capture
        
        # Real screen capture
        try:
            with mss.mss() as sct:
                # Get monitor info
                if monitor == 0:
                    # All monitors combined
                    monitor_region = sct.monitors[0]
                else:
                    # Specific monitor
                    if monitor >= len(sct.monitors):
                        raise ValueError(f"Monitor {monitor} not found. Available monitors: {len(sct.monitors) - 1}")
                    monitor_region = sct.monitors[monitor]
                
                # Apply custom region if specified
                if region:
                    capture_region = {
                        "top": region.get("y", monitor_region["top"]),
                        "left": region.get("x", monitor_region["left"]),
                        "width": region.get("width", monitor_region["width"]),
                        "height": region.get("height", monitor_region["height"]),
                    }
                else:
                    capture_region = monitor_region
                
                # Capture the screen
                screenshot = sct.grab(capture_region)
                
                # Convert to PIL Image
                image = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        except Exception as e:
            # Fallback to mock mode if capture fails
            print(f"⚠️  Screen capture failed: {e}. Using mock mode.")
            width = region.get('width', 1920) if region else 1920
            height = region.get('height', 1080) if region else 1080
            image = self._create_mock_image(width, height)
        
        # Create capture object
        capture = Capture(capture_id, image, monitor, region)
        self.captures[capture_id] = capture
        
        return capture
    
    def create_capture_from_data(self, image_data: str, capture_id: Optional[str] = None) -> Capture:
        """
        Create a capture from base64 image data (typically from browser).
        
        Args:
            image_data: Base64 data URL (e.g., "data:image/png;base64,...")
            capture_id: Optional custom ID for the capture
        
        Returns:
            Capture object
        """
        if capture_id is None:
            capture_id = self._generate_capture_id()
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]
        
        # Decode base64 to image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create capture object
        capture = Capture(capture_id, image, monitor=0, region=None)
        self.captures[capture_id] = capture
        
        return capture
    
    def get_capture(self, capture_id: str) -> Optional[Capture]:
        """Get a capture by ID."""
        return self.captures.get(capture_id)
    
    def list_captures(self) -> List[dict]:
        """List all captures with metadata."""
        return [capture.get_metadata() for capture in self.captures.values()]
    
    def delete_capture(self, capture_id: str) -> bool:
        """Delete a specific capture."""
        if capture_id in self.captures:
            del self.captures[capture_id]
            return True
        return False
    
    def clear_all(self):
        """Clear all captures."""
        self.captures.clear()
        self._capture_counter = 0
    
    def get_latest_capture(self) -> Optional[Capture]:
        """Get the most recently created capture."""
        if not self.captures:
            return None
        return list(self.captures.values())[-1]
