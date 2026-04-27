/**
 * Hayai Desk — Painel de Suporte para atendimento rápido
 * Desenvolvido por: Rodrigo Won
 * Ano: 2026
 * Repositório: https://github.com/rodrigowon/painel-suporte.git
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs   = require("fs");

// Reload automático apenas em desenvolvimento
if (!app.isPackaged) {
  try {
    require("electron-reloader")(module);
  } catch (_) {}
}

app.setAppUserModelId("com.hayai.desk");

let win; // referência global à janela principal

// Cria a janela principal do aplicativo
function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 335,
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
      backgroundThrottling: false, // mantém timers precisos mesmo com a janela minimizada
      spellcheck: false,           // evita inicialização do spell-checker desnecessário
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
ipcMain.on("win-resize", (e, w, h) => {
  if (!win) return;

  const width = Math.min(Math.max(Math.round(Number(w) || 400), 380), 1200);
  const height = Math.min(Math.max(Math.round(Number(h) || 335), 335), 900);

  win.setSize(width, height);
});

// Abre uma URL no navegador padrão do sistema com validação básica
ipcMain.on("open-external", (e, url) => {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) return;

    shell.openExternal(parsed.toString());
  } catch {
    return;
  }
});

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
