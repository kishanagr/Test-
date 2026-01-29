// 🔥 E2EE Multi-Cookie Messenger Pro - FULLY FIXED 🔥
// Termux Compatible | npm install express ws fca-mafiya uuid
// ✅ REGEX ERROR FIXED - Line 66 CORRECTED ✅

const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 22133;
const TASKS_FILE = 'active_tasks.json';

// Create directories
if (!fs.existsSync('cookies')) fs.mkdirSync('cookies', { recursive: true });
if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });

// Task Class - COMPLETE
class Task {
    constructor(taskId, userData) {
        this.taskId = taskId;
        this.userData = userData;
        this.config = {
            delay: userData.delay || 5,
            running: false,
            api: null,
            cookies: [],
            currentCookieIndex: 0
        };
        this.messageData = {
            threadID: userData.threadID,
            messages: [],
            currentIndex: 0
        };
        this.stats = { sent: 0, failed: 0, loops: 0 };
        this.logs = [];
        this.initMessages();
    }

    initMessages() {
        const lines = this.userData.messageContent.split('\n');
        const cleanLines = lines.filter(line => line.trim().length > 0);
        
        this.messageData.messages = cleanLines.map(line => {
            const msg = `${this.userData.hatersName} ${line.trim()} ${this.userData.lastHereName}`;
            return msg.substring(0, 1000);
        });
        
        this.log(`Loaded ${this.messageData.messages.length} messages`, 'success');
    }

    log(msg, type = 'info') {
        const entry = {
            time: new Date().toLocaleTimeString(),
            message: msg,
            type
        };
        this.logs.unshift(entry);
        if (this.logs.length > 50) this.logs = this.logs.slice(0, 50);
        
        broadcast(this.taskId, { type: 'log', message: msg, type });
    }

    // ✅ FIXED REGEX - Line 66 CORRECTED ✅
    parseCookies(cookieContent) {
        // Fixed regex: properly escaped quantifiers with non-capturing groups
        const cookies = cookieContent.split(/(?:={3,}|\n\s*\n|\{\{2,\}})/)
            .filter(c => c.trim().length > 50);
        
        this.config.cookies = cookies.map(cookie => ({
            content: cookie.trim(),
            status: 'pending'
        }));
        
        this.log(`Found ${this.config.cookies.length} cookies`, 'info');
        return this.config.cookies.length > 0;
    }

    start() {
        if (this.config.running) return;
        
        this.config.running = true;
        if (!this.parseCookies(this.userData.cookieContent)) {
            this.log('❌ No valid cookies found!', 'error');
            this.config.running = false;
            return;
        }
        this.tryLogin();
    }

    tryLogin() {
        const cookie = this.config.cookies[this.config.currentCookieIndex];
        
        wiegine.login(cookie.content, { 
            logLevel: "silent", 
            forceLogin: true 
        }, (err, api) => {
            if (err || !api) {
                this.config.currentCookieIndex++;
                if (this.config.currentCookieIndex < this.config.cookies.length) {
                    this.log(`Cookie ${this.config.currentCookieIndex}/${this.config.cookies.length} failed, trying next...`, 'warning');
                    setTimeout(() => this.tryLogin(), 2000);
                } else {
                    this.log('❌ All cookies failed!', 'error');
                    this.config.running = false;
                }
                return;
            }
            
            this.config.api = api;
            this.log('✅ Login successful with cookie!', 'success');
            this.sendLoop(api);
        });
    }

    sendLoop(api) {
        if (!this.config.running || !api) {
            this.config.running = false;
            return;
        }

        if (this.messageData.currentIndex >= this.messageData.messages.length) {
            this.messageData.currentIndex = 0;
            this.stats.loops++;
            this.log(`🔄 Loop ${this.stats.loops} completed`, 'info');
        }

        const msg = this.messageData.messages[this.messageData.currentIndex];
        
        api.sendMessage(msg, this.messageData.threadID, (err) => {
            if (err) {
                this.stats.failed++;
                this.log(`❌ Send failed: ${err.error || err.message} - Retrying...`, 'error');
                setTimeout(() => this.sendLoop(api), 5000);
            } else {
                this.stats.sent++;
                this.log(`✅ Message ${this.messageData.currentIndex + 1}/${this.messageData.messages.length} sent`, 'success');
                this.messageData.currentIndex++;
                setTimeout(() => this.sendLoop(api), this.config.delay * 1000);
            }
        });
    }

    stop() {
        this.config.running = false;
        if (this.config.api) {
            this.config.api = null;
        }
        this.log('⏹️ Task stopped safely', 'success');
    }
}

// Global state
const activeTasks = new Map();
let wss = null;

// Auto-save tasks
function saveTasks() {
    try {
        const data = {};
        activeTasks.forEach((task, id) => {
            data[id] = {
                userData: task.userData,
                stats: task.stats,
                messageData: task.messageData,
                config: task.config
            };
        });
        fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Save error:', e.message);
    }
}

setInterval(saveTasks, 30000);

// Load saved tasks on startup
function loadTasks() {
    try {
        if (fs.existsSync(TASKS_FILE)) {
            const data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
            Object.entries(data).forEach(([id, taskData]) => {
                const task = new Task(id, taskData.userData);
                Object.assign(task.stats, taskData.stats);
                Object.assign(task.messageData, taskData.messageData);
                Object.assign(task.config, taskData.config);
                activeTasks.set(id, task);
            });
            console.log(`Loaded ${activeTasks.size} saved tasks`);
        }
    } catch (e) {
        console.error('Load error:', e.message);
    }
}

// WebSocket broadcast
function broadcast(taskId, data) {
    if (!wss) return;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.taskId === taskId) {
            client.send(JSON.stringify(data));
        }
    });
}

// Express middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// HTTP Server + WebSocket
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    loadTasks();
});

// WebSocket Server
const wsserver = new WebSocket.Server({ server });
wss = wsserver;

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleClientMessage(ws, data);
        } catch (e) {
            console.error('WS message error:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function handleClientMessage(ws, data) {
    switch (data.type) {
        case 'createTask':
            const taskId = uuidv4();
            const task = new Task(taskId, data.userData);
            activeTasks.set(taskId, task);
            ws.taskId = taskId;
            broadcast(taskId, { type: 'taskCreated', taskId });
            saveTasks();
            break;

        case 'startTask':
            const taskStart = activeTasks.get(data.taskId);
            if (taskStart) {
                taskStart.start();
                broadcast(data.taskId, { type: 'statusUpdate', running: true });
            }
            break;

        case 'stopTask':
            const taskStop = activeTasks.get(data.taskId);
            if (taskStop) {
                taskStop.stop();
                broadcast(data.taskId, { type: 'statusUpdate', running: false });
            }
            break;

        case 'getStatus':
            const task = activeTasks.get(data.taskId);
            if (task) {
                broadcast(data.taskId, {
                    type: 'status',
                    stats: task.stats,
                    logs: task.logs,
                    running: task.config.running
                });
            }
            break;

        case 'listTasks':
            const tasksList = Array.from(activeTasks.entries()).map(([id, task]) => ({
                id,
                stats: task.stats,
                running: task.config.running
            }));
            ws.send(JSON.stringify({ type: 'tasksList', tasks: tasksList }));
            break;
    }
}

// REST API Routes - COMPLETE
app.post('/api/tasks', (req, res) => {
    const taskId = uuidv4();
    const task = new Task(taskId, req.body);
    activeTasks.set(taskId, task);
    saveTasks();
    res.json({ taskId });
});

app.get('/api/tasks/:id', (req, res) => {
    const task = activeTasks.get(req.params.id);
    if (task) {
        res.json({
            stats: task.stats,
            logs: task.logs,
            running: task.config.running,
            messageCount: task.messageData.messages.length
        });
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.post('/api/tasks/:id/start', (req, res) => {
    const task = activeTasks.get(req.params.id);
    if (task) {
        task.start();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.post('/api/tasks/:id/stop', (req, res) => {
    const task = activeTasks.get(req.params.id);
    if (task) {
        task.stop();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.get('/api/tasks', (req, res) => {
    const tasks = Array.from(activeTasks.entries()).map(([id, task]) => ({
        id,
        stats: task.stats,
        running: task.config.running
    }));
    res.json(tasks);
});

app.delete('/api/tasks/:id', (req, res) => {
    const task = activeTasks.get(req.params.id);
    if (task) {
        task.stop();
        activeTasks.delete(req.params.id);
        saveTasks();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// COMPLETE UI - FULL RESPONSIVE
const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 E2EE Messenger Pro v2.0</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(-45deg, #667eea 0%, #764ba2 100%);
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
            color: white;
            min-height: 100vh;
            padding: 15px;
            line-height: 1.5;
        }
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        h1 { font-size: 2.2em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .tabs { display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap; }
        .tab { 
            flex: 1; min-width: 140px; padding: 15px 20px; 
            background: rgba(255,255,255,0.15); border-radius: 12px; 
            cursor: pointer; text-align: center; font-weight: 600;
            transition: all 0.3s; border: 1px solid rgba(255,255,255,0.2);
        }
        .tab.active { 
            background: rgba(255,255,255,0.3); 
            transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .panel { 
            background: rgba(255,255,255,0.12); 
            backdrop-filter: blur(15px); border-radius: 20px; 
            padding: 30px; margin-bottom: 25px; 
            border: 1px solid rgba(255,255,255,0.18);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; }
        input, textarea, select { 
            width: 100%; padding: 15px; border-radius: 12px; 
            border: 2px solid rgba(255,255,255,0.2); 
            background: rgba(255,255,255,0.1); color: white; 
            font-size: 16px; transition: all 0.3s;
        }
        input:focus, textarea:focus { 
            outline: none; border-color: #4ecdc4; 
            box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.2);
            background: rgba(255,255,255,0.15);
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.6); }
        .btn { 
            width: 100%; padding: 18px; margin: 10px 0; 
            border-radius: 12px; border: none; font-size: 18px; 
            font-weight: 700; cursor: pointer; transition: all 0.3s;
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            color: white; text-transform: uppercase; letter-spacing: 1px;
        }
        .btn:hover:not(:disabled) { 
            transform: translateY(-3px); 
            box-shadow: 0 15px 35px rgba(255,107,107,0.4);
        }
        .btn:disabled { background: #666; cursor: not-allowed; transform: none; }
        .btn-success { background: linear-gradient(45deg, #4ecdc4, #44a08d); }
        .btn-danger { background: linear-gradient(45deg, #ff6b6b, #ee5a52); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 25px 0; }
        .stat-card { 
            background: rgba(255,255,255,0.15); padding: 25px; 
            border-radius: 15px; text-align: center; 
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);
        }
        .stat-number { font-size: 2.5em; font-weight: 800; margin: 10px 0; }
        .stat-success { color: #4ecdc4; }
        .stat-error { color: #ff6b6b; }
        .logs { max-height: 400px; overflow-y: auto; background: rgba(0,0,0,0.4); 
                 padding: 20px; border-radius: 15px; font-family: 'Courier New', monospace; 
                 font-size: 14px; line-height: 1.6; }
        .log-entry { margin-bottom: 8px; padding: 5px 0; }
        .log-success { color: #4ecdc4; }
        .log-error { color: #ff6b6b; }
        .log-warning { color: #ffe66d; }
        .task-list { max-height: 500px; overflow-y: auto; }
        .task-item { 
            background: rgba(255,255,255,0.1); padding: 20px; 
            margin-bottom: 15px; border-radius: 15px; 
            border-left: 5px solid #4ecdc4; cursor: pointer;
            transition: all 0.3s;
        }
        .task-item:hover { transform: translateX(5px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .no-tasks { text-align: center; color: rgba(255,255,255,0.6); font-style: italic; padding: 40px; }
        @media (max-width: 768px) {
            .tabs { flex-direction: column; }
            h1 { font-size: 1.8em; }
            .panel { padding: 20px; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 E2EE Messenger Pro v2.0</h1>
            <p>Multi-Cookie • Real-time • Termux Ready</p>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="switchTab('create')">🚀 Create Task</div>
            <div class="tab" onclick="switchTab('active')">📋 Active Tasks</div>
            <div class="tab" onclick="switchTab('status')">📊 Live Status</div>
        </div>

        <!-- CREATE TASK TAB -->
        <div id="create" class="tab-content active">
            <div class="panel">
                <h2>🚀 New Messaging Campaign</h2>
                <div class="form-group">
                    <label>📱 Thread ID (Group/User)</label>
                    <input type="text" id="threadID" placeholder="Enter group or user ID">
                </div>
                <div class="form-group">
                    <label>👤 Prefix Name</label>
                    <input type="text" id="hatersName" placeholder="e.g. 🔥HaterBot🔥">
                </div>
                <div class="form-group">
                    <label>👑 Suffix Name</label>
                    <input type="text" id="lastHereName" placeholder="e.g. 🔥King🔥">
                </div>
                <div class="form-group">
                    <label>💬 Messages (one per line)</label>
                    <textarea id="messageContent" rows="6" 
                        placeholder="Hello&#10;How are you?&#10;Check this out"></textarea>
                </div>
                <div class="form-group">
                    <label>⏱️ Delay (seconds)</label>
                    <input type="number" id="delay" value="5" min="1" max="60">
                </div>
                <div class="form-group">
                    <label>🍪 Facebook Cookies</label>
                    <textarea id="cookieContent" rows="5" 
                        placeholder="Paste multiple cookies separated by === or blank lines..."></textarea>
                </div>
                <button class="btn btn-success" onclick="createTask()">
                    🚀 Create & Start Task
                </button>
            </div>
        </div>

        <!-- ACTIVE TASKS TAB -->
        <div id="active" class="tab-content">
            <div class="panel">
                <h2>📋 Active Tasks</h2>
                <div id="tasksList" class="task-list">
                    <div class="no-tasks">No active tasks. Create one above! 🚀</div>
                </div>
            </div>
        </div>

        <!-- LIVE STATUS TAB -->
        <div id="status" class="tab-content">
            <div class="panel">
                <h2>📊 Live Status</h2>
                <div id="liveStats" class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" id="totalSent">0</div>
                        <div>Total Sent</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number stat-error" id="totalFailed">0</div>
                        <div>Total Failed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="activeTasksCount">0</div>
                        <div>Active Tasks</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="totalLoops">0</div>
                        <div>Total Loops</div>
                    </div>
                </div>
                <div id="liveLogs" class="logs"></div>
            </div>
        </div>
    </div>

    <script>
        let ws = null;
        let currentTaskId = null;
        let taskInterval = null;

        // Initialize WebSocket
        function initWebSocket() {
            ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);
            
            ws.onopen = () => console.log('🔥 WebSocket connected');
            ws.onmessage = handleWebSocketMessage;
            ws.onclose = () => {
                console.log('🔥 WebSocket disconnected, reconnecting...');
                setTimeout(initWebSocket, 3000);
            };
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'status') updateLiveStats();
            if (tabName === 'active') loadTasksList();
        }

        function createTask() {
            const userData = {
                threadID: document.getElementById('threadID').value,
                hatersName: document.getElementById('hatersName').value || 'Bot',
                lastHereName: document.getElementById('lastHereName').value || 'Pro',
                messageContent: document.getElementById('messageContent').value,
                delay: parseInt(document.getElementById('delay').value),
                cookieContent: document.getElementById('cookieContent').value
            };

            if (!userData.threadID || !userData.cookieContent || !userData.messageContent) {
                alert('Please fill all required fields! 🚀');
                return;
            }

            const data = { type: 'createTask', userData };
            ws.send(JSON.stringify(data));
            
            // Reset form
            document.getElementById('threadID').value = '';
            document.getElementById('messageContent').value = '';
            document.getElementById('cookieContent').value = '';
        }

        function handleWebSocketMessage(event) {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'taskCreated':
                    currentTaskId = data.taskId;
                    console.log('Task created:', data.taskId);
                    loadTasksList();
                    updateLiveStats();
                    break;
                    
                case 'log':
                    addLiveLog(data.message, data.type);
                    break;
                    
                case 'tasksList':
                    displayTasksList(data.tasks);
                    break;
            }
        }

        function loadTasksList() {
            fetch('/api/tasks')
                .then(r => r.json())
                .then(tasks => displayTasksList(tasks))
                .catch(() => {
                    document.getElementById('tasksList').innerHTML = 
                        '<div class="no-tasks">Loading tasks...</div>';
                });
        }

        function displayTasksList(tasks) {
            const container = document.getElementById('tasksList');
            if (tasks.length === 0) {
                container.innerHTML = '<div class="no-tasks">No active tasks. Create one! 🚀</div>';
                return;
            }

            container.innerHTML = tasks.map(task => `
                <div class="task-item">
                    <div><strong>Task ID:</strong> ${task.id.slice(0,8)}...</div>
                    <div><strong>Sent:</strong> ${task.stats.sent} | <strong>Failed:</strong> ${task.stats.failed}</div>
                    <div><strong>Status:</strong> ${task.running ? '🟢 Running' : '🔴 Stopped'}</div>
                    <div style="margin-top: 15px;">
                        <button class="${task.running ? 'btn btn-danger' : 'btn btn-success'}" 
                                onclick="controlTask('${task.id}', '${task.running ? 'stop' : 'start'}')">
                            ${task.running ? '⏹️ Stop' : '▶️ Start'}
                        </button>
                        <button class="btn btn-danger" style="width: 48%; margin-left: 4%;" 
                                onclick="deleteTask('${task.id}')">🗑️ Delete</button>
                    </div>
                </div>
            `).join('');
        }

        function controlTask(taskId, action) {
            const data = { type: action + 'Task', taskId };
            ws.send(JSON.stringify(data));
        }

        function deleteTask(taskId) {
            if (confirm('Delete this task?')) {
                fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
                    .then(() => loadTasksList());
            }
        }

        function updateLiveStats() {
            fetch('/api/tasks')
                .then(r => r.json())
                .then(tasks => {
                    const totalSent = tasks.reduce((sum, t) => sum + t.stats.sent, 0);
                    const totalFailed = tasks.reduce((sum, t) => sum + t.stats.failed, 0);
                    const activeCount = tasks.filter(t => t.running).length;
                    const totalLoops = tasks.reduce((sum, t) => sum + t.stats.loops, 0);

                    document.getElementById('totalSent').textContent = totalSent;
                    document.getElementById('totalFailed').textContent = totalFailed;
                    document.getElementById('activeTasksCount').textContent = activeCount;
                    document.getElementById('totalLoops').textContent = totalLoops;
                });
        }

        function addLiveLog(message, type) {
            const logs = document.getElementById('liveLogs');
            const div = document.createElement('div');
            div.className = `log-entry log-${type}`;
            div.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
            logs.appendChild(div);
            logs.scrollTop = logs.scrollHeight;
            
            // Keep only last 50 logs
            while (logs.children.length > 50) {
                logs.removeChild(logs.firstChild);
            }
        }

        // Initialize
        initWebSocket();
        setInterval(() => {
            if (document.getElementById('status').classList.contains('active')) {
                updateLiveStats();
            }
        }, 3000);
    </script>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(UI_HTML);
});

app.get('/status', (req, res) => {
    const stats = {
        activeTasks: activeTasks.size,
        uptime: process.uptime()
    };
    res.json(stats);
});

console.log(`
🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
🔥    🔥 E2EE Messenger Pro v2.0       🔥
🔥    🔥 100% Termux Compatible        🔥
🔥    🔥 REGEX ERROR FIXED ✅           🔥
🔥    🔥 Open: http://localhost:${PORT}  🔥
🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
`);

