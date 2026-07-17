const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = express();
const db = require('./database');
const { criarBackup } = require('./backup');
const { calcularTempoDecorrido } = require('./timerUtils');

const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Muitas requisições, tente novamente mais tarde."
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Muitas tentativas de login. Aguarde 15 minutos."
});

app.use(limiter);

app.use(session({
    secret: process.env.SESSION_SECRET || 'chave_secreta_padrao_desenvolvimento',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const verificarLogin = (req, res, next) => {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
};

const verificarAdmin = (req, res, next) => {
    if (req.session.usuario && req.session.usuario.isAdmin) {
        next();
    } else {
        res.status(403).send("Acesso negado.");
    }
};

console.log("Senha chegando na rota de cadastro:", process.env.DB_PASSWORD);

async function garantirColunasServicos() {
    const queries = [
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS elapsed_seconds INTEGER NOT NULL DEFAULT 0;`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS is_running BOOLEAN NOT NULL DEFAULT false;`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS horario_inicio TIMESTAMPTZ;`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS motivo_pausa TEXT;`,
        `ALTER TABLE servicos ADD COLUMN IF NOT EXISTS pendencia TEXT;`
    ];

    for (const query of queries) {
        try {
            await db.query(query);
        } catch (error) {
            console.error('Erro ao garantir coluna de serviço:', error.message);
        }
    }
}

async function inicializarAdmin() {
    try {
        await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`);
        const result = await db.query('SELECT * FROM usuarios WHERE is_admin = true');
        if (result.rows.length === 0) {
            const senhaCriptografada = await bcrypt.hash('admin', 10);
            await db.query(
                'INSERT INTO usuarios (nome_completo, username, senha, is_admin) VALUES ($1, $2, $3, $4)',
                ['Administrador Padrão', 'admin', senhaCriptografada, true]
            );
        }
    } catch (e) {
        console.error(e);
    }
}

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

app.get('/', verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

app.get('/painel', verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

app.get('/servicos', verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'servicos.html'));
});

app.post('/login', loginLimiter, async (req, res) => {
    const { username, senha } = req.body;
    if (!username || !senha) return res.status(400).json({ erro: "Campos obrigatórios." });

    try {
        const result = await db.query('SELECT * FROM usuarios WHERE username = $1', [username.trim().toLowerCase()]);
        if (result.rows.length > 0) {
            const usuario = result.rows[0];
            const senhaValida = await bcrypt.compare(senha.trim(), usuario.senha);
            if (senhaValida) {
                req.session.usuario = {
                    id: usuario.id,
                    nome: usuario.nome_completo,
                    isAdmin: usuario.is_admin
                };
                return res.json({ sucesso: true });
            }
        }
        res.status(401).json({ erro: "Usuário ou senha incorretos!" });
    } catch (error) {
        res.status(500).json({ erro: "Erro interno." });
    }
});

app.post('/criar-conta', verificarLogin, verificarAdmin, async (req, res) => {
    const { nome, username, senha, isAdmin } = req.body;
    const virarAdmin = isAdmin === 'true' || isAdmin === true;
    
    if (!nome || !username || !senha) return res.status(400).send("Dados incompletos.");

    try {
        const senhaCriptografada = await bcrypt.hash(senha.trim(), 10);
        await db.query('INSERT INTO usuarios (nome_completo, username, senha, is_admin) VALUES ($1, $2, $3, $4)', 
            [nome.trim(), username.trim().toLowerCase(), senhaCriptografada, virarAdmin]);
        res.sendStatus(201);
    } catch (e) {
        res.status(400).send("Erro ao criar conta.");
    }
});

app.post('/alterar-senha', verificarLogin, async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    const usuarioId = req.session.usuario.id;

    if (!senhaAtual || !novaSenha || senhaAtual.trim() === "" || novaSenha.trim() === "") {
        return res.status(400).send("Campos obrigatórios.");
    }

    try {
        const userRes = await db.query('SELECT senha FROM usuarios WHERE id = $1', [usuarioId]);
        if (userRes.rows.length > 0) {
            const usuario = userRes.rows[0];
            const senhaValida = await bcrypt.compare(senhaAtual.trim(), usuario.senha);
            if (!senhaValida) return res.status(400).send("Senha incorreta.");

            const novaSenhaCriptografada = await bcrypt.hash(novaSenha.trim(), 10);
            await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novaSenhaCriptografada, usuarioId]);
            res.sendStatus(200);
        } else {
            res.status(404).send("Usuário não encontrado.");
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post('/ajustar-estoque', verificarLogin, async (req, res) => {
    const { id, quantidade, acao, motivo } = req.body;
    let qtd = parseInt(quantidade);
    const userNome = req.session.usuario.nome;
    
    if (isNaN(qtd) || qtd <= 0 || !motivo || motivo.trim() === "") return res.status(400).send("Dados inválidos.");
    
    try {
        const itemRes = await db.query('SELECT nome, quantidade FROM itens WHERE id = $1', [id]);
        if (itemRes.rows.length > 0) {
            const item = itemRes.rows[0];
            if (acao === 'retirada' && qtd > item.quantidade) qtd = item.quantidade;
            if (qtd <= 0 && acao === 'retirada') return res.sendStatus(200);

            const val = acao === 'retirada' ? -qtd : qtd;
            await db.query('UPDATE itens SET quantidade = quantidade + $1 WHERE id = $2', [val, id]);
            await db.query('INSERT INTO historico (item, acao, usuario, quantidade, motivo) VALUES ($1, $2, $3, $4, $5)', 
                [item.nome, acao === 'retirada' ? 'RETIRADA' : 'REPOSIÇÃO', userNome, qtd, motivo.trim()]);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post('/cadastrar-item', verificarLogin, verificarAdmin, async (req, res) => {
    const { nome, qtd } = req.body;
    const qtdNum = parseInt(qtd);

    if (!nome || nome.trim() === "" || isNaN(qtdNum) || qtdNum <= 0) return res.status(400).send("Dados inválidos.");

    try {
        await db.query('INSERT INTO itens (nome, quantidade) VALUES ($1, $2)', [nome.trim(), qtdNum]);
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post('/remover-item', verificarLogin, verificarAdmin, async (req, res) => {
    const { id, motivo } = req.body;
    const userNome = req.session.usuario.nome;

    if (!motivo || motivo.trim() === "") return res.status(400).send("Motivo obrigatório.");

    try {
        const itemRes = await db.query('SELECT nome, quantidade FROM itens WHERE id = $1', [id]);
        if (itemRes.rows.length > 0) {
            const item = itemRes.rows[0];
            await db.query('DELETE FROM itens WHERE id = $1', [id]);
            await db.query('INSERT INTO historico (item, acao, usuario, quantidade, motivo) VALUES ($1, $2, $3, $4, $5)', 
                [item.nome, 'EXCLUSÃO', userNome, item.quantidade, `Removido. Motivo: ${motivo.trim()}`]);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.get('/api/servicos', verificarLogin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM servicos ORDER BY id DESC');
        const servicos = result.rows.map((servico) => ({
            ...servico,
            elapsed_seconds: parseInt(servico.elapsed_seconds || 0, 10),
            is_running: Boolean(servico.is_running),
            horario_inicio: servico.horario_inicio || servico.started_at || null
        }));
        res.json(servicos);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post('/cadastrar-servico', verificarLogin, async (req, res) => {
    const { funcionario, descricao_servico, itens_necessarios } = req.body;
    if (!funcionario || !descricao_servico || !itens_necessarios) {
        return res.status(400).send("Dados incompletos.");
    }
    try {
        await db.query(
            'INSERT INTO servicos (funcionario, descricao_servico, itens_necessarios, status) VALUES ($1, $2, $3, $4)',
            [funcionario.trim(), descricao_servico.trim(), itens_necessarios.trim(), 'Pendente']
        );
        res.sendStatus(201);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post('/api/servicos/:id/iniciar', verificarLogin, async (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).send('ID obrigatório.');

    try {
        const servicoRes = await db.query('SELECT funcionario FROM servicos WHERE id = $1', [id]);
        if (servicoRes.rows.length === 0) return res.status(404).send('Serviço não encontrado.');

        const servico = servicoRes.rows[0];
        const podeGerenciar = servico.funcionario === req.session.usuario.nome || req.session.usuario.isAdmin;
        if (!podeGerenciar) return res.status(403).send('Acesso negado.');

        await db.query(
            `UPDATE servicos
             SET is_running = true,
                 horario_inicio = NOW(),
                 started_at = NOW(),
                 motivo_pausa = NULL
             WHERE id = $1`,
            [id]
        );
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post('/api/servicos/:id/pausar', verificarLogin, async (req, res) => {
    const id = Number(req.params.id);
    const { motivo } = req.body;
    if (!id) return res.status(400).send('ID obrigatório.');

    try {
        const servicoRes = await db.query('SELECT funcionario, elapsed_seconds, horario_inicio, started_at, is_running FROM servicos WHERE id = $1', [id]);
        if (servicoRes.rows.length === 0) return res.status(404).send('Serviço não encontrado.');

        const servico = servicoRes.rows[0];
        const podeGerenciar = servico.funcionario === req.session.usuario.nome || req.session.usuario.isAdmin;
        if (!podeGerenciar) return res.status(403).send('Acesso negado.');

        if (servico.is_running) {
            const inicio = servico.horario_inicio || servico.started_at;
            const diffSeconds = inicio
                ? Math.max(0, Math.floor((Date.now() - new Date(inicio).getTime()) / 1000))
                : 0;

            await db.query(
                `UPDATE servicos
                 SET elapsed_seconds = elapsed_seconds + $1,
                     is_running = false,
                     horario_inicio = NULL,
                     started_at = NULL,
                     motivo_pausa = $2
                 WHERE id = $3`,
                [diffSeconds, motivo || 'Pausa não justificada', id]
            );
        }

        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.post('/api/finalizar-servico', verificarLogin, async (req, res) => {
    const { id, pendencia } = req.body;
    if (!id) return res.status(400).send('ID obrigatório.');
    try {
        const servicoRes = await db.query('SELECT funcionario, elapsed_seconds, horario_inicio, started_at, is_running FROM servicos WHERE id = $1', [id]);
        if (servicoRes.rows.length === 0) return res.status(404).send('Serviço não encontrado.');

        const servico = servicoRes.rows[0];
        const podeGerenciar = servico.funcionario === req.session.usuario.nome || req.session.usuario.isAdmin;
        if (!podeGerenciar) return res.status(403).send('Acesso negado.');

        let elapsedSeconds = parseInt(servico.elapsed_seconds || 0, 10);
        if (servico.is_running) {
            const inicio = servico.horario_inicio || servico.started_at;
            const diffSeconds = inicio
                ? Math.max(0, Math.floor((Date.now() - new Date(inicio).getTime()) / 1000))
                : 0;
            elapsedSeconds += diffSeconds;
        }

        await db.query(
            `UPDATE servicos
             SET elapsed_seconds = $1,
                 is_running = false,
                 horario_inicio = NULL,
                 started_at = NULL,
                 pendencia = $2,
                 status = 'Finalizado'
             WHERE id = $3`,
            [elapsedSeconds, pendencia || null, id]
        );
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

app.get('/api/usuario', verificarLogin, (req, res) => {
    res.json({ nome: req.session.usuario.nome, isAdmin: req.session.usuario.isAdmin });
});

app.get('/api/itens', verificarLogin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM itens ORDER BY id DESC');
        res.json(result.rows);
    } catch (e) { res.sendStatus(500); }
});

app.get('/api/historico', verificarLogin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM historico ORDER BY id DESC LIMIT 10');
        res.json(result.rows);
    } catch (e) { res.sendStatus(500); }
});

app.get('/api/usuarios', verificarLogin, verificarAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nome_completo, username, is_admin FROM usuarios ORDER BY id DESC');
        res.json(result.rows);
    } catch (e) { res.sendStatus(500); }
});

app.post('/deletar-usuario', verificarLogin, verificarAdmin, async (req, res) => {
    const { id } = req.body;
    const adminLogado = req.session.usuario.id;

    if (!id) return res.status(400).send("ID do usuário obrigatório.");

    if (parseInt(id) === adminLogado) {
        return res.status(403).json({ erro: "Você não pode deletar sua própria conta!" });
    }

    try {
        const userRes = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).send("Usuário não encontrado.");

        await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

app.listen(PORT, async () => {
    await garantirColunasServicos();
    await inicializarAdmin();
    console.log(`Servidor operacional na porta ${PORT}`);

    const agendaBackup = () => {
        const agora = new Date();
        const proximoBackup = new Date();
        proximoBackup.setHours(2, 0, 0, 0);

        if (agora > proximoBackup) {
            proximoBackup.setDate(proximoBackup.getDate() + 1);
        }

        const delayMs = proximoBackup.getTime() - agora.getTime();
        setTimeout(() => {
            criarBackup();
            agendaBackup();
        }, delayMs);

        const prox = proximoBackup.toLocaleString('pt-BR');
        console.log(`📅 Próximo backup agendado para: ${prox}`);
    };

    agendaBackup();
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor...');
    await db.end();
    console.log('✅ Conexões encerradas');
    process.exit(0);
});


// test