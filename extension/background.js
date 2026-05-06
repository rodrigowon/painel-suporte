/**
 * background.js — Service Worker da extensão Hayai Desk
 * Inicializa o storage com dados padrão na primeira instalação.
 */

const DEFAULTS = [
  "{{saudacao}}! Aqui é {{nome}}. Como posso ajudá-lo(a)? 😊",
  "Só um instante, estou verificando para você. ⏳",
  "Pode me informar o número do chamado, por favor?",
  "Consegui identificar o problema, vou resolver agora.",
  "Problema resolvido! ✅ Posso ajudar em mais alguma coisa?",
  "Vou escalar para o time responsável e retorno em breve.",
  "Obrigado pelo contato! Qualquer coisa estou por aqui. 😊",
];

/** Na primeira instalação, grava as mensagens e configurações padrão */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason !== "install") return;
  chrome.storage.local.set({
    hd_msgs:  JSON.stringify(DEFAULTS),
    hd_name:  "",
    hd_dark:  "true",
  });
});


/** Permite que o badge injetado na página peça a abertura do popup. */
chrome.runtime.onMessage.addListener((message) => {
  if (message?.action !== "openPopup") return;

  if (chrome.action?.openPopup) {
    chrome.action.openPopup().catch(() => {});
  }
});
