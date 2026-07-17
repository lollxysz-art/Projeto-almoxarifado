# 📌 Guia: Como Atualizar no GitHub

## Se você JÁ tem um repositório GitHub criado:

### 1️⃣ Verificar status do Git
```bash
git status
```

### 2️⃣ Adicionar todos os arquivos novos
```bash
git add .
```

### 3️⃣ Criar um commit com mensagem descritiva
```bash
git commit -m "feat: script automático de inicialização de banco de dados"
```

### 4️⃣ Enviar para GitHub
```bash
git push origin main
```
(ou `git push origin master` se sua branch principal for `master`)

---

## Se você AINDA NÃO tem repositório GitHub:

### 1️⃣ Criar repositório no GitHub
- Acesse [github.com](https://github.com)
- Clique em **"New repository"**
- Dê um nome (ex: `projeto-almoxarifado`)
- Escolha **Private** (se quiser que seja privado)
- Não inicialize com README (já temos um)
- Clique em **"Create repository"**

### 2️⃣ Conectar seu repositório local
```bash
git remote add origin https://github.com/SEU_USUARIO/projeto-almoxarifado.git
git branch -M main
git push -u origin main
```

---

## ✅ Arquivos que serão atualizados no GitHub:

- ✅ `src/init-db.js` - Script novo de inicialização
- ✅ `package.json` - Com o comando `npm run init-db`
- ✅ `INSTALL.md` - Guia de instalação para o cliente
- ✅ `.env.example` - Já tem (dados fictícios para referência)

---

## 🔐 Importante: O que NÃO enviar para GitHub

- ❌ `.env` - Arquivo com senhas reais (use `.env.example` para template)
- ❌ `node_modules/` - Já está no `.gitignore`
- ❌ `backups/` - Pastas de backup (já está no `.gitignore`)

---

## Próximos passos para compartilhar com o cliente:

1. Envie o repositório GitHub para o cliente
2. Ele clona: `git clone https://github.com/seu_usuario/projeto-almoxarifado.git`
3. Ele segue o guia em `INSTALL.md`
4. Pronto! Banco de dados automático! 🎉
