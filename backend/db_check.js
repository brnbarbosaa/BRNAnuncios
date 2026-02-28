const mysql = require('mysql2/promise');

async function check() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'brn_anuncios',
    });
    try {
        const [rows] = await conn.execute("SHOW COLUMNS FROM businesses LIKE 'category_observation'");
        console.log("businesses table has category_observation:", rows.length > 0);

        const [reqRows] = await conn.execute("SHOW COLUMNS FROM requests LIKE 'category_observation'");
        console.log("requests table has category_observation:", reqRows.length > 0);
    } catch (e) {
        console.error(e);
    }
    await conn.end();
}
check();
