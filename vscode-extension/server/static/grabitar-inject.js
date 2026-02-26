/**
 * Grabitar Injectable Overlay
 * This script can be injected into any webpage to add capture capabilities
 * Load via: <script src="http://localhost:9876/static/grabitar-inject.js"></script>
 * Or via bookmarklet
 */

(function() {
    // Prevent double loading
    if (window.GrabitarInjected) {
        console.log('Grabitar already loaded');
        return;
    }
    window.GrabitarInjected = true;
    
    // Configuration
    const GRABITAR_SERVER = 'http://localhost:9876';
    
    // Load html-to-image library
    function loadHtmlToImage() {
        return new Promise((resolve, reject) => {
            if (window.htmlToImage) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Inject styles
    function injectStyles() {
        const styles = `
            /* Grabitar Overlay Styles */
            .grabitar-overlay {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #667eea;
                border-radius: 12px;
                padding: 15px;
                z-index: 999999;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                color: white;
                min-width: 200px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .grabitar-overlay.minimized {
                padding: 8px 12px;
                min-width: auto;
            }
            
            .grabitar-overlay.minimized .overlay-content {
                display: none;
            }
            
            .grabitar-overlay-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                cursor: move;
            }
            
            .grabitar-overlay-title {
                font-weight: bold;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .grabitar-overlay-close {
                background: #ff4444;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                padding: 2px 8px;
                border-radius: 4px;
                margin-left: 5px;
            }
            
            .grabitar-overlay-minimize {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
                padding: 0 5px;
            }
            
            .grabitar-overlay-btn {
                display: block;
                width: 100%;
                background: #667eea;
                color: white;
                border: none;
                padding: 10px;
                margin: 5px 0;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                text-align: left;
                transition: background 0.2s;
            }
            
            .grabitar-overlay-btn:hover {
                background: #5568d3;
            }
            
            .grabitar-context-menu {
                position: fixed;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000000;
                min-width: 200px;
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .grabitar-context-menu-item {
                padding: 10px 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                color: #333;
                border-bottom: 1px solid #eee;
            }
            
            .grabitar-context-menu-item:last-child {
                border-bottom: none;
            }
            
            .grabitar-context-menu-item:hover {
                background: #f5f5f5;
            }
            
            .grabitar-context-menu-separator {
                height: 1px;
                background: #ddd;
                margin: 5px 0;
            }
            
            .grabitar-selection-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                z-index: 999998;
                cursor: crosshair;
                display: none;
            }
            
            .grabitar-selection-box {
                position: fixed;
                border: 3px solid #ff0000;
                background: rgba(255, 0, 0, 0.1);
                pointer-events: none;
                box-sizing: border-box;
                z-index: 999999;
                display: none;
                margin: 0;
                padding: 0;
                transform: none;
                transform-origin: 0 0;
            }
            
            .grabitar-selection-box.completed {
                border-style: dashed;
                border-width: 2px;
            }
            
            .grabitar-annotation-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999997;
            }
            
            .grabitar-annotation-overlay.active {
                pointer-events: all;
            }
            
            .grabitar-status-message {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 1000001;
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    // Create overlay UI
    function createOverlayUI() {
        const html = `
            <div class="grabitar-overlay" id="grabitarOverlay">
                <div class="grabitar-overlay-header" id="grabitarHeader">
                    <div class="grabitar-overlay-title">
                        <span>📸</span>
                        <span>Grabitar</span>
                    </div>
                    <div>
                        <button class="grabitar-overlay-minimize" id="grabitarMinimize">−</button>
                        <button class="grabitar-overlay-close" id="grabitarClose">×</button>
                    </div>
                </div>
                <div class="overlay-content">
                    <button class="grabitar-overlay-btn" id="grabitarCaptureArea">📷 Capture Area</button>
                    <button class="grabitar-overlay-btn" id="grabitarResetSelection" style="display:none;">🔄 Reset Selection</button>
                    <button class="grabitar-overlay-btn" id="grabitarCaptureWindow">🖼️ Capture Window</button>
                    <button class="grabitar-overlay-btn" id="grabitarAddSquare">⬛ Add Square</button>
                    <button class="grabitar-overlay-btn" id="grabitarAddText">📝 Add Text</button>
                    <button class="grabitar-overlay-btn" id="grabitarCopyClipboard">📋 Copy to Clipboard</button>
                    <button class="grabitar-overlay-btn" id="grabitarSendChat">💬 Send to Chat</button>
                </div>
            </div>
            
            <div class="grabitar-context-menu" id="grabitarContextMenu">
                <div class="grabitar-context-menu-item" data-action="capture-area">
                    <span>📷</span>
                    <span>Capture Area</span>
                </div>
                <div class="grabitar-context-menu-item" data-action="capture-window">
                    <span>🖼️</span>
                    <span>Capture Window</span>
                </div>
                <div class="grabitar-context-menu-separator"></div>
                <div class="grabitar-context-menu-item" data-action="add-square">
                    <span>⬛</span>
                    <span>Add Square</span>
                </div>
                <div class="grabitar-context-menu-item" data-action="add-text">
                    <span>📝</span>
                    <span>Add Text Annotation</span>
                </div>
                <div class="grabitar-context-menu-separator"></div>
                <div class="grabitar-context-menu-item" data-action="copy-clipboard">
                    <span>📋</span>
                    <span>Copy to Clipboard</span>
                </div>
                <div class="grabitar-context-menu-item" data-action="send-chat">
                    <span>💬</span>
                    <span>Send to VS Code Chat</span>
                </div>
                <div class="grabitar-context-menu-item" data-action="close">
                    <span>×</span>
                    <span>Close Grabitar</span>
                </div>
            </div>
            
            <div class="grabitar-selection-overlay" id="grabitarSelectionOverlay"></div>
            <div class="grabitar-selection-box" id="grabitarSelectionBox"></div>
            
            <canvas class="grabitar-annotation-overlay" id="grabitarAnnotationCanvas"></canvas>
            
            <div class="grabitar-status-message" id="grabitarStatusMessage"></div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);
    }
    
    // Initialize Grabitar
    class GrabitarOverlay {
        constructor() {
            this.currentCaptureId = null;
            this.selectionMode = null;
            this.isSelecting = false;
            this.startX = 0;
            this.startY = 0;
            this.annotations = [];
            this.serverUrl = GRABITAR_SERVER;
            
            this.initElements();
            this.initEvents();
            this.initCanvas();
            
            this.showStatus('Grabitar loaded! Right-click for menu or use controls.', 3000);
        }
        
        initElements() {
            this.overlay = document.getElementById('grabitarOverlay');
            this.contextMenu = document.getElementById('grabitarContextMenu');
            this.selectionOverlay = document.getElementById('grabitarSelectionOverlay');
            this.selectionBox = document.getElementById('grabitarSelectionBox');
            this.annotationCanvas = document.getElementById('grabitarAnnotationCanvas');
            this.statusMessage = document.getElementById('grabitarStatusMessage');
            this.overlayMinimize = document.getElementById('grabitarMinimize');
            this.overlayClose = document.getElementById('grabitarClose');
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
            // Close button
            this.overlayClose.addEventListener('click', () => this.close());
            
            // Minimize/maximize overlay
            this.overlayMinimize.addEventListener('click', () => {
                this.overlay.classList.toggle('minimized');
                this.overlayMinimize.textContent = this.overlay.classList.contains('minimized') ? '+' : '−';
            });
            
            // Make overlay draggable
            this.makeDraggable();
            
            // Context menu
            document.addEventListener('contextmenu', (e) => {
                if (e.target.closest('.grabitar-overlay') || e.target.closest('.grabitar-context-menu')) {
                    return;
                }
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            });
            
            document.addEventListener('click', () => this.hideContextMenu());
            
            // Context menu actions
            document.querySelectorAll('.grabitar-context-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.handleAction(action);
                });
            });
            
            // Button actions
            document.getElementById('grabitarCaptureArea').addEventListener('click', () => this.handleAction('capture-area'));
            document.getElementById('grabitarResetSelection').addEventListener('click', () => this.resetSelection());
            document.getElementById('grabitarCaptureWindow').addEventListener('click', () => this.handleAction('capture-window'));
            document.getElementById('grabitarAddSquare').addEventListener('click', () => this.handleAction('add-square'));
            document.getElementById('grabitarAddText').addEventListener('click', () => this.handleAction('add-text'));
            document.getElementById('grabitarCopyClipboard').addEventListener('click', () => this.handleAction('copy-clipboard'));
            document.getElementById('grabitarSendChat').addEventListener('click', () => this.handleAction('send-chat'));
            
            // Selection overlay events
            this.selectionOverlay.addEventListener('mousedown', (e) => this.startSelection(e));
            this.selectionOverlay.addEventListener('mousemove', (e) => this.updateSelection(e));
            this.selectionOverlay.addEventListener('mouseup', (e) => this.endSelection(e));
            
            // ESC to cancel
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (this.selectionMode === 'add-square' || this.selectionMode === 'add-text') {
                        this.cancelAnnotationMode();
                    } else {
                        this.cancelSelection();
                    }
                }
            });
            
            // Annotation canvas events
            this.annotationCanvas.addEventListener('mousedown', (e) => this.startAnnotation(e));
            this.annotationCanvas.addEventListener('mousemove', (e) => this.updateAnnotation(e));
            this.annotationCanvas.addEventListener('mouseup', (e) => this.endAnnotation(e));
        }
        
        makeDraggable() {
            let isDragging = false;
            let offsetX, offsetY;
            
            const header = document.getElementById('grabitarHeader');
            
            header.addEventListener('mousedown', (e) => {
                if (e.target === this.overlayMinimize || e.target === this.overlayClose) return;
                isDragging = true;
                offsetX = e.clientX - this.overlay.offsetLeft;
                offsetY = e.clientY - this.overlay.offsetTop;
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    this.overlay.style.left = (e.clientX - offsetX) + 'px';
                    this.overlay.style.top = (e.clientY - offsetY) + 'px';
                    this.overlay.style.right = 'auto';
                }
            });
            
            document.addEventListener('mouseup', () => isDragging = false);
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
        
        close() {
            if (confirm('Close Grabitar overlay?')) {
                this.overlay.remove();
                this.contextMenu.remove();
                this.selectionOverlay.remove();
                this.annotationCanvas.remove();
                this.statusMessage.remove();
                window.GrabitarInjected = false;
            }
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
                case 'copy-clipboard':
                    await this.copyToClipboard();
                    break;
                case 'send-chat':
                    await this.sendToChat();
                    break;
                case 'close':
                    this.close();
                    break;
            }
        }
        
        startCaptureArea() {
            this.selectionMode = 'capture-area';
            this.selectionOverlay.style.display = 'block';
            this.showStatus('Click and drag to select area. Press ESC to cancel.');
        }
        
        async captureWindow() {
            this.showStatus('Capturing window...');
            
            try {
                // Hide overlay during capture
                this.overlay.style.display = 'none';
                
                // Wait a tiny bit for the DOM to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const imageData = await htmlToImage.toPng(document.body, {
                    cacheBust: true,
                    pixelRatio: window.devicePixelRatio || 1
                });
                
                // Show overlay again
                this.overlay.style.display = 'block';
                
                const response = await fetch(`${this.serverUrl}/api/capture`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ monitor: 0, region: null, imageData: imageData })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentCaptureId = data.id;
                    this.showStatus(`Window captured! ID: ${data.id}`, 3000);
                    this.showCaptureNotification(data.id);
                } else {
                    this.showStatus('Failed to capture window', 3000);
                }
            } catch (error) {
                // Always restore overlay
                this.overlay.style.display = 'block';
                console.error('Capture error:', error);
                this.showStatus(`Error: ${error.message || 'Capture failed'}`, 5000);
            }
        }
        
        startAddSquare() {
            if (!this.currentCaptureId) {
                this.showStatus('Please capture first!', 3000);
                return;
            }
            
            this.selectionMode = 'add-square';
            this.annotationCanvas.classList.add('active');
            this.annotationCanvas.style.cursor = 'crosshair';
            this.showStatus('Click and drag to draw square. Press ESC to cancel.');
        }
        
        startAddText() {
            if (!this.currentCaptureId) {
                this.showStatus('Please capture first!', 3000);
                return;
            }
            
            const text = prompt('Enter text:');
            if (!text) return;
            
            this.pendingText = text;
            this.selectionMode = 'add-text';
            this.annotationCanvas.classList.add('active');
            this.annotationCanvas.style.cursor = 'crosshair';
            this.showStatus('Click to place text. Press ESC to cancel.');
        }
        
        async copyToClipboard() {
            if (!this.currentCaptureId) {
                this.showStatus('No capture to copy!', 3000);
                return;
            }
            
            this.showStatus('Copying to clipboard...');
            
            try {
                const response = await fetch(`${this.serverUrl}/api/captures/${this.currentCaptureId}/image?format=png`);
                if (!response.ok) throw new Error('Failed to get image');
                
                const blob = await response.blob();
                
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                
                this.showStatus('✓ Copied! Paste in VS Code Copilot (Ctrl+V)', 5000);
            } catch (error) {
                console.error('Clipboard error:', error);
                this.showStatus('Error: ' + error.message, 3000);
            }
        }
        
        async sendToChat() {
            if (!this.currentCaptureId) {
                this.showStatus('No capture to send!', 3000);
                return;
            }
            
            this.showStatus('Notifying VS Code...');
            
            try {
                const response = await fetch(`${this.serverUrl}/api/notify-vscode`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        capture_id: this.currentCaptureId,
                        action: 'send-to-chat'
                    })
                });
                
                if (!response.ok) throw new Error('Failed to notify VS Code');
                
                this.showStatus('✓ Sent! Open VS Code and type "@grabitar /latest"', 5000);
            } catch (error) {
                console.error('Send error:', error);
                this.showStatus('💡 Tip: In VS Code, type "@grabitar /latest" to see capture', 5000);
            }
        }
        
        startSelection(e) {
            if (this.selectionMode !== 'capture-area') return;
            
            this.isSelecting = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.selectionBox.style.display = 'block';
            this.selectionBox.style.left = this.startX + 'px';
            this.selectionBox.style.top = this.startY + 'px';
            this.selectionBox.style.width = '0px';
            this.selectionBox.style.height = '0px';
        }
        
        updateSelection(e) {
            if (!this.isSelecting) return;
            
            const currentX = e.clientX;
            const left = Math.min(this.startX, currentX);
            const top = Math.min(this.startY, e.clientY);
            const width = Math.abs(currentX - this.startX);
            const height = Math.abs(e.clientY - this.startY);
            
            this.selectionBox.style.left = left + 'px';
            this.selectionBox.style.top = top + 'px';
            this.selectionBox.style.width = width + 'px';
            this.selectionBox.style.height = height + 'px';
        }
        
        async endSelection(e) {
            if (!this.isSelecting) return;
            
            this.isSelecting = false;
            
            const currentX = e.clientX;
            const x = Math.min(this.startX, currentX);
            const y = Math.min(this.startY, e.clientY);
            const width = Math.abs(currentX - this.startX);
            const height = Math.abs(e.clientY - this.startY);
            
            if (width < 10 || height < 10) {
                this.showStatus('Selection too small!', 2000);
                this.cancelSelection();
                return;
            }
            
            // Keep selection box visible with dashed border
            this.selectionBox.classList.add('completed');
            this.selectionOverlay.style.display = 'none';
            
            // Show reset selection button
            document.getElementById('grabitarResetSelection').style.display = 'block';
            
            await this.captureArea(x, y, width, height);
        }
        
        async captureArea(x, y, width, height) {
            this.showStatus('Capturing area...');
            
            try {
                // Hide overlays during capture
                this.overlay.style.display = 'none';
                this.selectionOverlay.style.display = 'none';
                this.selectionBox.style.display = 'none';
                
                // Wait a tiny bit for the DOM to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const pixelRatio = window.devicePixelRatio || 1;
                
                // Capture full page first
                const fullImageData = await htmlToImage.toPng(document.body, {
                    cacheBust: true,
                    pixelRatio: pixelRatio
                });
                
                // Crop to the selected region
                const img = new Image();
                img.src = fullImageData;
                await new Promise(resolve => img.onload = resolve);
                
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = width;
                cropCanvas.height = height;
                const cropCtx = cropCanvas.getContext('2d');
                
                // Scale coordinates by pixelRatio for high-DPI displays
                const sx = (x + window.scrollX) * pixelRatio;
                const sy = (y + window.scrollY) * pixelRatio;
                const sw = width * pixelRatio;
                const sh = height * pixelRatio;
                
                cropCtx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
                
                // Show overlay again
                this.overlay.style.display = 'block';
                
                // Show selection box again with dashed border
                if (this.selectionBox.classList.contains('completed')) {
                    this.selectionBox.style.display = 'block';
                }
                
                const imageData = cropCanvas.toDataURL('image/png');
                
                const response = await fetch(`${this.serverUrl}/api/capture`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ monitor: 0, region: { x, y, width, height }, imageData: imageData })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentCaptureId = data.id;
                    this.showStatus(`Area captured! ID: ${data.id}`, 3000);
                    this.showCaptureNotification(data.id);
                } else {
                    this.showStatus('Failed to capture area', 3000);
                }
            } catch (error) {
                // Always restore overlays
                this.overlay.style.display = 'block';
                if (this.selectionBox.classList.contains('completed')) {
                    this.selectionBox.style.display = 'block';
                }
                console.error('Capture error:', error);
                this.showStatus(`Error: ${error.message || 'Capture failed'}`, 5000);
            }
        }
        
        cancelSelection() {
            this.isSelecting = false;
            this.selectionMode = null;
            this.selectionOverlay.style.display = 'none';
            this.selectionBox.style.display = 'none';
            this.selectionBox.classList.remove('completed');
            this.selectionBox.style.width = '0px';
            this.selectionBox.style.height = '0px';
            this.annotationCanvas.classList.remove('active');
            this.annotationCanvas.style.cursor = '';
            document.getElementById('grabitarResetSelection').style.display = 'none';
        }
        
        cancelAnnotationMode() {
            // Cancel annotation mode but keep the selection box visible
            this.isSelecting = false;
            this.selectionMode = null;
            this.annotationCanvas.classList.remove('active');
            this.annotationCanvas.style.cursor = '';
        }
        
        resetSelection() {
            // Clear current selection box
            this.selectionBox.style.display = 'none';
            this.selectionBox.classList.remove('completed');
            this.selectionBox.style.width = '0px';
            this.selectionBox.style.height = '0px';
            document.getElementById('grabitarResetSelection').style.display = 'none';
            
            // Clear annotations from canvas
            this.annotations = [];
            this.ctx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
            
            // Cancel any active annotation mode
            this.annotationCanvas.classList.remove('active');
            this.annotationCanvas.style.cursor = '';
            
            // Start new selection
            this.startCaptureArea();
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
            
            const x = Math.min(this.startX, e.clientX);
            const y = Math.min(this.startY, e.clientY);
            const width = Math.abs(e.clientX - this.startX);
            const height = Math.abs(e.clientY - this.startY);
            
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, width, height);
        }
        
        async endAnnotation(e) {
            if (!this.isSelecting || this.selectionMode !== 'add-square') return;
            
            this.isSelecting = false;
            
            const x = Math.min(this.startX, e.clientX);
            const y = Math.min(this.startY, e.clientY);
            const width = Math.abs(e.clientX - this.startX);
            const height = Math.abs(e.clientY - this.startY);
            
            if (width < 5 || height < 5) {
                this.showStatus('Annotation too small!', 2000);
                this.cancelAnnotationMode();
                return;
            }
            
            await this.addSquareAnnotation(x, y, width, height);
            this.annotations.push({ type: 'box', x, y, width, height, color: '#ff0000' });
            this.redrawAnnotations();
            this.cancelAnnotationMode();
        }
        
        async addSquareAnnotation(x, y, width, height) {
            if (!this.currentCaptureId) return;
            
            try {
                await fetch(`${this.serverUrl}/api/captures/${this.currentCaptureId}/annotations/box`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        x: Math.round(x),
                        y: Math.round(y),
                        width: Math.round(width),
                        height: Math.round(height),
                        color: 'red',
                        line_width: 3
                    })
                });
                
                this.showStatus('Square added!', 2000);
            } catch (error) {
                console.error('Annotation error:', error);
            }
        }
        
        async placeText(x, y) {
            if (!this.currentCaptureId || !this.pendingText) return;
            
            try {
                await fetch(`${this.serverUrl}/api/captures/${this.currentCaptureId}/annotations/text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        x: Math.round(x),
                        y: Math.round(y),
                        text: this.pendingText,
                        font_size: 16,
                        color: 'red',
                        background: 'white'
                    })
                });
                
                this.showStatus('Text added!', 2000);
                this.annotations.push({ type: 'text', x, y, text: this.pendingText, color: '#ff0000' });
                this.redrawAnnotations();
            } catch (error) {
                console.error('Text error:', error);
            }
            
            this.pendingText = null;
            this.cancelAnnotationMode();
        }
        
        showCaptureNotification(captureId) {
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
    
    // Initialize
    async function init() {
        try {
            await loadHtmlToImage();
            injectStyles();
            createOverlayUI();
            window.grabitar = new GrabitarOverlay();
        } catch (error) {
            console.error('Grabitar initialization error:', error);
        }
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
