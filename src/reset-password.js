#!/usr/bin/env node
/**
 * Script para resetar senha de admin
 * Uso: node src/reset-password.js <username> <nova_senha>
 * Exemplo: node src/reset-password.js admin minhasenha123
 */

const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('./database');

const args = process.argv.slice(2);

if (args.length < 2) {
    console.log(`
❌ Uso incorreto!

Sintaxe: node src/reset-password.js <username> <nova_senha>

Exemplo:
  node src/reset-password.js admin minhasenha123
  node src/reset-password.js gerente senha@segura!

⚠️ AVISO: Este script é para emergências. Use com segurança!
    `);
    process.exit(1);
}

const [username, novaSenha] = args;

if (novaSenha.length < 6) {
    console.log('❌ Senha deve ter pelo menos 6 caracteres!');
    process.exit(1);
}

(async () => {
    try {
        console.log(`🔄 Resetando senha para: ${username}`);

        // Verificar se usuário existe
        const userRes = await db.query('SELECT id FROM usuarios WHERE username = $1', [username.toLowerCase()]);

        if (userRes.rows.length === 0) {
            console.log(`❌ Usuário "${username}" não encontrado!`);
            process.exit(1);
        }

        // Hash da nova senha
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

        // Atualizar no banco
        await db.query(
            'UPDATE usuarios SET senha = $1 WHERE username = $2',
            [novaSenhaHash, username.toLowerCase()]
        );

        console.log(`✅ Senha resetada com sucesso!`);
        console.log(`
📝 Dados de login:
  Usuário: ${username}
  Senha: ${novaSenha}

⚠️ Recomendações:
  1. Faça login e altere a senha no painel
  2. Delete este arquivo após usar
  3. Nunca compartilhe este script
        `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
})();
