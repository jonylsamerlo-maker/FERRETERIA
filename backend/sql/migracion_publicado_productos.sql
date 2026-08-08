SET NAMES utf8mb4;

USE ferreteria_db;

ALTER TABLE productos
    ADD COLUMN publicado TINYINT(1) NOT NULL DEFAULT 1 AFTER imagen;

ALTER TABLE productos
    MODIFY COLUMN publicado TINYINT(1) NOT NULL DEFAULT 0;
