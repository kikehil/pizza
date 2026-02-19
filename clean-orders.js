const { Client } = require('pg');
require('dotenv').config();

async function cleanDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('--- 🧹 INICIANDO LIMPIEZA DE BASE DE DATOS ---');

        // El orden es importante por las llaves foráneas
        await client.query('DELETE FROM extra_pedidos');
        console.log('✅ Extras de pedidos eliminados.');

        await client.query('DELETE FROM detalle_pedidos');
        console.log('✅ Detalles de pedidos eliminados.');

        await client.query('DELETE FROM pedidos');
        console.log('✅ Tabla de pedidos vaciada.');

        console.log('\n--- ✨ BASE DE DATOS LIMPIA Y LISTA PARA PRODUCCIÓN ---');
    } catch (err) {
        console.error('❌ Error limpiando la base de datos:', err);
    } finally {
        await client.end();
    }
}

cleanDatabase();
