const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize:     ()        => ipcRenderer.send("win-minimize"),
  maximize:     ()        => ipcRenderer.send("win-maximize"),
  setSize:      (w, h)   => ipcRenderer.send("win-resize", w, h),
  openExternal: (url)    => ipcRenderer.send("open-external", url),
  openImageDialog: ()      => ipcRenderer.invoke("dialog-open-file"),
});
