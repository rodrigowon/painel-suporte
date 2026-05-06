/**
 * fuzzy.js — Algoritmos de busca inteligente do Hayai Desk
 * Portado do index.html do app Electron.
 * Expõe: normalizeText, tokenize, scoreSuggestion, getSmartSuggestions, applyVarsForSearch
 */

/* ── NORMALIZAÇÃO ────────────────────────────────────────── */

/** Remove acentos e converte para minúsculas */
function normalizeText(str = "") {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Divide string em tokens alfanuméricos */
function tokenize(str = "") {
  return normalizeText(str).split(/[^a-z0-9]+/i).filter(Boolean);
}

/* ── ALGORITMOS DE SIMILARIDADE ──────────────────────────── */

/** Algoritmo de Jaro */
function jaroSimilarity(a, b) {
  a = normalizeText(a); b = normalizeText(b);
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const dist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aM = new Array(a.length).fill(false);
  const bM = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const s = Math.max(0, i - dist), e = Math.min(i + dist + 1, b.length);
    for (let j = s; j < e; j++) {
      if (bM[j] || a[i] !== b[j]) continue;
      aM[i] = bM[j] = true; matches++; break;
    }
  }
  if (!matches) return 0;
  let k = 0, t = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aM[i]) continue;
    while (!bM[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  return (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
}

/** Jaro-Winkler: bônus para prefixos comuns */
function jaroWinkler(a, b) {
  const j = jaroSimilarity(a, b);
  a = normalizeText(a); b = normalizeText(b);
  let p = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) p++; else break;
  }
  return j + p * 0.1 * (1 - j);
}

/** Distância de Damerau-Levenshtein */
function damerauLevenshtein(a, b) {
  a = normalizeText(a); b = normalizeText(b);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
      if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1])
        dp[i][j] = Math.min(dp[i][j], dp[i-2][j-2]+1);
    }
  }
  return dp[a.length][b.length];
}

/** Limiar mínimo de similaridade ajustado ao tamanho do termo */
function fuzzyThreshold(term) {
  if (term.length <= 2) return 1.0;
  if (term.length === 3) return 0.72;
  if (term.length === 4) return 0.70;
  if (term.length <= 6) return 0.68;
  return 0.66;
}

function sameLetterBag(a, b) {
  a = normalizeText(a); b = normalizeText(b);
  if (Math.abs(a.length - b.length) > 1 || a.length > 5) return false;
  const count = s => { const m = new Map(); for (const c of s) m.set(c, (m.get(c)||0)+1); return m; };
  const ma = count(a), mb = count(b);
  let diff = 0;
  for (const k of new Set([...ma.keys(), ...mb.keys()])) diff += Math.abs((ma.get(k)||0)-(mb.get(k)||0));
  return diff <= 2;
}

function isAdjacentSwap(a, b) {
  a = normalizeText(a); b = normalizeText(b);
  if (a.length !== b.length || a.length < 2 || a === b) return false;
  for (let i = 0; i < a.length - 1; i++)
    if (a.slice(0,i) + a[i+1] + a[i] + a.slice(i+2) === b) return true;
  return false;
}

function typoSimilarity(term, word) {
  const t = normalizeText(term), w = normalizeText(word);
  if (!t || !w) return 0;
  if (t === w) return 1;
  if (w.startsWith(t)) return 0.97;
  if (w.includes(t)) return 0.90;
  if (isAdjacentSwap(t, w)) return 0.95;
  if (Math.max(t.length, w.length) <= 5 && sameLetterBag(t, w)) return 0.90;
  const jw = jaroWinkler(t, w);
  const dl = 1 - damerauLevenshtein(t, w) / Math.max(t.length, w.length);
  return Math.max(jw, dl);
}

function bestWordScore(term, words) {
  return words.reduce((best, word) => Math.max(best, typoSimilarity(term, word)), 0);
}

/* ── PONTUAÇÃO DE SUGESTÃO ───────────────────────────────── */

/**
 * Pontua uma mensagem em relação ao input digitado.
 * Retorna -1 se não atingir o limiar mínimo.
 */
function scoreSuggestion(input, text) {
  const query = normalizeText(input), fullText = normalizeText(text);
  if (!query || !fullText) return -1;
  const terms = tokenize(input), words = tokenize(text);
  if (!terms.length || !words.length) return -1;
  let score = 0;
  for (const term of terms) {
    const best = bestWordScore(term, words);
    if (best < fuzzyThreshold(term)) return -1;
    score += best * 100;
    if (words.some(w => w === term)) score += 35;
    else if (words.some(w => w.startsWith(term))) score += 20;
  }
  if (fullText.startsWith(query)) score += 180;
  else if (fullText.includes(query)) score += 70;
  const pos = fullText.indexOf(terms[0]);
  if (pos === 0) score += 50;
  else if (pos > 0) score += Math.max(0, 25 - pos);
  score -= text.length * 0.03;
  return score;
}

/* ── BUSCA COM VARIÁVEIS ─────────────────────────────────── */

const GREETINGS = { manha: "Bom dia", tarde: "Boa tarde", noite: "Boa noite" };

/** Detecta o período atual pelo relógio do sistema */
function currentPeriod() {
  const h = new Date().getHours();
  if (h < 12) return "manha";
  if (h < 18) return "tarde";
  return "noite";
}

/**
 * Aplica variáveis na mensagem.
 * Se clientName fornecido (@Nome), substitui {{nome}} pelo nome do cliente.
 * Sem clientName, remove {{nome}} limpando pontuação dupla.
 */
function applyVarsForSearch(text, clientName = "", attendantName = "") {
  const saud = GREETINGS[currentPeriod()] || "Olá";

  let result = String(text || "")
    .replace(/\{\{saudacao\}\}/gi, saud);

  if (clientName) {
    result = result.replace(/\{\{nome\}\}/gi, clientName);
  } else {
    result = result.replace(/\s*\{\{nome\}\}\s*/gi, " ");
  }

  return result
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Retorna até 5 sugestões ordenadas por relevância.
 * Suporta gatilho @Nome para personalização de cliente.
 */
function getSmartSuggestions(msgs, input, attendantName) {
  const rawInput   = input.trim();
  const isNameMode = rawInput.startsWith("@");
  const clientName = isNameMode ? rawInput.slice(1).trim() : "";
  const searchTerm = isNameMode ? clientName : rawInput;
  if (!searchTerm) return [];

  const saudacaoAtual = normalizeText(GREETINGS[currentPeriod()] || "Olá");

  return msgs
    .map((msg, index) => {
      const text  = applyVarsForSearch(msg, clientName, attendantName);
      let score   = scoreSuggestion(searchTerm, text);
      if (score >= 0 && isNameMode) {
        const nt = normalizeText(text), nr = normalizeText(msg);
        if (nt.startsWith(saudacaoAtual))          score += 500;
        if (nr.includes("{{saudacao}}"))            score += 300;
        if (nt.startsWith("ola") && !nt.startsWith(saudacaoAtual)) score -= 100;
      }
      return { index, raw: msg, text, score };
    })
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length)
    .slice(0, 5);
}
