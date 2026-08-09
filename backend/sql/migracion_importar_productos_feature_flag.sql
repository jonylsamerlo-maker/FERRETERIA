SET NAMES utf8mb4;

USE ferreteria_db;

INSERT INTO feature_flags (
    clave,
    habilitado,
    descripcion
)
VALUES (
    'importar_productos',
    1,
    'Permite preparar y validar productos para su importacion desde archivos CSV.'
)
ON DUPLICATE KEY UPDATE
    descripcion = VALUES(descripcion);
