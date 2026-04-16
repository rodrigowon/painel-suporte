/**
 * Painel Suporte Help Desk
 * Desenvolvido por: Rodrigo
 * Ano: 2026
 * Repositório: https://github.com/rodrigowon/painel-suporte.git
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Ativa o reload automático durante o desenvolvimento
try {
  require('electron-reloader')(module);
} catch (_) {}

app.setAppUserModelId("com.helpdesk.painel");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 380,
    height: 600,
    minWidth: 320,
    minHeight: 350,
    alwaysOnTop: true,
    frame: false,
    show: false,
    resizable: true,
    transparent: false,
    icon: path.join(__dirname, "build/icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
  
  win.once("ready-to-show", () => {
    win.show();
  });
}

ipcMain.on("win-minimize",  ()        => win && win.minimize());
ipcMain.on("win-resize",    (e, w, h) => win && win.setSize(Math.round(w), Math.round(h)));
ipcMain.on("open-external", (e, url)  => shell.openExternal(url));

ipcMain.handle("dialog-open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Selecione a Logo",
    properties: ["openFile"],
    filters: [
      { name: "Imagens", extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"] },
      { name: "Todos os arquivos", extensions: ["*"] } // 👈 Devolvemos essa opção
    ]
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  let mime = 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
  if (ext === '.webp') mime = 'image/webp';
  if (ext === '.svg') mime = 'image/svg+xml';
  if (ext === '.gif') mime = 'image/gif';

  return `data:${mime};base64,${data.toString('base64')}`;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
