const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DB_NAME = process.env.DB_NAME || 'almoxarifado_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_PASSWORD = process.env.DB_PASSWORD;

function localizarComandoPostgres(comando) {
    const variavel = comando === 'pg_dump' ? 'PG_DUMP_PATH' : 'PSQL_PATH';
    const caminhoConfigurado = process.env[variavel];
    if (caminhoConfigurado) {
        return caminhoConfigurado;
    }

    const diretorioConfigurado = process.env.PG_BIN_DIR;
    if (diretorioConfigurado) {
        return path.join(diretorioConfigurado, `${comando}.exe`);
    }

    if (process.platform === 'win32') {
        const diretorioPostgres = path.join('C:', 'Program Files', 'PostgreSQL');
        if (fs.existsSync(diretorioPostgres)) {
            const versoes = fs.readdirSync(diretorioPostgres, { withFileTypes: true })
                .filter(item => item.isDirectory())
                .map(item => item.name)
                .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

            for (const versao of versoes) {
                const executavel = path.join(diretorioPostgres, versao, 'bin', `${comando}.exe`);
                if (fs.existsSync(executavel)) {
                    return executavel;
                }
            }
        }
    }

    return comando;
}

const execOptions = {
    env: { ...process.env, ...(DB_PASSWORD ? { PGPASSWORD: DB_PASSWORD } : {}) }
};

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Pasta de backups criada');
}

function criarBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const pgDump = localizarComandoPostgres('pg_dump');
    const command = `"${pgDump}" -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} > "${filepath}"`;

    exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            console.error('❌ Erro ao criar backup:', error.message);
            return;
        }
        console.log(`✅ Backup criado: ${filename}`);
        limparBackupsAntigos();
    });
}

function limparBackupsAntigos() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
        .map(f => ({
            name: f,
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    const manter = 7;
    if (files.length > manter) {
        files.slice(manter).forEach(f => {
            fs.unlinkSync(path.join(BACKUP_DIR, f.name));
            console.log(`🗑️  Backup antigo removido: ${f.name}`);
        });
    }
}

function restaurarBackup(filename) {
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
        console.error('❌ Arquivo de backup não encontrado:', filename);
        return;
    }

    const psql = localizarComandoPostgres('psql');
    const command = `"${psql}" -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} < "${filepath}"`;

    exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Erro ao restaurar backup:', error.message);
            return;
        }
        console.log(`✅ Backup restaurado: ${filename}`);
    });
}

function listarBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
        .sort()
        .reverse();

    console.log('\n📋 Backups disponíveis:');
    files.forEach((f, i) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        const size = (stats.size / 1024).toFixed(2);
        const date = stats.mtime.toLocaleString('pt-BR');
        console.log(`  ${i + 1}. ${f} (${size} KB) - ${date}`);
    });
    console.log('');
}

if (require.main === module) {
    const command = process.argv[2];

    if (command === 'backup') {
        criarBackup();
    } else if (command === 'restore') {
        const filename = process.argv[3];
        if (!filename) {
            console.error('❌ Especifique o arquivo: npm run restore <filename>');
            listarBackups();
        } else {
            restaurarBackup(filename);
        }
    } else if (command === 'list') {
        listarBackups();
    } else {
        console.log(`
🔄 Comandos de Backup:
  npm run backup          - Criar backup agora
  npm run restore <file>  - Restaurar backup
  npm run backup-list     - Listar backups
        `);
    }
}

module.exports = { criarBackup };
