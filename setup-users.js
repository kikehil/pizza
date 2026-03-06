const db = require('./db');
const bcrypt = require('bcryptjs');

const setupUsers = async () => {
    try {
        console.log('--- Creando tabla de usuarios ---');

        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL, -- admin, cocina, repartidor
                nombre_completo VARCHAR(255),
                activo BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insertar usuarios base si no existen
        const adminPass = await bcrypt.hash(process.env.ADMIN_PASS || 'CapriccioAdmin2026!', 10);
        const cocinaPass = await bcrypt.hash(process.env.COCINA_PASS || 'CocinaCap2026!', 10);
        const repartidorPass = await bcrypt.hash(process.env.REP_PASS || 'Repartidor2026!', 10);

        // Admin
        await db.query(`
            INSERT INTO usuarios (username, password, role, nombre_completo)
            VALUES ('admin', $1, 'admin', 'Administrador General')
            ON CONFLICT (username) DO NOTHING
        `, [adminPass]);

        // Cocina
        await db.query(`
            INSERT INTO usuarios (username, password, role, nombre_completo)
            VALUES ('cocina', $1, 'cocina', 'Personal de Cocina')
            ON CONFLICT (username) DO NOTHING
        `, [cocinaPass]);

        // Repartidor Demo
        await db.query(`
            INSERT INTO usuarios (username, password, role, nombre_completo)
            VALUES ('repartidor1', $1, 'repartidor', 'Juan Repartidor')
            ON CONFLICT (username) DO NOTHING
        `, [repartidorPass]);

        console.log('✅ Tabla de usuarios configurada correctamente');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error configurando usuarios:', err);
        process.exit(1);
    }
};

setupUsers();
