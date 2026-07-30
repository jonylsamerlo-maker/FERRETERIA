SET NAMES utf8mb4;

USE ferreteria_db;

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

INSERT INTO categorias (
    nombre,
    descripcion
)
VALUES
    ('Herramientas manuales', 'Herramientas para trabajos de ajuste, corte y reparacion.'),
    ('Herramientas electricas', 'Equipos electricos para obras, taller y mantenimiento.'),
    ('Construccion', 'Productos para albanileria y tareas de construccion.'),
    ('Seguridad industrial', 'Elementos de proteccion personal para el trabajo.'),
    ('Ofertas especiales', 'Productos destacados con precio promocional.')
ON DUPLICATE KEY UPDATE
    descripcion = VALUES(descripcion);

INSERT INTO productos (
    codigo,
    nombre,
    descripcion,
    precio,
    stock,
    imagen,
    categoria_id
)
VALUES
    (
        'HM-001',
        'Llave francesa ajustable',
        'Llave regulable para trabajos de ajuste en taller y hogar.',
        12500.00,
        18,
        'img/productos/img_6a67f30a642af1.30390572_llave_francesa.webp',
        (SELECT categoria_id FROM categorias WHERE nombre = 'Herramientas manuales')
    ),
    (
        'HM-002',
        'Juego de destornilladores',
        'Set de destornilladores planos y Phillips para uso general.',
        9800.00,
        25,
        'img/productos/img_6a67c313b0f671.37275654_juego-destornilladores-800x600.webp',
        (SELECT categoria_id FROM categorias WHERE nombre = 'Herramientas manuales')
    ),
    (
        'HE-001',
        'Taladro electrico',
        'Taladro electrico practico para perforaciones en madera y mamposteria.',
        45900.00,
        10,
        'img/productos/img_6a5e23c281cc65.59579180_taladroE.jpg',
        (SELECT categoria_id FROM categorias WHERE nombre = 'Herramientas electricas')
    ),
    (
        'SEG-001',
        'Conjunto de lluvia',
        'Equipo impermeable para trabajo en exteriores.',
        18900.00,
        12,
        'img/productos/img_6a6762494dd458.43196921_conjunto-lluvia-800x600.webp',
        (SELECT categoria_id FROM categorias WHERE nombre = 'Seguridad industrial')
    ),
    (
        'OFE-001',
        'Hormigonera en oferta',
        'Hormigonera destacada en ofertas especiales.',
        185000.00,
        4,
        'img/productos/img_6a675b7ce0c619.29055386_oferta-hormigonera-800x600.webp',
        (SELECT categoria_id FROM categorias WHERE nombre = 'Ofertas especiales')
    ),
    (
        'OFE-002',
        'Hidrolavadora en oferta',
        'Hidrolavadora destacada en ofertas especiales.',
        132000.00,
        6,
        'img/productos/img_6a675c168d8826.22883869_oferta-hidrolavadora-800x600.webp',
        (SELECT categoria_id FROM categorias WHERE nombre = 'Ofertas especiales')
    )
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    precio = VALUES(precio),
    stock = VALUES(stock),
    imagen = VALUES(imagen),
    categoria_id = VALUES(categoria_id);
