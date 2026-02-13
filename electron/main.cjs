const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let apiProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // Load the React app
  // In dev, we load localhost. In prod, we load index.html
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, we are inside resources/app.asar
    // So we use app.getAppPath()
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    // Open DevTools even in prod to debug black screen
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startApi() {
  // In production, we need to run the compiled JS server or ts-node
  // For simplicity here, let's assume we compile TS to JS or run via ts-node in dev
  // BUT for exe, we usually bundle the server.
  
  // Strategy: We will just spawn the 'server.js' (we need to build it)
  // Or simpler: Just require it here if possible, but spawning is safer for separate process
  
  const isDev = !app.isPackaged;
  
  // We need to build api/server.ts to dist-api/server.js first!
  const scriptPath = isDev 
      ? path.join(__dirname, '../api/server.ts') 
      : path.join(app.getAppPath(), 'dist-api/server.js');

  // If dev, use tsx. If prod, use node
  const cmd = isDev ? 'npx' : 'node';
  const args = isDev ? ['tsx', scriptPath] : [scriptPath];

  if (isDev) {
      // In dev, we let the user run npm run dev themselves usually
      // But we can try to spawn it. 
      // Actually, let's rely on 'npm run dev' running in background for dev mode
      console.log("Dev mode: Assuming API is running on port 3001");
  } else {
      console.log(`Starting API from ${scriptPath}`);
      apiProcess = spawn(cmd, args, {
          cwd: isDev ? process.cwd() : process.resourcesPath,
          env: { ...process.env, RESOURCES_PATH: process.resourcesPath }
      });
      
      apiProcess.stdout.on('data', (data) => console.log(`API: ${data}`));
      apiProcess.stderr.on('data', (data) => console.error(`API ERR: ${data}`));
  }
}

app.on('ready', () => {
  startApi();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (apiProcess) apiProcess.kill();
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
