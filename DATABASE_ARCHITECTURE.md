# 📊 Arquitectura de Datos y Business Intelligence (BI) - Pizza Cerebro

Esta guía detalla la estructura de datos necesaria para transformar un sitio web de pedidos en una herramienta de análisis de negocio de alto nivel.

---

## 🏛️ Estructura de la Base de Datos (PostgreSQL / Supabase)

Para generar reportes que realmente ayuden a tomar decisiones (como "¿qué día poner 2x1?" o "¿qué extra es más rentable?"), utilizamos la siguiente arquitectura de 3 niveles:

### 1. Tabla: `pedidos` (Transacciones Generales)
Registra la venta global y el estado del ticket.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID / Serial | Identificador único del pedido. |
| `cliente_nombre` | String | Nombre para personalización y CRM. |
| `metodo_pago` | Enum | "Efectivo", "Tarjeta", "Transferencia". |
| `total` | Decimal | Monto final cobrado. |
| `status` | Enum | "Pendiente", "En Cocina", "Enviado", "Entregado". |
| `created_at` | Timestamp | Fecha y hora exacta (Vital para análisis por hora). |

### 2. Tabla: `detalle_pedidos` (Análisis de Productos)
Desglosa los artículos de cada ticket.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Clave primaria del detalle. |
| `pedido_id` | Foreign Key | Relación con la tabla `pedidos`. |
| `producto_nombre`| String | Nombre de la pizza (ej. "Mexicana"). |
| `precio_base` | Decimal | Precio de la pizza sola. |
| `cantidad` | Integer | Cantidad de unidades de ese producto. |

### 3. Tabla: `extras_pedidos` (La Mina de Oro / Up-selling)
Detalla los adicionales que incrementan el ticket promedio.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `detalle_id` | Foreign Key | Relación con la tabla `detalle_pedidos`. |
| `extra_nombre` | String | Ej. "Orilla de queso", "Extra Pepperoni". |
| `extra_precio` | Decimal | Costo del adicional. |

---

## 🔄 Flujo de Trabajo en n8n (Data Pipeline)

Cuando el sitio web envía un pedido, n8n procesa la información en milisegundos siguiendo este flujo lógico:

1.  **Webhook Node:** Recibe el JSON del frontend.
2.  **Postgres/Supabase (Insert):** Crea el registro en `pedidos` y recupera el `ID`.
3.  **Loop/Split Node:** Por cada pizza en el carrito:
    *   Inserta en `detalle_pedidos`.
    *   Si hay extras: Itera e inserta en `extras_pedidos` vinculándolos al producto.
4.  **HTTP Request Node:** Envía la señal al **Bridge Server** para que la Cocina vea el pedido al instante.
5.  **Notificación Final:** Envía confirmación vía WhatsApp o Email al cliente.

---

## 📈 Consultas Estratégicas (SQL para el Módulo Admin)

Estas son las preguntas que el sistema contesta automáticamente en el Panel de Administración:

### ¿Cuáles son mis 3 pizzas más vendidas y cuánto dinero generan?
```sql
SELECT producto_nombre, COUNT(*) as veces_vendida, SUM(precio_base) as total_generado
FROM detalle_pedidos
GROUP BY producto_nombre
ORDER BY veces_vendida DESC
LIMIT 3;
```

### ¿Qué extras son los más populares para hacer "Up-selling"?
```sql
SELECT extra_nombre, COUNT(*) as cantidad, SUM(extra_precio) as ingresos
FROM extras_pedidos
GROUP BY extra_nombre
ORDER BY cantidad DESC;
```

### ¿En qué horario recibo más pedidos (Hora de Oro)?
```sql
SELECT EXTRACT(HOUR FROM created_at) as hora_del_dia, COUNT(*) as volumen_pedidos
FROM pedidos
GROUP BY hora_del_dia
ORDER BY volumen_pedidos DESC;
```

---

**Resultado:** El dueño de Pizza Cerebro no solo tiene una web bonita; tiene un sistema que le dice exactamente dónde está ganando dinero y cómo optimizar su inventario.
