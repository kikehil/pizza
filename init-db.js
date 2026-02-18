const db = require('./db');

const initDB = async () => {
    try {
        console.log('--- Iniciando inicialización de Base de Datos ---');

        // 1. Tabla de Productos
        await db.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                precio DECIMAL(10,2) NOT NULL,
                imagen TEXT,
                categoria VARCHAR(100),
                activo BOOLEAN DEFAULT true
            );
        `);

        // 2. Tabla de Pedidos
        await db.query(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(50) UNIQUE,
                cliente_nombre VARCHAR(255) NOT NULL,
                telefono VARCHAR(20) NOT NULL,
                direccion TEXT NOT NULL,
                referencias TEXT,
                total DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pendiente',
                lat DECIMAL(10,8),
                lng DECIMAL(11,8),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Tabla de Detalle Pedidos
        await db.query(`
            CREATE TABLE IF NOT EXISTS detalle_pedidos (
                id SERIAL PRIMARY KEY,
                pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
                pizza_nombre VARCHAR(255) NOT NULL,
                cantidad INTEGER NOT NULL,
                precio_unitario DECIMAL(10,2) NOT NULL
            );
        `);

        // 4. Tabla de Extras Pedidos
        await db.query(`
            CREATE TABLE IF NOT EXISTS extras_pedidos (
                id SERIAL PRIMARY KEY,
                detalle_id INTEGER REFERENCES detalle_pedidos(id) ON DELETE CASCADE,
                extra_nombre VARCHAR(255) NOT NULL,
                precio_extra DECIMAL(10,2) NOT NULL
            );
        `);

        // 5. Insertar productos iniciales si no hay
        const res = await db.query('SELECT COUNT(*) FROM productos');
        if (parseInt(res.rows[0].count) === 0) {
            console.log('Poblando base de datos con productos iniciales...');
            await db.query(`
                INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, activo)
                VALUES 
                ('Pepperoni Especial', 'Doble porción de pepperoni con queso mozzarella premium.', 189, 'https://images.unsplash.com/photo-1628840042765-356cda07504e', 'Clásicas', true),
                ('Mexicana', 'Chorizo, jalapeño, cebolla, frijoles y salsa secreta.', 210, 'https://images.unsplash.com/photo-1593504049359-7b7d92c7185d', 'Especialidades', true),
                ('Hawaiana Premium', 'Jamón glaseado, piña miel y extra queso mozzarella.', 195, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38', 'Clásicas', true);
            `);
        }

        console.log('✅ Base de datos inicializada correctamente');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error inicializando base de datos:', err);
        process.exit(1);
    }
};

initDB();
