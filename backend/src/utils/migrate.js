/**
 * Auto-Migração do Banco de Dados
 * Executa migrations.sql e seed.sql automaticamente no startup,
 * apenas se as tabelas ainda não existirem.
 */

const path = require('path');
const fs = require('fs');
const db = require('../config/db');

async function runMigration() {
    const conn = await db.getConnection();
    try {
        // ── Verifica se a tabela 'settings' (última criada) já existe ──────────
        const [tables] = await conn.execute(`
            SELECT COUNT(*) AS total
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = 'settings'
        `);

        const alreadyMigrated = tables[0].total > 0;

        if (alreadyMigrated) {
            console.log('✅ [migrate] Banco já migrado. Pulando migrations.sql');
        } else {
            console.log('⚙️  [migrate] Tabelas não encontradas. Executando migrations.sql...');
            await runSQLFile(conn, path.join(__dirname, '../../database/migrations.sql'));
            console.log('✅ [migrate] migrations.sql executado com sucesso!');
        }

        // ── Verifica se o admin já existe antes de rodar o seed ──────────────
        const [users] = await conn.execute(
            `SELECT COUNT(*) AS total FROM users WHERE role = 'admin' LIMIT 1`
        );

        const adminExists = users[0].total > 0;

        if (adminExists) {
            console.log('✅ [migrate] Admin já existe. Pulando seed.sql');
        } else {
            console.log('⚙️  [migrate] Nenhum admin encontrado. Executando seed.sql...');
            await runSQLFile(conn, path.join(__dirname, '../../database/seed.sql'));
            console.log('✅ [migrate] seed.sql executado com sucesso!');
        }

    } catch (err) {
        console.error('❌ [migrate] Erro durante a migração:', err.message);
        // Não interrompe o servidor — permite diagnóstico posterior
    } finally {
        conn.release();
    }
}

/**
 * Lê um arquivo .sql e executa statement por statement.
 * Suporta múltiplos statements separados por ';'.
 */
async function runSQLFile(conn, filePath) {
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Remove comentários de linha e divide por ';'
    const statements = sql
        .replace(/--.*$/gm, '')       // remove comentários --
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove comentários /* */
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        await conn.execute(statement);
    }
}

module.exports = { runMigration };
