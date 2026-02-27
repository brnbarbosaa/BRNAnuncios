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
        const devEmail = process.env.DEV_USER || 'admin@brnanuncios.com.br';
        const devPass = process.env.DEV_PASS || 'admin123';
        const devName = process.env.DEV_NAME || 'Administrador';

        const [users] = await conn.execute(
            `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
        );

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(devPass, 12);

        if (users.length === 0) {
            console.log(`⚙️  [migrate] Nenhum admin. Criando admin: ${devEmail}`);
            await runSQLFile(conn, path.join(__dirname, '../../database/seed.sql'));
            await conn.execute(
                `UPDATE users SET name = ?, email = ?, password_hash = ? WHERE role = 'admin' LIMIT 1`,
                [devName, devEmail, hash]
            );
            console.log(`✅ [migrate] Admin criado: ${devEmail}`);
        } else {
            await conn.execute(
                `UPDATE users SET name = ?, email = ?, password_hash = ? WHERE role = 'admin' LIMIT 1`,
                [devName, devEmail, hash]
            );
            console.log(`✅ [migrate] Admin atualizado com credenciais das env vars: ${devEmail}`);
        }

        // ── Cria tabela de planos se não existir ─────────────────────────────
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS plans (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(120) NOT NULL UNIQUE,
                description TEXT DEFAULT NULL,
                price DECIMAL(10,2) DEFAULT 0.00,
                features JSON DEFAULT NULL,
                highlight TINYINT(1) DEFAULT 0,
                active TINYINT(1) DEFAULT 1,
                sort_order INT UNSIGNED DEFAULT 0,
                contact_link VARCHAR(255) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Seed dos planos iniciais (só se tabela estiver vazia)
        const [[{ planCount }]] = await conn.execute('SELECT COUNT(*) AS planCount FROM plans');
        if (planCount === 0) {
            console.log('⚙️  [migrate] Criando planos iniciais...');
            await conn.execute(`
                INSERT INTO plans (name, slug, description, price, features, highlight, sort_order, contact_link) VALUES
                ('Gratuito', 'gratuito', 'Ideal para começar! Cadastre seu negócio gratuitamente.', 0.00, '[]', 0, 1, NULL),
                ('Básico', 'basico', 'Mais visibilidade com galeria de fotos e destaque nos cards.', 49.90, '["gallery"]', 0, 2, NULL),
                ('Premium', 'premium', 'Experiência completa: galeria, mapa, redes sociais ilimitadas e destaque no carrossel.', 99.90, '["gallery","maps","social_extended","highlights"]', 1, 3, NULL)
            `);
            console.log('✅ [migrate] Planos iniciais criados.');
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
