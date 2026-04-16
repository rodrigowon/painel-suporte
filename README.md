# Painel Suporte — Help Desk 🚀

Painel flutuante de mensagens rápidas para atendimento.

---

## ⚡ Como gerar o .EXE

### 1. Instale o Node.js (se não tiver)
Baixe em: https://nodejs.org  
Versão recomendada: **LTS (18 ou 20)**

### 2. Abra o terminal na pasta do projeto
Clique com botão direito na pasta `painel-suporte` → "Abrir no Terminal"  
(ou no VS Code: terminal integrado)

### 3. Instale as dependências
```bash
npm install
```
Aguarde baixar (~200MB na primeira vez — é o Electron)

### 4. Teste antes de empacotar
```bash
npm start
```
O painel vai abrir. Se estiver tudo certo, feche e siga.

### 5. Gere o .EXE portátil (sem instalador — só copiar e rodar)
```bash
npm run build
```
O arquivo `.exe` ficará em: `dist/Painel Suporte*.exe`

### 6. (Opcional) Gere com instalador
```bash
npm run build:installer
```
Gera um instalador que cria atalho no Desktop e Menu Iniciar.

---

## 📁 Estrutura dos arquivos
```
painel-suporte/
├── index.html     ← Interface (HTML/CSS/JS)
├── main.js        ← Electron (cria a janela)
├── package.json   ← Configurações e dependências
├── icon.ico       ← Ícone (opcional — coloque aqui)
└── README.md      ← Este arquivo
```

---

## 🎨 Como personalizar o ícone
1. Crie ou baixe um `.ico` (ex: https://icoconvert.com)
2. Salve como `icon.ico` na pasta do projeto
3. Gere o .exe novamente com `npm run build`

---

## 📤 Como enviar para outras máquinas

**Versão portátil** (recomendado):
- Copie o `Painel Suporte*.exe` da pasta `dist/`
- Cole na máquina de destino — sem instalar nada, só dar dois cliques

**Versão instalador**:
- Copie o `Painel Suporte Setup*.exe` da pasta `dist/`
- Execute na máquina de destino — instala com atalho no Desktop

---

## 🔧 Dicas
- O painel fica **sempre no topo** de outras janelas
- Mensagens, nome e configurações ficam **salvos localmente**
- Use `{{nome}}` e `{{saudacao}}` nas mensagens para personalizar

---

## ❓ Problemas comuns

**"npm não é reconhecido"**  
→ Reinstale o Node.js e reinicie o terminal

**Build falhou com erro de ícone**  
→ Delete a linha `"icon": "icon.ico"` do package.json ou crie o arquivo icon.ico

**Antivírus bloqueou o .exe**  
→ Normal com executáveis Electron sem assinatura digital. Adicione exceção no antivírus.
