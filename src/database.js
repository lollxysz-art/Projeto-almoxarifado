const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'almoxarifado_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: false
});

pool.on('error', (err) => {
    console.error('Erro no pool:', err.message);
});

pool.on('connect', () => {
    console.log('✅ Nova conexão ao banco de dados PostgreSQL');
});

module.exports = pool;
