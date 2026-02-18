# 🍕 Guía del Sistema - Pizza Cerebro Ecosistema

Este documento detalla los módulos, características y funcionamiento técnico del sistema integral de Pizza Cerebro.

---

## 1. Servidor Central: Backend All-in-One
Es el núcleo del sistema que gestiona tanto la API REST como las comunicaciones en tiempo real (Socket.io).
*   **Funcionamiento:** Procesa pedidos, gestiona el inventario y sincroniza todos los módulos. **No depende de servicios externos como n8n**, lo que garantiza latencia mínima y costo cero.
*   **Persistencia:** Utiliza una base de datos local (`pedidos.json`) para mantener el historial de ventas incluso si el servidor se reinicia.
*   **Eventos Clave:**
    *   `/api/pedidos` (POST): Recepción de nuevas órdenes del cliente.
    *   `actualizar_menu`: Sincronización instantánea de disponibilidad.
    *   `pedido_listo_reparto`: Puente entre Cocina y Logística.
    *   `confirmar_entrega`: Cierre del ciclo operativo.

---

## 2. Módulo de Venta: Tienda del Cliente (`/`)
Interfaz premium diseñada para maximizar la conversión y la experiencia del usuario.
*   **Características:**
    *   **Menú Inteligente:** Se actualiza en tiempo real. Si el administrador marca una pizza como "Agotada", el cliente lo ve al instante sin refrescar.
    *   **Personalización:** Modal para elegir extras (queso, orilla, etc.) con cálculo de precio dinámico.
    *   **Carrito Flotante:** IX fluida que permite ver el total y confirmar rápidamente.
    *   **Smart Checkout:** Utiliza **Local Storage** para recordar los datos del cliente (nombre, dirección, teléfono) para su próxima compra.

---

## 3. Módulo de Operaciones: Cocina (KDS) (`/cocina`)
Pantalla de gestión de pedidos para el personal de cocina.
*   **Características:**
    *   **Tarjetas de Pedido:** Detalla items, extras y cantidades.
    *   **Semáforo de Tiempo:** Monitor en vivo que cambia de color según la urgencia:
        *   🔵 **Azul/Oscuro (0-10 min):** Pedido nuevo.
        *   🟡 **Amarillo (10-15 min):** Retraso leve.
        *   🔴 **Rojo (15+ min):** ¡URGENTE! (Parpadea).
    *   **Notificaciones:** Alertas sonoras y visuales al recibir órdenes nuevas.

---

## 4. Módulo de Estrategia: Admin Dashboard (`/admin`)
Panel de control total para el dueño del negocio.
*   **Características:**
    *   **Login Seguro:** Protegido con credenciales de administrador.
    *   **Gestión de Inventario:** Switch maestro para activar/desactivar productos en segundos.
    *   **Estadísticas en Vivo:** Gráficas de "Flujo de Caja" que se actualizan con cada venta.
    *   **Monitor de Órdenes:** Historial reciente con estatus de entrega.

---

## 5. Módulo de Logística: Repartidor (`/repartidor`)
Diseño Mobile-First optimizado para rapidez en calle.
*   **Características:**
    *   **Acciones Rápidas:** Botones gigantes para **NAVEGAR** (abre Google Maps) y **LLAMAR** al cliente.
    *   **Sincronización:** El pedido aparece automáticamente cuando la cocina lo marca como "Listo".
    *   **Seguimiento:** Confirmación de entrega que notifica al administrador en tiempo real.

---

## Resumen Técnico de Sincronización
| Acción | Origen | Destino | Tecnología |
| :--- | :--- | :--- | :--- |
| Nueva Compra | Cliente | Cocina / Admin | HTTP Post + Socket.io |
| Apagar Producto | Admin | Tienda Cliente | Socket.io Broadcast |
| Terminar de Cocinar | Cocina | Repartidor | Socket.io Emit |
| Confirmar Entrega | Repartidor | Admin | Socket.io Emit |
