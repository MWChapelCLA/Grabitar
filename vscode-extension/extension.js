const vscode = require('vscode');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');

let serverProcess = null;
let outputChannel = null;
let statusBarItem = null;
let chatParticipant = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Grabitar extension is now active');
    
    // Create output channel
    outputChannel = vscode.window.createOutputChannel('Grabitar');
    context.subscriptions.push(outputChannel);
    
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'grabitar.showStatus';
    context.subscriptions.push(statusBarItem);
    updateStatusBar('stopped');
    statusBarItem.show();
    
    // Find server.py in the extension directory
    const serverPath = path.join(context.extensionPath, 'server', 'server.py');
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('grabitar.startServer', () => startServer(serverPath)),
        vscode.commands.registerCommand('grabitar.stopServer', stopServer),
        vscode.commands.registerCommand('grabitar.getBookmarklet', getBookmarklet),
        vscode.commands.registerCommand('grabitar.openTestPage', openTestPage),
        vscode.commands.registerCommand('grabitar.showStatus', showStatus),
        vscode.commands.registerCommand('grabitar.sendToChat', sendLatestCaptureToChat)
    );
    
    // Register chat participant
    chatParticipant = vscode.chat.createChatParticipant('grabitar.participant', handleChatRequest);
    chatParticipant.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'Designer.png'));
    context.subscriptions.push(chatParticipant);
    
    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('grabitar');
    if (config.get('autoStart', true)) {
        startServer(serverPath);
    }
}

async function checkPythonDependencies(pythonPath, serverDir) {
    return new Promise((resolve) => {
        const requirementsPath = path.join(serverDir, 'requirements.txt');
        
        if (!fs.existsSync(requirementsPath)) {
            outputChannel.appendLine('No requirements.txt found, skipping dependency check');
            resolve(true);
            return;
        }
        
        // Try to import the required packages to check if they're installed
        const checkScript = `
import sys
try:
    import fastapi
    import uvicorn
    import PIL
    import mss
    import mcp
    sys.exit(0)
except ImportError as e:
    print(f"Missing: {e.name}")
    sys.exit(1)
`;
        
        const checkProcess = spawn(pythonPath, ['-c', checkScript]);
        let stderr = '';
        
        checkProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        checkProcess.on('close', (code) => {
            if (code === 0) {
                outputChannel.appendLine('✓ All Python dependencies are installed');
                resolve(true);
            } else {
                outputChannel.appendLine('⚠ Python dependencies are missing');
                outputChannel.appendLine(stderr);
                resolve(false);
            }
        });
        
        checkProcess.on('error', (err) => {
            outputChannel.appendLine(`Error checking dependencies: ${err.message}`);
            resolve(false);
        });
    });
}

async function installPythonDependencies(pythonPath, serverDir) {
    return new Promise((resolve) => {
        const requirementsPath = path.join(serverDir, 'requirements.txt');
        
        outputChannel.appendLine('Installing Python dependencies...');
        outputChannel.appendLine(`Running: ${pythonPath} -m pip install -r ${requirementsPath}`);
        outputChannel.show();
        
        const installProcess = spawn(pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath], {
            cwd: serverDir
        });
        
        installProcess.stdout.on('data', (data) => {
            outputChannel.appendLine(`[PIP] ${data}`);
        });
        
        installProcess.stderr.on('data', (data) => {
            outputChannel.appendLine(`[PIP] ${data}`);
        });
        
        installProcess.on('close', (code) => {
            if (code === 0) {
                outputChannel.appendLine('✓ Dependencies installed successfully');
                resolve(true);
            } else {
                outputChannel.appendLine(`✗ Failed to install dependencies (exit code: ${code})`);
                resolve(false);
            }
        });
        
        installProcess.on('error', (err) => {
            outputChannel.appendLine(`Error installing dependencies: ${err.message}`);
            resolve(false);
        });
    });
}

async function startServer(serverPath) {
    if (serverProcess) {
        vscode.window.showInformationMessage('Grabitar server is already running');
        return;
    }
    
    // Check if server.py exists
    if (!fs.existsSync(serverPath)) {
        vscode.window.showErrorMessage(`Grabitar server not found at: ${serverPath}`);
        outputChannel.appendLine(`Error: server.py not found at ${serverPath}`);
        return;
    }
    
    const config = vscode.workspace.getConfiguration('grabitar');
    const pythonPath = config.get('pythonPath', 'python');
    const port = config.get('port', 9876);
    const serverDir = path.dirname(serverPath);
    
    // Check Python dependencies
    outputChannel.appendLine('Checking Python dependencies...');
    const depsInstalled = await checkPythonDependencies(pythonPath, serverDir);
    
    if (!depsInstalled) {
        const choice = await vscode.window.showWarningMessage(
            'Grabitar requires Python packages (fastapi, uvicorn, pillow, mss, mcp). Install them now?',
            'Install', 'Cancel'
        );
        
        if (choice !== 'Install') {
            outputChannel.appendLine('User cancelled dependency installation');
            updateStatusBar('stopped');
            return;
        }
        
        const installed = await installPythonDependencies(pythonPath, serverDir);
        if (!installed) {
            vscode.window.showErrorMessage('Failed to install Python dependencies. Check Grabitar output for details.');
            updateStatusBar('stopped');
            return;
        }
    }
    
    outputChannel.appendLine('Starting Grabitar server...');
    outputChannel.appendLine(`Python: ${pythonPath}`);
    outputChannel.appendLine(`Server: ${serverPath}`);
    outputChannel.appendLine(`Port: ${port}`);
    
    // Set environment variable for port
    const env = { ...process.env, GRABITAR_PORT: port.toString() };
    
    // Start the server process
    serverProcess = spawn(pythonPath, [serverPath], {
        cwd: path.dirname(serverPath),
        env: env
    });
    
    serverProcess.stdout.on('data', (data) => {
        outputChannel.appendLine(`[STDOUT] ${data}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
        outputChannel.appendLine(`[STDERR] ${data}`);
    });
    
    serverProcess.on('close', (code) => {
        outputChannel.appendLine(`Server process exited with code ${code}`);
        serverProcess = null;
        updateStatusBar('stopped');
        if (code !== 0 && code !== null) {
            vscode.window.showErrorMessage(`Grabitar server exited with code ${code}`);
        }
    });
    
    serverProcess.on('error', (err) => {
        outputChannel.appendLine(`Error starting server: ${err.message}`);
        vscode.window.showErrorMessage(`Failed to start Grabitar server: ${err.message}`);
        serverProcess = null;
        updateStatusBar('stopped');
    });
    
    updateStatusBar('running');
    vscode.window.showInformationMessage('Grabitar server started on port ' + port);
}

function stopServer() {
    if (!serverProcess) {
        vscode.window.showInformationMessage('Grabitar server is not running');
        return;
    }
    
    outputChannel.appendLine('Stopping Grabitar server...');
    serverProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if not stopped
    setTimeout(() => {
        if (serverProcess) {
            outputChannel.appendLine('Force killing server process...');
            serverProcess.kill('SIGKILL');
            serverProcess = null;
            updateStatusBar('stopped');
        }
    }, 5000);
    
    vscode.window.showInformationMessage('Grabitar server stopped');
}

function getBookmarklet() {
    const config = vscode.workspace.getConfiguration('grabitar');
    const port = config.get('port', 9876);
    const bookmarklet = `javascript:(function(){var s=document.createElement('script');s.src='http://localhost:${port}/static/grabitar-inject.js';document.head.appendChild(s);})()`;
    
    vscode.env.clipboard.writeText(bookmarklet).then(() => {
        vscode.window.showInformationMessage('Grabitar bookmarklet copied to clipboard! Create a new bookmark and paste this as the URL.');
        
        // Also show in a new document
        vscode.workspace.openTextDocument({
            content: `Grabitar Bookmarklet
====================

1. Create a new bookmark in your browser
2. Set the bookmark name to: "Grabitar"
3. Paste this URL:

${bookmarklet}

4. Click the bookmark on any webpage to inject Grabitar overlay

Or paste in browser console:
${`var s=document.createElement('script');s.src='http://localhost:${port}/static/grabitar-inject.js';document.head.appendChild(s);`}
`,
            language: 'text'
        }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    });
}

function openTestPage() {
    const config = vscode.workspace.getConfiguration('grabitar');
    const port = config.get('port', 9876);
    const url = `http://localhost:${port}`;
    
    vscode.env.openExternal(vscode.Uri.parse(url));
    vscode.window.showInformationMessage(`Opening Grabitar test page: ${url}`);
}

function showStatus() {
    const config = vscode.workspace.getConfiguration('grabitar');
    const port = config.get('port', 9876);
    const pythonPath = config.get('pythonPath', 'python');
    const autoStart = config.get('autoStart', true);
    
    const status = serverProcess ? '✅ Running' : '⭕ Stopped';
    const message = `Grabitar Server Status

Status: ${status}
Port: ${port}
Python: ${pythonPath}
Auto-start: ${autoStart ? 'Enabled' : 'Disabled'}

Server URL: http://localhost:${port}
Inject Script: http://localhost:${port}/static/grabitar-inject.js`;
    
    vscode.window.showInformationMessage(message, 
        serverProcess ? 'Stop Server' : 'Start Server',
        'Get Bookmarklet',
        'Open Test Page'
    ).then(selection => {
        if (selection === 'Start Server') {
            vscode.commands.executeCommand('grabitar.startServer');
        } else if (selection === 'Stop Server') {
            vscode.commands.executeCommand('grabitar.stopServer');
        } else if (selection === 'Get Bookmarklet') {
            vscode.commands.executeCommand('grabitar.getBookmarklet');
        } else if (selection === 'Open Test Page') {
            vscode.commands.executeCommand('grabitar.openTestPage');
        }
    });
}

function updateStatusBar(state) {
    if (!statusBarItem) return;
    
    if (state === 'running') {
        statusBarItem.text = '$(record) Grabitar';
        statusBarItem.tooltip = 'Grabitar server is running (click for status)';
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = '$(debug-stop) Grabitar';
        statusBarItem.tooltip = 'Grabitar server is stopped (click for status)';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

function deactivate() {
    if (serverProcess) {
        outputChannel.appendLine('Deactivating extension, stopping server...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }
}

// ========== CHAT PARTICIPANT ==========

async function handleChatRequest(request, context, stream, token) {
    const config = vscode.workspace.getConfiguration('grabitar');
    const port = config.get('port', 9876);
    const serverUrl = `http://localhost:${port}`;
    
    // Check if server is running
    if (!serverProcess) {
        stream.markdown('⚠️ Grabitar server is not running. Start it with the command: `Grabitar: Start Server`\n\n');
        return;
    }
    
    // Parse the command
    const command = request.command || 'help';
    const prompt = request.prompt.trim();
    
    try {
        switch (command) {
            case 'capture':
                await handleCaptureCommand(stream, serverUrl, prompt);
                break;
            case 'list':
                await handleListCommand(stream, serverUrl);
                break;
            case 'show':
                await handleShowCommand(stream, serverUrl, prompt);
                break;
            case 'latest':
                await handleLatestCommand(stream, serverUrl);
                break;
            default:
                await handleHelpCommand(stream);
                break;
        }
    } catch (error) {
        stream.markdown(`❌ Error: ${error.message}\n\n`);
        outputChannel.appendLine(`Chat error: ${error.message}`);
    }
}

async function handleCaptureCommand(stream, serverUrl, prompt) {
    stream.markdown('📸 To capture a screenshot:\n\n');
    stream.markdown('1. Make sure you have the Grabitar overlay injected on a webpage\n');
    stream.markdown('2. Use the bookmarklet or inject script: `http://localhost:9876/static/grabitar-inject.js`\n');
    stream.markdown('3. Right-click and select "🖼️ Capture Window"\n');
    stream.markdown('4. Use `/latest` to see your capture here\n\n');
    stream.markdown('💡 Get the bookmarklet: Run command `Grabitar: Get Bookmarklet Code`\n');
}

async function handleListCommand(stream, serverUrl) {
    stream.markdown('📋 Fetching captures...\n\n');
    
    const captures = await fetchJSON(`${serverUrl}/api/captures`);
    
    if (!captures || captures.length === 0) {
        stream.markdown('No captures yet. Capture a screenshot first!\n\n');
        stream.markdown('💡 Right-click on any injected webpage and select "🖼️ Capture Window"\n');
        return;
    }
    
    stream.markdown(`Found ${captures.length} capture(s):\n\n`);
    for (const capture of captures) {
        stream.markdown(`- **${capture.id}** - ${capture.width}x${capture.height}px - ${capture.annotation_count} annotation(s)\n`);
    }
    stream.markdown('\n💡 Use `/show <capture_id>` to view a specific capture\n');
}

async function handleShowCommand(stream, serverUrl, captureId) {
    if (!captureId) {
        stream.markdown('❌ Please specify a capture ID. Example: `/show capture_001`\n\n');
        stream.markdown('💡 Use `/list` to see all available captures\n');
        return;
    }
    
    stream.markdown(`🖼️ Fetching capture: ${captureId}...\n\n`);
    
    try {
        // Fetch the capture metadata
        const captures = await fetchJSON(`${serverUrl}/api/captures`);
        const capture = captures.find(c => c.id === captureId);
        
        if (!capture) {
            stream.markdown(`❌ Capture "${captureId}" not found.\n\n`);
            stream.markdown('💡 Use `/list` to see all available captures\n');
            return;
        }
        
        stream.markdown(`**${capture.id}**\n`);
        stream.markdown(`Size: ${capture.width}x${capture.height}px\n`);
        stream.markdown(`Annotations: ${capture.annotation_count}\n\n`);
        
        // Fetch the image as base64 for AI context
        const imageBuffer = await fetchImage(`${serverUrl}/api/captures/${captureId}/image?format=png`);
        const base64Image = imageBuffer.toString('base64');
        
        // Pass base64 data
        stream.markdown(`\`\`\`image-data\n`);
        stream.markdown(`data:image/png;base64,${base64Image}\n`);
        stream.markdown(`\`\`\`\n\n`);
        stream.markdown(`✅ Image data loaded. You can now ask questions about this capture.\n`);
    } catch (error) {
        stream.markdown(`❌ Failed to fetch capture: ${error.message}\n`);
    }
}

async function handleLatestCommand(stream, serverUrl) {
    stream.markdown('🔍 Fetching latest capture...\n\n');
    
    try {
        const captures = await fetchJSON(`${serverUrl}/api/captures`);
        
        if (!captures || captures.length === 0) {
            stream.markdown('No captures yet. Capture a screenshot first!\n\n');
            stream.markdown('💡 Right-click on any injected webpage and select "🖼️ Capture Window"\n');
            return;
        }
        
        // Get the latest capture (last in array)
        const latest = captures[captures.length - 1];
        
        stream.markdown(`**Latest Capture: ${latest.id}**\n`);
        stream.markdown(`Size: ${latest.width}x${latest.height}px\n`);
        stream.markdown(`Annotations: ${latest.annotation_count}\n\n`);
        
        // Fetch the image as base64 for AI context
        const imageBuffer = await fetchImage(`${serverUrl}/api/captures/${latest.id}/image?format=png`);
        const base64Image = imageBuffer.toString('base64');
        
        // Pass base64 data
        stream.markdown(`\`\`\`image-data\n`);
        stream.markdown(`data:image/png;base64,${base64Image}\n`);
        stream.markdown(`\`\`\`\n\n`);
        stream.markdown(`✅ Image data loaded. You can now ask questions about this capture.\n`);
    } catch (error) {
        stream.markdown(`❌ Failed to fetch latest capture: ${error.message}\n`);
    }
}

async function handleHelpCommand(stream) {
    stream.markdown('# 📸 Grabitar - Screen Capture Assistant\n\n');
    stream.markdown('I help you capture and annotate screenshots!\n\n');
    stream.markdown('## Available Commands:\n\n');
    stream.markdown('- `/capture` - Instructions for capturing screenshots\n');
    stream.markdown('- `/list` - List all captures in the current session\n');
    stream.markdown('- `/show <capture_id>` - Display a specific capture\n');
    stream.markdown('- `/latest` - Display the most recent capture\n\n');
    stream.markdown('## Quick Start:\n\n');
    stream.markdown('1. Run: `Grabitar: Get Bookmarklet Code`\n');
    stream.markdown('2. Create a bookmark with the provided code\n');
    stream.markdown('3. Navigate to any webpage and click the bookmark\n');
    stream.markdown('4. Right-click and select "🖼️ Capture Window"\n');
    stream.markdown('5. Come back here and use `/latest` to see your capture!\n\n');
    stream.markdown('💡 You can then ask me questions about the capture!\n');
}

async function sendLatestCaptureToChat() {
    const config = vscode.workspace.getConfiguration('grabitar');
    const port = config.get('port', 9876);
    const serverUrl = `http://localhost:${port}`;
    
    if (!serverProcess) {
        vscode.window.showWarningMessage('Grabitar server is not running. Start it first.');
        return;
    }
    
    try {
        const captures = await fetchJSON(`${serverUrl}/api/captures`);
        
        if (!captures || captures.length === 0) {
            vscode.window.showInformationMessage('No captures available. Capture a screenshot first.');
            return;
        }
        
        const latest = captures[captures.length - 1];
        
        // Open chat and send a message
        vscode.commands.executeCommand('workbench.action.chat.open', {
            query: `@grabitar /latest`
        });
        
        vscode.window.showInformationMessage(`Sending ${latest.id} to Copilot chat...`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to send capture: ${error.message}`);
    }
}

// ========== HELPER FUNCTIONS ==========

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse JSON'));
                }
            });
        }).on('error', reject);
    });
}

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

async function saveImageToTemp(imageData, captureId) {
    try {
        const tempDir = path.join(require('os').tmpdir(), 'grabitar');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Cleanup old images first (keep only last 10)
        await cleanupOldImages(tempDir);
        
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        const filename = `${captureId}_${timestamp}.png`;
        const filepath = path.join(tempDir, filename);
        
        fs.writeFileSync(filepath, imageData);
        
        return vscode.Uri.file(filepath);
    } catch (error) {
        outputChannel.appendLine(`Failed to save temp image: ${error.message}`);
        return null;
    }
}

async function cleanupOldImages(tempDir) {
    try {
        if (!fs.existsSync(tempDir)) return;
        
        const files = fs.readdirSync(tempDir)
            .filter(f => f.endsWith('.png'))
            .map(f => ({
                name: f,
                path: path.join(tempDir, f),
                time: fs.statSync(path.join(tempDir, f)).mtimeMs
            }))
            .sort((a, b) => b.time - a.time); // Sort by newest first
        
        // Keep only the 10 most recent images
        const toDelete = files.slice(10);
        
        for (const file of toDelete) {
            try {
                fs.unlinkSync(file.path);
                outputChannel.appendLine(`Cleaned up old image: ${file.name}`);
            } catch (err) {
                outputChannel.appendLine(`Failed to delete ${file.name}: ${err.message}`);
            }
        }
        
        if (toDelete.length > 0) {
            outputChannel.appendLine(`Cleaned up ${toDelete.length} old capture image(s)`);
        }
    } catch (error) {
        outputChannel.appendLine(`Cleanup error: ${error.message}`);
    }
}

module.exports = {
    activate,
    deactivate
};
