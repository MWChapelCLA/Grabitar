/**
 * Grabitar - Browser-based Screen Capture Overlay
 * Right-click context menu + floating controls for screen capture and annotations
 */

class GrabitarOverlay {
    constructor() {
        this.currentCaptureId = null;
        this.selectionMode = null; // 'area', 'square', 'text'
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
        this.annotations = [];
        
        this.initElements();
        this.initEvents();
        this.initCanvas();
        
        this.showStatus('Grabitar loaded! Right-click anywhere or use the floating controls.', 3000);
    }
    
    initElements() {
        this.overlay = document.getElementById('grabitarOverlay');
        this.contextMenu = document.getElementById('contextMenu');
        this.selectionOverlay = document.getElementById('selectionOverlay');
        this.selectionBox = document.getElementById('selectionBox');
        this.annotationCanvas = document.getElementById('annotationCanvas');
        this.statusMessage = document.getElementById('statusMessage');
        this.overlayMinimize = document.getElementById('overlayMinimize');
    }
    
    initCanvas() {
        this.ctx = this.annotationCanvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.annotationCanvas.width = window.innerWidth;
        this.annotationCanvas.height = window.innerHeight;
        this.redrawAnnotations();
    }
    
    initEvents() {
        // Minimize/maximize overlay
        this.overlayMinimize.addEventListener('click', () => {
            this.overlay.classList.toggle('minimized');
            this.overlayMinimize.textContent = this.overlay.classList.contains('minimized') ? '+' : '−';
        });
        
        // Make overlay draggable
        this.makeDraggable();
        
        // Context menu
        document.addEventListener('contextmenu', (e) => {
            // Don't override context menu inside the overlay controls
            if (e.target.closest('.grabitar-overlay') || e.target.closest('.grabitar-context-menu')) {
                return;
            }
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });
        
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // Context menu actions
        document.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Overlay button actions
        document.getElementById('captureArea').addEventListener('click', () => this.handleAction('capture-area'));
        document.getElementById('captureWindow').addEventListener('click', () => this.handleAction('capture-window'));
        document.getElementById('addSquare').addEventListener('click', () => this.handleAction('add-square'));
        document.getElementById('addText').addEventListener('click', () => this.handleAction('add-text'));
        document.getElementById('sendVSCode').addEventListener('click', () => this.handleAction('send-vscode'));
        
        // Selection overlay events
        this.selectionOverlay.addEventListener('mousedown', (e) => this.startSelection(e));
        this.selectionOverlay.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.selectionOverlay.addEventListener('mouseup', (e) => this.endSelection(e));
        
        // ESC to cancel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelSelection();
            }
        });
        
        // Annotation canvas events
        this.annotationCanvas.addEventListener('mousedown', (e) => this.startAnnotation(e));
        this.annotationCanvas.addEventListener('mousemove', (e) => this.updateAnnotation(e));
        this.annotationCanvas.addEventListener('mouseup', (e) => this.endAnnotation(e));
    }
    
    makeDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        const header = document.getElementById('overlayHeader');
        
        header.addEventListener('mousedown', (e) => {
            if (e.target === this.overlayMinimize) return;
            isDragging = true;
            initialX = e.clientX - this.overlay.offsetLeft;
            initialY = e.clientY - this.overlay.offsetTop;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                this.overlay.style.left = currentX + 'px';
                this.overlay.style.top = currentY + 'px';
                this.overlay.style.right = 'auto';
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    showContextMenu(x, y) {
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
    }
    
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }
    
    showStatus(message, duration = 2000) {
        this.statusMessage.textContent = message;
        this.statusMessage.style.display = 'block';
        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, duration);
    }
    
    async handleAction(action) {
        this.hideContextMenu();
        
        switch (action) {
            case 'capture-area':
                this.startCaptureArea();
                break;
            case 'capture-window':
                await this.captureWindow();
                break;
            case 'add-square':
                this.startAddSquare();
                break;
            case 'add-text':
                this.startAddText();
                break;
            case 'send-vscode':
                await this.sendToVSCode();
                break;
        }
    }
    
    startCaptureArea() {
        this.selectionMode = 'capture-area';
        this.selectionOverlay.style.display = 'block';
        this.showStatus('Click and drag to select an area to capture. Press ESC to cancel.');
    }
    
    async captureWindow() {
        this.showStatus('Capturing window...');
        
        try {
            // Capture the current page using html2canvas
            const canvas = await html2canvas(document.body, {
                allowTaint: true,
                useCORS: true,
                logging: false
            });
            
            const imageData = canvas.toDataURL('image/png');
            
            // Send to server with the captured image data
            const response = await fetch('/api/capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    monitor: 0,
                    region: null,
                    imageData: imageData  // Include the browser-captured image
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentCaptureId = data.id;
                this.showStatus(`Window captured! ID: ${data.id}`, 3000);
                
                // Show notification with option to send to chat
                this.showCaptureNotification(data.id);
            } else {
                this.showStatus('Failed to capture window', 3000);
            }
        } catch (error) {
            console.error('Capture error:', error);
            this.showStatus('Error capturing window', 3000);
        }
    }
    
    startAddSquare() {
        if (!this.currentCaptureId) {
            this.showStatus('Please capture a window first!', 3000);
            return;
        }
        
        this.selectionMode = 'add-square';
        this.annotationCanvas.classList.add('active');
        this.annotationCanvas.style.cursor = 'crosshair';
        this.showStatus('Click and drag to draw a square annotation. Press ESC to cancel.');
    }
    
    startAddText() {
        if (!this.currentCaptureId) {
            this.showStatus('Please capture a window first!', 3000);
            return;
        }
        
        const text = prompt('Enter text for annotation:');
        if (!text) return;
        
        this.pendingText = text;
        this.selectionMode = 'add-text';
        this.annotationCanvas.classList.add('active');
        this.annotationCanvas.style.cursor = 'crosshair';
        this.showStatus('Click where you want to place the text. Press ESC to cancel.');
    }
    
    async sendToVSCode() {
        if (!this.currentCaptureId) {
            this.showStatus('No capture to send!', 3000);
            return;
        }
        
        this.showStatus('Preparing image for VS Code...', 1000);
        
        try {
            // Get the annotated image from the server
            const response = await fetch(`/api/captures/${this.currentCaptureId}/image?format=png`);
            
            if (!response.ok) {
                throw new Error('Failed to get capture image');
            }
            
            const blob = await response.blob();
            
            // Copy image to clipboard
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                
                this.showStatus('✓ Image copied to clipboard! Paste it in Copilot chat (Ctrl+V or Cmd+V)', 5000);
            } catch (clipboardError) {
                // Fallback: provide a data URL that can be downloaded
                const dataUrl = await this.blobToDataUrl(blob);
                
                // Create a temporary download link
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `capture_${this.currentCaptureId}.png`;
                a.click();
                
                this.showStatus('Image downloaded! Upload it manually to Copilot chat.', 5000);
            }
            
        } catch (error) {
            console.error('Send to VS Code error:', error);
            this.showStatus('Error: ' + error.message, 3000);
        }
    }
    
    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    startSelection(e) {
        if (this.selectionMode !== 'capture-area') return;
        
        this.isSelecting = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.selectionBox.style.left = this.startX + 'px';
        this.selectionBox.style.top = this.startY + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
    }
    
    updateSelection(e) {
        if (!this.isSelecting) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const left = Math.min(this.startX, currentX);
        const top = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
    }
    
    async endSelection(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const x = Math.min(this.startX, currentX);
        const y = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        if (width < 10 || height < 10) {
            this.showStatus('Selection too small!', 2000);
            this.cancelSelection();
            return;
        }
        
        // Capture the selected area
        await this.captureArea(x, y, width, height);
        
        this.cancelSelection();
    }
    
    async captureArea(x, y, width, height) {
        this.showStatus('Capturing area...');
        
        try {
            // Hide the selection overlay before capturing
            this.selectionOverlay.style.display = 'none';
            
            // Capture the page
            const canvas = await html2canvas(document.body, {
                allowTaint: true,
                useCORS: true,
                logging: false,
                x: x + window.scrollX,
                y: y + window.scrollY,
                width: width,
                height: height
            });
            
            // Send to server
            const response = await fetch('/api/capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    monitor: 0,
                    region: { x, y, width, height }
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentCaptureId = data.id;
                this.showStatus(`Area captured! ID: ${data.id}`, 3000);
            } else {
                this.showStatus('Failed to capture area', 3000);
            }
        } catch (error) {
            console.error('Capture error:', error);
            this.showStatus('Error capturing area', 3000);
        }
    }
    
    cancelSelection() {
        this.isSelecting = false;
        this.selectionMode = null;
        this.selectionOverlay.style.display = 'none';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        this.annotationCanvas.classList.remove('active');
        this.annotationCanvas.style.cursor = '';
    }
    
    startAnnotation(e) {
        if (!this.selectionMode || !this.annotationCanvas.classList.contains('active')) return;
        
        this.isSelecting = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        if (this.selectionMode === 'add-text') {
            this.placeText(e.clientX, e.clientY);
        }
    }
    
    updateAnnotation(e) {
        if (!this.isSelecting || this.selectionMode !== 'add-square') return;
        
        this.redrawAnnotations();
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const x = Math.min(this.startX, currentX);
        const y = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    async endAnnotation(e) {
        if (!this.isSelecting || this.selectionMode !== 'add-square') return;
        
        this.isSelecting = false;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const x = Math.min(this.startX, currentX);
        const y = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        if (width < 5 || height < 5) {
            this.showStatus('Annotation too small!', 2000);
            this.cancelSelection();
            return;
        }
        
        // Add square annotation
        await this.addSquareAnnotation(x, y, width, height);
        
        this.annotations.push({ type: 'box', x, y, width, height, color: '#ff0000' });
        this.redrawAnnotations();
        
        this.cancelSelection();
    }
    
    async addSquareAnnotation(x, y, width, height) {
        if (!this.currentCaptureId) return;
        
        try {
            const response = await fetch(`/api/captures/${this.currentCaptureId}/annotations/box`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    x: Math.round(x),
                    y: Math.round(y),
                    width: Math.round(width),
                    height: Math.round(height),
                    color: 'red',
                    line_width: 3
                })
            });
            
            if (response.ok) {
                this.showStatus('Square annotation added!', 2000);
            } else {
                this.showStatus('Failed to add annotation', 2000);
            }
        } catch (error) {
            console.error('Annotation error:', error);
            this.showStatus('Error adding annotation', 2000);
        }
    }
    
    async placeText(x, y) {
        if (!this.currentCaptureId || !this.pendingText) return;
        
        try {
            const response = await fetch(`/api/captures/${this.currentCaptureId}/annotations/text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    x: Math.round(x),
                    y: Math.round(y),
                    text: this.pendingText,
                    font_size: 16,
                    color: 'red',
                    background: 'white'
                })
            });
            
            if (response.ok) {
                this.showStatus('Text annotation added!', 2000);
                this.annotations.push({ type: 'text', x, y, text: this.pendingText, color: '#ff0000' });
                this.redrawAnnotations();
            } else {
                this.showStatus('Failed to add text', 2000);
            }
        } catch (error) {
            console.error('Text annotation error:', error);
            this.showStatus('Error adding text', 2000);
        }
        
        this.pendingText = null;
        this.cancelSelection();
    }
    
    showCaptureNotification(captureId) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 999999;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">✅ Capture Created!</div>
            <div style="font-size: 13px; margin-bottom: 10px;">ID: ${captureId}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.9);">
                💡 In VS Code, open Copilot chat and type:<br>
                <code style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 3px; display: inline-block; margin-top: 5px;">@grabitar /latest</code>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Remove after 6 seconds
        setTimeout(() => {
            notification.style.transition = 'opacity 0.3s, transform 0.3s';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => notification.remove(), 300);
        }, 6000);
    }
    
    redrawAnnotations() {
        this.ctx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
        
        for (const annotation of this.annotations) {
            if (annotation.type === 'box') {
                this.ctx.strokeStyle = annotation.color;
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
            } else if (annotation.type === 'text') {
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(annotation.x - 2, annotation.y - 18, annotation.text.length * 10, 22);
                this.ctx.fillStyle = annotation.color;
                this.ctx.font = '16px sans-serif';
                this.ctx.fillText(annotation.text, annotation.x, annotation.y);
            }
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.grabitar = new GrabitarOverlay();
});
