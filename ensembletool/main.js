// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain} = require("electron");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    webPreferences: {
      // enable Node APIs in browser-context scripts, as per https://stackoverflow.com/a/55908510
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile("ensembleconsole.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  app.quit();
});

// when the renderer process requests we open a folder, ask the user which one they want
// and send back a folderData event with the chosen paths (should only ever be one)
ipcMain.on("openFolder", (event, path) => {
  const paths = dialog.showOpenDialogSync(mainWindow, {properties: ["openDirectory"]});
  event.sender.send("folderData", paths);
});
