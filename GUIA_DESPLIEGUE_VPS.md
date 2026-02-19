# 🚀 Guía de Despliegue en VPS - Pizza Cerebro

Esta guía detalla los pasos para montar el ecosistema completo (Frontend, Backend y Base de Datos) en un servidor Linux (Ubuntu/Debian).

## 1. Requisitos Previos
Asegúrate de tener instalado en tu VPS:
*   **Node.js** (v18 o superior)
*   **NPM** o **Yarn**
*   **PostgreSQL**
*   **PM2** (Para mantener los procesos vivos)
*   **Nginx** (Como Proxy Inverso)

```bash
# Instalación rápida de PM2
sudo npm install -g pm2
```

---

## 2. Configuración de Base de Datos (Postgres)
Crea la base de datos y el usuario:

```sql
CREATE DATABASE pizza_db;
CREATE USER pizza_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE pizza_db TO pizza_user;
```

---

## 3. Clonar y Configurar el Proyecto
```bash
git clone https://github.com/kikehil/pizza.git
cd pizza
npm install
```

### Configura las Variables de Entorno
Crea un archivo `.env` en la raíz:
```bash
DATABASE_URL=postgresql://pizza_user:tu_password_seguro@localhost:5432/pizza_db
JWT_SECRET=un_secreto_muy_largo_y_seguro
NODE_ENV=production
NEXT_PUBLIC_SOCKET_URL=http://tu_ip_vps:3001
```

---

## 4. Inicializar DB y Compilar Frontend
```bash
# Crear tablas automáticamente
node init-db.js

# Construir la aplicación Next.js
npm run build
```

---

## 5. Lanzamiento con PM2
Usaremos PM2 para que el sistema se reinicie solo si el servidor falla.

```bash
# Iniciar el Backend (Socket.io + API SQL)
pm2 start server.js --name "pizza-backend"

# Iniciar el Frontend (Next.js App)
pm2 start npm --name "pizza-frontend" -- start

# Guardar configuración para reinicios del VPS
pm2 save
pm2 startup
```

---

## 6. Configuración de Nginx (SSL)
Para que el sitio sea accesible vía `http://pizza.tudominio.com`, crea un archivo en `/etc/nginx/sites-available/pizza`:

```nginx
server {
    server_name pizza.tudominio.com;

    location / {
        proxy_pass http://localhost:3000; # Frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001; # Backend API
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001; # Backend Sockets
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 7. Mantenimiento
*   **Ver logs:** `pm2 logs`
*   **Reiniciar todo:** `pm2 restart all`
*   **Actualizar código:** `git pull && npm install && npm run build && pm2 restart all`

**¡Listo! Tu pizzería inteligente ahora es global. 🍕🚀🔥**
