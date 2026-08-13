# Ferreteria JM

Sistema web para la gestion de una ferreteria, con catalogo publico, carrito, chatbot, panel administrativo, carga de imagenes y API REST conectada a MySQL.

El proyecto esta preparado para ejecutarse con Docker Compose y dejar el frontend, backend y base de datos disponibles desde una instalacion limpia.

## Caracteristicas

- Administracion de productos.
- Administracion de categorias.
- Login de administrador.
- Dashboard administrativo.
- Carga de imagenes para productos.
- Carrito.
- Chatbot.
- Interfaz responsive.
- Entorno con Docker.
- API REST.

## Tecnologias

| Capa | Tecnologias |
| --- | --- |
| Frontend | Astro, React, JavaScript, CSS |
| Backend | PHP 8.2, PDO, MySQL |
| Infraestructura | Docker, Docker Compose |

### Dependencias principales

El frontend esta ubicado en `ferreteria-jm/apps/frontend` y utiliza:

- `astro`
- `@astrojs/react`
- `react`
- `react-dom`
- `lucide-react`

### Scripts disponibles

Los scripts disponibles en `ferreteria-jm/apps/frontend/package.json` son:

| Script | Descripcion |
| --- | --- |
| `npm run dev` | Inicia Astro en modo desarrollo con `--host 0.0.0.0`. |
| `npm run build` | Genera la build de produccion del frontend. |
| `npm run preview` | Sirve una build de Astro para previsualizacion. |
| `npm run astro` | Ejecuta comandos de Astro. |

## Arquitectura

```text
.
├── backend/
│   ├── api/
│   │   ├── categorias.php
│   │   ├── login.php
│   │   ├── productos.php
│   │   ├── upload.php
│   │   └── usuarios.php
│   ├── config/
│   │   └── Database.php
│   ├── img/
│   │   └── productos/
│   ├── models/
│   │   ├── Categoria.php
│   │   ├── Producto.php
│   │   └── Usuario.php
│   ├── scripts/
│   │   ├── cambiar_password.php
│   │   └── generar_password.php
│   ├── sql/
│   │   ├── schema.sql
│   │   ├── schemas.sql
│   │   └── seed.sql
│   ├── index.php
│   └── test-db.php
├── ferreteria-jm/
│   └── apps/
│       ├── frontend/
│       │   ├── public/
│       │   ├── src/
│       │   │   ├── components/
│       │   │   ├── config/
│       │   │   ├── data/
│       │   │   ├── modules/
│       │   │   ├── pages/
│       │   │   ├── routes/
│       │   │   ├── services/
│       │   │   └── utils/
│       │   ├── astro.config.mjs
│       │   ├── dockerfile
│       │   └── package.json
│       └── package.json
├── docker-compose.yml
└── README.md
```

## Instalacion

### Requisitos

- Docker.
- Docker Compose.

### Pasos desde cero

1. Clonar el repositorio.

```bash
git clone <url-del-repositorio>
```

2. Entrar a la carpeta del proyecto.

```bash
cd PAGINA_WEB
```

3. Levantar los servicios.

```bash
docker compose up -d
```

4. Esperar la inicializacion de MySQL.

En el primer arranque, MySQL crea la base de datos y ejecuta los scripts SQL iniciales. Este proceso puede tardar unos minutos.

5. Abrir la aplicacion.

| Servicio | URL |
| --- | --- |
| Frontend | `http://localhost:4321` |
| Backend | `http://localhost:8081` |
| MySQL | `localhost:3308` |

### Comandos utiles

```bash
docker compose ps
docker compose logs db
docker compose logs backend
docker compose logs frontend
docker compose down
```

Para reiniciar desde una base de datos limpia:

```bash
docker compose down -v
docker compose up -d
```

## Base de datos

El servicio `db` usa MySQL 8.0 y se configura desde `docker-compose.yml`.

| Dato | Valor |
| --- | --- |
| Base de datos | `ferreteria_db` |
| Usuario | `jony_user` |
| Host interno Docker | `db` |
| Puerto expuesto | `3308` |

Los scripts de inicializacion se montan en `/docker-entrypoint-initdb.d`:

- `backend/sql/schema.sql`: crea automaticamente la base de datos `ferreteria_db` y las tablas `usuarios`, `categorias` y `productos`.
- `backend/sql/seed.sql`: carga datos iniciales, incluyendo usuario administrador, categorias, productos de ejemplo y productos en la categoria `Ofertas especiales`.

> Nota: los scripts de inicializacion de MySQL se ejecutan automaticamente cuando el volumen de datos se crea por primera vez. Si el volumen ya existe, MySQL conserva los datos actuales.

## Usuario administrador

Datos existentes en `backend/sql/seed.sql`:

| Campo | Valor |
| --- | --- |
| Usuario | `admin` |
| Email | `admin@ferreteriajm.com` |
| Rol | `ADMIN` |
| Password | Bloqueada hasta completar la rotacion CLI inicial. |

Despues de crear una instalacion nueva, el propietario debe elegir la password
fuera del repositorio y rotarla desde una terminal interactiva dentro del
contenedor backend:

```bash
docker compose exec backend php scripts/cambiar_password.php admin
```

La herramienta solicita y confirma la password sin mostrarla, no la guarda en
archivos y solo actualiza el usuario ADMIN indicado.

## API

Base URL local:

```text
http://localhost:8081
```

### Endpoints

| Metodo | Endpoint | Descripcion |
| --- | --- | --- |
| `POST` | `/api/login.php` | Autentica un usuario. |
| `GET` | `/api/productos.php` | Lista productos. |
| `GET` | `/api/productos.php?id={id}` | Obtiene un producto por ID. |
| `POST` | `/api/productos.php` | Crea un producto. |
| `PUT` | `/api/productos.php?id={id}` | Actualiza un producto. |
| `DELETE` | `/api/productos.php?id={id}` | Elimina un producto. |
| `GET` | `/api/categorias.php` | Lista categorias. |
| `POST` | `/api/categorias.php` | Crea una categoria. |
| `PUT` | `/api/categorias.php?id={id}` | Actualiza una categoria. |
| `DELETE` | `/api/categorias.php?id={id}` | Elimina una categoria. |
| `POST` | `/api/upload.php` | Sube una imagen de producto mediante el campo `imagen`. |
| `GET` | `/api/usuarios.php` | Lista usuarios. |

`test-db.php` y las herramientas de `backend/scripts/` son exclusivamente CLI;
por HTTP responden `404` sin exponer informacion.

## Capturas

Seccion preparada para agregar capturas del sistema:

### Home

Pendiente.

### Dashboard

Pendiente.

### Productos

Pendiente.

### Categorias

Pendiente.

### Login

Pendiente.

## Proximas mejoras

- Mejoras de seguridad.
- Gestion de pedidos.
- Gestion de clientes.
- Integracion con pasarela de pagos.
- Panel de estadisticas.

## Licencia

Este proyecto se distribuye bajo licencia MIT.

```text
MIT License

Copyright (c) 2026 Ferreteria JM

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
