DROP TABLE IF EXISTS historico;
DROP TABLE IF EXISTS servicos;
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

CREATE TABLE servicos (
    id                SERIAL PRIMARY KEY,
    funcionario       TEXT NOT NULL,
    descricao_servico TEXT NOT NULL,
    itens_necessarios TEXT DEFAULT '-',
    status            TEXT NOT NULL DEFAULT 'Pendente',
    elapsed_seconds   INTEGER NOT NULL DEFAULT 0,
    is_running        BOOLEAN NOT NULL DEFAULT false,
    started_at        TIMESTAMPTZ,
    motivo_pausa      TEXT,
    pendencia         TEXT,
    data_criacao      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);