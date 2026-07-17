const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Script para inicializar o banco de dados automaticamente
 * Lê o arquivo schema.sql e executa todos os comandos
 */

async function initializeDatabase() {
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'almoxarifado_db',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
        ssl: false
    });

    let client;

    try {
        // Conectar ao banco
        client = await pool.connect();
        console.log('✅ Conectado ao PostgreSQL');

        // Ler arquivo SQL
        const schemaPath = path.join(__dirname, '..', 'docs', 'schema.sql');
        const sqlContent = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Arquivo schema.sql carregado');

        // Dividir comandos SQL (remover comentários e espaços em branco)
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`\n📝 Executando ${commands.length} comando(s) SQL...\n`);

        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            try {
                await client.query(command);
                console.log(`✓ Comando ${i + 1}/${commands.length} executado com sucesso`);
            } catch (error) {
                console.error(`✗ Erro ao executar comando ${i + 1}:`, error.message);
                throw error;
            }
        }

        console.log('\n🎉 Banco de dados inicializado com sucesso!');
        console.log('✅ Todas as tabelas foram criadas.');

    } catch (error) {
        console.error('\n❌ Erro ao inicializar banco de dados:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.release();
        }
        await pool.end();
    }
}

// Executar inicialização
initializeDatabase();
