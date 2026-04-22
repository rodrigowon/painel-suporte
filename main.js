/**
 * Hayai Desk — Painel de Suporte para atendimento rápido
 * Desenvolvido por: Rodrigo Won
 * Ano: 2026
 * Repositório: https://github.com/rodrigowon/painel-suporte.git
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs   = require("fs");

// Reload automático em desenvolvimento (ignorado em produção)
try { require("electron-reloader")(module); } catch (_) {}

app.setAppUserModelId("com.hayai.desk");

let win; // referência global à janela principal

// Cria a janela principal do aplicativo
function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 300,
    minWidth: 380,
    minHeight: 335,
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

  // Exibe a janela apenas quando o conteúdo estiver pronto (evita flash branco)
  win.once("ready-to-show", () => win.show());
}

// Minimiza a janela
ipcMain.on("win-minimize", () => win && win.minimize());

// Alterna entre maximizado e restaurado
// Usa o `win` do escopo do módulo — getFocusedWindow() pode retornar null
ipcMain.on("win-maximize", () => {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});

// Redimensiona a janela para as dimensões calculadas pelo renderer
ipcMain.on("win-resize", (e, w, h) => win && win.setSize(Math.round(w), Math.round(h)));

// Abre uma URL no navegador padrão do sistema
ipcMain.on("open-external", (e, url) => shell.openExternal(url));

// Abre o diálogo nativo de seleção de imagem e retorna base64
ipcMain.handle("dialog-open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Selecione a Logo",
    properties: ["openFile"],
    filters: [
      { name: "Imagens", extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"] },
      { name: "Todos os arquivos", extensions: ["*"] },
    ],
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const data     = fs.readFileSync(filePath);
  const ext      = path.extname(filePath).toLowerCase();

  const mimeMap = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".gif": "image/gif" };
  const mime    = mimeMap[ext] || "image/png";

  return `data:${mime};base64,${data.toString("base64")}`;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
