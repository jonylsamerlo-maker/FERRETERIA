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
    {
        $sql = "
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

    public function obtenerPorId(int $id): ?array
    {
        $sql = "
            SELECT
                p.producto_id,
                p.codigo,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen,
                p.categoria_id,
                c.nombre AS categoria,
                p.fecha_creacion
            FROM productos p
            INNER JOIN categorias c
                ON p.categoria_id = c.categoria_id
            WHERE p.producto_id = :id
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $producto = $stmt->fetch();

        return $producto ?: null;
    }

    public function crear(array $datos): bool
{
    $sql = "
        INSERT INTO productos
        (
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
            :codigo,
            :nombre,
            :descripcion,
            :precio,
            :stock,
            :imagen,
            :categoria_id
        )
    ";

    $stmt = $this->conn->prepare($sql);

    return $stmt->execute([
        ':codigo'       => $datos['codigo'],
        ':nombre'       => $datos['nombre'],
        ':descripcion'  => $datos['descripcion'],
        ':precio'       => $datos['precio'],
        ':stock'        => $datos['stock'],
        ':imagen'       => $datos['imagen'],
        ':categoria_id' => $datos['categoria_id']
    ]);
}
}