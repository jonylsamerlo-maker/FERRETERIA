SET NAMES utf8mb4;

USE ferreteria_db;

CREATE TABLE IF NOT EXISTS producto_imagenes (
    imagen_id INT NOT NULL AUTO_INCREMENT,
    producto_id INT NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    orden SMALLINT UNSIGNED NOT NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (imagen_id),
    UNIQUE KEY uq_producto_imagen_orden (producto_id, orden),
    KEY idx_producto_principal (producto_id, principal),
    CONSTRAINT fk_producto_imagen
        FOREIGN KEY (producto_id)
        REFERENCES productos(producto_id)
        ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO producto_imagenes (
    producto_id,
    ruta,
    orden,
    principal
)
SELECT
    p.producto_id,
    p.imagen,
    1,
    1
FROM productos p
LEFT JOIN producto_imagenes pi
    ON pi.producto_id = p.producto_id
WHERE p.imagen IS NOT NULL
    AND TRIM(p.imagen) <> ''
    AND pi.imagen_id IS NULL;
