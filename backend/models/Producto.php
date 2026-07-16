<?php

declare(strict_types=1);

class Producto
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function listar(): array
    {$sql = "
SELECT
    p.producto_id,
    p.codigo,
    p.nombre,
    p.descripcion,
    p.precio,
    p.stock,
    p.imagen,
    c.nombre AS categoria,
    p.fecha_creacion
FROM productos p
INNER JOIN categorias c
    ON p.categoria_id = c.categoria_id
ORDER BY p.producto_id ASC
";
        

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}