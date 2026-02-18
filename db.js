require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Error in PostgreSQL client', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getTransaction: async () => {
        const client = await pool.connect();
        return {
            client,
            release: () => client.release(),
            begin: () => client.query('BEGIN'),
            commit: () => client.query('COMMIT'),
            rollback: () => client.query('ROLLBACK')
        };
    },
    pool
};
