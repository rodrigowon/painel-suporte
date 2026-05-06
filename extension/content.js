/**
 * content.js — Script injetado no TomTicket
 * Detecta o campo de resposta, exibe o overlay de sugestões e
 * insere o texto selecionado diretamente no chat.
 */

// ═══════════════════════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════════════════════

let msgs          = [];         // mensagens carregadas do storage
let dark          = true;       // tema do overlay
let attendantName = "";

let overlayEl     = null;       // elemento DOM do overlay
let activeField   = null;       // campo de texto atualmente focado
let suggestions   = [];         // sugestões calculadas
let activeIdx     = 0;          // índice da sugestão destacada
let debounceTimer = null;       // timer de debounce do input
let enabled = true;
let overlayDrag = {
  active: false,
  moved: false,
  startX: 0,
  scrollLeft: 0,
};

// ═══════════════════════════════════════════════════════════
// STORAGE — lê configurações do chrome.storage.local
// ═══════════════════════════════════════════════════════════

/** Carrega mensagens, nome e tema do storage */
function loadStorage(callback) {
  chrome.storage.local.get(["hd_msgs", "hd_dark", "hd_enabled"], (data) => {
    try { msgs = JSON.parse(data.hd_msgs || "null") || []; } catch { msgs = []; }
    dark          = data.hd_dark !== "false";
    enabled = parseEnabledValue(data.hd_enabled);
    
    if (callback) callback();
  });
}

/** Recarrega ao vivo quando o popup salva dados */
chrome.storage.onChanged.addListener((changes) => {
  if (changes.hd_msgs)  try { msgs = JSON.parse(changes.hd_msgs.newValue); } catch {}
  if (changes.hd_dark)  dark = changes.hd_dark.newValue !== "false";
  
  if (changes.hd_enabled) {
  enabled = parseEnabledValue(changes.hd_enabled.newValue);

  if (!enabled) {
    dismiss();
  }
}
});

// ═══════════════════════════════════════════════════════════
// DETECÇÃO DO CAMPO DE TEXTO
// ═══════════════════════════════════════════════════════════

/**
 * Seletores de campos de texto conhecidos no TomTicket.
 * Tentamos o mais específico primeiro e caímos nos genéricos.
 */
const FIELD_SELECTORS = [
  // Editor de resposta do TomTicket (ProseMirror / contenteditable)
  ".ProseMirror",
  "[data-testid='chat-input']",
  // Quill, tiptap e similares
  ".ql-editor",
  ".tiptap",
  // Fallback genérico
  "textarea",
  "div[contenteditable='true']",
  "div[contenteditable='']",
].join(", ");

/** Retorna true se o elemento é um campo editável válido */
function isEditableField(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "input" && ["text", "search", ""].includes(el.type || "")) return true;
  if (el.contentEditable === "true" || el.contentEditable === "") return true;
  return false;
}

/** Lê o texto atual do campo (suporta textarea e contenteditable) */
function getFieldText(field) {
  if (!field) return "";
  if (field.tagName?.toLowerCase() === "textarea" || field.tagName?.toLowerCase() === "input") {
    return field.value || "";
  }
  return field.innerText || field.textContent || "";
}

function hdNormalize(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hdTokenize(str = "") {
  return hdNormalize(str)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

const HD_TRIGGER_KEYWORDS = new Set([
  "ola",
  "oi",
  "cpf",
  "cnpj",
  "nf",
  "nfs",
  "os",
  "pdv",
  "acesso",
  "senha",
  "login",
  "usuario",
  "usuário",
  "chamado",
  "orcamento",
  "orçamento",
  "nota",
  "pedido",
  "erro",
  "travou",
  "lento",
  "impressora",
  "sistema"
]);

function shouldTriggerHayai(input) {
  const raw = input.trim();
  if (!raw) return false;

  // Modo nome: @Ana, @João, @Cliente
  if (raw.startsWith("@")) {
    return raw.slice(1).trim().length >= 2;
  }

  const normalized = hdNormalize(raw);
  const terms = hdTokenize(raw);

  if (!terms.length) return false;

  // Evita abrir sugestão em frases normais do chat
  // Ex: "preciso de ajuda", "boa tarde", "qual seu acesso"
  if (terms.length > 1) return false;

  // Bloqueia palavras genéricas que aparecem demais
  if (["boa", "bom", "dia", "tarde", "noite"].includes(normalized)) {
    return false;
  }

  // Comandos explícitos de saudação
  if (["ola", "olá", "oi"].includes(normalized)) {
    return true;
  }

  // Se a palavra digitada existir em alguma mensagem cadastrada, pode sugerir
  return msgs.some(msg => {
    const rawMsg = hdNormalize(msg);
    const resolvedMsg = hdNormalize(applyVarsForSearch(msg, "", ""));

    return rawMsg.includes(normalized) || resolvedMsg.includes(normalized);
  });
}


/**
 * Insere texto no campo — suporta textarea, input e contenteditable.
 * Dispara os eventos necessários para que o React/Vue do TomTicket
 * detecte a mudança e habilite o botão de enviar.
 */
function insertText(field, text) {
  if (!field) return false;

  const tag = field.tagName?.toLowerCase();
  const win = field.ownerDocument?.defaultView || window;

  field.focus();

  if (tag === "textarea" || tag === "input") {
    const proto = tag === "textarea"
      ? win.HTMLTextAreaElement.prototype
      : win.HTMLInputElement.prototype;

    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");

    if (descriptor?.set) {
      descriptor.set.call(field, text);
    } else {
      field.value = text;
    }

    field.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true,
      inputType: "insertText",
      data: text,
    }));
    field.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    return true;
  }

  if (field.isContentEditable || field.contentEditable === "true" || field.contentEditable === "") {
    const sel = win.getSelection();

    if (sel) {
      const range = field.ownerDocument.createRange();
      range.selectNodeContents(field);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    let inserted = false;
    try {
      inserted = field.ownerDocument.execCommand("insertText", false, text);
    } catch (_) {
      inserted = false;
    }

    // Fallback para editores que bloqueiam execCommand.
    if (!inserted || getFieldText(field).trim() !== text.trim()) {
      field.textContent = text;

      const range = field.ownerDocument.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    field.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true,
      inputType: "insertText",
      data: text,
    }));
    field.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════
// OVERLAY — criação e posicionamento
// ═══════════════════════════════════════════════════════════

/** Cria o elemento DOM do overlay (uma vez) */
function createOverlay() {
  if (overlayEl) return;

  overlayEl = document.createElement("div");
  overlayEl.className = "hd-overlay" + (dark ? "" : " hd-light");
  overlayEl.setAttribute("role", "listbox");
  overlayEl.setAttribute("aria-label", "Sugestões Hayai Desk");

  // Permite arrastar o carrossel horizontalmente.
  // O clique continua funcionando: só bloqueamos o clique se houve movimento real.
  overlayEl.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;

  overlayDrag.active = true;
  overlayDrag.moved = false;
  overlayDrag.startX = e.clientX;
  overlayDrag.scrollLeft = overlayEl.scrollLeft;

  overlayEl.classList.add("dragging");
});

overlayEl.addEventListener("pointermove", (e) => {
  // Se o botão esquerdo NÃO estiver pressionado, não arrasta
  if (!overlayDrag.active || e.buttons !== 1) {
    overlayDrag.active = false;
    overlayEl.classList.remove("dragging");
    return;
  }

  const dx = e.clientX - overlayDrag.startX;

  if (Math.abs(dx) > 4) {
    overlayDrag.moved = true;
    e.preventDefault();
    overlayEl.scrollLeft = overlayDrag.scrollLeft - dx;
  }
});

overlayEl.addEventListener("pointerup", () => {
  overlayDrag.active = false;
  overlayEl.classList.remove("dragging");
});

overlayEl.addEventListener("pointerleave", () => {
  // Se saiu do overlay sem estar segurando o botão, cancela o arraste
  if (overlayDrag.active && !(window.event && window.event.buttons === 1)) {
    overlayDrag.active = false;
    overlayEl.classList.remove("dragging");
  }
});

overlayEl.addEventListener("pointercancel", () => {
  overlayDrag.active = false;
  overlayEl.classList.remove("dragging");
});

  document.body.appendChild(overlayEl);
}

/** Remove o overlay do DOM */
function destroyOverlay() {
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
}

/**
 * Posiciona o overlay logo abaixo do campo focado.
 * Usa getBoundingClientRect + position:fixed para não ser
 * afetado por overflow:hidden dos containers pai.
 */
function positionOverlay(field) {
  if (!overlayEl || !field) return;

  const rect = field.getBoundingClientRect();
  const vpH  = window.innerHeight;
  const vpW  = window.innerWidth;

  const top  = rect.bottom + 6;
  const left = rect.left;

  // Limita o overlay à largura do campo, sem vazar para a lateral direita
  const overlayW = Math.min(rect.width, vpW - rect.left - 16);

  if (top + 90 > vpH && rect.top > 90) {
    overlayEl.style.setProperty("bottom", `${vpH - rect.top + 6}px`, "important");
    overlayEl.style.setProperty("top", "auto", "important");
  } else {
    overlayEl.style.setProperty("top", `${top}px`, "important");
    overlayEl.style.setProperty("bottom", "auto", "important");
  }

  overlayEl.style.setProperty("left", `${left}px`, "important");
  overlayEl.style.setProperty("width", `${overlayW}px`, "important");
  overlayEl.style.setProperty("max-width", `${overlayW}px`, "important");
}

/** Renderiza os itens de sugestão dentro do overlay */
function renderOverlay(input) {
  if (!overlayEl) return;

  overlayEl.className = "hd-overlay hd-compact" + (dark ? "" : " hd-light");
  overlayEl.innerHTML = "";

  suggestions.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "hd-item" + (idx === activeIdx ? " hd-active" : "");
    div.setAttribute("role", "option");
    div.setAttribute("aria-selected", String(idx === activeIdx));

    div.innerHTML = `
      <span class="hd-item-text">${escapeHtml(item.text)}</span>
    `;

    // Evita que o campo do chat perca foco antes do clique aceitar a sugestão.
    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    div.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (overlayDrag.moved) {
        overlayDrag.moved = false;
        return;
      }

      activeIdx = idx;
      accept();
    });

    overlayEl.appendChild(div);
  });
}

/** Escapa HTML para evitar quebrar o overlay com caracteres especiais */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ═══════════════════════════════════════════════════════════
// LÓGICA PRINCIPAL — input, accept, dismiss
// ═══════════════════════════════════════════════════════════

/** Calcula sugestões e mostra/atualiza o overlay */
function handleInput(field) {
  if (!enabled) {
  dismiss();
  return;
  }

  const input = getFieldText(field).trim();
  
  if (input.length < 2 || !shouldTriggerHayai(input)) {
    dismiss();
    return;
  }

  const normalizedInput = hdNormalize(input);

  // ═══════════════════════════════════════════════════════
  // MODO NOME: @Ana, @João, @Cliente
  // Puxa direto mensagens com {{nome}}.
  // ═══════════════════════════════════════════════════════
  if (input.startsWith("@")) {
    const clientName = input.slice(1).trim();

    suggestions = msgs
      .map((msg, index) => ({
        index,
        raw: msg,
        text: applyVarsForSearch(msg, clientName, ""),
      }))
      .filter(item => {
        return /\{\{\s*nome\s*\}\}/i.test(item.raw);
      })
      .sort((a, b) => {
        const aHasGreeting = /\{\{\s*saudacao\s*\}\}/i.test(a.raw) ? 1 : 0;
        const bHasGreeting = /\{\{\s*saudacao\s*\}\}/i.test(b.raw) ? 1 : 0;

        return bHasGreeting - aHasGreeting;
      })
      .slice(0, 5);
  }

  // ═══════════════════════════════════════════════════════
  // MODO SAUDAÇÃO: ola / olá / oi
  // Puxa frases com {{saudacao}} mesmo que o texto final seja "Bom dia".
  // ═══════════════════════════════════════════════════════
  else if (["ola", "olá", "oi"].includes(normalizedInput)) {
    suggestions = msgs
      .map((msg, index) => ({
        index,
        raw: msg,
        text: applyVarsForSearch(msg, "", ""),
      }))
      .filter(item => {
        const raw = hdNormalize(item.raw);
        const text = hdNormalize(item.text);

        return (
          /\{\{\s*saudacao\s*\}\}/i.test(item.raw) ||
          raw.includes("ola") ||
          raw.includes("olá") ||
          raw.includes("oi") ||
          text.includes("bom dia") ||
          text.includes("boa tarde") ||
          text.includes("boa noite")
        );
      })
      .slice(0, 5);
  }

  // ═══════════════════════════════════════════════════════
  // MODO PALAVRA-CHAVE: instante, cpf, nf, chamado, acesso...
  // Busca direto no texto original e no texto com variáveis aplicadas.
  // ═══════════════════════════════════════════════════════
  else {
    const fuzzyResults = getSmartSuggestions(msgs, input, "");

    const directResults = msgs
      .map((msg, index) => ({
        index,
        raw: msg,
        text: applyVarsForSearch(msg, "", ""),
      }))
      .filter(item => {
        const raw = hdNormalize(item.raw);
        const text = hdNormalize(item.text);

        return (
          raw.includes(normalizedInput) ||
          text.includes(normalizedInput)
        );
      });

    const merged = [];
    const seen = new Set();

    [...directResults, ...fuzzyResults].forEach(item => {
      const key = item.raw || item.text;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });

    suggestions = merged.slice(0, 5);
  }

  activeIdx = 0;

  if (!suggestions.length) {
    dismiss();
    return;
  }

  createOverlay();
  renderOverlay(input);
  positionOverlay(field);
}

function parseEnabledValue(value) {
  return value !== false && value !== "false";
}




/** Aceita a sugestão ativa: insere no campo e fecha overlay */
function accept() {
  const item = suggestions[activeIdx];
  if (!item || !activeField) { dismiss(); return; }

  insertText(activeField, item.text);
  dismiss();
  activeField.focus();
}

/** Fecha e limpa o overlay */
function dismiss() {
  destroyOverlay();
  suggestions = [];
  activeIdx   = 0;
}

/** Navega para a próxima sugestão */
function moveDown() {
  if (!suggestions.length) return;
  activeIdx = (activeIdx + 1) % suggestions.length;
  const input = getFieldText(activeField).trim();
  renderOverlay(input);
}

/** Navega para a sugestão anterior */
function moveUp() {
  if (!suggestions.length) return;
  activeIdx = (activeIdx - 1 + suggestions.length) % suggestions.length;
  const input = getFieldText(activeField).trim();
  renderOverlay(input);
}

// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

/** Listener de input com debounce de 80ms */
function onInput(e) {
  const field = e.currentTarget;
  activeField = field;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => handleInput(field), 80);
}

/** Intercepta Tab/Esc/Arrows antes do TomTicket */
function onKeydown(e) {
  if (!overlayEl) return; // overlay fechado → não interfere

  activeField = e.currentTarget;

  if (e.key === "Tab") {
    e.preventDefault();
    e.stopImmediatePropagation();
    accept();
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    dismiss();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveDown();
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    moveUp();
    return;
  }
}

function onFocus(e) {
  const field = e.currentTarget;
  if (!isEditableField(field)) return;
  activeField = field;
}

function onBlur(e) {
  // Atrasa para não fechar antes do mousedown no overlay
  setTimeout(() => {
    if (!overlayEl) return;
    if (document.activeElement && document.activeElement !== activeField) {
      dismiss();
    }
  }, 150);
}

// ── Reposiciona o overlay ao scrollar / redimensionar ────────
function onScroll() { if (overlayEl && activeField) positionOverlay(activeField); }
window.addEventListener("scroll", onScroll, true);
window.addEventListener("resize", onScroll);

window.addEventListener("pointerup", () => {
  overlayDrag.active = false;

  if (overlayEl) {
    overlayEl.classList.remove("dragging");
  }
});
// ═══════════════════════════════════════════════════════════
// MutationObserver — detecta campos no SPA do TomTicket
// O TomTicket monta os elementos dinamicamente via React,
// então precisamos observar o DOM e anexar listeners quando
// novos campos aparecem.
// ═══════════════════════════════════════════════════════════

const observedFields = new WeakSet(); // evita adicionar listener duplicado

/** Registra listeners num campo editável */
function attachToField(field) {
  if (observedFields.has(field)) return;
  observedFields.add(field);
  field.addEventListener("input",   onInput,   true);
  field.addEventListener("keydown", onKeydown, true);
  field.addEventListener("focus",   onFocus,   true);
  field.addEventListener("blur",    onBlur,    true);
}

/** Busca todos os campos editáveis no documento e os registra */
function scanFields() {
  document.querySelectorAll(FIELD_SELECTORS).forEach((el) => {
    if (isEditableField(el)) attachToField(el);
  });
}

const observer = new MutationObserver(() => scanFields());
observer.observe(document.body, { childList: true, subtree: true });

// ═══════════════════════════════════════════════════════════
// BADGE — indicador visual de que a extensão está ativa
// ═══════════════════════════════════════════════════════════

function createBadge() {
  const badge = document.createElement("div");
  badge.className = "hd-badge" + (dark ? "" : " hd-light");
  badge.title     = "Hayai Desk ativo — clique para abrir configurações";
  badge.innerHTML = `<span class="hd-badge-dot"></span>Hayai Desk`;
  badge.addEventListener("click", () => {
    try {
      if (!chrome.runtime?.id) return;
      chrome.runtime.sendMessage({ action: "openPopup" });
    } catch (_) {
      console.warn("Hayai Desk: contexto da extensão invalidado. Atualize a página.");
    }
  });
  document.body.appendChild(badge);
}

// ═══════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════

loadStorage(() => {
  scanFields();    // campos já presentes ao carregar
  createBadge();   // badge de status
});
