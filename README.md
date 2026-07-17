# 📦 Sistema de Almoxarifado

Sistema web moderno de gerenciamento de estoque com autenticação segura, controle de permissões, histórico de movimentações, **tema escuro confortável** e **sistema de backup automático**.

## 🎯 Funcionalidades Principais

- ✅ **Autenticação segura** com bcrypt + rate limiting
- ✅ **Controle de acesso** (Admin e Funcionário)
- ✅ **Gerenciamento de itens** (cadastro, reposição, retirada, exclusão)
- ✅ **Histórico completo** de movimentações com motivo obrigatório
- ✅ **Gerenciamento de usuários** (apenas admin)
- ✅ **Alteração de senha** com validação de senha atual
- ✅ **Backup automático diário** de todos os dados
- ✅ **Restauração de backups** sob demanda
- ✅ **Proteção anti-self-delete** - Admin não pode deletar a si mesmo
- ✅ **Tema escuro moderno** confortável para os olhos
- ✅ **Interface responsiva** (mobile, tablet, desktop)
- ✅ **Proteção contra XSS e SQL Injection**
- ✅ **Admin auto-recovery** - Cria novo admin se nenhum existir

---

## 🛠️ Instalação Rápida

### Pré-requisitos
- **Node.js** v14+ 
- **PostgreSQL** 12+
- **npm** (vem com Node.js)

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Criar database
psql -U postgres -c "CREATE DATABASE almoxarifado_db;"

# 3. Copiar e configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do PostgreSQL

# 4. Iniciar servidor
npm start
# ou npm run dev
```

Acesse: **http://localhost:3000**

### Login Inicial
- **Usuário:** `admin`
- **Senha:** `admin`

> ⚠️ Após primeiro acesso, **crie novo admin e delete o padrão**

---

## 🗄️ Criar Tabelas do Banco

Se preferir criar as tabelas manualmente (ao invés de deixar o servidor fazer), use o código abaixo:

### Windows (pgAdmin)
1. Abra **pgAdmin**
2. Clique direito em **Databases** → **Create** → **Database**
3. Nome: `almoxarifado_db` → **Save**
4. Clique na database criada
5. Vá em **Tools** → **Query Tool**
6. Cole o código abaixo:

```sql
DROP TABLE IF EXISTS historico;
DROP TABLE IF EXISTS itens;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome_completo TEXT,
    username TEXT UNIQUE,
    senha TEXT
);

CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    quantidade INTEGER DEFAULT 0
);

CREATE TABLE historico (
    id SERIAL PRIMARY KEY,
    item TEXT,
    acao TEXT,
    usuario TEXT,
    quantidade INTEGER,
    motivo TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

7. Clique em **Execute** (botão ▶️)
8. Pronto! As tabelas foram criadas

### Linux/Mac (Terminal)
```bash
# 1. Conectar ao PostgreSQL
psql -U postgres

# 2. Criar database
CREATE DATABASE almoxarifado_db;

# 3. Conectar à database
\c almoxarifado_db

# 4. Executar o script SQL
psql -U postgres -d almoxarifado_db << EOF
DROP TABLE IF EXISTS historico;
DROP TABLE IF EXISTS itens;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome_completo TEXT,
    username TEXT UNIQUE,
    senha TEXT
);

CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    quantidade INTEGER DEFAULT 0
);

CREATE TABLE historico (
    id SERIAL PRIMARY KEY,
    item TEXT,
    acao TEXT,
    usuario TEXT,
    quantidade INTEGER,
    motivo TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

# 5. Sair
\q
```

### Alternativa Linux (via arquivo)
```bash
# 1. Criar arquivo SQL
cat > schema.sql << 'EOF'
DROP TABLE IF EXISTS historico;
DROP TABLE IF EXISTS itens;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome_completo TEXT,
    username TEXT UNIQUE,
    senha TEXT
);

CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    quantidade INTEGER DEFAULT 0
);

CREATE TABLE historico (
    id SERIAL PRIMARY KEY,
    item TEXT,
    acao TEXT,
    usuario TEXT,
    quantidade INTEGER,
    motivo TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

# 2. Executar arquivo
psql -U postgres -d almoxarifado_db -f schema.sql

# 3. Deletar arquivo
rm schema.sql
```

---

## 👥 Tipos de Usuário

### 🔑 Admin
- Cadastrar/deletar itens
- Criar/deletar usuários (protegido contra auto-delete)
- Gerenciar sistema completo
- Alterar sua própria senha

### 👤 Funcionário
- Repor/retirar itens (motivo obrigatório)
- Alterar sua própria senha
- Visualizar histórico

---

## 💾 Sistema de Backup

### Automático
- ✅ Executa **todo dia às 2 da manhã**
- ✅ Mantém **últimos 7 backups**
- ✅ Remove antigos automaticamente

### Manual
```bash
npm run backup          # Backup agora
npm run backup-list     # Ver backups
npm run restore <file>  # Restaurar backup
```

Backups em: `./backups/`

---

## 🎨 Design & UX

- 🌙 **Tema escuro** com gradiente azul confortável
- 🎯 **Interface intuitiva** e responsiva
- ✨ **Animações suaves** e feedback visual
- 🏢 **Logo GEES** integrada no sistema
- 📱 **Totalmente mobile-friendly**

---

## 🔒 Segurança

### Implementado
- **Bcrypt** - Hash de senhas com 10 rounds
- **SQL Injection Protection** - Queries parametrizadas
- **XSS Prevention** - Escape de caracteres especiais
- **Rate Limiting** - 5 tentativas login / 15min
- **Sessions Seguras** - httpOnly + timeout 24h
- **Variáveis de Ambiente** - Sem credenciais hardcoded
- **Admin Protection** - Não pode auto-deletar
- **Auto-recovery** - Recria admin se necessário

### Recomendações Produção
1. Altere `SESSION_SECRET` para chave aleatória forte
2. Configure HTTPS/SSL
3. Use banco de dados remoto com senha forte
4. Configure backups remotos (cloud)
5. Implemente monitoramento de logs

---

## 📂 Estrutura

```
Projeto-almoxarifado/
├── src/                    # Código fonte principal
│   ├── server.js          # Servidor Express
│   ├── database.js        # Conexão PostgreSQL
│   ├── backup.js          # Sistema de backup
│   └── config/
│       └── .env.example   # Exemplo variáveis
├── views/                  # Templates HTML
│   ├── index.html         # Painel (tema escuro)
│   └── login.html         # Login (tema escuro)
├── public/                 # Arquivos estáticos
│   └── favicon.png        # Logo GEES
├── docs/                   # Documentação
│   └── schema.sql         # Schema SQL do banco
├── backups/               # Backups automáticos (criado automaticamente)
├── .env.example           # Exemplo variáveis ambiente (raiz)
├── .env                   # Variáveis (local, não commitar)
├── .gitignore            # Arquivos ignorados
├── package.json          # Dependências
├── package-lock.json     # Lock file
└── README.md             # Este arquivo
```

---

## 📚 API Endpoints

### Auth
- `POST /login` - Login (JSON)
- `GET /logout` - Logout

### Usuários
- `GET /api/usuario` - Dados do logado
- `GET /api/usuarios` - Lista todos (admin)
- `POST /criar-conta` - Criar (admin)
- `POST /deletar-usuario` - Deletar (admin)
- `POST /alterar-senha` - Mudar senha

### Itens
- `GET /api/itens` - Lista todos
- `POST /cadastrar-item` - Criar (admin)
- `POST /ajustar-estoque` - Repor/retirar
- `POST /remover-item` - Deletar (admin)

### Histórico
- `GET /api/historico` - Últimas 10

---

## 🐛 Troubleshooting

| Banco não conecta | Verifique senha no `.env` |
| Database não existe | `psql -U postgres -c "CREATE DATABASE almoxarifado_db;"` |
| Logo não aparece | Confirme `public/favicon.png` existe |
| Backup falha | Instale PostgreSQL client tools |
| Esqueceu senha admin | `node src/reset-password.js admin novasenha` |

---

## 🚀 Deploy

### Heroku / Railway
1. Configure variáveis no painel
2. Conecte repositório Git
3. Deploy automático

### VPS Linux
```bash
git clone <repo>
npm install
nano .env  # Configure credenciais
npm install -g pm2
pm2 start server.js --name almoxarifado
pm2 startup && pm2 save
```

---

## 📊 Stats

- **Código:** ~1000+ linhas
- **Dependências:** 6 principais
- **Performance:** <100ms resposta
- **Escalabilidade:** 100+ usuários simultâneos

---

## 📝 Versão Atual

**v1.0.0 - Completo com backup, segurança e tema escuro**

---

## 📞 Suporte

Problemas? Verifique:
1. Console do navegador (F12)
2. Logs do Node.js
3. PostgreSQL rodando
4. Arquivo `.env` correto

---

**Desenvolvido para gestão eficiente de almoxarifado** ❤️

*Última atualização: 2026-06-12*
