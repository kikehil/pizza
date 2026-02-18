### Estructura JSON para Crear Pedido (POST /api/pedidos)

Este es el objeto que el Frontend debe enviar para que el Backend procese la transacción completa en las 3 tablas (pedidos, detalles, extras).

```json
{
  "id": "ord-8832",
  "cliente_nombre": "Juan Pérez",
  "telefono": "2221234567",
  "direccion": "Av. Reforma 123, Col. Centro",
  "referencias": "Portón blanco junto al Oxxo",
  "total": 545.00,
  "items": [
    {
      "nombre": "Mexicana",
      "quantity": 2,
      "totalItemPrice": 210.00,
      "extras": [
        {
          "nombre": "Orilla de Queso",
          "precio": 35.00
        },
        {
          "nombre": "Extra Jalapeño",
          "precio": 15.00
        }
      ]
    },
    {
      "nombre": "Hawaiana Premium",
      "quantity": 1,
      "totalItemPrice": 195.00,
      "extras": []
    }
  ]
}
```

### Flujo de Datos en el Servidor:
1. **Transacción Inicia:** Se asegura que si algo falla (ej. se va la luz a mitad del guardado), no queden datos huérfanos.
2. **Tabla `pedidos`:** Inserta la información general y genera el `db_id`.
3. **Tabla `detalle_pedidos`:** Por cada pizza, crea un registro vinculado al `db_id` del pedido.
4. **Tabla `extras_pedidos`:** Si la pizza tiene extras, los guarda vinculados al `detail_id` de esa pizza específica.
5. **Evento Socket:** Una vez que la DB confirma el guardado, se emite `nuevo_pedido` a la cocina.
