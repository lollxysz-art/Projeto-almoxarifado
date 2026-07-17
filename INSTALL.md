# 🚀 Guia de Instalação - Sistema de Almoxarifado

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 14+): [Baixar](https://nodejs.org/)
- **PostgreSQL** (versão 12+): [Baixar](https://www.postgresql.org/download/)

## 📋 Passos de Instalação

### 1️⃣ Clonar o repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd Projeto-almoxarifado
```

### 2️⃣ Instalar dependências

```bash
npm install
```

### 3️⃣ Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com suas credenciais do PostgreSQL:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=almoxarifado_db
DB_PASSWORD=sua_senha_aqui
DB_PORT=5432
```

> ⚠️ **Nota**: Se você não tem um banco de dados criado ainda, crie ele primeiro no PostgreSQL:
> ```sql
> CREATE DATABASE almoxarifado_db;
> ```

### 4️⃣ Inicializar o banco de dados automaticamente

Execute o script de inicialização (cria todas as tabelas automaticamente):

```bash
npm run init-db
```

Você verá um output assim:
```
✅ Conectado ao PostgreSQL
📄 Arquivo schema.sql carregado

📝 Executando 4 comando(s) SQL...

✓ Comando 1/4 executado com sucesso
✓ Comando 2/4 executado com sucesso
✓ Comando 3/4 executado com sucesso
✓ Comando 4/4 executado com sucesso

🎉 Banco de dados inicializado com sucesso!
✅ Todas as tabelas foram criadas.
```

### 5️⃣ Iniciar a aplicação

```bash
npm start
```

A aplicação estará rodando em: `http://localhost:3000`

---

## 📝 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor da aplicação |
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run init-db` | Inicializa o banco de dados (cria tabelas) |
| `npm run backup` | Cria backup do banco de dados |
| `npm run restore` | Restaura backup anterior |
| `npm run backup-list` | Lista todos os backups disponíveis |

---

## 🔧 Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# Banco de Dados
DB_USER=postgres               # Usuário do PostgreSQL
DB_HOST=localhost              # Host do servidor
DB_NAME=almoxarifado_db        # Nome do banco
DB_PASSWORD=seu_password       # Senha do PostgreSQL
DB_PORT=5432                   # Porta do PostgreSQL
```

---

## ✅ Verificação de Instalação

Depois de seguir todos os passos, você pode verificar se está funcionando:

1. ✓ Arquivo `.env` criado com credenciais corretas
2. ✓ `npm install` executado sem erros
3. ✓ `npm run init-db` executado com sucesso
4. ✓ `npm start` iniciou o servidor
5. ✓ Consegue acessar `http://localhost:3000`

---

## ❌ Solução de Problemas

### Erro: "ECONNREFUSED" ao executar `init-db`
- **Causa**: PostgreSQL não está rodando
- **Solução**: Inicie o serviço PostgreSQL e tente novamente

### Erro: "database does not exist"
- **Causa**: O banco de dados não foi criado
- **Solução**: Execute em um cliente PostgreSQL (pgAdmin ou psql):
  ```sql
  CREATE DATABASE almoxarifado_db;
  ```

### Erro: "role does not exist"
- **Causa**: O usuário PostgreSQL não existe
- **Solução**: Verifique o nome de usuário no `.env` e ajuste conforme seu PostgreSQL

### Erro: "permission denied"
- **Causa**: Permissões insuficientes
- **Solução**: Verifique a senha no `.env` ou restaure privilégios do usuário PostgreSQL

---

## 📚 Mais Informações

- Documentação do banco: [docs/schema.sql](docs/schema.sql)
- Arquivo de configuração: [.env.example](.env.example)

**Precisa de ajuda?** Entre em contato com o desenvolvedor!
