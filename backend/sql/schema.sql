SET NAMES utf8mb4;

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
    publicado TINYINT(1) NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS feature_flags (
    feature_flag_id INT NOT NULL AUTO_INCREMENT,
    clave VARCHAR(80) NOT NULL,
    habilitado TINYINT(1) NOT NULL DEFAULT 0,
    descripcion VARCHAR(255) DEFAULT NULL,
    fecha_actualizacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (feature_flag_id),
    UNIQUE KEY clave (clave)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;
