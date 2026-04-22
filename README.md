# Hayai Desk 🚀

Painel flutuante de respostas rápidas para atendimento Help Desk.  
Sempre no topo, modo escuro/claro, smart compose com busca inteligente e reordenação por drag & drop.

---

## ⚡ Como gerar o .EXE

### 1. Instale o Node.js
Baixe em: https://nodejs.org — versão recomendada: **LTS (18 ou 20)**

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

1. Crie ou converta sua imagem em `.ico` em: https://icoconvert.com (256×256)
2. Salve como `icon.ico` dentro da pasta `build/`
3. Gere o executável novamente com `npm run build`

---

## 📤 Como distribuir para outras máquinas

**Versão portátil** (recomendado para distribuição rápida):
- Copie `dist/Hayai Desk.exe` para a máquina de destino
- Execute diretamente — sem instalação necessária

**Versão com instalador**:
- Copie `dist/Hayai Desk Setup.exe` para a máquina de destino
- Execute o instalador — cria atalho no Desktop e Menu Iniciar automaticamente

---

## 🔧 Funcionalidades

| Recurso | Descrição |
|---|---|
| Respostas rápidas | Clique num card para copiar a mensagem |
| `{{nome}}` / `{{saudacao}}` | Variáveis substituídas automaticamente |
| Período automático | Detecta manhã/tarde/noite pelo relógio do sistema |
| Smart Compose | Digite palavras-chave e pressione Tab/Enter para autocompletar e copiar |
| Drag & drop | Reordene os cards arrastando pelo ícone de grip |
| 2 colunas | Layout em grade quando há mais de 5 mensagens |
| Modo escuro/claro | Alternável pelo botão na barra de título |
| Sempre no topo | A janela fica sobre todas as outras |

---

## ❓ Problemas comuns

**`npm` não é reconhecido**  
→ Reinstale o Node.js e reinicie o terminal ou o computador.

**Build falhou com erro de ícone**  
→ Certifique-se de que `build/icon.ico` existe, ou remova as linhas `"icon"` do `package.json`.

**Antivírus bloqueou o .exe**  
→ Esperado em executáveis Electron sem assinatura digital. Adicione uma exceção no antivírus ou assine digitalmente o executável.

**Janela abre com altura errada**  
→ Feche e reabra o aplicativo. O redimensionamento automático leva um frame para calcular.
