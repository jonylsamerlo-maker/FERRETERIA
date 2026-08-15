# Producción

La configuración de producción es independiente del entorno local y usa el
proyecto Compose fijo `ferreteria_jm_prod`:

```bash
docker compose --env-file /ruta/segura/ferreteria-jm.env \
  -f docker-compose.prod.yml up -d --build
```

No se debe usar `docker-compose.yml` para producción. El archivo de entorno
real no debe residir en el repositorio.

## Persistencia

`ferreteria_jm_prod_db_data` persiste MySQL y
`ferreteria_jm_prod_uploads_data` persiste las imágenes cargadas. Ninguno de
los servicios publica puertos al host: un reverse proxy deberá compartir la
red interna y ser el único servicio expuesto posteriormente.

Al crear un volumen de uploads vacío, Docker copia las imágenes incluidas en
la imagen backend. Para migrar imágenes existentes que no estén en esa imagen,
crear el volumen y copiar antes de iniciar backend:

```bash
docker volume create ferreteria_jm_prod_uploads_data
docker run --rm \
  -v ferreteria_jm_prod_uploads_data:/destino \
  -v /ruta/segura/img-productos:/origen:ro \
  alpine sh -c 'cp -a /origen/. /destino/'
```

Verificar cantidad de archivos y rutas de `producto_imagenes` después de la
migración. No ejecutar una limpieza de huérfanos durante el despliegue.

## Datos iniciales

El Compose de producción monta solamente `schema.sql`; no carga `seed.sql`.
Para una instancia existente, restaurar un dump validado antes de iniciar la
aplicación. En una instancia nueva, después de iniciar los servicios, crear el
primer ADMIN antes de habilitar acceso público:

```bash
docker compose --env-file /ruta/segura/ferreteria-jm.env \
  -f docker-compose.prod.yml exec backend \
  php /var/www/html/scripts/crear_admin.php
```

La herramienta solicita nombre, apellido, usuario, email y contraseña de forma
interactiva; no acepta una contraseña por argumento. Se niega a crear otro
ADMIN si ya existe uno y nunca debe usarse `seed.sql` para crear cuentas de
producción.

## Backup mínimo

Respaldar MySQL y el volumen de uploads juntos antes de cada despliegue y de
forma periódica. Restaurar ambos en un entorno aislado y comprobar login,
productos, galerías e imágenes antes de considerar válido el backup.
