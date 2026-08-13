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

INSERT INTO usuarios (
    nombre,
    apellido,
    usuario,
    email,
    password,
    rol
)
VALUES (
    'Usuario',
    'Empleado',
    'empleado',
    'empleado@ferreteriajm.com',
    '$2y$10$5pkj5vPHRf95lqEZQGSy/./8iky3oXJYy6tIaUbCUoTUZfVACZosW',
    'EMPLEADO'
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
    slug,
    descripcion,
    precio,
    stock,
    imagen,
    publicado,
    categoria_id
)
VALUES
    (
        'HM-001',
        'Llave francesa ajustable',
        'pendiente-seed-hm-001',
        'Llave regulable para trabajos de ajuste en taller y hogar.',
        12500.00,
        18,
        'img/productos/img_6a67f30a642af1.30390572_llave_francesa.webp',
        1,
        (SELECT categoria_id FROM categorias WHERE nombre = 'Herramientas manuales')
    ),
    (
        'HM-002',
        'Juego de destornilladores',
        'pendiente-seed-hm-002',
        'Set de destornilladores planos y Phillips para uso general.',
        9800.00,
        25,
        'img/productos/img_6a67c313b0f671.37275654_juego-destornilladores-800x600.webp',
        1,
        (SELECT categoria_id FROM categorias WHERE nombre = 'Herramientas manuales')
    ),
    (
        'HE-001',
        'Taladro electrico',
        'pendiente-seed-he-001',
        'Taladro electrico practico para perforaciones en madera y mamposteria.',
        45900.00,
        10,
        'img/productos/img_6a5e23c281cc65.59579180_taladroE.jpg',
        1,
        (SELECT categoria_id FROM categorias WHERE nombre = 'Herramientas electricas')
    ),
    (
        'SEG-001',
        'Conjunto de lluvia',
        'pendiente-seed-seg-001',
        'Equipo impermeable para trabajo en exteriores.',
        18900.00,
        12,
        'img/productos/img_6a6762494dd458.43196921_conjunto-lluvia-800x600.webp',
        1,
        (SELECT categoria_id FROM categorias WHERE nombre = 'Seguridad industrial')
    ),
    (
        'OFE-001',
        'Hormigonera en oferta',
        'pendiente-seed-ofe-001',
        'Hormigonera destacada en ofertas especiales.',
        185000.00,
        4,
        'img/productos/img_6a675b7ce0c619.29055386_oferta-hormigonera-800x600.webp',
        1,
        (SELECT categoria_id FROM categorias WHERE nombre = 'Ofertas especiales')
    ),
    (
        'OFE-002',
        'Hidrolavadora en oferta',
        'pendiente-seed-ofe-002',
        'Hidrolavadora destacada en ofertas especiales.',
        132000.00,
        6,
        'img/productos/img_6a675c168d8826.22883869_oferta-hidrolavadora-800x600.webp',
        1,
        (SELECT categoria_id FROM categorias WHERE nombre = 'Ofertas especiales')
    )
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    precio = VALUES(precio),
    stock = VALUES(stock),
    imagen = VALUES(imagen),
    categoria_id = VALUES(categoria_id);

UPDATE productos
SET slug = CONCAT(
    CASE codigo
        WHEN 'HM-001' THEN 'llave-francesa-ajustable'
        WHEN 'HM-002' THEN 'juego-de-destornilladores'
        WHEN 'HE-001' THEN 'taladro-electrico'
        WHEN 'SEG-001' THEN 'conjunto-de-lluvia'
        WHEN 'OFE-001' THEN 'hormigonera-en-oferta'
        WHEN 'OFE-002' THEN 'hidrolavadora-en-oferta'
    END,
    '-',
    producto_id
)
WHERE slug LIKE 'pendiente-seed-%'
    AND codigo IN ('HM-001', 'HM-002', 'HE-001', 'SEG-001', 'OFE-001', 'OFE-002');

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

INSERT INTO feature_flags (
    clave,
    habilitado,
    descripcion
)
VALUES
    (
        'exportar_excel',
        0,
        'Permite descargar el inventario en un formato compatible con Excel.'
    ),
    (
        'exportar_pdf',
        0,
        'Permite generar un informe imprimible del inventario.'
    ),
    (
        'importar_productos',
        1,
        'Permite preparar y validar productos para su importacion desde archivos CSV.'
    )
ON DUPLICATE KEY UPDATE
    descripcion = VALUES(descripcion);
