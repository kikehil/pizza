const db = require('./db');

async function run() {
    try {
        console.log('--- Agregando columnas de liquidación a la tabla pedidos ---');
        
        // Agregar columna liquidado (boolean)
        await db.query('ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS liquidado BOOLEAN DEFAULT false');
        
        // Agregar columna liquidado_at (timestamp)
        await db.query('ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS liquidado_at TIMESTAMP');
        
        // Agregar columna liquidado_por (quien hizo el corte)
        await db.query('ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS liquidado_por VARCHAR(100)');
        
        console.log('✅ Migración de liquidación completada con éxito');
    } catch (e) {
        console.error('❌ Error en la migración:', e);
    }
    process.exit(0);
}

run();
