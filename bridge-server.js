const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH"]
    }
});

// "Base de Datos" Local (Persistencia simple en JSON)
const DB_PATH = path.join(__dirname, 'pedidos.json');
let pedidos = [];

// Cargar datos al iniciar
if (fs.existsSync(DB_PATH)) {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        pedidos = JSON.parse(data);
    } catch (e) {
        pedidos = [];
    }
}

const saveDB = () => {
    fs.writeFileSync(DB_PATH, JSON.stringify(pedidos, null, 2));
};

// --- ENDPOINTS API ---

// 1. Crear Pedido (Sustituye a n8n)
app.post('/api/pedidos', (req, res) => {
    const nuevoPedido = {
        ...req.body,
        status: 'recibido', // recibido -> preparando -> listo -> entregado
        createdAt: req.body.createdAt || new Date().toISOString()
    };

    console.log(`📦 Nuevo Pedido Recibido: ${nuevoPedido.id}`);

    pedidos.push(nuevoPedido);
    saveDB();

    // Notificar a Cocina y Admin inmediatamente
    io.emit('nuevo_pedido', nuevoPedido);

    res.status(201).json({ success: true, data: nuevoPedido });
});

// 2. Obtener Pedidos (Para que el Admin pueda ver el historial al cargar)
app.get('/api/pedidos', (req, res) => {
    res.json(pedidos);
});

// 3. Actualizar Estatus (Lógica de Negocio centralizada)
app.patch('/api/pedidos/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1) {
        pedidos[index].status = status;
        saveDB();

        console.log(`🔄 Pedido ${id} actualizado a: ${status}`);

        // Emitir el cambio según el flujo
        if (status === 'listo') {
            // De Cocina -> Repartidor
            io.emit('pedido_listo_reparto', pedidos[index]);
        } else if (status === 'entregado') {
            // De Repartidor -> Todos
            io.emit('pedido_entregado_remoto', id);
        }

        // Notificar al Admin del cambio de estado general
        io.emit('actualizacion_status_global', { id, status });

        return res.json({ success: true, pedido: pedidos[index] });
    }

    res.status(404).json({ error: "Pedido no encontrado" });
});

// 4. Endpoint de compatibilidad (para no romper el frontend mientras se actualiza)
app.post('/webhook-n8n', (req, res) => {
    console.log("⚠️ Webhook-n8n llamado (redireccionando a API interna)");
    const nuevoPedido = {
        ...req.body,
        status: 'recibido',
        createdAt: req.body.createdAt || new Date().toISOString()
    };
    pedidos.push(nuevoPedido);
    saveDB();
    io.emit('nuevo_pedido', nuevoPedido);
    res.status(200).send({ status: 'success', data: nuevoPedido });
});

// --- WEBSOCKETS ---
io.on('connection', (socket) => {
    console.log('--- Dispositivo conectado:', socket.id);

    // Sincronización de Menú
    socket.on('actualizar_menu', (updatedMenu) => {
        console.log('>>> Menú actualizado recibido del Admin.');
        io.emit('menu_actualizado', updatedMenu);
    });

    // Eventos de legado para mantener compatibilidad
    socket.on('pedido_listo_reparto', (pedido) => {
        console.log('>>> Cocina marcó pedido listo:', pedido.id);
        io.emit('pedido_listo_reparto', pedido);
    });

    socket.on('confirmar_entrega', (id) => {
        console.log('>>> Repartidor confirmó entrega:', id);
        io.emit('pedido_entregado_remoto', id);
    });

    socket.on('disconnect', () => {
        console.log('--- Dispositivo desconectado:', socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 SERVIDOR ALL-IN-ONE OPERATIVO en http://localhost:${PORT}`);
    console.log(`📁 Base de datos local: pedidos.json`);
});
