CREATE DATABASE IF NOT EXISTS ferreteria_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE ferreteria_db;

CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'EMPLEADO') DEFAULT 'EMPLEADO',
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    UNIQUE KEY usuario (usuario),
    UNIQUE KEY email (email)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categorias (
    categoria_id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (categoria_id),
    UNIQUE KEY nombre (nombre)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS productos (
    producto_id INT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen VARCHAR(255) DEFAULT NULL,
    categoria_id INT NOT NULL,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (producto_id),
    UNIQUE KEY codigo (codigo),
    KEY fk_producto_categoria (categoria_id),
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias (categoria_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO usuarios (
    nombre,
    apellido,
    usuario,
    email,
    password,
    rol
)
VALUES (
    'Jony',
    'Merlo',
    'admin',
    'admin@ferreteriajm.com',
    '$2y$10$UuxRhihaVDFS6YD.q1vGy.TjoxTtPVVyUDMuWcvWJbj0Y9MYo1LxG',
    'ADMIN'
)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    apellido = VALUES(apellido),
    email = VALUES(email),
    password = VALUES(password),
    rol = VALUES(rol);