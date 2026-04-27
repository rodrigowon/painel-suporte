# Hayai Desk 🚀

Painel flutuante de respostas rápidas para atendimento Help Desk.  
Sempre no topo, modo escuro/claro, Smart Compose com busca inteligente e reordenação por drag & drop.

---

## ⚡ Como gerar o .EXE

### 1. Instale o Node.js
Baixe em: https://nodejs.org — versão recomendada: **LTS (20)**

### 2. Abra o terminal na pasta do projeto
Clique com botão direito na pasta `hayai-desk` → "Abrir no Terminal"

### 3. Instale as dependências
```bash
npm install
```
Aguarde (~300 MB na primeira vez — inclui o Electron)

### 4. Teste antes de empacotar
```bash
npm start
```
O painel deve abrir. Se tudo estiver correto, feche e prossiga.

### 5. Gere o .EXE portátil
```bash
npm run build
```
Saída: `dist/Hayai Desk.exe` — basta copiar e executar em qualquer máquina.

### 6. Gere com instalador (opcional)
```bash
npm run build:installer
```
Gera `dist/Hayai Desk Setup.exe` com atalho no Desktop e Menu Iniciar.

---

## 📁 Estrutura do projeto

```
hayai-desk/
├── build/
│   ├── icon.ico       ← Ícone do app (256×256 recomendado)
│   ├── logo.png       ← Logo exibida no botão do rodapé
│   └── logotr.png     ← Variante com fundo transparente (opcional)
├── dist/              ← Gerado pelo build (não versionar)
├── node_modules/      ← Gerado pelo npm install (não versionar)
├── index.html         ← Interface completa (HTML/CSS/JS)
├── main.js            ← Processo principal do Electron
├── preload.js         ← Bridge segura entre renderer e main
├── package.json       ← Dependências e configuração de build
└── README.md          ← Este arquivo
```

---

## 🎨 Como personalizar o ícone

1. Converta sua imagem em `.ico` em: https://icoconvert.com (256×256)
2. Salve como `icon.ico` dentro da pasta `build/`
3. Gere novamente com `npm run build`

---

## 📤 Como distribuir para outras máquinas

**Versão portátil** (recomendado):
- Copie `dist/Hayai Desk.exe` para a máquina de destino
- Execute diretamente — sem instalação necessária

**Versão com instalador**:
- Copie `dist/Hayai Desk Setup.exe` para a máquina de destino
- Execute o instalador — cria atalho no Desktop e Menu Iniciar automaticamente

---

## 🔧 Funcionalidades

| Recurso | Descrição |
|---|---|
| Respostas rápidas | Clique num card para copiar a mensagem instantaneamente |
| `{{nome}}` / `{{saudacao}}` | Variáveis substituídas pelo nome do atendente e saudação do período |
| Período automático | Detecta manhã/tarde/noite pelo relógio do sistema; atualiza sem reiniciar |
| Auto-hide da barra de período | Some ao rolar a lista, aparece ao rolar para cima |
| Smart Compose | Digite uma palavra-chave e pressione Tab ou Enter para copiar |
| `@Nome` no Smart Compose | Digite `@Ana` para buscar mensagens com o nome "Ana" substituído em `{{nome}}` |
| Prioridade de saudação | O Smart Compose prioriza a saudação do período atual ("Bom dia", "Boa tarde"...) |
| Drag & drop | Reordene os cards arrastando pelo ícone de grip |
| 2 colunas | Layout em grade automático quando há mais de 5 mensagens |
| Modo escuro/claro | Alternável pelo botão na barra de título |
| Confirmação ao excluir | Pede confirmação antes de remover uma mensagem |
| Sempre no topo | A janela fica sobre todas as outras janelas |

---

## 💡 Como usar o Smart Compose

**Busca por palavra-chave:**
```
verificando  →  Só um instante, estou verificando para você...
chamado      →  Pode me informar o número do chamado...
resolvido    →  Problema resolvido! Posso ajudar em mais alguma coisa?
```

**Busca com nome do cliente (`@Nome`):**
```
@Ana         →  Bom dia Ana! Aqui é Rodrigo. Como posso ajudá-la?
@João Pedro  →  Bom dia João Pedro! Como posso ajudá-lo?
```

Use **Tab** ou **Enter** para autocompletar e copiar. Use **↑ ↓** para navegar entre sugestões. **Esc** limpa o campo.

---

## ❓ Problemas comuns

**`npm` não é reconhecido**  
→ Reinstale o Node.js e reinicie o terminal.

**Build falhou com erro de ícone**  
→ Certifique-se de que `build/icon.ico` existe, ou remova as linhas `"icon"` do `package.json`.

**Antivírus bloqueou o .exe**  
→ Esperado em executáveis Electron sem assinatura digital. Adicione uma exceção no antivírus.

**Janela abre com altura diferente do esperado**  
→ O redimensionamento automático acontece após o conteúdo renderizar. Feche e reabra se necessário.

---

## 📋 Histórico de versões

### v1.3.0 — 27 de abril de 2026
- Smart Compose com gatilho `@Nome` para personalizar mensagens com o nome do cliente
- Busca sem `@` não interpreta mais o texto como nome (corrige "Bom dia cpf!")
- Priorização da saudação do período atual no Smart Compose
- Auto-hide da barra Manhã/Tarde/Noite ao rolar a lista
- Período atualiza automaticamente sem precisar fechar o app
- Confirmação antes de excluir mensagens
- Proteção contra HTML em mensagens cadastradas
- Tratamento de erro no clipboard com aviso ao usuário
- Botões do footer somente com ícones (mais compacto)
- Ícone animado no modo digitação
- `electron-reloader` restrito ao modo desenvolvimento
- Validação de URLs externas no `main.js`
- Altura inicial da janela corrigida (era 300, mínimo era 335)

### v1.2.0
- Modo digitação (Smart Compose) com busca fuzzy
- Algoritmo Jaro-Winkler + Damerau-Levenshtein para tolerância a erros de digitação
- Chips de sugestão clicáveis
- Debounce no smart compose
- Detecção automática de período pelo relógio do sistema
- Botão minimizar e maximizar
- Drag & drop com animação de shake

### v1.1.0
- Modo escuro/claro
- Layout em 2 colunas para listas grandes
- Reordenação por drag & drop
- Modal de informações com logo clicável
- Variáveis `{{nome}}` e `{{saudacao}}` nas mensagens
