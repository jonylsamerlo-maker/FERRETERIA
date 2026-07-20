 🔧 Ferretería JM

Proyecto final de la Tecnicatura Full Stack.

Ferretería JM es una aplicación web desarrollada con arquitectura **Monorepo**, que permite administrar productos y categorías desde un panel de administración y mostrarlos en un catálogo para los usuarios.

---

# Tecnologías utilizadas

## Frontend
- Astro
- React
- JavaScript
- CSS3

## Backend
- PHP 8
- PDO
- API REST

## Base de datos
- MySQL 8

## Infraestructura
- Docker
- Docker Compose

---

# Estructura del proyecto

```
ferreteria-jm/
│
├── backend/
│ ├── api/
│ ├── config/
│ ├── img/
│ └── schemas.sql
│
├── apps/
│ └── frontend/
│
├── docker/
│
└── docker-compose.yml
```

---

# Instalación

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
```

---

## 2. Levantar Docker

```bash
docker compose up -d
```

---

## 3. Importar la base de datos

Crear una base de datos llamada:

```
ferreteria_db
```

Luego importar:

```
backend/schemas.sql
```

---

# URLs

## Frontend

```
http://localhost:4321
```

## Backend

```
http://localhost:8081
```

---

# Usuario administrador

Crear un usuario administrador desde la base de datos o utilizar el usuario de prueba configurado.

Ejemplo:

```
Usuario: admin

Contraseña: Admin123*
```

---

# Funcionalidades

## Home

- Hero principal
- Carrusel de productos destacados
- Categorías
- Productos disponibles
- Responsive

---

## Login

- Inicio de sesión
- Validación de usuarios

---

## Panel de administración

- Gestión de categorías
- Alta de productos
- Modificación
- Eliminación
- Subida de imágenes

---

## Productos

- Listado dinámico
- Filtro por categoría
- Carrusel de ofertas
- Imágenes locales

---

# Flujo de uso

1. Iniciar sesión.
2. Crear categorías.
3. Crear productos.
4. Asignar cada producto a una categoría.
5. Los productos se muestran automáticamente en el Home y en el carrusel de ofertas.

---

# Capturas

## Home

```
docs/img/home.png
```

---

## Dashboard

```
docs/img/dashboard.png
```

---

## Productos

```
docs/img/productos.png
```

---

## Categorías

```
docs/img/categorias.png
```

---

## Login

```
docs/img/login.png
```

---

# Características

- Arquitectura Monorepo.
- Docker.
- API REST en PHP.
- MySQL con PDO.
- Frontend en Astro + React.
- Responsive.<img width="1366" height="768" alt="vista2producto2" src="https://github.com/user-attachments/assets/4a1de91b-8ad8-4db1-b8df-2364a75e9422" />
<img width="1366" height="768" alt="vistacategoria1" src="https://github.com/user-attachments/assets/4d2a3e47-ba6c-4d73-ba14-6fc7d715172d" />
<img width="1366" height="768" alt="vistapanel" src="https://github.com/user-attachments/assets/f57c9b14-87ee-4a56-9497-13b0424d6431" />
<img width="1366" height="768" alt="vistaproducto" src="https://github.com/user-attachments/assets/3e5a6c5a-e37e-44d2-859f-af14dfc79b6b" />
<img width="1366" height="768" alt="vistaproducto" src="https://github.com/user-attachments/assets/36049c9a-298f-4e46-a471-9cd83449e812" />
<img width="1366" height="768" alt="vistapanel" src="https://github.com/user-attachments/assets/b680c76d-56ab-4f5f-a74f-0e0543ec2c69" />
<img width="1366" height="768" alt="vistacategoria1" src="https://github.com/user-attachments/assets/c217a5df-79e4-4155-a4a3-d6f5a97479d7" />
<img width="1366" height="768" alt="vista2producto2" src="https://github.com/user-attachments/assets/74314e25-07a6-4572-8e60-e4cde768728b" />

- Gestión completa de productos.
- Gestión completa de categorías.
- Carrusel dinámico.
- Navegación adaptable para dispositivos móviles.

---

# Estado del proyecto

Proyecto desarrollado como trabajo final de la Tecnicatura Full Stack.

Se encuentra listo para ser ejecutado mediante Docker y continuar
