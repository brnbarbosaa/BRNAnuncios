require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brn_anuncios',
  timezone: '-03:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: false,
});

// Testar conexão na inicialização
pool.getConnection()
  .then(conn => {
    console.log('[DB] ✅ Conectado ao MySQL com sucesso');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] ❌ Erro ao conectar ao MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
