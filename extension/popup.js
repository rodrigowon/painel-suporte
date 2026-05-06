/**
 * popup.js — Hayai Desk Chrome Extension
 * Home minimalista + gerenciamento de mensagens + backup JSON.
 */

// ═══════════════════════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════════════════════

let msgs = [];
let dark = true;
let view = "home"; // "home" | "manager" | "about"
let editIdx = null;
let addingNew = false;
let searchTerm = "";
let enabled = true;

const DEFAULTS = [
  "{{saudacao}} {{nome}}, tudo bem? Como posso ajudar? 😊",
  "Só um instante, estou verificando para você. ⏳",
  "Pode me informar o número do CPF/Cnpj do cliente, por favor?",
  "Problema resolvido! ✅ Posso ajudar em mais alguma coisa?",
  "Vou escalar para o time responsável e retorno em breve.",
  "Obrigado pelo contato! Qualquer coisa estou por aqui. 😊",
];

// ═══════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════

function load() {
  chrome.storage.local.get(["hd_msgs", "hd_dark", "hd_enabled"], (data) => {
    try {
      msgs = JSON.parse(data.hd_msgs || "null") || [...DEFAULTS];
    } catch {
      msgs = [...DEFAULTS];
    }

    dark = data.hd_dark !== "false";
    enabled = data.hd_enabled !== "false";
    applyDark();
    render();
  });
}

function save(callback) {
  chrome.storage.local.set({ hd_msgs: JSON.stringify(msgs) }, callback);
}

function saveDark() {
  chrome.storage.local.set({ hd_dark: String(dark) });
}

function saveEnabled() {
  chrome.storage.local.set({ hd_enabled: String(enabled) });
}

// ═══════════════════════════════════════════════════════════
// TEMA
// ═══════════════════════════════════════════════════════════

function applyDark() {
  document.body.classList.toggle("light", !dark);

  const sun = `
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  `;

  const moon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  document.getElementById("icon-dark").innerHTML = dark ? sun : moon;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function escapeText(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeMessageList(input) {
  const arr = Array.isArray(input) ? input : input?.messages;

  if (!Array.isArray(arr)) return null;

  return arr
    .map((msg) => String(msg || "").trim())
    .filter(Boolean);
}

function iconEdit() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
}

function iconTrash() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>`;
}

// ═══════════════════════════════════════════════════════════
// RENDERIZAÇÃO
// ═══════════════════════════════════════════════════════════

function render() {
  if (view === "manager") {
    renderManager();
  } else if (view === "about") {
    renderAbout();
  } else {
    renderHome();
  }
}

function renderAbout() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <section class="hero-card about-card">
      <div class="manager-top">
        <button class="icon-btn" id="btn-about-back" type="button" title="Voltar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="manager-title">Sobre</div>
      </div>

      <div class="about-main">
        <div class="about-logo">
          <span class="logo-dot about-logo-dot"></span>
        </div>

        <div>
          <div class="about-title">Hayai Desk</div>
          <div class="about-version">Versão 2.0</div>
        </div>
      </div>

      <div class="about-description">
        Extensão de respostas rápidas com Smart Compose para atendimento no TomTicket.
      </div>

      <div class="about-info-box">
        <div class="about-info-title">Stack</div>
        <div class="about-info-line">Chrome Extension Manifest V3</div>
        <div class="about-info-line">HTML, CSS e JavaScript puro</div>
        <div class="about-info-line">Storage local com importação/exportação JSON</div>
      </div>

      <div class="about-links">
        <a class="about-link-btn" href="https://github.com/rodrigowon/painel-suporte.git" target="_blank">
          GitHub / Repositório
          <span>↗</span>
      </a>

      <a class="about-link-btn" href="https://wa.me/5592991969678" target="_blank">
        WhatsApp / Contato
        <span>↗</span>
      </a>
    </div>

      <div class="about-footer-text">
        Desenvolvido por @rodrigowon para agilizar atendimentos Help Desk.
      </div>
    </section>
  `;

  document.getElementById("btn-about-back").addEventListener("click", () => {
    view = "home";
    render();
  });
}

function renderHome() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <section class="hero-card">
        <div class="smart-top-row">
      <div class="status-title">Smart Compose</div>

      <div class="smart-status-wrap">
        <div class="status-pill ${enabled ? "" : "off"}" id="smart-status-pill">
        <span class="status-dot" id="status-dot"></span>
        <span id="smart-status-text">${enabled ? "Ativo no TomTicket" : "Desativado"}</span>
      </div>

        <label class="ios-switch" title="Ativar ou desativar sugestões">
          <input type="checkbox" id="toggle-enabled" ${enabled ? "checked" : ""}>
          <span class="ios-slider"></span>
        </label>
      </div>
    </div>

      <div class="help-list">
        <div class="help-line"><code>@Nome</code><span>personaliza com o nome do cliente.</span></div>
        <div class="help-line"><code>Tab</code><span>aceita a sugestão no chat.</span></div>
        <div class="help-line"><code>Esc</code><span>fecha a sugestão.</span></div>
      </div>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-value">${msgs.length}</div>
          <div class="stat-label">mensagens salvas</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">JSON</div>
          <div class="stat-label">backup local</div>
        </div>
      </div>

      <div class="btn-grid">
        <button class="btn-primary" id="btn-manager" type="button">Gerenciar</button>
        <button class="btn-ghost" id="btn-home-add" type="button">+ Nova</button>
      </div>

      <div class="section-label">Backup</div>
      <div class="backup-row">
        <button class="btn-ghost" id="btn-export" type="button">Exportar JSON</button>
        <button class="btn-ghost" id="btn-import" type="button">Importar JSON</button>
      </div>
    </section>
  `;

  document.getElementById("btn-manager").addEventListener("click", () => {
    view = "manager";
    addingNew = false;
    editIdx = null;
    render();
  });

  document.getElementById("btn-home-add").addEventListener("click", () => {
    view = "manager";
    addingNew = true;
    editIdx = null;
    searchTerm = "";
    render();
  });

  document.getElementById("btn-export").addEventListener("click", exportMessages);

  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });

  document.getElementById("toggle-enabled")?.addEventListener("change", (e) => {
    enabled = e.target.checked;
    saveEnabled();
    renderHome();
  });
}

function renderManager() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="manager-top">
      <button class="icon-btn" id="btn-back" type="button" title="Voltar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      </button>
      <div class="manager-title">Gerenciar mensagens</div>
    </div>

    <input class="search-input" id="search" type="text" placeholder="Buscar mensagem..." value="${escapeText(searchTerm)}">

    <div class="list" id="lista"></div>

    <div class="manager-footer">
      <button class="btn-primary" id="btn-add" type="button">+ Nova mensagem</button>
    </div>
  `;

  document.getElementById("btn-back").addEventListener("click", () => {
    view = "home";
    addingNew = false;
    editIdx = null;
    searchTerm = "";
    render();
  });

  document.getElementById("search").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderMessagesList();
  });

  document.getElementById("btn-add").addEventListener("click", () => {
    addingNew = true;
    editIdx = null;
    renderMessagesList();
  });

  renderMessagesList();
}

function renderMessagesList() {
  const lista = document.getElementById("lista");
  if (!lista) return;

  const query = searchTerm.trim().toLowerCase();
  const filtered = msgs
    .map((msg, index) => ({ msg, index }))
    .filter(({ msg }) => !query || msg.toLowerCase().includes(query));

  lista.innerHTML = "";

  if (addingNew) {
    const div = document.createElement("div");
    div.className = "new-card";
    div.innerHTML = `
      <div class="form-wrap">
        <textarea id="new-ta" placeholder="Nova mensagem..."></textarea>
        <div class="form-actions">
          <button class="btn-primary" id="save-new" type="button">Salvar</button>
          <button class="btn-ghost" id="cancel-new" type="button">Cancelar</button>
        </div>
      </div>
    `;
    lista.appendChild(div);
  }

  if (!filtered.length && !addingNew) {
    lista.innerHTML = `<div class="empty">Nenhuma mensagem encontrada.</div>`;
  }

  filtered.forEach(({ msg, index }) => {
    const div = document.createElement("div");
    div.className = "msg-card";

    if (editIdx === index) {
      div.innerHTML = `
        <div class="form-wrap">
          <textarea id="edit-ta">${escapeText(msg)}</textarea>
          <div class="form-actions">
            <button class="btn-primary" id="save-edit" type="button">Salvar</button>
            <button class="btn-ghost" id="cancel-edit" type="button">Cancelar</button>
          </div>
        </div>
      `;
    } else {
      div.innerHTML = `
        <span class="msg-text">${escapeText(msg)}</span>
        <div class="msg-actions">
          <button class="sm-btn" data-edit="${index}" title="Editar" type="button">${iconEdit()}</button>
          <button class="sm-btn danger" data-del="${index}" title="Excluir" type="button">${iconTrash()}</button>
        </div>
      `;
    }

    lista.appendChild(div);
  });

  bindListEvents();

  setTimeout(() => {
    const ta = document.getElementById(editIdx !== null ? "edit-ta" : "new-ta");
    if (ta) {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, 30);
}

function bindListEvents() {
  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      editIdx = Number(btn.dataset.edit);
      addingNew = false;
      renderMessagesList();
    });
  });

  document.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.del);
      if (!confirm("Excluir esta mensagem?")) return;

      msgs.splice(idx, 1);
      if (editIdx === idx) editIdx = null;
      save(() => renderMessagesList());
    });
  });

  document.getElementById("save-edit")?.addEventListener("click", () => {
    const val = (document.getElementById("edit-ta")?.value || "").trim();
    if (!val || editIdx === null) return;

    msgs[editIdx] = val;
    editIdx = null;
    save(() => renderMessagesList());
  });

  document.getElementById("cancel-edit")?.addEventListener("click", () => {
    editIdx = null;
    renderMessagesList();
  });

  document.getElementById("save-new")?.addEventListener("click", () => {
    const val = (document.getElementById("new-ta")?.value || "").trim();
    if (!val) return;

    msgs.push(val);
    addingNew = false;
    save(() => renderMessagesList());
  });

  document.getElementById("cancel-new")?.addEventListener("click", () => {
    addingNew = false;
    renderMessagesList();
  });
}

// ═══════════════════════════════════════════════════════════
// IMPORTAR / EXPORTAR JSON
// ═══════════════════════════════════════════════════════════

function exportMessages() {
  const backup = {
    app: "Hayai Desk",
    type: "messages-backup",
    version: "2.0",
    exportedAt: new Date().toISOString(),
    messages: msgs,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  a.href = url;
  a.download = `hayai-desk-mensagens-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function importMessagesFromFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const cleanMessages = normalizeMessageList(parsed);

      if (!cleanMessages || !cleanMessages.length) {
        alert("Arquivo inválido ou sem mensagens válidas.");
        return;
      }

      const replace = confirm(
        `Foram encontradas ${cleanMessages.length} mensagens.\n\n` +
        "OK = substituir mensagens atuais\n" +
        "Cancelar = adicionar junto"
      );

      if (replace) {
        msgs = cleanMessages;
      } else {
        msgs = Array.from(new Set([...msgs, ...cleanMessages]));
      }

      addingNew = false;
      editIdx = null;
      searchTerm = "";

      save(() => {
        view = "manager";
        render();
        alert("Mensagens importadas com sucesso.");
      });
    } catch {
      alert("Não foi possível ler este JSON.");
    }
  };

  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════
// EVENTOS GLOBAIS
// ═══════════════════════════════════════════════════════════

document.getElementById("btn-dark").addEventListener("click", () => {
  dark = !dark;
  applyDark();
  saveDark();
});

document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";

  if (file) importMessagesFromFile(file);
});

load();

document.querySelector(".logo")?.addEventListener("click", () => {
  view = "about";
  addingNew = false;
  editIdx = null;
  searchTerm = "";
  render();
});