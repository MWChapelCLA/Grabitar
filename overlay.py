"""
Grabitar Overlay - System-level screen capture overlay
Transparent overlay with right-click context menu for screen capture and annotations
"""

import tkinter as tk
from tkinter import simpledialog, messagebox
import asyncio
import json
import logging
from typing import Optional, Tuple
from capture_manager import CaptureManager
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grabitar.overlay")


class GrabitarOverlay:
    """Transparent overlay window with context menu for screen capture"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.capture_manager = CaptureManager()
        
        # Store selection coordinates
        self.start_x = None
        self.start_y = None
        self.rect = None
        self.selecting = False
        self.selection_mode = None  # 'area', 'square', 'text'
        
        # Store current capture ID
        self.current_capture_id = None
        
        self._setup_window()
        self._create_canvas()
        self._bind_events()
        
    def _setup_window(self):
        """Configure the overlay window"""
        self.root.title("Grabitar Overlay")
        
        # Get screen dimensions
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        
        # Make window full screen
        self.root.geometry(f"{screen_width}x{screen_height}+0+0")
        
        # Make it transparent and always on top
        self.root.attributes("-alpha", 0.3)  # Semi-transparent
        self.root.attributes("-topmost", True)
        
        # Try to make it click-through when not selecting
        try:
            self.root.attributes("-transparentcolor", "white")
        except:
            pass  # Not all platforms support this
            
        self.root.configure(bg='white')
        
    def _create_canvas(self):
        """Create the canvas for drawing selections"""
        self.canvas = tk.Canvas(
            self.root,
            highlightthickness=0,
            bg='white',
            cursor='crosshair'
        )
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
    def _bind_events(self):
        """Bind mouse events"""
        # Right-click for context menu
        self.canvas.bind("<Button-3>", self._show_context_menu)
        
        # Left-click for area selection
        self.canvas.bind("<Button-1>", self._on_mouse_down)
        self.canvas.bind("<B1-Motion>", self._on_mouse_drag)
        self.canvas.bind("<ButtonRelease-1>", self._on_mouse_up)
        
        # ESC to cancel selection
        self.root.bind("<Escape>", self._cancel_selection)
        
        # Keyboard shortcuts
        self.root.bind("<Control-q>", lambda e: self.quit())
        
    def _show_context_menu(self, event):
        """Show right-click context menu"""
        menu = tk.Menu(self.root, tearoff=0)
        
        menu.add_command(
            label="📷 Capture Area",
            command=self._start_capture_area
        )
        menu.add_command(
            label="🖼️ Capture Window",
            command=self._capture_window
        )
        menu.add_separator()
        menu.add_command(
            label="⬛ Add Square",
            command=self._start_add_square
        )
        menu.add_command(
            label="📝 Add Text Annotation",
            command=self._start_add_text
        )
        menu.add_separator()
        menu.add_command(
            label="💾 Save Current Capture",
            command=self._save_capture
        )
        menu.add_command(
            label="🗑️ Clear Annotations",
            command=self._clear_annotations
        )
        menu.add_separator()
        menu.add_command(
            label="❌ Quit Overlay",
            command=self.quit
        )
        
        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()
            
    def _start_capture_area(self):
        """Start area selection mode"""
        self.selection_mode = 'area'
        self.selecting = True
        self.root.attributes("-alpha", 0.3)
        messagebox.showinfo(
            "Capture Area",
            "Click and drag to select an area to capture.\nPress ESC to cancel."
        )
        
    def _capture_window(self):
        """Capture the full screen/window"""
        try:
            # Hide overlay temporarily
            self.root.withdraw()
            self.root.update()
            
            # Wait a bit for overlay to hide
            self.root.after(200, self._do_capture_window)
        except Exception as e:
            logger.error(f"Error capturing window: {e}")
            messagebox.showerror("Error", f"Failed to capture window: {e}")
            self.root.deiconify()
            
    def _do_capture_window(self):
        """Actually perform the window capture"""
        try:
            # Capture full screen
            capture_id = self.capture_manager.capture_screen()
            self.current_capture_id = capture_id
            
            logger.info(f"Captured window with ID: {capture_id}")
            messagebox.showinfo(
                "Capture Complete",
                f"Screen captured!\nCapture ID: {capture_id}\n\n"
                "You can now add annotations or use this in VS Code chat."
            )
            
        except Exception as e:
            logger.error(f"Error in capture: {e}")
            messagebox.showerror("Error", f"Failed to capture: {e}")
        finally:
            # Show overlay again
            self.root.deiconify()
            
    def _start_add_square(self):
        """Start adding a square annotation"""
        if not self.current_capture_id:
            messagebox.showwarning(
                "No Capture",
                "Please capture a screen first before adding annotations."
            )
            return
            
        self.selection_mode = 'square'
        self.selecting = True
        self.root.attributes("-alpha", 0.3)
        messagebox.showinfo(
            "Add Square",
            "Click and drag to draw a square annotation.\nPress ESC to cancel."
        )
        
    def _start_add_text(self):
        """Start adding a text annotation"""
        if not self.current_capture_id:
            messagebox.showwarning(
                "No Capture",
                "Please capture a screen first before adding annotations."
            )
            return
            
        # Get text from user
        text = simpledialog.askstring(
            "Add Text Annotation",
            "Enter the text for the annotation:"
        )
        
        if not text:
            return
            
        # Get position by clicking
        self.selection_mode = 'text'
        self.selecting = True
        self.pending_text = text
        messagebox.showinfo(
            "Position Text",
            f"Click where you want to place: '{text}'\nPress ESC to cancel."
        )
        
    def _on_mouse_down(self, event):
        """Handle mouse down for selection"""
        if not self.selecting:
            return
            
        self.start_x = event.x
        self.start_y = event.y
        
        # For text, just place it at the click position
        if self.selection_mode == 'text':
            self._place_text(event.x, event.y)
            return
            
        # For area/square, start drawing rectangle
        if self.rect:
            self.canvas.delete(self.rect)
        self.rect = self.canvas.create_rectangle(
            self.start_x, self.start_y, self.start_x, self.start_y,
            outline='red', width=3
        )
        
    def _on_mouse_drag(self, event):
        """Handle mouse drag for selection"""
        if not self.selecting or not self.rect:
            return
            
        # Update rectangle
        self.canvas.coords(
            self.rect,
            self.start_x, self.start_y,
            event.x, event.y
        )
        
    def _on_mouse_up(self, event):
        """Handle mouse up - complete selection"""
        if not self.selecting or self.selection_mode == 'text':
            return
            
        end_x = event.x
        end_y = event.y
        
        # Calculate region
        x = min(self.start_x, end_x)
        y = min(self.start_y, end_y)
        width = abs(end_x - self.start_x)
        height = abs(end_y - self.start_y)
        
        if width < 10 or height < 10:
            messagebox.showwarning("Selection Too Small", "Selection is too small. Try again.")
            self._cancel_selection()
            return
            
        # Process based on mode
        if self.selection_mode == 'area':
            self._capture_area(x, y, width, height)
        elif self.selection_mode == 'square':
            self._add_square_annotation(x, y, width, height)
            
        # Clean up
        if self.rect:
            self.canvas.delete(self.rect)
            self.rect = None
        self.selecting = False
        self.selection_mode = None
        
    def _capture_area(self, x: int, y: int, width: int, height: int):
        """Capture a specific area"""
        try:
            # Hide overlay
            self.root.withdraw()
            self.root.update()
            
            # Wait a bit
            self.root.after(200, lambda: self._do_capture_area(x, y, width, height))
            
        except Exception as e:
            logger.error(f"Error capturing area: {e}")
            messagebox.showerror("Error", f"Failed to capture area: {e}")
            self.root.deiconify()
            
    def _do_capture_area(self, x: int, y: int, width: int, height: int):
        """Actually perform the area capture"""
        try:
            # Capture the region
            region = {"x": x, "y": y, "width": width, "height": height}
            capture_id = self.capture_manager.capture_screen(region=region)
            self.current_capture_id = capture_id
            
            logger.info(f"Captured area with ID: {capture_id}")
            messagebox.showinfo(
                "Capture Complete",
                f"Area captured!\nCapture ID: {capture_id}\n"
                f"Region: {width}x{height} at ({x}, {y})\n\n"
                "You can now add annotations or use this in VS Code chat."
            )
            
        except Exception as e:
            logger.error(f"Error in area capture: {e}")
            messagebox.showerror("Error", f"Failed to capture area: {e}")
        finally:
            self.root.deiconify()
            
    def _add_square_annotation(self, x: int, y: int, width: int, height: int):
        """Add a square annotation to the current capture"""
        try:
            self.capture_manager.add_box_annotation(
                self.current_capture_id,
                x, y, width, height,
                color="red",
                line_width=3
            )
            logger.info(f"Added square annotation at ({x}, {y}) size {width}x{height}")
            messagebox.showinfo(
                "Annotation Added",
                f"Square annotation added!\nPosition: ({x}, {y})\nSize: {width}x{height}"
            )
        except Exception as e:
            logger.error(f"Error adding square: {e}")
            messagebox.showerror("Error", f"Failed to add annotation: {e}")
            
    def _place_text(self, x: int, y: int):
        """Place text annotation at position"""
        try:
            text = self.pending_text
            self.capture_manager.add_text_annotation(
                self.current_capture_id,
                text,
                x, y,
                color="red",
                font_size=16
            )
            logger.info(f"Added text annotation '{text}' at ({x}, {y})")
            messagebox.showinfo(
                "Annotation Added",
                f"Text annotation added!\nText: '{text}'\nPosition: ({x}, {y})"
            )
            
            self.selecting = False
            self.selection_mode = None
            self.pending_text = None
            
        except Exception as e:
            logger.error(f"Error adding text: {e}")
            messagebox.showerror("Error", f"Failed to add text: {e}")
            
    def _cancel_selection(self, event=None):
        """Cancel current selection"""
        if self.rect:
            self.canvas.delete(self.rect)
            self.rect = None
        self.selecting = False
        self.selection_mode = None
        self.root.attributes("-alpha", 0.3)
        
    def _save_capture(self):
        """Save the current capture to a file"""
        if not self.current_capture_id:
            messagebox.showwarning(
                "No Capture",
                "No capture to save. Please capture a screen first."
            )
            return
            
        try:
            # Get the annotated image
            image_data = self.capture_manager.get_capture(self.current_capture_id)
            
            if image_data and 'annotated_image' in image_data:
                # Save to file
                filename = f"capture_{self.current_capture_id}.png"
                filepath = f"/workspaces/grabitar/captures/{filename}"
                
                # Create captures directory if needed
                import os
                os.makedirs("/workspaces/grabitar/captures", exist_ok=True)
                
                # Save the image
                with open(filepath, 'wb') as f:
                    import base64
                    f.write(base64.b64decode(image_data['annotated_image']))
                    
                messagebox.showinfo(
                    "Saved",
                    f"Capture saved to:\n{filepath}"
                )
            else:
                messagebox.showerror("Error", "No image data available")
                
        except Exception as e:
            logger.error(f"Error saving capture: {e}")
            messagebox.showerror("Error", f"Failed to save: {e}")
            
    def _clear_annotations(self):
        """Clear all annotations from current capture"""
        if not self.current_capture_id:
            messagebox.showwarning(
                "No Capture",
                "No capture to clear. Please capture a screen first."
            )
            return
            
        try:
            self.capture_manager.clear_annotations(self.current_capture_id)
            messagebox.showinfo(
                "Cleared",
                "All annotations cleared from current capture."
            )
        except Exception as e:
            logger.error(f"Error clearing annotations: {e}")
            messagebox.showerror("Error", f"Failed to clear: {e}")
            
    def quit(self):
        """Quit the overlay"""
        self.root.quit()
        self.root.destroy()
        
    def run(self):
        """Start the overlay"""
        logger.info("Starting Grabitar overlay...")
        logger.info("Right-click anywhere to show context menu")
        logger.info("Press Ctrl+Q to quit")
        self.root.mainloop()


def main():
    """Main entry point for the overlay"""
    overlay = GrabitarOverlay()
    overlay.run()


if __name__ == "__main__":
    main()
