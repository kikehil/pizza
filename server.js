require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'pizza-cerebro-super-secret-2026';

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    // Autenticación simple para demo
    if (username === 'admin' && password === 'pizza2026') {
        const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Credenciales inválidas' });
});

// --- API PRODUCTOS (CRUD) ---
app.get('/api/productos', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/productos', authenticateJWT, async (req, res) => {
    const { nombre, descripcion, precio, imagen, categoria, activo } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO productos (nombre, descripcion, precio, imagen, categoria, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nombre, descripcion, precio, imagen, categoria, activo]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/productos/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const fields = req.body;
    const setClause = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(fields), id];

    try {
        const result = await db.query(
            `UPDATE productos SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        // Notificar a clientes del cambio en el menú
        const allProducts = await db.query('SELECT * FROM productos ORDER BY id ASC');
        io.emit('menu_actualizado', allProducts.rows);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API PEDIDOS (TRANSACCIONAL) ---
app.post('/api/pedidos', async (req, res) => {
    const { id: orderId, cliente_nombre, telefono, direccion, referencias, total, items, lat, lng } = req.body;
    const connection = await db.getTransaction();

    try {
        await connection.begin();

        // 1. Insertar en tabla pedidos
        const pedidoRes = await connection.client.query(
            `INSERT INTO pedidos (order_id, cliente_nombre, telefono, direccion, referencias, total, lat, lng) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [orderId, cliente_nombre, telefono, direccion, referencias, total, lat, lng]
        );
        const pedidoId = pedidoRes.rows[0].id;

        // 2. Insertar items y extras
        for (const item of items) {
            const itemRes = await connection.client.query(
                `INSERT INTO detalle_pedidos (pedido_id, pizza_nombre, cantidad, precio_unitario) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [pedidoId, item.nombre, item.quantity, item.totalItemPrice]
            );
            const detailId = itemRes.rows[0].id;

            if (item.extras && item.extras.length > 0) {
                for (const extra of item.extras) {
                    await connection.client.query(
                        `INSERT INTO extras_pedidos (detalle_id, extra_nombre, precio_extra) 
                         VALUES ($1, $2, $3)`,
                        [detailId, extra.nombre, extra.precio]
                    );
                }
            }
        }

        await connection.commit();

        const pedidoCompleto = { ...req.body, db_id: pedidoId, status: 'pendiente' };
        console.log(`🚀 Pedido ${orderId} procesado exitosamente en Postgres.`);

        // Emitir a Cocina y Admin
        io.emit('nuevo_pedido', pedidoCompleto);

        res.status(201).json({ success: true, id: pedidoId });
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error en transacción de pedido:', err);
        res.status(500).json({ error: 'Fallo al procesar pedido en DB' });
    } finally {
        connection.release();
    }
});

app.patch('/api/pedidos/:id/status', async (req, res) => {
    const { id } = req.params; // order_id string
    const { status } = req.body;

    try {
        const result = await db.query(
            'UPDATE pedidos SET status = $1 WHERE order_id = $2 RETURNING *',
            [status, id]
        );

        const pedido = result.rows[0];
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

        console.log(`🔄 [STATUS CHANGE] Order ${id} -> ${status}`);

        // --- SIMULACIÓN WHATSAPP ---
        if (status === 'en_camino') {
            console.log(`📱 [WhatsApp Simulator] Enviando a ${pedido.telefono}: 
            "¡Hola ${pedido.cliente_nombre}! Tu pizza de Pizza Cerebro ya va en camino. Estará ahí en minutos. 🛵💨"`);
        }

        // --- LOGÍSTICA SOCKETS ---
        if (status === 'listo') {
            const itemsRes = await db.query(
                'SELECT pizza_nombre as nombre, cantidad as quantity FROM detalle_pedidos WHERE pedido_id = $1',
                [pedido.id]
            );
            io.emit('pedido_listo_reparto', { ...pedido, items: itemsRes.rows });
        } else if (status === 'entregado') {
            io.emit('pedido_entregado_remoto', id);
        }

        io.emit('actualizacion_status_global', { id, status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN STATS ---
app.get('/api/admin/stats', authenticateJWT, async (req, res) => {
    try {
        const ventasHoy = await db.query(
            "SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE created_at >= CURRENT_DATE"
        );
        const topPizzas = await db.query(`
            SELECT pizza_nombre, COUNT(*) as cantidad 
            FROM detalle_pedidos 
            GROUP BY pizza_nombre 
            ORDER BY cantidad DESC 
            LIMIT 3
        `);

        res.json({
            revenueToday: parseFloat(ventasHoy.rows[0].total),
            topThree: topPizzas.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SOCKETS ---
io.on('connection', (socket) => {
    console.log('--- Dispositivo conectado:', socket.id);

    socket.on('actualizar_menu', async (updatedMenu) => {
        io.emit('menu_actualizado', updatedMenu);
    });

    socket.on('disconnect', () => {
        console.log('--- Dispositivo desconectado:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 SERVIDOR PROFESIONAL OPERATIVO en http://localhost:${PORT}`);
});
