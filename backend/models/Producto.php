<?php

declare(strict_types=1);

class Producto
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    private function normalizarProducto(array $producto): array
    {
        $producto['publicado'] = (int)$producto['publicado'];

        return $producto;
    }

    private function normalizarImagen(mixed $imagen): ?string
    {
        if ($imagen === null) {
            return null;
        }

        $imagenNormalizada = trim((string)$imagen);

        return $imagenNormalizada !== '' ? $imagenNormalizada : null;
    }

    private function listarSegunPublicacion(bool $soloPublicados): array
    {
        $filtroPublicacion = $soloPublicados
            ? 'WHERE p.publicado = 1'
            : '';

        $sql = "
            SELECT
                p.producto_id,
                p.codigo,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen,
                p.publicado,
                p.categoria_id,
                c.nombre AS categoria,
                p.fecha_creacion
            FROM productos p
            INNER JOIN categorias c
                ON p.categoria_id = c.categoria_id
            {$filtroPublicacion}
            ORDER BY p.producto_id ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return array_map(
            fn(array $producto): array => $this->normalizarProducto($producto),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    public function listar(): array
    {
        return $this->listarSegunPublicacion(false);
    }

    public function listarPublicados(): array
    {
        return $this->listarSegunPublicacion(true);
    }

    public function obtenerPorId(int $id, bool $soloPublicado = false): ?array
    {
        $filtroPublicacion = $soloPublicado
            ? 'AND p.publicado = 1'
            : '';

        $sql = "
            SELECT
                p.producto_id,
                p.codigo,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen,
                p.publicado,
                p.categoria_id,
                c.nombre AS categoria,
                p.fecha_creacion
            FROM productos p
            INNER JOIN categorias c
                ON p.categoria_id = c.categoria_id
            WHERE p.producto_id = :id
            {$filtroPublicacion}
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $producto = $stmt->fetch(PDO::FETCH_ASSOC);

        return $producto
            ? $this->normalizarProducto($producto)
            : null;
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
                publicado,
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
                0,
                :categoria_id
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ':codigo' => $datos['codigo'],
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'] ?? null,
            ':precio' => $datos['precio'],
            ':stock' => $datos['stock'],
            ':imagen' => $this->normalizarImagen($datos['imagen'] ?? null),
            ':categoria_id' => $datos['categoria_id']
        ]);
    }

    public function actualizar(int $id, array $datos): bool
    {
        $productoExistente = $this->obtenerPorId($id);

        if ($productoExistente === null) {
            return false;
        }

        $imagen = array_key_exists('imagen', $datos)
            ? $this->normalizarImagen($datos['imagen'])
            : $productoExistente['imagen'];

        $sql = "
            UPDATE productos
            SET
                codigo = :codigo,
                nombre = :nombre,
                descripcion = :descripcion,
                precio = :precio,
                stock = :stock,
                imagen = :imagen,
                categoria_id = :categoria_id
            WHERE producto_id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ':codigo' => $datos['codigo'],
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'] ?? null,
            ':precio' => $datos['precio'],
            ':stock' => $datos['stock'],
            ':imagen' => $imagen,
            ':categoria_id' => $datos['categoria_id'],
            ':id' => $id
        ]);
    }

    public function actualizarPublicado(int $id, int $publicado): bool
    {
        $sql = "
            UPDATE productos
            SET publicado = :publicado
            WHERE producto_id = :id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':publicado', $publicado, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function eliminar(int $id): bool
    {
        $sql = "
            DELETE FROM productos
            WHERE producto_id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        $stmt->execute([
            ':id' => $id
        ]);

        return $stmt->rowCount() > 0;
    }
}
