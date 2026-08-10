SET NAMES utf8mb4;

USE ferreteria_db;

ALTER TABLE productos
    ADD COLUMN slug VARCHAR(191) NULL AFTER nombre;

SELECT
    COUNT(*) AS total_productos,
    COALESCE(SUM(slug IS NOT NULL AND slug <> ''), 0) AS productos_con_slug,
    COALESCE(SUM(slug IS NULL), 0) AS slug_null,
    COALESCE(SUM(slug = ''), 0) AS slug_vacio,
    0 AS slugs_duplicados
FROM productos;

UPDATE productos
SET slug = LOWER(TRIM(nombre));

UPDATE productos
SET slug = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    slug,
    'á', 'a'), 'à', 'a'), 'ä', 'a'), 'â', 'a'), 'ã', 'a'),
    'é', 'e'), 'è', 'e'), 'ë', 'e'), 'ê', 'e'), 'í', 'i');

UPDATE productos
SET slug = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    slug,
    'ì', 'i'), 'ï', 'i'), 'î', 'i'), 'ó', 'o'), 'ò', 'o'),
    'ö', 'o'), 'ô', 'o'), 'õ', 'o'), 'ú', 'u'), 'ù', 'u');

UPDATE productos
SET slug = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    slug,
    'ü', 'u'), 'û', 'u'), 'ñ', 'n'), 'ç', 'c'), 'ß', 'ss');

UPDATE productos
SET slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(slug, '[^a-z0-9]+', '-'));

UPDATE productos
SET slug = CONCAT(
    CASE
        WHEN slug IS NULL OR slug = '' THEN 'producto'
        ELSE slug
    END,
    '-',
    producto_id
);

DELIMITER //

CREATE PROCEDURE validar_slugs_productos()
BEGIN
    IF EXISTS (
        SELECT 1
        FROM productos
        WHERE slug IS NULL OR slug = ''
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El backfill dejó productos sin slug';
    END IF;

    IF EXISTS (
        SELECT slug
        FROM productos
        GROUP BY slug
        HAVING COUNT(*) > 1
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El backfill generó slugs duplicados';
    END IF;
END//

DELIMITER ;

CALL validar_slugs_productos();
DROP PROCEDURE validar_slugs_productos;

ALTER TABLE productos
    ADD UNIQUE KEY slug (slug);

ALTER TABLE productos
    MODIFY COLUMN slug VARCHAR(191) NOT NULL AFTER nombre;

SELECT
    COUNT(*) AS total_productos,
    COALESCE(SUM(slug IS NOT NULL AND slug <> ''), 0) AS productos_con_slug,
    COALESCE(SUM(slug IS NULL), 0) AS slug_null,
    COALESCE(SUM(slug = ''), 0) AS slug_vacio,
    (
        SELECT COUNT(*)
        FROM (
            SELECT slug
            FROM productos
            GROUP BY slug
            HAVING COUNT(*) > 1
        ) AS duplicados
    ) AS slugs_duplicados
FROM productos;
