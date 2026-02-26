"""
Annotation classes for Grabitar screen capture tool.
Supports box and text annotations on captured images.
"""

from typing import Literal, Optional
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel


class Annotation(BaseModel):
    """Base class for annotations."""
    type: str
    
    def render(self, draw: ImageDraw.ImageDraw, image: Image.Image):
        """Render the annotation on the image."""
        raise NotImplementedError


class BoxAnnotation(Annotation):
    """Box/rectangle annotation with optional label."""
    type: Literal["box"] = "box"
    x: int
    y: int
    width: int
    height: int
    color: str = "red"
    line_width: int = 3
    label: Optional[str] = None
    
    def render(self, draw: ImageDraw.ImageDraw, image: Image.Image):
        """Draw a box annotation on the image."""
        # Draw the rectangle
        x2 = self.x + self.width
        y2 = self.y + self.height
        
        draw.rectangle(
            [self.x, self.y, x2, y2],
            outline=self.color,
            width=self.line_width
        )
        
        # Add label if provided
        if self.label:
            # Load default font
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
            except:
                font = ImageFont.load_default()
            
            # Calculate text size and position
            bbox = draw.textbbox((0, 0), self.label, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # Position label above the box
            label_x = self.x
            label_y = max(0, self.y - text_height - 5)
            
            # Draw background for text
            draw.rectangle(
                [label_x - 2, label_y - 2, label_x + text_width + 2, label_y + text_height + 2],
                fill="white"
            )
            
            # Draw text
            draw.text((label_x, label_y), self.label, fill=self.color, font=font)


class TextAnnotation(Annotation):
    """Text annotation at a specific position."""
    type: Literal["text"] = "text"
    x: int
    y: int
    text: str
    font_size: int = 20
    color: str = "red"
    background: Optional[str] = "white"
    
    def render(self, draw: ImageDraw.ImageDraw, image: Image.Image):
        """Draw text annotation on the image."""
        # Load font
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", self.font_size)
        except:
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", self.font_size)
            except:
                font = ImageFont.load_default()
        
        # Calculate text size
        bbox = draw.textbbox((0, 0), self.text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Draw background if specified
        if self.background:
            padding = 4
            draw.rectangle(
                [
                    self.x - padding,
                    self.y - padding,
                    self.x + text_width + padding,
                    self.y + text_height + padding
                ],
                fill=self.background,
                outline=self.color,
                width=2
            )
        
        # Draw text
        draw.text((self.x, self.y), self.text, fill=self.color, font=font)
