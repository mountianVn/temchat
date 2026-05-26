const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV !== 'production';
const isPackaged = app.isPackaged;

function log(msg) {
  const timestamp = new Date().toISOString();
  console.log('[' + timestamp + '] ' + msg);
}

function checkServerReady(callback) {
  const req = http.get('http://localhost:3001/api/health', (res) => {
    callback(res.statusCode === 200);
  });
  req.on('error', () => callback(false));
  req.setTimeout(2000, () => {
    req.destroy();
    callback(false);
  });
}

function waitForServer(maxAttempts = 60, callback, attempt = 0) {
  if (attempt >= maxAttempts) {
    log('Server timeout');
    callback();
    return;
  }
  checkServerReady((ready) => {
    if (ready) {
      log('Server ready!');
      callback();
    } else {
      setTimeout(() => waitForServer(maxAttempts, callback, attempt + 1), 1000);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'TeamChat',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.setTitle('TeamChat - Internal Chat App');
  });

  const loadURL = isDev ? 'http://localhost:5173' : 'http://localhost:3001';
  log('Loading: ' + loadURL);
  mainWindow.loadURL(loadURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function startServer() {
  const isWindows = process.platform === 'win32';
  
  // Get paths
  let appPath = app.getAppPath();
  let resourcesPath = process.resourcesPath || path.join(appPath, '..');
  
  log('App path: ' + appPath);
  log('Resources: ' + resourcesPath);
  
  // Try different possible locations for server
  const possiblePaths = [
    path.join(resourcesPath, 'app.asar.unpacked', 'server'),
    path.join(resourcesPath, 'app', 'server'),
    path.join(appPath, 'server'),
  ];
  
  let serverPath = null;
  for (const p of possiblePaths) {
    log('Checking: ' + p);
    if (require('fs').existsSync(p)) {
      serverPath = p;
      log('Found server at: ' + serverPath);
      break;
    }
  }
  
  if (!serverPath) {
    log('ERROR: Server not found');
    return;
  }

  // Find node executable
  const nodePath = isWindows ? 'node.exe' : 'node';
  
  // Check for node in common locations
  const nodePaths = [
    path.join(resourcesPath, 'node.exe'),
    'node',
  ];
  
  let nodeCmd = 'node';
  for (const np of nodePaths) {
    try {
      require('fs').accessSync(np.includes(path.sep) ? np : process.execPath.replace(/\\/g, '/').replace(/[^\\/]+$/, '').replace(/\/$/, '') + '/node.exe');
      nodeCmd = np;
      break;
    } catch (e) {}
  }
  
  log('Using node: ' + nodeCmd);
  
  const serverIndex = path.join(serverPath, 'src', 'index.js');
  log('Server entry: ' + serverIndex);
  
  const env = { 
    ...process.env, 
    NODE_ENV: 'production', 
    PORT: '3001' 
  };

  try {
    log('Starting server...');
    serverProcess = spawn(nodeCmd, [serverIndex], {
      cwd: serverPath,
      shell: isWindows,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    serverProcess.stdout.on('data', (data) => {
      log('[S] ' + data.toString().trim());
    });

    serverProcess.stderr.on('data', (data) => {
      log('[E] ' + data.toString().trim());
    });

    serverProcess.on('close', (code) => {
      log('Server exited: ' + code);
    });
  } catch (err) {
    log('ERROR: ' + err.message);
  }
}

function stopServer() {
  if (serverProcess) {
    log('Stopping server...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t'], { shell: true });
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch (e) {
      log('Stop error: ' + e.message);
    }
    serverProcess = null;
  }
}

app.whenReady().then(() => {
  log('TeamChat starting...');
  log('Packaged: ' + isPackaged);
  
  if (!isDev) {
    startServer();
    waitForServer(60, () => {
      createWindow();
    });
  } else {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});
